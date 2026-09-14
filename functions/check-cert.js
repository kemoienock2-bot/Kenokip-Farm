// Checks (and, where possible, fixes) a Safaricom B2C certificate file
// before you set it as the MPESA_B2C_CERT secret — so you find out it's
// broken here, instead of from a "Could not send the payout" error later.
//
// Usage (from the functions folder, in cmd.exe):
//   node check-cert.js "C:\path\to\the\certificate\file\you\got\from\Safaricom"
//
// This never sends anything anywhere and never asks for your Initiator
// password — it only reads the certificate file you point it at, which is
// Safaricom's PUBLIC certificate (not a secret) so it's safe to double
// check like this.

const fs = require('fs');
const crypto = require('crypto');

const inPath = process.argv[2];
if (!inPath) {
  console.error('Usage: node check-cert.js <path-to-certificate-file>');
  process.exit(1);
}

function testPem(pemText) {
  crypto.publicEncrypt(
    { key: pemText, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from('just-checking-the-certificate-works')
  );
}

const raw = fs.readFileSync(inPath);
console.log(`Checking "${inPath}" (${raw.length} bytes)...\n`);

// 1) Try it exactly as it is right now.
try {
  testPem(raw.toString('utf8'));
  console.log('This certificate works as-is. Use this exact file with:');
  console.log(`  firebase functions:secrets:set MPESA_B2C_CERT --data-file "${inPath}"`);
  process.exit(0);
} catch (e) {
  console.log('Not usable as-is (' + e.message + ') — checking why...\n');
}

// 2) Maybe it's a real binary (DER) certificate file, not text — Safaricom
// sometimes issues these as an actual .cer file rather than pasteable text.
try {
  const x509 = new crypto.X509Certificate(raw);
  const pem = x509.toString();
  testPem(pem);
  const outPath = inPath.replace(/\.[^.\\/]+$/, '') + '-fixed.pem';
  fs.writeFileSync(outPath, pem);
  console.log('Found it: this was a binary certificate file, not text.');
  console.log('A corrected, working copy was saved to:');
  console.log('  ' + outPath);
  console.log('Use THAT file instead:');
  console.log(`  firebase functions:secrets:set MPESA_B2C_CERT --data-file "${outPath}"`);
  process.exit(0);
} catch (e) {
  // Not a raw binary certificate either — keep trying.
}

// 3) Maybe only the base64 body was copied, without the
// -----BEGIN/END CERTIFICATE----- lines around it (an easy mistake when
// copying from an email or a portal page).
const asText = raw.toString('utf8');
const bodyOnly = asText.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s+/g, '');
if (/^[A-Za-z0-9+/=]+$/.test(bodyOnly) && bodyOnly.length > 100) {
  const wrapped = bodyOnly.match(/.{1,64}/g).join('\n');
  const pem = `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`;
  try {
    testPem(pem);
    const outPath = inPath.replace(/\.[^.\\/]+$/, '') + '-fixed.pem';
    fs.writeFileSync(outPath, pem);
    console.log('Found it: this file was missing its -----BEGIN/END CERTIFICATE----- lines.');
    console.log('A corrected, working copy was saved to:');
    console.log('  ' + outPath);
    console.log('Use THAT file instead:');
    console.log(`  firebase functions:secrets:set MPESA_B2C_CERT --data-file "${outPath}"`);
    process.exit(0);
  } catch (e) {
    // fall through to the final message
  }
}

console.log('Could not automatically fix this file — it may be truncated, the');
console.log('wrong file, or corrupted some other way. Please re-download the');
console.log('certificate fresh from Safaricom/Daraja (see SETUP-B2C.md) and run');
console.log('this check again on the fresh download before setting the secret.');
process.exit(1);
