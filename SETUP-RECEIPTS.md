# Signed receipts, e-signatures & the Activity Statement — setup

This update adds an edit button to "Record loss or sale" on the Flock
page, and a real accountability upgrade to receipts: an electronic
signature drawn in the app, a verification code, a QR code, receipts for
Expenses/Feed/Health (not just flock/egg sales and Finance deposits), a
full "Activity Statement" for any date range, and a "Verify a receipt"
checker. Most of it works the moment you deploy — one manual step (setting
the signing secret) is what actually turns the verification code on, and
it's safe to skip for now if you want to come back to it later; receipts
still print fine without it, just without a code.

## An honest read on what this does and doesn't protect against

Worth saying plainly, since the whole point of this update was reducing
how easy it is to forge a receipt:

- **A printed or downloaded receipt can still be edited.** Anyone with
  image or PDF editing software can change numbers on a paper or a PDF —
  nothing stops that, and no app can fully stop that once something is
  printed.
- **What this DOES stop is an edited receipt checking out as genuine.**
  The verification code is computed on the server from the receipt's
  exact numbers, combined with a private key that lives only there —
  never in the app, never in the GitHub repo, never visible to anyone
  including you unless you go looking at the Firebase secret directly.
  Change even one digit after the fact, and recomputing the code from the
  altered numbers gives a different result. "Verify a receipt" catches
  that immediately.
- **The signature proves who generated the receipt, not who the money
  came from.** Drawing a signature confirms "I, the person signed in,
  generated this receipt with these numbers" — it's bound into the
  verification code the same way the numbers are, so a receipt can't be
  re-printed later with a different signature glued on and still check
  out.
- **This is about your own paperwork, not about catching M-Pesa fraud or
  buyer disputes.** It answers "did someone quietly change a receipt
  after it was made" — a real, common way small-business receipts get
  disputed — not "did the buyer actually pay".

## What needs a deploy

This one touches the backend in three ways: a new Cloud Function file, a
new Firestore collection, and (optionally) a new secret.

```
cd functions
npm install
cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
```

- `firebase deploy --only functions` uploads the two new functions,
  `signReceipt` and `verifyReceipt` (in `functions/receipts.js`).
- `firebase deploy --only firestore:rules` publishes the new `receiptLog`
  collection's rules — an administrator-only audit trail of every receipt
  ever signed (who, when, and exactly what it said), which only
  `signReceipt` itself can write to.

Both are safe to run even before the secret (below) is set — receipts
just won't have a verification code yet.

## One manual step: the signing secret

This is the private key mentioned above. Nothing about signing or
verifying works without it (receipts still print — just marked "no
verification code" until this is done).

1. Pick a long random value — anything works, e.g. run this once and copy
   the result:
   ```
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Set it as a Firebase secret (same way the M-Pesa and Finance-security
   ones were set up):
   ```
   firebase functions:secrets:set RECEIPT_SIGNING_SECRET
   ```
   Paste the value when prompted.
3. Deploy functions once more so the new secret actually takes effect:
   ```
   firebase deploy --only functions
   ```

From this point on, every "Sign & download" gets a real verification code
and QR code, and "Verify a receipt" can check them.

**If you ever suspect this secret has leaked** (e.g. it ended up
somewhere it shouldn't have), rotate it by repeating steps 1–3 with a new
random value. Every receipt signed with the OLD secret will then fail
verification — including genuine ones — so only do this if you actually
suspect a leak, and keep a note of when you rotated it.

## How to use the new features

**Editing a flock removal/sale.** Flock → the batch's History → the
pencil icon next to any entry (a re-sexing split has no pencil, since
that's not really a "loss" — undo it from the batch it created instead).
Works exactly like editing an egg loss already did: change the count,
date, buyer, amount, reason, or note, and the linked Income entry (if
any) is added, updated, or removed to match.

**Downloading a signed receipt.** Click the receipt icon next to any
flock sale, egg sale, Finance deposit, expense, feed log, or health
record. You'll see a preview first — check the numbers are right — then
"Sign & download" asks you to draw your signature (mouse or finger) on a
small pad. After that, the final receipt appears with your signature, a
verification code, and a QR code, ready to print or "Save as PDF".

**Generating an Activity Statement.** Reports page → "Generate Activity
Statement" → pick a date range → preview → sign it the same way as a
single receipt. It bundles everything that happened in that period —
Flock, Eggs, Feed, Health, Expenses, Income, and Finance if you can see
it — into one document, with the same signature/code/QR treatment at the
end.

**Verifying a receipt.** Reports page → "Verify a receipt" → paste the
text printed under "Verification code" on the paper (or scan its QR code,
which fills the box in for you) → "Check now". You'll see a clear ✓
genuine or ✗ doesn't match result, plus the exact details it checked
against.

## What this doesn't cover yet

- The verification code and QR only prove a receipt matches what was
  originally signed — they don't (and can't) prove the underlying sale or
  payment itself really happened. That's still down to your own
  record-keeping and judgement.
- There's no way yet to look up "every receipt signed this month" from
  inside the app — that audit trail exists in Firestore (`receiptLog`,
  administrator-only) but isn't surfaced in the UI. Worth adding later if
  it'd be useful — happy to build it if you want it.
- Only one signature is captured per receipt (whoever generates it). A
  second physical signature line is still printed for a second role where
  relevant (e.g. Financial Staff on a Finance receipt), the same as
  before — that one still needs a pen.
