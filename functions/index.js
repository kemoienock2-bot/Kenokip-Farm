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
const { stkPush, buildSecurityCredential, b2cSend, accountBalanceQuery, transactionStatusQuery, dynamicQR } = require('./daraja');
const { timingSafeStringEqual } = require('./cryptoHelpers');

admin.initializeApp();
const db = admin.firestore();

// Accounts, roles, Finance approvals, and access logging — see roles.js.
Object.assign(exports, require('./roles')(admin, db));

// Lockout + alerting for repeated failed Finance portal attempts, plus
// fingerprint/Face + PIN unlock — see financeGuard.js. Built before
// security.js so its lockout helpers can be wired into the existing
// password + authenticator-code unlock too (one shared 3-strikes rule,
// whichever method someone gets wrong).
const financeGuard = require('./financeGuard')(admin, db);
Object.assign(exports, financeGuard.triggers);

// Authenticator-app (2FA) enrollment + verification — see security.js.
// verifyTotpForUid is used directly below, inside initiateWithdrawal, not
// just as the callable verifyTotpCode export.
const security = require('./security')(admin, db, financeGuard.helpers);
Object.assign(exports, security.triggers);

// Receipt signing + verification — see receipts.js and SETUP-RECEIPTS.md.
const RECEIPT_SIGNING_SECRET = defineSecret('RECEIPT_SIGNING_SECRET');
const receipts = require('./receipts')(admin, db, RECEIPT_SIGNING_SECRET);
Object.assign(exports, receipts.triggers);

// Weekly digest push (eggs/income/expenses totals) — see digest.js.
Object.assign(exports, require('./digest')(admin, db));

// Dates of birth — dedicated Birthday PIN, self/administrator-set DOBs kept
// out of the broadly-readable users/{uid} doc, and the daily birthday
// reminder — see privacyGuard.js.
Object.assign(exports, require('./privacyGuard')(admin, db).triggers);

// Team recognition ("Kudos") — congratulations + an optional reward note,
// to one team member or everyone at once — see kudos.js.
Object.assign(exports, require('./kudos')(admin, db).triggers);

const MPESA_CONSUMER_KEY = defineSecret('MPESA_CONSUMER_KEY');
const MPESA_CONSUMER_SECRET = defineSecret('MPESA_CONSUMER_SECRET');
const MPESA_SHORTCODE = defineSecret('MPESA_SHORTCODE');
const MPESA_PASSKEY = defineSecret('MPESA_PASSKEY');
const MPESA_ENV = defineSecret('MPESA_ENV'); // "sandbox" or "production"
const MPESA_CALLBACK_BASE_URL = defineSecret('MPESA_CALLBACK_BASE_URL'); // e.g. https://us-central1-kenokip-farm.cloudfunctions.net
const MPESA_ACCOUNT_TYPE = defineSecret('MPESA_ACCOUNT_TYPE'); // "till" (Buy Goods) or "paybill"
// Only needed for a Till that was issued under an "Agent" structure — an
// agent/organization shortcode (MPESA_SHORTCODE) with one or more actual
// Till/Store numbers registered under it. In that setup, MPESA_SHORTCODE
// is the "Agent number" Safaricom authenticates API calls against, while
// this is the "Store number" the money should actually land in and the
// one customers see when they pay. Leave unset for an ordinary Till/
// Paybill with no separate agent/store split — everything just uses
// MPESA_SHORTCODE for both, as before.
const MPESA_STORE_NUMBER = defineSecret('MPESA_STORE_NUMBER');
// A shared secret embedded as `?key=...` in every M-Pesa webhook URL below,
// so a stranger who finds or guesses this Cloud Function's public URL
// (project IDs aren't secret — this one's visible in the app's own Firebase
// config) can't feed it a fake "payment received" and pollute Finance/
// Income. See SETUP-SECURITY.md for the one-time setup this needs — until
// it's set, every check below is skipped so nothing breaks on a fresh
// install or before you've gotten to that step.
const MPESA_WEBHOOK_SECRET = defineSecret('MPESA_WEBHOOK_SECRET');

// B2C ("send money out") credentials — separate from the collections
// secrets above, and only usable once Safaricom has approved B2C for your
// shortcode specifically. See SETUP-B2C.md before setting these.
const MPESA_INITIATOR_NAME = defineSecret('MPESA_INITIATOR_NAME');
const MPESA_INITIATOR_PASSWORD = defineSecret('MPESA_INITIATOR_PASSWORD');
const MPESA_B2C_CERT = defineSecret('MPESA_B2C_CERT'); // the Safaricom public certificate for your environment, as PEM text
// An alternative to MPESA_B2C_CERT + MPESA_INITIATOR_PASSWORD: some Org
// Portal accounts expose a "Generate Security Credential Value" tool that
// does the certificate encryption step for you and hands back the already-
// encrypted result. Since RSA encryption of the same password comes out
// different (but equally valid) every time, a single value generated this
// way keeps working indefinitely — it only needs regenerating (via that
// same portal tool) if the operator's password is ever changed. When this
// is set, it's used as-is and MPESA_B2C_CERT isn't needed at all.
const MPESA_SECURITY_CREDENTIAL = defineSecret('MPESA_SECURITY_CREDENTIAL');

// Payout account — separate from everything above. Kenokip Farm receives
// deposits on a Till (MPESA_SHORTCODE/MPESA_CONSUMER_KEY/SECRET above) but
// sends money out from a different account, Paybill 1307475. Safaricom ties
// a Daraja app's Consumer Key/Secret, and an Initiator's B2C rights, to one
// specific shortcode each — there's no way to authenticate a payout against
// a shortcode your credentials aren't actually issued for (same "Bad
// Request - Kindly use your own ShortCode" rule daraja.js already notes for
// C2B registration). So collecting on one shortcode and paying out from
// another needs a second, fully independent credential set, not just a
// second value for MPESA_SHORTCODE.
// MPESA_INITIATOR_NAME / MPESA_INITIATOR_PASSWORD / MPESA_B2C_CERT /
// MPESA_SECURITY_CREDENTIAL above are the Paybill's Initiator identity —
// created via the Paybill's own Org Portal, not the Till's.
const MPESA_PAYOUT_CONSUMER_KEY = defineSecret('MPESA_PAYOUT_CONSUMER_KEY');
const MPESA_PAYOUT_CONSUMER_SECRET = defineSecret('MPESA_PAYOUT_CONSUMER_SECRET');
const MPESA_PAYOUT_SHORTCODE = defineSecret('MPESA_PAYOUT_SHORTCODE'); // Kenokip Farm's Paybill: 1307475
// Only needed if the Paybill ALSO sends its own STK Push prompts (see
// initiateDeposit's `account` branch below) — a completely separate
// passkey from MPESA_PASSKEY (the Till's), since STK's password is built
// from shortcode+passkey+timestamp and Safaricom issues one passkey per
// shortcode/app, same as everything else here. Not needed at all for B2C/
// Balance/Status — those don't use a passkey.
const MPESA_PAYOUT_PASSKEY = defineSecret('MPESA_PAYOUT_PASSKEY');

const ALL_SECRETS = [MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV, MPESA_CALLBACK_BASE_URL, MPESA_ACCOUNT_TYPE, MPESA_WEBHOOK_SECRET, MPESA_STORE_NUMBER];
const B2C_SECRETS = ALL_SECRETS.concat([MPESA_INITIATOR_NAME, MPESA_INITIATOR_PASSWORD, MPESA_B2C_CERT, MPESA_SECURITY_CREDENTIAL, MPESA_PAYOUT_CONSUMER_KEY, MPESA_PAYOUT_CONSUMER_SECRET, MPESA_PAYOUT_SHORTCODE]);
// initiateDeposit can send its STK Push from either account (see the
// `account` field it reads below), so it needs both credential sets —
// unlike B2C_SECRETS it does NOT need the Initiator/B2C secrets, since
// collecting via STK never touches B2C at all.
const DEPOSIT_SECRETS = ALL_SECRETS.concat([MPESA_PAYOUT_CONSUMER_KEY, MPESA_PAYOUT_CONSUMER_SECRET, MPESA_PAYOUT_SHORTCODE, MPESA_PAYOUT_PASSKEY]);

// Kill-switch for the "Send via M-Pesa" payout feature (initiateWithdrawal
// below). Leave this false until Safaricom has actually enabled B2C API
// access on the Paybill (1307475) specifically — a business approval on top
// of just having the Paybill number itself (see SETUP-B2C.md) — AND you've
// confirmed the Paybill actually has enough of its own balance to pay out
// from. Note that money landing in the Till does NOT automatically become
// available in the Paybill — they're separate M-Pesa accounts unless
// Safaricom's back office has specifically linked the Till to the Paybill
// as an Agent/Store relationship (ask Safaricom or check the Org Portal if
// you're not sure); otherwise the farm needs its own process for moving
// float from the Till into the Paybill before payouts can draw on it. Flip
// this to true once B2C is confirmed working end-to-end for the Paybill —
// no redeploy of anything else needed, just this one flag plus
// `firebase deploy --only functions`.
const PAYOUTS_ENABLED = false;

// A pre-generated SecurityCredential is a long base64 blob (a few hundred
// characters) — same threshold used for the certificate check, so a leftover
// placeholder like "not-set-yet" is never mistaken for a real value.
function looksConfigured(value) {
  return String(value || '').trim().length >= 100;
}

// Resolves the SecurityCredential to send Safaricom: prefer a pre-generated
// value (MPESA_SECURITY_CREDENTIAL) when one's actually set, otherwise fall
// back to computing it from the certificate + password as before.
function resolveSecurityCredential({ precomputed, initiatorPassword, certPem }) {
  if (looksConfigured(precomputed)) return String(precomputed).trim();
  return buildSecurityCredential({ initiatorPassword, certPem });
}

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
const FARM_REF = () => db.collection('farms').doc('kenokip');
const MPESA_QUERIES_REF = () => db.collection('mpesaQueries');

// Same egg price the app itself uses (see EGG_UNIT_VALUE_KSH in index.html)
// — kept as its own constant here rather than shared code because this
// backend and the static app are deployed completely separately. If you
// ever change the app's price per egg, change this to match.
const EGG_UNIT_VALUE_KSH = 15;

// Safaricom's async webhook can — and in production, does — reach us before
// this function's own "mark this pending" write finishes (confirmed: Check
// Balance requests were getting stuck forever showing "Checking..." because
// mpesaAccountBalanceResult was landing within ~2 seconds, and the plain
// .set() that used to run here replaces the ENTIRE document, silently
// erasing the real result the webhook had just written moments earlier).
// Wrapping this in a transaction closes that race: if a final status
// (done/failed) is already sitting there by the time we get here, we leave
// it alone instead of stomping it back to "pending".
async function markQueryPending(conversationId, data) {
  const ref = MPESA_QUERIES_REF().doc(conversationId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : null;
    if (existing && (existing.status === 'done' || existing.status === 'failed')) {
      return; // the real result already arrived — don't overwrite it
    }
    tx.set(ref, { status: 'pending', ...data }, { merge: true });
  });
}

// Account Balance and Transaction Status are read-only lookups (they never
// move money), so — unlike initiateWithdrawal — they don't need a TOTP
// code, and are gated the same as "can see Finance at all" for the two
// admin-level roles: administrator or co-administrator. (Financial Staff
// can already see Finance's running balance and every transaction in the
// app itself, so these two are about reconciling against Safaricom's own
// records specifically, not a new kind of access.)
function requireAdminLevelRole(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const role = request.auth.token.role;
  if (role !== 'administrator' && role !== 'coadmin') {
    throw new HttpsError('permission-denied', 'Only the administrator or co-administrator can do this.');
  }
  return request.auth;
}

// Where the webhook key actually came from on THIS request. Checked in two
// places, in order:
//   1. The query string (?key=...) — how the STK/B2C callback URLs work,
//      and how C2B originally worked here too. Confirmed reliable for
//      STK/B2C, because those callback URLs are handed to Safaricom fresh
//      inside each individual API call and echoed straight back.
//   2. A trailing URL PATH segment (.../c2bConfirmation/<key>) — added
//      because Safaricom's C2B URL *registration* (a one-time, stored
//      setting per shortcode, unlike STK/B2C's per-request callback URL) is
//      widely reported to silently drop query strings from the
//      Confirmation/ValidationURL it stores, while it can't drop part of
//      the path — that's the address itself. If C2B keeps getting rejected
//      even right after confirming the secret matches on both ends, this is
//      almost always why: the ?key=... Safaricom was GIVEN during
//      registration never actually comes back on the real webhook call.
//      registerC2BUrls.js registers using this path form for exactly that
//      reason (see its own comments).
// Skips the bare function name itself ("c2bConfirmation" with nothing
// appended) so a URL with no key at all doesn't accidentally "match" its
// own route name.
function extractProvidedKeyInfo(req) {
  if (req.query && req.query.key) {
    return { value: String(req.query.key), source: 'query' };
  }
  var pathOnly = String(req.path || (req.originalUrl || '').split('?')[0] || '');
  var segments = pathOnly.split('/').filter(Boolean);
  if (segments.length) {
    var last = segments[segments.length - 1];
    if (!/^c2b(Validation|Confirmation)$/i.test(last)) {
      try { return { value: decodeURIComponent(last), source: 'path' }; } catch (e) { return { value: last, source: 'path' }; }
    }
  }
  return { value: '', source: 'none' };
}

// See the MPESA_WEBHOOK_SECRET comment above. Pure check, no side effects —
// split out from checkWebhookSecret() so the C2B logger below can record
// whether a call was accepted or rejected before a response is sent.
function webhookKeyMatches(req) {
  const configured = sval(MPESA_WEBHOOK_SECRET);
  if (!configured) return true; // not set up yet on this deployment — don't break anything
  const provided = extractProvidedKeyInfo(req).value;
  return timingSafeStringEqual(provided, configured);
}

// Returns true (and lets the caller continue) when the request is allowed
// through; returns false (and has already sent a 403) when it wasn't —
// every onRequest handler below starts with
// `if (!checkWebhookSecret(req, res)) return;`.
function checkWebhookSecret(req, res) {
  if (webhookKeyMatches(req)) return true;
  logger.warn('Webhook called with a missing/incorrect key', { path: req.path });
  res.status(403).send('forbidden');
  return false;
}

// Diagnostic trail for the Till (C2B) webhooks specifically — these are the
// ones Safaricom calls automatically and registers only once (see the
// comment above c2bValidation/c2bConfirmation), so when they silently stop
// arriving there's normally no way to tell from inside the app at all. Every
// call — accepted or rejected — gets one row here, so the admin can open the
// Team page after a real till payment and see whether Safaricom even
// reached us, and if so what we did with it. Never throws: a logging
// failure must never break the actual webhook response Safaricom needs.
// Firebase's own JSON body-parsing (what fills in req.body) is applied by
// the Functions Framework for the function's own exact path — the extra
// path segment C2B's key now lives in (see extractProvidedKeyInfo above)
// bypasses it, so req.body can come back empty on a real Safaricom call
// even though the key on that same request is read and matched just fine
// (req.path isn't affected the same way). req.rawBody, though, is captured
// by Firebase at the raw HTTP layer before any of that routing/parsing
// happens, so it's always present regardless — this falls back to parsing
// it ourselves whenever req.body didn't come through, which is what
// actually fixed a real till payment logging as "Accepted" with no amount.
function resolveC2BBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
    return { body: req.body, bodySource: 'req.body', rawBodyBytes: req.rawBody ? req.rawBody.length : null };
  }
  if (req.rawBody && req.rawBody.length) {
    try {
      return { body: JSON.parse(req.rawBody.toString('utf8')), bodySource: 'rawBody-fallback', rawBodyBytes: req.rawBody.length };
    } catch (e) { /* not JSON — fall through */ }
  }
  return { body: req.body || {}, bodySource: 'empty', rawBodyBytes: req.rawBody ? req.rawBody.length : null };
}

async function logC2BCall(endpoint, req, accepted, extra) {
  try {
    const resolved = resolveC2BBody(req);
    const b = resolved.body;
    const keyInfo = extractProvidedKeyInfo(req);
    await db.collection('c2bLog').add(Object.assign({
      at: admin.firestore.FieldValue.serverTimestamp(),
      endpoint: endpoint,
      accepted: !!accepted,
      // Where the key came from on this call (or 'none' if neither the
      // query string nor the path carried one at all) — the single most
      // useful thing here when a call is Rejected: 'none' means Safaricom
      // dropped it entirely (a registration/URL-format problem), while
      // 'query' or 'path' with still-Rejected means a real value arrived
      // but didn't match MPESA_WEBHOOK_SECRET (a secret-mismatch problem).
      keySource: keyInfo.source,
      // How the payload below was obtained — 'req.body' (Firebase's own
      // parsing worked normally), 'rawBody-fallback' (Firebase's own
      // parsing came back empty, so this was parsed from req.rawBody
      // instead — see resolveC2BBody), or 'empty' (neither had anything,
      // a genuinely bodyless call). Tells apart "our fallback saved this
      // call" from "there was truly nothing to read".
      bodySource: resolved.bodySource,
      rawBodyBytes: resolved.rawBodyBytes,
      transId: b.TransID || null,
      amount: b.TransAmount != null ? Number(b.TransAmount) : null,
      msisdn: b.MSISDN || null,
      payer: [b.FirstName, b.MiddleName, b.LastName].filter(Boolean).join(' ') || null,
      shortCode: b.BusinessShortCode || null,
      rawBody: b,
    }, extra || {}));
  } catch (err) {
    logger.error('logC2BCall failed', err);
  }
}

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
//
// A deposit (real money actually received — via STK push or straight to
// the Till) is mirrored into the farm's Income list in the same
// transaction, under a fixed id ("inc_fin_<txnId>"), so a till payment
// shows up as Income automatically — same rule as a manually-entered
// Finance deposit (see proposeFinanceEntry in roles.js). Withdrawals/B2C
// payouts are never mirrored — only the income direction was asked for.
async function addTransactionIfNew(txn) {
  const ref = FINANCE_REF();
  const farmRef = FARM_REF();
  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const data = snap.exists ? snap.data() : { openingBalance: 0, openingDate: new Date().toISOString().slice(0, 10), transactions: [] };
    const existing = Array.isArray(data.transactions) ? data.transactions : [];
    if (existing.some((x) => x.id === txn.id)) return;

    const farmSnap = txn.type === 'deposit' ? await t.get(farmRef) : null;

    if (farmSnap && farmSnap.exists) {
      const farmData = farmSnap.data();
      const incomes = Array.isArray(farmData.incomes) ? farmData.incomes.slice() : [];
      const incomeId = 'inc_fin_' + txn.id;
      if (!incomes.some((x) => x.id === incomeId)) {
        incomes.push({ id: incomeId, date: txn.date, category: txn.category || 'M-Pesa / Bank', amount: txn.amount, note: txn.note || 'Received into Finance', linkedFinanceId: txn.id });
        t.set(farmRef, Object.assign({}, farmData, { incomes }), { merge: true });
      }
    }

    t.set(ref, Object.assign({}, data, { transactions: existing.concat([txn]) }), { merge: true });
  });
}

// Called from the app when the administrator or Financial Staff taps "Add
// via M-Pesa". Sends the real Safaricom STK Push prompt to their own phone —
// the PIN is entered there, on Safaricom's own screen, never in this app.
// This is a deposit (money coming in), so — same as any other deposit —
// it doesn't need the administrator's approval even when Financial Staff
// starts it.
//
// `account` picks which of the two shortcodes gets paid: 'till' (default —
// the ordinary collections account) or 'paybill' (Paybill 1307475). These
// are two separate real M-Pesa balances — see the note on PAYOUTS_ENABLED
// above — so money sent to one is NOT automatically available from the
// other. The callback URL carries the choice through as `?acct=...` so
// mpesaStkCallback below can label the resulting Finance entry correctly.
exports.initiateDeposit = onCall({ secrets: DEPOSIT_SECRETS, region: 'us-central1' }, async (request) => {
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
  const account = (request.data && request.data.account === 'paybill') ? 'paybill' : 'till';
  if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');

  const webhookKey = sval(MPESA_WEBHOOK_SECRET);
  const callbackUrl = `${sval(MPESA_CALLBACK_BASE_URL)}/mpesaStkCallback?acct=${account}` + (webhookKey ? `&key=${encodeURIComponent(webhookKey)}` : '');
  const stkParams = account === 'paybill' ? {
    env: sval(MPESA_ENV, 'sandbox'),
    consumerKey: sval(MPESA_PAYOUT_CONSUMER_KEY),
    consumerSecret: sval(MPESA_PAYOUT_CONSUMER_SECRET),
    shortcode: sval(MPESA_PAYOUT_SHORTCODE),
    passkey: sval(MPESA_PAYOUT_PASSKEY),
    accountType: 'paybill',
    phone,
    amount,
    callbackUrl,
    accountRef: 'KenokipFarm',
    description: 'Kenokip Farm deposit',
  } : {
    env: sval(MPESA_ENV, 'sandbox'),
    consumerKey: sval(MPESA_CONSUMER_KEY),
    consumerSecret: sval(MPESA_CONSUMER_SECRET),
    shortcode: sval(MPESA_SHORTCODE),
    storeNumber: sval(MPESA_STORE_NUMBER),
    passkey: sval(MPESA_PASSKEY),
    accountType: sval(MPESA_ACCOUNT_TYPE, 'till'),
    phone,
    amount,
    callbackUrl,
    accountRef: 'KenokipFarm',
    description: 'Kenokip Farm deposit',
  };
  try {
    const result = await stkPush(stkParams);
    return {
      ok: true,
      message: 'Check ' + phone + ' now — enter your M-Pesa PIN there to complete the deposit.',
      checkoutRequestId: result.CheckoutRequestID,
    };
  } catch (err) {
    logger.error('STK push failed', err, { account });
    throw new HttpsError('internal', 'Could not reach M-Pesa. Try again in a moment.');
  }
});

// Safaricom calls this once the customer (owner, in this flow) responds to
// the STK Push prompt on their phone, whether they completed it or not.
exports.mpesaStkCallback = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  try {
    const stk = req.body && req.body.Body && req.body.Body.stkCallback;
    if (!stk) { res.status(200).send('ignored'); return; }
    // Which shortcode this particular push went out on — carried through
    // from initiateDeposit's `?acct=...` query param so a Paybill deposit
    // is never mistaken for Till income in Finance (they're separate real
    // M-Pesa balances). Missing/unrecognized defaults to 'till', matching
    // every deposit sent before this parameter existed.
    const acct = (req.query && req.query.acct === 'paybill') ? 'paybill' : 'till';
    if (stk.ResultCode === 0) {
      const items = (stk.CallbackMetadata && stk.CallbackMetadata.Item) || [];
      const get = (name) => { const it = items.find((i) => i.Name === name); return it ? it.Value : undefined; };
      const amount = Number(get('Amount') || 0);
      const receipt = get('MpesaReceiptNumber');
      const phone = get('PhoneNumber');

      // Installation-order payments (order.html's "Pay now", handled by
      // payOrderFee above) land on this exact same webhook — Safaricom has
      // no idea it's a different kind of payment, it's still just a Till
      // STK Push. The only way to tell them apart is the CheckoutRequestID:
      // payOrderFee records one in pendingOrderPayments before returning,
      // so check that FIRST. A match means this is YOUR business revenue
      // for an app installation, never a farm's own deposit — handle it
      // completely separately and return, so it's never written to any
      // farm's `finance` collection below.
      const pendingOrderSnap = await PENDING_ORDER_PAYMENTS_REF().doc(stk.CheckoutRequestID).get();
      if (pendingOrderSnap.exists) {
        const pending = pendingOrderSnap.data() || {};
        const orderId = pending.orderId;
        try {
          if (orderId) {
            const orderRef = ORDERS_REF().doc(orderId);
            await db.runTransaction(async (tx) => {
              const orderSnap = await tx.get(orderRef);
              if (!orderSnap.exists) return;
              const o = orderSnap.data() || {};
              const amountPaid = (Number(o.amountPaid) || 0) + (amount || Number(pending.amount) || 0);
              const feeTotal = Number(o.feeTotal) || 0;
              const feeDeposit = Number(o.feeDeposit) || 0;
              const update = { amountPaid };
              if (feeTotal > 0 && amountPaid >= feeTotal) {
                update.status = 'paid_in_full';
                if (!o.licenseKey) update.licenseKey = randomLicenseKey();
              } else if (feeDeposit > 0 && amountPaid >= feeDeposit) {
                update.status = 'deposit_paid';
              }
              tx.set(orderRef, update, { merge: true });
            });
          } else {
            logger.error('Pending order payment had no orderId', { checkoutRequestId: stk.CheckoutRequestID });
          }
        } catch (err) {
          logger.error('Failed to apply installation-order payment', err, { orderId });
        }
        // Done either way — delete the pending marker so it's never
        // reprocessed, and never fall through to the farm-deposit logic
        // below for this callback.
        await pendingOrderSnap.ref.delete().catch(() => {});
        res.status(200).send('ok');
        return;
      }

      await addTransactionIfNew({
        id: 'mpesa_' + (receipt || stk.CheckoutRequestID),
        date: isoDateFromMpesaTimestamp(get('TransactionDate')) || new Date().toISOString().slice(0, 10),
        type: 'deposit',
        amount: amount,
        note: 'Received via kenokipfarm' + (acct === 'paybill' ? ' Paybill' : '') + ' (M-Pesa' + (receipt ? ' ' + receipt : '') + (phone ? ', ' + phone : '') + ')',
        source: acct === 'paybill' ? 'mpesa-stk-paybill' : 'mpesa-stk',
      });
    } else {
      logger.info('STK push not completed: ' + stk.ResultDesc, { account: acct });
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
// both real and irreversible; and (2) the administrator's personal Finance
// PIN, or a fingerprint/Face check, confirmed via financeGuard's shared
// verifyFinancePin/verifyFingerprintAssertion helpers before anything is
// sent to Safaricom at all. (The old main-authenticator-code requirement
// moved to being the "opening" method only — see security.js's
// unlockFinancePortal / the Finance portal password+code gate — per the
// administrator's own request; PIN/fingerprint alone is what confirms an
// actual payout now.) A wrong PIN or fingerprint here counts toward the
// same shared 3-strikes lockout as every other Finance security check, and
// alerts the administrator the same way. Nothing is written to the Finance
// ledger from this function directly — that only happens from
// mpesaB2CResult below, once Safaricom actually confirms the payout went
// through (exactly the same pattern as mpesaStkCallback for deposits).
exports.initiateWithdrawal = onCall({ secrets: B2C_SECRETS, region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  if (request.auth.token.role !== 'administrator') {
    throw new HttpsError('permission-denied', 'Only the administrator can send money out.');
  }
  if (!PAYOUTS_ENABLED) {
    throw new HttpsError('failed-precondition', "Payouts aren't available on this M-Pesa account yet.");
  }
  await financeGuard.helpers.assertNotLocked();
  const amount = Number(request.data && request.data.amount);
  const phone = normalizePhone(request.data && request.data.phone);
  const note = String((request.data && request.data.note) || '').slice(0, 100);
  const pin = request.data && request.data.pin != null ? String(request.data.pin) : null;
  const fingerprintResponse = request.data && request.data.fingerprintResponse;
  if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');
  if (!pin && !fingerprintResponse) throw new HttpsError('invalid-argument', 'Enter your Finance PIN, or use fingerprint/Face.');

  // Throws (failed-precondition / invalid-argument) on a wrong PIN or a
  // fingerprint/Face check that doesn't match — nothing below this line
  // runs, and the shared lockout streak advances, unless it passes.
  try {
    if (pin) {
      await financeGuard.helpers.verifyFinancePin(request.auth.uid, pin);
    } else {
      await financeGuard.helpers.verifyFingerprintAssertion(request.auth.uid, fingerprintResponse);
    }
  } catch (err) {
    await financeGuard.helpers.onFail(request, pin ? 'payout-pin' : 'payout-fingerprint', (err && err.message) || 'unknown');
    throw err;
  }
  await financeGuard.helpers.onSuccess(request, pin ? 'payout-pin' : 'payout-fingerprint');

  const certPem = sval(MPESA_B2C_CERT);
  const precomputedCred = sval(MPESA_SECURITY_CREDENTIAL);
  const initiatorName = sval(MPESA_INITIATOR_NAME);
  const initiatorPassword = sval(MPESA_INITIATOR_PASSWORD);
  const haveCredentialSource = looksConfigured(precomputedCred) || (certPem && initiatorPassword);
  if (!initiatorName || !haveCredentialSource) {
    throw new HttpsError('failed-precondition', "B2C isn't set up on this deployment yet — see SETUP-B2C.md.");
  }
  const callbackBase = sval(MPESA_CALLBACK_BASE_URL);
  const webhookKey = sval(MPESA_WEBHOOK_SECRET);
  const webhookQs = webhookKey ? `?key=${encodeURIComponent(webhookKey)}` : '';
  try {
    const securityCredential = resolveSecurityCredential({ precomputed: precomputedCred, initiatorPassword, certPem });
    const result = await b2cSend({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_PAYOUT_CONSUMER_KEY),
      consumerSecret: sval(MPESA_PAYOUT_CONSUMER_SECRET),
      shortcode: sval(MPESA_PAYOUT_SHORTCODE),
      initiatorName,
      securityCredential,
      phone,
      amount,
      remarks: note || 'Kenokip Farm payout',
      resultUrl: `${callbackBase}/mpesaB2CResult${webhookQs}`,
      timeoutUrl: `${callbackBase}/mpesaB2CTimeout${webhookQs}`,
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
exports.mpesaB2CResult = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
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
exports.mpesaB2CTimeout = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  logger.info('B2C payout timed out', req.body);
  res.status(200).send('ok');
});

// Safaricom asks this before accepting any direct payment into the till —
// return 0 to accept. Add checks here later if you ever want to reject
// something (e.g. cap a single payment amount).
//
// These two C2B URLs (this one and c2bConfirmation below) are registered
// with Safaricom once, up front — via `npm run register-c2b`, not built
// fresh on every request the way the STK/B2C ones above are — so the
// `?key=...` here only takes effect once you've re-run that registration
// script after setting MPESA_WEBHOOK_SECRET. See SETUP-SECURITY.md.
exports.c2bValidation = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  const ok = webhookKeyMatches(req);
  await logC2BCall('c2bValidation', req, ok);
  if (!ok) {
    logger.warn('Webhook called with a missing/incorrect key', { path: req.path });
    res.status(403).send('forbidden');
    return;
  }
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Which real account a C2B call landed on. Safaricom includes the actual
// receiving shortcode as BusinessShortCode on every C2B Validation/
// Confirmation call, so — unlike STK Push's callback, which carries no
// shortcode at all and needed the `?acct=...` query-param workaround in
// mpesaStkCallback above — C2B can tell Till and Paybill apart directly
// from the payload itself. Anything that doesn't match the Paybill's
// registered shortcode defaults to 'till', matching every C2B payment ever
// received before the Paybill could receive them at all.
function classifyC2BShortcode(businessShortCode) {
  const code = String(businessShortCode || '').trim();
  const payoutCode = sval(MPESA_PAYOUT_SHORTCODE);
  if (code && payoutCode && code === payoutCode) return 'paybill';
  return 'till';
}

// Safaricom calls this automatically whenever someone pays the Till or
// Paybill directly from their own phone (not through our STK push flow
// above) — assuming both have had their C2B URLs registered via
// `npm run register-c2b` / `npm run register-c2b-paybill` (see
// SETUP-MPESA.md). For the Till, we default every payment to an egg sale,
// since that's what the Till is mainly used for: dividing the amount by the
// same per-egg price the app itself uses (EGG_UNIT_VALUE_KSH) gives an egg
// count, which becomes both the note and the linked Income's category. A
// Paybill payment isn't assumed to be any particular product — it's logged
// as plain income with no forced category, since the Paybill has no single
// "usual" reason customers would pay it directly the way the Till does.
// Either way, the user can still edit the category/note/count afterwards on
// the Income page — this is only the default.
exports.c2bConfirmation = onRequest({ secrets: [MPESA_WEBHOOK_SECRET, MPESA_PAYOUT_SHORTCODE] }, async (req, res) => {
  const ok = webhookKeyMatches(req);
  await logC2BCall('c2bConfirmation', req, ok);
  if (!ok) {
    logger.warn('Webhook called with a missing/incorrect key', { path: req.path });
    res.status(403).send('forbidden');
    return;
  }
  try {
    const b = resolveC2BBody(req).body;
    const acct = classifyC2BShortcode(b.BusinessShortCode);
    const payer = [b.FirstName, b.MiddleName, b.LastName].filter(Boolean).join(' ');
    const amount = Number(b.TransAmount || 0);
    const who = payer || b.MSISDN || 'a customer';
    if (acct === 'paybill') {
      await addTransactionIfNew({
        id: 'c2b_' + (b.TransID || Date.now()),
        date: isoDateFromMpesaTimestamp(b.TransTime) || new Date().toISOString().slice(0, 10),
        type: 'deposit',
        amount: amount,
        note: 'Received from ' + who + ' via Paybill (M-Pesa' + (b.TransID ? ' ' + b.TransID : '') + ')',
        source: 'mpesa-c2b-paybill',
      });
    } else {
      const eggsCount = Math.max(0, Math.round(amount / EGG_UNIT_VALUE_KSH));
      await addTransactionIfNew({
        id: 'c2b_' + (b.TransID || Date.now()),
        date: isoDateFromMpesaTimestamp(b.TransTime) || new Date().toISOString().slice(0, 10),
        type: 'deposit',
        amount: amount,
        category: 'Egg Sales',
        note: eggsCount + (eggsCount === 1 ? ' egg' : ' eggs') + ' — from ' + who + ' via Till',
        source: 'mpesa-c2b',
      });
    }
  } catch (err) {
    logger.error('c2bConfirmation error', err);
  }
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ---------------------------------------------------------------------
// Account Balance, Transaction Status, Dynamic QR
//
// Account Balance and Transaction Status are both "Initiator APIs" — same
// credential shape as B2C (initiator name + encrypted security credential)
// and the same async shape (this call only gets Safaricom to *accept* the
// request; the real answer lands a few seconds later at a ResultURL
// webhook). So each one writes a small "pending" doc to mpesaQueries/{id}
// first, keyed by the ConversationID Safaricom hands back, and the webhook
// below fills in the actual result on that same doc once it arrives — the
// app's Finance page just listens to that doc in real time, the same way
// it already listens to the Finance ledger itself.
//
// Dynamic QR is the odd one out: a plain synchronous request that only
// needs the ordinary Consumer Key/Secret (no Initiator setup at all), so it
// just returns the QR image straight back to the caller — nothing to
// store, nothing to wait for.

function extractResultParams(result) {
  const items = (result.ResultParameters && result.ResultParameters.ResultParameter) || [];
  const out = {};
  items.forEach((it) => { if (it && it.Key) out[it.Key] = it.Value; });
  return out;
}

// Safaricom's AccountBalance result packs every sub-account (Working
// Account, Utility Account, etc.) into ONE string, "&"-separated per
// account and "|"-separated within an account:
//   "Working Account|KES|1234.00|1234.00|0.00|0.00&Float Account|KES|..."
// (Account Name | Currency | Total | Available | Reserved | Uncleared).
// Rather than assume Safaricom will never add/reorder fields, this keeps
// the raw string too, so nothing is ever hidden even if parsing below
// misses a case.
function parseAccountBalanceString(raw) {
  const accounts = String(raw || '').split('&').map((chunk) => {
    const parts = chunk.split('|');
    return { name: parts[0] || '', currency: parts[1] || '', total: parts[2] || '', available: parts[3] || '' };
  }).filter((a) => a.name);
  // The account that actually holds received-but-unwithdrawn till funds is
  // "Merchant Account" (Buy Goods tills, like this one) or "Utility Account"
  // (Paybills) — per Safaricom's own docs, "Working" is a separate
  // pre-withdrawal staging account that sits at 0.00 except during an
  // actual withdrawal, so checking it first always showed KES 0.00
  // regardless of real takings. This checks Merchant/Utility first instead.
  const primary = accounts.find((a) => /merchant/i.test(a.name)) ||
                  accounts.find((a) => /utility/i.test(a.name)) ||
                  accounts.find((a) => /working/i.test(a.name)) ||
                  accounts[0];
  return {
    accounts,
    workingAccountBalance: primary ? (primary.available || primary.total) : null,
    workingAccountCurrency: primary ? primary.currency : null,
    workingAccountName: primary ? primary.name : null,
  };
}

exports.checkAccountBalance = onCall({ secrets: B2C_SECRETS, region: 'us-central1' }, async (request) => {
  const auth = requireAdminLevelRole(request);
  const certPem = sval(MPESA_B2C_CERT);
  const precomputedCred = sval(MPESA_SECURITY_CREDENTIAL);
  const initiatorName = sval(MPESA_INITIATOR_NAME);
  const initiatorPassword = sval(MPESA_INITIATOR_PASSWORD);
  const haveCredentialSource = looksConfigured(precomputedCred) || (certPem && initiatorPassword);
  if (!initiatorName || !haveCredentialSource) {
    throw new HttpsError('failed-precondition', "This needs the same Initiator setup as B2C ('Send via M-Pesa') — see SETUP-B2C.md.");
  }
  const callbackBase = sval(MPESA_CALLBACK_BASE_URL);
  const webhookKey = sval(MPESA_WEBHOOK_SECRET);
  const webhookQs = webhookKey ? `?key=${encodeURIComponent(webhookKey)}` : '';
  try {
    const securityCredential = resolveSecurityCredential({ precomputed: precomputedCred, initiatorPassword, certPem });
    const result = await accountBalanceQuery({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_PAYOUT_CONSUMER_KEY),
      consumerSecret: sval(MPESA_PAYOUT_CONSUMER_SECRET),
      shortcode: sval(MPESA_PAYOUT_SHORTCODE),
      initiatorName, securityCredential,
      resultUrl: `${callbackBase}/mpesaAccountBalanceResult${webhookQs}`,
      timeoutUrl: `${callbackBase}/mpesaAccountBalanceTimeout${webhookQs}`,
    });
    const conversationId = result.ConversationID;
    await markQueryPending(conversationId, {
      type: 'balance',
      requestedBy: auth.uid,
      requestedAt: new Date().toISOString(),
    });
    return { ok: true, conversationId };
  } catch (err) {
    logger.error('Account balance query failed', err);
    throw new HttpsError('internal', 'Could not reach M-Pesa. Try again in a moment.');
  }
});

exports.mpesaAccountBalanceResult = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  try {
    const result = req.body && req.body.Result;
    const conversationId = result && result.ConversationID;
    if (conversationId) {
      if (result.ResultCode === 0) {
        const params = extractResultParams(result);
        const parsed = parseAccountBalanceString(params.AccountBalance);
        await MPESA_QUERIES_REF().doc(conversationId).set({
          status: 'done',
          resultCode: 0,
          resultDesc: result.ResultDesc,
          raw: params.AccountBalance || null,
          accounts: parsed.accounts,
          workingAccountBalance: parsed.workingAccountBalance,
          workingAccountCurrency: parsed.workingAccountCurrency,
          workingAccountName: parsed.workingAccountName,
          completedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        await MPESA_QUERIES_REF().doc(conversationId).set({
          status: 'failed',
          resultCode: result.ResultCode,
          resultDesc: result.ResultDesc,
          completedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (err) {
    logger.error('mpesaAccountBalanceResult error', err);
  }
  res.status(200).send('ok');
});

exports.mpesaAccountBalanceTimeout = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  logger.info('Account balance query timed out', req.body);
  res.status(200).send('ok');
});

exports.checkTransactionStatus = onCall({ secrets: B2C_SECRETS, region: 'us-central1' }, async (request) => {
  const auth = requireAdminLevelRole(request);
  const transactionId = String((request.data && request.data.transactionId) || '').trim().toUpperCase();
  if (!transactionId || !/^[A-Z0-9]{6,15}$/.test(transactionId)) {
    throw new HttpsError('invalid-argument', 'Enter a valid M-Pesa receipt code, e.g. OEI2AK4Q16.');
  }
  const certPem = sval(MPESA_B2C_CERT);
  const precomputedCred = sval(MPESA_SECURITY_CREDENTIAL);
  const initiatorName = sval(MPESA_INITIATOR_NAME);
  const initiatorPassword = sval(MPESA_INITIATOR_PASSWORD);
  const haveCredentialSource = looksConfigured(precomputedCred) || (certPem && initiatorPassword);
  if (!initiatorName || !haveCredentialSource) {
    throw new HttpsError('failed-precondition', "This needs the same Initiator setup as B2C ('Send via M-Pesa') — see SETUP-B2C.md.");
  }
  const callbackBase = sval(MPESA_CALLBACK_BASE_URL);
  const webhookKey = sval(MPESA_WEBHOOK_SECRET);
  const webhookQs = webhookKey ? `?key=${encodeURIComponent(webhookKey)}` : '';
  try {
    const securityCredential = resolveSecurityCredential({ precomputed: precomputedCred, initiatorPassword, certPem });
    const result = await transactionStatusQuery({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_PAYOUT_CONSUMER_KEY),
      consumerSecret: sval(MPESA_PAYOUT_CONSUMER_SECRET),
      shortcode: sval(MPESA_PAYOUT_SHORTCODE),
      initiatorName, securityCredential, transactionId,
      resultUrl: `${callbackBase}/mpesaTransactionStatusResult${webhookQs}`,
      timeoutUrl: `${callbackBase}/mpesaTransactionStatusTimeout${webhookQs}`,
    });
    const conversationId = result.ConversationID;
    await markQueryPending(conversationId, {
      type: 'txnstatus',
      transactionId,
      requestedBy: auth.uid,
      requestedAt: new Date().toISOString(),
    });
    return { ok: true, conversationId };
  } catch (err) {
    logger.error('Transaction status query failed', err);
    throw new HttpsError('internal', 'Could not reach M-Pesa. Try again in a moment.');
  }
});

exports.mpesaTransactionStatusResult = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  try {
    const result = req.body && req.body.Result;
    const conversationId = result && result.ConversationID;
    if (conversationId) {
      if (result.ResultCode === 0) {
        const params = extractResultParams(result);
        await MPESA_QUERIES_REF().doc(conversationId).set({
          status: 'done',
          resultCode: 0,
          resultDesc: result.ResultDesc,
          transactionStatus: params.TransactionStatus || params.Result || null,
          amount: params.Amount || params.TransactionAmount || null,
          finalisedTime: params.FinalisedTime || null,
          receiverPartyPublicName: params.ReceiverPartyPublicName || null,
          completedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        await MPESA_QUERIES_REF().doc(conversationId).set({
          status: 'failed',
          resultCode: result.ResultCode,
          resultDesc: result.ResultDesc,
          completedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (err) {
    logger.error('mpesaTransactionStatusResult error', err);
  }
  res.status(200).send('ok');
});

exports.mpesaTransactionStatusTimeout = onRequest({ secrets: [MPESA_WEBHOOK_SECRET] }, async (req, res) => {
  if (!checkWebhookSecret(req, res)) return;
  logger.info('Transaction status query timed out', req.body);
  res.status(200).send('ok');
});

exports.generateDynamicQR = onCall({ secrets: ALL_SECRETS, region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const role = request.auth.token.role;
  const isFinancialStaff = role === 'employee' && request.auth.token.jobTitle === 'financial';
  if (role !== 'administrator' && role !== 'coadmin' && !isFinancialStaff) {
    throw new HttpsError('permission-denied', 'Only the administrator, co-administrator, or financial staff can generate a payment QR code.');
  }
  const amount = Number(request.data && request.data.amount) || 0;
  if (amount < 0) throw new HttpsError('invalid-argument', 'Enter a valid amount, or leave it blank for the customer to type their own.');
  const accountType = sval(MPESA_ACCOUNT_TYPE, 'till');
  try {
    const data = await dynamicQR({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_CONSUMER_KEY),
      consumerSecret: sval(MPESA_CONSUMER_SECRET),
      merchantName: 'Kenokip Farm',
      refNo: 'KenokipFarm',
      amount,
      trxCode: accountType === 'paybill' ? 'PB' : 'BG',
      cpi: sval(MPESA_STORE_NUMBER) || sval(MPESA_SHORTCODE),
      size: '300',
    });
    return { ok: true, qrCode: data.QRCode, requestId: data.RequestID };
  } catch (err) {
    logger.error('Dynamic QR generation failed', err);
    throw new HttpsError('internal', 'Could not generate the QR code. Try again in a moment.');
  }
});

/* =====================================================================
   INSTALLATION ORDERS & LICENSING
   =====================================================================
   A completely separate concern from everything above: this is YOUR
   (the developer's) own business of selling installations of this app
   to other farms, not any one farm's own operations. A prospective
   farmer fills out order.html (public, no sign-in) -> you review it and
   set a price in order-admin.html (sign in with your own account,
   kenokip.work@gmail.com — see OWNER_EMAIL below) -> the farmer pays
   via the SAME Till your own farm already collects on, from order.html
   -> once paid in full, a license key is generated -> that key goes into
   the new farm's farm.config.js (as `licenseKey`) -> app.js checks it on
   load (checkLicense below) and shows a "payment required" screen
   instead of the app if it's ever not active.

   Kenokip Farm's own farm.config.js has no licenseKey at all, so none of
   this is ever consulted for it — zero behavior change for the farm
   you're already running. See HOW-TO-SELL-INSTALLATIONS.md.

   Money collected here does NOT touch the `finance`/`farms` collections
   above — it's tracked in its own `installOrders` collection so it never
   mixes with any farm's own Finance records.
   ===================================================================== */

const ORDERS_REF = () => db.collection('installOrders');
const PENDING_ORDER_PAYMENTS_REF = () => db.collection('pendingOrderPayments');

// Only this account can manage orders/pricing. Must match the email you
// actually sign in with on order-admin.html (the same Firebase Auth
// project your farm app already uses) — change this if that's ever not
// kenokip.work@gmail.com.
const OWNER_EMAIL = 'kenokip.work@gmail.com';
function requireOwner(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const email = String((request.auth.token && request.auth.token.email) || '').toLowerCase();
  if (email !== OWNER_EMAIL) {
    throw new HttpsError('permission-denied', 'Only the app owner can do this.');
  }
  return request.auth;
}

function randomLicenseKey() {
  // Not a secret the way MPESA_* are — it's handed to the paying customer
  // on purpose, to put in their own farm.config.js. Just needs to be hard
  // to guess, not cryptographically hidden.
  return require('crypto').randomBytes(9).toString('base64url');
}

// Step 1 — the public order.html form. No auth (a prospective farmer has
// no account yet), so this only ever WRITES a new order; it can't read or
// change anyone else's.
exports.submitInstallRequest = onCall({ region: 'us-central1' }, async (request) => {
  const d = request.data || {};
  const farmName = String(d.farmName || '').trim();
  const contactName = String(d.contactName || '').trim();
  const phone = normalizePhone(d.phone);
  const email = String(d.email || '').trim();
  const hasTechExpert = !!d.hasTechExpert;
  const notes = String(d.notes || '').trim().slice(0, 1000);
  if (!farmName || !contactName) throw new HttpsError('invalid-argument', 'Farm name and contact name are required.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');
  const ref = await ORDERS_REF().add({
    farmName, contactName, phone, email, hasTechExpert, notes,
    status: 'new',
    feeTotal: 0, feeDeposit: 0, amountPaid: 0,
    licenseKey: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, orderId: ref.id };
});

// Step 2 (order.html, using the link/orderId you send the farmer back) —
// the public-safe view of one order: enough to show them what's owed and
// let them pay, nothing more. orderId is a random Firestore document id,
// not a guessable sequence, so knowing it is treated as "this is yours to
// view" the same way a knowing a receipt link is elsewhere in this app.
exports.getInstallOrder = onCall({ region: 'us-central1' }, async (request) => {
  const orderId = String((request.data && request.data.orderId) || '').trim();
  if (!orderId) throw new HttpsError('invalid-argument', 'Missing order id.');
  const snap = await ORDERS_REF().doc(orderId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Order not found.');
  const o = snap.data();
  const amountDue = o.status === 'paid_in_full' || o.status === 'installed'
    ? 0
    : (o.feeDeposit > 0 && o.amountPaid < o.feeDeposit ? o.feeDeposit - o.amountPaid : o.feeTotal - o.amountPaid);
  return {
    farmName: o.farmName, status: o.status, hasTechExpert: o.hasTechExpert,
    feeTotal: o.feeTotal, feeDeposit: o.feeDeposit, amountPaid: o.amountPaid,
    amountDue: Math.max(0, amountDue),
    licenseKey: (o.status === 'paid_in_full' || o.status === 'installed') ? o.licenseKey : null,
  };
});

// Step 3 (order.html's "Pay now" button) — always charges whatever is
// currently owed (the deposit first if one's set and not yet met,
// otherwise the remaining balance), so the farmer never has to pick a
// "phase" themselves. Uses the SAME Till credentials/account your own
// farm's deposits use — see DEPOSIT_SECRETS above.
exports.payOrderFee = onCall({ secrets: DEPOSIT_SECRETS, region: 'us-central1' }, async (request) => {
  const orderId = String((request.data && request.data.orderId) || '').trim();
  const phone = normalizePhone(request.data && request.data.phone);
  if (!orderId) throw new HttpsError('invalid-argument', 'Missing order id.');
  if (!phone) throw new HttpsError('invalid-argument', 'Enter a valid Safaricom number, e.g. 0712345678.');
  const ref = ORDERS_REF().doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Order not found.');
  const o = snap.data();
  if (o.status === 'new' || !o.feeTotal) {
    throw new HttpsError('failed-precondition', 'This order has not been priced yet — check back once you hear from us.');
  }
  if (o.status === 'paid_in_full' || o.status === 'installed') {
    throw new HttpsError('failed-precondition', 'This order is already paid in full.');
  }
  const amount = o.feeDeposit > 0 && o.amountPaid < o.feeDeposit ? o.feeDeposit - o.amountPaid : o.feeTotal - o.amountPaid;
  if (!(amount > 0)) throw new HttpsError('failed-precondition', 'Nothing currently owed on this order.');

  const webhookKey = sval(MPESA_WEBHOOK_SECRET);
  const callbackUrl = `${sval(MPESA_CALLBACK_BASE_URL)}/mpesaStkCallback?acct=till` + (webhookKey ? `&key=${encodeURIComponent(webhookKey)}` : '');
  try {
    const result = await stkPush({
      env: sval(MPESA_ENV, 'sandbox'),
      consumerKey: sval(MPESA_CONSUMER_KEY),
      consumerSecret: sval(MPESA_CONSUMER_SECRET),
      shortcode: sval(MPESA_SHORTCODE),
      storeNumber: sval(MPESA_STORE_NUMBER),
      passkey: sval(MPESA_PASSKEY),
      accountType: sval(MPESA_ACCOUNT_TYPE, 'till'),
      phone, amount,
      callbackUrl,
      accountRef: 'KenokipFarmOrder',
      description: 'Kenokip Farm app installation fee',
    });
    await PENDING_ORDER_PAYMENTS_REF().doc(result.CheckoutRequestID).set({
      orderId, amount, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true, message: 'Check ' + phone + ' now — enter your M-Pesa PIN there to complete the payment.' };
  } catch (err) {
    logger.error('Order STK push failed', err, { orderId });
    throw new HttpsError('internal', 'Could not reach M-Pesa. Try again in a moment.');
  }
});

// Step 4 (order-admin.html) — the owner reviews a request and sets what
// it costs. Setting feeDeposit equal to feeTotal (or leaving it 0, same
// effect) means the very first payment already completes the order —
// the right shape for a farmer with their own tech expert, who's paying
// in full upfront rather than booking a guided install.
exports.adminSetOrderFee = onCall({ region: 'us-central1' }, async (request) => {
  requireOwner(request);
  const orderId = String((request.data && request.data.orderId) || '').trim();
  const feeTotal = Number(request.data && request.data.feeTotal) || 0;
  const feeDeposit = Number(request.data && request.data.feeDeposit) || 0;
  if (!orderId) throw new HttpsError('invalid-argument', 'Missing order id.');
  if (feeTotal <= 0) throw new HttpsError('invalid-argument', 'Enter a valid total fee.');
  if (feeDeposit < 0 || feeDeposit > feeTotal) throw new HttpsError('invalid-argument', 'Deposit must be between 0 and the total fee.');
  await ORDERS_REF().doc(orderId).set({ feeTotal, feeDeposit, status: 'quoted' }, { merge: true });
  return { ok: true };
});

// Bookkeeping only — doesn't change what checkLicense returns (paid_in_full
// already unlocks the app). Marks that you've personally finished the
// guided setup for a no-tech-expert order, so order-admin.html can show
// you what's actually still outstanding versus done.
exports.adminMarkInstalled = onCall({ region: 'us-central1' }, async (request) => {
  requireOwner(request);
  const orderId = String((request.data && request.data.orderId) || '').trim();
  if (!orderId) throw new HttpsError('invalid-argument', 'Missing order id.');
  const snap = await ORDERS_REF().doc(orderId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Order not found.');
  if (snap.data().status !== 'paid_in_full') {
    throw new HttpsError('failed-precondition', 'This order is not fully paid yet.');
  }
  await ORDERS_REF().doc(orderId).set({ status: 'installed' }, { merge: true });
  return { ok: true };
});

exports.adminListInstallOrders = onCall({ region: 'us-central1' }, async (request) => {
  requireOwner(request);
  const snap = await ORDERS_REF().orderBy('createdAt', 'desc').limit(200).get();
  return { orders: snap.docs.map((d) => Object.assign({ id: d.id }, d.data())) };
});

// Called from app.js on load, ONLY when farm.config.js sets a
// licenseKey — see HOW-TO-SELL-INSTALLATIONS.md. No auth (nobody's
// signed in to anything yet at this point), and deliberately returns
// nothing beyond "is this active" — not the fee amounts, contact info,
// or anything else an order's own page already shows.
exports.checkLicense = onCall({ region: 'us-central1' }, async (request) => {
  const licenseKey = String((request.data && request.data.licenseKey) || '').trim();
  if (!licenseKey) return { active: false };
  const snap = await ORDERS_REF().where('licenseKey', '==', licenseKey).limit(1).get();
  if (snap.empty) return { active: false };
  const o = snap.docs[0].data();
  return { active: o.status === 'paid_in_full' || o.status === 'installed', farmName: o.farmName || '' };
});
