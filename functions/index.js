// Kenokip Farm — M-Pesa backend (Cloud Functions for Firebase)
//
// This is the only piece that's allowed to hold real Safaricom API
// credentials (as Secret Manager secrets, never in this file or the repo).
// The static app (index.html) never touches them — it only ever calls the
// callable function below, and Safaricom calls the two webhook endpoints.
//
// Flow 1 — owner taps "Add via M-Pesa" in the app:
//   app -> initiateDeposit (this file) -> Safaricom STK Push -> a normal
//   Safaricom "enter M-Pesa PIN" screen appears ON THE PHONE, not in the app
//   -> Safaricom calls mpesaStkCallback with the result -> we write the
//   transaction to Firestore -> the app's existing real-time listener picks
//   it up and the balance updates itself.
//
// Flow 2 — someone else pays the till directly from their own phone:
//   Safaricom calls c2bConfirmation automatically -> we write the
//   transaction -> same real-time update in the app.

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const { stkPush, buildSecurityCredential, b2cSend } = require('./daraja');

admin.initializeApp();
const db = admin.firestore();

// Accounts, roles, Finance approvals, and access logging — see roles.js.
Object.assign(exports, require('./roles')(admin, db));

// Authenticator-app (2FA) enrollment + verification — see security.js.
// verifyTotpForUid is used directly below, inside initiateWithdrawal, not
// just as the callable verifyTotpCode export.
const security = require('./security')(admin, db);
Object.assign(exports, security.triggers);

const MPESA_CONSUMER_KEY = defineSecret('MPESA_CONSUMER_KEY');
const MPESA_CONSUMER_SECRET = defineSecret('MPESA_CONSUMER_SECRET');
const MPESA_SHORTCODE = defineSecret('MPESA_SHORTCODE');
const MPESA_PASSKEY = defineSecret('MPESA_PASSKEY');
const MPESA_ENV = defineSecret('MPESA_ENV'); // "sandbox" or "production"
const MPESA_CALLBACK_BASE_URL = defineSecret('MPESA_CALLBACK_BASE_URL'); // e.g. https://us-central1-kenokip-farm.cloudfunctions.net
const MPESA_ACCOUNT_TYPE = defineSecret('MPESA_ACCOUNT_TYPE'); // "till" (Buy Goods) or "paybill"

// B2C ("send money out") credentials — separate from the collections
// secrets above, and only usable once Safaricom has approved B2C for your
// shortcode specifically. See SETUP-B2C.md before setting these.
const MPESA_INITIATOR_NAME = defineSecret('MPESA_INITIATOR_NAME');
const MPESA_INITIATOR_PASSWORD = defineSecret('MPESA_INITIATOR_PASSWORD');
const MPESA_B2C_CERT = defineSecret('MPESA_B2C_CERT'); // the Safaricom public certificate for your environment, as PEM text

const ALL_SECRETS = [MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV, MPESA_CALLBACK_BASE_URL, MPESA_ACCOUNT_TYPE];
const B2C_SECRETS = ALL_SECRETS.concat([MPESA_INITIATOR_NAME, MPESA_INITIATOR_PASSWORD, MPESA_B2C_CERT]);

// Secrets set via `echo value| firebase functions:secrets:set NAME --data-file -`
// (a common workaround on Windows when the interactive prompt won't accept a
// paste) come through with a trailing newline, since `echo` always appends
// one. That extra whitespace silently breaks things like the Base64 Basic
// Auth header sent to Safaricom, so every secret is trimmed before use.
function sval(secretRef, fallback) {
  const v = (secretRef.value() || '').trim();
  return v || fallback || '';
}

const FINANCE_REF = () => db.collection('finance').doc('kenokip');

function normalizePhone(raw) {
  if (!raw) return null;
  var digits = String(raw).replace(/\D/g, '');
  if (digits.length === 9) digits = '254' + digits;
  else if (digits.length === 10 && digits.charAt(0) === '0') digits = '254' + digits.slice(1);
  else if (digits.length === 12 && digits.indexOf('254') === 0) { /* already fine */ }
  else return null;
  return /^254(7|1)\d{8}$/.test(digits) ? digits : null;
}

// Safaricom timestamps look like 20260828114530 (YYYYMMDDHHmmss).
function isoDateFromMpesaTimestamp(v) {
  var s = String(v || '');
  if (s.length < 8) return null;
  return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
}

// Adds a transaction to the shared Finance doc, skipping it if a
// transaction with the same id was already recorded (Safaricom retries
// webhooks, so this keeps a retried callback from double-counting).
async function addTransactionIfNew(txn) {
  const ref = FINANCE_REF();
  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const data = snap.exists ? snap.data() : { openingBalance: 0, openingDate: new Date().toISOString().slice(0, 10), transactions: [] };
    const existing = Array.isArray(data.transactions) ? data.transactions : [];
    if (existing.some((x) => x.id === txn.id)) return;
    t.set(ref, Object.assign({}, data, { transactions: existing.concat([txn]) }), { merge: true });
  });
}

// Called from the app when the administrator or Financial Staff taps "Add
// via M-Pesa". Sends the real Safaricom STK Push prompt to their own phone —
// the PIN is entered there, on Safaricom's own screen, never in this app.
// This is a deposit (money coming in), so — same as any other deposit —
// it doesn't need the administrator's approval even when Financial Staff
// starts it.
exports.initiateDeposit = onCall({ secrets: ALL_SECRETS, region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  const role = request.auth.token.role;
  const isFinancialStaff = role === 'employee' && request.auth.token.jobTitle === 'financial';
  if (role !== 'administrator' && !isFinancialStaff) {
    throw new HttpsError('permission-denied', 'Only the administrator or financial staff can start M-Pesa deposits.');
  }
  const amount = Number(request.data && request.data.amount);
  const phone = normalizePhone(request.data && request.data.phone);
  if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');

  const callbackUrl = `${sval(MPESA_CALLBACK_BASE_URL)}/mpesaStkCallback`;
  try {
    const result = await stkPush({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_CONSUMER_KEY),
      consumerSecret: sval(MPESA_CONSUMER_SECRET),
      shortcode: sval(MPESA_SHORTCODE),
      passkey: sval(MPESA_PASSKEY),
      accountType: sval(MPESA_ACCOUNT_TYPE, 'till'),
      phone,
      amount,
      callbackUrl,
      accountRef: 'KenokipFarm',
      description: 'Kenokip Farm deposit',
    });
    return {
      ok: true,
      message: 'Check ' + phone + ' now — enter your M-Pesa PIN there to complete the deposit.',
      checkoutRequestId: result.CheckoutRequestID,
    };
  } catch (err) {
    logger.error('STK push failed', err);
    throw new HttpsError('internal', 'Could not reach M-Pesa. Try again in a moment.');
  }
});

// Safaricom calls this once the customer (owner, in this flow) responds to
// the STK Push prompt on their phone, whether they completed it or not.
exports.mpesaStkCallback = onRequest({ secrets: [] }, async (req, res) => {
  try {
    const stk = req.body && req.body.Body && req.body.Body.stkCallback;
    if (!stk) { res.status(200).send('ignored'); return; }
    if (stk.ResultCode === 0) {
      const items = (stk.CallbackMetadata && stk.CallbackMetadata.Item) || [];
      const get = (name) => { const it = items.find((i) => i.Name === name); return it ? it.Value : undefined; };
      const amount = Number(get('Amount') || 0);
      const receipt = get('MpesaReceiptNumber');
      const phone = get('PhoneNumber');
      await addTransactionIfNew({
        id: 'mpesa_' + (receipt || stk.CheckoutRequestID),
        date: isoDateFromMpesaTimestamp(get('TransactionDate')) || new Date().toISOString().slice(0, 10),
        type: 'deposit',
        amount: amount,
        note: 'Received via kenokipfarm (M-Pesa' + (receipt ? ' ' + receipt : '') + (phone ? ', ' + phone : '') + ')',
        source: 'mpesa-stk',
      });
    } else {
      logger.info('STK push not completed: ' + stk.ResultDesc);
    }
  } catch (err) {
    logger.error('mpesaStkCallback error', err);
  }
  // Always 200 — Safaricom retries on anything else, which would just
  // duplicate-process a transaction we already handled or skipped.
  res.status(200).send('ok');
});

// Administrator taps "Send via M-Pesa" — pushes real money OUT to a
// recipient's phone via Safaricom's B2C API. Two things stand between a
// tap and real money moving: (1) role check, right below — the
// administrator only, since sending is the one action in this app that's
// both real and irreversible; and (2) a valid, unused code from their
// authenticator app, checked via verifyTotpForUid before anything is sent
// to Safaricom at all. Nothing is written to the Finance ledger from this
// function directly — that only happens from mpesaB2CResult below, once
// Safaricom actually confirms the payout went through (exactly the same
// pattern as mpesaStkCallback for deposits).
exports.initiateWithdrawal = onCall({ secrets: B2C_SECRETS, region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  if (request.auth.token.role !== 'administrator') {
    throw new HttpsError('permission-denied', 'Only the administrator can send money out.');
  }
  const amount = Number(request.data && request.data.amount);
  const phone = normalizePhone(request.data && request.data.phone);
  const note = String((request.data && request.data.note) || '').slice(0, 100);
  const code = String((request.data && request.data.code) || '');
  if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');

  // Throws (failed-precondition / invalid-argument) on a missing, wrong, or
  // already-used code — nothing below this line runs unless it passes.
  await security.verifyTotpForUid(request.auth.uid, code);

  const certPem = sval(MPESA_B2C_CERT);
  const initiatorName = sval(MPESA_INITIATOR_NAME);
  const initiatorPassword = sval(MPESA_INITIATOR_PASSWORD);
  if (!certPem || !initiatorName || !initiatorPassword) {
    throw new HttpsError('failed-precondition', "B2C isn't set up on this deployment yet — see SETUP-B2C.md.");
  }
  const callbackBase = sval(MPESA_CALLBACK_BASE_URL);
  try {
    const securityCredential = buildSecurityCredential({ initiatorPassword, certPem });
    const result = await b2cSend({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_CONSUMER_KEY),
      consumerSecret: sval(MPESA_CONSUMER_SECRET),
      shortcode: sval(MPESA_SHORTCODE),
      initiatorName,
      securityCredential,
      phone,
      amount,
      remarks: note || 'Kenokip Farm payout',
      resultUrl: `${callbackBase}/mpesaB2CResult`,
      timeoutUrl: `${callbackBase}/mpesaB2CTimeout`,
      commandId: 'BusinessPayment',
    });
    return {
      ok: true,
      message: 'Payout sent to Safaricom — it will show up here once confirmed.',
      conversationId: result.ConversationID,
    };
  } catch (err) {
    logger.error('B2C send failed', err);
    throw new HttpsError('internal', 'Could not send the payout. Check your B2C setup (SETUP-B2C.md) and try again.');
  }
});

// Safaricom calls this once a B2C payout finishes processing, successfully
// or not. Only a genuinely successful result (ResultCode 0) gets logged as
// an approved withdrawal — same principle as deposits: nothing is counted
// until Safaricom itself confirms it.
exports.mpesaB2CResult = onRequest({ secrets: [] }, async (req, res) => {
  try {
    const result = req.body && req.body.Result;
    if (result && result.ResultCode === 0) {
      const items = (result.ResultParameters && result.ResultParameters.ResultParameter) || [];
      const get = (name) => { const it = items.find((i) => i.Key === name); return it ? it.Value : undefined; };
      const amount = Number(get('TransactionAmount') || 0);
      const receipt = get('TransactionReceipt');
      const recipientName = get('ReceiverPartyPublicName');
      await addTransactionIfNew({
        id: 'mpesab2c_' + (receipt || result.ConversationID || Date.now()),
        date: new Date().toISOString().slice(0, 10),
        type: 'withdrawal',
        amount,
        note: 'Sent via kenokipfarm (M-Pesa' + (receipt ? ' ' + receipt : '') + (recipientName ? ', to ' + recipientName : '') + ')',
        source: 'mpesa-b2c',
        status: 'approved',
        reviewedBy: 'mpesa-b2c',
        reviewedAt: new Date().toISOString(),
      });
    } else {
      logger.info('B2C payout not completed: ' + (result && result.ResultDesc));
    }
  } catch (err) {
    logger.error('mpesaB2CResult error', err);
  }
  res.status(200).send('ok');
});

// Safaricom calls this instead of mpesaB2CResult if the request timed out
// before it could even be processed — nothing to log, just acknowledge it.
exports.mpesaB2CTimeout = onRequest({ secrets: [] }, async (req, res) => {
  logger.info('B2C payout timed out', req.body);
  res.status(200).send('ok');
});

// Safaricom asks this before accepting any direct payment into the till —
// return 0 to accept. Add checks here later if you ever want to reject
// something (e.g. cap a single payment amount).
exports.c2bValidation = onRequest({}, async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Safaricom calls this automatically whenever someone pays the till
// directly from their own phone (not through our STK push flow above).
exports.c2bConfirmation = onRequest({}, async (req, res) => {
  try {
    const b = req.body || {};
    const payer = [b.FirstName, b.MiddleName, b.LastName].filter(Boolean).join(' ');
    await addTransactionIfNew({
      id: 'c2b_' + (b.TransID || Date.now()),
      date: isoDateFromMpesaTimestamp(b.TransTime) || new Date().toISOString().slice(0, 10),
      type: 'deposit',
      amount: Number(b.TransAmount || 0),
      note: 'Received from ' + (b.MSISDN || 'a customer') + (payer ? ' (' + payer + ')' : '') + ' — via kenokipfarm',
      source: 'mpesa-c2b',
    });
  } catch (err) {
    logger.error('c2bConfirmation error', err);
  }
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});
