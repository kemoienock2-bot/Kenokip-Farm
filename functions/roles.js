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
const { describeDevice } = require('./deviceInfo');
const { sendUrgentPush } = require('./push');

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


module.exports = function (admin, db) {
  const FINANCE_REF = db.collection('finance').doc('kenokip');
  const FARM_REF = db.collection('farms').doc('kenokip');
  const META_REF = db.collection('meta').doc('roles');

  // Finance and Income are meant to stay in step: money the farm actually
  // receives (a Finance deposit) is mirrored into the farm's Income list
  // automatically, under a fixed id ("inc_fin_<financeEntryId>") so it can
  // always be found again to update or remove later — no double-entry, and
  // editing or deleting the Finance side keeps the Income side honest too.
  // Withdrawals are deliberately NOT mirrored to Expenses — only asked for
  // the income direction.
  //
  // `mirrorFn`, when given, runs AFTER `mutator` (so it sees the already-
  // mutated Finance data) and returns either null (no income change this
  // call) or { incomeId, incomeEntry } — incomeEntry present upserts that
  // income record, incomeEntry null removes it. Both Finance and Income
  // documents are read before either is written, so this is one atomic
  // Firestore transaction — they can never drift apart mid-write.
  async function mutateFinanceDoc(mutator, mirrorFn) {
    await db.runTransaction(async (t) => {
      const snap = await t.get(FINANCE_REF);
      const data = snap.exists ? snap.data() : { openingBalance: 0, openingDate: new Date().toISOString().slice(0, 10), transactions: [] };
      if (!Array.isArray(data.transactions)) data.transactions = [];

      const farmSnap = mirrorFn ? await t.get(FARM_REF) : null;

      mutator(data);

      if (mirrorFn && farmSnap && farmSnap.exists) {
        const mirror = mirrorFn(data);
        if (mirror) {
          const farmData = farmSnap.data();
          const incomes = Array.isArray(farmData.incomes) ? farmData.incomes.slice() : [];
          const idx = incomes.findIndex((x) => x.id === mirror.incomeId);
          if (mirror.incomeEntry) {
            const nextEntry = Object.assign({}, mirror.incomeEntry, { id: mirror.incomeId });
            if (idx >= 0) incomes[idx] = nextEntry; else incomes.push(nextEntry);
          } else if (idx >= 0) {
            incomes.splice(idx, 1);
          }
          t.set(FARM_REF, Object.assign({}, farmData, { incomes }), { merge: true });
        }
      }

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
  //
  // Also doubles as the administrator's "I'm away" toggle (see
  // requestReceiptSignoff/skipReceiptSignoff below) — any signed-in account
  // could technically flip its own `away` flag, but only the administrator's
  // copy of it is ever read by anything, so that's harmless. Either field
  // can be sent on its own (the app's "away" switch never sends a name).
  const updateOwnProfile = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const d = request.data || {};
    const patch = {};
    if (typeof d.name === 'string') {
      const name = d.name.trim().slice(0, 60);
      if (!name) throw new HttpsError('invalid-argument', 'Enter a name.');
      patch.name = name;
    }
    if (typeof d.away === 'boolean') {
      patch.away = d.away;
    }
    if (!Object.keys(patch).length) throw new HttpsError('invalid-argument', 'Nothing to update.');
    await db.collection('users').doc(auth.uid).set(patch, { merge: true });
    return { ok: true, name: patch.name, away: patch.away };
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
    // Lets the administrator set (or fix) a team member's display name —
    // mainly for accounts created before names existed, or if someone never
    // got around to setting their own from Settings.
    if (request.data && typeof request.data.name === 'string') {
      patch.name = request.data.name.trim().slice(0, 60) || null;
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
    await mutateFinanceDoc(
      (data) => { data.transactions.push(entry); },
      type === 'deposit' ? () => ({
        incomeId: 'inc_fin_' + entry.id,
        incomeEntry: { date, category: 'M-Pesa / Bank', amount, note: note || 'Received into Finance', linkedFinanceId: entry.id },
      }) : null
    );
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
    }, (data) => {
      // Re-mirror (or un-mirror) after the edit above, whatever changed —
      // amount, date, note, or type flipping away from/into "deposit".
      const entry = data.transactions.find((x) => x.id === id);
      const incomeId = 'inc_fin_' + id;
      if (!entry || entry.type !== 'deposit') return { incomeId, incomeEntry: null };
      return { incomeId, incomeEntry: { date: entry.date, category: 'M-Pesa / Bank', amount: entry.amount, note: entry.note || 'Received into Finance', linkedFinanceId: id } };
    });
    if (!found) throw new HttpsError('not-found', 'That entry no longer exists.');
    return { ok: true };
  });

  // Administrator deletes an entry outright.
  const deleteFinanceEntry = onCall({ region: 'us-central1' }, async (request) => {
    requireAdmin(request);
    const id = String((request.data && request.data.id) || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing entry.');
    await mutateFinanceDoc(
      (data) => { data.transactions = data.transactions.filter((x) => x.id !== id); },
      () => ({ incomeId: 'inc_fin_' + id, incomeEntry: null })
    );
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
  // Receipt co-signing — a team member (Supervisor/Vet/Financial Staff/
  // Farmhand) signs a receipt that also needs the administrator's
  // signature. Their half is captured here as a "pending" request instead
  // of a finished receipt; the administrator reviews it, adds their own
  // signature, and only then does a fully-signed copy become available to
  // download. Every write to pendingSignoffs goes through these three
  // functions (never directly from the client — see firestore.rules), so
  // "only the administrator can approve" and "a mandatory document can
  // never be skipped" are real, server-enforced rules, not just UI
  // decisions the app happens to make.
  //
  // The actual tamper-evident signing (signReceipt) is untouched by any of
  // this — it's still just called with an ordered list of fields, same as
  // always. What's new is WHO calls it and WHEN: a team member calls it
  // once, alone, only if they end up skipping; the administrator calls it
  // once, with both signers' fields combined, once they approve. The
  // functions below just coordinate that handoff and enforce who's allowed
  // to do what.
  // ---------------------------------------------------------------------

  const RECEIPT_FIELD_LIMITS = { rows: 40, label: 60, value: 800 };

  function validateReceiptFieldTriple(fields, label) {
    if (!Array.isArray(fields) || fields.length !== 3) {
      throw new HttpsError('invalid-argument', 'Malformed ' + label + '.');
    }
    fields.forEach((f) => {
      if (!Array.isArray(f) || f.length !== 2 || String(f[0]).length > RECEIPT_FIELD_LIMITS.label || String(f[1] == null ? '' : f[1]).length > RECEIPT_FIELD_LIMITS.value) {
        throw new HttpsError('invalid-argument', 'Malformed ' + label + '.');
      }
    });
  }

  // Firestore refuses to store an array directly inside another array
  // (fields here are [label, value] pairs, i.e. an array of arrays) — the
  // exact same restriction that once crashed signReceipt's own audit-log
  // write (see receipts.js). Converting each pair to a {label, value}
  // object before it's ever written sidesteps that, the same fix applied
  // there. Without this, requestReceiptSignoff/approveReceiptSignoff throw
  // a raw, non-HttpsError exception that Firebase masks to the client as a
  // bare "internal" error — which is exactly what got reported as "stuck
  // on Sending... / INTERNAL".
  function tripleToFieldObjects(fields) {
    return fields.map((f) => ({ label: String(f[0]), value: f[1] == null ? '' : String(f[1]) }));
  }

  function validateReceiptOptsSnapshot(opts) {
    if (!opts || typeof opts !== 'object') throw new HttpsError('invalid-argument', 'Missing receipt.');
    if (!Array.isArray(opts.rows) || opts.rows.length > RECEIPT_FIELD_LIMITS.rows) {
      throw new HttpsError('invalid-argument', 'Malformed receipt.');
    }
    opts.rows.forEach((r) => {
      if (!r || String(r.label || '').length > RECEIPT_FIELD_LIMITS.label || String(r.value == null ? '' : r.value).length > RECEIPT_FIELD_LIMITS.value) {
        throw new HttpsError('invalid-argument', 'Malformed receipt row.');
      }
    });
    return {
      title: String(opts.title || '').slice(0, 80),
      receiptNo: String(opts.receiptNo || '').slice(0, 40),
      date: String(opts.date || '').slice(0, 10),
      rows: opts.rows.map((r) => ({ label: String(r.label).slice(0, 60), value: r.value == null ? '' : String(r.value).slice(0, 800) })),
      amountLabel: String(opts.amountLabel || 'Amount').slice(0, 40),
      amount: opts.amount == null ? '' : String(opts.amount).slice(0, 60),
    };
  }

  async function findAdministratorDoc() {
    const snap = await db.collection('users').where('role', '==', 'administrator').limit(1).get();
    return snap.empty ? null : { uid: snap.docs[0].id, data: snap.docs[0].data() };
  }

  // A signature image is a base64 PNG data URL — generous but bounded, so
  // nobody can wedge an arbitrarily large blob into Firestore this way.
  function validateSignatureImg(img) {
    const s = String(img || '');
    if (!s || !s.length || s.length > 200000) throw new HttpsError('invalid-argument', 'Missing or invalid signature.');
    return s;
  }

  // Team member: signs their half of a two-signature receipt. Blocked
  // outright for the administrator's own account — they always sign
  // directly (see signAndPreviewReceipt in index.html), there's nobody
  // above them to route a request to.
  const requestReceiptSignoff = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    if (auth.token.role === 'administrator') {
      throw new HttpsError('invalid-argument', "The administrator signs directly — this is only for team members.");
    }
    const d = request.data || {};
    const opts = validateReceiptOptsSnapshot(d.opts);
    validateReceiptFieldTriple(d.firstSignerFields, 'signature block');
    const signatureImg = validateSignatureImg(d.signatureImg);
    const roleLabel = roleLabelFor(auth.token.role, auth.token.jobTitle);

    const rawSignatures = Array.isArray(d.signatures) ? d.signatures : [];
    if (!rawSignatures.length) throw new HttpsError('invalid-argument', 'Missing signature slots.');
    const signatures = rawSignatures.map((s) => {
      const role = String((s && s.role) || '').slice(0, 40);
      return role === roleLabel ? { role, img: signatureImg } : { role };
    });
    if (!signatures.some((s) => s.role === roleLabel)) {
      throw new HttpsError('invalid-argument', "Your role doesn't match this document's signer list.");
    }

    const adminDoc = await findAdministratorDoc();
    if (!adminDoc) throw new HttpsError('failed-precondition', 'No administrator account exists yet.');

    const fromSnap = await db.collection('users').doc(auth.uid).get();
    const fromData = fromSnap.exists ? fromSnap.data() : {};
    const createdByLabel = roleLabel + '(' + (fromData.name || (auth.token.email ? auth.token.email.split('@')[0] : 'Unnamed')) + ')';

    const entry = {
      id: genId('pso'),
      createdBy: auth.uid,
      createdByRole: roleLabel,
      createdByLabel,
      adminUid: adminDoc.uid,
      opts,
      signatures,
      mandatory: !!d.mandatory,
      firstSignerFields: tripleToFieldObjects(d.firstSignerFields),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection('pendingSignoffs').doc(entry.id).set(entry);

    try {
      await db.collection('messages').add({
        fromUid: auth.uid,
        fromLabel: createdByLabel,
        toUid: adminDoc.uid,
        toLabel: 'Administrator',
        body: createdByLabel + ' signed "' + opts.title + '" (' + opts.receiptNo + ') and is waiting for your signature.',
        urgency: 'urgent',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [auth.uid],
        pendingSignoffId: entry.id,
      });
      await sendUrgentPush(admin, db, [adminDoc.uid], 'Waiting for your signature', createdByLabel + ' signed a document — it needs your signature to finish.', { urgency: 'urgent', pendingSignoffId: entry.id });
    } catch (e) {
      logger.error('requestReceiptSignoff notify failed', e);
    }

    return { ok: true, id: entry.id };
  });

  // Administrator: adds their own signature to a pending request. The app
  // calls signReceipt itself first (with both signers' fields combined) to
  // get the verification code, then calls this to actually record the
  // approval — kept as two calls rather than one so the well-tested
  // signReceipt code path (secret handling, the receiptLog audit write)
  // never has to be duplicated here.
  const approveReceiptSignoff = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAdmin(request);
    const d = request.data || {};
    const id = String(d.id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing request.');
    const signatureImg = validateSignatureImg(d.signatureImg);
    validateReceiptFieldTriple(d.adminFields, 'signature block');
    const code = String(d.code || '').trim().toUpperCase();
    if (!code) throw new HttpsError('invalid-argument', 'Missing verification code.');

    const ref = db.collection('pendingSignoffs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'That request no longer exists.');
    const data = snap.data();
    if (data.status !== 'pending') throw new HttpsError('failed-precondition', 'That request was already ' + data.status + '.');

    const signatures = (data.signatures || []).map((s) => (s.role === 'Administrator' ? Object.assign({}, s, { img: signatureImg }) : s));
    await ref.set({
      status: 'approved',
      adminFields: tripleToFieldObjects(d.adminFields),
      code,
      signatures,
      reviewedBy: auth.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    try {
      await db.collection('messages').add({
        fromUid: auth.uid,
        fromLabel: 'Administrator',
        toUid: data.createdBy,
        toLabel: data.createdByLabel || data.createdByRole,
        body: 'Your document "' + data.opts.title + '" (' + data.opts.receiptNo + ') is signed — you can download it now.',
        urgency: 'important',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [auth.uid],
        pendingSignoffId: id,
      });
      await sendUrgentPush(admin, db, [data.createdBy], 'Your document is signed', 'The administrator approved "' + data.opts.title + '" — you can download it now.', { pendingSignoffId: id });
    } catch (e) {
      logger.error('approveReceiptSignoff notify failed', e);
    }

    return { ok: true };
  });

  // Team member: doesn't wait, and finalizes with just their own signature.
  // Allowed any time — the only thing checked here, fresh, never trusted
  // from the client, is that this particular request isn't mandatory. A
  // withdrawal receipt can never be skipped no matter what the client
  // sends, even from a stale or tampered copy of the app.
  const skipReceiptSignoff = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const d = request.data || {};
    const id = String(d.id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Missing request.');
    // The app calls signReceipt itself first (with just this person's own
    // fields) to get this code, the same way the ordinary single-signer
    // flow always has — stored here so the finished, single-signature
    // receipt can be reconstructed and shown again later (e.g. reopened
    // from Messages), not just in the moment it was skipped.
    const code = String(d.code || '').trim().toUpperCase();
    if (!code) throw new HttpsError('invalid-argument', 'Missing verification code.');

    const ref = db.collection('pendingSignoffs').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'That request no longer exists.');
    const data = snap.data();
    if (data.createdBy !== auth.uid) throw new HttpsError('permission-denied', "That isn't your request.");
    if (data.status !== 'pending') throw new HttpsError('failed-precondition', 'That request was already ' + data.status + '.');
    if (data.mandatory) throw new HttpsError('permission-denied', "This document needs the administrator's signature — it can't be skipped.");

    await ref.set({ status: 'skipped', code, skippedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    try {
      await db.collection('messages').add({
        fromUid: auth.uid,
        fromLabel: data.createdByLabel,
        toUid: data.adminUid,
        toLabel: 'Administrator',
        body: data.createdByLabel + ' signed "' + data.opts.title + '" (' + data.opts.receiptNo + ') and sent it on without waiting for your signature.',
        urgency: 'urgent',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [auth.uid],
        pendingSignoffId: id,
      });
      await sendUrgentPush(admin, db, [data.adminUid], 'Signed without your approval', data.createdByLabel + ' skipped waiting for your signature — you were marked away.', { urgency: 'urgent', pendingSignoffId: id });
    } catch (e) {
      logger.error('skipReceiptSignoff notify failed', e);
    }

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
    const replyToId = d.replyTo ? String(d.replyTo).slice(0, 200) : null;
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

    // A reply carries a quoted snippet of the original message, resolved
    // here (not trusted from the client) so it can't be faked. Silently
    // dropped (not an error) if the original is gone or the caller couldn't
    // see it — the reply itself still sends fine either way.
    let replyMeta = null;
    if (replyToId) {
      const origSnap = await db.collection('messages').doc(replyToId).get();
      if (origSnap.exists) {
        const orig = origSnap.data();
        const canSeeOrig = isAdmin || orig.fromUid === auth.uid || orig.toUid === auth.uid || orig.toUid === 'all';
        if (canSeeOrig) {
          replyMeta = {
            replyTo: replyToId,
            replyToFromLabel: orig.fromLabel || null,
            replyToSnippet: String(orig.body || '').slice(0, 160),
          };
        }
      }
    }

    await db.collection('messages').add(Object.assign({
      fromUid: auth.uid,
      fromLabel,
      toUid: to,
      toLabel,
      body,
      urgency,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      readBy: [auth.uid],
    }, replyMeta || {}));

    // Urgent messages also get a real push notification (via Firebase
    // Cloud Messaging), so they can reach someone even with the app fully
    // closed — not just backgrounded. Best-effort: if this fails for any
    // reason (no VAPID key configured yet, nobody has a token, etc.) the
    // message itself has already sent fine either way, so a failure here
    // must never surface as an error to the sender.
    if (urgency === 'urgent') {
      try {
        var targetUids = [];
        if (to === 'all') {
          var usersSnap = await db.collection('users').get();
          targetUids = usersSnap.docs.map(function (d) { return d.id; }).filter(function (uid) { return uid !== auth.uid; });
        } else {
          targetUids = [to];
        }
        await sendUrgentPush(admin, db, targetUids, 'Urgent — ' + fromLabel, body, { urgency: 'urgent' });
      } catch (e) {
        logger.error('Urgent push send failed', e);
      }
    }

    return { ok: true };
  });

  // A device calls this once it has permission and an FCM registration
  // token, so urgent messages can reach it as a real push notification even
  // when the app/browser is fully closed. Tokens are just stored in an
  // array on the caller's own users/{uid} doc — dead ones get pruned
  // automatically above whenever a send to them fails.
  const registerPushToken = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAuth(request);
    const token = String((request.data && request.data.token) || '').trim();
    if (!token) throw new HttpsError('invalid-argument', 'Missing token.');
    await db.collection('users').doc(auth.uid).set({ fcmTokens: admin.firestore.FieldValue.arrayUnion(token) }, { merge: true });
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
    requestReceiptSignoff, approveReceiptSignoff, skipReceiptSignoff,
    sendMessage, markMessageRead, registerPushToken,
  };
};

module.exports.JOB_TITLES = JOB_TITLES;
module.exports.JOB_TITLE_LABELS = JOB_TITLE_LABELS;
