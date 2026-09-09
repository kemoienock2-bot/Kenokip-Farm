# Setting up logins, roles, and Finance approvals

> **Update (latest):** Feed, Health, Expense, and Income receipts now
> follow the same two-signature rule as Flock/Egg sales and Finance
> (see the update just below this one) — whoever logged the entry signs
> their own line, and your signature is still required to finish it. Before
> this, those four were always administrator-only, which is why a
> Supervisor who logged feed couldn't sign it even after co-signing shipped
> for sales and Finance. No front-end change needed beyond the file swap
> below — no new Cloud Function, no rules change.
>
> One thing worth knowing: this only applies to entries logged **from now
> on** — a Feed/Health/Expense/Income entry someone already recorded before
> this update doesn't retroactively know who logged it, so it stays
> administrator-only. Log a fresh one to see the new two-signature line.
>
> ```
> git add .
> git commit -m "Extend two-person receipt co-signing to Feed, Health, Expense, and Income"
> git push
> ```

> **Earlier update:** Receipt co-signing — when a team member signs a
> receipt that also needs your signature, it now waits for you instead of
> finishing right away.
>
> **How it works now:**
> - A receipt that names two signers (you, plus whoever recorded it — a
>   Supervisor, Farmhand, Vet, or Financial Staff) still has both signature
>   lines, but only YOUR line is compulsory. When a team member taps "Sign &
>   download" and draws their signature, it no longer finishes the
>   document on the spot — it sends their half to you and shows them
>   "Pending — sent to the administrator."
> - You see it under the new **Pending signatures** page (a badge on it
>   shows how many are waiting). Open one, review it, draw your own
>   signature, tap "Sign & approve" — that's the moment the document
>   actually becomes final and downloadable. The team member's screen
>   updates the instant you do this (no refresh needed), and they also get
>   a message telling them it's ready.
> - **"I'm away" toggle** (Settings → Your account): a simple switch you
>   control yourself. While it's on, a team member waiting on a
>   **non-withdrawal** document gets a "Skip and send anyway" button —
>   using it finishes the document with just their own signature, and you
>   get an urgent message immediately telling you it went out without your
>   approval. Flip the switch back off the moment you're available again.
> - **Withdrawals are the one exception, on purpose:** a Finance withdrawal
>   receipt never shows the Skip button, no matter what — it always waits
>   for your real signature. This is enforced on the server, not just
>   hidden in the app, so it can't be bypassed by a stale copy of the app
>   or a tampered request.
> - If you ever miss the notification, the message itself now has an
>   "Open document" button on it, so you (or the team member) can always
>   get back to a pending or finished document from Messages.
>
> **What this needed, technically (for your own understanding, not
> something you need to act on beyond deploying below):** a new Firestore
> collection, `pendingSignoffs`, holds each in-flight request. Unlike the
> job-restrictions rule from the update below this one, its Firestore rule
> is deliberately simple — nobody but the three new Cloud Functions
> (`requestReceiptSignoff`, `approveReceiptSignoff`, `skipReceiptSignoff`
> in `functions/roles.js`) may ever write to it, so "only the administrator
> can approve" and "a withdrawal can never be skipped" are enforced as
> plain, ordinary server-side code rather than a Firestore rule expression
> — which also means, unlike that job-restrictions change, I could test
> this one properly: 23 scenarios (every function, every role, every
> allowed and blocked transition, including "mandatory can never be
> skipped even while you're marked away") pass against a full simulation of
> the real functions' logic. `signReceipt`/`verifyReceipt` themselves
> (the actual tamper-evident signing) are completely unchanged.
>
> **This needs a functions redeploy AND a Firestore rules redeploy** (new
> Cloud Functions, new collection), plus the usual front-end files:
> ```
> firebase deploy --only functions
> firebase deploy --only firestore:rules
> git add .
> git commit -m "Two-person receipt co-signing: team member signs, administrator approves, with a skip path for non-withdrawals when marked away"
> git push
> ```
> After deploying, please test all three paths at least once: (1) a
> Supervisor or Financial Staff member signs a two-signature receipt and
> you approve it from Pending signatures, (2) with "I'm away" switched on,
> the same person sees and successfully uses "Skip and send anyway" on a
> non-withdrawal receipt, and (3) confirm a withdrawal receipt never shows
> the Skip button even while you're marked away.

> **Earlier update:** Each team member now only sees and can change the
> pages that match their job title:
> - **Supervisor:** Flock, Eggs, Feed, Health, Customers, Overview (everyday
>   farm operations — not money).
> - **Vet / Doctor:** Health, Overview.
> - **Farmhand:** Flock, Eggs, Feed, Overview.
> - **Financial Staff:** unchanged — Finance, Income, Expenses, Reports,
>   Overview.
> - **Administrator (you):** everything, unchanged.
>
> This is enforced two ways: the app hides pages someone's role can't use
> (so it's not confusing — no dead-end buttons), **and** the Firestore
> database itself now refuses to save a change to a restricted area, even
> if it somehow came from outside the app. That second part is the real
> security boundary; the first is just so the app makes sense to use.
>
> ⚠️ **Important — this needs both a Firestore rules deploy AND is the
> most consequential change made to this app so far**, because the new
> database rule affects every single save the whole team makes (flock,
> eggs, feed, health, expenses, income, customers, settings) — not just
> receipts. I tested the underlying logic thoroughly against realistic
> before/after data for every role (each role's legitimate changes, and
> each role's blocked ones), but I could not run it against the actual
> Firestore engine before sending this — the sandbox this runs in couldn't
> reach the emulator download server. **Please verify it before trusting it
> completely:**
> 1. Deploy: `firebase deploy --only firestore:rules`
> 2. Right after deploying, sign in as **each** team member (or ask them
>    to) and have them do one normal, everyday thing on their own page —
>    log an egg, add a feed log, record health, add flock, whatever fits
>    their role — and confirm it shows "Saved" / "Synced across devices"
>    like always, not "saved on this device only" or an error.
> 3. If anything that should work suddenly doesn't, tell me immediately —
>    don't wait — and in the meantime you can instantly undo this specific
>    change by deploying the previous rule:
>    `allow write: if request.auth != null;` in place of the new
>    `allow write: if request.auth != null && farmWriteAllowed();` line for
>    `match /farms/kenokip` in firestore.rules, then
>    `firebase deploy --only firestore:rules` again.
> 4. Optional extra safety net **before** deploying at all: paste
>    firestore.rules into Firebase Console → Firestore Database → Rules →
>    the editor there flags any syntax problem immediately, and its
>    "Rules Playground" simulator lets you test a specific write (pick a
>    fake auth token, add `role`/`jobTitle` claims, pick `farms/kenokip`)
>    without deploying anything or touching real data.
>
> ```
> firebase deploy --only firestore:rules
> git add .
> git commit -m "Restrict each employee to the pages their job needs, enforced in the app and in Firestore rules"
> git push
> ```

> **Earlier update:** Three receipt-signing improvements:
> 1. **Fixed a real gap: signing no longer falls back to "Administrator."**
>    Every receipt names exactly who's expected to sign it (e.g. you, or
>    you + Financial Staff for money receipts). Before, if whoever was
>    signed in didn't match any expected signer, their signature silently
>    landed in the first line anyway — usually "Administrator." Now, only
>    someone whose real role matches a line on that specific receipt can
>    sign it at all; anyone else gets a clear message saying who's allowed
>    to sign it instead.
> 2. **Receipts print at an actual receipt size now**, not a full page —
>    narrow, like a real till receipt. The Activity Statement (the
>    multi-section report) is unaffected and still prints as a full
>    document, since it genuinely has that much content.
> 3. **Signing a receipt now has "Undo last"**, separate from "Clear all"
>    — a mis-drawn stroke can be removed on its own without losing the rest
>    of the signature.
>
> Front-end only:
> ```
> git add .
> git commit -m "Restrict who can sign a receipt to their own named line; compact receipt size; undo-last-stroke on the signature pad"
> git push
> ```

> **Earlier update:** Added a "Copy verify link" button to a signed
> receipt — checking it from a different device (e.g. you signed on your
> phone but want to verify on a laptop) no longer means scanning a QR code
> and retyping what it says. Copy the link (WhatsApp, email, notes — however
> you like to move it between your own devices), then paste it straight into
> "Verify a receipt" anywhere; pasting the raw QR text still works too, same
> as before. Front-end only:
> ```
> git add .
> git commit -m "Add Copy verify link for checking a receipt from a different device"
> git push
> ```
>
> **If your phone specifically keeps showing an old error that your laptop
> doesn't** (like the earlier "(internal)" note, even after this update):
> that almost certainly means the phone is still running an old, cached
> copy of the app from before today's fixes — a normal refresh doesn't
> always force that update. To fix it for good: if the app is installed on
> your home screen, long-press its icon → App info → Storage & cache →
> Clear storage, then reopen it and sign in again. If you're using it in
> the Chrome app instead, open Chrome → ⋮ menu → History → Clear browsing
> data → tick "Cached images and files" → Clear, then reopen the site. This
> forces your phone to fetch everything fresh instead of the stale copy.

> **Earlier update:** Receipts confirmed working — signing now gets a real
> verification code and QR. This update just makes signing and "Verify a
> receipt" a bit more patient with a weak or spotty mobile signal (normal
> out on a farm): instead of giving up after one retry, it now tries up to
> three times total, a short pause between each, before showing an error.
> A genuine problem (like signing not being set up) still shows immediately
> — this only adds patience for dropped-connection type hiccups. Front-end
> only:
> ```
> git add .
> git commit -m "More patient retries for signReceipt/verifyReceipt on a weak connection"
> git push
> ```

> **Earlier update:** Fixed a second, unrelated cause of the "(internal)"
> note — this time it was showing text about a "Messaging" service worker
> ("...unable to register the default service worker... 404...
> messaging/failed-service-worker-registration"). That text has nothing to
> do with receipts at all — it's from the app's (currently unused,
> not-yet-configured) push-notification setup, and on some phones a
> leftover/stale background check for it was misfiring at exactly the wrong
> moment and getting mistaken for the receipt-signing answer. Fixed by
> having the app double-check that any error it shows for a receipt
> genuinely came from the receipt-signing server (not some unrelated
> background hiccup) — if it didn't, the app now quietly tries again once
> automatically before giving up, and if it's still not a real answer, it
> shows one plain, honest message instead of confusing unrelated text.
> Front-end only:
> ```
> git add .
> git commit -m "Don't let unrelated background errors show up as the reason a receipt is unsigned"
> git push
> ```
> If receipts still come out unsigned after this, try fully closing and
> reopening the app once first (this clears out any leftover background
> state from before) — then check the note on the receipt again; it should
> now say the real reason if one still exists.

> **Earlier update:** Fixed the "(internal)" error that showed up on the
> receipt's unsigned note ("This copy has no verification code (internal)").
> Root cause: signing itself was actually working fine — the code that
> failed was a secondary step right after, which logs every signed receipt
> to a private admin-only record for accountability. That record was being
> handed the receipt's numbers in a shape Firestore doesn't allow (a list of
> pairs nested directly inside another list), so the write crashed, and
> because it crashed instead of failing gracefully, the whole request came
> back as a generic "(internal)" error instead of the receipt you'd already
> earned. Fixed by reshaping just that log entry, and by making sure that
> even if this accountability log ever fails again for some other reason,
> it can never again block you from getting your signed receipt. **This one
> needs a Cloud Functions redeploy — no new secret, no Firestore rules
> change:**
> ```
> cd functions
> npm install
> cd ..
> firebase deploy --only functions
> git add .
> git commit -m "Fix (internal) error signing receipts — Firestore rejected nested-array audit log entry"
> git push
> ```
> After deploying, try signing a receipt again — it should now get a real
> verification code and QR code instead of the unsigned note. If it still
> comes out unsigned, the note will say the new real reason (thanks to the
> earlier update below) — that's the next thing to check.

> **Earlier update:** Fixed "Print / Save as PDF" producing a blank page
> for receipts and the Activity Statement. Root cause: a CSS rule that
> positions the hidden print copy off-screen (so it doesn't show up in the
> app itself) was accidentally still winning at print time too, due to
> how specific it was — so the printed page was correctly "there", just
> parked 99999 pixels off the left edge of the paper. Front-end only:
> ```
> git add .
> git commit -m "Fix blank page when printing/saving a receipt or Activity Statement as PDF"
> git push
> ```

> **Earlier update:** Two small fixes to signed receipts, both front-end
> only:
> 1. **The signature was too faint and small when printed.** The drawn
>    line is now bolder and solid black, and it's printed noticeably
>    bigger on the receipt.
> 2. **"No verification code" now says exactly why**, instead of always
>    showing the same generic "signing isn't set up yet" message even
>    when the real reason was something else (e.g. offline, or a
>    different server error). If a receipt still comes out unsigned after
>    this update, the note on the receipt itself will now say the real
>    reason — that's the thing to go check next.
> ```
> git add .
> git commit -m "Bolder/bigger signature on receipts; show the real reason when unsigned"
> git push
> ```

> **Earlier update:** Every recorded flock loss/sale now shows up directly
> on the Flock page itself, in a new "Losses & sales" card right below the
> Batches table — date, batch, reason, count, buyer, amount, and note, with
> Edit and (for a sale) receipt buttons right there. No backend changes —
> front-end only:
> ```
> git add .
> git commit -m "Show flock losses/sales directly on the Flock page"
> git push
> ```
> "History" (per batch) still exists too, for undoing a re-sexing split or
> a quick per-batch view — this new card is the faster way to get to
> edit/receipt for any loss or sale without opening it first.

> **Earlier update:** "Record loss or sale" can now be edited, and receipts
> got a real accountability upgrade — an electronic signature you draw in
> the app, a verification code, and a QR code that together make it much
> harder to quietly edit a receipt and pass it off as genuine. There's also
> a new "Activity Statement" that covers everything on the farm for any
> date range you pick, and a "Verify a receipt" checker anyone can use to
> confirm a receipt hasn't been tampered with. **This one needs a Cloud
> Functions deploy, a Firestore rules deploy, and a one-time secret setup —
> see [SETUP-RECEIPTS.md](SETUP-RECEIPTS.md) for the exact steps.**
> 1. **Flock → History → the pencil icon** next to any removal/sale entry
>    (other than a re-sexing split) now opens it prefilled and lets you fix
>    a mistake — count, date, buyer, amount, reason, note — the same way
>    egg-loss entries already worked. It relinks or removes the matching
>    Income entry automatically if the sale amount or "sold" status
>    changes.
> 2. **Every receipt is now signed electronically before it downloads.**
>    Clicking the receipt icon opens a preview first, then "Sign &
>    download" asks you to draw your signature on a small pad (mouse or
>    finger) — that drawing is embedded in the receipt and locked into its
>    verification code, so a receipt can no longer be re-printed from a
>    blank pen line.
> 3. **A verification code and QR code make forgery much harder.** Signing
>    asks the server (which holds a private key that never leaves it, never
>    ships in the app, and never touches GitHub) to compute a short code
>    from the receipt's exact numbers. That code — and a QR code encoding
>    the same thing — get printed on the receipt. Anyone can later open
>    "Verify a receipt", enter (or scan) it, and see immediately whether
>    even one digit was changed since it was generated. This doesn't stop
>    someone from editing the printed paper — it stops an edited paper from
>    checking out as genuine.
> 4. **Receipts now cover Expenses, Feed, and Health records too** — not
>    just flock/egg sales and Finance deposits. Look for the receipt icon
>    next to any row on those pages.
> 5. **A new "Activity Statement"** on the Reports page bundles Flock, Eggs,
>    Feed, Health, Expenses, Income, and Finance (if you can see it) into
>    one signed, itemized document for a date range you choose — with the
>    same signature/code/QR treatment as a single receipt.
> 6. **A new "Verify a receipt" checker**, also on Reports, lets anyone
>    paste (or scan) a receipt's printed verification details and see a
>    clear ✓ genuine / ✗ doesn't match result.
>
> To deploy (front-end, functions, AND rules this time):
> ```
> cd functions
> npm install
> cd ..
> firebase deploy --only functions
> firebase deploy --only firestore:rules
> git add .
> git commit -m "Editable record loss; signed receipts with verification code, QR, and Activity Statement"
> git push
> ```
> Then do the one-time `RECEIPT_SIGNING_SECRET` setup described in
> [SETUP-RECEIPTS.md](SETUP-RECEIPTS.md) — receipts still work without it,
> just without a verification code until it's set.

> **Earlier update:** Two Kem AI Assistant bug fixes, both from real
> feedback after trying it out. Front-end only — no functions or Firestore
> redeploy needed, just `git add` / `git commit` / `git push`.
> 1. **The close (×) button didn't actually close the chat panel** — a CSS
>    rule was fighting with itself, so the panel stayed visually open even
>    after being told to hide. Fixed.
> 2. **"How do I add/log eggs" (and feed, customers, health records,
>    expenses, income) answered with today's number instead of explaining
>    how** — those questions matched the live-number check first, which
>    always wins once it sees a topic word like "eggs" at all. How-to
>    questions are now checked first, so "how do I log eggs" explains how,
>    and a plain "how many eggs today" still gives you the number.
>
> Nothing to deploy on the Firebase side:
> ```
> git add .
> git commit -m "Fix Kem AI close button and how-to answers"
> git push
> ```

> **Earlier update:** Kem AI Assistant — a free, built-in helper, available
> to every signed-in team member from a chat bubble in the bottom-right
> corner of every page. Front-end only — no functions or Firestore redeploy
> needed, just the usual `git add` / `git commit` / `git push`.
> 1. **It's scripted, not a connection to an outside AI service.** It
>    matches your question against things it knows how to answer — nothing
>    you type is sent anywhere. It can't hold a free-flowing conversation
>    about anything else, but it also can't be tricked into leaking
>    something it shouldn't, or cost anything to run.
> 2. **Live numbers, worked out from what's already in the app** — "how
>    many eggs today", "what's my flock total", "how much feed this month",
>    "who's my top customer", and more. Finance figures ("what's my Finance
>    balance", "what's my profit") only answer for accounts that can see
>    Finance, respecting the same reveal/mask toggle as the Finance page
>    itself; Team questions ("how many team members") only answer for
>    administrators. Anyone else asking gets a polite "that's not available
>    on your account" instead of the real number.
> 3. **How-to answers** for the app's own features — adding birds, logging
>    eggs/feed/health, adding a customer, M-Pesa deposits/payouts, setting
>    up fingerprint unlock, using the search box or voice control, adding a
>    team member, and more.
> 4. **Nothing is saved.** The conversation lives only in that browser tab
>    for that visit — reload the page, or sign out, and it's gone. Signing
>    out also hides the assistant entirely until the next sign-in, so a
>    shared farm computer never shows one person's chat to the next.
>
> Nothing to deploy on the Firebase side this time:
> ```
> git add .
> git commit -m "Add Kem AI Assistant"
> git push
> ```

> **Earlier update:** A search box on every page, plus voice control.
> Front-end only — no functions or Firestore redeploy needed this time, just
> the usual `git add` / `git commit` / `git push` and Netlify does the rest.
> 1. **Search box at the top of every page** — searches flock, eggs, feed,
>    health records, expenses, income, and customers as you type, plus
>    Finance transactions (if you can see Finance) and Team (administrators
>    only). Tap a result to jump straight there. It lives above the page
>    content, not inside it, so it's always there no matter which page
>    you're on, and typing in it is never interrupted by the app refreshing
>    data in the background.
> 2. **Voice control** — tap the mic in the search box and say something
>    like "open eggs" or "go to finance" to jump to a page, or just say what
>    you're looking for (e.g. "find Kapchanga") and it searches for it. This
>    is a convenience layer only, built with your browser's own speech
>    recognition — needs Chrome, Edge, or Safari, and never unlocks or
>    approves anything on its own.
>
> Nothing to deploy on the Firebase side this time:
> ```
> git add .
> git commit -m "Add search box and voice control"
> git push
> ```

> **Earlier update:** Finance security — a second way in, a lockout, and a
> tightened M-Pesa webhook. See the new **SETUP-SECURITY.md** for the full
> picture (including an honest answer to "can someone hack this"); short
> version:
> 1. **Fingerprint / Face + your own PIN** to unlock the Finance portal —
>    an additional option alongside the password + authenticator-code
>    method, which still works exactly as before. Set both up from
>    Settings → Your account.
> 2. **3 wrong attempts, on either method, locks the whole Finance portal**
>    for everyone — even with correct details — until the administrator
>    clears it from Settings → Team → Finance security. Every attempt is
>    logged there with device, rough IP-based location, and an immediate
>    Urgent alert.
> 3. **M-Pesa webhook URLs can now require a shared key** so a stranger who
>    finds one can't feed it fake payment data — this needs one optional
>    manual step (generating and setting the key) covered in
>    SETUP-SECURITY.md; skip it for now if you're not ready, nothing
>    breaks either way.
>
> Needs a functions redeploy AND a Firestore rules deploy this time
> (the new Finance security log is its own collection):
> ```
> firebase deploy --only functions
> firebase deploy --only firestore:rules
> ```

> **Earlier update:** a Customers directory — built for you automatically.
> New "Customers" nav item (visible to everyone, like Flock and Eggs) listing
> everyone who's bought from the farm: name, phone, total spent, number of
> purchases, and their last purchase date — sorted by biggest spender first.
> You don't have to type anything for this to fill up: whenever you record a
> Flock sale or an Egg sale and type a buyer's name in "Sold to", that name
> is automatically matched to an existing customer (so "John Mwangi" and
> "john mwangi" become the same person, not two) or a new one is created
> quietly in the background — repeat buyers build up a real purchase history
> with zero extra work, and a one-off or local-market sale costs nothing
> extra either (just leave the name generic, like "Local market", or blank).
> Every past sale you've already recorded gets picked up into the directory
> automatically too, the next time the app loads — nothing from before this
> update is left out. Want to save a customer's phone number or a note ahead
> of their first sale? Use the new "Add customer" button on that page.
> Deleting a customer only removes their contact card — it never touches
> past sales, receipts, or income records. Total spent and purchase counts
> are always worked out fresh from the actual sales on record, so they can
> never drift out of sync or go stale.
>
> Front-end only this time — `index.html` and `sw.js`. **No functions
> redeploy needed** (`firebase deploy --only functions` can be skipped for
> this one), and no new Firestore rules.

> **Earlier update:** downloadable receipts, and Finance/Income now stay in
> sync automatically. Three things in this one:
> 1. **Receipts** — a printable receipt (with your logo, a receipt number,
>    signature lines, and a stamp box) for anything the farm is paid for:
>    a Finance deposit, a flock sale, or an egg sale. Recording a "Sold"
>    entry in Flock or Eggs now opens the receipt right away so you can
>    print it or save it as a PDF (your browser's own Print dialog — no new
>    app needed); every past sale keeps its receipt too — reopen it anytime
>    from the small receipt icon on that row (Flock → a batch's History; the
>    Eggs page's sales/losses table; Finance's transaction list, once
>    amounts are revealed). A Finance receipt is signed **Administrator +
>    Financial Staff**; a Flock or Egg sale receipt is signed
>    **Administrator** plus whoever actually recorded the sale, by their
>    role — so it only shows two different names when two different people
>    were actually involved. **Eggs can now be marked "Sold"** the same way
>    birds already could — with who bought them and for how much — which
>    is what a receipt needs to exist for an egg sale at all.
>    Logo note: I built the receipt logo from the "Kenokip Tech" artwork you
>    shared — cropped to just the mark itself (dropped the "Tech" wordmark
>    and tagline, since this is the farm, not the robotics venture) with a
>    softened edge so it sits cleanly on a printed page. The original image
>    is also saved as `icons/kenokip-emblem.png` if you want it elsewhere.
>    Tell me if you'd rather it look different — a farm-specific mark, a
>    different crop, colors — and I'll redo it.
> 2. **A sale — Flock or Eggs — records itself as Income automatically.**
>    This already happened for Flock; it's now true for Eggs too, the
>    moment you mark a sale, no separate step in the Income tab.
> 3. **Finance and Income now stay in sync on their own.** Whenever the
>    farm's Finance account actually receives money — money you record by
>    hand as a deposit, an "Add via M-Pesa" you complete, or (once your
>    Till is live) someone paying it directly — that amount is now mirrored
>    into Income automatically, under "M-Pesa / Bank", so the two never
>    drift apart and nothing needs entering twice. Editing or deleting that
>    Finance entry keeps the mirrored Income entry in step or removes it —
>    you'll never see a stale one left behind. This only runs in one
>    direction, on purpose: sending money out (a withdrawal) is not mirrored
>    into Expenses — only the "money received" side was asked for.
>
> Needs both a front-end update (`index.html`, `sw.js`) and a functions
> redeploy this time (`firebase deploy --only functions`), since the
> Finance→Income sync lives partly in `functions/roles.js` and
> `functions/index.js`. No new Firestore rules needed.

> **Earlier update:** fixed the 10-minute sign-out for you and Financial
> Staff — it was a flat 10-minute clock from sign-in regardless of whether
> you were actively using the app, which is why you were getting signed out
> mid-use. It's now a proper **10 minutes of inactivity** timer instead:
> using the app (typing, clicking, scrolling, tapping) keeps resetting the
> clock, and it only signs you out once there's genuinely been no activity
> for 10 minutes — including while the app sits in the background. The
> separate **Finance portal** 2-minute inactivity lock is unchanged. Front-end
> only — just replace `index.html` and `sw.js`, no functions redeploy or
> rules change needed.

> **Earlier update:** a new **About** section (nav bar, visible to
> everyone including guests) with three parts — a bio/story, a mission
> statement, and a vision statement. I wrote a first draft using only what
> I've actually picked up from our conversations so far (that you're Enock
> Kemoi, known as Kenokip; that the farm grew from a personal
> record-keeping effort into a real team operation; the mission/vision are
> my best read on what this project is clearly aiming at). I did **not**
> invent personal details I don't actually know — where the farm is, how
> and when you started, anything about your background — those are left as
> a bracketed placeholder in the bio for you to fill in. Only you
> (Administrator) see an **Edit** button, top right of that page, to rewrite
> any of the three whenever you like — nobody else can edit it, though
> everyone including guests can read it. Front-end only — just replace
> `index.html` and `sw.js`, no functions redeploy or rules change needed.

> **Earlier update:** two changes —
> 1. **A "Record loss" button on the Flock page** (top right, next to "Add
>    birds") — this was already possible per-batch (the small icon on each
>    row in the Batches table), but there was no obvious way in without
>    already knowing which batch to click into first. This new button opens
>    the same form with a "Which batch" dropdown added, so you can start
>    from "I lost some birds" rather than having to find the batch first.
> 2. **Overview now opens with a greeting** that reads the time on your own
>    device — "Good morning" / afternoon / evening / (late) night — by name
>    if you've set one, plus today's date and a short line that changes with
>    the time of day. I took "be creative" as license to give it a bit of
>    personality (references to checking the flock, collecting eggs, that
>    kind of thing) rather than a plain clock — happy to tone it down or
>    change the wording if it's not to your taste. It updates on its own
>    once a minute, so it won't say "morning" anymore if the app is just
>    left open into the afternoon.
>
> Front-end only — just replace `index.html` and `sw.js`, no functions
> redeploy or rules change needed.

> **Earlier update:** a new **Brooding** section on the Flock page. When a
> hen starts sitting on eggs, log how many she's given from there — those
> eggs come off your egg count right away (same as the "Given for brooding"
> option that already existed), and the app works out the expected hatch
> date on its own, using the standard 21-day incubation period for chicken
> eggs. Once it's due, come back to that same entry and tap **Record hatch**
> — enter how many eggs *didn't* hatch, and the rest are added to the flock
> automatically as a new batch of unsexed chicks (no need to add them by
> hand). Deleting a brooding record also removes the chicks batch it added,
> if any, so nothing is left dangling. Front-end only — just replace
> `index.html` and `sw.js`, no functions redeploy or rules change needed.

> **Earlier update:** reworked sign-in timeouts, plus a brand-new Finance
> portal lock. Here's exactly what changed and the assumptions I made where
> your instructions left room for interpretation — flag anything you'd
> rather have differently:
>
> 1. **Reloading the page no longer signs anyone out.** The "sign in every
>    single time" behavior from a couple of updates ago is gone. Everyone
>    now stays signed in on their device the normal way (closing the app and
>    reopening it later goes straight back in), **except** you and Financial
>    Staff.
> 2. **You and Financial Staff are automatically signed out 10 minutes after
>    signing in.** This is a flat 10-minute clock from the moment of
>    sign-in — it does **not** reset while you're actively using the app,
>    and it keeps counting even if the app is in the background or the page
>    gets reloaded partway through, so it can't be dodged either way. I read
>    "timeout after 10 minutes" as a fixed session length rather than the
>    old activity-based 5-minute idle timer — tell me if you'd actually
>    prefer it to reset every time you're active instead (i.e. only sign
>    out after 10 minutes of doing nothing).
> 3. **Supervisors, Vets, and Farmhands have no timeout at all** — they stay
>    signed in for as long as they're online, foreground or background,
>    exactly as you asked.
> 4. **New: the Finance portal itself is now locked behind its own gate**,
>    separate from just being able to see the Finance tab. Opening Finance
>    now asks for two things: a **Finance portal password** (set by you
>    only — new "Finance portal password" box on the Team page — and shared
>    only with whoever you want to have Finance access) and a **Finance
>    portal authenticator code** — a second, completely separate
>    authenticator-app entry from the one used to reveal amounts / send
>    M-Pesa (set up from Settings → Your account, it shows up as its own
>    "Kenokip Farm Finance Portal" entry in Google Authenticator/Authy so
>    the two codes can't be mixed up).
> 5. **Inside the Finance portal, 2 minutes of inactivity locks it again**
>    (back to asking for the password + code) — this one *is* a normal
>    activity-based idle timer, separate from the 10-minute clock in #2. I
>    made this re-lock just the Finance portal, not sign out of the whole
>    app — say the word if you actually want the whole account signed out
>    instead.
>
> **Needs both steps**: redeploy functions (`firebase deploy --only
> functions`) — all of the Finance portal password/code logic lives there —
> and replace `index.html` and `sw.js` as usual. No Firestore rules change
> this time (the new Finance portal password piggybacks on the same locked
> `security` collection already in the rules).

> **Earlier update:** two small fixes to the Finance/authenticator update —
> 1. **Fixed the eye icon rendering huge, covering the whole screen.** It
>    had no size limit in one spot where it was dropped inline into a
>    sentence of text (every other icon in the app is inside a button,
>    which already sized it correctly). It's a small icon now, as it should
>    have been.
> 2. **Setting up the authenticator app now shows a scannable QR code**, not
>    just the manual entry key — scan it with Google Authenticator, Authy,
>    etc. and it's set up in one step. It loads from a small library
>    fetched only at that moment (never during normal app use), and if that
>    fails for any reason (no signal, etc.) the manual key entry underneath
>    still works exactly as before — nothing about setup breaks either way.
>
> Front-end only — just replace `index.html` and `sw.js`, no functions
> redeploy or rules change needed this time.

> **Earlier update:** three changes, all in Finance —
> 1. **Balances and transaction notes are now masked by default** for
>    everyone who can see Finance (you and Financial Staff) — e.g. an
>    amount shows as `KSh 1xx,xx0` instead of the real figure. Tapping the
>    eye icon next to the balance reveals everything, but only after
>    entering a current code from an authenticator app (Google
>    Authenticator, Authy, etc.).
> 2. **A new "Send via M-Pesa" button** (administrator only) actually pushes
>    real money out to someone's phone via Safaricom's B2C API — always
>    gated by the same authenticator code. **This needs Safaricom to have
>    approved B2C for your shortcode first**, plus new credentials — see the
>    new **SETUP-B2C.md** for the full walkthrough; until that's done, the
>    button gives a clear error rather than silently failing.
> 3. Everyone who can see Finance sets up their authenticator app once,
>    from **Settings → Your account**.
>
> Needs a full functions redeploy (`firebase deploy --only functions`) and
> republishing `firestore.rules` (a new `security` collection was added,
> fully locked down — see the rules file's comments). No new npm packages
> to install — the authenticator-code checking is built entirely from
> Node's built-in tools, deliberately, to avoid yet another thing that can
> fail to install on a flaky connection.

> **Earlier update:** sign-ins are no longer remembered on a device.
> Before, once someone signed in successfully, Firebase kept them signed in
> indefinitely on that browser/device — closing the app and reopening it
> later would skip straight past the sign-in form. Every sign-in (yours
> included) now requires filling in the form and pressing **Sign in** every
> single time the app is opened or reloaded, with no exceptions. The first
> time each device loads this update, it also automatically signs out
> whichever account was remembered there from before — so don't be
> surprised if the very next time you or your team opens the app, it shows
> the welcome screen instead of going straight in like it used to; that's
> expected, one-time cleanup. Front-end only — just replace `index.html`
> and `sw.js`, no functions redeploy or rules change needed.

> **Earlier update:** the Overview page's **all-time deficit/profit** card
> and the **Profit** stat tile are now visible only to you (Administrator)
> and Financial Staff — the same tier as the Finance tab itself. Supervisors,
> Vets, and Farmhands still see everything else on Overview (eggs, flock,
> spending by category, recent activity), and can still add and view
> individual Expenses and Income entries exactly as before — they just no
> longer see the combined profit/deficit bottom line. This is entirely a
> front-end change — just replace `index.html` and `sw.js`, no functions
> redeploy or rules change needed.

> **Earlier update:** three changes —
> 1. **Messages now have a Reply button.** Tapping it opens a new message
>    already addressed back to whoever sent the original, with a quote of
>    what they said shown above the reply so the thread stays clear (even
>    though it's technically a new message each time, not a live chat
>    thread).
> 2. **Urgent messages can now pop up even when a team member isn't
>    actively looking at the app** — as a real notification from the
>    browser/phone itself, with sound, as long as the app or its browser
>    tab is still running somewhere in the background (another tab,
>    minimized, or a phone with the screen off but the app not fully
>    closed). Each person turns this on once per device, from **Settings →
>    Your account → "Enable background urgent alerts"** (their browser will
>    ask them to allow it). **Important limit:** this can't reach someone
>    whose browser or app has been fully closed/force-quit — nothing is
>    running to receive it in that case. Making it work even then needs a
>    much bigger "push notification" system (a server permanently reaching
>    out to Apple/Google's own notification services) — tell me if you
>    want that built next; it's a separate, larger job.
> 3. **You can now name team members who were added before names existed**
>    — go to **Team**, and there's an "Edit name" button next to each of
>    their rows.
>
> **This one needs both steps**: redeploy functions (`firebase deploy --only
> functions`) — the reply feature and the name-editing both live there —
> *and* replace `index.html` and `sw.js` as usual. No Firestore rules change
> this time.

> **Earlier update:** four changes —
> 1. **Access log is now paginated**, 10 sign-ins per page with Prev/Next.
> 2. **Financial Staff can now receive money without your approval** —
>    deposits (money in, including "Add via M-Pesa", now available to them
>    too) are added immediately. Only withdrawals (money out) still wait for
>    you to approve. You (Administrator) are unaffected — everything you add
>    is still immediate either way.
> 3. **In-app messaging** — a new Messages tab (bell icon, with an unread
>    badge) for the whole team. You can message everyone at once or one
>    person; everyone else can message any individual team member (including
>    you) but not the whole team. Messages are written with an urgency level
>    (Normal / Important / Urgent) and grouped that way in the inbox. Every
>    message shows who it's from as "Role(Name)" — e.g. "Supervisor(John)" —
>    so team members now set their own display name once, from Settings →
>    Your account (you can set yours there too, and it's also asked for when
>    you add a new team member from now on).
> 4. **Urgent messages pop up immediately** with a warning banner and a
>    short alert sound, for whoever they're addressed to (or everyone, for a
>    broadcast) — impossible to miss even if Messages isn't open.
>
> **This one needs both steps**: redeploy functions (`firebase deploy --only
> functions`) *and* republish the Firestore rules in `firestore.rules` (two
> rules changed: the team roster is now readable by any signed-in account,
> not just you, since everyone needs it to pick who to message; and a new
> `messages` collection was added, oversight-visible to you and otherwise
> restricted to sender/recipient/broadcast). Then replace `index.html` and
> `sw.js` as usual.

> **Earlier update:** the access log (Team tab, administrator-only) now turns a
> sign-in's coordinates into an actual place name — e.g. "Kondele, Kisumu,
> Kenya" — using a free map lookup, and also shows which device/browser was
> used. If it still shows "Location denied" for someone, that means their
> browser's location permission was declined, or (on iPhone/Android)
> Location Services is off for that browser at the device level — not a bug
> in the app. To pick this up: redeploy functions (`firebase deploy --only
> functions`) and replace `index.html` and `sw.js` — no rules change needed
> for this part.

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
