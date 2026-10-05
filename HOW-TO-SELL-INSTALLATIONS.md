# Selling installations: Installation Orders & Licensing

## What this adds

A way for other farms to pay you to install this app for them, with the
app itself enforcing that the fee gets paid — not just an honor system.

**1. `order.html`** — a public page, no sign-in needed. A prospective
farmer fills in their farm name, contact, M-Pesa number, and whether they
have their own tech expert, and submits. That creates a new order with
status `new`. They're shown a link back to this same page
(`order.html?order=<id>`) to bookmark — that link is how they check
status later and pay once you've priced it.

**2. `order-admin.html`** — for you only. Sign in with your own account
(the same Firebase project this app already uses — `kenokip-farm`), and
you'll see every submitted request. For each one you set a **total fee**
and, optionally, a **deposit** (leave the deposit at 0, or equal to the
total, for a "pay it all now" order — that's the natural shape for a
farmer who has their own tech expert and is paying upfront). That moves
the order to `quoted`.

**3. The farmer pays from their own `order.html?order=<id>` link** — a
"Pay now" button prompts for their M-Pesa number and pushes an STK Push
to it, through the exact same Till your own farm already collects on.
Paying the deposit (if one's set) moves the order to `deposit_paid`;
paying the rest moves it to `paid_in_full` — at that exact moment, a
license key is generated automatically and shown right there on the
page.

**4. You put that license key into the new farm's own `farm.config.js`**
(the `licenseKey` field — see the comment already there) as part of
setting up their copy of the app, and mark the order **"Mark
installed"** in `order-admin.html` once you've actually finished the
guided setup (bookkeeping only — doesn't change what the key does).

**5. Enforcement — `app.js` checks the key on every load.** If
`farm.config.js` has a `licenseKey` set, the app calls `checkLicense`
(in **your** Firebase project, `kenokip-farm` — see "Why this check
reaches back to your project" below) before showing anything. If it's
not active, the whole app is replaced by a "Payment required" screen —
nothing else renders, no read-only peek, no cached data visible. This
is the **"fully blocked"** behavior you asked for.

**Kenokip Farm's own `farm.config.js` has no `licenseKey` at all**, so
none of this is ever consulted for it — the app boots exactly as it
always has, zero behavior change.

## Money and accounts, and the one real limit

- **M-Pesa only, for now** — that's the only payment method `payOrderFee`
  supports. Visa, Mastercard, and PayPal are a different kind of
  integration entirely (a separate payment gateway/merchant account —
  e.g. Stripe, Pesapal, Flutterwave — settling to a *different* account,
  not your Till) and aren't set up here. If you want those later, that's
  its own project once you've chosen and signed up with a provider — I
  can't create that account for you.
- **All of it goes to the same Till** your farm's own deposits already
  use (`DEPOSIT_SECRETS`/`MPESA_SHORTCODE` etc. — see `SETUP-MPESA.md`).
  There's no second Till to configure.
- **It never touches your farm's own Finance records.** Installation
  orders live in their own Firestore collections (`installOrders`,
  `pendingOrderPayments`) completely separate from `finance`/`farms` —
  this is your business revenue from selling the app, not income for any
  one farm using it, so it was deliberately kept out of Reports/Income
  for every farm, including your own.
- **Only your account can manage orders.** `requireOwner()` in
  `functions/index.js` checks the signed-in account's email against
  `OWNER_EMAIL` (currently `kenokip.work@gmail.com`). If you ever sign
  into `order-admin.html` with a different email than that, change
  `OWNER_EMAIL` to match — it has to be an account that already exists
  in the Firebase Authentication tab of the `kenokip-farm` project (the
  same one your own farm's administrator account uses).

## Why this check reaches back to your project

Each new farm runs its OWN Firebase project (see
`HOW-TO-DEPLOY-FOR-A-NEW-FARM.md` — that's the whole "template" model).
But the order/payment records live in **your** project, `kenokip-farm`,
since selling installations is your business, not any one farm's. So
`app.js`'s license check doesn't use that farm's own Firebase
connection — it opens a second, independent Firebase app instance
pointed explicitly at `kenokip-farm`, just to ask "is this key active?"
and get back `{active: true/false}`. Nothing else about that farm's own
project, data, or Firestore document is touched by this at all.

## What happens if the check can't reach your server

A strict "block unless we just got a yes" design means a farm that's
fully paid up gets locked out of their own app the moment they're
briefly offline, or your Cloud Function has a cold-start hiccup — bad
for them, and it becomes a support call for you every time. So the
actual behavior is:

- Server says **active** → in. The result is cached on that device (with
  a timestamp) so a later rough patch of connectivity doesn't bounce
  them.
- Server says **not active** → always blocked, no matter what's cached.
  This is the one that's genuinely "fully blocked."
- Server **can't be reached at all** (offline, your Functions briefly
  down) → if this exact device confirmed "active" within the last 7
  days, let them in and quietly retry later; otherwise show a "can't
  verify your installation, check your connection" screen with a Retry
  button — not a silent guess either way.

That 7-day grace window is a judgment call, not something you asked for
specifically — if you'd rather it be stricter (no grace at all) or more
lenient, it's the `graceMs` line inside `checkLicenseAndBoot()` in
`app.js`.

## What's deliberately NOT included yet

- **Card/PayPal payments** — see above; needs its own gateway and its own
  follow-up piece of work once you've picked one.
- **Email/SMS notifications** — a farmer isn't automatically told when
  you've priced their order; right now that's on you to reach out on the
  phone number they gave you (shown in `order-admin.html`).
- **Editing/cancelling an order** once submitted — if someone makes a
  mistake, there's no self-service fix; they'd submit a new request.
- **Refunds** — not handled anywhere in this flow; M-Pesa refunds, if
  ever needed, happen the normal way through Safaricom/your own records,
  outside this system.
- **Partial-payment schedules beyond a single deposit** — it's deposit,
  then the rest, not an arbitrary number of installments.

## Before relying on this

1. **Deploy `functions` first** (not just hosting) — this round adds
   seven new Cloud Functions, and `order.html`/`order-admin.html` won't
   work at all until they're live. See "Deploying" below.
2. **Confirm `OWNER_EMAIL`** actually matches the email of the account
   you'll sign into `order-admin.html` with. If you're not sure, check
   Firebase Console → Authentication for the `kenokip-farm` project.
3. **Submit a test request** on `order.html` yourself (any farm name —
   you can tell it apart later). Confirm it shows up in
   `order-admin.html`.
4. **Set a small test fee** (e.g. KSh 10) with a deposit, and walk the
   whole flow with your own phone: pay the deposit (status should become
   `deposit_paid`), then pay the rest (status should become
   `paid_in_full` and a license key should appear on both
   `order.html?order=<id>` and in `order-admin.html`).
5. **Put that test license key into a throwaway `farm.config.js`**
   (temporarily, on a test copy — don't touch your real one) and load the
   app. You should get straight in — no lock screen.
6. **Now blank out that test order's payment** — easiest way: in
   Firebase Console, open the `installOrders` document and manually
   change `status` back to `quoted` and `licenseKey` to `null`. Reload
   the test app with that same key still in `farm.config.js` — you
   should now see the full "Payment required" screen, with no way
   through it.
7. Put your real `farm.config.js` back the way it was (no `licenseKey`,
   or `null`) and confirm Kenokip Farm itself still loads completely
   normally — this is the most important check, since it has to keep
   working no matter what else here does.

## Deploying

This round touches Cloud Functions, not just the front end, so the
deploy command is different from recent rounds:

```
git add functions/index.js app.js farm.config.js sw.js order.html order-admin.html HOW-TO-SELL-INSTALLATIONS.md
git commit -m "Add Installation Orders & Licensing: order.html, order-admin.html, app.js enforcement"
git push
firebase deploy --only functions,hosting
```

(`--only hosting` here deploys the small Firebase Hosting project that
only serves your M-Pesa webhook endpoints — harmless to include even
though it hasn't changed. Your actual app, including the two new pages,
is still served the way `README.md` already describes — pushing to your
GitHub Pages repo. `order.html` and `order-admin.html` go in the same
repo, right next to `index.html`, and go live the same way.)

Service worker cache bumped again (`kenokip-farm-v61` → `kenokip-farm-v62`)
so returning visitors on the main app pick up the change.
