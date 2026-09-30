# Till for receiving, Paybill for sending — what changed and what's left

## What this does

- **Till** (unchanged) keeps receiving deposits via "Add via M-Pesa" and
  keeps notifying the app automatically when someone pays it directly —
  nothing about this changed, and nothing needs re-doing on that side.
- **Paybill 1307475** becomes the account "Send via M-Pesa" (B2C payouts),
  "Check M-Pesa balance", and "Check transaction status" run against —
  separate credentials from the Till, because Safaricom ties API
  credentials, C2B registration, and B2C initiator rights to one specific
  shortcode each. There's no way to make one account's credentials act on
  another account's behalf — the API itself rejects it.

## Why not just use the Paybill's credentials to watch the Till?

This was the original ask, and it's worth explaining plainly: Safaricom's
API only lets a shortcode's own credentials register for or query that
shortcode. Trying to register the Till's payment-notification webhook using
the Paybill's Consumer Key/Secret gets rejected outright with "Bad Request -
Kindly use your own ShortCode" — confirmed by Safaricom's own API behavior,
not a guess. So the Till keeps its own credentials for receiving (already
working), and the Paybill gets its own separate credentials for sending —
two accounts, two credential sets, each doing the one job it's actually
authorized for.

**The one exception:** if Safaricom's back office has specifically set up
your Till as a "Store Number" under the Paybill as an "Agent" shortcode (a
real but specific account relationship, not something either of us can
configure from here), the code already has a `MPESA_STORE_NUMBER` secret
built in for exactly that case — see the comment above it in
`functions/index.js`. You said you're not sure whether that's the case for
your accounts; if you want to find out, ask Safaricom support or check
whether the M-Pesa Org Portal shows the Till listed under the Paybill. It
doesn't change anything below either way — that mechanism is for
*collections* routing, not for using one shortcode's credentials to
authenticate as another.

## Important: the Till's money doesn't automatically fund the Paybill

The Till and the Paybill are separate M-Pesa balances. Money customers pay
into the Till does not show up in the Paybill for "Send via M-Pesa" to draw
on, unless those two accounts are linked as Agent/Store (see above). If
they're not linked, you'll need your own way of moving money from the Till
into the Paybill (e.g. withdrawing it and depositing it again) before
payouts have anything real to send — there's no Safaricom API for that kind
of transfer, so the app can't automate it.

## Files changed in this update

- `functions/index.js` — added `MPESA_PAYOUT_CONSUMER_KEY`,
  `MPESA_PAYOUT_CONSUMER_SECRET`, `MPESA_PAYOUT_SHORTCODE` secrets; rewired
  `initiateWithdrawal` (Send via M-Pesa), `checkAccountBalance`, and
  `checkTransactionStatus` to use them instead of the Till's collections
  credentials. Nothing about deposits, C2B, or the payment QR code changed —
  they still use the Till.
- `functions/c2b.env.example` and `functions/.env.example` — split into a
  "collections" (Till) section and a new "payouts" (Paybill) section, so
  `registerC2BUrls.js` keeps registering for the Till while `test-b2c.js`
  and `test-balance.js` now test against the Paybill.
- `functions/test-b2c.js`, `functions/test-balance.js` — now read the new
  `MPESA_PAYOUT_*` fields from `c2b.env` instead of the Till's fields.
- `SETUP-MPESA.md` — added a note at the top pointing to this split; no
  other change to the Till/deposits instructions.
- `SETUP-B2C.md` — added the step for creating a Paybill-specific Daraja
  app and setting the three new `MPESA_PAYOUT_*` secrets, clarified the
  Initiator Name/password must come from the Paybill's own Org Portal, and
  added the fund-separation warning above.
- `SETUP-MPESA-EXTRAS.md` — clarified Check Balance/Check Transaction
  Status now report on the Paybill (the payout account), while the payment
  QR code still targets the Till (customers pay that to reach you).
- `app.js` — one in-app help-text fix: the assistant used to say Safaricom
  needs to confirm B2C "for our Till" — corrected to "for our Paybill".

## What's still needed from you (nothing here works until these are done)

1. Create a Daraja app at developer.safaricom.co.ke tied to Paybill
   1307475, and ask Safaricom to enable B2C API access for it — see
   `SETUP-B2C.md`, item 1.
2. Set up an Initiator Name/password for the Paybill on its own Org
   Portal, and get its security certificate — `SETUP-B2C.md`, items 2–3.
3. Set the new secrets:
   ```
   firebase functions:secrets:set MPESA_PAYOUT_CONSUMER_KEY
   firebase functions:secrets:set MPESA_PAYOUT_CONSUMER_SECRET
   firebase functions:secrets:set MPESA_PAYOUT_SHORTCODE
   firebase functions:secrets:set MPESA_INITIATOR_NAME
   firebase functions:secrets:set MPESA_INITIATOR_PASSWORD
   firebase functions:secrets:set MPESA_B2C_CERT
   ```
   (`MPESA_PAYOUT_SHORTCODE` is `1307475`.)
4. Redeploy: `firebase deploy --only functions`
5. Confirm with Safaricom (or check the Org Portal) whether the Till and
   Paybill are linked as Agent/Store, and if not, decide how you'll move
   float between them before relying on payouts.
6. Once you've tested a small real payout end-to-end, flip
   `PAYOUTS_ENABLED` to `true` near the top of `functions/index.js` and
   redeploy — it's currently `false` as a safety default until B2C is
   actually confirmed working for the Paybill.

## Uploading this

Same as before — replace these files on GitHub (or apply the same edits
locally) and push/upload:

```
git add functions app.js SETUP-MPESA.md SETUP-B2C.md SETUP-MPESA-EXTRAS.md HOW-TO-APPLY-DUAL-ACCOUNT.md
git commit -m "Split M-Pesa collections (Till) and payouts (Paybill) into separate credentials"
git push
```

No `--force` — this is a normal commit. Remember `functions/c2b.env` itself
(not `.example`) stays local and git-ignored, same as always.
