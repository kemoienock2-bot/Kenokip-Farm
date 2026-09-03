// Kenokip Farm — accounts, roles, Finance approvals, and access logging.
//
// Everything money-related (Finance) is written ONLY from here (via the
// Admin SDK), never directly from the app. That's what makes the "financial
// staff can't send anything without the administrator's approval" rule
// actually enforceable: the client can only ever call proposeFinanceEntry
// (which marks non-admin entries "pending") or reviewFinanceEntry (which
// only the administrator's role claim can invoke) — there's no path for a
// non-admin client to write directly to the Finance document at all.
//
// Roles live as Firebase Auth "custom claims" ({role, jobTitle}) so they're
// available instantly and securely in Firestore security rules
// (request.auth.token.role) without an extra database read. A claim only
// takes effect on that user's NEXT sign-in or forced token refresh — the
// app calls getIdTokenResult(true) right after any call here that changes
// its own role.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

const JOB_TITLES = ['supervisor', 'vet', 'financial', 'farmhand'];
const JOB_TITLE_LABELS = { supervisor: 'Supervisor', vet: 'Vet / Doctor', financial: 'Financial Staff', farmhand: 'Farmhand' };

function genId(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);
}

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}
function requireAdmin(request) {
  const auth = requireAuth(request);
  if (auth.token.role !== 'administrator') {
    throw new HttpsError('permission-denied', 'Only the administrator can do this.');
  }
  return auth;
}
function isFinancialStaff(auth) {
  return auth.token.role === 'employee' && auth.token.jobTitle === 'financial';
}
function canProposeFinance(auth) {
  return auth.token.role === 'administrator' || isFinancialStaff(auth);
}
function roleLabelFor(role, jobTitle) {
  return role === 'administrator' ? 'Administrator' : (JOB_TITLE_LABELS[jobTitle] || jobTitle || 'Employee');
}

// Turns a browser's User-Agent header into something readable in the access
// log, e.g. "iPhone · Safari" or "Windows · Chrome". Best-effort string
// matching, not a full parser — good enough for an audit log, not meant to
// be exact for every possible browser/OS combination.
function describeDevice(ua) {
  if (!ua) return 'Unknown device';
  let os = 'Unknown OS';
  if (/iPhone/.test(ua)) os = 'iPhone';
  else if (/iPad/.test(ua)) os = 'iPad';
  else if (/Android/.test(ua)) {
    const m = ua.match(/Android [\d.]+; ([^;)]+)/);
    os = m ? m[1].trim() : 'Android';
  } else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = 'Opera';
  else if (/CriOS\//.test(ua)) browser = 'Chrome';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  return os + ' · ' + browser;
}

module.exports = function (admin, db) {
  const FINANCE_REF = db.collection('finance').doc('kenokip');
  const META_REF = db.collection('meta').doc('roles');

  async function mutateFinanceDoc(mutator) {
    await db.runTransaction(async (t) => {
      const snap = await t.get(FINANCE_REF);
      const data = snap.exists ? snap.data() : { openingBalance: 0, openingDate: new Date().toISOString().slice(0, 10), transactions: [] };
      if (!Array.isArray(data.transactions)) data.transactions = [];
      mutator(data);
      t.set(FINANCE_REF, data, { merge: true });
    });
  }

  // ---------------------------------------------------------------------
  // Accounts & roles
  // ---------------------------------------------------------------------

  // One-time self-service bootstrap: the very first person to call this
  // (meant to be you, right after creating your Firebase Auth account)
  // becomes Administrator. It refuses to run again once an administrator
  // exists, so it can safely stay in the app permanently.
  const bootstrapFirstAdmin = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const metaSnap = await META_REF.get();
    if (metaSnap.exists && metaSnap.data().adminCreated) {
      throw new HttpsError('already-exists', 'An administrator already exists for this farm.');
    }
    await admin.auth().setCustomUserClaims(auth.uid, { role: 'administrator', jobTitle: null });
    await db.collection('users').doc(auth.uid).set({
      email: auth.token.email || null,
      name: null,
      role: 'administrator',
      jobTitle: null,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid,
    });
    await META_REF.set({ adminCreated: true, adminUid: auth.uid }, { merge: true });
    return { ok: true, message: 'You are now the administrator. Sign out and back in once to finish.' };
  });

  // Administrator creates a login for an employee. Uses the Admin SDK, so
  // (unlike createUserWithEmailAndPassword on the client) it does NOT sign
  // the administrator out or switch the active session to the new account.
  const createStaffAccount = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAdmin(request);
    const email = String((request.data && request.data.email) || '').trim().toLowerCase();
    const password = String((request.data && request.data.password) || '');
    const jobTitle = String((request.data && request.data.jobTitle) || '');
    const name = String((request.data && request.data.name) || '').trim().slice(0, 60) || null;
    if (!email || !email.includes('@')) throw new HttpsError('invalid-argument', 'Enter a valid email address.');
    if (password.length < 6) throw new HttpsError('invalid-argument', 'Password needs at least 6 characters.');
    if (!JOB_TITLES.includes(jobTitle)) throw new HttpsError('invalid-argument', 'Choose a valid role.');

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({ email, password });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'That email already has an account.');
      logger.error('createStaffAccount failed', err);
      throw new HttpsError('internal', 'Could not create the account.');
    }
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'employee', jobTitle });
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role: 'employee',
      jobTitle,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid,
    });
    return { ok: true, uid: userRecord.uid };
  });

  // Any signed-in account (administrator or employee) sets their own
  // display name — used to identify them in messages, e.g. "Supervisor(John)".
  const updateOwnProfile = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const name = String((request.data && request.data.name) || '').trim().slice(0, 60);
    if (!name) throw new HttpsError('invalid-argument', 'Enter a name.');
    await db.collection('users').doc(auth.uid).set({ name }, { merge: true });
    return { ok: true, name };
  });

  // Administrator changes an employee's job title, or enables/disables
  // their access (disabling blocks sign-in immediately — no need to delete
  // the account to revoke access).
  const updateStaffAccount = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAdmin(request);
    const uid = String((request.data && request.data.uid) || '');
    if (!uid) throw new HttpsError('invalid-argument', 'Missing account.');
    if (uid === auth.uid) throw new HttpsError('invalid-argument', "You can't change your own account here.");
    const patch = {};
    if (request.data && request.data.jobTitle !== undefined) {
      if (!JOB_TITLES.includes(request.data.jobTitle)) throw new HttpsError('invalid-argument', 'Choose a valid role.');
      patch.jobTitle = request.data.jobTitle;
      await admin.auth().setCustomUserClaims(uid, { role: 'employee', jobTitle: request.data.jobTitle });
    }
    if (request.data && typeof request.data.disabled === 'boolean') {
      patch.disabled = request.data.disabled;
      await admin.auth().updateUser(uid, { disabled: request.data.disabled });
    }
    // Resets the account's password outright (there is no way to look up
    // the existing one — Firebase never stores or exposes plaintext
    // passwords, only a one-way hash, not even to the administrator). This
    // is the correct fix for "I forgot a team member's password": set a new
    // one and share it with them, the same as when the account was created.
    if (request.data && typeof request.data.password === 'string') {
      const newPassword = request.data.password;
      if (newPassword.length < 6) throw new HttpsError('invalid-argument', 'Password needs at least 6 characters.');
      await admin.auth().updateUser(uid, { password: newPassword });
    }
    if (Object.keys(patch).length) await db.collection('users').doc(uid).set(patch, { merge: true });
    return { ok: true };
  });

  // Administrator permanently removes an employee's account.
  const deleteStaffAccount = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAdmin(request);
    const uid = String((request.data && request.data.uid) || '');
    if (!uid) throw new HttpsError('invalid-argument', 'Missing account.');
    if (uid === auth.uid) throw new HttpsError('invalid-argument', "You can't delete your own account here.");
    try { await admin.auth().deleteUser(uid); } catch (err) { logger.error('deleteStaffAccount auth error', err); }
    await db.collection('users').doc(uid).delete();
    return { ok: true };
  });

  // ---------------------------------------------------------------------
  // Access logging (who signed in, from where)
  // ---------------------------------------------------------------------

  const logAccess = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const d = request.data || {};
    const ua = (request.rawRequest && request.rawRequest.headers && request.rawRequest.headers['user-agent']) || null;
    // The place name (e.g. "Kondele, Kisumu, Kenya") is resolved client-side
    // from the coordinates via OpenStreetMap's Nominatim — done in the
    // browser rather than here because Nominatim blocks a lot of requests
    // coming from cloud-server IPs. It's purely descriptive/audit data (who
    // signed in and roughly where), so trusting the client's text here is
    // fine — nothing security-sensitive depends on it.
    const place = typeof d.place === 'string' ? d.place.slice(0, 200) : null;
    await db.collection('accessLogs').add({
      uid: auth.uid,
      email: auth.token.email || null,
      role: auth.token.role || null,
      jobTitle: auth.token.jobTitle || null,
      at: admin.firestore.FieldValue.serverTimestamp(),
      locationStatus: d.locationStatus || 'unknown',
      lat: typeof d.lat === 'number' ? d.lat : null,
      lng: typeof d.lng === 'number' ? d.lng : null,
      place,
      device: describeDevice(ua),
      userAgent: ua,
    });
    return { ok: true };
  });

  // ---------------------------------------------------------------------
  // Finance — the only writable path for money data
  // ---------------------------------------------------------------------

  // Administrator: entry is final immediately, whichever direction it is.
  // Financial Staff: receiving money (a deposit) is final immediately too —
  // there's nothing to approve about money that's already in the account.
  // Sending money out (a withdrawal) is saved as "pending" and excluded from
  // the balance until the administrator reviews it, since that's the
  // direction that actually needs sign-off.
  const proposeFinanceEntry = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (!canProposeFinance(auth)) throw new HttpsError('permission-denied', 'Only the administrator or financial staff can add Finance entries.');
    const d = request.data || {};
    const type = d.type === 'withdrawal' ? 'withdrawal' : 'deposit';
    const amount = Number(d.amount);
    const date = String(d.date || '').slice(0, 10);
    const note = String(d.note || '').slice(0, 300);
    if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpsError('invalid-argument', 'Enter a valid date.');

    const isAdmin = auth.token.role === 'administrator';
    const autoApproved = isAdmin || type === 'deposit';
    const entry = {
      id: genId('fin'),
      date, type, amount, note,
      status: autoApproved ? 'approved' : 'pending',
      proposedBy: auth.uid,
      proposedByEmail: auth.token.email || null,
    };
    if (autoApproved) { entry.reviewedBy = auth.uid; entry.reviewedAt = new Date().toISOString(); }
    await mutateFinanceDoc((data) => { data.transactions.push(entry); });
    return { ok: true, id: entry.id, status: entry.status };
  });

  // Administrator approves or rejects a pending entry from financial staff.
  const reviewFinanceEntry = onCall({ region: 'us-central1' }, async (request) => {
    requireAdmin(request);
    const d = request.data || {};
    const id = String(d.id || '');
    const decision = d.decision === 'reject' ? 'rejected' : 'approved';
    if (!id) throw new HttpsError('invalid-argument', 'Missing entry.');
    let found = false;
    await mutateFinanceDoc((data) => {
      const entry = data.transactions.find((x) => x.id === id);
      if (!entry) return;
      found = true;
      entry.status = decision;
      entry.reviewedBy = request.auth.uid;
      entry.reviewedAt = new Date().toISOString();
    });
    if (!found) throw new HttpsError('not-found', 'That entry no longer exists.');
    return { ok: true };
  });

  // Administrator edits any entry (approved or pending).
  const editFinanceEntry = onCall({ region: 'us-central1' }, async (request) => {
    requireAdmin(request);
    const d = request.data || {};
    const id = String(d.id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing entry.');
    let found = false;
    await mutateFinanceDoc((data) => {
      const entry = data.transactions.find((x) => x.id === id);
      if (!entry) return;
      found = true;
      if (d.type === 'deposit' || d.type === 'withdrawal') entry.type = d.type;
      if (typeof d.amount === 'number' && d.amount > 0) entry.amount = d.amount;
      if (typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) entry.date = d.date;
      if (typeof d.note === 'string') entry.note = d.note.slice(0, 300);
    });
    if (!found) throw new HttpsError('not-found', 'That entry no longer exists.');
    return { ok: true };
  });

  // Administrator deletes an entry outright.
  const deleteFinanceEntry = onCall({ region: 'us-central1' }, async (request) => {
    requireAdmin(request);
    const id = String((request.data && request.data.id) || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing entry.');
    await mutateFinanceDoc((data) => { data.transactions = data.transactions.filter((x) => x.id !== id); });
    return { ok: true };
  });

  // Administrator sets/updates the opening balance.
  const setOpeningBalance = onCall({ region: 'us-central1' }, async (request) => {
    requireAdmin(request);
    const d = request.data || {};
    const amount = Number(d.amount);
    const date = String(d.date || '').slice(0, 10);
    if (Number.isNaN(amount)) throw new HttpsError('invalid-argument', 'Enter a valid amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpsError('invalid-argument', 'Enter a valid date.');
    await mutateFinanceDoc((data) => { data.openingBalance = amount; data.openingDate = date; });
    return { ok: true };
  });

  // ---------------------------------------------------------------------
  // Team messaging — broadcast (administrator only) or one-to-one (anyone
  // signed in). Written only from here so the sender's name/role can't be
  // spoofed — the app never lets the client claim to be someone else.
  // ---------------------------------------------------------------------

  const URGENCY_LEVELS = ['normal', 'important', 'urgent'];

  const sendMessage = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const d = request.data || {};
    const to = String(d.to || '');
    const body = String(d.body || '').trim().slice(0, 2000);
    const urgency = URGENCY_LEVELS.includes(d.urgency) ? d.urgency : 'normal';
    if (!body) throw new HttpsError('invalid-argument', 'Write a message first.');
    if (!to) throw new HttpsError('invalid-argument', 'Choose who to send this to.');
    if (to === auth.uid) throw new HttpsError('invalid-argument', "You can't message yourself.");

    const isAdmin = auth.token.role === 'administrator';
    if (to === 'all' && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only the administrator can message the whole team.');
    }

    let toLabel = 'Everyone';
    if (to !== 'all') {
      const toSnap = await db.collection('users').doc(to).get();
      if (!toSnap.exists) throw new HttpsError('not-found', "That team member's account no longer exists.");
      const toData = toSnap.data();
      toLabel = roleLabelFor(toData.role, toData.jobTitle) + '(' + (toData.name || (toData.email ? toData.email.split('@')[0] : 'Unnamed')) + ')';
    }

    const fromSnap = await db.collection('users').doc(auth.uid).get();
    const fromData = fromSnap.exists ? fromSnap.data() : {};
    const fromLabel = roleLabelFor(auth.token.role, auth.token.jobTitle) + '(' + (fromData.name || (auth.token.email ? auth.token.email.split('@')[0] : 'Unnamed')) + ')';

    await db.collection('messages').add({
      fromUid: auth.uid,
      fromLabel,
      toUid: to,
      toLabel,
      body,
      urgency,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      readBy: [auth.uid],
    });
    return { ok: true };
  });

  // Marks one message as read by the caller — only the actual recipient (or
  // a broadcast's recipients) can mark it, and the administrator, who can
  // see everything.
  const markMessageRead = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const id = String((request.data && request.data.id) || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing message.');
    const ref = db.collection('messages').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'That message no longer exists.');
    const msg = snap.data();
    const allowed = auth.token.role === 'administrator' || msg.toUid === auth.uid || msg.toUid === 'all' || msg.fromUid === auth.uid;
    if (!allowed) throw new HttpsError('permission-denied', "That message isn't addressed to you.");
    await ref.set({ readBy: admin.firestore.FieldValue.arrayUnion(auth.uid) }, { merge: true });
    return { ok: true };
  });

  return {
    bootstrapFirstAdmin, createStaffAccount, updateStaffAccount, deleteStaffAccount, updateOwnProfile,
    logAccess,
    proposeFinanceEntry, reviewFinanceEntry, editFinanceEntry, deleteFinanceEntry, setOpeningBalance,
    sendMessage, markMessageRead,
  };
};

module.exports.JOB_TITLES = JOB_TITLES;
module.exports.JOB_TITLE_LABELS = JOB_TITLE_LABELS;
