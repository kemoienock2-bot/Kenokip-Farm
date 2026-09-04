# Setting up logins, roles, and Finance approvals

> **Update (latest):** the Overview page's **all-time deficit/profit** card
> and the **Profit** stat tile are now visible only to you (Administrator)
> and Financial Staff — the same tier as the Finance tab itself. Supervisors,
> Vets, and Farmhands still see everything else on Overview (eggs, flock,
> spending by category, recent activity), and can still add and view
> individual Expenses and Income entries exactly as before — they just no
> longer see the combined profit/deficit bottom line. This is entirely a
> front-end change — just replace `index.html` and `sw.js`, no functions
> redeploy or rules change needed.

> **Earlier update:** three changes —
> 1. **Messages now have a Reply button.** Tapping it opens a new message
>    already addressed back to whoever sent the original, with a quote of
>    what they said shown above the reply so the thread stays clear (even
>    though it's technically a new message each time, not a live chat
>    thread).
> 2. **Urgent messages can now pop up even when a team member isn't
>    actively looking at the app** — as a real notification from the
>    browser/phone itself, with sound, as long as the app or its browser
>    tab is still running somewhere in the background (another tab,
>    minimized, or a phone with the screen off but the app not fully
>    closed). Each person turns this on once per device, from **Settings →
>    Your account → "Enable background urgent alerts"** (their browser will
>    ask them to allow it). **Important limit:** this can't reach someone
>    whose browser or app has been fully closed/force-quit — nothing is
>    running to receive it in that case. Making it work even then needs a
>    much bigger "push notification" system (a server permanently reaching
>    out to Apple/Google's own notification services) — tell me if you
>    want that built next; it's a separate, larger job.
> 3. **You can now name team members who were added before names existed**
>    — go to **Team**, and there's an "Edit name" button next to each of
>    their rows.
>
> **This one needs both steps**: redeploy functions (`firebase deploy --only
> functions`) — the reply feature and the name-editing both live there —
> *and* replace `index.html` and `sw.js` as usual. No Firestore rules change
> this time.

> **Earlier update:** four changes —
> 1. **Access log is now paginated**, 10 sign-ins per page with Prev/Next.
> 2. **Financial Staff can now receive money without your approval** —
>    deposits (money in, including "Add via M-Pesa", now available to them
>    too) are added immediately. Only withdrawals (money out) still wait for
>    you to approve. You (Administrator) are unaffected — everything you add
>    is still immediate either way.
> 3. **In-app messaging** — a new Messages tab (bell icon, with an unread
>    badge) for the whole team. You can message everyone at once or one
>    person; everyone else can message any individual team member (including
>    you) but not the whole team. Messages are written with an urgency level
>    (Normal / Important / Urgent) and grouped that way in the inbox. Every
>    message shows who it's from as "Role(Name)" — e.g. "Supervisor(John)" —
>    so team members now set their own display name once, from Settings →
>    Your account (you can set yours there too, and it's also asked for when
>    you add a new team member from now on).
> 4. **Urgent messages pop up immediately** with a warning banner and a
>    short alert sound, for whoever they're addressed to (or everyone, for a
>    broadcast) — impossible to miss even if Messages isn't open.
>
> **This one needs both steps**: redeploy functions (`firebase deploy --only
> functions`) *and* republish the Firestore rules in `firestore.rules` (two
> rules changed: the team roster is now readable by any signed-in account,
> not just you, since everyone needs it to pick who to message; and a new
> `messages` collection was added, oversight-visible to you and otherwise
> restricted to sender/recipient/broadcast). Then replace `index.html` and
> `sw.js` as usual.

> **Earlier update:** the access log (Team tab, administrator-only) now turns a
> sign-in's coordinates into an actual place name — e.g. "Kondele, Kisumu,
> Kenya" — using a free map lookup, and also shows which device/browser was
> used. If it still shows "Location denied" for someone, that means their
> browser's location permission was declined, or (on iPhone/Android)
> Location Services is off for that browser at the device level — not a bug
> in the app. To pick this up: redeploy functions (`firebase deploy --only
> functions`) and replace `index.html` and `sw.js` — no rules change needed
> for this part.

This adds the login screen you asked for, with three tiers:

- **Administrator** (you) — sees and can do everything, including approving Finance entries and managing the team.
- **Employees** — you create their accounts and pick a role for each: **Supervisor**, **Vet / Doctor**, **Financial Staff**, or **Farmhand**. All employees can use Flock, Eggs, Expenses, Income and Settings. Only Financial Staff (and you) can see Finance at all, and Financial Staff can only *propose* Finance entries — nothing counts toward the balance until you approve it.
- **Guest** — no account needed, just tap "Continue as Guest". Guests can view everything except Finance (which is completely hidden for them), and can't change anything.

It also adds GPS-tagged access logging (who signed in, when, and roughly where, if they allow location), and an automatic 5-minute sign-out for accounts that touch Finance (you and Financial Staff) if the app sits idle.

## A few things I filled in creatively — flag if you'd rather I change any of these

You said to be creative where you hadn't specified something and check with you afterward, so here's exactly what I decided and why:

1. **The 5-minute idle sign-out applies to you (Administrator) and Financial Staff only** — not Supervisors, Vets, or Farmhands — since they're the two roles that can touch money. Say the word if you'd rather it apply to every signed-in account.
2. **"Add via M-Pesa" is Administrator-only.** Financial Staff can propose manual deposits/withdrawals (for approval), but only you can trigger a real M-Pesa STK push.
3. **Only the Administrator can edit or delete a Finance entry**, approved or pending — Financial Staff can add new entries but not touch existing ones.
4. **General farm sections (Flock, Eggs, Expenses, Income, Settings) are open to every signed-in employee**, regardless of role — I didn't see a reason to restrict, say, a Farmhand from logging eggs. Guests are the only read-only tier.
5. **Guests are read-only everywhere they can see** (not just Finance, which is hidden outright) — this reuses a "read-only mode" that was already built into the app but never turned on.
6. **Signing in now requires an internet connection** (accounts live in Firebase, not on the device). If the app is opened for the very first time with no internet at all, only Guest mode works until it reconnects — this didn't come up before because there was no login system.

None of these are hard to change — tell me if you'd like something different.

## 1. Deploy the updated Cloud Functions

The new backend (`functions/roles.js`) is already wired into `functions/index.js`. From `pwa-build`:

```
firebase deploy --only functions
```

This adds 10 new functions (account creation, Finance approvals, access logging) alongside the 4 M-Pesa ones you already have.

## 2. Publish the updated Firestore security rules

This is the important one — it's what actually enforces all of the above (a determined user poking at the browser console can't bypass it). Open the [Firebase Console](https://console.firebase.google.com) → your `kenokip-farm` project → **Firestore Database** → **Rules**, and replace everything there with the contents of `firestore.rules` (included in this update), then click **Publish**.

**One behavior change to know about:** Flock/Eggs/Expenses/Income/Settings used to be editable by absolutely anyone with the link, no account needed. With the new rules, editing those now requires being signed in (Administrator or any employee) — reading is still open to everyone, including guests. This is a direct consequence of adding accounts and is what makes "Guest" mean something.

## 3. Replace `index.html` and `sw.js`

Same as before — drop these into `pwa-build`, overwriting the old ones, then commit and push.

## 4. Become the Administrator (one-time)

The very first time *you* open the updated app and sign in with your existing Firebase account (the same email/password you used before for "Sign in as owner"), the app automatically makes you the Administrator — no extra setup step. After that, use the new **Team** tab (visible only to you) to add employees: pick their role, set a temporary password, and share it with them directly. There's no self-registration — every account is created by you.

## 5. Push the new files

```
git add functions/index.js functions/roles.js firestore.rules index.html sw.js SETUP-ROLES.md
git commit -m "Add roles, logins, Finance approvals, and access logging"
git push
```

## What this doesn't cover yet

Sending money out still stays a manual log entry (same as before) — this update is about *who* can add/approve entries, not automating outgoing payments. And M-Pesa itself is still on the sandbox placeholders you asked to keep for now, separate from this.
