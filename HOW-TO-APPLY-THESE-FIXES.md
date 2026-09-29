# How to apply these fixes to your GitHub repo

Everything in this folder is your existing project with the fixes already made. Upload it the same way you originally set the site up (per your own README): go to your repo on github.com → **Add file → Upload files** → drag these in → **Commit changes**. Netlify will redeploy automatically within a minute or two.

## What changed

**New files** (upload these — they didn't exist before):
- `LICENSE` — an all-rights-reserved copyright notice for Kenokip Farm.
- `styles.css` — all your CSS, pulled out of `index.html`.
- `app.js` — all your app logic, pulled out of `index.html`.
- `js/qrcode-lib.js` — the QR code library, pulled out of `index.html`.
- `images/` folder (42 files) — all the photos that used to be embedded as text inside `index.html`, now real image files.

**Modified files** (these overwrite the existing ones — GitHub's upload will ask to replace them, say yes):
- `index.html` — shrunk from 6.2MB to about 5KB. It now just links to `styles.css` and `app.js`/`images/` instead of containing everything inline, and the real flock/egg/expense/income data that was hardcoded in it has been replaced with clearly fake example data.
- `sw.js` — bumped the cache version (v58 → v59) and added the new `styles.css`/`app.js`/`js/qrcode-lib.js` files to the offline app-shell list, so installed/offline users actually get the update and those files still work offline. This step was easy to miss and would have broken the offline install if skipped.

**Nothing else was touched** — `functions/`, `firestore.rules`, `storage.rules`, `manifest.webmanifest`, `icons/`, and all your `SETUP-*.md` docs are exactly as they were.

## Two things I can't do for you from here

**1. Delete `functions/node_modules` from the live repo.** It's tracked in your repo even though `.gitignore` excludes it going forward (that only stops *new* commits from adding it back — it doesn't remove what's already there). On github.com, open the `functions/node_modules` folder, use the "..." menu on the folder to **Delete directory**, and commit. This alone will shrink your repo noticeably and isn't something I could do without repo write access.

**2. Fully scrub the real farm data from git history.** I removed it from the *current* version of `index.html`, which stops the live site from serving it to new visitors — that's the part that mattered most. But GitHub keeps every past commit, so the old real data (flock counts, expenses, income, buyer names) is still sitting in this repo's commit history and could be found by anyone who digs into it. For a repo this size, with your GitHub-web-only workflow, the simplest way to *fully* erase that history is to create a brand-new repository, upload only these current (already-sanitized) files into it, and then delete or make private the old one — same steps as in your own README, just once more into a fresh repo. The tradeoff: you'd need to point Netlify at the new repo (Site settings → Build & deploy → Link a different repository), since it's currently wired to the old one. If the old data isn't sensitive enough to be worth that extra step, leaving history as-is and just fixing the current version (already done) is a reasonable call too — that's your judgment to make, not mine.

## Not done yet (flagged, not fixed)

Automated tests around the M-Pesa payment and role-permission logic — this needs real engineering time to set up properly and carries its own risk if rushed, so it wasn't attempted in this pass. Worth a dedicated follow-up given real money moves through this app.

## After you upload

Do a hard refresh (or reinstall the app if you have it installed on a phone/desktop) so the new service worker takes over — the version bump in `sw.js` makes this automatic within a minute or two of opening the app, with a "new version available" prompt (that's the app's own existing behavior, unchanged).
