// Thin wrapper around Safaricom's Daraja API (M-Pesa).
// Docs: https://developer.safaricom.co.ke/APIs

const fetch = require('node-fetch');
const crypto = require('crypto');

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

function baseUrl(env) {
  return BASE_URLS[env] || BASE_URLS.sandbox;
}

async function getAccessToken({ consumerKey, consumerSecret, env }) {
  // Trimmed here too, as a last line of defense — a stray trailing
  // newline/space on either value (easy to pick up from a copy/paste, or
  // from `echo` on Windows) silently breaks this Base64 header.
  const key = String(consumerKey || '').trim();
  const secret = String(consumerSecret || '').trim();
  const url = `${baseUrl(env)}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Daraja auth failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function stkPassword({ shortcode, passkey, ts }) {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
}

// STK Push: sends the official Safaricom "enter your M-Pesa PIN" prompt to
// the given phone's own SIM toolkit / M-Pesa app. This app never sees or
// asks for a PIN — Safaricom's own screen on the payer's phone handles it.
//
// accountType must be "till" (Buy Goods) or "paybill" — they use different
// TransactionType values and Safaricom rejects the wrong one for your
// shortcode.
async function stkPush({ env, consumerKey, consumerSecret, shortcode, passkey, phone, amount, callbackUrl, accountRef, description, accountType }) {
  shortcode = String(shortcode || '').trim();
  passkey = String(passkey || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const ts = timestamp();
  const password = stkPassword({ shortcode, passkey, ts });
  const transactionType = accountType === 'paybill' ? 'CustomerPayBillOnline' : 'CustomerBuyGoodsOnline';
  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: transactionType,
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: accountRef || 'KenokipFarm',
    TransactionDesc: description || 'Kenokip Farm deposit',
  };
  const res = await fetch(`${baseUrl(env)}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errorCode) {
    throw new Error(`STK push failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// One-off admin call: tells Safaricom which URLs to hit whenever anyone pays
// the till directly (not via our own STK push). Run this once per
// environment (sandbox once, production once) after deploying, via
// `npm run register-c2b`.
async function registerC2BUrls({ env, consumerKey, consumerSecret, shortcode, confirmationUrl, validationUrl }) {
  shortcode = String(shortcode || '').trim();
  confirmationUrl = String(confirmationUrl || '').trim();
  validationUrl = String(validationUrl || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const res = await fetch(`${baseUrl(env)}/mpesa/c2b/v1/registerurl`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ShortCode: shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`C2B URL registration failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// B2C's "SecurityCredential" is your initiator password, RSA-encrypted
// with Safaricom's own public certificate so only Safaricom can decrypt
// it. Which certificate is "right" depends on environment — sandbox and
// production each have their own — see SETUP-B2C.md for where to get each
// one; it's supplied here as the MPESA_B2C_CERT secret rather than
// hardcoded, since getting a security certificate wrong from memory would
// fail silently and this project has no offline way to verify one against
// Safaricom's actual key.
function buildSecurityCredential({ initiatorPassword, certPem }) {
  const buffer = Buffer.from(String(initiatorPassword || ''), 'utf8');
  const encrypted = crypto.publicEncrypt({ key: certPem, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer);
  return encrypted.toString('base64');
}

// B2C ("Business to Customer"): pushes money OUT of the till/paybill to a
// customer's phone — the reverse of stkPush. Needs Safaricom's B2C API
// specifically enabled for your shortcode (a separate approval from
// ordinary STK/C2B collections), plus an Initiator Name + the encrypted
// SecurityCredential above, which only exist once that's set up.
async function b2cSend({ env, consumerKey, consumerSecret, shortcode, initiatorName, securityCredential, phone, amount, remarks, occasion, resultUrl, timeoutUrl, commandId }) {
  shortcode = String(shortcode || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const body = {
    InitiatorName: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: commandId || 'BusinessPayment',
    Amount: Math.round(amount),
    PartyA: shortcode,
    PartyB: phone,
    Remarks: (remarks || 'Kenokip Farm payout').slice(0, 100),
    QueueTimeOutURL: timeoutUrl,
    ResultURL: resultUrl,
    Occasion: (occasion || '').slice(0, 100),
  };
  const res = await fetch(`${baseUrl(env)}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errorCode) {
    throw new Error(`B2C send failed: ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { getAccessToken, stkPush, registerC2BUrls, baseUrl, buildSecurityCredential, b2cSend };
