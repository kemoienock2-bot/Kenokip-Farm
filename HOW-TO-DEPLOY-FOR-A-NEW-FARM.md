# Running this app for a different farm (the "template" model)

## The model, in one paragraph

Each farm runs its **own copy** of this app, in its **own** Firebase
project, with its **own** M-Pesa credentials. There's no shared login,
no shared database, no shared Firebase bill — a new farmer sets up
their copy the same way Kenokip Farm's was set up (Firebase project →
Firestore → Cloud Functions → M-Pesa → deploy), using the existing
SETUP-MPESA.md / SETUP-B2C.md / SETUP-ROLES.md / SETUP-SECURITY.md
guides already in this repo. This update's only job is to make sure
that setup takes editing **one small file**, not hunting through an
8,000-line `app.js` for a hardcoded farm name.

This is deliberately the smaller, lower-risk option compared to a
single shared app that many farms log into (one Firebase project,
tenant-scoped data, per-tenant M-Pesa credentials, you hosting it as a
service). That's a real possibility worth building later if enough
farmers want in to justify it — but it's a much bigger rebuild, and
M-Pesa specifically gets harder (today's setup assumes one Till and
one Paybill's worth of secrets; a shared app needs a different
credential per farm, stored safely). Starting with the template model
now doesn't block moving to that later.

## What changed

A new file, **`farm.config.js`**, loaded by `index.html` right before
`app.js`:

```js
window.FARM_CONFIG = {
  id: 'kenokip',        // Firestore document id — farms/<id>, finance/<id>
  name: 'Kenokip Farm'   // sidebar brand text + browser tab title
};
```

`app.js` now reads `FARM_DOC`, `FINANCE_DOC`, and the sidebar brand
text from this file (falling back to `'kenokip'` / `'Kenokip Farm'` if
it's ever missing, so nothing breaks if a build doesn't load it for
some reason).

## Checklist for a new farmer's deployment

1. **Firebase project** — a new one, separate from Kenokip Farm's.
   Firestore, Cloud Functions, Hosting, Authentication, Storage enabled
   the same way (see SETUP-MPESA.md's early steps for the general
   shape).
2. **`farm.config.js`** — set `id` to a short slug for their farm
   (e.g. `'mwangi-poultry'`) and `name` to their farm's display name.
   This is the one file that has to change for the app itself to point
   at their data instead of Kenokip Farm's.
3. **`manifest.webmanifest`** — `name` and `short_name` are what shows
   under the home-screen icon when someone installs the PWA. This is
   plain JSON, fetched directly by the browser — it can't read
   `farm.config.js`, so it needs its own one-line edit.
4. **`index.html`** — the `<title>` tag and the
   `apple-mobile-web-app-title` meta tag are static fallbacks for the
   instant before `app.js` runs and sets `document.title` itself (see
   `HOW-TO-ADD-OTHER-LIVESTOCK.md`'s sibling change in `app.js`). Worth
   updating so that instant doesn't flash "Kenokip Farm".
5. **Branding/content that's still Kenokip-specific** — these are
   *content*, not code, and the new farmer will naturally want their
   own anyway, so this update leaves them alone rather than guessing:
   - The **About page** story/mission/vision — edit from inside the
     app itself (Settings → About, administrator only) once it's
     running; no file edit needed.
   - **Real farm photos** (`images/`, referenced by `FARM_PHOTOS` near
     the top of `app.js`) — Kenokip Farm's actual chicken/coop photos.
     A new farmer keeping different animals will want their own
     photos here regardless.
   - The **logo** (`icons/logo-mark.png`) and app icons
     (`icons/icon-*.png`) — swap these image files for the new farm's
     own branding.
   - Scattered mentions of "Kenokip" in page subtitles (e.g. Finance's
     "Your poultry-only bank account" doesn't name the farm, but a few
     other strings do) — `grep -i kenokip app.js index.html
     manifest.webmanifest` finds all of them if you want a full sweep.
6. **M-Pesa credentials, Firebase secrets, roles** — exactly the
   existing setup docs (SETUP-MPESA.md, SETUP-B2C.md,
   SETUP-SECURITY.md, SETUP-ROLES.md), run fresh against the new
   Firebase project. Nothing about those changes with this update.
7. **Deploy**: `firebase deploy --only hosting,functions` (from their
   own project, with their own `firebase use` / `.firebaserc`).

## What this update does NOT do

It does not make this one deployment serve multiple farms (that's the
shared-SaaS model, not built). It does not migrate or copy Kenokip
Farm's existing data anywhere. It does not change anything about how
Kenokip Farm's own deployment behaves — `farm.config.js` ships with
`id: 'kenokip'`, `name: 'Kenokip Farm'`, so this is a no-op for the
farm you're already running, confirmed by `node --check` on both
changed files.
