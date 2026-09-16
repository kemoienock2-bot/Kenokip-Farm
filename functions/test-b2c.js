// Stand-alone B2C test — lets you try a real "Send via M-Pesa" call directly
// from your terminal, and see Safaricom's FULL raw response immediately,
// without going through the whole app + Cloud Functions round trip.
//
// Nothing you type here is saved to any file — it only lives in memory for
// this one run, then it's gone. That's on purpose: after the GitGuardian
// alert, the safest way to test is to never write a secret to disk at all.
//
// Run from inside the functions folder:
//   node test-b2c.js
//
// It reads your Consumer Key/Secret/Shortcode/Environment from c2b.env
// (the same file register-c2b.js uses — not sensitive enough on its own to
// re-type each time), then asks you to paste the Initiator Name and
// Security Credential fresh each run.

require('dotenv').config({ path: require('path').join(__dirname, 'c2b.env') });
const readline = require('readline');
const { b2cSend } = require('./daraja');

function env(name, fallback) {
  return String(process.env[name] || fallback || '').trim();
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

async function main() {
  const envName = env('MPESA_ENV', 'sandbox');
  const shortcode = env('MPESA_SHORTCODE');
  const consumerKey = env('MPESA_CONSUMER_KEY');
  const consumerSecret = env('MPESA_CONSUMER_SECRET');
  const callbackBase = env('MPESA_CALLBACK_BASE_URL');
  if (!shortcode || !consumerKey || !consumerSecret || !callbackBase) {
    console.error('Fill in functions/c2b.env first (Consumer Key/Secret, Shortcode, Callback Base URL) — see c2b.env.example.');
    process.exit(1);
  }
  console.log(`Testing against Safaricom ${envName.toUpperCase()} for shortcode ${shortcode}.`);
  if (envName !== 'production') {
    console.warn('MPESA_ENV in c2b.env is not "production" — this will hit the sandbox API, not your real till.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const initiatorName = await ask(rl, 'Initiator Name (e.g. Enock): ');
    const securityCredential = await ask(rl, 'Security Credential (the long pasted value from "Generate Security Credential Value"): ');
    const phone = await ask(rl, 'Recipient phone (e.g. 254712345678): ');
    const amountRaw = await ask(rl, 'Amount in KES (e.g. 10): ');
    rl.close();

    const amount = Number(amountRaw);
    if (!initiatorName || !securityCredential || !phone || !amount) {
      console.error('All fields are required.');
      process.exit(1);
    }

    console.log('\nSending B2C paymentrequest (v3)...\n');
    try {
      const result = await b2cSend({
        env: envName,
        consumerKey,
        consumerSecret,
        shortcode,
        initiatorName,
        securityCredential,
        phone,
        amount,
        remarks: 'Kenokip Farm test send',
        resultUrl: `${callbackBase}/mpesaB2CResult`,
        timeoutUrl: `${callbackBase}/mpesaB2CTimeout`,
      });
      console.log('SUCCESS — Safaricom accepted the request:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\nThe real outcome (whether the money actually lands) arrives a few seconds later at your ResultURL — check the app or Cloud Logs for mpesab2cresult shortly.');
    } catch (err) {
      console.log('FAILED — Safaricom rejected the request:');
      console.log(err.message);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
