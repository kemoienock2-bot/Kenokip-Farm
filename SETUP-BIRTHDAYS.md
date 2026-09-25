# Birthdays &amp; Kudos — dates of birth, a dedicated PIN, birthday wishes, and team recognition

This adds: a private "date of birth" field for every account (yours and
each team member's), a dedicated Birthday PIN that only the administrator
sets up and that gates seeing anyone else's exact date of birth, an
automatic birthday congratulations + team announcement on the day, a
private 7-day heads-up before that so you can plan something, and a new
"Kudos" feature for congratulating the team (as a group or individually)
with a reward note — with ready-made sentences and reward suggestions you
can pick from instead of writing one from scratch every time. No new npm
package is needed — everything here reuses the same hashing
(`cryptoHelpers.js`) and push (`push.js`) code already used elsewhere in
this app. One deploy step, same as any other Cloud Functions + rules change:

```
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Why a date of birth never shows up in Team Directory by itself

`users/{uid}` — the collection behind Team Directory and messaging — is
readable by any signed-in account, by design (that's how the roster and
picking a message recipient work). A date of birth is never written there.
It lives instead in a brand-new `privateProfiles/{uid}` collection that,
like the existing `security/{uid}` collection (2FA secrets, Finance PIN),
denies every direct client read or write — the only way in or out is
through Cloud Functions, which is what actually makes "the administrator
is the only one who can ever see someone else's birthday" a real,
server-enforced rule rather than something the app's UI merely hides.

## Who can set a birthday

Either the person themselves (Settings → Your account → **Set your
birthday**, or the same from their own card in Team Directory) or the
administrator (when adding a team member, or from Team Directory once
revealed). Writing a birthday never needs the Birthday PIN — only reading
someone else's back does. Your own birthday is always visible to you, no
PIN needed either.

## Setting up the Birthday PIN (administrator only)

From **Settings → Your account**, once this update is deployed:

1. Set a Birthday PIN (4–8 digits) — yours alone, separate from your
   Finance PIN and from your sign-in password. Nobody else can see it,
   not even a Co-Administrator.
2. From Team Directory, tap the eye icon next to **Everyone on the farm**
   and enter that PIN to reveal every team member's date of birth at
   once — masked again the moment you tap it back, or on your next
   visit/reload (this never stays "unlocked" between sessions, the same
   way revealing Finance amounts doesn't).

**Three wrong PINs in a row** locks birthday-viewing (not Finance, not
sign-in — its own separate lockout) and sends you an urgent alert.
Clear it from Settings → Your account whenever you're ready — no second
factor required for that, since it's already just you, already signed in.

## Birthday wishes &amp; reminders

Every morning (7am, Africa/Nairobi time):

- **7 days before someone's birthday:** a private heads-up, administrator
  only, so there's time to plan something. Nobody else is told.
- **On the day itself:** this is the one deliberate exception to "only the
  administrator ever sees a date of birth" — the birthday person gets a
  personal congratulations "from Kenokip Farm", and everyone else on the
  team gets a message saying it's their birthday, so they can wish them
  well too. That's what makes the celebration possible, but it's kept as
  narrow as it can be: only the **day** (month + day) is ever mentioned to
  anyone but you — the **year**, and so the exact date of birth and age,
  is never included in any message to anyone, and the actual date on file
  still only ever comes back through the Birthday PIN reveal above.

## Congratulating the team ("Kudos")

From **Messages → 🎉 Congratulate the team**, or **Team Directory → 🎉
Congratulate** on any individual's card (administrator/Co-Administrator
only): pick a ready-made sentence (or write your own), optionally add a
reward from the preset list — or type your own — and send. It shows up in
Messages like anything else, with its own 🎉 pill, and pops up with a
sound for whoever it's sent to (or everyone, if sent to the team).

**Worth knowing:** the reward field is just a note that gets included in
the message — there's no actual payout mechanism behind it. Following
through on a promised bonus, day off, or gift is still a real-world step
you take yourself.

## Honest limits

Same shape as every other PIN in this app: the lockout-after-3 is the real
defense, not a guarantee nothing can ever go wrong. Someone who already
has the administrator's own unlocked device and 3 correct guesses in them
can still get in — this stops casual looking and anyone without the
administrator's PIN, nothing more.
