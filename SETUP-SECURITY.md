# Finance security update — what's new, and one optional manual step

This update adds four things: a second way to unlock the Finance portal
(fingerprint/Face + your own PIN), a lockout that shuts the whole portal
after 3 wrong attempts on either method and alerts you immediately, a
"Finance security" log of every attempt (with rough location), and a
tightening of the M-Pesa webhook URLs so a stranger can't feed them fake
payment data. Almost all of it works the moment you deploy — one piece
(the webhook tightening) needs a manual step, explained below, and it's
safe to skip for now if you want to come back to it later.

## An honest read on "can someone hack it"

Worth saying plainly, since this update was built in response to that
exact question:

- **Nobody outside this app ever sees your real M-Pesa PIN or password.**
  A deposit via "Add via M-Pesa" pops Safaricom's own PIN screen on your
  phone — this app never touches that PIN. Your Safaricom API credentials
  live only as encrypted secrets on Google's servers, never in the code or
  the GitHub repo.
- **"Know where the hacker is" is real, but limited.** Every wrong Finance
  attempt is logged with the device/browser used and a rough location
  worked out from its IP address (city-level at best, sometimes only
  country-level) — genuinely useful, but not an exact address, and not a
  name. Someone using a VPN or mobile data can make that location wrong on
  purpose. Treat it as a strong clue, not proof.
- **The lockout is the actual defense, the location is a clue on top of
  it.** Three wrong tries — on the password+code method, the new
  fingerprint+PIN method, or a mix of both — locks the whole Finance
  portal for everyone, including with completely correct details,
  until the administrator clears it from Settings → Team → Finance
  security. That's what actually stops repeated guessing; nothing about
  it depends on figuring out who's guessing.
- **"No one can ever hack it" isn't a promise any real system can make.**
  What this update does is raise the cost of trying (3 strikes and it
  locks, and you're told immediately) and close a real gap that existed
  in the M-Pesa webhooks (below). Keep an eye on Settings → Team →
  Finance security occasionally, especially after a lock — that's how a
  genuine attempt would actually surface.

## What needs a deploy

**Correction from an earlier version of this file:** it previously said
Firebase installs the new `@simplewebauthn/server` package automatically —
that was wrong, and is why `firebase deploy --only functions` failed with
`Cannot find module '@simplewebauthn/server'`. Before Firebase uploads your
functions, its CLI has to load them on your own computer first (to work out
what each function is), and that step needs the package physically present
in `functions/node_modules` already — nothing installs it for you. One
extra step fixes it for good:

```
cd functions
npm install
cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Only that first `npm install` is new — every future `firebase deploy`
after this one goes back to normal, with no extra step, unless a later
update adds another new package (I'll always call it out here if so).

**If `firebase deploy --only firestore:rules` says it can't understand
that target:** that means `firebase.json` doesn't yet know about
`firestore.rules` at all — a gap that predates this update, not something
this update caused, but worth fixing now that a real security rule change
(the `securityEvents` collection) depends on it actually deploying. Open
`firebase.json` and confirm it has a `"firestore"` key like this (this zip
already includes the fixed file):
```json
{
  "functions": [ ... ],
  "firestore": { "rules": "firestore.rules" }
}
```
Once that's in place, `firebase deploy --only firestore:rules` will work —
and it's worth doing an extra check afterward, in the Firebase console
under Firestore Database → Rules, that what's shown there now matches
`firestore.rules` in this project. If `firebase.json` was missing that key
for a while, your live rules may have been out of date with this file for
some time.

## The one optional manual step: locking down the M-Pesa webhook URLs

**What the gap was:** `c2bConfirmation` and the other M-Pesa webhook
endpoints are public URLs (Safaricom has to be able to reach them from the
internet). Cloud Function URLs follow a predictable pattern, and this
project's Firebase project ID isn't a secret — it's visible in the app's
own settings. That meant, in principle, a stranger who worked out or found
that URL could send it a fake "payment received" and have it show up in
your Finance/Income, even though no real money moved. It could NOT let
anyone take money out or see your real M-Pesa PIN — just plant a fake
income entry.

**The fix:** every webhook URL now optionally requires a `?key=...` that
only you know, checked before anything is recorded. Until you set it up,
everything works exactly as before (nothing breaks) — this step is what
actually turns the protection on.

1. Pick a long random value — anything works, e.g. run this once and copy
   the result:
   ```
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Set it as a Firebase secret (same way you set the M-Pesa ones):
   ```
   firebase functions:secrets:set MPESA_WEBHOOK_SECRET
   ```
   Paste the value when prompted.
3. Deploy functions so the new secret takes effect:
   ```
   firebase deploy --only functions
   ```
   From this point on, "Add via M-Pesa" (STK Push) and "Send via M-Pesa"
   (payouts) automatically include the key — nothing else to do for those.
4. For the till/paybill "someone pays you directly" path (C2B), the URLs
   were registered with Safaricom once, up front — they need re-registering
   with the key attached:
   - Open `functions/c2b.env` (the file you already made for the original
     M-Pesa setup — see `SETUP-MPESA.md` if you don't have one yet).
   - Add this line, using the SAME value from step 1:
     ```
     MPESA_WEBHOOK_SECRET=your-long-random-value-here
     ```
   - Run:
     ```
     cd functions
     npm run register-c2b
     ```
   **Do steps 2–4 close together.** Between finishing step 3 and running
   step 4, a direct till/paybill payment from someone else's phone won't
   record itself automatically (everything else keeps working — deposits
   you start yourself, and Finance/Income in general, are unaffected).
   If you're not ready to do all of it in one sitting, skip this whole
   section for now — it's the one part of this update that isn't already
   protecting you the moment you deploy, so there's no harm in coming back
   to it later.

## Fingerprint / Face + PIN unlock for Finance

From **Settings → Your account**, once this update is deployed:

1. Set a personal Finance PIN (4–8 digits) — yours alone, separate from
   the shared Finance portal password and from your own sign-in password.
   Nobody else, not even another administrator, can see it.
2. Tap **Set up fingerprint / Face unlock** — your browser/device's own
   fingerprint or Face prompt appears (Windows Hello, Touch ID, Android's
   fingerprint sheet, whatever the device already uses). This app never
   sees your actual fingerprint or face — only a signed "yes, verified"
   result, the same way any website using a security key works.
3. From then on, the Finance portal gate offers a second tab —
   **Fingerprint + PIN** — as a faster alternative. The original password
   + authenticator-code method still works exactly as before; this is an
   additional door, not a replacement, and either one on its own (a stolen
   phone with the fingerprint but not the PIN, or vice versa) still can't
   get in.

**Browser support:** needs a reasonably current Chrome, Edge, or Safari.
On an older or less common browser, that tab simply doesn't appear and the
password + code method is the only one shown — nothing breaks, there's
just no fallback within that same browser for the newer method.

**If a phone is lost:** remove that device from **Settings → Your
account** (the entry shows a name like "Windows · Chrome" or similar) from
any other device where you're still signed in. The lost phone's PIN entry
alone can't get in without the fingerprint too, and vice versa.

## Finance security log

**Settings → Team → Finance security** (administrator only) shows:

- Whether the portal is currently locked, with a **Clear lock** button
  (asks for your main authenticator code — the one already used to reveal
  Finance figures and send M-Pesa payouts, not the Finance portal one —
  so clearing a lock still requires proving it's really you).
- Every attempt, successful or not: when, which method, the device/browser
  used, a rough IP-based location, and the account involved.

You'll also get an **Urgent** alert (the same banner/sound/notification
system as an Urgent team message, plus a real push if you've set that up)
the moment any attempt is wrong, and again if it locks — no need to go
looking for it.
