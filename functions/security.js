// Authenticator-app (TOTP) enrollment and verification for the
// administrator and Financial Staff — used to (a) reveal masked Finance
// figures on screen, and (b) as a real, server-enforced requirement before
// initiateWithdrawal (in index.js) will send any money out via M-Pesa.
//
// The secret itself lives in a separate `security/{uid}` Firestore
// document that NO client can ever read directly (see firestore.rules) —
// only these Cloud Functions, running with Admin SDK privileges, touch it.
// The public `users/{uid}` doc only ever gets a plain `totpEnrolled` true/
// false flag, which is safe for any signed-in account to see (it's just a
// status badge for the Settings page, not the secret).

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { randomBase32Secret, verifyTotp, otpauthUri } = require('./totp');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}
function canUseAuthApp(auth) {
  return auth.token.role === 'administrator' || (auth.token.role === 'employee' && auth.token.jobTitle === 'financial');
}

module.exports = function (admin, db) {
  const SECURITY_REF = (uid) => db.collection('security').doc(uid);
  const USERS_REF = (uid) => db.collection('users').doc(uid);

  // Generates a fresh secret and stores it as "pending" — it does NOT take
  // effect until confirmTotpEnrollment proves the caller actually captured
  // it correctly (by producing a real matching code). That way a
  // half-finished or accidental "set up again" never knocks out an
  // already-working authenticator.
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

  // Turns the authenticator off (e.g. a lost phone) — for yourself, or, if
  // you're the administrator, for someone else who needs it reset.
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

  // The actual check — also used internally (not as a callable) by
  // initiateWithdrawal in index.js before any real money moves. Each code
  // can only succeed once (totpLastUsedStep), so it can't be replayed.
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

  // The callable version — used client-side just to unmask Finance on
  // screen (see the note in SETUP-B2C.md about exactly what this does and
  // doesn't protect against).
  const verifyTotpCode = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    await verifyTotpForUid(auth.uid, (request.data && request.data.code) || '');
    return { ok: true };
  });

  return {
    triggers: { startTotpEnrollment, confirmTotpEnrollment, resetTotp, verifyTotpCode },
    verifyTotpForUid,
  };
};
