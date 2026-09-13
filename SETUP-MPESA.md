# Setting up automatic M-Pesa deposits

> **Where you are right now:** `MPESA_ENV` is set to `sandbox`, which is
> exactly why "Add via M-Pesa" errors out when you try it with your real
> phone — Safaricom's sandbox only accepts their own published test phone
> numbers, never a real one. It's also why a payment straight to your Till
> never shows up in the app: sandbox mode isn't watching your real Till at
> all, only Safaricom's fake test one. **Going live (below) fixes both at
> once** — no code changes needed, just new credentials.

## Going live — what's actually left to do

1. **Apply for "Go Live"** on your app at https://developer.safaricom.co.ke
   (My Apps → your app → there's a Go Live option once your sandbox testing
   looks good, which yours does — STK Push has been working). Safaricom will
   ask for some business/KYC details tied to your Till. This step is entirely
   on their side — there's nothing I can do from here to speed it up.
2. Once approved, Safaricom gives you **production** values for the same
   kind of things you already have: a Consumer Key, Consumer Secret, and a
   Passkey — these are different from your sandbox ones, so don't reuse
   them. Your **Shortcode** becomes your real Till number (you already know
   it).
3. Update the secrets with the new production values:
   ```
   firebase functions:secrets:set MPESA_CONSUMER_KEY
   firebase functions:secrets:set MPESA_CONSUMER_SECRET
   firebase functions:secrets:set MPESA_SHORTCODE
   firebase functions:secrets:set MPESA_PASSKEY
   firebase functions:secrets:set MPESA_ENV
   ```
   For `MPESA_ENV`, type `production`. Leave `MPESA_ACCOUNT_TYPE` as `till`
   — that doesn't change.
4. Redeploy: `firebase deploy --only functions`
5. **Re-register the C2B URLs for production** — this is the step that turns
   on "someone paid the Till directly" detection. From `pwa-build/functions`,
   edit `c2b.env` (or copy `c2b.env.example` again if you don't have one) so
   it has your new production `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`,
   `MPESA_SHORTCODE`, `MPESA_ENV=production`, and the same
   `MPESA_CALLBACK_BASE_URL` as before, then:
   ```
   npm run register-c2b
   ```
6. Test with a small real amount first — a few shillings via "Add via
   M-Pesa", and separately ask someone to pay a few shillings straight to
   your Till — before trusting it with real farm money.

This is entirely a credentials/registration change — the same Cloud
Functions code handles both sandbox and production already, so there's
nothing to redeploy on the code side beyond the one `firebase deploy`
above. **B2C ("Send via M-Pesa")** is a separate approval from Safaricom on
top of this — see `SETUP-B2C.md` — going live here doesn't turn that on by
itself.

---

This adds two things to the Finance section, both feeding the same real-time balance you already have:

1. **Add via M-Pesa** button (owner-only) — you tap it, enter an amount and your phone number, and get the *real* Safaricom "enter your PIN" prompt on your own phone. Nothing is typed into the app itself.
2. **Automatic detection** of anyone paying your Till/Paybill directly from their own phone — no button needed, it just shows up.

Both need a small backend (Firebase Cloud Functions) because the Safaricom API credentials can't live in the public app. The code for it is already written and tested for syntax — it's in the `functions/` folder in the zip alongside this guide. What's left is account/paperwork steps only you can do, then a deploy.

## 1. Your Till number ✅ done

You've already got your own Buy Goods Till — good, that's the hard real-world step out of the way. The code is wired for a Till by default (`MPESA_ACCOUNT_TYPE=till`); if it later turns out to be a Paybill instead, just set that one value to `paybill` and redeploy.

## 2. Create a free Safaricom developer account

1. Go to https://developer.safaricom.co.ke and sign up (free).
2. Create a new **App** — this gives you a **Consumer Key** and **Consumer Secret** for the **sandbox** environment instantly, so we can test the whole flow safely before touching real money.
3. For sandbox testing, use Safaricom's published test shortcode `174379` and passkey `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`, both from their own docs. Leave `MPESA_ACCOUNT_TYPE=till` first — if Safaricom's sandbox rejects it as a transaction-type mismatch, switch that one value to `paybill` for testing only, since their sandbox docs aren't fully consistent about whether Till-type test transactions are supported there.
4. When you're ready to use your real Till, go back to the same portal and apply to **Go Live** with that app — this swaps you from sandbox to production. For production, set `MPESA_SHORTCODE` to your real Till number and keep `MPESA_ACCOUNT_TYPE=till` — that part isn't in question, since Till numbers really do use the Buy-Goods transaction type in production.

## 3. Put the backend on Firebase (same project you already use)

This needs the **Blaze (pay-as-you-go)** plan on the `kenokip-farm` Firebase project — Cloud Functions isn't available on the free Spark plan. In practice this costs **$0/month** for a farm-sized app: Firebase's free monthly quota (2 million function calls, etc.) comfortably covers this. You won't be charged unless you go far beyond that.

On your computer (same one you use for `cmd`/git):

```
npm install -g firebase-tools
firebase login
```

Unzip `mpesa-backend.zip` into your `pwa-build` folder (so you get `functions/`, `firebase.json`, `.firebaserc` sitting next to `index.html`), then:

```
cd pwa-build/functions
npm install
```

Set your Safaricom credentials as secrets (never committed to GitHub — Firebase stores these securely):

```
firebase functions:secrets:set MPESA_CONSUMER_KEY
firebase functions:secrets:set MPESA_CONSUMER_SECRET
firebase functions:secrets:set MPESA_SHORTCODE
firebase functions:secrets:set MPESA_PASSKEY
firebase functions:secrets:set MPESA_ENV
firebase functions:secrets:set MPESA_CALLBACK_BASE_URL
firebase functions:secrets:set MPESA_ACCOUNT_TYPE
```

Each command will prompt you to paste the value:
- `MPESA_SHORTCODE`: `174379` for now (sandbox), your real Till number once you go live
- `MPESA_ENV`: `sandbox` for now, `production` once live
- `MPESA_ACCOUNT_TYPE`: `till` — this stays the same in sandbox and production since your real account is a Till
- `MPESA_CALLBACK_BASE_URL`: leave blank/placeholder the first time — deploy once to find out your real URL (next step tells you), then run this command again with the real value.

Deploy:

```
cd pwa-build
firebase deploy --only functions
```

The output will show your function URLs, something like:
`https://us-central1-kenokip-farm.cloudfunctions.net/initiateDeposit`

Take the base part (`https://us-central1-kenokip-farm.cloudfunctions.net`) and re-run the `MPESA_CALLBACK_BASE_URL` secret command with that value, then `firebase deploy --only functions` again.

## 4. Turn on automatic detection of payments from others

This is a one-time registration so Safaricom knows to notify your backend. From `pwa-build/functions`:

```
copy c2b.env.example c2b.env
```

Fill in `c2b.env` with the same values you set as secrets above, then:

```
npm run register-c2b
```

(This file is deliberately not named `.env` — Firebase's deploy step auto-loads any file actually named `.env` as real Cloud Functions environment variables, which collides with the secrets of the same name and breaks deployment.)

You only need to do this again if you switch from sandbox to production, or ever redeploy to a different shortcode.

## 5. Push the new files like you have been

```
git add functions firebase.json .firebaserc index.html sw.js SETUP-MPESA.md
git commit -m "Add M-Pesa deposit automation"
git push
```

(`functions/node_modules` and `functions/c2b.env` are already git-ignored — they should never be committed.)

## What still stays manual, on purpose

Sending money out (to a phone, paybill, till, or bank account) stays as a manual log entry, as you chose — Safaricom's send-money API needs a separate business approval on top of all this, and there's no public API at all for sending to arbitrary bank accounts. If you want to revisit that later, this backend is the right place to add it.
