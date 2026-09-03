# Setting up logins, roles, and Finance approvals

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
