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
//
// storeNumber: for a Till that was issued under an "Agent" structure (an
// agent/organization shortcode with one or more Till/Store numbers under
// it — common when a till was set up through a partner rather than
// directly with Safaricom), BusinessShortCode must be the AGENT number
// while PartyB must be the actual STORE number the money should land in —
// sending the agent number for both fails with Safaricom's own error
// "The Agent number and Store number entered do not match." Left blank
// (the ordinary case — a shortcode with no separate agent/store split),
// PartyB just falls back to the same shortcode as before.
async function stkPush({ env, consumerKey, consumerSecret, shortcode, passkey, phone, amount, callbackUrl, accountRef, description, accountType, storeNumber }) {
  shortcode = String(shortcode || '').trim();
  passkey = String(passkey || '').trim();
  const partyB = String(storeNumber || '').trim() || shortcode;
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
    PartyB: partyB,
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
//
// Deliberately the v2 endpoint, not v1: Safaricom's production Daraja apps
// are approved per-product, and current apps get mapped to "C2B v2", not
// the older plain "C2B" (v1) — calling v1 with a v2-only app's token fails
// with the same generic 401.003.01 "Invalid Access Token" error as a
// genuinely bad credential, which is what makes this so easy to misread as
// a credentials problem. The request/response shape is unchanged between
// v1 and v2, only the URL path differs.
// ShortCode here must be the shortcode YOUR OWN app credentials are tied to
// (confirmed directly by Safaricom's API: registering against anything else,
// including a Till/Store number issued under this as an Agent, is rejected
// outright with "Bad Request - Kindly use your own ShortCode" — unlike
// stkPush's PartyB or dynamicQR's cpi, there's no separate "destination"
// field here, so no Agent/Store split is possible for this call at all).
async function registerC2BUrls({ env, consumerKey, consumerSecret, shortcode, confirmationUrl, validationUrl }) {
  shortcode = String(shortcode || '').trim();
  confirmationUrl = String(confirmationUrl || '').trim();
  validationUrl = String(validationUrl || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const res = await fetch(`${baseUrl(env)}/mpesa/c2b/v2/registerurl`, {
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

// A certificate is easy to paste wrong — this fixes the one mistake that's
// actually recoverable (only the base64 body was copied, without its
// -----BEGIN/END CERTIFICATE----- armor, e.g. from an email or portal that
// visually shows just the block "inside" the dashes) by rebuilding proper
// PEM around it. Anything else broken (truncated, actually a binary/DER
// file mangled into text, wrong file entirely) is left alone and surfaces
// as a clear error below rather than being silently "fixed" wrong.
function normalizeCertPem(certPem) {
  let text = String(certPem || '').trim();
  if (!text || /-----BEGIN CERTIFICATE-----/.test(text)) return text;
  const body = text.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(body) && body.length > 100) {
    const wrapped = body.match(/.{1,64}/g).join('\n');
    text = `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`;
  }
  return text;
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
  const normalized = normalizeCertPem(certPem);
  const buffer = Buffer.from(String(initiatorPassword || ''), 'utf8');
  try {
    const encrypted = crypto.publicEncrypt({ key: normalized, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer);
    return encrypted.toString('base64');
  } catch (e) {
    // The generic OpenSSL message here ("error:1E08010C:DECODER
    // routines::unsupported") just means "this isn't a certificate I can
    // read" — could be truncated, a binary .cer file that got mangled into
    // text, or the wrong file. Surfacing that plainly (and the length, safe
    // to log — a certificate isn't secret) saves a trip through Cloud Logs
    // next time this happens.
    throw new Error(`MPESA_B2C_CERT doesn't look like a usable certificate (length ${normalized.length}; ${e.message}). Re-download it fresh from Safaricom/Daraja as a PEM (.pem/.cer text file starting with -----BEGIN CERTIFICATE-----) and set it again — see SETUP-B2C.md.`);
  }
}

// B2C ("Business to Customer"): pushes money OUT of the till/paybill to a
// customer's phone — the reverse of stkPush. Needs Safaricom's B2C API
// specifically enabled for your shortcode (a separate approval from
// ordinary STK/C2B collections), plus an Initiator Name + the encrypted
// SecurityCredential above, which only exist once that's set up.
// PartyA here is "your own" identity for this call (same rule Safaricom
// enforced for registerC2BUrls's ShortCode) — B2C has no separate
// Agent/Store split the way stkPush's PartyB does, so this always uses the
// plain shortcode.
//
// v3 is correct here as of Sept 2026 — Safaricom's current official docs
// (both sandbox and production) list "Make a B2C Payment Request" at
// /mpesa/b2c/v3/paymentrequest, not v1. An earlier "no apiproduct match
// found" failure on v3 turned out to be caused by B2C not being enabled on
// this app at all (confirmed by Safaricom support) — not by v3 being the
// wrong path. If that same error reappears, it's about product
// authorization on the app, not the URL version.
// OriginatorConversationID is still included below even though it's not in
// every older sample request — Safaricom's own collection shows a newer
// example (B2Pochi) sending it on this same URL, so it's cheap insurance:
// a unique ID per request that Safaricom can use to tell retries apart.
async function b2cSend({ env, consumerKey, consumerSecret, shortcode, initiatorName, securityCredential, phone, amount, remarks, occasion, resultUrl, timeoutUrl, commandId, originatorConversationId }) {
  shortcode = String(shortcode || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const body = {
    OriginatorConversationID: originatorConversationId || `KF${Date.now()}${Math.floor(Math.random() * 10000)}`,
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
  const res = await fetch(`${baseUrl(env)}/mpesa/b2c/v3/paymentrequest`, {
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

// Account Balance: asks Safaricom what's currently sitting in the till/
// paybill's own M-Pesa working account. Uses the same Initiator identity +
// encrypted SecurityCredential as B2C (it's an "Initiator API", not a
// customer-facing one) — there's no separate approval needed beyond having
// B2C/Initiator credentials set up already. Like B2C, the answer doesn't
// come back in this response — Safaricom calls resultUrl a few seconds
// later with the actual figures (see mpesaAccountBalanceResult in
// index.js).
async function accountBalanceQuery({ env, consumerKey, consumerSecret, shortcode, initiatorName, securityCredential, remarks, resultUrl, timeoutUrl }) {
  shortcode = String(shortcode || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const body = {
    Initiator: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'AccountBalance',
    PartyA: shortcode,
    IdentifierType: '4', // 4 = organization shortcode
    Remarks: (remarks || 'Kenokip Farm balance check').slice(0, 100),
    QueueTimeOutURL: timeoutUrl,
    ResultURL: resultUrl,
  };
  const res = await fetch(`${baseUrl(env)}/mpesa/accountbalance/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errorCode) {
    throw new Error(`Account balance query failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// Transaction Status: asks Safaricom for the current state of a past
// transaction, identified by its M-Pesa receipt code (e.g. "OEI2AK4Q16") —
// useful when a customer says "I paid but it's not showing" or similar.
// Same Initiator-based async shape as Account Balance/B2C: this call just
// acknowledges the request, the real answer arrives at resultUrl shortly
// after (see mpesaTransactionStatusResult in index.js).
async function transactionStatusQuery({ env, consumerKey, consumerSecret, shortcode, initiatorName, securityCredential, transactionId, remarks, occasion, resultUrl, timeoutUrl }) {
  shortcode = String(shortcode || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const body = {
    Initiator: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'TransactionStatusQuery',
    TransactionID: transactionId,
    PartyA: shortcode,
    IdentifierType: '4',
    ResultURL: resultUrl,
    QueueTimeOutURL: timeoutUrl,
    Remarks: (remarks || 'Kenokip Farm transaction check').slice(0, 100),
    Occasion: (occasion || '').slice(0, 100),
  };
  const res = await fetch(`${baseUrl(env)}/mpesa/transactionstatus/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errorCode) {
    throw new Error(`Transaction status query failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// Dynamic QR: the only one of these three that's a plain synchronous
// request/response, and the only one that doesn't need Initiator/B2C
// credentials at all — just the ordinary Consumer Key/Secret already used
// for STK Push. Safaricom hands back a ready-to-display QR image (as a
// base64 PNG string) that any M-Pesa app can scan to pay this shortcode —
// no webhook, no waiting.
//
// trxCode must match how the shortcode is registered: 'BG' (Buy Goods) for
// a Till, 'PB' (PayBill) for a Paybill.
async function dynamicQR({ env, consumerKey, consumerSecret, merchantName, refNo, amount, trxCode, cpi, size }) {
  cpi = String(cpi || '').trim();
  const token = await getAccessToken({ consumerKey, consumerSecret, env });
  const body = {
    MerchantName: (merchantName || 'Kenokip Farm').slice(0, 100),
    RefNo: (refNo || 'KenokipFarm').slice(0, 100),
    Amount: Math.round(Number(amount) || 0),
    TrxCode: trxCode || 'BG',
    CPI: cpi,
    Size: String(size || '300'),
  };
  const res = await fetch(`${baseUrl(env)}/mpesa/qrcode/v1/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.QRCode) {
    throw new Error(`Dynamic QR generation failed: ${JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { getAccessToken, stkPush, registerC2BUrls, baseUrl, buildSecurityCredential, b2cSend, accountBalanceQuery, transactionStatusQuery, dynamicQR };
