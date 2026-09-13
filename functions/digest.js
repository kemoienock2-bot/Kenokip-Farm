// Kenokip Farm — weekly digest push notification.
//
// Every Monday morning (Africa/Nairobi time), this reads the single farm
// document the app itself writes to (farms/kenokip — same doc, same shape
// as the in-app `state` object) and works out last week's totals the exact
// same way the app's own Overview page does: eggs collected, income, and
// expenses, each filtered by ISO date string. It then broadcasts one
// message (so it shows up in Messages like anything else) and a real push
// notification (so it reaches a closed app too), the same
// broadcast-to-everyone pattern notifyHatch already uses.
//
// Best-effort throughout: a failure here is a missed digest, never
// something that should ever page anyone or block anything else — there's
// no user-facing action waiting on this function succeeding.
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const { sendUrgentPush } = require('./push');

const FARM_COLLECTION = 'farms';
const FARM_DOC = 'kenokip';

// Formats a Date as a Nairobi-local YYYY-MM-DD string — 'en-CA' is just a
// convenient locale whose short date format already happens to be ISO.
function nairobiISO(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(date);
}
function addDaysISO(iso, n) {
  var d = new Date(iso + 'T12:00:00Z'); // noon UTC — clear of any DST/rounding edge
  d.setUTCDate(d.getUTCDate() + n);
  return nairobiISO(d);
}
function inRange(iso, s, e) { return iso >= s && iso <= e; }
function sumEggs(eggs, s, e) { return (eggs || []).filter(function (x) { return inRange(x.date, s, e); }).reduce(function (a, x) { return a + (x.total || 0); }, 0); }
function sumMoney(list, s, e) { return (list || []).filter(function (x) { return inRange(x.date, s, e); }).reduce(function (a, x) { return a + (x.amount || 0); }, 0); }

// Mirrors the app's own currency formatting closely enough for a push
// notification / message body (KES is the overwhelmingly common case here,
// and the app's own display-currency conversion needs live rates this
// backend function has no reason to fetch) — shown with the KES symbol and
// thousands separators, e.g. "KSh 12,400".
function fmtKES(n) {
  return 'KSh ' + Math.round(n || 0).toLocaleString('en-US');
}

module.exports = function (admin, db) {
  const weeklyDigest = onSchedule(
    { schedule: '0 7 * * 1', timeZone: 'Africa/Nairobi', region: 'us-central1' },
    async () => {
      try {
        const snap = await db.collection(FARM_COLLECTION).doc(FARM_DOC).get();
        if (!snap.exists) { logger.info('weeklyDigest: no farm document yet, skipping.'); return; }
        const state = snap.data() || {};

        // "Yesterday" (Sunday, Nairobi time) is the end of the week that
        // just finished; 6 days before that is its Monday.
        const endISO = addDaysISO(nairobiISO(new Date()), -1);
        const startISO = addDaysISO(endISO, -6);

        const eggs = sumEggs(state.eggs, startISO, endISO);
        const income = sumMoney(state.incomes, startISO, endISO);
        const expenses = sumMoney(state.expenses, startISO, endISO);
        const net = income - expenses;

        if (eggs === 0 && income === 0 && expenses === 0) {
          logger.info('weeklyDigest: nothing recorded last week, skipping send.');
          return;
        }

        const body = 'This week: ' + eggs.toLocaleString() + ' eggs, ' + fmtKES(income) + ' income, ' + fmtKES(expenses) + ' expenses ('
          + (net >= 0 ? '+' : '−') + fmtKES(Math.abs(net)) + ' net).';

        const usersSnap = await db.collection('users').get();
        const allUids = usersSnap.docs.map(function (d) { return d.id; });
        if (!allUids.length) return;

        try {
          await db.collection('messages').add({
            fromUid: 'system',
            fromLabel: 'Weekly digest',
            toUid: 'all',
            toLabel: 'Everyone',
            body,
            urgency: 'normal',
            kind: 'digest', // picks a calm, non-alarming presentation client-side
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readBy: [],
          });
        } catch (e) {
          logger.error('weeklyDigest message write failed', e);
        }

        try {
          await sendUrgentPush(admin, db, allUids, '📊 Weekly digest', body, { urgency: 'normal', kind: 'digest' });
        } catch (e) {
          logger.error('weeklyDigest push send failed', e);
        }
      } catch (e) {
        logger.error('weeklyDigest failed', e);
      }
    }
  );

  return { weeklyDigest };
};
