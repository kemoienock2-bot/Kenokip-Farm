// "Finance Guard" — everything to do with a stranger trying (and failing)
// to get into the Finance portal, plus a second way IN for the people who
// are actually allowed there: fingerprint/Face unlock + a personal PIN,
// as an alternative to the password + authenticator-app code that already
// exists (security.js). The existing method is untouched — this is a
// second door, not a replacement.
//
// What this deliberately does NOT claim:
//   - It cannot identify a person by name, only their device/browser and
//     (roughly, and only when the IP allows it) their network location —
//     see geo.js's own honesty note.
//   - A determined attacker on a VPN can hide that rough location. What
//     they cannot avoid is the lockout below: 3 wrong tries on ANY method,
//     from anyone, and the whole portal locks until the administrator
//     clears it — that's the actual defense, the location is a clue on top
//     of it, not instead of it.
//   - Fingerprint/Face unlock still requires the separate personal PIN.
//     Losing a phone doesn't hand someone your Finance access — they'd
//     need the PIN too, which only you know.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const { hashPassword, verifyPassword } = require('./cryptoHelpers');
const { describeDevice } = require('./deviceInfo');
const { sendUrgentPush } = require('./push');
const { clientIp, lookupIpGeo } = require('./geo');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const MAX_FAILS = 3;
// A challenge is only good for 2 minutes — long enough to actually use a
// fingerprint/Face prompt, short enough that a stale, unused one lying
// around in Firestore is never a real replay risk.
const CHALLENGE_TTL_MS = 2 * 60 * 1000;

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}
function canUseAuthApp(auth) {
  return auth.token.role === 'administrator' || auth.token.role === 'coadmin' || (auth.token.role === 'employee' && auth.token.jobTitle === 'financial');
}

module.exports = function (admin, db, opts) {
  opts = opts || {};
  // Tied to where this app is actually hosted — a platform authenticator
  // (Touch ID / Windows Hello / Android fingerprint) only ever works for
  // the exact site it was registered on. If this app ever moves to a
  // custom domain, update these two lines and redeploy — every previously
  // enrolled fingerprint would need re-enrolling either way, since that's
  // how WebAuthn works everywhere, not something specific to this app.
  const RP_ID = opts.rpId || 'kenokipfarm.netlify.app';
  const RP_NAME = 'Kenokip Farm';
  const EXPECTED_ORIGIN = opts.origin || ('https://' + RP_ID);

  const SECURITY_REF = (uid) => db.collection('security').doc(uid);
  const USERS_REF = (uid) => db.collection('users').doc(uid);
  const GUARD_REF = () => db.collection('security').doc('financeGuard');

  // -----------------------------------------------------------------------
  // Lockout + alerting — shared by this file's own fingerprint+PIN unlock
  // AND by security.js's existing password+authenticator unlock (wired up
  // from index.js), so "3 wrong tries on ANY method" really does mean any
  // method, not just this new one.
  // -----------------------------------------------------------------------

  async function assertNotLocked() {
    const snap = await GUARD_REF().get();
    const data = snap.exists ? snap.data() : {};
    if (data.lockedAt) {
      throw new HttpsError(
        'permission-denied',
        'The Finance portal is locked after repeated failed attempts. Ask the administrator to clear it from Settings → Finance security.'
      );
    }
  }

  async function findAdminUids() {
    const snap = await db.collection('users').where('role', '==', 'administrator').get();
    return snap.docs.map((d) => d.id);
  }

  // Logs one attempt (success or failure) with device/IP/rough-location,
  // and — only on a failure, or the lock it causes — pushes an urgent
  // alert to every administrator account. Never throws: a logging/alert
  // problem must never be the reason a real login either succeeds or fails.
  async function recordEvent(request, method, outcome, extra) {
    try {
      const auth = request.auth;
      const rawReq = request.rawRequest || {};
      const ua = (rawReq.headers && rawReq.headers['user-agent']) || null;
      const ip = clientIp(rawReq);
      const geo = ip ? await lookupIpGeo(ip) : null;
      const device = describeDevice(ua);
      await db.collection('securityEvents').add(Object.assign({
        at: admin.firestore.FieldValue.serverTimestamp(),
        uid: auth ? auth.uid : null,
        email: auth ? auth.token.email || null : null,
        role: auth ? auth.token.role || null : null,
        jobTitle: auth ? auth.token.jobTitle || null : null,
        method,
        outcome, // 'success' | 'fail' | 'locked' | 'blocked-while-locked'
        device,
        userAgent: ua,
        ip: ip || null,
        geo: geo || null,
      }, extra || {}));

      if (outcome === 'success') return; // quiet — no need to alert on a normal, correct unlock

      const place = geo && (geo.city || geo.country)
        ? [geo.city, geo.country].filter(Boolean).join(', ')
        : (ip ? 'an unresolved location (IP: ' + ip + ')' : 'an unknown location');
      const adminUids = await findAdminUids();

      let title, body;
      if (outcome === 'locked') {
        title = '🔒 Finance portal LOCKED';
        body = 'Locked after ' + MAX_FAILS + ' wrong attempts. Latest one: ' + device + ', near ' + place + '. Clear it from Settings → Finance security once you know it was you (or after checking).';
      } else if (outcome === 'blocked-while-locked') {
        title = '🔒 Finance portal — attempt while locked';
        body = 'Someone just tried again while it\'s locked: ' + device + ', near ' + place + '.';
      } else {
        title = '⚠️ Wrong Finance portal attempt';
        body = 'Wrong ' + (method === 'fingerprint-pin' ? 'fingerprint or PIN' : 'password or code') + ' from ' + device + ', near ' + place + '.';
      }

      // Also drop it into the existing team-messages inbox (fromUid a
      // sentinel that matches nobody real) so it shows up with the same
      // in-app banner + sound + "tab not focused" notification that Urgent
      // messages already get — no new front-end plumbing needed for that.
      await Promise.all(adminUids.map((uid) => db.collection('messages').add({
        fromUid: 'system-security',
        fromLabel: '🔒 Security alert',
        toUid: uid,
        toLabel: 'You',
        body,
        urgency: 'urgent',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [],
      })));
      await sendUrgentPush(admin, db, adminUids, title, body, { urgency: 'urgent', kind: 'security' });
    } catch (e) {
      logger.error('recordEvent failed (non-fatal)', e);
    }
  }

  // Called by BOTH unlock methods right after a wrong password/code/PIN/
  // fingerprint. Increments the one shared streak (not per-person — the
  // portal itself locks, the same way a bank card locks regardless of
  // which digit of the PIN was wrong) and locks it at MAX_FAILS.
  async function onFail(request, method, reason) {
    let justLocked = false;
    await db.runTransaction(async (t) => {
      const ref = GUARD_REF();
      const snap = await t.get(ref);
      const data = snap.exists ? snap.data() : { failStreak: 0 };
      const streak = (data.failStreak || 0) + 1;
      const update = { failStreak: streak };
      if (streak >= MAX_FAILS && !data.lockedAt) {
        update.lockedAt = admin.firestore.FieldValue.serverTimestamp();
        update.lockedReason = reason || 'Repeated failed Finance portal attempts';
        justLocked = true;
      }
      t.set(ref, update, { merge: true });
    });
    await recordEvent(request, method, justLocked ? 'locked' : 'fail', { reason: reason || null });
  }

  async function onBlockedWhileLocked(request, method) {
    await recordEvent(request, method, 'blocked-while-locked', {});
  }

  async function onSuccess(request, method) {
    await GUARD_REF().set({ failStreak: 0 }, { merge: true });
    await recordEvent(request, method, 'success', {});
  }

  // The administrator clears the lock from Settings — reachable any time
  // they're signed in normally (their regular account sign-in), which is
  // exactly what makes this work even if the Finance portal itself is the
  // thing currently locked on some other device/browser. Their own main
  // authenticator-app code (the one already used to reveal Finance figures
  // and send M-Pesa payouts — see security.js) is required too, so clearing
  // a lock isn't just "be logged in as admin", it's "prove it's really you,
  // right now, with the code only your phone can produce".
  function makeAdminClearLock(verifyTotpForUid) {
    return onCall({ region: 'us-central1' }, async (request) => {
      const auth = requireAuth(request);
      if (auth.token.role !== 'administrator') {
        throw new HttpsError('permission-denied', 'Only the administrator can clear a Finance portal lock.');
      }
      const code = String((request.data && request.data.code) || '');
      await verifyTotpForUid(auth.uid, code);
      await GUARD_REF().set(
        { failStreak: 0, lockedAt: admin.firestore.FieldValue.delete(), lockedReason: admin.firestore.FieldValue.delete() },
        { merge: true }
      );
      await recordEvent(request, 'admin-clear', 'success', {});
      return { ok: true };
    });
  }

  const getFinanceGuardStatus = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    const [guardSnap, secSnap] = await Promise.all([GUARD_REF().get(), SECURITY_REF(auth.uid).get()]);
    const guard = guardSnap.exists ? guardSnap.data() : {};
    const sec = secSnap.exists ? secSnap.data() : {};
    return {
      ok: true,
      locked: !!guard.lockedAt,
      fingerprintEnrolled: Array.isArray(sec.webauthnCredentials) && sec.webauthnCredentials.length > 0,
      fingerprintDevices: (sec.webauthnCredentials || []).map((c) => ({ label: c.label || 'A device', addedAt: c.addedAt || null })),
      pinSet: !!sec.financePinHash,
    };
  });

  // -----------------------------------------------------------------------
  // Personal Finance PIN — yours alone, separate from the shared Finance
  // portal password and from your own sign-in password. Required together
  // with a fingerprint/Face scan; neither one works alone.
  // -----------------------------------------------------------------------

  const setFinancePin = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    const pin = String((request.data && request.data.pin) || '');
    if (!/^\d{4,8}$/.test(pin)) throw new HttpsError('invalid-argument', 'Use a 4 to 8 digit PIN.');
    await SECURITY_REF(auth.uid).set({ financePinHash: hashPassword(pin) }, { merge: true });
    return { ok: true };
  });

  // -----------------------------------------------------------------------
  // Fingerprint / Face enrollment (WebAuthn "registration")
  // -----------------------------------------------------------------------

  const startFinanceFingerprintEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    const snap = await SECURITY_REF(auth.uid).get();
    const existing = (snap.exists && snap.data().webauthnCredentials) || [];
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: auth.token.email || auth.uid,
      userID: Buffer.from(auth.uid, 'utf8'),
      userDisplayName: auth.token.email || auth.uid,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports || [] })),
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
    });
    await SECURITY_REF(auth.uid).set(
      { webauthnChallenge: options.challenge, webauthnChallengeExpires: Date.now() + CHALLENGE_TTL_MS },
      { merge: true }
    );
    return options;
  });

  const finishFinanceFingerprintEnrollment = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    const response = request.data && request.data.response;
    const label = String((request.data && request.data.label) || '').slice(0, 60);
    if (!response) throw new HttpsError('invalid-argument', 'Missing enrollment response.');

    const snap = await SECURITY_REF(auth.uid).get();
    const data = snap.exists ? snap.data() : {};
    const challenge = data.webauthnChallenge;
    if (!challenge || !data.webauthnChallengeExpires || Date.now() > data.webauthnChallengeExpires) {
      throw new HttpsError('failed-precondition', 'That took too long — start fingerprint/Face setup again.');
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: EXPECTED_ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (err) {
      logger.warn('WebAuthn registration verification error', err && err.message);
      throw new HttpsError('invalid-argument', "Couldn't verify that fingerprint/Face registration — try again.");
    }
    if (!verification.verified || !verification.registrationInfo) {
      throw new HttpsError('invalid-argument', "Couldn't verify that fingerprint/Face registration — try again.");
    }

    const info = verification.registrationInfo;
    const ua = (request.rawRequest && request.rawRequest.headers && request.rawRequest.headers['user-agent']) || null;
    const cred = {
      id: info.credential.id,
      publicKey: Buffer.from(info.credential.publicKey).toString('base64'),
      counter: info.credential.counter,
      transports: info.credential.transports || [],
      addedAt: new Date().toISOString(),
      label: label || describeDevice(ua),
    };
    await SECURITY_REF(auth.uid).set(
      {
        webauthnCredentials: admin.firestore.FieldValue.arrayUnion(cred),
        webauthnChallenge: admin.firestore.FieldValue.delete(),
        webauthnChallengeExpires: admin.firestore.FieldValue.delete(),
      },
      { merge: true }
    );
    await USERS_REF(auth.uid).set({ fingerprintEnrolled: true }, { merge: true });
    return { ok: true, label: cred.label };
  });

  const removeFinanceFingerprint = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    const credId = String((request.data && request.data.id) || '');
    const snap = await SECURITY_REF(auth.uid).get();
    const existing = (snap.exists && snap.data().webauthnCredentials) || [];
    const next = existing.filter((c) => c.id !== credId);
    await SECURITY_REF(auth.uid).set({ webauthnCredentials: next }, { merge: true });
    await USERS_REF(auth.uid).set({ fingerprintEnrolled: next.length > 0 }, { merge: true });
    return { ok: true };
  });

  // -----------------------------------------------------------------------
  // Fingerprint / Face + PIN unlock (WebAuthn "authentication")
  // -----------------------------------------------------------------------

  const startFinanceFingerprintUnlock = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');
    await assertNotLocked();
    const snap = await SECURITY_REF(auth.uid).get();
    const data = snap.exists ? snap.data() : {};
    const creds = data.webauthnCredentials || [];
    if (!creds.length) {
      throw new HttpsError('failed-precondition', 'Set up fingerprint/Face unlock first, from Settings → Your account.');
    }
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: creds.map((c) => ({ id: c.id, transports: c.transports || [] })),
      userVerification: 'required',
    });
    await SECURITY_REF(auth.uid).set(
      { webauthnChallenge: options.challenge, webauthnChallengeExpires: Date.now() + CHALLENGE_TTL_MS },
      { merge: true }
    );
    return options;
  });

  const finishFinanceFingerprintUnlock = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canUseAuthApp(auth)) throw new HttpsError('permission-denied', 'Not available for your account.');

    // Already locked — don't even attempt verification (nothing would be
    // accepted anyway), just log that someone tried, with a lighter tone
    // than a fresh wrong-attempt (it's expected once a lock is already up).
    const guardSnap = await GUARD_REF().get();
    if (guardSnap.exists && guardSnap.data().lockedAt) {
      await onBlockedWhileLocked(request, 'fingerprint-pin');
      throw new HttpsError('permission-denied', 'The Finance portal is locked after repeated failed attempts. Ask the administrator to clear it from Settings → Finance security.');
    }

    const response = request.data && request.data.response;
    const pin = String((request.data && request.data.pin) || '');

    const snap = await SECURITY_REF(auth.uid).get();
    const data = snap.exists ? snap.data() : {};

    try {
      if (!response) throw new HttpsError('invalid-argument', 'Missing fingerprint/Face response.');
      const challenge = data.webauthnChallenge;
      if (!challenge || !data.webauthnChallengeExpires || Date.now() > data.webauthnChallengeExpires) {
        throw new HttpsError('failed-precondition', 'That took too long — try again.');
      }
      const creds = data.webauthnCredentials || [];
      const stored = creds.find((c) => c.id === response.id);
      if (!stored) throw new HttpsError('invalid-argument', 'Unrecognized fingerprint/Face credential.');

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: challenge,
          expectedOrigin: EXPECTED_ORIGIN,
          expectedRPID: RP_ID,
          credential: {
            id: stored.id,
            publicKey: Buffer.from(stored.publicKey, 'base64'),
            counter: stored.counter,
            transports: stored.transports || [],
          },
          requireUserVerification: true,
        });
      } catch (err) {
        logger.warn('WebAuthn authentication verification error', err && err.message);
        throw new HttpsError('invalid-argument', "That fingerprint/Face check didn't match.");
      }
      if (!verification.verified) throw new HttpsError('invalid-argument', "That fingerprint/Face check didn't match.");

      // PIN is checked in the same pass — either mismatch is treated as one
      // failed *attempt* for lockout purposes, not two, since it's one
      // unlock action from the person's point of view.
      if (!data.financePinHash || !verifyPassword(pin, data.financePinHash)) {
        throw new HttpsError('invalid-argument', 'Incorrect PIN.');
      }

      // Both checks passed — persist the new counter (replay protection)
      // and clear the used challenge.
      const nextCreds = creds.map((c) => (c.id === stored.id ? Object.assign({}, c, { counter: verification.authenticationInfo.newCounter }) : c));
      await SECURITY_REF(auth.uid).set(
        { webauthnCredentials: nextCreds, webauthnChallenge: admin.firestore.FieldValue.delete(), webauthnChallengeExpires: admin.firestore.FieldValue.delete() },
        { merge: true }
      );
    } catch (err) {
      await onFail(request, 'fingerprint-pin', (err && err.message) || 'unknown');
      throw err;
    }

    await onSuccess(request, 'fingerprint-pin');
    return { ok: true };
  });

  return {
    RP_ID,
    EXPECTED_ORIGIN,
    helpers: { assertNotLocked, onFail, onBlockedWhileLocked, onSuccess, makeAdminClearLock },
    triggers: {
      getFinanceGuardStatus,
      setFinancePin,
      startFinanceFingerprintEnrollment,
      finishFinanceFingerprintEnrollment,
      removeFinanceFingerprint,
      startFinanceFingerprintUnlock,
      finishFinanceFingerprintUnlock,
    },
  };
};
