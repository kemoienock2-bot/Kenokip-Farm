// Shared "send a real push notification to some accounts" helper — used by
// an Urgent team message (roles.js's sendMessage) and by a Finance
// security alert (financeGuard.js). One implementation means a dead FCM
// token gets pruned the same way everywhere, and a change to how pushes are
// sent only has to happen in one place.
//
// Best-effort by design: every caller wraps this in try/catch (or it's the
// only thing happening in an already-best-effort branch) — a push failing
// to send (no VAPID key yet, nobody has a token, FCM hiccup) must never
// surface as an error to whoever triggered it. The thing that actually
// matters (the message itself, or the security event log) has already been
// written before this runs.
const logger = require('firebase-functions/logger');

async function sendUrgentPush(admin, db, uids, title, body, data) {
  if (!uids || !uids.length) return;
  const refs = uids.map(function (uid) { return db.collection('users').doc(uid); });
  const userDocs = await db.getAll.apply(db, refs);
  const tokens = [];
  const tokenOwner = {};
  userDocs.forEach(function (snap) {
    if (!snap.exists) return;
    const arr = snap.data().fcmTokens;
    if (Array.isArray(arr)) arr.forEach(function (t) { tokens.push(t); tokenOwner[t] = snap.id; });
  });
  if (!tokens.length) return;
  const resp = await admin.messaging().sendEachForMulticast({
    tokens: tokens,
    notification: { title: title, body: String(body || '').slice(0, 180) },
    data: Object.assign({ urgency: 'urgent' }, data || {}),
  });
  const deadByUid = {};
  resp.responses.forEach(function (r, i) {
    if (!r.success) {
      const code = r.error && r.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        const uid = tokenOwner[tokens[i]];
        (deadByUid[uid] = deadByUid[uid] || []).push(tokens[i]);
      }
    }
  });
  await Promise.all(Object.keys(deadByUid).map(function (uid) {
    return db.collection('users').doc(uid).set(
      { fcmTokens: admin.firestore.FieldValue.arrayRemove.apply(null, deadByUid[uid]) },
      { merge: true }
    );
  })).catch(function (e) { logger.error('Dead FCM token prune failed', e); });
}

module.exports = { sendUrgentPush };
