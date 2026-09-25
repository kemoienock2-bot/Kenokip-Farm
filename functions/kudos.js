// Kenokip Farm — team recognition ("Kudos"): a congratulations message,
// with an optional reward note, sent to one team member or the whole team
// at once. Administrator/Co-Administrator only — the same trust level
// sendMessage (roles.js) already gives that pair for messaging everyone.
//
// This is deliberately just a specially-flagged message (kind: 'kudos')
// under the hood, written to the same `messages` collection everything
// else in Messages uses — no new collection, and it shows up in that same
// inbox, with its own pill/banner treatment client-side (see
// messageKindPillHtml/renderUrgentAlert in index.html).

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const { sendUrgentPush } = require('./push');
const { roleLabelFor } = require('./roles');

function requireAdminLevel(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const auth = request.auth;
  if (auth.token.role !== 'administrator' && auth.token.role !== 'coadmin') {
    throw new HttpsError('permission-denied', 'Only the administrator or co-administrator can do this.');
  }
  return auth;
}

module.exports = function (admin, db) {
  const sendKudos = onCall({ region: 'us-central1' }, async (request) => {
    const auth = requireAdminLevel(request);
    const d = request.data || {};
    const to = String(d.to || '');
    const message = String(d.message || '').trim().slice(0, 500);
    // Free text, e.g. "A bonus in your next pay" or "An extra day off" —
    // the client offers a preset list to choose from (see
    // KUDOS_REWARD_OPTIONS in index.html) plus a custom option, but
    // whatever arrives here is just stored and shown as-is; there's no
    // actual payout mechanism behind it; that stays a real-world step the
    // administrator follows through on themselves.
    const reward = typeof d.reward === 'string' ? d.reward.trim().slice(0, 200) : '';
    if (!message) throw new HttpsError('invalid-argument', 'Write a congratulation message first.');
    if (!to) throw new HttpsError('invalid-argument', 'Choose who this is for.');
    if (to === auth.uid) throw new HttpsError('invalid-argument', "You can't send this to yourself.");

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

    const body = message + (reward ? '\n\n🎁 Reward: ' + reward : '');

    await db.collection('messages').add({
      fromUid: auth.uid,
      fromLabel,
      toUid: to,
      toLabel,
      body,
      urgency: 'urgent',
      kind: 'kudos',
      reward: reward || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      readBy: [auth.uid],
    });

    try {
      let targetUids;
      if (to === 'all') {
        const usersSnap = await db.collection('users').get();
        targetUids = usersSnap.docs.map((doc) => doc.id).filter((uid) => uid !== auth.uid);
      } else {
        targetUids = [to];
      }
      await sendUrgentPush(admin, db, targetUids, '🎉 ' + fromLabel + ' sent congratulations!', body, { urgency: 'urgent', kind: 'kudos' });
    } catch (e) {
      logger.error('sendKudos push failed', e);
    }

    return { ok: true };
  });

  return { triggers: { sendKudos } };
};
