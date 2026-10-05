# Farm Setup picker, Crops, and Horses

## What this adds

**1. A "Farm Setup" picker.** On a brand-new farm document (a fresh
template deployment for a new farmer — see
`HOW-TO-DEPLOY-FOR-A-NEW-FARM.md`), signing in now shows a welcome
screen before anything else: pick Livestock and/or Crops (both can be
on — this is a mixed-farm-friendly either/or/both choice, not
exclusive), and if Livestock is on, tick which species apply (Poultry,
Dairy Cattle, Goats & Sheep, Pigs, Rabbits, Horses). Saving it is what
unlocks the rest of the app, and only the administrator can save it —
anyone else signing in first sees "the administrator is finishing farm
setup."

**Kenokip Farm itself skips this.** `migrateState()` auto-detects an
existing farm (anything already in `state.flock`, `state.eggs`,
`state.feedLogs`, or any `state.livestock.*` species) and marks setup
already "completed" with Poultry (and anything else you've already
started using) pre-selected — so this update changes nothing about what
you see today. This only ever shows up for a genuinely empty farm
document.

**It's reachable again later**, not just a one-time thing: Settings →
Farm Setup → "Edit Farm Setup" (administrator only) reopens the picker
with your current choices pre-ticked, so adding Horses or turning on
Crops six months from now doesn't need a code change.

**2. Section visibility follows the picker.** Flock/Eggs/Feed/Health
only show in the sidebar if Poultry is ticked; Other Livestock only
shows if at least one non-poultry species is ticked; Crops only shows
if Crops is ticked. This is enforced in `sectionEnabledByFarmSetup()`
and checked by `sectionAllowed()` for every role, including the
administrator — so a goat-only farm genuinely never sees Flock/Eggs
cluttering its nav, it's not just hidden from lower roles.

**3. Horses**, as a sixth livestock species — see the note at the top
of `HOW-TO-ADD-OTHER-LIVESTOCK.md`. Works exactly like Cattle/Goats &
Sheep/Pigs/Rabbits (herd + sales & losses, no milk-style journal).

**4. Crops**, a new section — on purpose much simpler than Livestock:
one flat, dated journal rather than a per-plot model. Each entry is a
crop name, a type (Planted / Harvested / Sold / Lost-spoiled / Other),
an optional quantity + unit (free text — "40 kg", "12 bags", whatever
fits), and for a Sold entry, an optional amount that automatically
files into Income under "Crop Sales" — same linked-income pattern
Livestock sales use. That's it. You said crops should stay basic for
now and Livestock should get the real attention, so this is
deliberately a fraction of Livestock's depth — no plots, no seasons,
no per-crop expected-harvest tracking yet. Easy to grow later once
it's clearer what's actually needed week to week.

## Why a flat picker instead of something fancier

The brief was "attractive and professional," and the honest trade-off
here is between a multi-step wizard with animations and a single clean
screen that's easy to get right on the first try, on a file I can't
run in a browser myself. I went with one well-laid-out screen —
two big tiles for Livestock/Crops, a clean grid of species tiles below,
a single "Save and continue" button — styled with new CSS (hover
lift, a highlighted border + tint on whichever tiles are checked) that
only touches new class names, so none of it can visually affect
anything else in the app. If you want a flashier multi-step version
later, this is a reasonable foundation to build it from rather than a
dead end.

## What to test before relying on this

This is the riskiest change of the three (it gates whether entire
sections even render), so test it deliberately:

1. **Existing farm unaffected** — reload Kenokip Farm's real data after
   deploying this. Flock/Eggs/Feed/Health/Other Livestock should all
   still be exactly where they were; nothing should prompt a setup
   screen. If anything's missing, check the browser console for errors
   in `migrateState()` before going further.
2. **Fresh-farm path** — the easiest safe way to test the picker itself
   without touching real data: temporarily point `farm.config.js` at a
   throwaway `id` (e.g. `'test-setup-1'`) that has no Firestore document
   yet, reload, and you should land straight on the Farm Setup screen.
   Try: Crops only, Livestock only, both, every species combination,
   submitting with nothing ticked (should be blocked with a toast), and
   confirm the right sidebar sections appear afterward. Change
   `farm.config.js` back to `'kenokip'` when done.
3. **Settings → Edit Farm Setup** — as the administrator, reopen it,
   change something (e.g. add Horses), save, confirm the sidebar
   updates and nothing you'd already entered elsewhere was touched.
4. **Non-admin during setup** — sign in as a non-administrator role
   while setup is incomplete (easiest via step 2's throwaway farm ID)
   and confirm they see the "almost ready" holding message, not the
   picker itself.
5. **Crops** — add a Planted entry, a Harvested entry, and a Sold entry
   with an amount; confirm the Sold one shows up in Income under "Crop
   Sales," and deleting it removes that linked income entry too.

## Not included yet

Same spirit as Other Livestock's own list: no receipts for crop sales,
no 30-day Trash recovery for crop or farm-setup changes, no global
search for crops, no per-crop-type picker (it's free-text crop names,
not a fixed list). All reasonable fast-follows, left out to keep this
pass reviewable.

## Deploying

Same as before — front-end only:

```
git add app.js index.html styles.css sw.js HOW-TO-ADD-OTHER-LIVESTOCK.md HOW-TO-FARM-SETUP-AND-CROPS.md
git commit -m "Add Farm Setup picker (Livestock/Crops + species gating), Crops, and Horses"
git push
firebase deploy --only hosting
```

Service worker cache bumped again (`kenokip-farm-v60` → `kenokip-farm-v61`).
