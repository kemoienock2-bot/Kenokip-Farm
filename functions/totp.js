// Minimal TOTP (RFC 6238) implementation — the same kind of 6-digit code
// Google Authenticator, Authy, and similar apps generate every 30 seconds.
// Written by hand against the RFC using only Node's built-in `crypto`
// module, deliberately avoiding a third-party npm package here — this
// project has already run into enough flaky-network trouble deploying as
// it is, and this algorithm is small and fully specified, so there's
// nothing an external library buys us that's worth one more thing that can
// fail to install.

const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// A fresh 160-bit secret (the standard length for SHA-1 TOTP), base32
// encoded the way every authenticator app expects to receive it.
function randomBase32Secret(byteLength) {
  const bytes = crypto.randomBytes(byteLength || 20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let secret = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return secret;
}

function base32Decode(base32) {
  const clean = String(base32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

// HOTP per RFC 4226 — a 6-digit code derived from a secret + a counter.
function hotp(secretBuffer, counter) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter % 0x100000000, 4);
  const hmac = crypto.createHmac('sha1', secretBuffer).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return code % 1000000;
}

function totpStep(nowMs, stepSeconds) {
  return Math.floor((nowMs || Date.now()) / 1000 / (stepSeconds || 30));
}

// Checks a 6-digit code against a base32 secret, allowing the step before
// and after the current one too (clock drift, or the code changing right as
// someone finishes typing it). Returns the matched time-step number on
// success (used for one-time-use replay protection) or null on failure.
function verifyTotp(base32Secret, code, opts) {
  opts = opts || {};
  const cleanCode = String(code || '').replace(/\D/g, '');
  if (cleanCode.length !== 6) return null;
  const secretBuffer = base32Decode(base32Secret);
  const currentStep = totpStep(opts.now, opts.stepSeconds);
  const window = opts.window == null ? 1 : opts.window;
  for (let drift = -window; drift <= window; drift++) {
    const step = currentStep + drift;
    if (String(hotp(secretBuffer, step)).padStart(6, '0') === cleanCode) return step;
  }
  return null;
}

// An otpauth:// URI — most authenticator apps can also scan this as a QR
// code if you turn it into one yourself, though this app just shows the
// raw secret for manual entry (no QR library included here).
function otpauthUri({ secret, accountLabel, issuer }) {
  const label = encodeURIComponent(`${issuer || 'Kenokip Farm'}:${accountLabel || ''}`);
  const params = new URLSearchParams({
    secret,
    issuer: issuer || 'Kenokip Farm',
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

module.exports = { randomBase32Secret, verifyTotp, otpauthUri };
