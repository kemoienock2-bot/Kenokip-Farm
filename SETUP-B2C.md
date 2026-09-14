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

   **Can't find the certificate file?** Some Org Portal accounts have a
   **"Generate Security Credential Value"** tool instead (pick your
   Initiator, type its password, select Production or Sandbox, and it
   hands back an already-encrypted string). If that's what you have
   instead of a downloadable certificate, skip `MPESA_B2C_CERT` entirely
   and set `MPESA_SECURITY_CREDENTIAL` to that string instead — see the
   note below.

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

### Before you set the certificate — check it first

Certificates are easy to paste wrong (missing the `-----BEGIN/END-----`
lines, or Safaricom hands you an actual binary `.cer` file instead of
pasteable text), and when that happens Safaricom is never even contacted —
it fails instantly with a cryptic OpenSSL error. Check the file you're
about to use *before* setting it as a secret:

```
node check-cert.js "C:\path\to\the\certificate\file\you\got\from\Safaricom"
```

(Run this from inside the `functions` folder.) It tells you right away if
the file works, and if it's fixable (missing header/footer lines, or a
binary file that needs converting) it writes out a corrected copy and
tells you exactly which file to point `--data-file` at instead. The
certificate itself isn't secret — it's Safaricom's public key — so this
check is completely safe to run and share the output of.

If "Send via M-Pesa" ever fails again with "Could not send the payout",
this is the first thing to check — a bad `MPESA_B2C_CERT` also breaks
**Check M-Pesa balance** and **Check transaction status** the exact same
way, since all three build their SecurityCredential from it.

### Alternative: skip the certificate entirely with a pre-generated value

If your Org Portal offers a **"Generate Security Credential Value"** tool
(pick your Initiator, enter its password, choose Production or Sandbox),
it does the certificate-encryption step for you and hands back an
already-encrypted string. That string is safe to handle freely — it's
one-way encrypted with Safaricom's own certificate, so nothing short of
Safaricom's own private key can turn it back into your password.

Set it instead of `MPESA_B2C_CERT`:

```
firebase functions:secrets:set MPESA_SECURITY_CREDENTIAL
```

When this secret is set, the app uses it directly for B2C, Check Balance,
and Check Transaction Status, and `MPESA_B2C_CERT`/`MPESA_INITIATOR_PASSWORD`
aren't needed at all. The one thing to remember: because it's baked from a
specific password, **if you ever change that operator's password on the
portal, come back to the same "Generate Security Credential Value" tool,
generate a fresh one with the new password, and set it here again.** The
certificate-based route above doesn't have that limitation (it recomputes
this value itself on every request), so it's worth switching to if you
later do get hold of the actual certificate file — but this is a
perfectly good way to get going today.

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
