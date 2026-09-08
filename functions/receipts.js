// Receipt signing & verification — makes a downloaded receipt hard to
// quietly edit and pass off as genuine.
//
// How it works: right before a receipt is shown for printing, the app
// sends the exact numbers that will appear on it (amount, date, item,
// buyer, who signed, etc.) to `signReceipt`, which combines them with a
// private key that only lives on this server (never in the app, never in
// the GitHub repo) and returns a short code. That code gets printed on the
// receipt alongside the numbers. Anyone holding the paper later can open
// "Verify a receipt" in the app, type the numbers exactly as printed plus
// that code, and `verifyReceipt` recomputes the same code from scratch —
// if even one digit on the paper was changed after printing, the
// recomputed code won't match, and verification fails. Nobody without the
// server's private key can compute a matching code for numbers they made
// up, which is what makes this different from just trusting the PDF.
//
// This does NOT stop someone from editing the paper — it stops an edited
// paper from checking out as genuine.

const crypto = require('crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { timingSafeStringEqual } = require('./cryptoHelpers');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth;
}

// Fields are sent as an ordered list of [label, value] pairs — order and
// exact text matter, since the canonical string built from them is what
// actually gets signed. The same fields (same order, same text) must be
// given to verifyReceipt as were given to signReceipt originally, or the
// codes won't match even though nothing was really altered.
function canonicalPayload(fields) {
  return fields.map((f) => `${f[0]}=${f[1] == null ? '' : f[1]}`).join('|');
}

function computeCode(secret, payload) {
  const raw = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/[+/=]/g, '')
    .toUpperCase();
  const code = raw.slice(0, 10);
  return code.slice(0, 5) + '-' + code.slice(5, 10);
}

function validateFields(fields) {
  if (!Array.isArray(fields) || !fields.length) {
    throw new HttpsError('invalid-argument', 'Missing receipt fields.');
  }
  if (fields.length > 40) throw new HttpsError('invalid-argument', 'Too many fields.');
  for (const f of fields) {
    if (!Array.isArray(f) || f.length !== 2) {
      throw new HttpsError('invalid-argument', 'Malformed field.');
    }
    if (String(f[0]).length > 60 || String(f[1] == null ? '' : f[1]).length > 800) {
      throw new HttpsError('invalid-argument', 'A field is too long.');
    }
  }
}

// admin/db: the usual Admin SDK handles. secretRef: the RECEIPT_SIGNING_SECRET
// defineSecret() object from index.js (secrets are declared centrally there,
// same convention as the M-Pesa ones).
module.exports = function (admin, db, secretRef) {
  function secretValue() {
    return (secretRef.value() || '').trim();
  }

  const signReceipt = onCall({ region: 'us-central1', secrets: [secretRef] }, async (request) => {
    const auth = requireAuth(request);
    const fields = request.data && request.data.fields;
    validateFields(fields);
    const secret = secretValue();
    if (!secret) {
      throw new HttpsError(
        'failed-precondition',
        "Receipt signing isn't set up yet — see SETUP-RECEIPTS.md. The receipt still works, just without a verification code until then."
      );
    }
    const code = computeCode(secret, canonicalPayload(fields));
    // A running log of every receipt ever signed — administrator-only,
    // this IS the accountability trail: who generated a receipt, exactly
    // what it said, and when, independent of any copy that gets printed
    // or handed out afterward.
    await db.collection('receiptLog').add({
      fields,
      code,
      signedByUid: auth.uid,
      signedByEmail: (auth.token && auth.token.email) || null,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { code };
  });

  const verifyReceipt = onCall({ region: 'us-central1', secrets: [secretRef] }, async (request) => {
    requireAuth(request);
    const fields = request.data && request.data.fields;
    validateFields(fields);
    const code = String((request.data && request.data.code) || '')
      .trim()
      .toUpperCase();
    if (!code) throw new HttpsError('invalid-argument', 'Missing code.');
    const secret = secretValue();
    if (!secret) {
      throw new HttpsError('failed-precondition', "Receipt signing isn't set up yet.");
    }
    const expected = computeCode(secret, canonicalPayload(fields));
    return { valid: timingSafeStringEqual(expected, code) };
  });

  return { triggers: { signReceipt, verifyReceipt } };
};
