// Run this ONCE per environment, after `firebase deploy --only functions`
// has given you your real function URLs:
//
//   cd functions
//   npm install
//   cp .env.example .env      (fill in the real values)
//   npm run register-c2b
//
// This tells Safaricom where to send a webhook whenever someone pays your
// Till/Paybill directly. You do not need to run this for the "Add via
// M-Pesa" (STK Push) flow — only for automatic detection of payments other
// people make on their own.
require('dotenv').config();
const { registerC2BUrls } = require('./daraja');

async function main() {
  const env = process.env.MPESA_ENV || 'sandbox';
  const base = process.env.MPESA_CALLBACK_BASE_URL;
  const shortcode = process.env.MPESA_SHORTCODE;
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!base || !shortcode || !consumerKey || !consumerSecret) {
    console.error('Fill in functions/.env first — see .env.example.');
    process.exit(1);
  }
  const result = await registerC2BUrls({
    env,
    consumerKey,
    consumerSecret,
    shortcode,
    confirmationUrl: base + '/mpesaC2BConfirmation',
    validationUrl: base + '/mpesaC2BValidation',
  });
  console.log('C2B URLs registered:', result);
}

main().catch((err) => { console.error(err); process.exit(1); });
