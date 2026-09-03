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
const { stkPush } = require('./daraja');

admin.initializeApp();
const db = admin.firestore();

// Accounts, roles, Finance approvals, and access logging — see roles.js.
Object.assign(exports, require('./roles')(admin, db));

const MPESA_CONSUMER_KEY = defineSecret('MPESA_CONSUMER_KEY');
const MPESA_CONSUMER_SECRET = defineSecret('MPESA_CONSUMER_SECRET');
const MPESA_SHORTCODE = defineSecret('MPESA_SHORTCODE');
const MPESA_PASSKEY = defineSecret('MPESA_PASSKEY');
const MPESA_ENV = defineSecret('MPESA_ENV'); // "sandbox" or "production"
const MPESA_CALLBACK_BASE_URL = defineSecret('MPESA_CALLBACK_BASE_URL'); // e.g. https://us-central1-kenokip-farm.cloudfunctions.net
const MPESA_ACCOUNT_TYPE = defineSecret('MPESA_ACCOUNT_TYPE'); // "till" (Buy Goods) or "paybill"

const ALL_SECRETS = [MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV, MPESA_CALLBACK_BASE_URL, MPESA_ACCOUNT_TYPE];

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
