// Thin wrapper around Safaricom's Daraja API (M-Pesa).
// Docs: https://developer.safaricom.co.ke/APIs

const fetch = require('node-fetch');

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

function baseUrl(env) {
  return BASE_URLS[env] || BASE_URLS.sandbox;
}

async function getAccessToken({ consumerKey, consumerSecret, env }) {
  const url = `${baseUrl(env)}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
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

module.exports = { getAccessToken, stkPush, registerC2BUrls, baseUrl };
