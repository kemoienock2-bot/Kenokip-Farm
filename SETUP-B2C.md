# Setting up "Send via M-Pesa" (real payouts) + the authenticator app

This covers the two things added together: an authenticator-app code
(Google Authenticator, Authy, or similar) required to reveal masked Finance
figures and to send money, and the "Send via M-Pesa" button itself, which
pushes real money out of the farm's till/paybill to someone's phone.

## Part 1 — the authenticator app (works right away, no setup needed)

This part needs nothing from Safaricom — it's built entirely into the app.
Once you deploy this update, go to **Settings → Your account** (as
Administrator or Financial Staff) and tap **Set up authenticator app**.
You'll be shown a text key — open Google Authenticator, Authy, or any
similar app, choose to add an account by **entering the key manually**
(no camera/QR code needed), paste the key in, and it'll immediately start
showing a 6-digit code that changes every 30 seconds. Type the current code
back into the app to confirm setup.

From then on:

- **Finance amounts and notes are masked on screen by default** (e.g. an
  amount shows as `KSh 1xx,xx0` and a note like a phone number shows as
  `07xxxxxxx8`) for anyone who can see Finance at all. Tapping the eye icon
  next to the balance asks for a current code before showing everything in
  full.
- **Important limit to understand:** this is a screen-privacy feature, not
  a data-access lock. The moment you or Financial Staff are signed in,
  Finance's real numbers are already sent to your device (the app needs
  them to add up totals) — masking just controls what's drawn on screen
  until you unlock it. It protects against someone glancing at your screen
  or picking up an unlocked device for a second; it does not protect
  against someone with deep technical access to an already-signed-in
  session (e.g. opening the browser's developer tools). That's a
  fundamentally different, much bigger kind of protection than a farm
  record-keeping app like this is built for.
- **A code only works once.** Each 6-digit code is valid for about 30
  seconds and is consumed the moment it's used — for revealing Finance or
  for a real M-Pesa send. If a code fails right after you used it for
  something else, just wait for your app to show the next one.
- **Lost your phone?** From Settings, "Set up on a new device" starts over
  cleanly. As administrator, you can also reset it for a Financial Staff
  member from a future Team-panel option — for now, ask me if that comes up
  and I'll wire in a button.

## Part 2 — actually sending money via M-Pesa

This is the part that needs Safaricom's cooperation, and won't work until
it's in place — the button will give a clear error instead of pretending to
work. **B2C ("Business to Customer") is a separate approval from the
STK Push / C2B collection features you already have**; a lot of ordinary
till numbers never get it enabled, because it's meant for businesses that
regularly pay people out, not just collect payments.

What you need, before this can go live:

1. **B2C enabled for your shortcode.** Contact Safaricom (or your Daraja
   developer account's support channel) and ask specifically for
   **B2C API access** for your till/paybill number. This is a business
   decision on their side — there's nothing I can do from the app to
   trigger or speed this up.
2. **An Initiator Name and Initiator password.** Once B2C is enabled,
   you (or whoever administers your Daraja organization account) sets these
   up in the M-Pesa Org Portal — this is the "API operator" identity B2C
   payouts run as.
3. **The right public certificate for your environment.** Safaricom
   encrypts your initiator password into what they call a "security
   credential" using their own public certificate, which is different for
   sandbox vs. production:
   - **Sandbox** — downloadable directly from Safaricom's Daraja API
     documentation page for the B2C API (search their docs for
     "B2C" — the certificate is a small `.cer` file listed right there).
   - **Production** — only issued to you by Safaricom after they've
     approved B2C for your shortcode, usually alongside your production
     credentials.

   I deliberately didn't hardcode either certificate into this app —
   getting a security certificate wrong from memory, with no way to test it
   against Safaricom's actual servers from here, would fail silently in a
   way that's hard to debug. You'll paste in the actual certificate text
   yourself as a secret (below), for whichever environment `MPESA_ENV` is
   currently set to.

Once you have all three, set the new secrets the same way you set the
original M-Pesa ones:

```
firebase functions:secrets:set MPESA_INITIATOR_NAME
firebase functions:secrets:set MPESA_INITIATOR_PASSWORD
firebase functions:secrets:set MPESA_B2C_CERT
```

For `MPESA_B2C_CERT`, paste in the **entire contents** of the certificate
file, including the `-----BEGIN CERTIFICATE-----` and
`-----END CERTIFICATE-----` lines. If the interactive prompt gives you
trouble with the multi-line paste on Windows, save the certificate text to
a file and use:

```
firebase functions:secrets:set MPESA_B2C_CERT --data-file "path\to\cert.pem"
```

Then redeploy:

```
firebase deploy --only functions
```

After that, **Send via M-Pesa** appears next to **Add via M-Pesa** in
Finance (administrator only), and asks for the recipient's phone, an
amount, an optional note, and a current authenticator code before it will
submit anything to Safaricom. The payout only shows up in your Finance
history once Safaricom itself confirms it went through — the same way a
deposit only appears once M-Pesa confirms that, not the moment you tap the
button.

## A design choice worth flagging

Right now, **only the Administrator can trigger a real send** — Financial
Staff can still use the existing "propose a withdrawal" flow (a manual
ledger entry that waits for your approval), matching what you'd asked for
earlier ("when they want to send it must pass my approval"). I didn't
extend the real M-Pesa send button to Financial Staff, since actually
moving real money out felt like it should stay with you specifically
unless you say otherwise — tell me if you'd rather Financial Staff be able
to trigger it too (still gated by their own authenticator code either way).
