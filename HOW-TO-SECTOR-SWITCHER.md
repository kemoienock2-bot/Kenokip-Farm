# Sector switcher, and a species-filtering fix

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
- **Other Livestock** — Dairy Cattle, Goats & Sheep, Pigs, Rabbits,
  Horses, whichever you've ticked, green pasture overlay. If Dairy
  Cattle is one of them, the banner shows a drawn cow illustration — see
  "About the cow image" below.
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
instead of a photo, the Other Livestock banner uses a cow I drew as
flat-color SVG artwork (`images/banners-cattle.svg`), in the same style
as the rest of the app's hand-drawn icons, sized to match your sketch's
wide banner shape. It's a deliberate, clearly-a-placeholder illustration,
not an attempt to pass as a real photo. Swapping in a real one later is
one line: drop a wide photo (roughly 1100×344, same shape as
`banners-hens.jpg`) into `images/`, and change the `"cattle"` path in
`FARM_PHOTOS.banners` near the top of `app.js` to point at it.

**The sidebar tagline now matches what's actually enabled.** A
poultry-only farm still says "Poultry Keeping," same as always. A farm
with more than one sector on says "Farm Management" until a sector's
picked, then shows that sector's name (e.g. "Other Livestock") while
it's active.

**Other Livestock now only shows what Farm Setup actually ticked.**
The overview tiles, the "Viewing" dropdown, and the Herd/Sales/Milk
pages behind them are now filtered to `enabledLivestockSpecies()` —
species Farm Setup doesn't have ticked just don't appear, anywhere in
that section, not only in the sidebar.

## Why "sector" means Poultry / Other Livestock / Crops, not one tile per animal

The three sectors line up exactly with Farm Setup's existing three
gated groups (`sectionEnabledByFarmSetup`) — Poultry's own
Flock/Eggs/Feed/Health, the one generic Other Livestock section, and
Crops. Splitting Other Livestock further into a separate top-level
sector per species (a Cattle sector, a separate Goats sector, and so
on) would mean rebuilding how that section's internal species tabs
work, on top of everything else changed recently — a much bigger,
riskier change for a page I can't run and test myself. Inside Other
Livestock, picking a specific animal (Dairy Cattle vs. Goats & Sheep)
still works exactly like it already did — the species tiles on that
section's own Overview page, now correctly limited to what you ticked.
If you'd rather each species be its own fully separate sector later,
that's a reasonable next step once this round's been tried for a bit.

## What to test before relying on this

1. **Kenokip Farm itself** — since Farm Setup there already has Poultry
   *and* Dairy Cattle on (from the farm Setup screenshot earlier), you
   should now see the two banners the next time you sign in: Poultry
   (real photo) on top, Other Livestock (cow illustration) below. Pick
   Poultry — you should land on Flock, and the sidebar should hide
   Other Livestock/Crops but keep Finance/Settings/etc. Now tap "Switch
   sector" at the top of any page (the button that used to say "Back to
   homepage") — you should land back on the two banners, pick Other
   Livestock this time — you should land on that section showing only
   Dairy Cattle, and now Flock/Eggs/Feed/Health should be hidden from
   the sidebar instead.
2. **The "+ Add or change" link** — tap it from the banner screen; it
   should open the same Farm Setup editor Settings → Edit Farm Setup
   already opens, with your current choices pre-ticked.
3. **A single-sector farm** (temporarily uncheck Dairy Cattle/Crops in
   Farm Setup, leaving just Poultry) — reload. You should NOT see the
   banners at all, "Back to homepage" should say exactly that again
   (not "Switch sector"), and Settings should not show the "Sector"
   card either — confirms the zero-sector-to-choose case stays a
   complete no-op. Turn Dairy Cattle back on afterward.
4. **Species filtering** — in Farm Setup, tick only Pigs (untick
   Cattle). The Other Livestock banner should now show its plain
   colored fallback (no cow — Pigs has no photo of its own yet) rather
   than a broken image; open the section and you should see only a Pigs
   tile, with the "Viewing" dropdown only listing Pigs' own pages.
5. **A non-admin account** — sign in as a Supervisor/Farmhand on a
   multi-sector farm; they should see the same banners (minus the
   "+ Add or change" link, admin-only), and afterward the same
   sector-based sidebar filtering, with their existing role-based
   restrictions (e.g. a Farmhand still can't open Finance) completely
   unchanged underneath it.
6. **Guest/demo mode** — confirm guest browsing skips the banners
   entirely and goes straight to Overview, same as before.
7. **Small screens** — check the banners on a phone-width browser; the
   label/subtitle should wrap cleanly rather than overflowing.

## Not included this round

- Each livestock species as its own fully independent top-level sector
  (see "Why" above) — Other Livestock stays one sector with its
  existing internal species picker, just correctly filtered now.
- Remembering a device's last-picked sector across reloads — by
  design, per what you asked for ("immediately they sign in, they are
  given an option"), it's asked again every fresh sign-in. If you'd
  rather it remember the last choice (so it only asks once per device,
  not once per page load), that's a one-line change to make later —
  just say so.
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
git commit -m "Redesign sector switcher as photo banners; hide app chrome behind full-screen gates"
git push
```

(GitHub Pages redeploys automatically — no `firebase deploy` needed for
this one, same as the Farm Setup/Crops/Horses round.)

Service worker cache bumped again (`kenokip-farm-v64` → `kenokip-farm-v65`).
