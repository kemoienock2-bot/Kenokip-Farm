# Detecting direct payments to the Paybill (like the Till already does)

## What this adds

Right now, if someone pays your **Till** directly from their own phone
(not through the app), it shows up automatically in Finance — that's the
existing C2B webhook. This update extends the exact same detection to the
**Paybill** (1307475): pay it directly, and it shows up in Finance too,
labeled separately so you can tell the two apart.

This is different from, and doesn't touch, the "Add via M-Pesa" /
"Send via M-Pesa" flows, or the Paybill-STK update from before — all of
those still work exactly as they did.

## Why Till payments default to "Egg Sales" but Paybill ones don't

The Till has always defaulted every direct payment to an egg sale (dividing
the amount by the per-egg price), since that's what customers mostly pay
it for. The Paybill doesn't have one obvious "usual" reason people would
pay it directly, so a Paybill payment is logged as plain income with no
forced category — you (or Financial Staff) categorize it afterward on the
Income page, same as you always could for any entry.

## How Finance labels each one

- Till, via the app ("Add via M-Pesa"): *M-Pesa (sent from the app)*
- Till, paid directly: *M-Pesa (paid directly to the Till)*
- Paybill, via the app: *M-Pesa (sent from the app, Paybill)* — from the
  earlier Paybill-STK update
- Paybill, paid directly: *M-Pesa (paid directly to the Paybill)* — new,
  this update

## What you need to do

Registering C2B for the Paybill is exactly the same shape as registering
it for the Till was — just a second run of the same kind of command,
against the Paybill's own credentials, which Safaricom requires be
separate from the Till's:

```
cd functions
npm run register-c2b-paybill
```

Make sure `functions/c2b.env`'s **Payouts (Paybill)** section has real
values first — `MPESA_PAYOUT_CONSUMER_KEY`, `MPESA_PAYOUT_CONSUMER_SECRET`,
and `MPESA_PAYOUT_SHORTCODE` (already `1307475`). It reuses the same
`MPESA_CALLBACK_BASE_URL`, `MPESA_ENV`, and `MPESA_WEBHOOK_SECRET` already
in that file from setting up the Till's registration.

**Important — this can only be done once, same as the Till was.**
Safaricom's registration call only succeeds the first time for a given
shortcode; if the Paybill already has *any* Confirmation/Validation URLs on
file (even from something else, even old ones), this will fail with
"already registered" — the script will tell you plainly if that happens,
and the fix is contacting Safaricom/Daraja support to have them update it
manually to the URLs the script prints out. That's expected, not a bug.

## Deploying the code side

```
git add functions/index.js functions/registerC2BUrls.js functions/package.json functions/c2b.env.example app.js HOW-TO-ENABLE-PAYBILL-C2B.md
git commit -m "Detect direct Paybill payments, same as the Till already does"
git push
firebase deploy --only functions
```

## Testing it

Once registered and deployed, have someone pay a small amount straight to
Paybill 1307475 from their own phone (not through the app) and confirm it
shows up in Finance labeled "M-Pesa (paid directly to the Paybill)" with no
category forced on it.
