// Shared password/PIN hashing — plain Node `crypto` (scrypt), no npm
// dependency, same reasoning as totp.js: one less thing that can fail to
// install on a flaky connection. Stored as "salt:hash", both hex.
// Used by both the Finance portal password (security.js) and each person's
// own Finance PIN (financeGuard.js) — one implementation, so both are held
// to the same standard and a future improvement only has to happen once.

const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || stored.indexOf(':') === -1) return false;
  const parts = stored.split(':');
  const salt = parts[0], hashHex = parts[1];
  const hash = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== hash.length) return false;
  return crypto.timingSafeEqual(hash, storedBuf);
}

// Constant-time comparison for short shared-secret tokens (webhook keys) —
// separate from the password hashing above since these aren't hashed at
// rest, just compared directly against a Secret Manager value.
function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a == null ? '' : a));
  const bufB = Buffer.from(String(b == null ? '' : b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { hashPassword, verifyPassword, timingSafeStringEqual };
