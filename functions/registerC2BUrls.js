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
  // As a trailing PATH segment (.../c2bConfirmation/<key>), not a query
  // string (?key=...) like the STK/B2C callback URLs use. Those work fine
  // as query strings because Safaricom is handed that exact URL fresh
  // inside each individual STK/B2C API call and just echoes it back. C2B is
  // different: registerurl STORES this URL once on Safaricom's side for the
  // whole shortcode, and that storage is widely reported to silently drop
  // everything after "?" — so a C2B webhook that keeps getting rejected
  // even once both sides definitely agree on the same secret almost always
  // means the key never arrived at all, not that it was wrong. A path
  // segment can't be silently dropped the same way — it's part of the
  // address itself — so that's what gets registered here.
  const suffix = webhookSecret ? ('/' + encodeURIComponent(webhookSecret)) : '';
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
  const confirmationUrl = base + '/c2bConfirmation' + suffix;
  const validationUrl = base + '/c2bValidation' + suffix;
  // Printed before the call (not just on failure) so you always have these
  // to hand — you'll need the exact same two URLs if Safaricom support ends
  // up updating the registration for you (see the "already registered"
  // handling below).
  console.log('Confirmation URL:', confirmationUrl);
  console.log('Validation URL:  ', validationUrl);

  try {
    const result = await registerC2BUrls({
      env: envName,
      consumerKey,
      consumerSecret,
      shortcode,
      confirmationUrl,
      validationUrl,
    });
    console.log('C2B URLs registered:', result);
  } catch (err) {
    // Safaricom's registerurl call only ever succeeds ONCE per shortcode in
    // production — a real till/paybill that already has URLs on file (even
    // old ones, even wrong ones) gets this exact error on every later
    // attempt, no matter what you're trying to change them to. There is no
    // API call that updates or clears an existing registration — Safaricom
    // has to do that on their end.
    if (/already registered/i.test(String(err && err.message))) {
      console.error('\nSafaricom says this shortcode already has C2B URLs on file, and will not let the API change them — this is expected, not a bug here.');
      console.error('Next step: contact Safaricom API/Daraja support (apisupport@safaricom.co.ke, or your Daraja portal support channel) and ask them to update the Confirmation and Validation URLs already registered for shortcode ' + shortcode + ' to the two URLs printed above.');
      console.error('Once they confirm it\'s updated, you do NOT need to run this script again for that change to take effect.');
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
