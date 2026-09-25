// "Privacy Guard" — dates of birth, kept out of reach of everyone except
// their own owner and the administrator, and even the administrator only
// gets someone ELSE's back after entering a dedicated Birthday PIN (set up
// separately from, and never shared with, the Finance PIN in
// financeGuard.js — this is deliberately its own PIN, its own hash, its
// own lockout).
//
// One deliberate exception, asked for specifically: on the day itself, the
// birthday person gets a congratulations "from the company", and the rest
// of the team is told it's their birthday so they can wish them well too
// (see runBirthdayCheck below) — that requires the DAY to become public
// for that one day. The YEAR never does: nothing sent to anyone ever
// includes it, and the actual date on file still only comes back through
// getTeamBirthdays, administrator-only, behind the Birthday PIN.
//
// Why a whole separate file/collection instead of just adding a `dob` field
// to users/{uid}: that collection is readable by ANY signed-in account (see
// firestore.rules — it's how the team roster and messaging work), so a
// field stored there is visible to every team member no matter what the
// client UI does with it. A date of birth is stored in `privateProfiles/{uid}`
// instead, which — like `security/{uid}` — denies read/write to every
// client outright; the only way in or out is through the Cloud Functions
// below, run with Admin SDK privileges.
//
// What this deliberately does NOT claim: same honest caveat as
// financeGuard.js — 3 wrong PIN tries locks this feature for the
// administrator's account until they clear it, which is the real defense.
// It does not, and can't, stop someone who already has the administrator's
// own device unlocked and signed in from eventually guessing correctly
// within those 3 tries; it stops casual/opportunistic looking and anyone
// without the administrator's own PIN.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const { hashPassword, verifyPassword } = require('./cryptoHelpers');
const { sendUrgentPush } = require('./push');

const MAX_FAILS = 3;
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}
// Deliberately `administrator` only, not `coadmin` — same narrower line
// financeGuard.js draws around its own quick-unlock and PIN-reveal (see
// quickUnlockFinancePortal / verifyFinancePinReveal there): a dedicated,
// single-factor PIN door is kept to the one person who asked for it, not
// extended to every admin-level account by default.
function requireTrueAdmin(request) {
  const auth = requireAuth(request);
  if (auth.token.role !== 'administrator') {
    throw new HttpsError('permission-denied', 'Only the administrator can do this.');
  }
  return auth;
}

module.exports = function (admin, db) {
  const SECURITY_REF = (uid) => db.collection('security').doc(uid);
  const PROFILE_REF = (uid) => db.collection('privateProfiles').doc(uid);
  const GUARD_REF = () => db.collection('security').doc('birthdayGuard');

  // -----------------------------------------------------------------------
  // Lockout + alerting — its own streak, separate from financeGuard.js's.
  // A wrong Birthday PIN attempt has nothing to do with Finance access (and
  // shouldn't lock it), so this is a parallel copy of that same shape
  // rather than a shared counter.
  // -----------------------------------------------------------------------

  async function assertNotLocked() {
    const snap = await GUARD_REF().get();
    const data = snap.exists ? snap.data() : {};
    if (data.lockedAt) {
      throw new HttpsError(
        'permission-denied',
        'Birthday viewing is locked after repeated wrong PIN attempts. Clear it from Settings → Your account.'
      );
    }
  }

  async function findAdminUids() {
    const snap = await db.collection('users').where('role', '==', 'administrator').get();
    return snap.docs.map((d) => d.id);
  }

  async function recordEvent(auth, outcome) {
    try {
      const adminUids = await findAdminUids();
      if (outcome === 'success') return; // quiet — a correct PIN needs no alert

      let title, body;
      if (outcome === 'locked') {
        title = '🔒 Birthday PIN locked';
        body = 'Locked after ' + MAX_FAILS + ' wrong attempts. Clear it from Settings → Your account once you know it was you.';
      } else {
        title = '⚠️ Wrong Birthday PIN attempt';
        body = 'Someone entered the wrong Birthday PIN while trying to view a team member’s date of birth.';
      }

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
      logger.error('privacyGuard recordEvent failed (non-fatal)', e);
    }
  }

  async function onFail(auth) {
    let justLocked = false;
    await db.runTransaction(async (t) => {
      const ref = GUARD_REF();
      const snap = await t.get(ref);
      const data = snap.exists ? snap.data() : { failStreak: 0 };
      const streak = (data.failStreak || 0) + 1;
      const update = { failStreak: streak };
      if (streak >= MAX_FAILS && !data.lockedAt) {
        update.lockedAt = admin.firestore.FieldValue.serverTimestamp();
        justLocked = true;
      }
      t.set(ref, update, { merge: true });
    });
    await recordEvent(auth, justLocked ? 'locked' : 'fail');
  }

  async function onSuccess() {
    await GUARD_REF().set({ failStreak: 0 }, { merge: true });
  }

  // The administrator clears their own lock, same shared-account reasoning
  // as financeGuard.js's makeAdminClearLock, but simpler: this PIN is
  // administrator-only to begin with, and unlike Finance there's no second
  // factor (authenticator code) to require here — clearing it is itself a
  // normal, already-authenticated administrator action, same trust level
  // as any other Settings change.
  const clearBirthdayLock = onCall({ region: 'us-central1' }, async (request) => {
    requireTrueAdmin(request);
    await GUARD_REF().set(
      { failStreak: 0, lockedAt: admin.firestore.FieldValue.delete() },
      { merge: true }
    );
    return { ok: true };
  });

  const getBirthdayGuardStatus = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireTrueAdmin(request);
    const [guardSnap, secSnap] = await Promise.all([GUARD_REF().get(), SECURITY_REF(auth.uid).get()]);
    const guard = guardSnap.exists ? guardSnap.data() : {};
    const sec = secSnap.exists ? secSnap.data() : {};
    return {
      ok: true,
      locked: !!guard.lockedAt,
      pinSet: !!sec.birthdayPinHash,
      pinLength: sec.birthdayPinLength || null,
    };
  });

  // -----------------------------------------------------------------------
  // Personal Birthday PIN — the administrator's alone, separate from every
  // other PIN or password in this app.
  // -----------------------------------------------------------------------

  const setBirthdayPin = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireTrueAdmin(request);
    const pin = String((request.data && request.data.pin) || '');
    if (!/^\d{4,8}$/.test(pin)) throw new HttpsError('invalid-argument', 'Use a 4 to 8 digit PIN.');
    await SECURITY_REF(auth.uid).set({ birthdayPinHash: hashPassword(pin), birthdayPinLength: pin.length }, { merge: true });
    return { ok: true };
  });

  async function verifyBirthdayPin(uid, pin) {
    const snap = await SECURITY_REF(uid).get();
    const data = snap.exists ? snap.data() : {};
    if (!data.birthdayPinHash) {
      throw new HttpsError('failed-precondition', 'Set up your Birthday PIN first, from Settings → Your account.');
    }
    if (!verifyPassword(String(pin || ''), data.birthdayPinHash)) {
      throw new HttpsError('invalid-argument', 'Incorrect PIN.');
    }
  }

  // -----------------------------------------------------------------------
  // Dates of birth — self-service for your own, administrator-set for
  // anyone's (either one can set a given person's — see roles.js's
  // updateOwnProfile/updateStaffAccount for the equivalent split on other
  // profile fields). None of this ever touches users/{uid}.
  // -----------------------------------------------------------------------

  function validateDob(dob) {
    const s = String(dob || '');
    if (!DOB_RE.test(s)) throw new HttpsError('invalid-argument', 'Enter a valid date (YYYY-MM-DD).');
    const d = new Date(s + 'T00:00:00Z');
    const now = new Date();
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1900 || d.getTime() > now.getTime()) {
      throw new HttpsError('invalid-argument', 'Enter a valid date of birth.');
    }
    return s;
  }

  // Any signed-in account reads back its OWN date of birth — no PIN needed,
  // it's their own data. Returns null if never set.
  const getMyDob = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const snap = await PROFILE_REF(auth.uid).get();
    const data = snap.exists ? snap.data() : {};
    return { ok: true, dob: data.dob || null };
  });

  // Any signed-in account sets/updates their OWN date of birth.
  const setOwnDob = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const dob = validateDob(request.data && request.data.dob);
    await PROFILE_REF(auth.uid).set({ dob, dobUpdatedBy: auth.uid, dobUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true, dob };
  });

  // Administrator sets/updates a team member's date of birth (e.g. from
  // their ID, when adding or editing them) — writing it does not require
  // the Birthday PIN, only reading someone else's back does (see
  // getTeamBirthdays below); entering a value you were just told by the
  // person themselves isn't "revealing" anything hidden.
  const setStaffDob = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireTrueAdmin(request);
    const uid = String((request.data && request.data.uid) || '');
    if (!uid) throw new HttpsError('invalid-argument', 'Missing account.');
    const dob = validateDob(request.data && request.data.dob);
    await PROFILE_REF(uid).set({ dob, dobUpdatedBy: auth.uid, dobUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true, dob };
  });

  // The actual "reveal" — administrator-only, requires the Birthday PIN
  // every single time (this deliberately never caches "already unlocked"
  // server-side; the client's own in-memory reveal flag, cleared on every
  // fresh page load, is the only thing that avoids asking again and again
  // within one sitting — same pattern as Finance amounts). Returns every
  // team member's date of birth in one call so the whole Team Directory can
  // unmask at once, the same way revealing Finance amounts unmasks every
  // figure on the page together.
  const getTeamBirthdays = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireTrueAdmin(request);
    await assertNotLocked();
    const pin = String((request.data && request.data.pin) || '');
    try {
      await verifyBirthdayPin(auth.uid, pin);
    } catch (err) {
      await onFail(auth);
      throw err;
    }
    await onSuccess();

    const snap = await db.collection('privateProfiles').get();
    const out = {};
    snap.forEach((doc) => { out[doc.id] = doc.data().dob || null; });
    return { ok: true, dobs: out };
  });

  // -----------------------------------------------------------------------
  // Birthday reminders + the birthday itself.
  //
  // Two very different kinds of "telling" happen here, on purpose:
  //   - 7 days before: a private, administrator-only heads-up (so there's
  //     time to plan a card, a cake, whatever) — nobody else is told, same
  //     as every other date-of-birth detail in this app.
  //   - On the day itself: this is the one deliberate exception. The
  //     administrator asked for the birthday person to get a congratulations
  //     "from the company", AND for the rest of the team to be told so they
  //     can wish that person well too — which only works if the DAY becomes
  //     known to everyone. So it does, but nothing else does: the message
  //     never includes the year (so never the exact date of birth or the
  //     person's age), and nobody but the administrator can ever look up the
  //     actual date on file (see getTeamBirthdays above).
  // -----------------------------------------------------------------------

  function nairobiMonthDay(iso) {
    return iso.slice(5); // 'YYYY-MM-DD' -> 'MM-DD', good enough for a same-month/day match
  }
  function addDaysISO(iso, n) {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(d);
  }

  // Writes one message + push. `toUid` is either a specific account or
  // 'all' (a broadcast, same shape notifyHatch already uses in roles.js);
  // `pushUids` is who actually gets the phone notification for it — kept
  // separate from `toUid` so a broadcast can skip re-pushing to someone who
  // already got their own personal message a moment earlier (see below).
  // The private 7-day heads-up is deliberately 'important' rather than
  // 'urgent' — a plain FYI, not something that should pop the full urgent
  // banner+sound the birthday-day messages below get on purpose.
  async function sendSystemMessage(toUid, toLabel, body, kind, pushUids) {
    const urgency = kind === 'birthday-upcoming' ? 'important' : 'urgent';
    try {
      await db.collection('messages').add({
        fromUid: 'system',
        fromLabel: 'Kenokip Farm',
        toUid,
        toLabel,
        body,
        urgency,
        kind,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [],
      });
      if (pushUids && pushUids.length) {
        const title = kind === 'birthday-announcement' ? '🎂 Birthday today'
          : kind === 'birthday-wish' ? '🎂 Happy Birthday!'
          : '🎈 Birthday coming up';
        await sendUrgentPush(admin, db, pushUids, title, body, { urgency, kind });
      }
    } catch (e) {
      logger.error('birthday notify failed (' + kind + ')', e);
    }
  }

  async function runBirthdayCheck() {
    const [profilesSnap, usersSnap, adminUids] = await Promise.all([
      db.collection('privateProfiles').get(),
      db.collection('users').get(),
      findAdminUids(),
    ]);

    const namesByUid = {};
    const allUids = [];
    usersSnap.forEach((doc) => {
      const u = doc.data();
      namesByUid[doc.id] = u.name || (u.email ? u.email.split('@')[0] : 'A team member');
      allUids.push(doc.id);
    });

    const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date());
    const in7ISO = addDaysISO(todayISO, 7);
    const todayMD = nairobiMonthDay(todayISO);
    const in7MD = nairobiMonthDay(in7ISO);

    const todayUids = [];
    const upcomingNames = [];
    profilesSnap.forEach((doc) => {
      const dob = doc.data().dob;
      if (!dob || !DOB_RE.test(dob)) return;
      const md = nairobiMonthDay(dob);
      if (md === todayMD) todayUids.push(doc.id);
      else if (md === in7MD) upcomingNames.push(namesByUid[doc.id] || 'A team member');
    });

    // Private heads-up, administrator only — one message per admin account,
    // never a broadcast.
    if (upcomingNames.length && adminUids.length) {
      const body = upcomingNames.length === 1
        ? upcomingNames[0] + "'s birthday is in 7 days."
        : 'Birthdays in 7 days: ' + upcomingNames.join(', ') + '.';
      await Promise.all(adminUids.map((uid) => sendSystemMessage(uid, 'You', body, 'birthday-upcoming', [uid])));
    }

    if (todayUids.length) {
      // A personal congratulations from the company to each birthday person.
      await Promise.all(todayUids.map((uid) => {
        const name = namesByUid[uid] || 'there';
        const body = '🎉 Happy Birthday, ' + name + '! Wishing you a wonderful day and a great year ahead — from all of us at Kenokip Farm.';
        return sendSystemMessage(uid, 'You', body, 'birthday-wish', [uid]);
      }));

      // ...and a heads-up to everyone else so they can wish that person
      // well too — skipped as a push for the birthday person(s) themselves
      // (they just got their own message above) but still written as a
      // normal 'all' broadcast, so it's there in their inbox like anyone
      // else's if they open Messages.
      const names = todayUids.map((uid) => namesByUid[uid] || 'A team member');
      const announceBody = names.length === 1
        ? 'Today is ' + names[0] + "'s birthday! Stop by and wish them a happy birthday. 🎂"
        : 'Today is the birthday of ' + names.join(' and ') + '! Wish them a happy birthday. 🎂';
      const pushTargets = allUids.filter((uid) => todayUids.indexOf(uid) === -1);
      await sendSystemMessage('all', 'Everyone', announceBody, 'birthday-announcement', pushTargets);
    }
  }

  // Runs once a day — Nairobi morning, same slot pattern as digest.js's
  // weekly one. Best-effort throughout: a missed reminder is never
  // something that should page anyone or block anything else.
  const birthdayReminder = onSchedule(
    { schedule: '0 7 * * *', timeZone: 'Africa/Nairobi', region: 'us-central1' },
    async () => {
      try {
        await runBirthdayCheck();
      } catch (e) {
        logger.error('birthdayReminder failed', e);
      }
    }
  );

  return {
    triggers: {
      getBirthdayGuardStatus,
      setBirthdayPin,
      clearBirthdayLock,
      getMyDob,
      setOwnDob,
      setStaffDob,
      getTeamBirthdays,
      birthdayReminder,
    },
  };
};
