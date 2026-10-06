# Sector switcher, and a species-filtering fix

> **Update:** the "Why sector means Poultry / Other Livestock / Crops, not
> one tile per animal" section near the bottom of this doc described the
> *first* version of this feature, before each livestock species became
> its own sector. That section is now rewritten — see "Each livestock
> species is now its own sector" below. Everything else on this page still
> applies.

## The problem this fixes

Farm Setup (from the earlier update) decides what a farm tracks at all —
a one-time, admin-only choice. But two things were still wrong:

1. **Everyone always landed on Poultry anyway.** Farm Setup only
   controlled whether a section showed up in the sidebar at all — it
   never asked anyone, each time they opened the app, which of the
   enabled sections they actually wanted to work in right now. The
   sidebar also always said "Poultry Keeping" under the farm name, no
   matter what else was turned on.
2. **Other Livestock ignored Farm Setup once you were inside it.** If
   you'd only ticked Dairy Cattle, opening "Other Livestock" still
   showed tiles for Goats & Sheep, Pigs, Rabbits, and Horses too — Farm
   Setup's species list was never actually checked past the sidebar.
   That's a real bug, not new behavior — it's fixed now regardless of
   anything else in this update.

## What changed

**A per-sign-in sector switcher.** Every time anyone opens the app
(every fresh sign-in — not repeatedly during the same session), if
Farm Setup has 2 or more sectors turned on, they now see a "What do you
want to work on?" screen first — one big, full-width photo banner per
enabled sector, stacked top to bottom (matching the sketch you sent):

- **Poultry** — a real photo from your own flock (the same
  `images/banners-hens.jpg` already used elsewhere in the app), warm
  amber/brown overlay, "Flock, eggs, feed & health."
- **One banner per livestock species you've ticked** — Dairy Cattle,
  Goats & Sheep, Pigs, Rabbits, and/or Horses each get their *own* band
  now, not one combined "Other Livestock" band — see "Each livestock
  species is now its own sector" below. Dairy Cattle's banner shows a
  drawn cow illustration (see "About the cow image"); the others show a
  plain colored band in their own color with their own icon, since
  there's no artwork for them yet.
- **Crops** — gold overlay, no photo yet, so it falls back to a plain
  colored banner with a leaf icon rather than showing anything broken.

Whichever one you already have active shows a small checkmark badge in
the corner. Picking a banner takes you straight into that sector and
hides the other sectors' sections from the sidebar for the rest of that
session — **Finance, Income, Expenses, Reports, Customers, Team,
Messages, Settings, About stay exactly where they were, for everyone,
regardless of which sector is active** — those are "common," never
sector-gated.

**Switching back is the same "Back to homepage" button that was already
in the topbar** — you asked for this specifically rather than a new
button: once a sector's active, that existing button relabels itself
"Switch sector" and takes you back to this same banner screen instead
of Overview. A farm with 0-1 sectors never sees this change — the
button still says "Back to homepage" and goes to Overview, exactly like
before.

**A quiet "+ Add or change what this farm tracks" link sits right under
the banners** (administrator only) — that's the "portal to add more
later" you asked for. It opens the same Farm Setup editor as Settings →
Edit Farm Setup; nothing new to maintain, just a second, more
discoverable door to the same place.

**A farm with 0 or 1 sectors enabled never sees any of this.** If
Poultry is the only thing turned on, the app behaves exactly as it
always has — straight in, no extra screen, no behavior change. This
only appears once a farm has actually turned on a second thing to
choose between.

## Fixed: the sidebar/search/tab bar used to stay visible behind the chooser

The first version of this still showed the full sidebar (every section
— Flock, Eggs, Other Livestock, Income, Finance, Customers, the lot),
the search bar, and the mobile tab bar behind the two banners — so the
chooser looked like an overlay on top of the normal app rather than its
own clean screen. That's fixed: while either the sector chooser or the
Farm Setup screen is showing, the sidebar, search bar, and mobile tab
bar (and the floating "Kem AI" button) are all hidden completely — the
banners are the only thing on screen, same as Farm Setup already looked
on a brand-new farm. They all come back the instant you pick a sector
(or finish Farm Setup), exactly as before.

## About the cow image

I don't have a tool in this environment that generates real photos — so
instead of a photo, the Dairy Cattle banner uses a cow I drew as
flat-color SVG artwork (`images/banners-cattle.svg`), in the same style
as the rest of the app's hand-drawn icons, sized to match your sketch's
wide banner shape. It's a deliberate, clearly-a-placeholder illustration,
not an attempt to pass as a real photo. Swapping in a real one later is
one line: drop a wide photo (roughly 1100×344, same shape as
`banners-hens.jpg`) into `images/`, and change the `"cattle"` path in
`FARM_PHOTOS.banners` near the top of `app.js` to point at it. The other
four species (Goats & Sheep, Pigs, Rabbits, Horses) have no artwork at
all yet — their bands fall back to a plain colored panel (each its own
color — rust, dusty rose, violet, chestnut) with that species' own icon,
the same safe fallback Crops already used, rather than a broken image.
Give any of them a real photo the same one-line way, any time.

**The sidebar tagline now matches what's actually enabled.** A
poultry-only farm still says "Poultry Keeping," same as always. A farm
with more than one sector on says "Farm Management" until a sector's
picked, then shows that sector's name (e.g. "Dairy Cattle") while it's
active.

## Each livestock species is now its own sector

The first version of this (described above) still treated all of
Dairy Cattle/Goats & Sheep/Pigs/Rabbits/Horses as one combined "Other
Livestock" sector, with its own internal species picker once you were
inside it. You asked for each species to be its own fully separate
sector/portal instead, and that's what this round does:

- **One banner per species you've ticked**, not one combined banner —
  if a farm has Dairy Cattle, Goats & Sheep, and Pigs all on, it now
  sees three separate livestock bands on the chooser (plus Poultry and
  Crops if those are on too), each with its own name, color, and icon.
- **Picking one jumps straight into that species' own Herd page** —
  not a generic "Other Livestock" overview with tiles for every
  species. Dairy Cattle also gets its Milk log, since it's the one
  species with a journal; the others just get Herd and Sold & Lost.
- **Fully siloed once you're in** — while a specific species sector is
  active, the "Viewing" dropdown, the sidebar, and the page heading all
  show only that species. Goats & Sheep stays completely invisible
  while you're inside the Dairy Cattle sector, and vice versa — not
  just hidden from the sidebar, the same way Poultry and Crops already
  stayed out of each other's way.
- **The sidebar and page heading now show the species' own name** —
  "Dairy Cattle" with its own icon, not "Other Livestock" — while that
  species' sector is active. It reads the same as if Dairy Cattle had
  always been its own dedicated section.
- **"Switch sector" still takes you back to the same chooser** as
  before, with every enabled sector listed again — Poultry, each
  livestock species, Crops — pick a different one, or the same one
  again, exactly like switching between Poultry and Crops already
  worked.

Nothing about Finance, Income, Expenses, Reports, Customers, Team,
Messages, Settings, or About changes — those stay "common" and fully
visible no matter which species sector is active, same as always.

## What to test before relying on this

1. **Kenokip Farm itself** — Farm Setup there has Poultry and Dairy
   Cattle on, so you should see exactly two banners at sign-in: Poultry
   (real photo) and Dairy Cattle (cow illustration) — same two as
   before, just Dairy Cattle is now its own named banner instead of
   "Other Livestock." Pick Dairy Cattle — you should land straight on
   its Herd page (not an overview with tiles), the sidebar should show
   "Dairy Cattle" (not "Other Livestock") with the cow icon, and
   Flock/Eggs/Feed/Health should be hidden. Tap "Switch sector" — you're
   back on the two banners.
2. **A farm with several livestock species on** (tick Dairy Cattle,
   Goats & Sheep, and Pigs in Farm Setup, temporarily, to try this) —
   you should see one banner per species, each its own color/icon, each
   opening straight into that species' own Herd page with the other
   species completely out of the sidebar and the "Viewing" dropdown
   while it's active. Switching sector and picking a different species
   should swap which one you see with nothing left over from the last
   one.
3. **The "+ Add or change" link** — tap it from the banner screen; it
   should open the same Farm Setup editor Settings → Edit Farm Setup
   already opens, with your current choices pre-ticked.
4. **A single-sector farm** (temporarily uncheck Dairy Cattle/Crops in
   Farm Setup, leaving just Poultry) — reload. You should NOT see the
   banners at all, "Back to homepage" should say exactly that again
   (not "Switch sector"), and Settings should not show the "Sector"
   card either — confirms the zero-sector-to-choose case stays a
   complete no-op. Turn Dairy Cattle back on afterward.
5. **Species filtering carries over** — with only Pigs ticked (no
   Cattle), the Pigs band should show its plain colored fallback (no
   photo), open straight into the Pigs herd, and the "Viewing" dropdown
   should only list Pigs — no Cattle/Goats/Rabbits/Horses anywhere.
6. **A non-admin account** — sign in as a Supervisor/Farmhand on a
   multi-species farm; they should see the same banners (minus the
   "+ Add or change" link, admin-only), and afterward the same
   per-species sidebar filtering, with their existing role-based
   restrictions (e.g. a Farmhand still can't open Finance) completely
   unchanged underneath it.
7. **Guest/demo mode** — confirm guest browsing skips the banners
   entirely and goes straight to Overview, same as before.
8. **Small screens** — check the banners on a phone-width browser; the
   label/subtitle should wrap cleanly rather than overflowing, even with
   five or six bands stacked.

## Not included this round

- Remembering a device's last-picked sector across reloads — by
  design, per what you asked for ("immediately they sign in, they are
  given an option"), it's asked again every fresh sign-in. If you'd
  rather it remember the last choice (so it only asks once per device,
  not once per page load), that's a one-line change to make later —
  just say so.
- Real photos for Goats & Sheep, Pigs, Rabbits, or Horses — those four
  still show a plain colored band with an icon, same as Crops. Drop in
  a photo for any of them the same one-line way described above for
  cattle, any time you have one.
- Renaming "Poultry Keeping" everywhere else it's hardcoded (the
  browser tab title in `index.html`, the sign-in screen, and the three
  printed receipt/report headers) — those still say "Poultry Keeping"
  unconditionally. The sidebar tagline was the one that actively
  contradicted a multi-sector farm on every single page, so that's the
  one this round fixed; the others are cosmetic/print text, left alone
  unless you want them changed too.

## Deploying

Front-end only — no Cloud Functions touched this round:

```
git add app.js styles.css sw.js images/banners-cattle.svg HOW-TO-SECTOR-SWITCHER.md
git commit -m "Each livestock species becomes its own sector/portal, instead of one combined Other Livestock sector"
git push
```

(GitHub Pages redeploys automatically — no `firebase deploy` needed for
this one, same as the Farm Setup/Crops/Horses round.)

Service worker cache bumped again (`kenokip-farm-v65` → `kenokip-farm-v66`).
