// Run this ONCE per environment, after `firebase deploy --only functions`
// has given you your real function URLs:
//
//   cd functions
//   npm install
//   copy c2b.env.example c2b.env      (fill in the real values)
//   npm run register-c2b
//
// This tells Safaricom where to send a webhook whenever someone pays your
// Till/Paybill directly. You do not need to run this for the "Add via
// M-Pesa" (STK Push) flow — only for automatic detection of payments other
// people make on their own.
//
// IMPORTANT: this reads from "c2b.env", not ".env" — Firebase's own deploy
// step auto-loads any file literally named ".env" (or ".env.<project-id>")
// in this folder as real Cloud Functions environment variables, which
// collides with the secrets of the same name and breaks deployment. Keeping
// this file's name off that pattern means it's only ever read by this
// script, never by `firebase deploy`.
require('dotenv').config({ path: require('path').join(__dirname, 'c2b.env') });
const { registerC2BUrls } = require('./daraja');

function env(name, fallback) {
  return String(process.env[name] || fallback || '').trim();
}

async function main() {
  const envName = env('MPESA_ENV', 'sandbox');
  const base = env('MPESA_CALLBACK_BASE_URL');
  const shortcode = env('MPESA_SHORTCODE');
  const consumerKey = env('MPESA_CONSUMER_KEY');
  const consumerSecret = env('MPESA_CONSUMER_SECRET');
  if (!base || !shortcode || !consumerKey || !consumerSecret) {
    console.error('Fill in functions/c2b.env first — see c2b.env.example.');
    process.exit(1);
  }
  const webhookSecret = env('MPESA_WEBHOOK_SECRET', '');
  const qs = webhookSecret ? ('?key=' + encodeURIComponent(webhookSecret)) : '';
  if (!webhookSecret) {
    console.warn('MPESA_WEBHOOK_SECRET is blank in c2b.env — registering WITHOUT the extra protection. See SETUP-SECURITY.md.');
  }
  // Printed loudly on purpose: this file's MPESA_ENV is separate from the
  // deployed app's MPESA_ENV secret — it's easy to fill this file in once,
  // leave it on "sandbox" from the .example default, and never notice,
  // which registers these URLs with Safaricom's sandbox system while real
  // customers pay through production. Nothing calls this back, ever, and
  // there's no error to find — it just silently never arrives.
  console.log(`Registering against Safaricom ${envName.toUpperCase()} for shortcode ${shortcode}.`);
  if (envName !== 'production') {
    console.warn('MPESA_ENV in c2b.env is NOT "production" — if your till is live, this registration will not receive real customer payments. Set MPESA_ENV=production in c2b.env and re-run this if that\'s not intentional.');
  }
  const result = await registerC2BUrls({
    env: envName,
    consumerKey,
    consumerSecret,
    shortcode,
    confirmationUrl: base + '/c2bConfirmation' + qs,
    validationUrl: base + '/c2bValidation' + qs,
  });
  console.log('C2B URLs registered:', result);
}

main().catch((err) => { console.error(err); process.exit(1); });
