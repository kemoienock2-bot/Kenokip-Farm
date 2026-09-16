// Stand-alone Account Balance test — lets you try a real "Check M-Pesa
// balance" call directly from your terminal and see Safaricom's FULL raw
// response immediately, without going through the whole app + Cloud
// Functions round trip.
//
// This is the fastest way to isolate a "the initiator information is
// invalid" error: it hits Safaricom with exactly the InitiatorName +
// SecurityCredential you give it and prints back exactly what Safaricom
// says, so you can tell in one run whether it's the name, the credential,
// or the environment (sandbox vs production) that's mismatched.
//
// Nothing you type here is saved to any file — it only lives in memory for
// this one run, then it's gone, same as test-b2c.js.
//
// Run from inside the functions folder:
//   node test-balance.js
//
// It reads your Consumer Key/Secret/Shortcode/Environment from c2b.env
// (the same file register-c2b.js and test-b2c.js use), then asks you to
// paste the Initiator Name and Security Credential fresh each run.

require('dotenv').config({ path: require('path').join(__dirname, 'c2b.env') });
const readline = require('readline');
const { accountBalanceQuery } = require('./daraja');

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
    console.warn('If the InitiatorName/SecurityCredential you paste below were issued for PRODUCTION, this run will');
    console.warn('fail with an initiator error even if those values are perfectly correct — that mismatch IS the bug.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const initiatorName = await ask(rl, 'Initiator Name (e.g. Enock): ');
    const securityCredential = await ask(rl, 'Security Credential (the long pasted value from "Generate Security Credential Value"): ');
    rl.close();

    if (!initiatorName || !securityCredential) {
      console.error('Both fields are required.');
      process.exit(1);
    }

    console.log('\nSending AccountBalance query (v1)...\n');
    try {
      const result = await accountBalanceQuery({
        env: envName,
        consumerKey,
        consumerSecret,
        shortcode,
        initiatorName,
        securityCredential,
        remarks: 'Kenokip Farm test balance check',
        resultUrl: `${callbackBase}/mpesaAccountBalanceResult`,
        timeoutUrl: `${callbackBase}/mpesaAccountBalanceTimeout`,
      });
      console.log('SUCCESS — Safaricom accepted the request:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\nThe actual balance figures arrive a few seconds later at your ResultURL — check the app or Cloud Logs for mpesaaccountbalanceresult shortly.');
    } catch (err) {
      console.log('FAILED — Safaricom rejected the request:');
      console.log(err.message);
      if (/initiator information is invalid/i.test(err.message)) {
        console.log('\nThis means Safaricom itself doesn\'t recognize this InitiatorName + SecurityCredential pair');
        console.log('for this shortcode/environment. Most likely causes, in order of likelihood:');
        console.log('  1. InitiatorName is misspelled or wrong case vs. what\'s set up on the Org Portal.');
        console.log('  2. The SecurityCredential was generated for the OTHER environment (sandbox vs production)');
        console.log(`     than the one this test just ran against (${envName.toUpperCase()}).`);
        console.log('  3. The initiator\'s password was changed on the portal after this SecurityCredential was');
        console.log('     generated — go back to "Generate Security Credential Value" and make a fresh one.');
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
