# Setting up real push notifications

This turns on the last piece: **Urgent** messages reaching your phone even
when the app is fully closed (not just backgrounded). The backend for this
is already written and deployed the moment you run `firebase deploy
--only functions` for this update — the one thing left is a single key only
you can get, from your own Firebase account.

## Why this step can't be done from here

Push notifications work through Google's own delivery service. To use it,
a website has to prove it owns itself with a "Web Push certificate" — a
key generated inside your Firebase project's console, tied to your
Google account. There's no API for generating this from outside the
console, so it has to be a manual step, the same way the M-Pesa Go Live
application had to be done directly with Safaricom.

## The one manual step

1. Go to https://console.firebase.google.com and open the **kenokip-farm**
   project.
2. Click the gear icon next to "Project Overview" → **Project settings**.
3. Open the **Cloud Messaging** tab.
4. Scroll to **Web Push certificates** (or **Web configuration**) and click
   **Generate key pair** if you don't already have one.
5. Copy the long key it shows you (starts with something like
   `BN...` and is around 90 characters).
6. Open `index.html` in a text editor, find this line near the top of the
   `<script id="app-script">` section:
   ```js
   var VAPID_KEY = 'PASTE_YOUR_VAPID_KEY_HERE';
   ```
   and replace `PASTE_YOUR_VAPID_KEY_HERE` with the key you copied, so it
   reads something like:
   ```js
   var VAPID_KEY = 'BNa1b2c3...............................xyz';
   ```
7. Save, then push it like you have been:
   ```
   git add index.html
   git commit -m "Add real VAPID key for push notifications"
   git push
   ```

That's it — no functions redeploy needed for this last step, since the key
only lives in the front-end file. Netlify will pick it up automatically.

## Turning it on, per device

Once the key is in place, each person turns this on for their own phone or
computer from **Settings → Your account → Enable background alerts** (the
same button that already existed) — tapping it now also registers that
device for real push, silently, alongside what it already did. If someone
already tapped it before this update, they'll register automatically the
next time they sign in — no need to tap it again.

## What still doesn't happen

Only **Urgent** messages trigger a push (same rule as before, for the
in-tab alert). Regular messages, and everything else in the app, still
only show up when someone opens it — this was a deliberate choice to keep
notifications rare enough that "Urgent" stays meaningful. If you'd like more
things to push later (an overdue vaccination, say), that's a small
follow-up, not a rebuild.
