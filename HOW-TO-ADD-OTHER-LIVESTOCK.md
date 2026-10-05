# Other Livestock: Dairy Cattle, Goats & Sheep, Pigs, Rabbits, Horses

> **Update:** Horses was added as a fifth species after this was first
> written — it works exactly like the other four (herd + sales & losses,
> no milk-style journal). Whether this whole section even shows up in the
> sidebar now depends on the **Farm Setup** picker — see
> `HOW-TO-FARM-SETUP-AND-CROPS.md` for that part.

## What this adds

A new section, **Other Livestock**, next to Flock in the sidebar (under
"Farm Records") — shown only if Farm Setup has at least one non-poultry
species turned on. It covers five species — Dairy Cattle, Goats & Sheep,
Pigs, Rabbits, Horses. Each one gets:

- **Herd** — add a batch (how many, when, optional label/source/cost),
  see the running count, edit or delete a batch.
- **Sold, died & culled** — record a sale (with buyer, amount — this
  files into Income automatically, the same way an egg or bird sale
  does) or a loss (died/culled/other), per batch.
- **Milk log** — Dairy Cattle only, for now (see "Extending" below). A
  simple date + litres + note log, with a monthly total shown on the
  Overview tile.

Access follows the same rule as Flock/Eggs/Feed: Supervisor and
Farmhand roles can open it; it's gated by `sectionAllowed()` exactly
the way those are.

None of this touches your existing poultry data (`state.flock`,
`state.eggs`, etc.) — it's new, separate arrays under
`state.livestock.{cattle,goatsheep,pigs,rabbits}`.

## Why one generic module instead of four bespoke sections

Flock + Eggs + Feed + Health together are several thousand lines of
hand-written, poultry-specific code. Writing that same depth of code
four more times — once per new species — would be a very large,
very slow, very easy-to-get-subtly-wrong change to make blind, in one
pass, on an 8,000-line file I can't run or test myself.

Instead, all four species share one generic set of functions, driven
by a small config array:

```js
var LIVESTOCK_SPECIES = [
  { key:'cattle',    label:'Dairy Cattle', hasJournal:true,  ... },
  { key:'goatsheep', label:'Goats & Sheep', hasJournal:false, ... },
  { key:'pigs',       label:'Pigs',          hasJournal:false, ... },
  { key:'rabbits',    label:'Rabbits',        hasJournal:false, ... },
  { key:'horses',     label:'Horses',         hasJournal:false, ... }
];
```

This is a fraction of the code, and — importantly — it's the same
code path for all four, so testing one species well mostly tests all
of them.

## What's deliberately NOT included yet

Cut from this first pass on purpose, to keep it reviewable:

- **Receipts.** Egg/Flock/Finance sales open a printable/shareable
  receipt automatically. Livestock sales don't yet — they just save
  and toast "Recorded." Adding receipts means understanding and
  extending `viewReceipt()`/the `*ReceiptOpts()` functions, which is
  its own focused piece of work.
- **Trash recovery.** Deleting a herd batch, a sale/loss entry, or a
  journal entry is permanent (after the confirm prompt) — it doesn't
  go through the 30-day Trash that Egg/Flock deletes use.
- **Global search.** Livestock records don't show up in the search
  bar yet (Flock/Eggs do).
- **Health integration.** Health records (vaccinations, treatments)
  are still poultry-only; there's no species tag on them yet linking a
  health record to, say, a specific cow.

None of these are hard to add — they're left out so this first pass is
small enough to actually review, rather than one enormous diff.

## How to test before relying on it

This was written and syntax-checked (`node --check app.js`), but never
run in an actual browser against your real Firestore data — I have no
way to do that from here. Before trusting it with real records:

1. Deploy to a **test copy** if you can (a second Firebase project, or
   just test during a quiet moment on the real one with entries you're
   happy to delete afterward).
2. For each species: add a herd batch, check the count shows up on the
   Overview tile and the Herd page. Record a sale with an amount —
   check it appears in **Income** under the right category (e.g. "Milk
   Sales"). Record a death/cull — check it does *not* create an income
   entry. Delete a batch that has a sale on it — check the linked
   income entry disappears too.
3. For Dairy Cattle only: log milk, check it appears in the Milk log
   and the monthly total on the Overview tile.
4. Check a Farmhand-role account can see and use the section the same
   way it can use Flock/Eggs.

## Extending to a fifth species (e.g. bees, ducks)

Add one entry to `LIVESTOCK_SPECIES` near the top of the "OTHER
LIVESTOCK" section in `app.js`:

```js
{ key:'bees', label:'Bees', singular:'hive', plural:'hives', icon:PICS.bees,
  hasJournal:true, journalLabel:'Honey', journalUnit:'Kg',
  incomeCategory:'Honey Sales', expenseCategory:'Livestock Purchase' }
```

You'll also need a `PICS.bees` icon (copy the pattern of the other
inline SVGs near the top of `app.js`), and to add the new income
category to `defaultState()` and the migration backfill list in
`migrateState()` the same way `'Milk Sales'` etc. were added. Nothing
else needs to change — the Herd/Sales/Journal pages, forms, and
Finance linkage are all generic.

## Deploying

```
git add app.js
git commit -m "Add Other Livestock: Dairy Cattle, Goats & Sheep, Pigs, Rabbits"
git push
firebase deploy --only hosting
```

(This is a front-end-only change — no Cloud Functions touched, so
there's nothing to deploy with `firebase deploy --only functions` this
time.)

The service worker cache was bumped (`kenokip-farm-v59` →
`kenokip-farm-v60`) so returning visitors pick up the change instead of
a stale cached copy.
