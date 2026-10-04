// ---------------------------------------------------------------------------
// ONE place to edit for a new farm running this app as its own deployment.
// Nothing else in app.js needs to change — every Firestore read/write in the
// app reaches your farm's data through FARM_CONFIG.id below.
//
// This does NOT make the app multi-tenant (several farms sharing one
// deployment) — each farm still runs its own copy, in its own Firebase
// project, with its own M-Pesa credentials (see SETUP-MPESA.md / SETUP-B2C.md)
// and its own value here. That's the "template" model: see
// HOW-TO-DEPLOY-FOR-A-NEW-FARM.md for the full checklist.
// ---------------------------------------------------------------------------
window.FARM_CONFIG = {
  // Firestore document id for this farm's data, under the "farms" and
  // "finance" collections (farms/<id>, finance/<id>). Any short, lowercase,
  // no-spaces slug works — it's never shown to anyone, just used as a
  // database key. Changing this on an EXISTING deployment points the app at
  // a different (likely empty) document, so only change it before first
  // use, or if you deliberately mean to start fresh.
  id: 'kenokip',

  // Shown in the browser tab title and the app's "brand" header. The About
  // page's story, mission, and vision are separate — edit those from
  // Settings → About inside the app itself once signed in as the
  // administrator, not here.
  name: 'Kenokip Farm'
};
