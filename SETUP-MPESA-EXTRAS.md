# Account Balance, Transaction Status, and a payment QR code

Three small additions to Finance, all reusing credentials you've already set
up — nothing new to buy or apply for from Safaricom for any of them.

## What each one does

- **Check M-Pesa balance** — asks Safaricom directly what's currently
  sitting in the till/paybill's own M-Pesa account, right there in the app,
  instead of having to log into the M-Pesa Org Portal to look. Administrator
  and Co-Administrator only (same people who can already see Finance's
  running balance in the app itself).
- **Check transaction status** — paste in an M-Pesa receipt code (from a
  text message or a customer's screenshot) and Safaricom reports back its
  current state. Useful for "the customer says they paid but I don't see
  it" situations. Administrator and Co-Administrator only.
- **Payment QR code** — generates a scannable code a customer points their
  own M-Pesa app at to pay your till directly, with the amount already
  filled in if you choose to set one. No typing your till number out loud,
  no manual entry mistakes on their end. Available to the same people who
  can already start an M-Pesa deposit (Administrator, Co-Administrator, or
  Financial Staff).

All three appear as a new **"M-Pesa tools"** card on the Finance page, right
below your balance summary.

## What you need to do

**If "Send via M-Pesa" (B2C) already works for you:** nothing — Check
Balance and Check Transaction Status use the exact same Initiator Name /
Initiator Password / security certificate you already set up for that (see
`SETUP-B2C.md`). They'll work the moment you deploy this update.

**If you haven't set up B2C yet:** Check Balance and Check Transaction
Status will show a clear message telling you they need that same Initiator
setup — follow `SETUP-B2C.md` first (same three secrets:
`MPESA_INITIATOR_NAME`, `MPESA_INITIATOR_PASSWORD`, `MPESA_B2C_CERT`), then
they'll start working with no other change.

**The payment QR code needs nothing extra at all** — it only uses the
ordinary Consumer Key/Secret/Shortcode you already set up for "Add via
M-Pesa" deposits, so it works right away in whichever mode (`sandbox` or
`production`) `MPESA_ENV` is currently set to.

## Deploying this update

```
git add functions index.html sw.js firestore.rules SETUP-MPESA-EXTRAS.md
git commit -m "Add Account Balance, Transaction Status, and payment QR code"
git push
firebase deploy --only functions,firestore:rules
```

(The `firestore:rules` part matters this time — a new `mpesaQueries`
collection holds balance/status results, and its access rule needs
deploying alongside the functions, or the Finance page won't be able to
read the results back.)

## A couple of choices I made — tell me if you'd rather have it differently

- **Reversal** isn't included here — you asked what it means separately;
  it undoes a completed M-Pesa transaction within a short window and needs
  its own Safaricom approval plus matching bookkeeping logic to keep your
  Finance ledger honest afterward. Happy to build it if you decide you want
  it, but I'd recommend against turning it on in Daraja's Go Live screen
  until then.
- **Who can use each tool:** Balance and Transaction Status are
  Administrator/Co-Administrator only, matching who can already see
  Finance's real-time numbers. The QR code is open to Financial Staff too,
  since it's just a way to accept a payment, not a way to see money already
  in the account.
- **No authenticator code required** for any of these three — unlike
  "Send via M-Pesa", none of them move money, so I didn't gate them behind
  a 2FA code. Say the word if you'd rather they required one too.
