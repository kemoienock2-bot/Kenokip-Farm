// Authenticator-app (TOTP) enrollment and verification, plus the Finance
// portal password. Two *separate* authenticator secrets are kept per person:
//   - the "main" one (totpSecret / totpPendingSecret / totpLastUsedStep) —
//     used to (a) reveal masked Finance figures on screen, and (b) as a
//     real, server-enforced requirement before initiateWithdrawal (in
//     index.js) will send any money out via M-Pesa.
//   - the "portal" one (portalTotpSecret / portalTotpPendingSecret /
//     portalTotpLastUsedStep) — a second, independent code used only to
//     unlock the Finance portal gate itself (see unlockFinancePortal below),
//     alongside a shared password that only the administrator can set.
// Keeping these as two separate secrets means they show up as two separate
// entries in an authenticator app, and neither can be used in place of the
// other.
//
// All of this lives in a separate `security/{uid}` Firestore document that
// NO client can ever read directly (see firestore.rules) — only these Cloud
// Functions, running with Admin SDK privileges, touch it. The shared
// Finance portal password lives the same way, in `security/financePortal`
// (that document ID still falls under the same locked-down `security/{uid}`
// rule — {uid} there just means "any document ID in this collection", it's
// not literally required to be a user's uid). The public `users/{uid}` doc
// only ever gets plain `totpEnrolled` / `portalTotpEnrolled` true/false
// flags, which are safe for any signed-in account to see (just status
// badges for the Settings page, not the secrets).

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { randomBase32Secret, verifyTotp, otpauthUri } = require('./totp');
const { hashPassword, verifyPassword } = require('./cryptoHelpers');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}
function canUseAuthApp(auth) {
  return auth.token.role === 'administrator' || (auth.token.role === 'employee' && auth.token.jobTitle === 'financial');
}

// `guard` (optional 3rd arg) is financeGuard.js's shared lockout/alerting
// helpers — passed in from index.js so a wrong password/code here counts
// toward the SAME "3 wrong tries locks the portal" streak as a wrong
// fingerprint/PIN attempt over there. Kept optional (falls back to no-ops)
// so this file still works standalone, e.g. in a unit test that doesn't
// need the lockout behavior.
module.exports = function (admin, db, guard) {
  guard = guard || {
    assertNotLocked: async () => {},
    onFail: async () => {},
    onSuccess: async () => {},
  };
  const SECURITY_REF = (uid) => db.collection('security').doc(uid);
  const USERS_REF = (uid) => db.collection('users').doc(uid);
  const PORTAL_REF = () => db.collection('security').doc('financePortal');

  // ---------------------------------------------------------------------
  // Main authenticator — reveal masked Finance figures, authorize M-Pesa
  // sends. Unchanged from before.
  // ---------------------------------------------------------------------

  const startTotpEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Only the administrator and Financial Staff use an authenticator app here.');
    const secret = randomBase32Secret();
    await SECURITY_REF(auth.uid).set({ totpPendingSecret: secret }, { merge: true });
    return {
      ok: true,
      secret,
      otpauthUri: otpauthUri({ secret, accountLabel: auth.token.email || auth.uid, issuer: 'Kenokip Farm' }),
    };
  });

  const confirmTotpEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Only the administrator and Financial Staff use an authenticator app here.');
    const code = String((request.data && request.data.code) || '');
    const snap = await SECURITY_REF(auth.uid).get();
    const pending = snap.exists ? snap.data().totpPendingSecret : null;
    if (!pending) throw new HttpsError('failed-precondition', 'Start setup again from Settings — nothing is pending.');
    const step = verifyTotp(pending, code);
    if (step == null) throw new HttpsError('invalid-argument', "That code doesn't match — check your phone's clock and try the current code.");
    await SECURITY_REF(auth.uid).set(
      {
        totpSecret: pending,
        totpPendingSecret: admin.firestore.FieldValue.delete(),
        totpLastUsedStep: step,
      },
      { merge: true }
    );
    await USERS_REF(auth.uid).set({ totpEnrolled: true }, { merge: true });
    return { ok: true };
  });

  const resetTotp = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    let targetUid = auth.uid;
    if (request.data && request.data.uid && request.data.uid !== auth.uid) {
      if (auth.token.role !== 'administrator') throw new HttpsError('permission-denied', "Only the administrator can reset someone else's authenticator.");
      targetUid = request.data.uid;
    }
    await SECURITY_REF(targetUid).set(
      {
        totpSecret: admin.firestore.FieldValue.delete(),
        totpPendingSecret: admin.firestore.FieldValue.delete(),
        totpLastUsedStep: admin.firestore.FieldValue.delete(),
      },
      { merge: true }
    );
    await USERS_REF(targetUid).set({ totpEnrolled: false }, { merge: true });
    return { ok: true };
  });

  // Also used internally (not as a callable) by initiateWithdrawal in
  // index.js before any real money moves. Each code can only succeed once
  // (totpLastUsedStep), so it can't be replayed.
  async function verifyTotpForUid(uid, code) {
    const snap = await SECURITY_REF(uid).get();
    const data = snap.exists ? snap.data() : {};
    if (!data.totpSecret) {
      throw new HttpsError('failed-precondition', 'Set up your authenticator app first, from Settings → Your account.');
    }
    const step = verifyTotp(data.totpSecret, code);
    if (step == null || step === data.totpLastUsedStep) {
      throw new HttpsError('invalid-argument', "That code is wrong or already used — enter the current code from your app.");
    }
    await SECURITY_REF(uid).set({ totpLastUsedStep: step }, { merge: true });
  }

  const verifyTotpCode = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    await verifyTotpForUid(auth.uid, (request.data && request.data.code) || '');
    return { ok: true };
  });

  // ---------------------------------------------------------------------
  // Finance portal authenticator — a second, independent code, only for
  // unlocking the Finance portal gate (see unlockFinancePortal below).
  // ---------------------------------------------------------------------

  const startPortalTotpEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Only the administrator and Financial Staff use the Finance portal.');
    const secret = randomBase32Secret();
    await SECURITY_REF(auth.uid).set({ portalTotpPendingSecret: secret }, { merge: true });
    return {
      ok: true,
      secret,
      // Different issuer on purpose, so this shows up as a clearly separate
      // entry in an authenticator app from the "Kenokip Farm" one above.
      otpauthUri: otpauthUri({ secret, accountLabel: auth.token.email || auth.uid, issuer: 'Kenokip Farm Finance Portal' }),
    };
  });

  const confirmPortalTotpEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Only the administrator and Financial Staff use the Finance portal.');
    const code = String((request.data && request.data.code) || '');
    const snap = await SECURITY_REF(auth.uid).get();
    const pending = snap.exists ? snap.data().portalTotpPendingSecret : null;
    if (!pending) throw new HttpsError('failed-precondition', 'Start setup again from Settings — nothing is pending.');
    const step = verifyTotp(pending, code);
    if (step == null) throw new HttpsError('invalid-argument', "That code doesn't match — check your phone's clock and try the current code.");
    await SECURITY_REF(auth.uid).set(
      {
        portalTotpSecret: pending,
        portalTotpPendingSecret: admin.firestore.FieldValue.delete(),
        portalTotpLastUsedStep: step,
      },
      { merge: true }
    );
    await USERS_REF(auth.uid).set({ portalTotpEnrolled: true }, { merge: true });
    return { ok: true };
  });

  const resetPortalTotp = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    let targetUid = auth.uid;
    if (request.data && request.data.uid && request.data.uid !== auth.uid) {
      if (auth.token.role !== 'administrator') throw new HttpsError('permission-denied', "Only the administrator can reset someone else's Finance portal code.");
      targetUid = request.data.uid;
    }
    await SECURITY_REF(targetUid).set(
      {
        portalTotpSecret: admin.firestore.FieldValue.delete(),
        portalTotpPendingSecret: admin.firestore.FieldValue.delete(),
        portalTotpLastUsedStep: admin.firestore.FieldValue.delete(),
      },
      { merge: true }
    );
    await USERS_REF(targetUid).set({ portalTotpEnrolled: false }, { merge: true });
    return { ok: true };
  });

  async function verifyPortalTotpForUid(uid, code) {
    const snap = await SECURITY_REF(uid).get();
    const data = snap.exists ? snap.data() : {};
    if (!data.portalTotpSecret) {
      throw new HttpsError('failed-precondition', 'Set up the Finance portal authenticator first, from Settings → Your account.');
    }
    const step = verifyTotp(data.portalTotpSecret, code);
    if (step == null || step === data.portalTotpLastUsedStep) {
      throw new HttpsError('invalid-argument', "That code is wrong or already used — enter the current code from your app.");
    }
    await SECURITY_REF(uid).set({ portalTotpLastUsedStep: step }, { merge: true });
  }

  // ---------------------------------------------------------------------
  // Finance portal password — a single shared password that only the
  // administrator can set (and re-set), independent of anyone's own
  // sign-in password.
  // ---------------------------------------------------------------------

  const setFinancePortalPassword = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (auth.token.role !== 'administrator') throw new HttpsError('permission-denied', 'Only the administrator can set the Finance portal password.');
    const password = String((request.data && request.data.password) || '');
    if (password.length < 6) throw new HttpsError('invalid-argument', 'Use at least 6 characters.');
    await PORTAL_REF().set(
      { passwordHash: hashPassword(password), setBy: auth.uid, setAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { ok: true };
  });

  // The single check the client calls when someone tries to open the
  // Finance portal: the shared password AND that person's own Finance
  // portal authenticator code both have to be correct.
  const unlockFinancePortal = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    await guard.assertNotLocked();
    const password = String((request.data && request.data.password) || '');
    const code = String((request.data && request.data.code) || '');
    try {
      const snap = await PORTAL_REF().get();
      const stored = snap.exists ? snap.data().passwordHash : null;
      if (!stored) throw new HttpsError('failed-precondition', "The administrator hasn't set a Finance portal password yet.");
      if (!verifyPassword(password, stored)) throw new HttpsError('invalid-argument', 'Incorrect Finance portal password.');
      await verifyPortalTotpForUid(auth.uid, code);
    } catch (err) {
      // Nothing's been set up yet isn't a real "attempt" — don't count it
      // toward the lockout, there was nothing correct to compare against.
      if (err instanceof HttpsError && err.code === 'failed-precondition') throw err;
      await guard.onFail(request, 'password-totp', (err && err.message) || 'unknown');
      throw err;
    }
    await guard.onSuccess(request, 'password-totp');
    return { ok: true };
  });

  const triggers = {
    startTotpEnrollment,
    confirmTotpEnrollment,
    resetTotp,
    verifyTotpCode,
    startPortalTotpEnrollment,
    confirmPortalTotpEnrollment,
    resetPortalTotp,
    setFinancePortalPassword,
    unlockFinancePortal,
  };
  // The administrator's "clear a Finance lock" callable needs this file's
  // verifyTotpForUid (their main authenticator code) but lives conceptually
  // with the lockout logic in financeGuard.js — built here, once both
  // pieces exist, rather than duplicating the TOTP check over there.
  if (guard.makeAdminClearLock) {
    triggers.adminClearFinanceLock = guard.makeAdminClearLock(verifyTotpForUid);
  }

  return { triggers, verifyTotpForUid };
};
