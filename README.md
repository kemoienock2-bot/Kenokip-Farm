# Kenokip Farm - Poultry Keeping — installable app package

This folder is your whole app: `index.html`, `manifest.webmanifest`, `sw.js`, and an `icons/` folder. Upload it as-is and it becomes a real, installable app in Chrome — no app store account, backend, or ongoing cost required.

## What you need to provide

Just a GitHub account — free. GitHub Pages hosts this for you at no cost, with HTTPS already handled. No Play Store account, no backend server, no database.

## Deploy with GitHub Pages (no git/command line needed)

1. Go to [github.com/new](https://github.com/new) and create a new repository. Any name works (e.g. `kenokip-farm`); it must be **Public** for free GitHub Pages. Don't add a README/license — leave it empty.
2. On the new repo's page, click **Add file → Upload files**.
3. From this folder, drag in `index.html`, `manifest.webmanifest`, `sw.js`, and the whole `icons` folder (drag the folder itself — GitHub preserves the folder structure). Wait for all uploads to finish, then click **Commit changes**.
4. Go to the repo's **Settings → Pages** (left sidebar, under "Code and automation").
5. Under **Build and deployment → Source**, choose **Deploy from a branch**. Under **Branch**, choose `main` and folder `/ (root)`, then **Save**.
6. GitHub shows a message "Your site is live at ..." after a minute or two (refresh the Pages settings page if it doesn't appear right away). The URL will look like:
   `https://<your-github-username>.github.io/<repo-name>/`
7. Open that URL in Chrome — the app loads from a sub-path, which it's built to handle correctly.

**Updating later:** to push a fix (like a new `index.html` after we make changes), go back to the repo, open the file, click the pencil (edit) icon, or use **Add file → Upload files** again to overwrite it — GitHub Pages redeploys automatically within a minute or two. If you update `index.html`, also bump the `CACHE_NAME` version string in `sw.js` (it's `kenokip-farm-v1` — change it to `v2`, etc.) so devices that already installed the app pick up the change instead of serving their offline copy.

## Alternative: your own domain/hosting

If you get hosting again later, the same files work with any static host — just make sure HTTPS is on and upload `index.html`, `manifest.webmanifest`, `sw.js`, and `icons/` (keeping the folder structure) into your site's web root, or a sub-folder if you want it at a sub-path.

## How you (and anyone else) install it

Once it's live at your URL over HTTPS:

**Android (Chrome):** Open the site → tap the **⋮** menu → **Add to Home screen** / **Install app**. It installs like a native app, gets its own icon, and opens full-screen without browser chrome.

**Desktop (Chrome or Edge):** Open the site → look for the **install icon** (a small monitor-with-arrow) at the right end of the address bar → click **Install**. It becomes a normal-looking app in your Start Menu/Applications folder / Dock.

**iPhone/iPad (Safari):** Open the site → tap the **Share** icon → **Add to Home Screen**. (iOS doesn't use Chrome's install prompt, but this produces the same result — a home-screen icon that opens full-screen.)

## About your data

This build stores everything **only in the browser it's used in**, via the browser's local storage — there is no server, sync, or account. That means:

- Data stays on the one device/browser where you enter it. Opening the same URL on a different phone or a different browser will start with an empty ledger.
- Clearing that browser's site data/cache for this app will erase your records, so **use the Backup button in Settings regularly** — it downloads a `.json` file you can keep safe and restore from later (via the same Settings screen, on any device).
- If down the line you want your data to follow you across devices automatically, that's a separate step (a small backend or sync service) — this package intentionally doesn't include one, since you asked to start with on-device storage only.

## Looking ahead: Google Play Store

You originally asked about the Play Store too. This Chrome-installable app is actually the right foundation for that: Google's **Trusted Web Activity (TWA)** tooling can wrap an installable web app like this one into a real Play Store listing with only a small amount of extra packaging work, once this version is live at a permanent HTTPS URL. Worth doing as a later step if you decide you want a Play Store presence — just say the word and we can pick that up from here.
