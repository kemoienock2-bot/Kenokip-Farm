# Installation-order notifications, editing, cancelling & refunds — setup

This update adds three things to the Installation Orders & Licensing
system (separate from any farm's own app — see
HOW-TO-SELL-INSTALLATIONS.md):

- **Automatic email, SMS, and WhatsApp** to the farmer whenever their
  order is priced, a payment lands, it's marked installed, it's
  cancelled, or a refund is recorded.
- **Editing a request's details** (farm name, contact name, phone, email,
  notes, tech-expert flag) from order-admin.html, for fixing a typo or
  updating contact info after it was submitted.
- **Cancelling an order** and **recording a refund**, both from
  order-admin.html.

Everything here is additive — if you skip the notification setup below,
every other part of this (editing, cancelling, refunds) still works
exactly the same; the farmer just won't get an email or text about it.

## What needs a deploy

```
cd functions
npm install
cd ..
firebase deploy --only functions
```

No new Firestore collections or rules this time — cancellations and
refunds are just new fields on the existing `installOrders` documents.

## Notifications: two independent channels, both optional

Nothing here is required. Leave either (or both) unset and
`sendOrderNotification` silently skips that channel — the underlying
order action (pricing, payment, marking installed, cancelling, refunding)
always goes through regardless of whether the email or text actually
sent.

### Email, via SendGrid

1. Create a free SendGrid account at sendgrid.com (the free tier is
   plenty for this volume).
2. Verify a sender — either a single sender email (Settings → Sender
   Authentication → "Verify a Single Sender" is the fastest way) or your
   whole domain if you have one. This is the address farmers will see
   mail arrive from.
3. Create an API key: Settings → API Keys → "Create API Key" → choose
   "Restricted Access" and give it "Mail Send" permission only (no need to
   hand it more than that).
4. Set the two secrets:
   ```
   firebase functions:secrets:set SENDGRID_API_KEY
   firebase functions:secrets:set SENDGRID_FROM_EMAIL
   ```
   Paste the API key for the first, and the verified sender email (e.g.
   `you@yourdomain.com`) for the second.

### SMS, via Africa's Talking

1. Create an account at africastalking.com.
2. While testing, you can use the **sandbox** app that comes with every
   account for free — set `AFRICASTALKING_USERNAME` to exactly `sandbox`
   and use the sandbox API key shown on your dashboard. Sandbox texts only
   reach phone numbers you've added as test numbers in the simulator, so
   switch to a real "Live" app (and buy some SMS credit) once you're ready
   for farmers to actually receive these.
3. Set the secrets:
   ```
   firebase functions:secrets:set AFRICASTALKING_USERNAME
   firebase functions:secrets:set AFRICASTALKING_API_KEY
   ```
4. Optional — if you've registered a custom Sender ID / short code with
   Africa's Talking, set it too (otherwise texts go out under the shared
   Africa's Talking sender, which is fine to start with):
   ```
   firebase functions:secrets:set AFRICASTALKING_SENDER_ID
   ```

### WhatsApp, also via Africa's Talking

This reuses the same Africa's Talking account/API key as SMS above (set
those first), plus one more thing: a WhatsApp Business number.

1. In the Africa's Talking dashboard, go to Chat → WhatsApp and follow
   their setup flow to register a WhatsApp Business number for your
   account. This is Meta's (WhatsApp's) own verification process via
   Africa's Talking, separate from plain SMS, and can take a little while
   to get approved — it's fine to skip this and keep using email + SMS
   only until it's ready.
2. Once you have a number, set it:
   ```
   firebase functions:secrets:set AFRICASTALKING_WA_NUMBER
   ```
   Paste the WhatsApp Business number exactly as Africa's Talking shows
   it (e.g. `+254711000000`).

Leave `AFRICASTALKING_WA_NUMBER` unset and WhatsApp sending is simply
skipped — email and SMS still go out as normal, nothing else is affected.

**A note on WhatsApp's own rules:** this sends a plain free-form text
message, which WhatsApp only delivers if the farmer messaged your
WhatsApp Business number within the last 24 hours (the "customer service
window"). Outside that window, WhatsApp requires a pre-approved message
*template* instead of free text — Africa's Talking's API supports that
too (`templateId` instead of a plain message), but this update doesn't
use templates yet, so a farmer who's never messaged your WhatsApp number
first may not actually receive the WhatsApp leg even though it's
configured. Email and SMS don't have this limitation, which is why
they're still sent alongside WhatsApp rather than being replaced by it.

### The link in each message

So a notification can include a working link back to the farmer's own
`order.html?order=...` status/pay page, tell it where that page is
actually hosted:

```
firebase functions:secrets:set ORDER_PAGE_BASE_URL
```

Paste just the base URL, e.g. `https://kenokip-farm.web.app` (no trailing
slash, no `/order.html`). Leave this unset and messages are still sent —
they just won't include a link.

Once any of the above secrets are set, deploy once more so they take
effect:

```
firebase deploy --only functions
```

## Editing a request's details

order-admin.html → any order → "Edit" opens a small form for farm name,
contact name, phone, email, notes, and the tech-expert checkbox. "Save
changes" updates just those fields — it never touches the price, what's
been paid, the status, or the license key, so this is safe to use at any
point in an order's life without affecting money or licensing.

## Cancelling an order

order-admin.html → any order that isn't already cancelled → "Cancel
order". You'll be asked for an optional reason (shown to the farmer in
their notification) and asked to confirm. Cancelling:

- Sets the order's status to "Cancelled".
- **Revokes its license key immediately**, even if one was already
  issued and the farm's app was already running — `checkLicense` only
  ever treats `paid_in_full`/`installed` orders as active, so a
  cancelled order's app shows the "payment required" screen on its very
  next check, the same as if it had never been paid.
- Sends the farmer a notification, if you've set up email/SMS above.

There's no "un-cancel" button on purpose — if a cancelled order needs to
come back, set its price again with "Set price" the normal way (this
moves it back to "Priced — payment due").

## Recording a refund

order-admin.html → any order with something paid on it → "Record refund"
→ enter the amount and an optional note → "Record refund".

**Important: this is bookkeeping only.** M-Pesa has no simple API for a
small Till/Paybill to reverse a payment, so this button doesn't send any
money back by itself — it just corrects this order's own numbers (amount
paid, and its status if a full or deposit payment is now only partially
covered) to match a refund you've already sent the farmer some other way
(M-Pesa Send Money, cash, etc). Send the actual money first, then record
it here so the order's own records stay honest.

A refund on an order that's already `installed` or `cancelled` still
records the amount and note, but leaves that status alone — the install
(or the cancellation) already happened; a later refund is additional
bookkeeping on top of that history, not a reversal of it.

## What this doesn't cover yet

- No SMS/email delivery log is surfaced in the UI — if a notification
  silently fails (bad number, bounced email), you'll only see it in the
  Cloud Functions logs, not in order-admin.html itself.
- Refund amounts aren't validated against how much was actually paid —
  you can record a refund larger than `amountPaid`, which simply floors
  the paid total at zero rather than going negative. Worth being
  careful with the number you type in.
