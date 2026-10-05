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
want to work on?" screen first, with one tile per enabled sector:

- **Poultry** — Flock, Eggs, Feed, Health
- **Other Livestock** — whichever species you've ticked (Dairy Cattle,
  Goats & Sheep, Pigs, Rabbits, Horses)
- **Crops**

Picking one takes you straight into that sector and hides the other
sectors' sections from the sidebar for the rest of that session —
**Finance, Income, Expenses, Reports, Customers, Team, Messages,
Settings, About stay exactly where they were, for everyone, regardless
of which sector is active** — those are "common," never sector-gated.
You can switch anytime from **Settings → Sector → Switch sector**,
without signing out — it just brings the chooser back up.

**A farm with 0 or 1 sectors enabled never sees this at all.** If
Poultry is the only thing turned on, the app behaves exactly as it
always has — straight in, no extra screen, no behavior change. This
only appears once a farm has actually turned on a second thing to
choose between.

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
   should now see the sector chooser the next time you sign in. Pick
   Poultry — you should land on Flock, and the sidebar should hide
   Other Livestock/Crops but keep Finance/Settings/etc. Go to Settings
   → Sector → Switch sector, pick Other Livestock instead — you should
   land on that section showing only Dairy Cattle (not Goats/Pigs/
   Rabbits/Horses, since those were never ticked), and now Flock/Eggs/
   Feed/Health should be hidden from the sidebar instead.
2. **A single-sector farm** (temporarily uncheck Dairy Cattle/Crops in
   Farm Setup, leaving just Poultry) — reload. You should NOT see the
   chooser at all, and Settings should not show the "Sector" card
   either — confirms the zero-sector-to-choose case stays a no-op.
   Turn Dairy Cattle back on afterward.
3. **Species filtering** — in Farm Setup, tick only Pigs (untick
   Cattle). Open Other Livestock (via the sector chooser or Settings →
   Switch sector) — you should see only a Pigs tile, and the "Viewing"
   dropdown should only list Pigs' own pages.
4. **A non-admin account** — sign in as a Supervisor/Farmhand on a
   multi-sector farm; they should see the same chooser, and afterward
   the same sector-based sidebar filtering, with their existing
   role-based restrictions (e.g. a Farmhand still can't open Finance)
   completely unchanged underneath it.
5. **Guest/demo mode** — confirm guest browsing skips the chooser
   entirely and goes straight to Overview, same as before.

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
git add app.js styles.css sw.js HOW-TO-SECTOR-SWITCHER.md
git commit -m "Add per-sign-in sector switcher; fix Other Livestock to respect Farm Setup's species list"
git push
```

(GitHub Pages redeploys automatically — no `firebase deploy` needed for
this one, same as the Farm Setup/Crops/Horses round.)

Service worker cache bumped again (`kenokip-farm-v62` → `kenokip-farm-v63`).
