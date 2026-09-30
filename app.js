(function(){
  'use strict';

  // Bump this alongside sw.js's CACHE_NAME on every deploy — shown in
  // Settings → About this app, purely so a person (or you, debugging a
  // support message) can confirm which build is actually running.
  var APP_VERSION = 'v56';

  /* ============================= ICONS ============================= */
  var ICONS = {
    overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="3" width="4" height="17"/></svg>',
    flock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c-3 2-3 5-1 7"/><path d="M12 4c3 2 3 5 1 7"/><circle cx="12" cy="4" r="1.3" fill="currentColor" stroke="none"/><path d="M7 20c0-4 2-7 5-7s5 3 5 7"/></svg>',
    eggs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="13" rx="6" ry="8"/></svg>',
    expenses:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.4"/><line x1="8.3" y1="12" x2="15.7" y2="12"/></svg>',
    income:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.4"/><line x1="8.3" y1="12" x2="15.7" y2="12"/><line x1="12" y1="8.3" x2="12" y2="15.7"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 9 15 9"/></svg>',
    chevronLeft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 9 12 15 19"/></svg>',
    chevronRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 15 12 9 19"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5V14h4v5.5"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4.3-.9L18.1 9.3l-3.4-3.4L4.9 15.7 4 20z"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>',
    empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><ellipse cx="12" cy="13" rx="6" ry="8"/></svg>',
    history:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/></svg>',
    finance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 19h18"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    // A single quill feather — doubles as "poultry" (feathers) and "signing
    // in" (a quill signature), used on the sign-in button instead of a plain
    // padlock. Kept as its own icon (not a replacement for ICONS.lock, which
    // is still used for the Finance PIN elsewhere) so this one change can't
    // affect anything else.
    feather:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 3.8c-6.7.5-11.6 3.4-13.9 8.6C5.2 15 4.3 17.6 4.3 20h3.4c2.7-4.6 4.4-8 5.3-11.4"/><path d="M20.2 3.8c.5 5-1.9 10.2-6.1 13.5"/><line x1="13.5" y1="14.5" x2="8.5" y2="19.5"/><line x1="16" y1="12" x2="11.5" y2="16.5"/></svg>',
    team:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="8" r="2.4"/><path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>',
    warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 21.5 20h-19L12 3.5z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.2 0 10 7 10 7a15.5 15.5 0 0 1-3.6 4.3M6.6 6.6C4 8.3 2 12 2 12s3.8 7 10 7c1.4 0 2.6-.3 3.7-.8"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    fingerprint:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5c-4.4 0-8 3.4-8 8.5 0 2 .5 3.6 1.2 5"/><path d="M12 4.5c4.4 0 8 3.4 8 8.5 0 1.2-.1 2.2-.4 3.2"/><path d="M8 18.5c-1-2-1.5-3.7-1.5-5.5 0-3 2.4-5.5 5.5-5.5s5.5 2.5 5.5 5.5c0 .6-.03 1.1-.1 1.6"/><path d="M9.7 20c-1.3-2.3-2-4.3-2-7 0-2.4 1.9-4.3 4.3-4.3s4.3 1.9 4.3 4.3c0 .9-.1 1.7-.3 2.5"/><path d="M12 13c.3 1.9.9 3.4 2 5"/></svg>',
    lockClosed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/></svg>',
    mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="21.5"/><line x1="8.5" y1="21.5" x2="15.5" y2="21.5"/></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="10.5" x2="12" y2="16"/><circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none"/></svg>',
    health:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9C.8 8.2 2.4 4.5 6 4.5c2 0 3.4 1.1 4 2.2.6-1.1 2-2.2 4-2.2 3.6 0 5.2 3.7 3.5 7.5-2.5 4.5-9.5 9-9.5 9z"/><path d="M6.5 12h2.3l1.2-2.4L11.5 14l1.4-2h4.3"/></svg>',
    feed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l1.5 6c.6 4-1.5 8-3.5 9.5a4 4 0 0 1-4 .8"/><path d="M6 3 4.5 9c-.6 4 1.5 8 3.5 9.5.8.6 1.8.9 2.8.9"/><path d="M9 9h6"/><path d="M8 13.5h3M13 13.5h3"/></svg>',
    reports:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13l2 2 4-5"/></svg>',
    receipt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    customers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10.5" r="2.3"/><path d="M5.3 16.3c.6-1.9 2-2.9 3.7-2.9s3.1 1 3.7 2.9"/><path d="M14.5 9h4M14.5 12.5h4"/></svg>',
    kemai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="12" rx="4"/><circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none"/><path d="M12 7V4"/><circle cx="12" cy="3" r="1" fill="currentColor" stroke="none"/><path d="M4 12H2M22 12h-2"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L20 4l-6.5 16-2.7-7.3z"/><path d="M4 12l9-1"/></svg>',
    signature:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c2-1 3-3 4-6 1-3 2-3 3 0s2 5 3 3 1-5 2-3 1 3 3 3"/><path d="M3 21h18"/></svg>',
    verify:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12.5l2 2 4-4.5"/></svg>',
    statement:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2h8l4 4v16H7z"/><path d="M15 2v4h4"/><path d="M9 11h8M9 14h8M9 17h5"/></svg>',
    directory:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10.5" r="2.3"/><path d="M5.3 16.3c.6-1.9 2-2.9 3.7-2.9s3.1 1 3.7 2.9"/><path d="M14.5 8.5h4M14.5 12h4M14.5 15.5h4"/></svg>',
    camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    cake:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 21h16"/><path d="M4 17c1.2 1 2.4 1 3.5 0s2.3-1 3.5 0 2.4 1 3.5 0 2.3-1 3.5 0"/><line x1="8" y1="12" x2="8" y2="8"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="16" y1="12" x2="16" y2="8"/><circle cx="12" cy="4" r="1"/></svg>'
  };

  /* ---- PICS: colorful illustrated icon set --------------------------------
     Hand-drawn multi-color flat-style artwork (fixed hex fills, not
     currentColor/stroke like ICONS above) used for the nav rail and a few
     in-page spots (Flock's Chicks/Growers/Hens/Cocks tiles, the Brooding
     panel, the Eggs page). Kept as a separate object from ICONS because
     these carry their own baked-in coloring rather than inheriting a
     section's accent color. */
  var PICS = {
    chick:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="32" rx="12" ry="10" fill="#F5C94D"/><ellipse cx="18" cy="33" rx="4.5" ry="6" fill="#E8B93D"/><circle cx="25" cy="18" r="8.5" fill="#FBE07A"/><path d="M32 17 L39 19 L32 21 Z" fill="#F2994A"/><circle cx="27.5" cy="16" r="1.3" fill="#3A2705"/><path d="M21 10 Q23 6 26 10" stroke="#E8B93D" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M18 41 l0 3 M24 42 l0 3 M30 41 l0 3" stroke="#E8973D" stroke-width="2" stroke-linecap="round"/></svg>',
    grower:'<svg viewBox="0 0 48 48"><ellipse cx="23" cy="33" rx="13" ry="10.5" fill="#C9A06B"/><ellipse cx="16" cy="34" rx="5" ry="6.5" fill="#B3875A"/><circle cx="9" cy="34" r="1.1" fill="#fff" opacity=".7"/><circle cx="14" cy="30" r="1.1" fill="#fff" opacity=".7"/><circle cx="19" cy="37" r="1.1" fill="#fff" opacity=".7"/><circle cx="27" cy="19" r="8" fill="#D8B583"/><path d="M27 12 q1.5 -3 3 0 q1.5 -2.6 2.6 .3" fill="#D6273C"/><path d="M34 18 L41 20 L34 22.5 Z" fill="#F2994A"/><circle cx="29.5" cy="17.5" r="1.2" fill="#3A2705"/><path d="M12 42 l0 4 M20 43 l0 4 M28 43 l0 4" stroke="#D98A3D" stroke-width="2.2" stroke-linecap="round"/><path d="M10 30 q-6 2 -4 9 q5 -1 6 -6 Z" fill="#8A6A44"/></svg>',
    hen:'<svg viewBox="0 0 48 48"><path d="M8 40 Q6 24 20 20 Q34 16 38 26 Q41 32 34 36 L34 41 Z" fill="#A6431F"/><ellipse cx="19" cy="33" rx="7" ry="8" fill="#EDD9B8"/><path d="M34 20 Q40 16 44 20 Q41 24 36 25 Z" fill="#1B1B1B"/><path d="M32 18 Q38 12 43 15 Q39 20 34 21 Z" fill="#2E2A26"/><circle cx="21" cy="16" r="6.5" fill="#B5502A"/><path d="M21 9 q1.3 -4 2.6 0 q1.3 -3.4 2.6 .4 q1 -2.6 2 .6" fill="#D6273C"/><path d="M17 17 q-2 1.6 -0.3 3.3" stroke="#D6273C" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M26 15 L33 16.5 L26 19 Z" fill="#F2A93D"/><circle cx="24.5" cy="15" r="1.2" fill="#241a12"/><path d="M14 41 l-1 4 M14 41 l3 3.5 M23 42 l-1 4 M23 42 l3 3.5" stroke="#E8973D" stroke-width="2" stroke-linecap="round"/></svg>',
    cock:'<svg viewBox="0 0 48 48"><path d="M30 22 Q44 8 46 22 Q40 20 36 26 Z" fill="#173226"/><path d="M28 20 Q40 4 44 16 Q37 16 33 23 Z" fill="#2F6B5E"/><path d="M26 20 Q34 2 40 12 Q32 14 30 21 Z" fill="#173226"/><path d="M9 40 Q6 22 21 19 Q36 15 38 27 Q39 33 32 36 L31 41 Z" fill="#C0451B"/><path d="M13 24 Q9 26 12 33 Q17 30 17 26 Z" fill="#E8B93D"/><ellipse cx="20" cy="33" rx="6" ry="7.5" fill="#E8A93D"/><circle cx="22" cy="15.5" r="6.7" fill="#C0451B"/><path d="M22 8 q1.3 -4.4 2.7 0 q1.3 -3.6 2.6 .4 q1 -2.8 2 .6" fill="#D6273C"/><path d="M18 16.5 q-2.2 1.7 -0.3 3.5" stroke="#D6273C" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M27 14.5 L35 16 L27 18.7 Z" fill="#F2A93D"/><circle cx="25" cy="14.6" r="1.2" fill="#241a12"/><path d="M14 41 l-1 4 M14 41 l3 3.5 M24 42 l-1 4 M24 42 l3 3.5" stroke="#4a3a2a" stroke-width="2.2" stroke-linecap="round"/></svg>',
    brooding:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="38" rx="18" ry="6" fill="#8B5E34"/><path d="M8 38 Q9 33 14 33 Q13 37 16 39" stroke="#6B4726" stroke-width="1.6" fill="none"/><path d="M40 38 Q39 33 34 33 Q35 37 32 39" stroke="#6B4726" stroke-width="1.6" fill="none"/><ellipse cx="15" cy="37" rx="3.2" ry="2.4" fill="#FBF6EA"/><ellipse cx="33" cy="37" rx="3.2" ry="2.4" fill="#EFD9AE"/><ellipse cx="24" cy="37.5" rx="3.2" ry="2.4" fill="#FBF6EA"/><path d="M10 33 Q8 20 24 18 Q40 16 40 29 Q40 36 30 37 Q18 38 10 33 Z" fill="#A6431F"/><path d="M11 26 Q7 27 9 33" stroke="#8A3618" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M37 24 Q41 25 39 31" stroke="#8A3618" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="18" cy="21" r="5.6" fill="#B5502A"/><path d="M17 15.5 q1.1 -3.4 2.2 0 q1.1 -2.8 2.2 .4" fill="#D6273C"/><path d="M22 20 L28 21.3 L22 23.6 Z" fill="#F2A93D"/><circle cx="20.3" cy="20.2" r="1" fill="#241a12"/></svg>',
    eggs:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="41" rx="17" ry="3.4" fill="#D9C6A3" opacity=".6"/><path d="M15 40 Q6 40 8 27 Q10 13 17 13 Q24 13 24 27 Q24 40 15 40 Z" fill="#C08347"/><circle cx="12" cy="24" r="1.1" fill="#8A5A2E"/><circle cx="18" cy="20" r="1" fill="#8A5A2E"/><circle cx="14" cy="31" r="1.1" fill="#8A5A2E"/><circle cx="19" cy="28" r="0.9" fill="#8A5A2E"/><path d="M32 40 Q23 40 25 28 Q27 16 33 16 Q39 16 39 28 Q39 40 32 40 Z" fill="#FBF6EA"/><path d="M29 22 Q32 20 35 22" stroke="#EFE4CC" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
    feed:'<svg viewBox="0 0 48 48"><path d="M14 12 h20 l2 8 q2 10 -2 18 q-4 6 -10 6 q-6 0 -10 -6 q-4 -8 -2 -18 Z" fill="#C9A06B"/><path d="M14 12 q10 4 20 0" stroke="#8B5E34" stroke-width="2" fill="none"/><path d="M17 9 q7 4 14 0" stroke="#6B4726" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="20" cy="24" r="2.6" fill="#E8B93D"/><circle cx="27" cy="27" r="2.2" fill="#D6A02E"/><circle cx="22" cy="31" r="2" fill="#E8B93D"/><path d="M31 30 q3 -4 7 -2 q-2 4 -7 2 Z" fill="#5C8F3E"/></svg>',
    health:'<svg viewBox="0 0 48 48"><path d="M24 6 L40 12 V22 Q40 36 24 43 Q8 36 8 22 V12 Z" fill="#2F8F73"/><path d="M24 10 L36 14.5 V22 Q36 33 24 39 Q12 33 12 22 V14.5 Z" fill="#3EA987"/><path d="M24 18 v14 M17 25 h14" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>',
    expenses:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="34" rx="13" ry="5" fill="#8A3A22"/><ellipse cx="24" cy="29" rx="13" ry="5" fill="#BD5B38"/><ellipse cx="24" cy="24" rx="13" ry="5" fill="#D97A50"/><ellipse cx="24" cy="24" rx="13" ry="5" fill="none" stroke="#8A3A22" stroke-width="1.4" opacity=".4"/><path d="M35 12 l4 4 M39 12 l-4 4" stroke="#A63A2E" stroke-width="2.6" stroke-linecap="round"/></svg>',
    income:'<svg viewBox="0 0 48 48"><ellipse cx="24" cy="34" rx="13" ry="5" fill="#215E3B"/><ellipse cx="24" cy="29" rx="13" ry="5" fill="#3E8E5A"/><ellipse cx="24" cy="24" rx="13" ry="5" fill="#6DBB86"/><path d="M37 8 v11 M32 13 l5 -5 l5 5" stroke="#215E3B" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    customers:'<svg viewBox="0 0 48 48"><circle cx="18" cy="17" r="7" fill="#C4667A"/><path d="M6 39 q0 -13 12 -13 q12 0 12 13 Z" fill="#C4667A"/><circle cx="32" cy="20" r="5.6" fill="#E8B93D"/><path d="M22 39 q0 -10.5 10 -10.5 q10 0 10 10.5 Z" fill="#E8B93D" opacity=".9"/></svg>',
    finance:'<svg viewBox="0 0 48 48"><path d="M24 6 L42 16 H6 Z" fill="#43508C"/><rect x="9" y="18" width="5" height="16" fill="#5A6BAE"/><rect x="17.5" y="18" width="5" height="16" fill="#5A6BAE"/><rect x="26" y="18" width="5" height="16" fill="#5A6BAE"/><rect x="34.5" y="18" width="5" height="16" fill="#5A6BAE"/><rect x="6" y="35" width="36" height="4" rx="1" fill="#323C6B"/><circle cx="24" cy="11" r="2.4" fill="#E8B93D"/></svg>',
    reports:'<svg viewBox="0 0 48 48"><path d="M11 5 h18 l8 8 v30 h-26 Z" fill="#FBF8F1"/><path d="M29 5 v8 h8 Z" fill="#C9BEDD"/><rect x="16" y="26" width="4" height="9" fill="#3E8E5A"/><rect x="22" y="21" width="4" height="14" fill="#E8B93D"/><rect x="28" y="17" width="4" height="18" fill="#7A4F86"/></svg>',
    messages:'<svg viewBox="0 0 48 48"><path d="M6 10 h36 a3 3 0 0 1 3 3 v16 a3 3 0 0 1 -3 3 h-20 l-9 8 v-8 h-7 a3 3 0 0 1 -3 -3 v-16 a3 3 0 0 1 3 -3 Z" fill="#2E7DAF"/><circle cx="16" cy="21" r="2.2" fill="#fff"/><circle cx="24" cy="21" r="2.2" fill="#fff"/><circle cx="32" cy="21" r="2.2" fill="#fff"/></svg>',
    signoffs:'<svg viewBox="0 0 48 48"><path d="M10 38 Q18 30 30 12 L36 18 Q20 32 10 38 Z" fill="#C97B2E"/><path d="M30 12 L34 8 L40 14 L36 18 Z" fill="#E8B93D"/><path d="M8 40 l4 -8 l4 4 Z" fill="#8A5218"/><circle cx="37" cy="34" r="7" fill="#D6273C"/><path d="M34 34 l2 2.4 l4.5 -5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    directory:'<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="28" rx="4" fill="#9C4F9E"/><circle cx="16" cy="21" r="5" fill="#EFD9AE"/><path d="M8 33 q0 -8 8 -8 q8 0 8 8 Z" fill="#EFD9AE"/><rect x="27" y="17" width="11" height="2.6" rx="1.3" fill="#D9AEDA"/><rect x="27" y="23" width="11" height="2.6" rx="1.3" fill="#D9AEDA"/><rect x="27" y="29" width="7" height="2.6" rx="1.3" fill="#D9AEDA"/></svg>',
    about:'<svg viewBox="0 0 48 48"><circle cx="37" cy="10" r="4" fill="#E8B93D"/><path d="M6 40 V22 L24 10 L42 22 V40 Z" fill="#8B4A34"/><path d="M6 22 L24 10 L42 22" stroke="#6B3624" stroke-width="2.4" fill="none" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="12" fill="#5C3420"/><rect x="11" y="26" width="6" height="6" fill="#D9C6A3"/><rect x="31" y="26" width="6" height="6" fill="#D9C6A3"/></svg>',
    settings:'<svg viewBox="0 0 48 48"><path d="M24 6 l3 5 6 -2 1 6 6 1 -2 6 5 3 -5 3 2 6 -6 1 -1 6 -6 -2 -3 5 -3 -5 -6 2 -1 -6 -6 -1 2 -6 -5 -3 5 -3 -2 -6 6 -1 1 -6 6 2 Z" fill="#5B6B78" opacity=".92"/><circle cx="24" cy="24" r="8" fill="#EFF3F5"/><circle cx="24" cy="24" r="4.4" fill="#5B6B78"/></svg>',
    trash:'<svg viewBox="0 0 48 48"><rect x="19" y="5" width="10" height="6" rx="2" fill="#5B3E2B"/><rect x="9" y="10" width="30" height="6" rx="2" fill="#8A5E42"/><path d="M13 18 h22 l-2.2 24.5 a3 3 0 0 1 -3 2.7 h-11.6 a3 3 0 0 1 -3 -2.7 Z" fill="#B98A5E"/><path d="M19 22 v18 M24 22 v18 M29 22 v18" stroke="#8A5E42" stroke-width="2.2" stroke-linecap="round"/></svg>',
    team:'<svg viewBox="0 0 48 48"><circle cx="24" cy="10" r="5.5" fill="#5B4B96"/><path d="M15 24 q0 -9 9 -9 q9 0 9 9 Z" fill="#5B4B96"/><circle cx="10" cy="28" r="4.4" fill="#8D7BC4"/><path d="M3 40 q0 -7.4 7 -7.4 q7 0 7 7.4 Z" fill="#8D7BC4"/><circle cx="38" cy="28" r="4.4" fill="#8D7BC4"/><path d="M31 40 q0 -7.4 7 -7.4 q7 0 7 7.4 Z" fill="#8D7BC4"/><circle cx="24" cy="26" r="5.6" fill="#402F72"/><path d="M15 40 q0 -9.4 9 -9.4 q9 0 9 9.4 Z" fill="#402F72"/></svg>',
    overview:'<svg viewBox="0 0 48 48"><circle cx="37" cy="9" r="4.4" fill="#E8B93D"/><path d="M6 40 V24 L16 16 L26 24 V40 Z" fill="#B9740E"/><path d="M6 24 L16 16 L26 24" stroke="#8F590A" stroke-width="2.2" fill="none" stroke-linejoin="round"/><rect x="12" y="30" width="6" height="10" fill="#F0DBA0"/><rect x="30" y="20" width="4" height="7" fill="#3E8E5A"/><rect x="36" y="16" width="4" height="11" fill="#E8B93D"/><rect x="42" y="23" width="4" height="4" fill="#7A4F86"/></svg>',
    flockNav:'<svg viewBox="0 0 48 48"><path d="M18 38 Q16 24 28 21 Q40 18 43 27 Q45 32 39 35 L39 40 Z" fill="#A6431F"/><ellipse cx="27" cy="32" rx="6" ry="7" fill="#EDD9B8"/><path d="M39 22 Q44 19 47 22 Q45 25 41 26 Z" fill="#1B1B1B"/><circle cx="29" cy="17" r="5.6" fill="#B5502A"/><path d="M28 12 q1 -3 2 0 q1 -2.6 2 .4" fill="#D6273C"/><path d="M33 16 L39 17.3 L33 19.6 Z" fill="#F2A93D"/><circle cx="31" cy="16.2" r="1" fill="#241a12"/><path d="M20 40 l-1 3 M20 40 l2.4 2.6 M28 41 l-1 3 M28 41 l2.4 2.6" stroke="#E8973D" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="10" cy="35" rx="7.5" ry="6.2" fill="#F5C94D"/><ellipse cx="6" cy="35.5" rx="2.6" ry="3.6" fill="#E8B93D"/><circle cx="12" cy="26" r="5.4" fill="#FBE07A"/><path d="M17 25 L22 26.6 L17 28.6 Z" fill="#F2994A"/><circle cx="14.3" cy="25" r="0.9" fill="#3A2705"/><path d="M4 41 l0 2 M10 41.5 l0 2" stroke="#E8973D" stroke-width="1.6" stroke-linecap="round"/></svg>',
    // Default profile-avatar placeholders, shown before someone uploads a
    // real photo (see avatarHTML) — deliberately abstract color-block
    // silhouettes rather than any skin-toned rendering, the same approach
    // already used for the Customers icon above. The hair silhouette behind
    // the head is what tells the two apart.
    lady:'<svg viewBox="0 0 48 48"><path d="M24 6 C32.5 6 37 13.5 37 21 C37 26.5 34.5 30.5 31 32.5 L31 24 C31 16.5 28 11.5 24 11.5 C20 11.5 17 16.5 17 24 L17 32.5 C13.5 30.5 11 26.5 11 21 C11 13.5 15.5 6 24 6 Z" fill="#8A3F63"/><circle cx="24" cy="19" r="8" fill="#C4667A"/><path d="M8 41 Q8 24 24 24 Q40 24 40 41 Z" fill="#C4667A"/></svg>',
    man:'<svg viewBox="0 0 48 48"><circle cx="24" cy="18" r="9" fill="#4E6FA3"/><path d="M8 41 Q8 24 24 24 Q40 24 40 41 Z" fill="#4E6FA3"/></svg>'
  };

  // Real farm photography (uploaded by the farm owner) — used on the sign-in
  // screen, as Flock category icons, and in the About page gallery. Kept
  // separate from PICS (the illustrated icon set) since these are actual
  // photos, resized/compressed to base64 data URIs so the app stays a
  // single self-contained file.
  var FARM_PHOTOS = {"portraitHalf":"images/portraitHalf.jpg","heroHalf":"images/heroHalf.jpg","icons":{"chicksIcon":"images/icons-chicksIcon.jpg","growersIcon":"images/icons-growersIcon.jpg","hensIcon":"images/icons-hensIcon.jpg","cocksIcon":"images/icons-cocksIcon.jpg","feedIcon":"images/icons-feedIcon.jpg","eggsIcon":"images/icons-eggsIcon.jpg","flockIcon":"images/icons-flockIcon.jpg"},"banners":{"chicks":"images/banners-chicks.jpg","growers":"images/banners-growers.jpg","hens":"images/banners-hens.jpg","cocks":"images/banners-cocks.jpg","eggs":"images/banners-eggs.jpg","feed":"images/banners-feed.jpg"},"lightbox":{"chicksIcon":"images/lightbox-chicksIcon.jpg","growersIcon":"images/lightbox-growersIcon.jpg","hensIcon":"images/lightbox-hensIcon.jpg","cocksIcon":"images/lightbox-cocksIcon.jpg","feedIcon":"images/lightbox-feedIcon.jpg","eggsIcon":"images/lightbox-eggsIcon.jpg","flockIcon":"images/lightbox-flockIcon.jpg","chicksBanner":"images/banners-chicks.jpg","growersBanner":"images/banners-growers.jpg","hensBanner":"images/banners-hens.jpg","cocksBanner":"images/banners-cocks.jpg","eggsBanner":"images/banners-eggs.jpg","feedBanner":"images/banners-feed.jpg","portrait":"images/lightbox-portrait.jpg","flockHero":"images/lightbox-flockIcon.jpg","gallery1_pullets":"images/lightbox-gallery1_pullets.jpg","gallery2_feeding":"images/lightbox-gallery2_feeding.jpg","gallery3_rooster":"images/lightbox-gallery3_rooster.jpg","gallery4_chicks":"images/lightbox-gallery4_chicks.jpg","gallery5_mash":"images/lightbox-gallery5_mash.jpg","eggsBannerSrc":"images/lightbox-eggsIcon.jpg"},"gallery":[{"key":"portrait","src":"images/gallery-0-src.jpg","caption":"Enock Kiplangat \u2014 founder of Kenokip Farm"},{"key":"flockHero","src":"images/gallery-1-src.jpg","caption":"Part of the flock at Kenokip Farm"},{"key":"chicksIcon","src":"images/gallery-2-src.jpg","caption":"Day-old to 8-week chicks"},{"key":"growersIcon","src":"images/gallery-3-src.jpg","caption":"Growers, 9\u201320 weeks"},{"key":"hensIcon","src":"images/gallery-4-src.jpg","caption":"Laying hens"},{"key":"cocksIcon","src":"images/gallery-5-src.jpg","caption":"Cocks"},{"key":"gallery1_pullets","src":"images/gallery-6-src.jpg","caption":"Young pullets at the feeding trough"},{"key":"gallery2_feeding","src":"images/gallery-7-src.jpg","caption":"Hens feeding"},{"key":"gallery3_rooster","src":"images/gallery-8-src.jpg","caption":"A cock in the coop"},{"key":"gallery4_chicks","src":"images/gallery-9-src.jpg","caption":"Chicks in the brooder"},{"key":"feedIcon","src":"images/gallery-10-src.jpg","caption":"Layer feed, ready to serve"},{"key":"gallery5_mash","src":"images/gallery-11-src.jpg","caption":"Mixed feed, measured out"},{"key":"eggsIcon","src":"images/gallery-12-src.jpg","caption":"Eggs collected from the farm"},{"key":"eggsBannerSrc","src":"images/gallery-13-src.jpg","caption":"A fresh tray of eggs"}]};

  /* ============================= UTILS ============================= */
  function uid(p){ return p+'_'+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-5); }
  /* ============================= TRASH ============================= */
  // A generic 30-day-recoverable trash, sitting underneath the existing
  // delete confirmations rather than replacing them — "Delete" still asks
  // "are you sure", but now the answer is recoverable for a month instead
  // of gone immediately. Each entry keeps the full original record (plus
  // anything that was cascade-deleted alongside it, e.g. a feed entry's
  // linked Expense) so Restore can put everything back exactly as it was,
  // not just the main record on its own.
  var TRASH_ARRAY_BY_TYPE = { egg:'eggs', eggloss:'eggLosses', feed:'feedLogs', health:'healthRecords', expense:'expenses', income:'incomes', customer:'customers', flock:'flock', brooding:'broodings' };
  var TRASH_TYPE_LABELS = { egg:'Egg entry', eggloss:'Egg sale/loss', feed:'Feed entry', health:'Health record', expense:'Expense', income:'Income', customer:'Customer', flock:'Flock batch', brooding:'Brooding record' };
  var TRASH_RETENTION_MS = 30*24*3600*1000;
  function trashPush(s, type, record, linked){
    s.trash = s.trash || [];
    s.trash.push({ id:uid('trash'), type:type, record:record, linked:linked||[], deletedAt:new Date().toISOString(), deletedByRole: roleLabel(currentUser) });
  }
  function purgeOldTrash(s){
    var cutoff = Date.now() - TRASH_RETENTION_MS;
    s.trash = (s.trash||[]).filter(function(x){ return new Date(x.deletedAt).getTime() >= cutoff; });
  }
  function restoreTrashItem(id){
    mutate(function(s){
      var idx = (s.trash||[]).findIndex(function(x){return x.id===id;});
      if(idx===-1) return;
      var item = s.trash[idx];
      var arrName = TRASH_ARRAY_BY_TYPE[item.type];
      if(arrName){ s[arrName] = s[arrName] || []; s[arrName].push(item.record); }
      (item.linked||[]).forEach(function(l){ s[l.arr] = s[l.arr] || []; s[l.arr].push(l.record); });
      // Restoring a feed entry re-applies its draw on stock on hand — it
      // was added back when the entry was first deleted, so this undoes
      // that and keeps the stock number consistent either way.
      if(item.type==='feed'){
        s.feedStock = s.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
        s.feedStock.onHandKg = (s.feedStock.onHandKg||0) - (item.record.quantityKg||0);
      }
      s.trash.splice(idx,1);
    });
    toast('Restored.');
  }
  function purgeTrashItem(id){
    mutate(function(s){ s.trash = (s.trash||[]).filter(function(x){return x.id!==id;}); });
  }
  function trashDaysLeft(deletedAt){
    var ms = TRASH_RETENTION_MS - (Date.now() - new Date(deletedAt).getTime());
    return Math.max(0, Math.ceil(ms/(24*3600*1000)));
  }
  // Which page's access rules govern seeing a given trash entry — a
  // farmhand who can't see Expenses shouldn't see a trashed one either,
  // just because it happened to get deleted.
  var TRASH_TYPE_SECTION = { egg:'eggs', eggloss:'eggs', feed:'feed', health:'health', expense:'expenses', income:'income', customer:'customers', flock:'flock', brooding:'flock' };
  function visibleTrashItems(){
    return (state.trash||[]).filter(function(x){ return sectionAllowed(TRASH_TYPE_SECTION[x.type]||'overview'); });
  }
  function describeTrashItem(item){
    var r = item.record;
    switch(item.type){
      case 'egg': return r.total+' eggs — '+fmtDate(parseISO(r.date));
      case 'eggloss': return r.count+' egg'+(r.count===1?'':'s')+' — '+eggLossReasonLabel(r.reason)+' — '+fmtDate(parseISO(r.date));
      case 'feed': return (r.quantityKg||0).toFixed(1)+' kg '+r.feedType+' — '+fmtDate(parseISO(r.date));
      case 'health': return r.title+' ('+healthTypeLabel(r.type)+') — '+fmtDate(parseISO(r.date));
      case 'expense': return fmtMoney(r.amount)+' — '+r.category+' — '+fmtDate(parseISO(r.date));
      case 'income': return fmtMoney(r.amount)+' — '+r.category+' — '+fmtDate(parseISO(r.date));
      case 'customer': return r.name;
      case 'flock': return r.count+' '+genderLabel(r.gender)+(r.count===1?'':'s')+' — added '+fmtDate(parseISO(r.dateAdded));
      case 'brooding': return r.eggsGiven+' eggs given for brooding — '+fmtDate(parseISO(r.dateStarted));
      default: return 'Deleted record';
    }
  }
  function trashPanel(){
    var items = visibleTrashItems().slice().sort(function(a,b){ return a.deletedAt<b.deletedAt?1:-1; });
    var page = paginate('trash', items);
    var rows = page.items.map(function(x){
      var days = trashDaysLeft(x.deletedAt);
      return '<tr><td>'+esc(TRASH_TYPE_LABELS[x.type]||x.type)+'</td><td>'+esc(describeTrashItem(x))+'</td>'+
        '<td>'+fmtDate(parseISO(x.deletedAt.slice(0,10)))+(x.deletedByRole?' · '+esc(x.deletedByRole):'')+'</td>'+
        '<td class="num" style="color:'+(days<=3?'var(--bad)':'inherit')+'">'+days+' day'+(days===1?'':'s')+'</td>'+
        '<td><div class="row-actions">'+
          '<button class="btn sm primary" data-action="restore-trash:'+x.id+'" '+(readOnly?'disabled':'')+'>Restore</button>'+
          '<button class="icon-btn" data-action="purge-trash:'+x.id+'" title="Delete forever" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
        '</div></td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Deleted records</h3><span class="hint">'+items.length+' item'+(items.length===1?'':'s')+' — anything older than 30 days is removed automatically</span></div>'+
      '<div class="table-wrap">'+
      (items.length ? '<table><thead><tr><th>Type</th><th>Details</th><th>Deleted</th><th class="num">Time left</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>Nothing in the trash right now.</div></div>')+
      '</div>'+pagerHtml('trash', page.pageCount, page.page)+'</div>';
  }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ============================= PAGINATION ============================= */
  // Every list-style table in the app (Eggs, Feed logs, Health, Expenses,
  // Income, Customers, Brooding, Messages, Flock batches, Finance
  // transactions, Access log...) shows PAGE_SIZE rows at a time through
  // this one shared helper, so "5 per page" behaves identically everywhere
  // instead of sixteen slightly-different bespoke implementations. Current
  // page per list lives in ui.pages (keyed by a short string id, e.g.
  // "eggs") — in-memory only, so it resets to page 1 on reload, which is
  // the least surprising behavior for a list that can change shape between
  // visits.
  var PAGE_SIZE = 5;
  function pageFor(key){ return Math.max(1, ui.pages[key]||1); }
  function setPageFor(key, n){ ui.pages[key] = Math.max(1, n); }
  // Returns { items, page, pageCount } — items is already sliced to the
  // current page, and the current page is clamped back into range first
  // (so deleting the last row on page 3 of 3 doesn't leave you looking at
  // an empty page 3 forever).
  function paginate(key, list){
    var pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    var page = Math.min(pageFor(key), pageCount);
    setPageFor(key, page);
    var start = (page-1)*PAGE_SIZE;
    return { items: list.slice(start, start+PAGE_SIZE), page: page, pageCount: pageCount, total: list.length };
  }
  // A small "‹ Page 2 of 5 ›" footer — omitted entirely when everything
  // fits on one page, so short lists (most days, for most farms) look
  // exactly as they always did.
  function pagerHtml(key, pageCount, page){
    if(pageCount<=1) return '';
    return '<div class="pager">'+
      '<button class="icon-btn" data-action="pager-prev:'+key+'" '+(page<=1?'disabled':'')+' title="Previous page">'+ICONS.chevronLeft+'</button>'+
      '<span class="hint">Page '+page+' of '+pageCount+'</span>'+
      '<button class="icon-btn" data-action="pager-next:'+key+'" '+(page>=pageCount?'disabled':'')+' title="Next page">'+ICONS.chevronRight+'</button>'+
    '</div>';
  }
  function clamp(n,lo,hi){ return Math.max(lo,Math.min(hi,n)); }

  /* ---- privacy masking (Finance, until unlocked with an authenticator code) ----
     Not everything is blanked out — just enough of each number/word that a
     glance over someone's shoulder can't read the real figures, the same
     idea as a masked card number like "4512 xxxx xxxx 9081". */
  function maskString(str){
    str = String(str==null ? '' : str);
    var n = str.length;
    if(n <= 2) return str.replace(/\S/g, 'x');
    var keepStart = n <= 6 ? 1 : (n <= 12 ? 2 : Math.min(5, Math.ceil(n*0.3)));
    var keepEnd = n <= 6 ? 1 : (n <= 12 ? 1 : Math.min(3, Math.ceil(n*0.15)));
    if(keepStart + keepEnd >= n){ keepStart = Math.max(1, n-1); keepEnd = 0; }
    var mid = str.slice(keepStart, n-keepEnd).replace(/\S/g, 'x');
    return str.slice(0,keepStart) + mid + (keepEnd ? str.slice(n-keepEnd) : '');
  }
  function maskMoneyDisplay(amount){
    var full = fmtMoney(amount);
    var digits = full.replace(/[^0-9]/g,'');
    if(digits.length <= 4) return full.replace(/[0-9]/g,'x');
    var keep = Math.max(1, Math.floor(digits.length*0.2));
    var seen = 0;
    return full.replace(/[0-9]/g, function(ch){
      seen++;
      return (seen<=keep || seen>digits.length-keep) ? ch : 'x';
    });
  }

  /* ============================= DATES ============================= */
  function pad2(n){ return String(n).padStart(2,'0'); }
  function toISO(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
  function parseISO(s){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function todayISO(){ return toISO(new Date()); }
  function addDays(d,n){ var r=new Date(d); r.setDate(r.getDate()+n); return r; }
  function startOfWeek(d){ var day=d.getDay(); var diff=(day===0?-6:1-day); return addDays(d,diff); }
  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }
  function startOfYear(d){ return new Date(d.getFullYear(), 0, 1); }
  function endOfYear(d){ return new Date(d.getFullYear(), 11, 31); }
  function weeksBetween(a,b){ return Math.floor((b-a)/(7*24*3600*1000)); }
  function daysBetween(a,b){ return Math.round((b-a)/(24*3600*1000)); }
  function addDaysISO(iso, days){ var d = parseISO(iso); d.setDate(d.getDate()+days); return toISO(d); }
  function fmtDate(d,opts){ return d.toLocaleDateString('en-GB', opts||{day:'numeric',month:'short',year:'numeric'}); }

  function getRange(period, ref){
    ref = ref || new Date();
    var start,end,label,prevStart,prevEnd;
    if(period==='day'){
      start = new Date(ref.getFullYear(),ref.getMonth(),ref.getDate()); end = start;
      prevStart = addDays(start,-1); prevEnd = prevStart;
      label = fmtDate(start,{weekday:'short',day:'numeric',month:'short'});
    } else if(period==='week'){
      start = startOfWeek(ref); end = addDays(start,6);
      prevStart = addDays(start,-7); prevEnd = addDays(end,-7);
      label = 'Week of '+fmtDate(start,{day:'numeric',month:'short'});
    } else if(period==='month'){
      start = startOfMonth(ref); end = endOfMonth(ref);
      prevStart = startOfMonth(addDays(start,-1)); prevEnd = endOfMonth(prevStart);
      label = fmtDate(start,{month:'long',year:'numeric'});
    } else {
      start = startOfYear(ref); end = endOfYear(ref);
      prevStart = new Date(start.getFullYear()-1,0,1); prevEnd = new Date(start.getFullYear()-1,11,31);
      label = String(start.getFullYear());
    }
    return { start:start, end:end, label:label, startISO:toISO(start), endISO:toISO(end), prevStartISO:toISO(prevStart), prevEndISO:toISO(prevEnd) };
  }

  /* ============================= STATE ============================= */
  function defaultState(){
    return {
      version:1,
      settings:{
        displayCurrency:'KES',
        language:'en',
        traySize:30,
        currencies:{
          KES:{symbol:'KSh',rate:1,decimals:0},
          USD:{symbol:'$',rate:0.0077,decimals:2},
          UGX:{symbol:'USh',rate:28.5,decimals:0},
          TZS:{symbol:'TSh',rate:19.9,decimals:0},
          EUR:{symbol:'€',rate:0.0071,decimals:2}
        },
        expenseCategories:['Feed','Vaccines & Medication','Labour','Chicks / Restocking','Equipment & Housing','Utilities','Transport','Other'],
        incomeCategories:['Egg Sales','Bird Sales','M-Pesa / Bank','Manure','Other'],
        // A first draft, written from what's known so far — meant to be
        // edited (Settings → About, administrator only) rather than treated
        // as final. Bracketed bits are placeholders for details only the
        // administrator can fill in.
        about:{
          bio:"Enock Kemoi — known as Kenokip — runs Kenokip Farm, a poultry-keeping operation that has grown from a personal record-keeping effort into a real team operation with its own Supervisor, Vet, Financial Staff, and Farmhand roles. What began as tracking birds, eggs, and money by hand is now run through this purpose-built ledger, with real M-Pesa integration and proper financial controls behind it. [Add: where the farm is based, how and when it got started, and anything else you'd like people to know.]",
          mission:"To run a transparent, well-organized poultry operation — where every bird, egg, shilling, and team member is accounted for — using modern tools to replace guesswork and paper records with real data anyone on the team can trust.",
          vision:"To grow Kenokip Farm into a model for how a small poultry business can operate with the discipline and accountability of a much larger one, while staying rooted in good, honest farming."
        }
      },
      flock:[], eggs:[], eggLosses:[], broodings:[], expenses:[], incomes:[], healthRecords:[], feedLogs:[], customers:[],
      // Stock on hand is tracked separately from feedLogs (which is a usage
      // + cost history, unchanged) — restocking adds to onHandKg, and every
      // usage entry in feedLogs subtracts from it automatically. Starts at 0
      // until the first restock is recorded, so a farm mid-way through this
      // update isn't shown a false low-stock warning before anyone's told
      // the app how much feed they actually have.
      feedStock:{ onHandKg:0, lowStockKg:20, restocks:[] },
      trash:[]
    };
  }
  function migrateState(data){
    var base = defaultState();
    var merged = Object.assign({}, base, data||{});
    merged.settings = Object.assign({}, base.settings, (data&&data.settings)||{});
    merged.settings.currencies = Object.assign({}, base.settings.currencies, (data&&data.settings&&data.settings.currencies)||{});
    merged.settings.expenseCategories = (data&&data.settings&&data.settings.expenseCategories) || base.settings.expenseCategories;
    merged.settings.incomeCategories = (data&&data.settings&&data.settings.incomeCategories) || base.settings.incomeCategories;
    // Finance→Income auto-sync (below) files receipts under this category —
    // make sure it's always in the list, even for a farm document that was
    // already saved before this existed, so it shows up properly in
    // Settings and in the "Add income" category dropdown too.
    if(merged.settings.incomeCategories.indexOf('M-Pesa / Bank')===-1) merged.settings.incomeCategories = merged.settings.incomeCategories.concat(['M-Pesa / Bank']);
    merged.settings.about = Object.assign({}, base.settings.about, (data&&data.settings&&data.settings.about)||{});
    merged.flock = Array.isArray(data&&data.flock) ? data.flock : [];
    merged.eggs = Array.isArray(data&&data.eggs) ? data.eggs : [];
    merged.eggLosses = Array.isArray(data&&data.eggLosses) ? data.eggLosses : [];
    merged.broodings = Array.isArray(data&&data.broodings) ? data.broodings : [];
    merged.expenses = Array.isArray(data&&data.expenses) ? data.expenses : [];
    merged.incomes = Array.isArray(data&&data.incomes) ? data.incomes : [];
    merged.healthRecords = Array.isArray(data&&data.healthRecords) ? data.healthRecords : [];
    merged.feedLogs = Array.isArray(data&&data.feedLogs) ? data.feedLogs : [];
    merged.customers = Array.isArray(data&&data.customers) ? data.customers : [];
    merged.feedStock = Object.assign({}, base.feedStock, (data&&data.feedStock)||{});
    merged.feedStock.restocks = Array.isArray(data&&data.feedStock&&data.feedStock.restocks) ? data.feedStock.restocks : [];
    merged.trash = Array.isArray(data&&data.trash) ? data.trash : [];
    purgeOldTrash(merged);
    backfillCustomers(merged);
    return merged;
  }
  // One-time-per-load catch-up: any "Sold" flock or egg record that already
  // has a buyer name typed in, from before the Customers directory existed
  // (or synced from another device before this one had it), gets linked to
  // a customer now instead of staying just a name on an old receipt.
  // Idempotent — only touches records missing a customerId, and reuses a
  // matching customer by name (case-insensitive) rather than ever making a
  // duplicate.
  function backfillCustomers(merged){
    (merged.flock||[]).forEach(function(b){
      (b.removals||[]).forEach(function(r){
        if(r.reason==='sold' && r.buyer && !r.customerId) r.customerId = resolveOrCreateCustomer(merged, r.buyer);
      });
    });
    (merged.eggLosses||[]).forEach(function(x){
      if(x.reason==='sold' && x.buyer && !x.customerId) x.customerId = resolveOrCreateCustomer(merged, x.buyer);
    });
  }
  function loadState(){
    // Standalone build: this file never rewrites itself, so the durable copy
    // of the user's data lives in this browser's localStorage, not in the
    // embedded <script id="app-state"> below. Prefer localStorage whenever
    // it has something saved; fall back to the embedded (empty) default
    // only on first run.
    try{
      var raw = localStorage.getItem('coop-ledger-state');
      if(raw) return migrateState(JSON.parse(raw));
    }catch(e){}
    var el = document.getElementById('app-state');
    var data = null;
    try{ data = JSON.parse((el && el.textContent) || '{}'); }catch(e){ data = null; }
    return migrateState(data || {});
  }
  function getSavedSection(){ try{ return localStorage.getItem('coop-ledger-ui-section') || 'overview'; }catch(e){ return 'overview'; } }
  function saveUIPref(){ try{ localStorage.setItem('coop-ledger-ui-section', ui.section); }catch(e){} }

  /* ============================= MONEY ============================= */
  function rateOf(code){ var c = state.settings.currencies[code]; return c ? c.rate : 1; }
  function currencyDef(code){ return state.settings.currencies[code] || {symbol:code,rate:1,decimals:0}; }
  function fromCurrency(amount, code){ return amount / rateOf(code); }
  function fmtMoney(amountKES){
    var cur = currencyDef(state.settings.displayCurrency);
    var v = amountKES * cur.rate;
    return esc(cur.symbol)+' '+v.toLocaleString('en-KE',{minimumFractionDigits:cur.decimals,maximumFractionDigits:cur.decimals});
  }
  function currencyOptions(){
    return Object.keys(state.settings.currencies).map(function(c){
      return '<option value="'+c+'" '+(c===state.settings.displayCurrency?'selected':'')+'>'+c+'</option>';
    }).join('');
  }

  // Cost to raise a batch vs what it's earned back so far. This is
  // necessarily an estimate for the feed side: feed usage is logged for
  // the whole flock, not per batch, so each batch's share of the
  // all-time feed bill is split by how many of the farm's total
  // "bird-days" belonged to it (its average headcount × how long it's
  // been on the farm) — a batch that's had more birds for longer gets a
  // proportionally bigger slice. Acquisition cost and sale income, by
  // contrast, are exact — they're this batch's own recorded figures.
  // Egg-sale income isn't included at all, since eggs aren't logged
  // per batch anywhere in the app.
  function batchProfitability(){
    var today = new Date();
    var weighted = state.flock.map(function(b){
      var avgAlive = (b.count + currentCount(b)) / 2;
      var lifetimeDays = Math.max(1, daysBetween(parseISO(b.dateAdded), today));
      return { b:b, weight: avgAlive * lifetimeDays };
    });
    var totalWeight = weighted.reduce(function(a,w){ return a+w.weight; }, 0);
    var allTimeFeedCost = totalFeedCost('0000-01-01', '9999-12-31');
    return weighted.map(function(w){
      var b = w.b;
      var allocatedFeed = totalWeight>0 ? allTimeFeedCost * (w.weight/totalWeight) : 0;
      var acquisitionCost = b.acquisitionCost||0;
      var cost = acquisitionCost + allocatedFeed;
      var income = (b.removals||[]).filter(function(r){ return r.reason==='sold'; }).reduce(function(a,r){ return a+(r.saleAmount||0); }, 0);
      return {
        batch:b, cost:cost, income:income, net: income-cost,
        acquisitionCost:acquisitionCost, allocatedFeed:allocatedFeed,
        hasData: acquisitionCost>0 || income>0 || allocatedFeed>=1
      };
    }).sort(function(a,b2){ return b2.net - a.net; });
  }
  function batchProfitabilityCardHTML(){
    if(!canSeeFinance()) return '';
    var rows = batchProfitability();
    if(!rows.length) return '';
    var body = rows.map(function(r){
      var b = r.batch;
      var label = genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+' · added '+fmtDate(parseISO(b.dateAdded))+(currentCount(b)===0?' · fully removed':'');
      var netColor = r.net<0 ? 'var(--bad)' : (r.net>0 ? 'var(--good)' : 'var(--ink)');
      return '<tr><td>'+esc(label)+'</td><td class="num">'+fmtMoney(r.cost)+'</td><td class="num">'+fmtMoney(r.income)+'</td><td class="num" style="color:'+netColor+'">'+(r.net>=0?'+':'−')+fmtMoney(Math.abs(r.net))+'</td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Batch profitability</h3><span class="hint">Estimate — feed cost is split by flock size &amp; time; egg income isn\'t tracked per batch</span></div>'+
      '<div class="table-wrap"><table><thead><tr><th>Batch</th><th class="num">Cost</th><th class="num">Sale income</th><th class="num">Net</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
    '</div>';
  }
  // Standing "what is the flock worth right now" figure — administrator
  // only (not even Financial Staff, per how the owner asked for this: "This
  // profits should only show me no one else"), using FLOCK_VALUE_TABLE
  // above. Purely informational, never folded into income/expenses.
  function flockAssetValueCardHTML(){
    if(!isAdmin()) return '';
    var rows = [
      ['Mature roosters (21+ wk)', function(b){return b.gender==='male' && ageWeeks(b)>=21;}, FLOCK_VALUE_TABLE.matureCock],
      ['Hens (21+ wk)', function(b){return b.gender!=='male' && ageWeeks(b)>=21;}, FLOCK_VALUE_TABLE.hen],
      ['Growers, 12–20 wk', function(b){var w=ageWeeks(b); return w>=12 && w<=20;}, FLOCK_VALUE_TABLE.growerOlder],
      ['Growers, 9–11 wk', function(b){var w=ageWeeks(b); return w>=9 && w<=11;}, FLOCK_VALUE_TABLE.growerYounger],
      ['Chicks, 4–8 wk', function(b){var w=ageWeeks(b); return w>=4 && w<=8;}, FLOCK_VALUE_TABLE.chickOlder],
      ['Chicks, 2–3 wk', function(b){var w=ageWeeks(b); return w>=2 && w<=3;}, FLOCK_VALUE_TABLE.chickMid],
      ['Chicks, 0–1 wk', function(b){var w=ageWeeks(b); return w<2;}, FLOCK_VALUE_TABLE.chickYoungest]
    ];
    var grandTotal = 0;
    var body = rows.map(function(rw){
      var label=rw[0], match=rw[1], price=rw[2];
      var count = state.flock.reduce(function(a,b){ return a + (match(b) ? currentCount(b) : 0); }, 0);
      var value = count*price;
      grandTotal += value;
      return '<tr><td>'+label+'</td><td class="num">'+count.toLocaleString()+'</td><td class="num">'+fmtMoney(price)+'</td><td class="num">'+fmtMoney(value)+'</td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Flock asset value</h3><span class="hint">Only visible to you — fixed price-per-bird estimate, not a market quote</span></div>'+
      '<div class="table-wrap"><table><thead><tr><th>Category</th><th class="num">Birds</th><th class="num">Price each</th><th class="num">Value</th></tr></thead><tbody>'+body+'</tbody>'+
      '<tfoot><tr style="font-weight:700"><td>Total</td><td></td><td></td><td class="num">'+fmtMoney(grandTotal)+'</td></tr></tfoot></table></div>'+
    '</div>';
  }

  /* ============================= AGGREGATES ============================= */
  function inRange(iso,s,e){ return iso>=s && iso<=e; }
  function sumEggs(s,e){ return state.eggs.filter(function(x){return inRange(x.date,s,e);}).reduce(function(a,x){return a+x.total;},0); }
  function sumMoney(list,s,e){ return list.filter(function(x){return inRange(x.date,s,e);}).reduce(function(a,x){return a+x.amount;},0); }
  function breakdownByCategory(list,s,e){
    var map = {};
    list.filter(function(x){return inRange(x.date,s,e);}).forEach(function(x){ map[x.category]=(map[x.category]||0)+x.amount; });
    return Object.entries(map).sort(function(a,b){return b[1]-a[1];});
  }
  function currentCount(b){ var removed=(b.removals||[]).reduce(function(a,r){return a+r.count;},0); return Math.max(0,b.count-removed); }
  function ageWeeks(b, atDate){ atDate=atDate||new Date(); return Math.max(0, Math.floor((atDate-parseISO(b.birthDate))/(7*24*3600*1000))); }
  function ageGroupForWeeks(w){ return w<=8 ? 'chick' : (w<=20 ? 'grower' : 'layer'); }
  function ageGroupLabel(k){ return k==='chick'?'Chicks':(k==='grower'?'Growers':'Layers'); }
  function genderLabel(g){ return g==='female'?'hen':(g==='male'?'rooster':'unsexed bird'); }
  // ---- Flock asset valuation (admin-only) ---------------------------
  // A fixed, editable-in-code price table the owner gave for what each
  // bird is roughly "worth" right now, by age band and (once mature)
  // gender — used only to show a standing asset value for the flock on
  // hand, never fed into income/expense totals or profit figures
  // elsewhere in the app. Bands line up with the existing
  // ageGroupForWeeks bands (chick 0-8wk, grower 9-20wk, layer 21+wk),
  // just split further where the owner wants a finer price step.
  var FLOCK_VALUE_TABLE = {
    matureCock: 1000,   // male, 21+ weeks
    hen: 600,           // female (or unsexed), 21+ weeks
    growerOlder: 400,   // 12-20 weeks
    growerYounger: 300, // 9-11 weeks
    chickOlder: 200,    // 4-8 weeks
    chickMid: 150,      // 2-3 weeks
    chickYoungest: 100  // 0-1 weeks
  };
  function flockValuePerBird(b, atDate){
    var w = ageWeeks(b, atDate);
    if(w>=21) return b.gender==='male' ? FLOCK_VALUE_TABLE.matureCock : FLOCK_VALUE_TABLE.hen;
    if(w>=9) return w>=12 ? FLOCK_VALUE_TABLE.growerOlder : FLOCK_VALUE_TABLE.growerYounger;
    if(w>=4) return FLOCK_VALUE_TABLE.chickOlder;
    if(w>=2) return FLOCK_VALUE_TABLE.chickMid;
    return FLOCK_VALUE_TABLE.chickYoungest;
  }
  function flockAssetValueTotal(atDate){
    atDate = atDate || new Date();
    return state.flock.reduce(function(sum,b){ return sum + currentCount(b)*flockValuePerBird(b,atDate); }, 0);
  }
  // ---- Egg-to-cash asset value (admin-only) -------------------------
  // A per-egg cash value used only to answer "what are the eggs I
  // currently have on hand actually worth?" — a real running stock
  // figure (everything ever laid, minus everything ever sold, eaten,
  // broken, or given for brooding — same subtraction eggsOverviewPanel's
  // "Eggs available" stat tile already does), not a per-period total.
  // Deliberately never added into income (that would double-count real
  // egg sales, which are already logged as Income → Egg Sales) and never
  // affects the Overview profit figure. Falls automatically whenever a
  // loss of any kind is logged, since totalEggsLost() already includes
  // every eggLosses reason (sold/breakage/consumed/brooding/other).
  var EGG_UNIT_VALUE_KSH = 15;
  function eggsAvailableCount(){ return Math.max(0, totalEggsLaid() - totalEggsLost()); }
  function eggAssetValueTotal(){ return eggsAvailableCount() * EGG_UNIT_VALUE_KSH; }
  // Celebrates the first time a calendar month turns profitable (real
  // income minus real expenses — separate from the egg-asset coverage
  // figure above) while eggs are actually being collected that month, so
  // it reads as "the eggs are paying off this month" rather than firing
  // for an unrelated one-off sale. In-memory only (celebratedProfitMonths
  // resets on reload) — this is a nice-to-have moment, not a record, so
  // there's no need to persist it or show it more than once per session.
  var celebratedProfitMonths = {};
  function checkMonthlyEggProfitCelebration(){
    if(!canSeeFinance()) return;
    var r = getRange('month');
    var monthKey = r.startISO.slice(0,7);
    if(celebratedProfitMonths[monthKey]) return;
    var eggsThisMonth = sumEggs(r.startISO, r.endISO);
    if(eggsThisMonth<=0) return;
    var profit = sumMoney(state.incomes, r.startISO, r.endISO) - sumMoney(state.expenses, r.startISO, r.endISO);
    if(profit>0){
      celebratedProfitMonths[monthKey] = true;
      celebrate({ title:'Profit this month!', subtitle:r.label+' — '+eggsThisMonth.toLocaleString()+' eggs collected, '+fmtMoney(profit)+' ahead so far.' });
    }
  }
  function removalReasonLabel(r){ return {sold:'Sold', died:'Died', predator:'Taken by predators', consumed:'Consumed at home', culled:'Culled', other:'Other'}[r] || 'Other'; }
  function lossesByReason(){
    var map = {};
    state.flock.forEach(function(b){
      (b.removals||[]).forEach(function(r){
        if(r.reason==='resexed') return;
        var key = r.reason || 'other';
        map[key] = (map[key]||0) + r.count;
      });
    });
    return Object.entries(map).sort(function(a,b){return b[1]-a[1];}).map(function(e){ return [removalReasonLabel(e[0]), e[1]]; });
  }
  function eggLossReasonLabel(r){ return {sold:'Sold', breakage:'Breakage', consumed:'Consumed at home', brooding:'Given for brooding', other:'Other'}[r] || 'Other'; }
  function eggLossesByReason(){
    var map = {};
    (state.eggLosses||[]).forEach(function(x){ map[x.reason]=(map[x.reason]||0)+x.count; });
    return Object.entries(map).sort(function(a,b){return b[1]-a[1];}).map(function(e){ return [eggLossReasonLabel(e[0]), e[1]]; });
  }
  function totalEggsLost(){ return (state.eggLosses||[]).reduce(function(a,x){return a+x.count;},0); }
  // A broody hen setting on eggs — 21 days is the standard incubation
  // period for chicken eggs (the same figure any keeper would use), so the
  // hatch date is calculated automatically from the date brooding starts.
  var EGG_INCUBATION_DAYS = 21;
  function broodingHatchDateISO(b){ return addDaysISO(b.dateStarted, EGG_INCUBATION_DAYS); }
  function broodingDaysToHatch(b){ return daysBetween(new Date(), parseISO(broodingHatchDateISO(b))); }
  function totalEggsLaid(){ return state.eggs.reduce(function(a,x){return a+x.total;},0); }
  function countBars(entries){
    if(!entries.length) return '<div class="empty">Nothing recorded yet.</div>';
    var max = entries[0][1] || 1;
    return entries.map(function(e){
      return '<div class="bar-row"><div class="bar-label">'+esc(e[0])+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.max(4,(e[1]/max)*100)+'%"></div></div><div class="bar-amt num">'+e[1]+'</div></div>';
    }).join('');
  }
  function buildInventory(){
    var groups = {chick:{female:0,male:0,unsexed:0},grower:{female:0,male:0,unsexed:0},layer:{female:0,male:0,unsexed:0}};
    state.flock.forEach(function(b){
      var c = currentCount(b); if(c<=0) return;
      var g = ageGroupForWeeks(ageWeeks(b));
      groups[g][b.gender] = (groups[g][b.gender]||0) + c;
    });
    return groups;
  }
  function birdsAsOf(iso){
    var total=0;
    state.flock.forEach(function(b){
      if(b.dateAdded>iso) return;
      var c=b.count;
      (b.removals||[]).forEach(function(r){ if(r.date<=iso) c-=r.count; });
      total += Math.max(0,c);
    });
    return total;
  }
  function netChange(startISO,endISO){
    var added=0, removed=0;
    state.flock.forEach(function(b){
      if(!b.resex && b.dateAdded>=startISO && b.dateAdded<=endISO) added += b.count;
      (b.removals||[]).forEach(function(r){ if(r.reason!=='resexed' && r.date>=startISO && r.date<=endISO) removed += r.count; });
    });
    return {added:added, removed:removed, net:added-removed};
  }
  function layRatePct(startISO,endISO){
    var eggs = sumEggs(startISO,endISO);
    var days = daysBetween(parseISO(startISO),parseISO(endISO)) + 1;
    var layers = buildInventory().layer.female;
    if(!layers || !days) return null;
    return (eggs/(layers*days))*100;
  }

  /* ============================= VIZ ============================= */
  function sparklineSVG(values){
    var w=280,h=64,pad=4;
    if(!values.length) return '<div class="empty">No data yet.</div>';
    var max=Math.max.apply(null,values.concat([1]));
    var min=Math.min.apply(null,values.concat([0]));
    var range=(max-min)||1;
    var stepX=(w-pad*2)/Math.max(1,values.length-1);
    var pts=values.map(function(v,i){
      var x=pad+i*stepX;
      var y=pad+(h-pad*2)*(1-((v-min)/range));
      return [x,y];
    });
    var path='M'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' L');
    var last=pts[pts.length-1];
    var areaPath=path+' L'+last[0].toFixed(1)+','+(h-pad)+' L'+pts[0][0].toFixed(1)+','+(h-pad)+' Z';
    return '<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'+
      '<path d="'+areaPath+'" fill="var(--accent-tint)" stroke="none"></path>'+
      '<path d="'+path+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>'+
      '<circle cx="'+last[0]+'" cy="'+last[1]+'" r="3" fill="var(--accent)"></circle>'+
      '</svg>';
  }
  function categoryBars(entries){
    if(!entries.length) return '<div class="empty">No records for this period.</div>';
    var max = entries[0][1] || 1;
    return entries.map(function(e){
      var cat=e[0], amt=e[1];
      return '<div class="bar-row"><div class="bar-label">'+esc(cat)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.max(4,(amt/max)*100)+'%"></div></div><div class="bar-amt num">'+fmtMoney(amt)+'</div></div>';
    }).join('');
  }
  function statTile(label,value,sub){
    return '<div class="stat-tile"><div class="stat-label">'+label+'</div><div class="stat-value num">'+value+'</div>'+(sub||'')+'</div>';
  }
  function deltaBadge(cur,prev,invert){
    if(prev===0 && cur===0) return '<span class="stat-delta flat">No change</span>';
    if(prev===0) return '<span class="stat-delta '+(invert?'down':'up')+'">▲ New</span>';
    var pct = ((cur-prev)/Math.abs(prev))*100;
    var dir = pct>0.5?'up':(pct<-0.5?'down':'flat');
    var cls = dir==='flat' ? 'flat' : (invert ? (dir==='up'?'down':'up') : dir);
    var arrow = dir==='up'?'▲':(dir==='down'?'▼':'•');
    return '<span class="stat-delta '+cls+'">'+arrow+' '+Math.abs(pct).toFixed(0)+'% vs prior</span>';
  }

  /* ============================= ACTIVITY ============================= */
  function buildActivity(){
    var items=[];
    state.eggs.forEach(function(e){ items.push({date:e.date,type:'egg',text:'Logged '+e.total+' eggs'}); });
    (state.eggLosses||[]).forEach(function(x){
      var verb = x.reason==='sold' ? 'Sold' : 'Lost';
      items.push({date:x.date,type:'egg',text:verb+' '+x.count+' egg'+(x.count>1?'s':'')+(x.reason==='sold'?'':' — '+eggLossReasonLabel(x.reason))});
    });
    (state.broodings||[]).forEach(function(b){
      items.push({date:b.dateStarted,type:'egg',text:'Started brooding '+b.eggsGiven+' egg'+(b.eggsGiven>1?'s':'')});
      if(b.status==='hatched') items.push({date:b.resolvedDate||b.dateStarted,type:'flock',text:'Brooding hatched — '+b.chicksAdded+' chick'+(b.chicksAdded===1?'':'s')+' added'});
    });
    state.expenses.forEach(function(e){ items.push({date:e.date,type:'expense',text:'Spent '+fmtMoney(e.amount)+' on '+e.category}); });
    state.incomes.forEach(function(e){ items.push({date:e.date,type:'income',text:'Earned '+fmtMoney(e.amount)+' from '+e.category}); });
    (state.feedLogs||[]).forEach(function(f){ items.push({date:f.date,type:'expense',text:'Fed '+(f.quantityKg||0).toFixed(1)+' kg of '+f.feedType}); });
    (state.healthRecords||[]).forEach(function(h){ items.push({date:h.date,type:'flock',text:healthTypeLabel(h.type)+' — '+h.title}); });
    state.flock.forEach(function(b){
      if(!b.resex) items.push({date:b.dateAdded,type:'flock',text:'Added '+b.count+' '+genderLabel(b.gender)+(b.count>1?'s':'')});
      (b.removals||[]).forEach(function(r){
        if(r.reason==='resexed') return;
        var verb = r.reason==='sold'?'Sold':(r.reason==='died'?'Lost':(r.reason==='predator'?'Lost to a predator':(r.reason==='consumed'?'Used':(r.reason==='culled'?'Culled':'Removed'))));
        items.push({date:r.date,type:'flock',text:verb+' '+r.count+' bird'+(r.count>1?'s':'')});
      });
    });
    items.sort(function(a,b){ return a.date<b.date?1:(a.date>b.date?-1:0); });
    return items;
  }
  function activityRowHTML(it){
    var dot = it.type==='income' ? 'var(--good)' : (it.type==='expense' ? 'var(--bad)' : 'var(--accent)');
    return '<div class="activity-item"><span class="activity-dot" style="background:'+dot+'"></span><div><div class="activity-text">'+esc(it.text)+'</div><div class="activity-date">'+fmtDate(parseISO(it.date))+'</div></div></div>';
  }

  /* ============================= SHELL ============================= */
  function syncChipHTML(){
    var map = {
      saved:['saved','Saved just now'],
      saving:['saving','Saving…'],
      local:['saving','Saved on this device only'],
      connecting:['saving','Connecting…'],
      synced:['saved','Synced across devices'],
      offline:['saving','Offline — will sync when back online'],
      readonly:['','Read-only view'],
      err:['err','Could not reach the cloud — saved on this device'],
      idle:['saved','Up to date']
    };
    var m = map[syncStatus] || map.idle;
    return '<span class="sync-dot '+m[0]+'"></span><span>'+m[1]+'</span>';
  }
  function setSyncStatus(st){
    syncStatus = st;
    var chip = document.getElementById('sync-chip');
    if(chip) chip.innerHTML = syncChipHTML();
    renderBanner();
  }
  // Grouping related sections together — Farm Records, Money, Team — is
  // what makes the phone nav workable: 16 flat top-level sections became a
  // cramped, horizontally-scrolling icon row on small screens (see the
  // mobile-tabbar CSS below). Desktop still lists every section (just with
  // group headers now, for the same organizing benefit), but the phone
  // tab bar only ever shows these 7 top-level entries — tapping a group
  // reveals its own children as a second row of tabs (#mobile-subtabs)
  // rather than needing all 16 icons in one row. A leaf with no `children`
  // behaves exactly like a section always has.
  var NAV_GROUPS = [
    {key:'overview', label:'Overview', icon:PICS.overview},
    {key:'flock-group', label:'Farm Records', icon:PICS.flockNav, children:[
      {key:'flock', label:'Flock', icon:PICS.flockNav},
      {key:'eggs', label:'Eggs', icon:PICS.eggs},
      {key:'feed', label:'Feed', icon:PICS.feed},
      {key:'health', label:'Health', icon:PICS.health}
    ]},
    {key:'money-group', label:'Money', icon:PICS.finance, children:[
      {key:'income', label:'Income', icon:PICS.income},
      {key:'expenses', label:'Expenses', icon:PICS.expenses},
      {key:'finance', label:'Finance', icon:PICS.finance},
      {key:'reports', label:'Reports', icon:PICS.reports}
    ]},
    {key:'customers', label:'Customers', icon:PICS.customers},
    {key:'team-group', label:'Team', icon:PICS.team, children:[
      {key:'team', label:'Manage Team', icon:PICS.team},
      {key:'directory', label:'Team Directory', icon:PICS.directory},
      {key:'messages', label:'Messages', icon:PICS.messages},
      {key:'signoffs', label:'Pending signatures', icon:PICS.signoffs}
    ]},
    {key:'about', label:'About', icon:PICS.about},
    {key:'settings', label:'Settings', icon:PICS.settings}
  ];
  function renderNav(){
    var rail = document.getElementById('rail');
    var tabbar = document.getElementById('mobile-tabbar');
    var subtabsEl = document.getElementById('mobile-subtabs');
    var unread = unreadMessageCount();
    var pendingCount = pendingSignoffsForAdmin.filter(function(d){ return d.status==='pending'; }).length;
    function badgeFor(key){ return key==='messages' ? unread : (key==='signoffs' ? pendingCount : 0); }
    function badgeHtml(n){ return n>0 ? '<span class="nav-badge">'+(n>99?'99+':n)+'</span>' : ''; }

    // Filtered through sectionAllowed() so the nav never shows a link to a
    // page this account's role can't actually open — matches whatever
    // render() would bounce them out of anyway if they got there some
    // other way (a stale link, browser back button, etc.). A group with
    // every child filtered out disappears entirely, same as a leaf would.
    var groups = NAV_GROUPS.map(function(g){
      if(!g.children) return sectionAllowed(g.key) ? g : null;
      var kids = g.children.filter(function(c){ return sectionAllowed(c.key); });
      return kids.length ? Object.assign({}, g, {children:kids}) : null;
    }).filter(Boolean);

    // ---- Desktop sidebar: every section still listed, just organized
    // under its group's header now instead of one long flat list. ----
    function navT(item){ return t('title.'+item.key, item.label); }
    var desktopHtml = groups.map(function(g){
      if(!g.children){
        return '<li><button class="nav-item '+(ui.section===g.key?'active':'')+'" data-nav-section="'+g.key+'" data-action="nav:'+g.key+'"><span class="nav-ico">'+g.icon+'</span>'+badgeHtml(badgeFor(g.key))+'<span class="nav-label">'+esc(navT(g))+'</span></button></li>';
      }
      var kidsHtml = g.children.map(function(c){
        return '<li><button class="nav-item nav-item-sub '+(ui.section===c.key?'active':'')+'" data-nav-section="'+c.key+'" data-action="nav:'+c.key+'"><span class="nav-ico">'+c.icon+'</span>'+badgeHtml(badgeFor(c.key))+'<span class="nav-label">'+esc(navT(c))+'</span></button></li>';
      }).join('');
      return '<li class="nav-group"><div class="nav-group-label">'+esc(navT(g))+'</div><ul class="nav-sublist">'+kidsHtml+'</ul></li>';
    }).join('');

    rail.innerHTML =
      '<div class="brand">'+
        '<img class="brand-mark" src="icons/logo-mark.png" alt="Kenokip Farm">'+
        '<div class="brand-text"><h1>Kenokip Farm</h1><span>Poultry Keeping</span></div>'+
      '</div>'+
      '<ul class="nav-list">'+desktopHtml+'</ul>'+
      '<div class="rail-foot">'+accountFootHTML()+'<div class="sync-chip" id="sync-chip">'+syncChipHTML()+'</div></div>';

    // ---- Phone bottom tab bar: only the 7 top-level entries. Tapping a
    // group jumps to whichever of its sections was open last (or its
    // first one), and reveals that group's own sections as a second,
    // horizontally-scrollable row of tabs right under the search bar. ----
    var activeGroup = null;
    groups.forEach(function(g){
      if(g.children && g.children.some(function(c){ return c.key===ui.section; })) activeGroup = g;
    });
    if(tabbar){
      tabbar.innerHTML = groups.map(function(g){
        var isActive = g.children ? (activeGroup===g) : (ui.section===g.key);
        var n = g.children ? g.children.reduce(function(a,c){ return a+badgeFor(c.key); },0) : badgeFor(g.key);
        var action = g.children ? 'nav-group:'+g.key : 'nav:'+g.key;
        return '<button class="mobile-tab '+(isActive?'active':'')+'" data-action="'+action+'">'+
          '<span class="mobile-tab-ico">'+g.icon+badgeHtml(n)+'</span><span class="mobile-tab-label">'+esc(navT(g))+'</span></button>';
      }).join('');
    }
    if(subtabsEl){
      if(activeGroup && activeGroup.children.length>1){
        subtabsEl.hidden = false;
        subtabsEl.innerHTML = activeGroup.children.map(function(c){
          return '<button class="mobile-subtab '+(ui.section===c.key?'active':'')+'" data-action="nav:'+c.key+'">'+esc(navT(c))+badgeHtml(badgeFor(c.key))+'</button>';
        }).join('');
      } else {
        subtabsEl.hidden = true;
        subtabsEl.innerHTML = '';
      }
    }
  }
  function accountFootHTML(){
    if(currentUser){
      return '<div style="margin-bottom:2px"><span class="role-pill '+(isAdminLevel()?'admin':'')+'">'+esc(roleLabel(currentUser))+'</span>'+
        '<div class="hint" style="margin:6px 0 8px; word-break:break-all">'+esc(currentUser.email||'')+'</div>'+
        '<button class="btn ghost sm" data-action="signout" style="width:100%">'+t('btn.signout','Sign out')+'</button></div>';
    }
    if(guestMode){
      return '<div style="margin-bottom:2px"><span class="role-pill">Guest</span>'+
        '<button class="btn ghost sm" data-action="guest-signin" style="width:100%;margin-top:8px">'+t('btn.signin','Sign in')+'</button></div>';
    }
    return '';
  }
  // Guest mode's "Sign in" link lives in the desktop sidebar footer
  // (accountFootHTML above), which is hidden on phones (see the
  // .mobile-tabbar CSS) — without this, a guest on a phone would have no
  // way back to signing in at all. Settings is reachable by anyone
  // (including a guest, see sectionAllowed), so that's where this shows
  // up instead; accountCardHTML() already covers a signed-in account.
  function guestAccountCardHTML(){
    if(!guestMode) return '';
    return '<div class="card"><div class="card-title"><h3>Your account</h3><span class="role-pill">Guest</span></div>'+
      '<p class="hint">Viewing a read-only copy of the ledger — nothing you change here is saved.</p>'+
      '<button class="btn primary" data-action="guest-signin">'+t('btn.signin','Sign in')+'</button></div>';
  }
  function topbarHTML(title,sub,right,icon){
    return '<div style="display:flex; align-items:center; gap:14px">'+(icon?'<div class="pic-badge lg">'+icon+'</div>':'')+'<div><h2>'+title+'</h2><div class="topbar-sub">'+(sub||'')+'</div></div></div><div class="topbar-actions">'+(right||'')+'</div>';
  }
  function periodSegment(sectionKey){
    var cur = ui.periods[sectionKey];
    return '<div class="segmented">'+['day','week','month','year'].map(function(p){
      return '<button class="'+(cur===p?'active':'')+'" data-action="period:'+sectionKey+':'+p+'">'+(p[0].toUpperCase()+p.slice(1))+'</button>';
    }).join('')+'</div>';
  }
  function currencySelectHTML(){
    return '<select class="field" style="width:auto" data-change="display-currency">'+currencyOptions()+'</select>';
  }
  function addBtn(action,label){
    return '<button class="btn primary" data-action="'+action+'" '+(readOnly?'disabled':'')+'>'+ICONS.plus+label+'</button>';
  }
  function readOnlyBadge(){ return readOnly ? '<span class="pill">Read-only</span>' : ''; }

  function bannerHTML(){
    if(readOnly) return '<div class="banner bad">You\'re viewing a read-only copy of this ledger — changes here won\'t be saved.</div>';
    if(offlineSessionActive) return '<div class="banner">You\'re offline — signed in using your last saved session. Some things (Messages, Team Directory, Finance) may show stale data until you\'re back online.</div>';
    if(localMode && !cloudMode) return '<div class="banner">This device couldn\'t reach the shared farm database — changes are saved only here until it reconnects.</div>';
    return '';
  }
  function renderBanner(){
    var el = document.getElementById('global-banner');
    if(el) el.innerHTML = bannerHTML();
  }
  // Navigating anywhere in the app (the sidebar/tab bar, a search result, a
  // "View" link on a message, Kem AI's answers — anything that changes
  // ui.section) should go through here rather than setting ui.section
  // directly, so the back arrow always has an accurate trail to walk back
  // through. Going to the section you're already on is a no-op (nothing to
  // push, nothing changed).
  function goToSection(key){
    if(key === ui.section){ render(); return; }
    navHistory.push(ui.section);
    if(navHistory.length > NAV_HISTORY_MAX) navHistory.shift();
    ui.section = key;
    saveUIPref();
    render();
  }
  // One step back through wherever you've actually been this session — not
  // a browser-style forward/back pair, just "take me to the previous
  // page", which is all a farm ledger like this really needs. Overview is
  // the fallback once history runs out, same as "Back to homepage".
  function goBack(){
    var prev = navHistory.length ? navHistory.pop() : 'overview';
    ui.section = prev;
    saveUIPref();
    render();
  }
  // Long-pressing the app's home-screen icon offers "Log eggs" / "Log
  // feed" shortcuts (see manifest.webmanifest) — each just opens straight
  // to that page with the Add form already up, for the common case of
  // "I just want to log today's eggs, nothing else". Runs once, right
  // after a real (non-guest, writable) sign-in — the URL param is stripped
  // immediately either way so a later reload never replays it.
  function applyLaunchShortcut(){
    var sc;
    try{
      var params = new URLSearchParams(location.search);
      sc = params.get('shortcut');
      if(sc) history.replaceState(null, '', location.pathname);
    }catch(e){ return; }
    if(!sc || !currentUser || readOnly) return;
    if(sc==='log-eggs' && sectionAllowed('eggs')){ goToSection('eggs'); openModal(eggFormHtml()); }
    else if(sc==='log-feed' && sectionAllowed('feed')){ goToSection('feed'); openModal(feedFormHtml()); }
  }
  // The back arrow + "Back to homepage" button shown at the top of every
  // page except Overview itself (no point offering either while already
  // home). Every section's own topbar() still renders its usual title/
  // actions right below this — this is deliberately its own row, so it
  // never has to be added to each of the ~20 topbar() functions by hand.
  function navControlsHTML(){
    if(ui.section==='overview') return '';
    var canBack = navHistory.length>0;
    return '<div class="page-nav-controls">'+
      '<button class="icon-btn" data-action="nav-back" title="Back"'+(canBack?'':' disabled')+'>'+ICONS.chevronLeft+'</button>'+
      '<button class="btn ghost sm" data-action="nav-home"><span class="inline-ico" style="width:15px; height:15px">'+ICONS.home+'</span>'+t('btn.backhome','Back to homepage')+'</button>'+
    '</div>';
  }
  function render(){
    updateAuthGate();
    if(!sectionAllowed(ui.section)){ ui.section = 'overview'; saveUIPref(); }
    renderNav();
    var sec = SECTIONS[ui.section] || SECTIONS.overview;
    // Drives the bold per-section color theme (see the CSS comment near
    // .main[data-section] near the top of this file) — every page's
    // buttons/charts/pills just re-read var(--accent) etc, so this one
    // attribute is all it takes to recolor the whole page.
    var mainEl = document.getElementById('main-content');
    if(mainEl) mainEl.setAttribute('data-section', ui.section);
    var sceneEl = document.getElementById('page-scene');
    if(sceneEl) sceneEl.innerHTML = pageSceneHTML(ui.section);
    document.getElementById('topbar').innerHTML = navControlsHTML() + sec.topbar();
    document.getElementById('panel').innerHTML = '<div id="global-banner">'+bannerHTML()+'</div>' + sec.panel();
  }
  // One small themed illustration set per page, drawn from the app's own
  // existing PICS icon art (see var PICS above) rather than new assets —
  // scattered at a few fixed positions and faded via .page-scene-icon so
  // each section feels visually like "its own place" (money for
  // Expenses/Income/Finance, hens/cocks/chicks for Flock, and so on)
  // without competing with the actual page content on top of it.
  function sceneIcon(svg, style){ return '<div class="page-scene-icon" style="'+style+'">'+svg+'</div>'; }
  function pageSceneHTML(key){
    var defs = {
      overview:[[PICS.hen,'top:8%;left:4%;width:130px;transform:rotate(-6deg)'],[PICS.eggs,'bottom:10%;right:6%;width:120px;transform:rotate(5deg)'],[PICS.cock,'top:12%;right:10%;width:100px;transform:scaleX(-1)']],
      flock:[[PICS.hen,'top:8%;left:4%;width:150px;transform:rotate(-6deg)'],[PICS.cock,'bottom:8%;right:5%;width:170px;transform:rotate(5deg) scaleX(-1)'],[PICS.chick,'top:52%;right:8%;width:90px'],[PICS.chick,'bottom:22%;left:16%;width:70px;transform:scaleX(-1)']],
      eggs:[[PICS.eggs,'top:9%;right:7%;width:150px'],[PICS.eggs,'bottom:10%;left:5%;width:120px;transform:scaleX(-1)'],[PICS.hen,'top:55%;right:4%;width:100px;transform:rotate(4deg)']],
      feed:[[PICS.feed,'top:10%;left:5%;width:150px'],[PICS.feed,'bottom:9%;right:6%;width:120px;transform:scaleX(-1)']],
      health:[[PICS.health,'top:9%;right:5%;width:150px'],[PICS.health,'bottom:10%;left:6%;width:110px;transform:scaleX(-1)']],
      expenses:[[PICS.expenses,'top:9%;left:5%;width:140px'],[PICS.expenses,'bottom:9%;right:6%;width:120px;transform:scaleX(-1)']],
      income:[[PICS.income,'top:9%;right:5%;width:140px'],[PICS.income,'bottom:9%;left:6%;width:120px;transform:scaleX(-1)']],
      customers:[[PICS.customers,'top:9%;left:5%;width:140px'],[PICS.customers,'bottom:9%;right:6%;width:110px;transform:scaleX(-1)']],
      finance:[[PICS.finance,'top:9%;right:5%;width:150px'],[PICS.finance,'bottom:9%;left:6%;width:120px;transform:scaleX(-1)']],
      reports:[[PICS.reports,'top:9%;left:5%;width:140px'],[PICS.reports,'bottom:9%;right:6%;width:110px;transform:scaleX(-1)']],
      about:[[PICS.about,'top:9%;right:5%;width:140px']],
      settings:[[PICS.settings,'top:9%;left:5%;width:130px']],
      team:[[PICS.team,'top:9%;right:5%;width:140px']],
      directory:[[PICS.directory,'top:9%;left:5%;width:140px']],
      messages:[[PICS.messages,'top:9%;right:5%;width:140px']],
      signoffs:[[PICS.signoffs,'top:9%;left:5%;width:140px']],
      trash:[[PICS.trash,'top:9%;right:5%;width:130px']]
    };
    var list = defs[key];
    if(!list) return '';
    return list.map(function(d){ return sceneIcon(d[0], d[1]); }).join('');
  }

  /* ============================= OVERVIEW ============================= */
  function totalMoney(list){ return list.reduce(function(a,x){return a+x.amount;},0); }
  function earliestRecordISO(){
    var dates = [];
    state.eggs.forEach(function(x){ dates.push(x.date); });
    state.expenses.forEach(function(x){ dates.push(x.date); });
    state.incomes.forEach(function(x){ dates.push(x.date); });
    state.flock.forEach(function(b){ dates.push(b.dateAdded); });
    if(!dates.length) return null;
    return dates.reduce(function(a,b){ return a<b?a:b; });
  }
  // Time-of-day greeting for the Overview page — reads the viewer's own
  // device clock (not the server's), so it's always "morning" for whoever's
  // actually looking at it, wherever they are.
  function greetingTimeInfo(d){
    d = d || new Date();
    var h = d.getHours();
    if(h>=5 && h<12) return {greeting:t('greet.morning','Good morning'), note:t('greet.morning.note','Time to check on the flock and collect the morning eggs.')};
    if(h>=12 && h<17) return {greeting:t('greet.afternoon','Good afternoon'), note:t('greet.afternoon.note','Hope the day is going well out on the farm.')};
    if(h>=17 && h<21) return {greeting:t('greet.evening','Good evening'), note:t('greet.evening.note','Wrapping up for the day — how did the flock do?')};
    return {greeting:t('greet.night','Good night'), note:t('greet.night.note','Burning the midnight oil? The chickens turned in hours ago.')};
  }
  // ---- Kiswahili toggle: a first pass, not a full translation of every
  // string in the app. It covers what's visible everywhere at a glance —
  // navigation, page headers, the Overview greeting — plus the common
  // buttons/labels repeated across every Add/Edit form (via
  // swTranslateFragment, applied only inside modals). Deeper screens (Kem
  // AI's answers, individual field labels, table headers) stay in English
  // for now; extending coverage later just means adding more keys here.
  var I18N = { sw: {
    'title.overview':'Muhtasari', 'sub.overview':'Jinsi shamba linavyoendelea',
    'title.flock':'Kundi la Kuku', 'sub.flock':'Idadi ya sasa kwa umri na jinsia',
    'title.eggs':'Mayai', 'sub.eggs':'Uzalishaji wa kila siku, ukihesabiwa',
    'title.feed':'Chakula', 'sub.feed':'Matumizi, gharama, na chakula kwa yai',
    'title.health':'Afya', 'sub.health':'Chanjo, matibabu na vikumbusho',
    'title.reports':'Ripoti', 'sub.reports':'Chapisha au pakua muhtasari wa kipindi',
    'title.expenses':'Matumizi', 'sub.expenses':'Unachotumia, kwa aina',
    'title.income':'Mapato', 'sub.income':'Fedha inayoingia, kwa aina',
    'title.customers':'Wateja', 'sub.customers':'Wanunuzi, wa mara kwa mara na wa mara moja',
    'title.finance':'Fedha', 'sub.finance':'Akaunti yako ya benki ya kuku pekee',
    'title.about':'Kuhusu', 'sub.about':'Hadithi ya nyuma ya Kenokip Farm',
    'title.settings':'Mipangilio', 'sub.settings':'Sarafu, jamii na hifadhi',
    'title.team':'Timu', 'sub.team':'Akaunti, idhini na kumbukumbu za ufikiaji',
    'title.messages':'Ujumbe', 'sub.messages':'Ongea na timu',
    'title.signoffs':'Sahihi Zinazosubiri', 'sub.signoffs':'Nyaraka zinazosubiri sahihi yako',
    'title.directory':'Orodha ya Timu', 'sub.directory':'Kila mtu shambani, mahali pamoja',
    'title.flock-group':'Kumbukumbu za Shamba', 'title.money-group':'Fedha', 'title.team-group':'Timu',
    'greet.morning':'Habari za asubuhi', 'greet.morning.note':'Ni wakati wa kuangalia kundi na kukusanya mayai ya asubuhi.',
    'greet.afternoon':'Habari za mchana', 'greet.afternoon.note':'Tunatumaini siku inaendelea vizuri shambani.',
    'greet.evening':'Habari za jioni', 'greet.evening.note':'Kumaliza siku — kundi limefanyaje?',
    'greet.night':'Habari za usiku', 'greet.night.note':'Bado uko macho? Kuku walilala saa nyingi zilizopita.',
    'btn.signin':'Ingia', 'btn.signout':'Toka', 'btn.backhome':'Rudi Mwanzoni'
  } };
  // Only exact, whole-text-node matches get swapped (a note that happens
  // to contain one of these words as part of a longer sentence is left
  // alone) — see the comment above openModal for why this only runs on
  // modal content, not on data-bearing panels/tables.
  var COMMON_SW = {
    'Cancel':'Ghairi', 'Close':'Funga', 'Save':'Hifadhi', 'Save changes':'Hifadhi Mabadiliko',
    'Delete':'Futa', 'Edit':'Hariri', 'Are you sure?':'Una uhakika?', 'Date':'Tarehe', 'Note':'Maelezo',
    'Optional':'Si lazima', 'Sign in':'Ingia', 'Sign out':'Toka', 'Add entry':'Ongeza Kipengele',
    'Add batch':'Ongeza Kundi', 'Log eggs':'Andika Mayai', 'Log feed':'Andika Chakula',
    'Add expense':'Ongeza Matumizi', 'Add income':'Ongeza Mapato', 'Add record':'Ongeza Rekodi',
    'Add customer':'Ongeza Mteja', 'Restock':'Ongeza Akiba'
  };
  function t(key, fallback){
    var lang = (state.settings && state.settings.language) || 'en';
    return (lang==='sw' && I18N.sw.hasOwnProperty(key)) ? I18N.sw[key] : fallback;
  }
  function swTranslateFragment(html){
    if(((state.settings && state.settings.language)||'en')!=='sw') return html;
    return html.replace(/>([^<]+)</g, function(whole, text){
      var trimmed = text.trim();
      if(!trimmed || !COMMON_SW.hasOwnProperty(trimmed)) return whole;
      return '>'+text.replace(trimmed, COMMON_SW[trimmed])+'<';
    });
  }
  function overviewGreetingHTML(){
    var info = greetingTimeInfo();
    var who = currentUser ? (currentUser.name || roleLabel(currentUser)) : (guestMode ? 'Guest' : '');
    var todayLong = fmtDate(new Date(), {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    return '<div class="card" id="overview-greeting" style="background:linear-gradient(135deg, var(--accent-tint), transparent)">'+
      '<div class="card-title"><h3>'+info.greeting+(who?', '+esc(who):'')+'</h3><span class="hint">'+todayLong+'</span></div>'+
      '<p class="hint" style="margin:0">'+info.note+'</p>'+
    '</div>';
  }
  // Converts the two "what's actually on the farm right now" figures —
  // eggs on hand and the current flock — into money, right on the
  // Overview page, exactly as asked: admin-only (stricter than the
  // profit figure above, which Financial Staff can also see), using the
  // real current stock in both cases (eggsAvailableCount = laid minus
  // every kind of loss; flockAssetValueTotal = every bird currently on
  // the farm, from FLOCK_VALUE_TABLE). Each links straight to that
  // section's own page, where the same figure gets its own dedicated
  // card (eggAssetCardHTML on Eggs, flockAssetValueCardHTML on Flock).
  function farmAssetsOverviewCardHTML(){
    if(!isAdmin()) return '';
    var eggsOnHand = eggsAvailableCount();
    var eggValue = eggAssetValueTotal();
    var flockValue = flockAssetValueTotal();
    var birdsNow = state.flock.reduce(function(a,b){ return a+currentCount(b); }, 0);
    var total = eggValue + flockValue;
    return '<div class="card"><div class="card-title"><h3>Farm assets</h3><span class="hint">Only visible to you</span></div>'+
      '<div class="stat-value num" style="font-size:32px">'+fmtMoney(total)+'</div>'+
      '<div class="hint" style="margin-top:4px; margin-bottom:14px">Eggs on hand + the flock on the farm right now, converted to money. Never counted as income or folded into the profit figure above.</div>'+
      '<div class="grid two">'+
        '<button type="button" class="stat-tile" style="text-align:left; cursor:pointer; border:none; width:100%" data-action="nav:eggs">'+
          '<div class="stat-label">Egg assets</div><div class="stat-value num" style="font-size:20px">'+fmtMoney(eggValue)+'</div>'+
          '<div class="hint">'+eggsOnHand.toLocaleString()+' eggs on hand →</div>'+
        '</button>'+
        '<button type="button" class="stat-tile" style="text-align:left; cursor:pointer; border:none; width:100%" data-action="nav:flock">'+
          '<div class="stat-label">Flock assets</div><div class="stat-value num" style="font-size:20px">'+fmtMoney(flockValue)+'</div>'+
          '<div class="hint">'+birdsNow.toLocaleString()+' birds on the farm →</div>'+
        '</button>'+
      '</div>'+
    '</div>';
  }
  function overviewPanel(){
    var isEmpty = state.flock.length===0 && state.eggs.length===0 && state.expenses.length===0 && state.incomes.length===0;
    var period = ui.periods.overview;
    var r = getRange(period);
    var incomeCur = sumMoney(state.incomes, r.startISO, r.endISO), expenseCur = sumMoney(state.expenses, r.startISO, r.endISO);
    var profitCur = incomeCur - expenseCur;
    var incomePrev = sumMoney(state.incomes, r.prevStartISO, r.prevEndISO), expensePrev = sumMoney(state.expenses, r.prevStartISO, r.prevEndISO);
    var profitPrev = incomePrev - expensePrev;
    var eggsCur = sumEggs(r.startISO, r.endISO), eggsPrev = sumEggs(r.prevStartISO, r.prevEndISO);
    var nc = netChange(r.startISO, r.endISO);
    var totalNow = birdsAsOf(todayISO());
    var lr = layRatePct(r.startISO, r.endISO);

    var allTimeIncome = totalMoney(state.incomes), allTimeExpense = totalMoney(state.expenses);
    var allTimeProfit = allTimeIncome - allTimeExpense;
    var allTimeColor = allTimeProfit<0 ? 'var(--bad)' : (allTimeProfit>0 ? 'var(--good)' : 'var(--ink)');
    var allTimeLabel = allTimeProfit<0 ? 'All-time deficit' : (allTimeProfit>0 ? 'All-time profit' : 'All-time — breaking even');
    var since = earliestRecordISO();
    // Profit/deficit is a finance-sensitive figure — only the administrator
    // and Financial Staff see it here, same tier as the Finance tab itself.
    // Everyone else can still add and view individual expenses/income (that
    // hasn't changed), just not this combined bottom-line number.
    var showProfit = canSeeFinance();

    var last14 = [];
    for(var i=13;i>=0;i--){ var iso = toISO(addDays(new Date(),-i)); last14.push(sumEggs(iso,iso)); }
    var expBreak = breakdownByCategory(state.expenses, r.startISO, r.endISO).slice(0,5);
    var activity = buildActivity().slice(0,7);

    var overdueHealth = overdueHealthCount();

    return overviewGreetingHTML() +
    (isEmpty ? '<div class="banner">Welcome to your ledger — start in <strong>&nbsp;Flock&nbsp;</strong> to add your birds, then log eggs and expenses as you go.</div>' : '') +
    (overdueHealth>0 ? '<div class="banner bad" style="cursor:pointer" data-action="nav:health">'+overdueHealth+' health reminder'+(overdueHealth===1?'':'s')+' overdue — tap to view in Health.</div>' : '') +
    (showProfit ? '<div class="card">'+
      '<div class="card-title"><h3>'+allTimeLabel+'</h3><span class="hint">'+(since?'Since '+fmtDate(parseISO(since)):'This never changes with the period filter below')+'</span></div>'+
      '<div class="stat-value num" style="font-size:32px; color:'+allTimeColor+'">'+fmtMoney(Math.abs(allTimeProfit))+'</div>'+
      '<div class="hint" style="margin-top:6px">Total income '+fmtMoney(allTimeIncome)+' · Total expenses '+fmtMoney(allTimeExpense)+'</div>'+
    '</div>' : '')+
    farmAssetsOverviewCardHTML()+
    '<div class="grid stats">'+
      (showProfit ? statTile('Profit · '+r.label, fmtMoney(profitCur), deltaBadge(profitCur,profitPrev)) : '')+
      statTile('Expenses · '+r.label, fmtMoney(expenseCur), deltaBadge(expenseCur,expensePrev,true))+
      statTile('Eggs produced', eggsCur.toLocaleString()+' eggs', deltaBadge(eggsCur,eggsPrev))+
      statTile('Flock change', (nc.net>=0?'+':'')+nc.net+' birds', '<span class="hint">+'+nc.added+' added · −'+nc.removed+' lost/sold</span>')+
      statTile('Total birds now', totalNow.toLocaleString(), lr!=null ? '<span class="hint">Lay rate ≈ '+lr.toFixed(0)+'%</span>' : '<span class="hint">&nbsp;</span>')+
    '</div>'+
    '<div class="grid two">'+
      '<div class="card"><div class="card-title"><h3>Eggs, last 14 days</h3><span class="hint">'+last14.reduce(function(a,b){return a+b;},0)+' total</span></div>'+sparklineSVG(last14)+'</div>'+
      '<div class="card"><div class="card-title"><h3>Spending by category · '+r.label+'</h3><span class="hint num">'+fmtMoney(expenseCur)+'</span></div>'+categoryBars(expBreak)+'</div>'+
    '</div>'+
    kemAiInsightsCardHTML()+
    '<div class="card"><div class="card-title"><h3>Recent activity</h3></div>'+
      (activity.length ? activity.map(activityRowHTML).join('') : '<div class="empty">'+ICONS.empty+'<div>Nothing recorded yet.</div></div>')+
    '</div>';
  }

  // Proactive, plain-language observations worked out fresh from whatever's
  // already in the app — no separate AI service, just the same numbers
  // Kem AI already answers questions about, checked for a notable change
  // before anyone asks. Each one only appears when it's actually worth
  // mentioning (a double-digit swing, or genuinely close to running out),
  // so this stays a short, useful list rather than noise every time.
  function costPerEggInRange(s,e){ var eggsN=sumEggs(s,e); return eggsN>0 ? totalFeedCost(s,e)/eggsN : null; }
  function kemAiProactiveInsights(){
    var out = [];
    var rw = getRange('week');
    var eggsCur = sumEggs(rw.startISO, rw.endISO), eggsPrev = sumEggs(rw.prevStartISO, rw.prevEndISO);
    if(eggsPrev>0){
      var pct = Math.round(((eggsCur-eggsPrev)/eggsPrev)*100);
      if(Math.abs(pct)>=10) out.push({icon:'🥚', text:'Egg production is '+(pct<0?'down':'up')+' '+Math.abs(pct)+'% vs last week — '+eggsCur.toLocaleString()+' vs '+eggsPrev.toLocaleString()+' eggs.'});
    }
    var rm = getRange('month');
    var cpeCur = costPerEggInRange(rm.startISO,rm.endISO), cpePrev = costPerEggInRange(rm.prevStartISO,rm.prevEndISO);
    if(cpeCur!=null && cpePrev!=null && cpePrev>0){
      var pct2 = Math.round(((cpeCur-cpePrev)/cpePrev)*100);
      if(Math.abs(pct2)>=10) out.push({icon:'🌾', text:'Feed cost per egg is '+(pct2>0?'up':'down')+' '+Math.abs(pct2)+'% vs last month — '+fmtMoney(cpeCur)+' vs '+fmtMoney(cpePrev)+' per egg.'});
    }
    var fs = feedStockInfo();
    if(fs.started && fs.daysLeft!=null && fs.daysLeft<=7) out.push({icon:'📦', text:"You're due to restock feed in about "+Math.max(0,Math.round(fs.daysLeft))+' day'+(Math.round(fs.daysLeft)===1?'':'s')+', based on your recent usage rate.'});
    else if(fs.started && fs.low) out.push({icon:'📦', text:'Feed is already at or below your low-stock warning level — tap Restock on the Feed page once you buy more.'});
    if(canSeeFinance()){
      var lossBatches = batchProfitability().filter(function(bp){ return bp.net<0 && bp.hasData; });
      if(lossBatches.length) out.push({icon:'📉', text:lossBatches.length+' flock batch'+(lossBatches.length===1?'':'es')+' '+(lossBatches.length===1?'is':'are')+' currently costing more than '+(lossBatches.length===1?'it has':'they have')+' earned back — see Flock → Batch profitability.'});
    }
    return out;
  }
  function kemAiInsightsCardHTML(){
    var insights = kemAiProactiveInsights();
    if(!insights.length) return '';
    return '<div class="card"><div class="card-title"><h3>'+ICONS.kemai+'Kem AI noticed</h3></div>'+
      insights.map(function(i){ return '<div style="display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-top:1px solid var(--border, #eee)"><span style="font-size:18px; line-height:1.4">'+i.icon+'</span><span>'+esc(i.text)+'</span></div>'; }).join('')
        .replace('border-top:1px solid var(--border, #eee)','border-top:none') // first row gets no divider — cheap way without a separate template branch
    +'</div>';
  }

  /* ============================= ABOUT ============================= */
  function farmGalleryHtml(){
    var items = FARM_PHOTOS.gallery.map(function(p){
      return '<figure><img src="'+p.src+'" alt="'+esc(p.caption)+'" loading="lazy" class="clickable" data-action="view-photo:'+p.key+'" title="View photo"><figcaption>'+esc(p.caption)+'</figcaption></figure>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Farm gallery</h3><span class="hint">Real photos from Kenokip Farm</span></div>'+
      '<div class="farm-gallery">'+items+'</div>'+
    '</div>';
  }
  function aboutPanel(){
    var a = state.settings.about || {};
    return '<div class="card">'+
        '<div class="card-title"><h3>About Enock (Kenokip)</h3></div>'+
        '<p style="white-space:pre-wrap; margin:0">'+esc(a.bio||'')+'</p>'+
      '</div>'+
      '<div class="grid two">'+
        '<div class="card"><div class="card-title"><h3>Mission</h3></div><p style="white-space:pre-wrap; margin:0">'+esc(a.mission||'')+'</p></div>'+
        '<div class="card"><div class="card-title"><h3>Vision</h3></div><p style="white-space:pre-wrap; margin:0">'+esc(a.vision||'')+'</p></div>'+
      '</div>'+
      farmGalleryHtml()+
      '<p class="hint" style="text-align:center; margin-top:24px">&copy; '+new Date().getFullYear()+' Kenokip Farm. All rights reserved.</p>';
  }
  function aboutFormHtml(){
    var a = state.settings.about || {};
    return '<div class="modal-head"><h3>Edit About</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="about">'+
      '<div class="field-row"><label>Bio / story</label><textarea class="field" name="bio" rows="6">'+esc(a.bio||'')+'</textarea></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Mission</label><textarea class="field" name="mission" rows="3">'+esc(a.mission||'')+'</textarea></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Vision</label><textarea class="field" name="vision" rows="3">'+esc(a.vision||'')+'</textarea></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }

  /* ============================= FLOCK ============================= */
  function genderTile(label,count,icon,action){
    return '<div class="stat-tile'+(icon?' with-pic':'')+'"'+
      (action?' data-action="'+action+'" style="padding:14px 16px; cursor:pointer" title="Open '+esc(label)+' page"':' style="padding:14px 16px"')+'>'+
      (icon?'<div class="pic-badge sm clickable">'+icon+'</div>':'')+
      '<div class="stat-tile-text"><div class="stat-label">'+label+'</div><div class="stat-value num" style="font-size:22px">'+count+'</div></div>'+
    '</div>';
  }
  // Turns the filtered "Batches" table shared by the Flock Overview and
  // its dedicated Chicks/Growers/Hens/Cocks pages into rows — pulled out
  // of flockOverviewPanel so both places render identical, always-in-sync
  // rows instead of two copies of the same markup drifting apart.
  function flockBatchRowsHtml(batches){
    return batches.map(function(b){
      var c = currentCount(b), wk = ageWeeks(b);
      var histCount = (b.removals||[]).filter(function(r){return r.reason!=='resexed';}).length + (b.removals||[]).filter(function(r){return r.reason==='resexed';}).length;
      return '<tr>'+
        '<td>'+fmtDate(parseISO(b.dateAdded))+'</td>'+
        '<td><span class="pill '+b.gender+'">'+genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+'</span></td>'+
        '<td>'+wk+'w · '+ageGroupLabel(ageGroupForWeeks(wk))+'</td>'+
        '<td class="num">'+b.count+'</td>'+
        '<td class="num">'+c+'</td>'+
        '<td>'+esc(b.source||'—')+'</td>'+
        '<td><div class="row-actions">'+
          '<button class="icon-btn" data-action="edit-flock:'+b.id+'" title="Edit batch details" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
          (b.gender==='unsexed' && c>0 ? '<button class="btn sm" data-action="open-resex:'+b.id+'" title="Sex this batch" '+(readOnly?'disabled':'')+'>Sex</button>' : '')+
          (c>0 ? '<button class="icon-btn" data-action="open-remove-flock:'+b.id+'" title="Record loss or sale" '+(readOnly?'disabled':'')+'>'+ICONS.expenses+'</button>' : '')+
          (histCount>0 ? '<button class="icon-btn" data-action="open-history:'+b.id+'" title="View & undo recorded changes">'+ICONS.history+'</button>' : '')+
          '<button class="icon-btn" data-action="delete-flock:'+b.id+'" title="Delete batch" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
        '</div></td>'+
      '</tr>';
    }).join('');
  }
  // ---- Flock: "Overview + dropdown" restructuring -------------------
  // The Flock section is now split into an Overview (the original page,
  // content unchanged below) plus dedicated Chicks / Growers / Hens /
  // Cocks / Brooding Hens pages, switched with a dropdown — see
  // flockViewSwitcherHTML(). SECTIONS.flock.panel points at this
  // dispatcher; flockOverviewPanel() further down is the original body.
  var FLOCK_VIEWS = [['overview','Overview'],['chicks','Chicks'],['growers','Growers'],['hens','Hens'],['cocks','Cocks'],['brooding','Brooding Hens']];
  function sectionViewSwitcherHTML(sectionKey, views, currentLabel){
    var cur = currentView(sectionKey);
    return '<div class="card" style="padding:12px 16px; margin-bottom:14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap">'+
      '<label class="hint" style="margin:0">Viewing</label>'+
      '<select class="field" data-change="view-select:'+sectionKey+'" style="max-width:240px; width:auto">'+
        views.map(function(v){ return '<option value="'+v[0]+'" '+(cur===v[0]?'selected':'')+'>'+v[1]+'</option>'; }).join('')+
      '</select>'+
      (cur!=='overview' ? '<button type="button" class="linklike" data-action="view-select:'+sectionKey+':overview">← Back to Overview</button>' : '')+
    '</div>';
  }
  function flockViewSwitcherHTML(){ return sectionViewSwitcherHTML('flock', FLOCK_VIEWS); }
  // One dedicated page for Chicks, Growers, Hens, or Cocks — same
  // filtered-batches idea each time, just a different age-band/gender
  // predicate (matchFn) and heading art.
  function flockGroupPageHTML(label, icon, sub, matchFn, bannerKey){
    var batches = state.flock.filter(matchFn).sort(function(a,b){ return a.dateAdded<b.dateAdded?1:-1; });
    var total = batches.reduce(function(a,b){ return a+currentCount(b); }, 0);
    var batchesPage = paginate('flock-group-'+label, batches);
    var bannerImg = (bannerKey && FARM_PHOTOS.banners[bannerKey]) ? '<img class="page-photo-banner" src="'+FARM_PHOTOS.banners[bannerKey]+'" alt="'+label+'" data-action="view-photo:'+bannerKey+'Banner">' : '';
    return bannerImg+'<div class="banner">'+total.toLocaleString()+' '+label.toLowerCase()+' on the farm today.</div>'+
      '<div class="card"><div class="card-title"><div class="card-title-lead">'+(icon?'<div class="pic-badge clickable">'+icon+'</div>':'')+'<h3>'+label+'</h3></div><span class="hint">'+sub+'</span></div>'+
        '<div class="table-wrap">'+
        (batches.length ?
          '<table><thead><tr><th>Added</th><th>Gender</th><th>Age</th><th class="num">Started</th><th class="num">Now</th><th>Source</th><th></th></tr></thead><tbody>'+flockBatchRowsHtml(batchesPage.items)+'</tbody></table>'
          : '<div class="empty">'+ICONS.empty+'<div>No '+label.toLowerCase()+' recorded yet.</div></div>')+
        '</div>'+pagerHtml('flock-group-'+label, batchesPage.pageCount, batchesPage.page)+'</div>';
  }
  // Real farm photos (not the illustrated PICS set) as the heading art for
  // each dedicated Flock page — see FARM_PHOTOS.icons.
  function flockPhotoIcon(key){ return '<img src="'+FARM_PHOTOS.icons[key]+'" alt="" class="clickable" data-action="view-photo:'+key+'" title="View photo">'; }
  function eggsPhotoIcon(){ return flockPhotoIcon('eggsIcon'); }
  function flockChicksPageHTML(){ return flockGroupPageHTML('Chicks', flockPhotoIcon('chicksIcon'), '0–8 weeks', function(b){ return ageGroupForWeeks(ageWeeks(b))==='chick'; }, 'chicks'); }
  function flockGrowersPageHTML(){ return flockGroupPageHTML('Growers', flockPhotoIcon('growersIcon'), '9–20 weeks', function(b){ return ageGroupForWeeks(ageWeeks(b))==='grower'; }, 'growers'); }
  function flockHensPageHTML(){ return flockGroupPageHTML('Hens', flockPhotoIcon('hensIcon'), '21+ weeks · female', function(b){ return ageGroupForWeeks(ageWeeks(b))==='layer' && b.gender==='female'; }, 'hens'); }
  function flockCocksPageHTML(){ return flockGroupPageHTML('Cocks', flockPhotoIcon('cocksIcon'), '21+ weeks · male', function(b){ return ageGroupForWeeks(ageWeeks(b))==='layer' && b.gender==='male'; }, 'cocks'); }
  function flockPanel(){
    var view = currentView('flock');
    var body;
    if(view==='chicks') body = flockChicksPageHTML();
    else if(view==='growers') body = flockGrowersPageHTML();
    else if(view==='hens') body = flockHensPageHTML();
    else if(view==='cocks') body = flockCocksPageHTML();
    else if(view==='brooding') body = broodingPanelHTML(false);
    else body = flockOverviewPanel();
    return flockViewSwitcherHTML() + body;
  }
  function flockOverviewPanel(){
    var inv = buildInventory();
    var totalNow = birdsAsOf(todayISO());
    // Each age group gets its own illustrated badge in the card title — and
    // the Layers card's Hens/Roosters tiles additionally get the Hen/Cock
    // artwork, since that's where sexed adult birds actually live.
    // Card titles for Chicks/Growers now double as links to their own
    // dedicated page (flock-view:chicks / flock-view:growers); the mixed
    // Layers card instead makes its Hens/Roosters tiles the links, since
    // those are the two dedicated pages that apply to it.
    var groupDefs = [['chick','Chicks','0–8 weeks',flockPhotoIcon('chicksIcon'),'chicks'],['grower','Growers','9–20 weeks',flockPhotoIcon('growersIcon'),'growers'],['layer','Layers','21+ weeks',null,null]];
    var groupsHTML = groupDefs.map(function(gd){
      var key=gd[0], label=gd[1], sub=gd[2], icon=gd[3], viewKey=gd[4];
      var g = inv[key]; var subtotal = g.female+g.male+g.unsexed;
      var henIcon = key==='layer' ? flockPhotoIcon('hensIcon') : null;
      var cockIcon = key==='layer' ? flockPhotoIcon('cocksIcon') : null;
      var titleHtml = viewKey
        ? '<h3 style="cursor:pointer" data-action="view-select:flock:'+viewKey+'" title="Open the '+label+' page">'+label+'</h3>'
        : '<h3>'+label+'</h3>';
      return '<div class="card"><div class="card-title"><div class="card-title-lead">'+(icon?'<div class="pic-badge clickable">'+icon+'</div>':'')+titleHtml+'</div><div style="display:flex; align-items:center; gap:8px"><span class="hint">'+sub+' · '+subtotal+' birds</span>'+
        '<button class="icon-btn" data-action="open-add-flock:'+key+'" title="Add '+label.toLowerCase()+'" '+(readOnly?'disabled':'')+'>'+ICONS.plus+'</button></div></div>'+
        '<div class="grid" style="grid-template-columns:repeat(3,1fr)">'+
          genderTile('Hens',g.female,henIcon, key==='layer'?'view-select:flock:hens':null)+
          genderTile('Roosters',g.male,cockIcon, key==='layer'?'view-select:flock:cocks':null)+
          genderTile('Unsexed',g.unsexed)+
        '</div></div>';
    }).join('');

    var batches = state.flock.slice().sort(function(a,b){ return a.dateAdded<b.dateAdded?1:-1; });
    var batchesPage = paginate('flock-batches', batches);
    var rows = flockBatchRowsHtml(batchesPage.items);

    var lossEntries = lossesByReason();
    var totalLost = lossEntries.reduce(function(a,e){return a+e[1];},0);

    return '<div class="banner">'+totalNow.toLocaleString()+' birds on the farm today.</div>'+
      '<div class="grid two">'+groupsHTML+'</div>'+
      '<div class="card"><div class="card-title"><h3>Batches</h3><span class="hint">'+batches.length+' recorded</span></div>'+
        '<div class="table-wrap">'+
        (batches.length ?
          '<table><thead><tr><th>Added</th><th>Gender</th><th>Age</th><th class="num">Started</th><th class="num">Now</th><th>Source</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
          : '<div class="empty">'+ICONS.empty+'<div>No birds recorded yet. Use the '+'+ '+'button above — or on any Chicks / Growers / Layers card — to add your first batch.</div></div>')+
        '</div>'+pagerHtml('flock-batches', batchesPage.pageCount, batchesPage.page)+'</div>'+
      flockActivityPanelHTML()+
      batchProfitabilityCardHTML()+
      flockAssetValueCardHTML()+
      broodingPanelHTML(true)+
      '<div class="card"><div class="card-title"><h3>Flock losses, all time</h3><span class="hint">'+totalLost+' birds total — use "Record loss or sale" on a batch to add one</span></div>'+
        countBars(lossEntries)+
      '</div>';
  }
  // Every recorded loss or sale, across every batch, in one flat list right
  // on the Flock page — edit, view a receipt (if sold), or undo, without
  // having to open a batch's History first. Re-sexing splits aren't "losses"
  // in the usual sense (nothing left the farm), so they stay History-only —
  // undo them from the batch they created instead.
  function flockActivityRows(){
    var out = [];
    state.flock.forEach(function(b){
      (b.removals||[]).forEach(function(r){
        if(r.reason!=='resexed') out.push({batch:b, removal:r});
      });
    });
    out.sort(function(a,b){ return a.removal.date<b.removal.date?1:-1; });
    return out;
  }
  function flockActivityPanelHTML(){
    var activity = flockActivityRows();
    var activityPage = paginate('flock-activity', activity);
    var rows = activityPage.items.map(function(item){
      var b = item.batch, r = item.removal;
      var batchLabel = genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+' · added '+fmtDate(parseISO(b.dateAdded));
      var amountText = r.reason==='sold' ? (r.saleAmount>0 ? fmtMoney(r.saleAmount) : 'Not recorded') : '—';
      return '<tr>'+
        '<td>'+fmtDate(parseISO(r.date))+'</td>'+
        '<td>'+esc(batchLabel)+'</td>'+
        '<td><span class="pill">'+removalReasonLabel(r.reason)+'</span></td>'+
        '<td class="num">'+r.count+'</td>'+
        '<td>'+(r.reason==='sold' ? esc(r.buyer||'Walk-in customer') : '—')+'</td>'+
        '<td class="num">'+amountText+'</td>'+
        '<td>'+esc(r.note||'—')+'</td>'+
        '<td><div class="row-actions">'+
          (r.reason==='sold' ? '<button class="icon-btn" data-action="view-flock-receipt:'+b.id+':'+r.id+'" title="View receipt">'+ICONS.receipt+'</button>' : '')+
          '<button class="icon-btn" data-action="edit-removal:'+b.id+':'+r.id+'" title="Edit this entry" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
          '<button class="icon-btn" data-action="delete-removal:'+b.id+':'+r.id+'" title="Undo this entry" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
        '</div></td>'+
      '</tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Losses &amp; sales</h3><span class="hint">'+activity.length+' recorded</span></div>'+
      '<p class="hint" style="margin-top:-4px; margin-bottom:12px">Every loss or sale across every batch — use "Record loss or sale" on a batch above to add one.</p>'+
      '<div class="table-wrap">'+
      (activity.length ?
        '<table><thead><tr><th>Date</th><th>Batch</th><th>Reason</th><th class="num">Count</th><th>Buyer</th><th class="num">Amount</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>Nothing recorded yet.</div></div>')+
      '</div>'+pagerHtml('flock-activity', activityPage.pageCount, activityPage.page)+'</div>';
  }
  function broodingPanelHTML(linkToPage){
    var list = (state.broodings||[]).slice().sort(function(a,b){ return a.dateStarted<b.dateStarted?1:-1; });
    var broodPage = paginate('brooding', list);
    var rows = broodPage.items.map(function(b){
      var hatchDate = broodingHatchDateISO(b);
      var statusHtml;
      if(b.status==='hatched'){
        statusHtml = '<span class="pill" style="background:var(--good-tint); color:var(--good)">Hatched</span> '+
          b.chicksAdded+' chick'+(b.chicksAdded===1?'':'s')+' added'+(b.eggsNotHatched?' · '+b.eggsNotHatched+' didn\'t hatch':'');
      } else {
        var daysTo = broodingDaysToHatch(b);
        statusHtml = daysTo>0
          ? '<span class="pill pending">Brooding</span> hatches in '+daysTo+' day'+(daysTo===1?'':'s')
          : '<span class="pill pending">Ready to check</span> expected '+fmtDate(parseISO(hatchDate));
      }
      return '<tr><td>'+fmtDate(parseISO(b.dateStarted))+'</td>'+
        '<td class="num">'+b.eggsGiven+'</td>'+
        '<td>'+fmtDate(parseISO(hatchDate))+'</td>'+
        '<td>'+statusHtml+'</td>'+
        '<td>'+esc(b.note||'—')+'</td>'+
        '<td><div class="row-actions">'+
          (b.status!=='hatched' ? '<button class="btn sm primary" data-action="open-resolve-brooding:'+b.id+'" '+(readOnly?'disabled':'')+'>Record hatch</button>' : '')+
          '<button class="icon-btn" data-action="open-edit-brooding:'+b.id+'" title="Edit" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
          '<button class="icon-btn" data-action="delete-brooding:'+b.id+'" title="Delete" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
        '</div></td></tr>';
    }).join('');
    var broodingTitleHtml = linkToPage
      ? '<h3 style="cursor:pointer" data-action="view-select:flock:brooding" title="Open the Brooding Hens page">Brooding</h3>'
      : '<h3>Brooding</h3>';
    return '<div class="card"><div class="card-title"><div class="card-title-lead"><div class="pic-badge">'+PICS.brooding+'</div>'+broodingTitleHtml+'</div><div style="display:flex; align-items:center; gap:8px"><span class="hint">'+list.length+' recorded</span>'+
        '<button class="icon-btn" data-action="open-add-brooding" title="Start brooding" '+(readOnly?'disabled':'')+'>'+ICONS.plus+'</button></div></div>'+
      '<p class="hint" style="margin-top:-6px">When a hen starts sitting on eggs, log how many she\'s given here — the app works out the expected hatch date on its own (21 days). Once it\'s time, come back and record how many didn\'t hatch; the rest are added to the flock as new chicks automatically.</p>'+
      '<div class="table-wrap">'+
      (rows ? '<table><thead><tr><th>Started</th><th class="num">Eggs given</th><th>Expected hatch</th><th>Status</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No brooding hens recorded yet.</div></div>')+
      '</div>'+pagerHtml('brooding', broodPage.pageCount, broodPage.page)+'</div>';
  }

  function historyModalHtml(batchId){
    var b = state.flock.find(function(x){return x.id===batchId;});
    if(!b) return '<div class="modal-head"><h3>History</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div><p class="hint">Batch not found.</p>';
    var list = (b.removals||[]).slice().sort(function(a,b2){ return a.date<b2.date?1:-1; });
    var rows = list.map(function(r){
      var label = r.reason==='resexed' ? 'Sexed as new batch' : removalReasonLabel(r.reason);
      return '<div class="kv-row"><div><div>'+label+' · '+r.count+' bird'+(r.count>1?'s':'')+'</div><div class="hint">'+fmtDate(parseISO(r.date))+(r.note?' · '+esc(r.note):'')+'</div></div>'+
        '<div style="display:flex; gap:4px">'+
        (r.reason==='sold' ? '<button class="icon-btn" data-action="view-flock-receipt:'+b.id+':'+r.id+'" title="View receipt">'+ICONS.receipt+'</button>' : '')+
        (r.reason!=='resexed' ? '<button class="icon-btn" data-action="edit-removal:'+b.id+':'+r.id+'" title="Edit this entry" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>' : '')+
        '<button class="icon-btn" data-action="delete-removal:'+b.id+':'+r.id+'" title="Undo this entry" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
        '</div></div>';
    }).join('');
    return '<div class="modal-head"><h3>History</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Changes recorded against this batch ('+genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+', added '+fmtDate(parseISO(b.dateAdded))+'). Undoing restores the birds to this batch — or, for a sexed entry, removes the batch it created.</p>'+
    (rows || '<div class="empty">Nothing recorded yet.</div>')+
    '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Close</button></div>';
  }

  function flockFormHtml(id, presetGroup){
    var b = id ? state.flock.find(function(x){return x.id===id;}) : null;
    var ti = todayISO();
    var presetAge = {chick:0, grower:10, layer:22}[presetGroup] || 0;
    return '<div class="modal-head"><h3>'+(b?'Edit batch':(presetGroup?'Add '+ageGroupLabel(presetGroup).toLowerCase():'Add birds'))+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="flock">'+
      '<input type="hidden" name="id" value="'+(b?b.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Gender</label><select class="field" name="gender">'+
          '<option value="female" '+(b&&b.gender==='female'?'selected':'')+'>Female (hens)</option>'+
          '<option value="male" '+(b&&b.gender==='male'?'selected':'')+'>Male (roosters)</option>'+
          '<option value="unsexed" '+(!b||b.gender==='unsexed'?'selected':'')+'>Unsexed / too young</option>'+
        '</select></div>'+
        '<div class="field-row"><label>Number of birds</label><input class="field" type="number" min="1" name="count" value="'+(b?b.count:'')+'" required></div>'+
        '<div class="field-row"><label>Date acquired</label><input class="field" type="date" name="dateAdded" value="'+(b?b.dateAdded:ti)+'" max="'+ti+'" required></div>'+
        '<div class="field-row"><label>Age when acquired (weeks)</label><input class="field" type="number" min="0" name="ageWeeks" value="'+(b?weeksBetween(parseISO(b.birthDate),parseISO(b.dateAdded)):presetAge)+'"></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Source / notes</label><input class="field" type="text" name="source" value="'+(b?esc(b.source||''):'')+'" placeholder="e.g. Hatched on farm, bought from market…"></div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Cost to acquire (optional)</label><input class="field" type="number" min="0" step="0.01" name="acquisitionCost" value="'+(b&&b.acquisitionCost?(b.acquisitionCost*rateOf(state.settings.displayCurrency)).toFixed(2):'')+'" placeholder="0"></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="acqCurrency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      '<p class="hint" style="margin-top:8px">If entered, it\'s added to Expenses automatically (under "Chicks / Restocking") and used for this batch\'s profitability. The app keeps ageing this batch automatically from the date acquired and its age then.</p>'+
      (!b ? '<label class="field-row" style="margin-top:12px; flex-direction:row; align-items:center; gap:8px">'+
        '<input type="checkbox" name="autoVaccinate" value="1" '+(presetAge===0?'checked':'')+' style="width:auto">'+
        '<span>Add the standard vaccination schedule as Health reminders for this batch (best for day-old chicks)</span>'+
      '</label>' : '')+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(b?'Save changes':'Add batch')+'</button></div>'+
    '</form>';
  }
  function removalFormHtml(batchId, removalId){
    var b = batchId ? state.flock.find(function(x){return x.id===batchId;}) : null;
    var editRem = (b && removalId) ? (b.removals||[]).find(function(r){return r.id===removalId;}) : null;
    var eligible = state.flock.filter(function(x){ return currentCount(x)>0; });
    // Editing an existing entry gives its own birds back to the pool first,
    // so you can raise the count as well as lower it (up to what's really
    // there once this entry's own birds are set aside).
    var max = b ? currentCount(b) + (editRem ? editRem.count : 0) : (eligible[0] ? currentCount(eligible[0]) : 0);
    if(!b && !eligible.length){
      return '<div class="modal-head"><h3>Record loss or sale</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
        '<p class="hint">No birds recorded yet — add a batch first, from the Flock page.</p>'+
        '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Close</button></div>';
    }
    var batchFieldHtml = b
      ? '<input type="hidden" name="batchId" value="'+batchId+'">'
      : '<div class="field-row"><label>Which batch</label><select class="field" name="batchId" data-change="removal-batch">'+
          eligible.map(function(x){
            return '<option value="'+x.id+'">'+genderLabel(x.gender)+(x.gender!=='unsexed'?'s':'')+' · '+ageGroupLabel(ageGroupForWeeks(ageWeeks(x)))+' · added '+fmtDate(parseISO(x.dateAdded))+' · '+currentCount(x)+' available</option>';
          }).join('')+
        '</select></div>';
    var introHtml = b
      ? '<p class="hint">From this batch: '+max+' bird'+(max===1?'':'s')+' currently ('+genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+').</p>'
      : '<p class="hint" id="removal-batch-hint">'+max+' bird'+(max===1?'':'s')+' available in this batch.</p>';
    var reasons = [['sold','Sold'],['died','Died'],['predator','Taken by predators'],['consumed','Consumed at home'],['culled','Culled'],['other','Other']];
    var reasonOptionsHtml = reasons.map(function(pair){
      return '<option value="'+pair[0]+'" '+(editRem?(editRem.reason===pair[0]?'selected':''):(pair[0]==='sold'?'selected':''))+'>'+pair[1]+'</option>';
    }).join('');
    var isSold = editRem ? editRem.reason==='sold' : true;
    var curCost = editRem && editRem.saleAmount ? (editRem.saleAmount * rateOf(state.settings.displayCurrency)).toFixed(2) : '';
    return '<div class="modal-head"><h3>'+(editRem?'Edit loss or sale':'Record loss or sale')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="removal">'+
      '<input type="hidden" name="id" value="'+(editRem?editRem.id:'')+'">'+
      batchFieldHtml+
      introHtml+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Reason</label><select class="field" name="reason" data-change="removal-reason">'+reasonOptionsHtml+'</select></div>'+
        '<div class="field-row"><label>Number of birds</label><input class="field" type="number" min="1" max="'+max+'" name="count" value="'+(editRem?editRem.count:1)+'" id="removal-count-input" required></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(editRem?editRem.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div id="sale-fields" class="field-grid" style="margin-top:12px; display:'+(isSold?'grid':'none')+'">'+
        '<div class="field-row"><label>Sold to (optional)</label><input class="field" type="text" name="buyer" list="customer-names-list" value="'+(editRem?esc(editRem.buyer||''):'')+'" placeholder="Buyer\'s name — new or existing"></div>'+
        '<div class="field-row"><label>Sale amount (optional)</label><input class="field" type="number" min="0" step="0.01" name="saleAmount" value="'+curCost+'" placeholder="0"></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="saleCurrency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      customerNamesDatalist()+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(editRem?esc(editRem.note||''):'')+'" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(editRem?'Save changes':'Save')+'</button></div>'+
    '</form>';
  }
  function resexFormHtml(batchId){
    var b = state.flock.find(function(x){return x.id===batchId;});
    var max = currentCount(b);
    return '<div class="modal-head"><h3>Sex this batch</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="resex">'+
      '<input type="hidden" name="batchId" value="'+batchId+'">'+
      '<p class="hint">Move birds out of "unsexed" once you can tell hens from roosters. '+max+' bird'+(max===1?'':'s')+' available.</p>'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Now identified as</label><select class="field" name="targetGender"><option value="female">Female (hens)</option><option value="male">Male (roosters)</option></select></div>'+
        '<div class="field-row"><label>Number of birds</label><input class="field" type="number" min="1" max="'+max+'" name="count" value="'+max+'" required></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+todayISO()+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function broodingFormHtml(){
    var ti = todayISO();
    return '<div class="modal-head"><h3>Start brooding</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">These eggs come off your egg count right away (recorded as "Given for brooding"), the same as before — the app just now tracks them through to hatching.</p>'+
    '<form data-form="brooding">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Eggs given to the hen</label><input class="field" type="number" min="1" name="eggsGiven" required autofocus></div>'+
        '<div class="field-row"><label>Date started</label><input class="field" type="date" name="dateStarted" value="'+ti+'" max="'+ti+'" required data-change="brooding-date"></div>'+
      '</div>'+
      '<p class="hint" style="margin-top:8px">Expected to hatch around <strong id="brooding-hatch-preview">'+fmtDate(parseISO(addDaysISO(ti, EGG_INCUBATION_DAYS)))+'</strong> (21 days).</p>'+
      '<div class="field-row" style="margin-top:12px"><label>Note (optional)</label><input class="field" type="text" name="note" maxlength="80" placeholder="e.g. Brown hen in coop A"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Start brooding</button></div>'+
    '</form>';
  }
  function resolveBroodingFormHtml(id){
    var b = (state.broodings||[]).find(function(x){return x.id===id;});
    if(!b) return '<div class="modal-head"><h3>Record hatch</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div><p class="hint">That brooding record is no longer available.</p>';
    return '<div class="modal-head"><h3>Record hatch</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">'+b.eggsGiven+' egg'+(b.eggsGiven===1?'':'s')+' given on '+fmtDate(parseISO(b.dateStarted))+'. Enter how many did <strong>not</strong> hatch — the rest are added to the flock automatically as new unsexed chicks.</p>'+
    '<form data-form="resolve-brooding">'+
      '<input type="hidden" name="id" value="'+b.id+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Eggs that did not hatch</label><input class="field" type="number" min="0" max="'+b.eggsGiven+'" name="eggsNotHatched" value="0" required autofocus></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+todayISO()+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  // Lets a brooding record be corrected at any time — before or after it's
  // hatched — not just recorded once and locked in. Before hatching, the
  // egg count/date/note are wide open (and stay in sync with the linked
  // "given for brooding" egg-loss entry, so the Eggs page never drifts out
  // of step with this one). After hatching, the eggs-given total is fixed
  // relative to what's already happened — you correct chicks-hatched /
  // didn't-hatch instead, and the flock batch those chicks became gets
  // resized to match (handled in handleForm's 'edit-brooding' case).
  function editBroodingFormHtml(id){
    var b = (state.broodings||[]).find(function(x){return x.id===id;});
    if(!b) return '<div class="modal-head"><h3>Edit brooding</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div><p class="hint">That brooding record is no longer available.</p>';
    var isHatched = b.status==='hatched';
    var ti = todayISO();
    var hatchFieldsHtml = isHatched
      ? '<div class="field-grid" style="margin-top:12px">'+
          '<div class="field-row"><label>Chicks that hatched</label><input class="field" type="number" min="0" name="chicksAdded" value="'+b.chicksAdded+'" required></div>'+
          '<div class="field-row"><label>Eggs that did not hatch</label><input class="field" type="number" min="0" name="eggsNotHatched" value="'+b.eggsNotHatched+'" required></div>'+
        '</div>'+
        '<p class="hint" style="margin-top:6px">These two must add up to the eggs given. If chicks-hatched goes up or down, the flock batch it added is resized to match.</p>'
      : '';
    return '<div class="modal-head"><h3>Edit brooding</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="edit-brooding">'+
      '<input type="hidden" name="id" value="'+b.id+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Eggs given to the hen</label><input class="field" type="number" min="1" name="eggsGiven" value="'+b.eggsGiven+'" required autofocus></div>'+
        '<div class="field-row"><label>Date started</label><input class="field" type="date" name="dateStarted" value="'+b.dateStarted+'" max="'+ti+'" required></div>'+
      '</div>'+
      hatchFieldsHtml+
      '<div class="field-row" style="margin-top:12px"><label>Note (optional)</label><input class="field" type="text" name="note" maxlength="80" value="'+esc(b.note||'')+'" placeholder="e.g. Brown hen in coop A"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save changes</button></div>'+
    '</form>';
  }

  /* ============================= EGGS ============================= */
  // ---- Eggs: "Overview + dropdown" restructuring --------------------
  // Same pattern as Flock above: Overview keeps the trend/aggregate cards
  // that used to be the whole page; the daily log and the sold/used/lost
  // table each moved to their own dedicated page, reachable from the
  // dropdown or the two links at the bottom of Overview.
  var EGGS_VIEWS = [['overview','Overview'],['log','Egg Log'],['losses','Sold, Used & Lost']];
  function eggsOverviewPanel(){
    var entries = state.eggs.slice();
    var last30 = [];
    for(var i=29;i>=0;i--){ var iso=toISO(addDays(new Date(),-i)); last30.push(sumEggs(iso,iso)); }

    var weeks = [];
    for(var w=0; w<8; w++){ var rw=getRange('week', addDays(new Date(),-7*w)); weeks.push({label:rw.label, total:sumEggs(rw.startISO,rw.endISO)}); }

    var months = [];
    for(var m=0; m<6; m++){ var refM=new Date(); refM.setDate(1); refM.setMonth(refM.getMonth()-m); var rm=getRange('month', refM); months.push({label:rm.label, total:sumEggs(rm.startISO,rm.endISO), days:daysBetween(rm.start,rm.end)+1}); }

    var laidAll = totalEggsLaid(), lostAll = totalEggsLost(), availableAll = laidAll - lostAll;

    var eggsOnHandNow = Math.max(0, availableAll);
    var crateCount = Math.floor(eggsOnHandNow/30), crateLeftover = eggsOnHandNow%30;
    var crateChips = '', crateChipsToShow = Math.min(crateCount, 24);
    for(var ci=0; ci<crateChipsToShow; ci++){ crateChips += '<span class="egg-crate-chip full">Crate '+(ci+1)+'</span>'; }
    if(crateCount>crateChipsToShow) crateChips += '<span class="egg-crate-chip full">+'+(crateCount-crateChipsToShow)+' more</span>';
    if(crateLeftover) crateChips += '<span class="egg-crate-chip partial">'+crateLeftover+' loose egg'+(crateLeftover===1?'':'s')+'</span>';
    var cratesHtml = '<div class="card"><div class="card-title"><h3>Egg crates</h3><span class="hint">30 eggs per crate</span></div>'+
      '<div class="stat-value num" style="font-size:28px">'+crateCount.toLocaleString()+(crateCount===1?' crate':' crates')+(crateLeftover? ' + '+crateLeftover+' loose':'')+'</div>'+
      '<div class="egg-crates-visual">'+(crateChips || '<span class="hint">Not enough eggs on hand yet for a full crate.</span>')+'</div>'+
    '</div>';
    return '<div class="grid stats">'+
      statTile('Eggs laid, all time', laidAll.toLocaleString()+' eggs', '')+
      statTile('Eggs lost, all time', lostAll.toLocaleString()+' eggs', '')+
      statTile('Eggs available', Math.max(0,availableAll).toLocaleString()+' eggs', '<span class="hint">Laid minus lost</span>')+
    '</div>'+
    cratesHtml+
    '<div class="grid two">'+
      '<div class="card"><div class="card-title"><h3>Last 30 days</h3><span class="hint">'+last30.reduce(function(a,b){return a+b;},0)+' eggs</span></div>'+sparklineSVG(last30)+'</div>'+
      '<div class="card"><div class="card-title"><h3>By week</h3></div>'+
        weeks.map(function(x){ return '<div class="kv-row"><span>'+x.label+'</span><span class="num">'+x.total.toLocaleString()+' eggs · avg '+(x.total/7).toFixed(1)+'/day</span></div>'; }).join('')+
      '</div>'+
    '</div>'+
    '<div class="card"><div class="card-title"><h3>By month</h3></div>'+
      '<div class="grid stats">'+months.map(function(x){ return statTile(x.label, x.total.toLocaleString()+' eggs', '<span class="hint">avg '+(x.total/x.days).toFixed(1)+'/day</span>'); }).join('')+'</div>'+
    '</div>'+
    (function(){
      var sizeTotals = eggSizeTotals(entries);
      if(!sizeTotals) return '';
      return '<div class="card"><div class="card-title"><h3>By size, all time</h3></div>'+
        '<div class="grid" style="grid-template-columns:repeat(4,1fr)">'+
          EGG_SIZES.map(function(p){ return genderTile(p[1], sizeTotals[p[0]].toLocaleString()); }).join('')+
        '</div></div>';
    })()+
    eggAssetCardHTML()+
    '<div class="card" style="text-align:center; display:flex; gap:10px; justify-content:center; flex-wrap:wrap">'+
      '<button type="button" class="btn" data-action="view-select:eggs:log">Open the Egg Log →</button>'+
      '<button type="button" class="btn" data-action="view-select:eggs:losses">Sold, Used &amp; Lost →</button>'+
    '</div>';
  }
  // Eggs' own dedicated "assets" section, right on its Overview page (in
  // addition to the summary on the app's main Overview and the vs.-spend
  // comparison on Expenses) — admin-only, using the real on-hand count
  // (see eggsAvailableCount above), which already falls on its own the
  // moment a loss of any kind — sold, eaten, broken, given for brooding —
  // gets logged, since it's laid-minus-lost rather than a period total.
  function eggAssetCardHTML(){
    if(!isAdmin()) return '';
    var eggsOnHand = eggsAvailableCount();
    var value = eggAssetValueTotal();
    return '<div class="card"><div class="card-title"><h3>Egg assets</h3><span class="hint">Only visible to you</span></div>'+
      '<div class="stat-value num" style="font-size:28px">'+fmtMoney(value)+'</div>'+
      '<div class="hint" style="margin-top:6px">'+eggsOnHand.toLocaleString()+' eggs on hand right now (laid minus sold, eaten, broken, or given for brooding) × KSh '+EGG_UNIT_VALUE_KSH+' each. Never counted as income.</div>'+
    '</div>';
  }
  function eggsLogPageHTML(){
    var entries = state.eggs.slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var eggsPage = paginate('eggs-log', entries);
    var rows = eggsPage.items.map(function(e){
      var sizeStr = eggSizeSummary(e.sizes);
      return '<tr><td>'+fmtDate(parseISO(e.date))+'</td><td class="num">'+e.total+'</td><td>'+(sizeStr||'<span class="hint">—</span>')+'</td><td>'+esc(e.note||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="edit-egg:'+e.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-egg:'+e.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Daily log</h3><span class="hint">'+entries.length+' entries</span></div>'+
      '<div class="table-wrap">'+
      (entries.length ? '<table><thead><tr><th>Date</th><th class="num">Eggs</th><th>By size</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No eggs logged yet.</div></div>')+
      '</div>'+pagerHtml('eggs-log', eggsPage.pageCount, eggsPage.page)+'</div>';
  }
  function eggsLossesPageHTML(){
    var lossEntries = state.eggLosses.slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var lossPage = paginate('egg-losses', lossEntries);
    var lossRows = lossPage.items.map(function(x){
      return '<tr><td>'+fmtDate(parseISO(x.date))+'</td><td class="num">'+x.count+'</td><td>'+eggLossReasonLabel(x.reason)+'</td><td>'+esc(x.note||'—')+'</td>'+
      '<td><div class="row-actions">'+
        (x.reason==='sold' ? '<button class="icon-btn" data-action="view-egg-receipt:'+x.id+'" title="View receipt">'+ICONS.receipt+'</button>' : '')+
        '<button class="icon-btn" data-action="edit-eggloss:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-eggloss:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Sold, used &amp; lost eggs</h3><div style="display:flex; align-items:center; gap:8px"><span class="hint">Sales, breakage, home use, or given for brooding</span>'+
      '<button class="icon-btn" data-action="open-add-eggloss" title="Log a sale or a loss" '+(readOnly?'disabled':'')+'>'+ICONS.plus+'</button></div></div>'+
      countBars(eggLossesByReason())+
      '<div class="table-wrap" style="margin-top:14px">'+
      (lossEntries.length ? '<table><thead><tr><th>Date</th><th class="num">Eggs</th><th>Reason</th><th>Note</th><th></th></tr></thead><tbody>'+lossRows+'</tbody></table>'
        : '<div class="empty">No egg losses recorded yet.</div>')+
      '</div>'+pagerHtml('egg-losses', lossPage.pageCount, lossPage.page)+'</div>';
  }
  function eggsPanel(){
    var view = currentView('eggs');
    var body;
    if(view==='log') body = eggsLogPageHTML();
    else if(view==='losses') body = eggsLossesPageHTML();
    else body = eggsOverviewPanel();
    var eggsBanner = '<img class="page-photo-banner" src="'+FARM_PHOTOS.banners.eggs+'" alt="Eggs" data-action="view-photo:eggsBanner">';
    return eggsBanner + sectionViewSwitcherHTML('eggs', EGGS_VIEWS) + body;
  }
  var EGG_SIZES = [['small','Small'],['medium','Medium'],['large','Large'],['jumbo','Jumbo']];
  // Short "S12 · M40 · L20 · J3" style summary for a table row — only the
  // sizes actually used show up, so an ungraded farm's rows just say '—'.
  function eggSizeSummary(sizes){
    if(!sizes) return '';
    return EGG_SIZES.filter(function(p){ return (sizes[p[0]]||0)>0; })
      .map(function(p){ return p[1].charAt(0)+(sizes[p[0]]); }).join(' · ');
  }
  function eggSizeTotals(entries){
    var totals = {small:0,medium:0,large:0,jumbo:0}, any=false;
    entries.forEach(function(e){ if(e.sizes){ any=true; EGG_SIZES.forEach(function(p){ totals[p[0]] += e.sizes[p[0]]||0; }); } });
    return any ? totals : null;
  }
  function eggFormHtml(id){
    var e = id ? state.eggs.find(function(x){return x.id===id;}) : null;
    var hasSizes = !!(e && e.sizes && EGG_SIZES.some(function(p){ return (e.sizes[p[0]]||0)>0; }));
    return '<div class="modal-head"><h3>'+(e?'Edit entry':'Log eggs')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="egg">'+
      '<input type="hidden" name="id" value="'+(e?e.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(e?e.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
        '<div class="field-row"><label>Eggs laid'+(hasSizes?' (total)':'')+'</label><input class="field" type="number" min="0" id="egg-total-input" name="eggs" value="'+(e?e.total:'')+'" '+(hasSizes?'readonly':'')+' autofocus required></div>'+
      '</div>'+
      '<label class="field-row" style="margin-top:10px; flex-direction:row; align-items:center; gap:8px">'+
        '<input type="checkbox" id="egg-grade-toggle" data-change="egg-grade-toggle" '+(hasSizes?'checked':'')+' style="width:auto">'+
        '<span>Grade by size instead of one flat count</span>'+
      '</label>'+
      '<div class="field-grid" id="egg-size-fields" style="margin-top:10px; display:'+(hasSizes?'grid':'none')+'; grid-template-columns:repeat(4,1fr)">'+
        EGG_SIZES.map(function(p){
          return '<div class="field-row"><label>'+p[1]+'</label><input class="field" type="number" min="0" name="size_'+p[0]+'" data-change="egg-size-input" value="'+(e&&e.sizes&&e.sizes[p[0]]?e.sizes[p[0]]:'')+'"></div>';
        }).join('')+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(e?esc(e.note||''):'')+'" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(e?'Save changes':'Add entry')+'</button></div>'+
    '</form>';
  }
  function eggLossFormHtml(id){
    var x = id ? state.eggLosses.find(function(i){return i.id===id;}) : null;
    var isSold = !x || x.reason==='sold';
    var curCost = x && x.saleAmount ? (x.saleAmount * rateOf(state.settings.displayCurrency)).toFixed(2) : '';
    return '<div class="modal-head"><h3>'+(x?'Edit entry':'Log a sale or a loss')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="eggloss">'+
      '<input type="hidden" name="id" value="'+(x?x.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Reason</label><select class="field" name="reason" data-change="eggloss-reason">'+
          '<option value="sold" '+(!x||isSold?'selected':'')+'>Sold</option>'+
          '<option value="breakage" '+(x&&x.reason==='breakage'?'selected':'')+'>Breakage</option>'+
          '<option value="consumed" '+(x&&x.reason==='consumed'?'selected':'')+'>Consumed at home</option>'+
          '<option value="brooding" '+(x&&x.reason==='brooding'?'selected':'')+'>Given to a hen for brooding</option>'+
          '<option value="other" '+(x&&x.reason==='other'?'selected':'')+'>Other</option>'+
        '</select></div>'+
        '<div class="field-row"><label>Number of eggs</label><input class="field" type="number" min="1" name="count" value="'+(x?x.count:'')+'" required autofocus></div>'+
      '</div>'+
      '<div id="egg-sale-fields" class="field-grid" style="margin-top:12px; display:'+(isSold?'grid':'none')+'">'+
        '<div class="field-row"><label>Sold to (optional)</label><input class="field" type="text" name="buyer" list="customer-names-list" value="'+(x?esc(x.buyer||''):'')+'" placeholder="Buyer\'s name — new or existing"></div>'+
        '<div class="field-row"><label>Sale amount (optional)</label><input class="field" type="number" min="0" step="0.01" name="saleAmount" value="'+curCost+'" placeholder="0"></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="saleCurrency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      customerNamesDatalist()+
      '<div class="field-row" style="margin-top:12px"><label>Date</label><input class="field" type="date" name="date" value="'+(x?x.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(x?esc(x.note||''):'')+'" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(x?'Save changes':'Add entry')+'</button></div>'+
    '</form>';
  }

  /* ============================= FEED ============================= */
  var FEED_TYPES = ['Chick mash','Grower mash','Layer mash','Kienyeji / free-range mix','Supplements','Other'];
  function totalFeedKg(s,e){ return (state.feedLogs||[]).filter(function(x){return inRange(x.date,s,e);}).reduce(function(a,x){return a+(x.quantityKg||0);},0); }
  function totalFeedCost(s,e){ return (state.feedLogs||[]).filter(function(x){return inRange(x.date,s,e);}).reduce(function(a,x){return a+(x.cost||0);},0); }
  function feedPerEgg(s,e){
    var kg = totalFeedKg(s,e), eggsCount = sumEggs(s,e);
    return eggsCount>0 ? (kg/eggsCount) : null;
  }
  // Average kg used per day over the trailing N days — the basis for the
  // low-stock "days left" estimate. Looks back at actual logged usage
  // rather than assuming every day is fed the same, so a farm that logs in
  // batches (e.g. once a week) still gets a sensible average.
  function avgDailyFeedKg(days){
    var end = todayISO(), start = toISO(addDays(new Date(),-(days-1)));
    return totalFeedKg(start,end) / days;
  }
  function feedStockInfo(){
    var st = state.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
    var onHand = st.onHandKg||0;
    var avgDaily = avgDailyFeedKg(14);
    var daysLeft = avgDaily>0 ? (onHand/avgDaily) : null;
    return { onHandKg:onHand, lowStockKg: st.lowStockKg!=null?st.lowStockKg:20, avgDaily:avgDaily, daysLeft:daysLeft, low: onHand <= (st.lowStockKg!=null?st.lowStockKg:20), started: (st.restocks||[]).length>0 || onHand>0 };
  }
  function feedStockCardHTML(){
    var info = feedStockInfo();
    var pct = info.lowStockKg>0 ? Math.max(0,Math.min(100, (info.onHandKg/(info.lowStockKg*2))*100)) : 0;
    return '<div class="card">'+
      '<div class="card-title"><h3>Feed stock on hand</h3>'+
        '<button class="btn sm primary" data-action="open-restock-feed" '+(readOnly?'disabled':'')+'>'+ICONS.plus+'Restock</button>'+
      '</div>'+
      (info.started ?
        '<div class="stat-value num" style="font-size:26px; color:'+(info.low?'var(--bad)':'var(--ink)')+'">'+info.onHandKg.toFixed(1)+' kg</div>'+
        '<div style="height:8px; border-radius:5px; background:var(--border,#e5e0d0); margin-top:8px; overflow:hidden">'+
          '<div style="height:100%; width:'+pct+'%; background:'+(info.low?'var(--bad)':'var(--good)')+'"></div>'+
        '</div>'+
        '<div class="hint" style="margin-top:8px">Low-stock warning at '+info.lowStockKg.toFixed(0)+' kg'+(info.avgDaily>0?' · using ≈'+info.avgDaily.toFixed(1)+' kg/day':'')+
          (info.daysLeft!=null ? ' · about '+Math.max(0,Math.round(info.daysLeft))+' day'+(Math.round(info.daysLeft)===1?'':'s')+' of feed left at that rate' : '')+
        '</div>'+
        (info.low ? '<div class="banner bad" style="margin-top:10px">Feed is running low — tap Restock once you buy more.</div>' : '')
        : '<div class="empty">'+ICONS.empty+'<div>Tap Restock the first time you buy feed, to start tracking how much you have on hand.</div></div>')+
    '</div>';
  }
  function feedStockFormHtml(){
    var st = state.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
    return '<div class="modal-head"><h3>Restock feed</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Adds to what you have on hand — separate from "Log feed", which is what\'s been used. If you enter a cost, it\'s added to Expenses automatically under "Feed", same as logging usage.</p>'+
    '<form data-form="feed-stock">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Feed type</label><select class="field" name="feedType">'+FEED_TYPES.map(function(t){ return '<option>'+esc(t)+'</option>'; }).join('')+'</select></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+todayISO()+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Quantity added (kg)</label><input class="field" type="number" min="0.1" step="0.1" name="quantityKg" required autofocus></div>'+
        '<div class="field-row"><label>Cost (optional)</label><input class="field" type="number" min="0" step="0.01" name="cost" placeholder="0"></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Currency</label><select class="field" name="currency">'+currencyOptions()+'</select></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Low-stock warning at (kg)</label><input class="field" type="number" min="0" step="1" name="lowStockKg" value="'+(st.lowStockKg!=null?st.lowStockKg:20)+'"></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function feedPanel(){
    var periodsDef = [['day','Today'],['week','This week'],['month','This month'],['year','This year']];
    var cards = periodsDef.map(function(pd){
      var r = getRange(pd[0]);
      var kg = totalFeedKg(r.startISO, r.endISO);
      var cost = totalFeedCost(r.startISO, r.endISO);
      var fpe = feedPerEgg(r.startISO, r.endISO);
      return '<div class="card"><div class="card-title"><h3>'+pd[1]+'</h3><span class="hint num">'+fmtMoney(cost)+'</span></div>'+
        '<div class="stat-value num" style="font-size:22px">'+kg.toFixed(1)+' kg</div>'+
        '<div class="hint" style="margin-top:6px">'+(fpe!=null ? (fpe*1000).toFixed(0)+' g feed per egg' : 'No eggs logged this period')+'</div>'+
      '</div>';
    }).join('');

    var entries = (state.feedLogs||[]).slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var feedPage = paginate('feed-log', entries);
    var rows = feedPage.items.map(function(x){
      return '<tr><td>'+fmtDate(parseISO(x.date))+'</td><td>'+esc(x.feedType)+'</td><td class="num">'+(x.quantityKg||0).toFixed(1)+' kg</td><td class="num">'+fmtMoney(x.cost||0)+'</td><td>'+esc(x.note||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="view-feed-receipt:'+x.id+'" title="View receipt">'+ICONS.receipt+'</button>'+
        '<button class="icon-btn" data-action="edit-feed:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-feed:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');

    var feedBanner = '<img class="page-photo-banner" src="'+FARM_PHOTOS.banners.feed+'" alt="Feed" data-action="view-photo:feedBanner">';
    return feedBanner+feedStockCardHTML()+
    '<div class="grid four">'+cards+'</div>'+
    '<div class="card"><div class="card-title"><h3>Feed log</h3><span class="hint">'+entries.length+' records</span></div>'+
      '<div class="table-wrap">'+
      (entries.length ? '<table><thead><tr><th>Date</th><th>Feed type</th><th class="num">Quantity</th><th class="num">Cost</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No feed logged yet — track what you buy and use to see feed-per-egg, and spot waste early.</div></div>')+
      '</div>'+pagerHtml('feed-log', feedPage.pageCount, feedPage.page)+'</div>';
  }
  function feedFormHtml(id){
    var x = id ? (state.feedLogs||[]).find(function(i){return i.id===id;}) : null;
    var curCost = x && x.cost ? (x.cost * rateOf(state.settings.displayCurrency)).toFixed(2) : '';
    return '<div class="modal-head"><h3>'+(x?'Edit feed entry':'Log feed')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    (!x ? '<p class="hint">If you enter a cost, it\'s added to Expenses automatically under "Feed" — no need to log it twice.</p>' : '')+
    '<form data-form="feed">'+
      '<input type="hidden" name="id" value="'+(x?x.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Feed type</label><select class="field" name="feedType">'+FEED_TYPES.map(function(t){ return '<option '+(x&&x.feedType===t?'selected':'')+'>'+esc(t)+'</option>'; }).join('')+'</select></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(x?x.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Quantity (kg)</label><input class="field" type="number" min="0" step="0.1" name="quantityKg" value="'+(x?x.quantityKg:'')+'" required autofocus></div>'+
        '<div class="field-row"><label>Cost (optional)</label><input class="field" type="number" min="0" step="0.01" name="cost" value="'+curCost+'" placeholder="0"></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Currency</label><select class="field" name="currency">'+currencyOptions()+'</select></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(x?esc(x.note||''):'')+'" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(x?'Save changes':'Log feed')+'</button></div>'+
    '</form>';
  }

  /* ============================= HEALTH ============================= */
  var HEALTH_TYPE_LABELS = {vaccination:'Vaccination', treatment:'Treatment / medication', checkup:'Checkup', illness:'Illness / diagnosis', other:'Other'};
  // A standard poultry vaccination schedule, commonly used by smallholder
  // farms in Kenya — offered as a sensible starting point, not veterinary
  // advice specific to this farm's own disease risk. "days" is age since
  // hatching (birthDate), matching how the app already ages every batch.
  var VACCINATION_SCHEDULE = [
    { days:1, title:"Marek's disease vaccine", note:"Usually given at the hatchery before day-old chicks are sold — confirm with your supplier whether this is already done." },
    { days:7, title:'Newcastle disease (NCD) — 1st dose', note:'HB1 strain, eye drop or drinking water.' },
    { days:14, title:'Gumboro (IBD) — 1st dose' },
    { days:21, title:'Gumboro (IBD) — 2nd dose' },
    { days:28, title:'Newcastle disease — booster (Lasota)' },
    { days:35, title:'Fowl pox' },
    { days:56, title:'Newcastle disease — booster' },
    { days:98, title:'Fowl typhoid' },
    { days:126, title:'Newcastle disease (killed) + deworming', note:'Before point of lay.' }
  ];
  // Queues the standard schedule above as Health reminders for one batch,
  // dated from its birthDate — used when adding a day-old chick batch (see
  // the flock form's checkbox). Each is a completely ordinary Health
  // record, so it can be edited, marked done, or deleted individually like
  // any other — this just saves typing in the common case.
  function queueVaccinationSchedule(s, batchId, birthDateISO){
    s.healthRecords = s.healthRecords || [];
    VACCINATION_SCHEDULE.forEach(function(item){
      var dueISO = toISO(addDays(parseISO(birthDateISO), item.days));
      s.healthRecords.push({
        id:uid('health'), date:dueISO, type:'vaccination', title:item.title, batchId:batchId,
        nextDueDate:dueISO, note:(item.note||'')+(item.note?' ':'')+'(Added from the standard vaccination schedule.)',
        recordedByRole: roleLabel(currentUser)
      });
    });
  }
  function healthTypeLabel(t){ return HEALTH_TYPE_LABELS[t] || 'Other'; }
  function healthBatchLabel(batchId){
    if(!batchId) return 'Whole flock';
    var b = state.flock.find(function(x){return x.id===batchId;});
    return b ? (genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+' · added '+fmtDate(parseISO(b.dateAdded))) : 'Batch no longer listed';
  }
  function upcomingHealthReminders(){
    var today = todayISO();
    return (state.healthRecords||[]).filter(function(x){ return !!x.nextDueDate; })
      .slice().sort(function(a,b){ return a.nextDueDate<b.nextDueDate?-1:1; })
      .map(function(x){
        return Object.assign({}, x, {
          overdue: x.nextDueDate < today,
          dueSoon: x.nextDueDate >= today && daysBetween(new Date(), parseISO(x.nextDueDate)) <= 7
        });
      });
  }
  function overdueHealthCount(){ return upcomingHealthReminders().filter(function(r){ return r.overdue; }).length; }
  // ---- Health: "Overview + dropdown" restructuring -------------------
  // Overview keeps just the reminders (what used to be the top half of
  // this page); the full log — which can get long — moved to its own
  // "All Records" page.
  var HEALTH_VIEWS = [['overview','Overview'],['records','All Records']];
  function healthOverviewPanel(){
    var reminders = upcomingHealthReminders();
    var remindersHtml = reminders.length ? reminders.map(function(r){
      var pillStyle = r.overdue ? 'style="background:var(--bad-tint); color:var(--bad)"' : (r.dueSoon ? 'style="background:var(--accent-tint); color:var(--accent-strong)"' : '');
      var pillText = r.overdue ? 'Overdue' : (r.dueSoon ? 'Due soon' : 'Upcoming');
      return '<div class="kv-row"><div><div>'+esc(r.title)+' — '+healthTypeLabel(r.type)+' <span class="pill" '+pillStyle+'>'+pillText+'</span></div>'+
        '<div class="hint">'+esc(healthBatchLabel(r.batchId))+' · due '+fmtDate(parseISO(r.nextDueDate))+'</div></div>'+
        '<button class="icon-btn" data-action="edit-health:'+r.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button></div>';
    }).join('') : '<div class="empty">'+ICONS.empty+'<div>Nothing due — set a "next due" date on a record to see reminders here.</div></div>';
    return '<div class="card"><div class="card-title"><h3>Upcoming &amp; due</h3></div>'+remindersHtml+'</div>'+
      '<div class="card" style="text-align:center"><button type="button" class="btn" data-action="view-select:health:records">Open the full Health Log →</button></div>';
  }
  function healthRecordsPageHTML(){
    var entries = (state.healthRecords||[]).slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var healthPage = paginate('health-log', entries);
    var rows = healthPage.items.map(function(x){
      return '<tr><td>'+fmtDate(parseISO(x.date))+'</td><td><span class="pill">'+healthTypeLabel(x.type)+'</span></td><td>'+esc(x.title)+(x.photoURL?' 📷':'')+'</td><td>'+esc(healthBatchLabel(x.batchId))+'</td>'+
      '<td>'+(x.nextDueDate ? fmtDate(parseISO(x.nextDueDate)) : '—')+'</td><td>'+esc(x.note||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="view-health-receipt:'+x.id+'" title="View receipt">'+ICONS.receipt+'</button>'+
        '<button class="icon-btn" data-action="edit-health:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-health:'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Health log</h3><span class="hint">'+entries.length+' records</span></div>'+
      '<div class="table-wrap">'+
      (entries.length ? '<table><thead><tr><th>Date</th><th>Type</th><th>What</th><th>Batch</th><th>Next due</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No health records yet.</div></div>')+
      '</div>'+pagerHtml('health-log', healthPage.pageCount, healthPage.page)+'</div>';
  }
  function healthPanel(){
    var view = currentView('health');
    var body = view==='records' ? healthRecordsPageHTML() : healthOverviewPanel();
    return sectionViewSwitcherHTML('health', HEALTH_VIEWS) + body;
  }
  function healthFormHtml(id){
    var x = id ? (state.healthRecords||[]).find(function(i){return i.id===id;}) : null;
    var typeOptions = ['vaccination','treatment','checkup','illness','other'];
    return '<div class="modal-head"><h3>'+(x?'Edit health record':'Add health record')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="health">'+
      '<input type="hidden" name="id" value="'+(x?x.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Type</label><select class="field" name="type">'+
          typeOptions.map(function(t){ return '<option value="'+t+'" '+((x?x.type===t:t==='vaccination')?'selected':'')+'>'+healthTypeLabel(t)+'</option>'; }).join('')+
        '</select></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(x?x.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>What (e.g. Newcastle Disease vaccine)</label><input class="field" type="text" name="title" maxlength="100" value="'+(x?esc(x.title||''):'')+'" required autofocus></div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Which batch</label><select class="field" name="batchId"><option value="">Whole flock</option>'+
          state.flock.map(function(b){ return '<option value="'+b.id+'" '+(x&&x.batchId===b.id?'selected':'')+'>'+genderLabel(b.gender)+(b.gender!=='unsexed'?'s':'')+' · added '+fmtDate(parseISO(b.dateAdded))+'</option>'; }).join('')+
        '</select></div>'+
        '<div class="field-row"><label>Next due (optional)</label><input class="field" type="date" name="nextDueDate" value="'+(x&&x.nextDueDate?x.nextDueDate:'')+'"></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(x?esc(x.note||''):'')+'" placeholder="Optional"></div>'+
      attachPhotoBlockHtml('health', x?x.id:null, x&&x.photoURL)+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(x?'Save changes':'Add record')+'</button></div>'+
    '</form>';
  }

  /* ============================= REPORTS ============================= */
  function csvCell(v){
    v = v==null ? '' : String(v);
    return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v;
  }
  function toCSV(rows){ return rows.map(function(r){ return r.map(csvCell).join(','); }).join('\r\n'); }
  function downloadCSVFile(filename, rows){
    try{
      var blob = new Blob([toCSV(rows)], {type:'text/csv;charset=utf-8;'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      toast('CSV downloaded.');
    }catch(e){ toast('Could not build the CSV file.'); }
  }
  function exportReportCSV(r){
    var rows = [['Date','Kind','Category','Amount (KES)','Note']];
    state.incomes.filter(function(x){return inRange(x.date,r.startISO,r.endISO);}).forEach(function(x){
      rows.push([x.date,'Income',x.category,x.amount.toFixed(2),x.note||'']);
    });
    state.expenses.filter(function(x){return inRange(x.date,r.startISO,r.endISO);}).forEach(function(x){
      rows.push([x.date,'Expense',x.category,x.amount.toFixed(2),x.note||'']);
    });
    rows.sort(function(a,b){ if(a===rows[0]) return -1; if(b===rows[0]) return 1; return a[0]<b[0]?-1:1; });
    downloadCSVFile('kenokip-farm-report-'+r.startISO+'-to-'+r.endISO+'.csv', rows);
  }
  function reportsPanel(){
    var period = ui.periods.reports;
    var r = getRange(period);
    var income = sumMoney(state.incomes, r.startISO, r.endISO);
    var expense = sumMoney(state.expenses, r.startISO, r.endISO);
    var profit = income - expense;
    var profitColor = profit<0 ? 'var(--bad)' : (profit>0 ? 'var(--good)' : 'var(--ink)');
    var eggsCount = sumEggs(r.startISO, r.endISO);
    var feedKg = totalFeedKg(r.startISO, r.endISO);
    var feedCost = totalFeedCost(r.startISO, r.endISO);
    var fpe = feedPerEgg(r.startISO, r.endISO);
    var nc = netChange(r.startISO, r.endISO);
    var totalNow = birdsAsOf(todayISO());
    var overdueHealth = overdueHealthCount();
    var expBreak = breakdownByCategory(state.expenses, r.startISO, r.endISO);
    var incBreak = breakdownByCategory(state.incomes, r.startISO, r.endISO);
    var sizeTotalsR = eggSizeTotals(state.eggs.filter(function(e){ return inRange(e.date, r.startISO, r.endISO); }));
    var profRows = canSeeFinance() ? batchProfitability() : [];
    var profitableCount = profRows.filter(function(x){ return x.hasData && x.net>=0; }).length;
    var losingCount = profRows.filter(function(x){ return x.hasData && x.net<0; }).length;

    return moneyCrossNavHTML('reports')+
      '<div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap">'+
        periodSegment('reports')+
        '<div style="display:flex; gap:8px">'+
          '<button class="btn" data-action="export-report-csv">Download CSV</button>'+
          '<button class="btn primary" data-action="print-report">'+ICONS.reports+' Print / Save branded report as PDF</button>'+
        '</div>'+
      '</div>'+
      '<div id="report-print-area" class="print-area">'+
        '<div class="card" style="border-top:6px solid var(--accent-strong, #8F590A)">'+
          '<div style="display:flex; align-items:center; gap:14px">'+
            '<img src="icons/logo-mark.png" alt="" style="width:48px; height:48px">'+
            '<div><h2 style="margin:0">Kenokip Farm</h2><div class="hint" style="margin-top:2px">Poultry Keeping — Monthly Report</div></div>'+
          '</div>'+
          '<div class="card-title" style="margin-top:14px"><h3>'+r.label+'</h3><span class="hint">Generated '+fmtDate(new Date(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</span></div>'+
        '</div>'+
        '<div class="card"><div class="card-title"><h3>Production summary</h3></div>'+
        '<div class="grid stats">'+
          statTile('Eggs produced', eggsCount.toLocaleString()+' eggs', '')+
          statTile('Feed used', feedKg.toFixed(1)+' kg', '<span class="hint">'+fmtMoney(feedCost)+'</span>')+
          statTile('Feed per egg', fpe!=null ? (fpe*1000).toFixed(0)+' g' : '—', '')+
          statTile('Flock change', (nc.net>=0?'+':'')+nc.net+' birds', '<span class="hint">+'+nc.added+' added · −'+nc.removed+' lost/sold</span>')+
        '</div>'+
        (sizeTotalsR ? '<div class="grid" style="grid-template-columns:repeat(4,1fr); margin-top:12px">'+
          EGG_SIZES.map(function(p){ return genderTile(p[1], sizeTotalsR[p[0]].toLocaleString()); }).join('')+'</div>' : '')+
        '<div class="hint" style="margin-top:12px">Total birds now: '+totalNow.toLocaleString()+(overdueHealth>0 ? ' · '+overdueHealth+' health reminder'+(overdueHealth===1?'':'s')+' overdue' : ' · No overdue health reminders')+'</div>'+
        '</div>'+
        (canSeeFinance() ? '<div class="card"><div class="card-title"><h3>Financial summary</h3></div>'+
        '<div class="grid stats">'+
          statTile('Income · '+r.label, fmtMoney(income), '')+
          statTile('Expenses · '+r.label, fmtMoney(expense), '')+
          statTile(profit<0?'Deficit':'Profit', fmtMoney(Math.abs(profit)), '')+
          statTile('Batch profitability', profitableCount+' up · '+losingCount+' down', '<span class="hint">Of '+profRows.filter(function(x){return x.hasData;}).length+' batches with cost/income data</span>')+
        '</div>'+
        '<div class="grid two" style="margin-top:12px">'+
          '<div><div class="hint" style="margin-bottom:6px">Income by category</div>'+(incBreak.length?categoryBars(incBreak):'<div class="hint">None this period.</div>')+'</div>'+
          '<div><div class="hint" style="margin-bottom:6px">Spending by category</div>'+(expBreak.length?categoryBars(expBreak):'<div class="hint">None this period.</div>')+'</div>'+
        '</div>'+
        '</div>' : '')+
      '</div>'+
      '<div class="card"><div class="card-title"><h3>Activity Statement</h3><span class="hint">Everything, one signed document</span></div>'+
        '<p class="hint" style="margin-top:-4px">A single itemized document — flock, eggs, feed, health, expenses, income'+(canSeeFinance()?', and Finance':'')+' — for a date range you choose, signed electronically and given a verification code so it can\'t quietly be edited afterward and passed off as genuine.</p>'+
        '<div style="display:flex; gap:8px; flex-wrap:wrap">'+
          '<button class="btn primary" data-action="open-activity-statement">'+ICONS.statement+' Generate Activity Statement</button>'+
          '<button class="btn" data-action="open-verify-receipt">'+ICONS.verify+' Verify a receipt</button>'+
        '</div>'+
      '</div>';
  }
  function activityStatementFormHtml(){
    var r = getRange('month');
    // getRange('month') gives the full calendar month, whose end can be
    // later than today (e.g. mid-month) — cap the prefilled "To" date at
    // today so it doesn't start out later than the max="..." on the field
    // itself, which would silently block the form from submitting at all.
    var defaultEnd = r.endISO > todayISO() ? todayISO() : r.endISO;
    return '<div class="modal-head"><h3>Generate Activity Statement</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint" style="margin-top:-4px">Choose the period to cover. You\'ll get a preview first, then sign it electronically before downloading.</p>'+
    '<form data-form="activity-statement-range">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>From</label><input class="field" type="date" name="startDate" value="'+r.startISO+'" max="'+todayISO()+'" required></div>'+
        '<div class="field-row"><label>To</label><input class="field" type="date" name="endDate" value="'+defaultEnd+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Preview statement</button></div>'+
    '</form>';
  }
  // Builds the full itemized statement: per-topic tables (opts.sections, for
  // display) plus a single flattened, ordered field list (opts.rows, what
  // actually gets signed) built in the very same pass — so what's shown and
  // what's signed can never drift apart. Reuses the same computed helpers as
  // the rest of Reports rather than recomputing farm stats separately.
  function activityStatementOpts(startISO, endISO){
    var rangeLabel = fmtDate(parseISO(startISO))+' to '+fmtDate(parseISO(endISO));
    var sections = [];
    var rows = [];
    function pushRow(list, canonicalLabel, dateISO, desc, amountText){
      list.push({date: dateISO, desc: desc, amount: amountText||''});
      rows.push({label: canonicalLabel+' — '+dateISO, value: desc+(amountText?' — '+amountText:'')});
    }

    var flockRows = [];
    state.flock.forEach(function(b){
      if(inRange(b.dateAdded, startISO, endISO)){
        pushRow(flockRows, 'Flock added', b.dateAdded, 'Added '+b.count+' '+genderLabel(b.gender)+(b.count>1?'s':'')+(b.source?' ('+b.source+')':''), '');
      }
      (b.removals||[]).forEach(function(rm){
        if(rm.reason!=='resexed' && inRange(rm.date, startISO, endISO)){
          var lbl = removalReasonLabel(rm.reason);
          var desc = lbl+' '+rm.count+' '+genderLabel(b.gender)+(rm.count>1?'s':'')+(rm.reason==='sold' && rm.buyer ? ' to '+rm.buyer : '');
          var amt = (rm.reason==='sold' && rm.saleAmount>0) ? fmtMoney(rm.saleAmount) : '';
          pushRow(flockRows, 'Flock activity', rm.date, desc, amt);
        }
      });
    });
    sections.push({title:'Flock', rows: flockRows});

    var eggRows = [];
    (state.eggs||[]).forEach(function(e){
      if(inRange(e.date, startISO, endISO)) pushRow(eggRows, 'Eggs collected', e.date, 'Collected '+e.total+' eggs'+(e.note?' — '+e.note:''), '');
    });
    (state.eggLosses||[]).forEach(function(x){
      if(inRange(x.date, startISO, endISO)){
        var lbl = eggLossReasonLabel(x.reason);
        var desc = (x.reason==='sold'?'Sold':lbl)+' '+x.count+' egg'+(x.count>1?'s':'')+(x.reason==='sold' && x.buyer?' to '+x.buyer:'');
        var amt = (x.reason==='sold' && x.saleAmount>0) ? fmtMoney(x.saleAmount) : '';
        pushRow(eggRows, 'Eggs activity', x.date, desc, amt);
      }
    });
    sections.push({title:'Eggs', rows: eggRows});

    var feedRows = [];
    (state.feedLogs||[]).forEach(function(f){
      if(inRange(f.date, startISO, endISO)) pushRow(feedRows, 'Feed', f.date, (f.feedType||'Feed')+' — '+(f.quantityKg||0).toFixed(1)+' kg'+(f.note?' — '+f.note:''), f.cost>0?fmtMoney(f.cost):'');
    });
    sections.push({title:'Feed', rows: feedRows});

    var healthRows = [];
    (state.healthRecords||[]).forEach(function(h){
      if(inRange(h.date, startISO, endISO)) pushRow(healthRows, 'Health', h.date, h.title+' — '+healthTypeLabel(h.type)+' ('+healthBatchLabel(h.batchId)+')'+(h.note?' — '+h.note:''), '');
    });
    sections.push({title:'Health', rows: healthRows});

    var expenseRows = [], expenseTotal = 0;
    state.expenses.forEach(function(x){
      if(inRange(x.date, startISO, endISO)){ pushRow(expenseRows, 'Expense', x.date, (x.category||'Other')+(x.note?' — '+x.note:''), fmtMoney(x.amount)); expenseTotal += x.amount; }
    });
    sections.push({title:'Expenses', rows: expenseRows});

    var incomeRows = [], incomeTotal = 0;
    state.incomes.forEach(function(x){
      if(inRange(x.date, startISO, endISO)){ pushRow(incomeRows, 'Income', x.date, (x.category||'Other')+(x.note?' — '+x.note:''), fmtMoney(x.amount)); incomeTotal += x.amount; }
    });
    sections.push({title:'Income', rows: incomeRows});

    if(canSeeFinance()){
      var f = financeState();
      var financeRows = [];
      f.transactions.filter(function(t){ return (t.status||'approved')==='approved' && inRange(t.date, startISO, endISO); })
        .forEach(function(t){
          pushRow(financeRows, 'Finance', t.date, (t.type==='deposit'?'Deposit':'Withdrawal')+(t.note?' — '+t.note:''), fmtMoney(t.amount));
        });
      sections.push({title:'Finance', rows: financeRows});
    }

    var eggsProduced = sumEggs(startISO, endISO);
    var feedKg = totalFeedKg(startISO, endISO);
    var feedCostTotal = totalFeedCost(startISO, endISO);
    var nc = netChange(startISO, endISO);
    var summary = [
      {label:'Eggs produced', value: eggsProduced.toLocaleString()+' eggs'},
      {label:'Feed used', value: feedKg.toFixed(1)+' kg ('+fmtMoney(feedCostTotal)+')'},
      {label:'Flock change', value: (nc.net>=0?'+':'')+nc.net+' birds'},
      {label:'Expenses', value: fmtMoney(expenseTotal)},
      {label:'Income', value: fmtMoney(incomeTotal)},
      {label:'Net (income − expenses)', value: fmtMoney(incomeTotal-expenseTotal)}
    ];
    if(canSeeFinance()) summary.push({label:'Finance balance (today)', value: financeMoneyDisplay(financeBalance())});
    rows.push({label:'Statement period', value: rangeLabel});
    summary.forEach(function(s){ rows.push({label:'Summary — '+s.label, value: s.value}); });

    return {
      isStatement: true,
      title: 'ACTIVITY STATEMENT',
      receiptNo: receiptNoFrom('STMT'+startISO.replace(/-/g,'')+endISO.replace(/-/g,'')),
      date: endISO,
      rangeLabel: rangeLabel,
      sections: sections,
      summary: summary,
      rows: rows,
      amountLabel: 'Net (income − expenses)',
      amount: fmtMoney(incomeTotal-expenseTotal),
      signatures: [{role:'Administrator'}]
    };
  }

  /* ============================= RECEIPTS ============================= */
  // Downloadable receipts for money the farm receives — a Finance deposit,
  // a flock sale, or an egg sale. "Download" here means the browser's own
  // Print / Save as PDF (same trick as Reports above), so there's no new
  // library and no server-side PDF generation involved.
  var RECEIPT_LOGO_B64 = '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';
  var pendingReceiptHtml = null;
  var pendingReceiptOpts = null;
  // The verify link for whatever receipt is currently on screen in the
  // signed-preview modal — lets "Copy verify link" work without having to
  // re-thread the link through handleAction's plain action-string dispatch.
  var pendingVerifyLink = null;
  // Clipboard write with a fallback for browsers/contexts where the modern
  // API isn't available (older Android WebViews, non-HTTPS, etc.) — a
  // temporary offscreen textarea + the legacy copy command covers those.
  function copyTextToClipboard(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text).then(function(){ return true; }).catch(function(){ return copyTextFallback(text); });
    }
    return Promise.resolve(copyTextFallback(text));
  }
  function copyTextFallback(text){
    try{
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }catch(e){ return false; }
  }
  function receiptNoFrom(id){ return 'RCPT-'+String(id||'').replace(/[^A-Za-z0-9]/g,'').slice(-8).toUpperCase(); }
  // opts: {title, receiptNo, date, rows:[{label,value}], amountLabel, amount,
  // signatures:[{role, img?}], verify:{code,qrDataUrl}?, unsigned?}. The same
  // rows (in the same order) feed both what's printed AND what gets signed
  // (see receiptCanonicalFields) — so what a person sees is exactly what the
  // verification code was computed from.
  // Shared by both a single receipt and a full Activity Statement — the
  // head, signatures block, and verification block look identical on
  // either document, so there's one place that renders each of them.
  function receiptHeadHtml(receiptNo, date, dateLabel){
    return '<div class="receipt-head">'+
      '<img class="receipt-logo" src="data:image/png;base64,'+RECEIPT_LOGO_B64+'" alt="Kenokip Farm">'+
      '<div class="receipt-head-text"><h2>Kenokip Farm</h2><div class="hint">Poultry Keeping</div></div>'+
      '<div class="receipt-meta"><div><strong>Receipt No.</strong> '+esc(receiptNo)+'</div><div><strong>'+esc(dateLabel||'Date')+'</strong> '+esc(date)+'</div></div>'+
    '</div>';
  }
  function receiptSigsHtml(signatures){
    var sigHtml = (signatures||[]).map(function(s){
      return '<div class="receipt-sig">'+(s.img ? '<img class="receipt-sig-img" src="'+s.img+'" alt="Signature">' : '')+
        '<div class="receipt-sig-line"></div><div class="receipt-sig-role">'+esc(s.role)+'</div></div>';
    }).join('');
    return '<div class="receipt-sigs">'+sigHtml+'<div class="receipt-stamp">Official<br>Stamp</div></div>';
  }
  function receiptVerifyHtml(opts){
    if(opts.verify && opts.verify.code){
      return '<div class="receipt-verify">'+
        (opts.verify.qrDataUrl ? '<div class="receipt-verify-qr"><img src="'+opts.verify.qrDataUrl+'" alt="Verification QR code"></div>' : '')+
        '<div class="receipt-verify-text">'+
          '<div><strong>Verification code:</strong> <span class="receipt-verify-code">'+esc(opts.verify.code)+'</span></div>'+
          '<div class="hint">Scan the QR code — or open "Verify a receipt" in the app and enter this code with the details above — to confirm this document hasn\'t been altered since it was generated.</div>'+
        '</div>'+
      '</div>';
    } else if(opts.unsigned){
      var reasonText = opts.unsignedReason ? esc(opts.unsignedReason) : 'receipt signing isn\'t set up yet — see SETUP-RECEIPTS.md';
      return '<div class="receipt-unsigned-note">This copy has no verification code ('+reasonText+') — it should not be treated as tamper-proof.</div>';
    }
    return '';
  }
  function buildReceiptHTML(opts){
    var rowsHtml = (opts.rows||[]).map(function(r){
      return '<div class="receipt-row"><span>'+esc(r.label)+'</span><span>'+esc(r.value)+'</span></div>';
    }).join('');
    // "receipt-slip" is the compact, actual-receipt-sized look (a single
    // sale/payment/etc.) — the Activity Statement below stays full document
    // width since it's a multi-section report, not a single slip.
    return '<div class="receipt receipt-slip">'+
      receiptHeadHtml(opts.receiptNo, fmtDate(parseISO(opts.date)))+
      '<div class="receipt-title">'+esc(opts.title)+'</div>'+
      '<div class="receipt-rows">'+rowsHtml+'</div>'+
      '<div class="receipt-total"><span>'+esc(opts.amountLabel||'Amount')+'</span><span>'+opts.amount+'</span></div>'+
      receiptSigsHtml(opts.signatures)+
      receiptVerifyHtml(opts)+
      '<div class="receipt-foot">Kenokip Farm — Poultry Keeping &middot; Generated '+fmtDate(new Date())+'</div>'+
    '</div>';
  }
  // A full itemized Activity Statement for a date range — same head/foot/
  // signature/verification treatment as a single receipt, but its body is a
  // set of per-topic tables (opts.sections) followed by summary tiles
  // (opts.summary), instead of a short list of rows.
  function buildActivityStatementHTML(opts){
    var sectionsHtml = (opts.sections||[]).map(function(sec){
      var rowsHtml = sec.rows.length ? sec.rows.map(function(r){
        return '<tr><td>'+fmtDate(parseISO(r.date))+'</td><td>'+esc(r.desc)+'</td><td class="num">'+esc(r.amount||'')+'</td></tr>';
      }).join('') : '';
      return '<div class="statement-section"><h4>'+esc(sec.title)+'</h4>'+
        (sec.rows.length ?
          '<table class="statement-table"><thead><tr><th>Date</th><th>What happened</th><th class="num">Amount</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>'
          : '<div class="statement-empty">Nothing recorded in this period.</div>')+
      '</div>';
    }).join('');
    var summaryHtml = '<div class="statement-summary">'+(opts.summary||[]).map(function(s){
      return '<div class="statement-summary-tile"><div class="lbl">'+esc(s.label)+'</div><div class="val">'+esc(s.value)+'</div></div>';
    }).join('')+'</div>';
    return '<div class="receipt">'+
      receiptHeadHtml(opts.receiptNo, opts.rangeLabel, 'Period')+
      '<div class="receipt-title">'+esc(opts.title)+'</div>'+
      summaryHtml+
      sectionsHtml+
      receiptSigsHtml(opts.signatures)+
      receiptVerifyHtml(opts)+
      '<div class="receipt-foot">Kenokip Farm — Poultry Keeping &middot; Generated '+fmtDate(new Date())+'</div>'+
    '</div>';
  }
  // The exact ordered list of [label, value] pairs sent to signReceipt /
  // verifyReceipt — built from the very same opts.rows used to render the
  // receipt, so the signed data and the printed data can never drift apart.
  function receiptCanonicalFields(opts){
    var fields = [['Receipt No', opts.receiptNo], ['Date', opts.date], ['Title', opts.title]];
    (opts.rows||[]).forEach(function(r){ fields.push([String(r.label), r.value==null?'':String(r.value)]); });
    fields.push([opts.amountLabel||'Amount', opts.amount==null?'':String(opts.amount)]);
    return fields;
  }
  // Two signature lines when a non-administrator recorded the sale
  // themselves (whoever was signed in at the time, by role) — just one when
  // the administrator recorded it, so the same role never appears twice.
  function receiptSignaturesFor(recordedByRole){
    var sigs = [{role:'Administrator'}];
    if(recordedByRole && recordedByRole!=='Administrator') sigs.push({role:recordedByRole});
    return sigs;
  }
  function financeReceiptOpts(id){
    var f = financeState();
    var t = f.transactions.find(function(x){return x.id===id;});
    if(!t || (t.status||'approved')!=='approved') return null;
    if(t.type==='withdrawal'){
      var outMethodLabel = t.source==='mpesa-b2c' ? 'M-Pesa (sent from the app)' : 'Manual entry';
      return {
        title: 'WITHDRAWAL RECEIPT',
        receiptNo: receiptNoFrom(t.id),
        date: t.date,
        rows: [
          {label:'Paid via', value: outMethodLabel},
          {label:'Description', value: t.note || '—'}
        ],
        amountLabel: 'Amount paid out',
        amount: fmtMoney(t.amount),
        signatures: [{role:'Administrator'}, {role:'Financial Staff'}],
        // Withdrawals move money OUT of the farm — the administrator's live
        // sign-off is never optional for these, unlike every other receipt
        // type, so the co-signing flow must never offer a "skip" option here.
        mandatory: true
      };
    }
    if(t.type!=='deposit') return null;
    var methodLabel = t.source==='mpesa-stk' ? 'M-Pesa (sent from the app)'
      : t.source==='mpesa-stk-paybill' ? 'M-Pesa (sent from the app, Paybill)'
      : t.source==='mpesa-c2b' ? 'M-Pesa (paid directly to the Till)'
      : t.source==='mpesa-c2b-paybill' ? 'M-Pesa (paid directly to the Paybill)'
      : 'Manual entry';
    return {
      title: 'PAYMENT RECEIPT',
      receiptNo: receiptNoFrom(t.id),
      date: t.date,
      rows: [
        {label:'Received via', value: methodLabel},
        {label:'Description', value: t.note || '—'}
      ],
      amountLabel: 'Amount received',
      amount: fmtMoney(t.amount),
      signatures: [{role:'Administrator'}, {role:'Financial Staff'}],
      mandatory: false
    };
  }
  function flockReceiptOpts(batchId, remId){
    var b = state.flock.find(function(x){return x.id===batchId;});
    if(!b) return null;
    var r = (b.removals||[]).find(function(x){return x.id===remId;});
    if(!r || r.reason!=='sold') return null;
    var rows = [
      {label:'Item', value: r.count+' '+genderLabel(b.gender)+(r.count>1?'s':'')},
      {label:'Sold to', value: r.buyer || 'Walk-in customer'},
      {label:'From batch added', value: fmtDate(parseISO(b.dateAdded))}
    ];
    if(r.note) rows.push({label:'Note', value:r.note});
    return {
      title: 'SALES RECEIPT',
      receiptNo: receiptNoFrom(r.id),
      date: r.date,
      rows: rows,
      amountLabel: 'Amount',
      amount: r.saleAmount>0 ? fmtMoney(r.saleAmount) : 'Not recorded',
      signatures: receiptSignaturesFor(r.recordedByRole),
      mandatory: false
    };
  }
  function eggReceiptOpts(id){
    var x = (state.eggLosses||[]).find(function(i){return i.id===id;});
    if(!x || x.reason!=='sold') return null;
    var rows = [
      {label:'Item', value: x.count+' egg'+(x.count>1?'s':'')},
      {label:'Sold to', value: x.buyer || 'Walk-in customer'}
    ];
    if(x.note) rows.push({label:'Note', value:x.note});
    return {
      title: 'SALES RECEIPT',
      receiptNo: receiptNoFrom(x.id),
      date: x.date,
      rows: rows,
      amountLabel: 'Amount',
      amount: x.saleAmount>0 ? fmtMoney(x.saleAmount) : 'Not recorded',
      signatures: receiptSignaturesFor(x.recordedByRole),
      mandatory: false
    };
  }
  function expenseReceiptOpts(id){
    var x = state.expenses.find(function(i){return i.id===id;});
    if(!x) return null;
    var rows = [{label:'Category', value: x.category}];
    if(x.note) rows.push({label:'Note', value:x.note});
    return {
      title: 'PAYMENT VOUCHER',
      receiptNo: receiptNoFrom(x.id),
      date: x.date,
      rows: rows,
      amountLabel: 'Amount paid',
      amount: fmtMoney(x.amount),
      signatures: receiptSignaturesFor(x.recordedByRole),
      mandatory: false
    };
  }
  function incomeReceiptOpts(id){
    var x = state.incomes.find(function(i){return i.id===id;});
    if(!x) return null;
    var rows = [{label:'Category', value: x.category}];
    if(x.note) rows.push({label:'Note', value:x.note});
    return {
      title: 'INCOME RECEIPT',
      receiptNo: receiptNoFrom(x.id),
      date: x.date,
      rows: rows,
      amountLabel: 'Amount received',
      amount: fmtMoney(x.amount),
      signatures: receiptSignaturesFor(x.recordedByRole),
      mandatory: false
    };
  }
  function feedReceiptOpts(id){
    var x = (state.feedLogs||[]).find(function(i){return i.id===id;});
    if(!x) return null;
    var rows = [
      {label:'Feed type', value: x.feedType},
      {label:'Quantity', value: (x.quantityKg||0).toFixed(1)+' kg'}
    ];
    if(x.note) rows.push({label:'Note', value:x.note});
    return {
      title: 'FEED LOG RECORD',
      receiptNo: receiptNoFrom(x.id),
      date: x.date,
      rows: rows,
      amountLabel: 'Cost',
      amount: x.cost>0 ? fmtMoney(x.cost) : 'Not recorded',
      signatures: receiptSignaturesFor(x.recordedByRole),
      mandatory: false
    };
  }
  function healthReceiptOpts(id){
    var x = (state.healthRecords||[]).find(function(i){return i.id===id;});
    if(!x) return null;
    var rows = [
      {label:'Type', value: healthTypeLabel(x.type)},
      {label:'What', value: x.title},
      {label:'Batch', value: healthBatchLabel(x.batchId)}
    ];
    if(x.nextDueDate) rows.push({label:'Next due', value: fmtDate(parseISO(x.nextDueDate))});
    if(x.note) rows.push({label:'Note', value:x.note});
    return {
      title: 'HEALTH RECORD',
      receiptNo: receiptNoFrom(x.id),
      date: x.date,
      rows: rows,
      amountLabel: 'Status',
      amount: 'Recorded',
      signatures: receiptSignaturesFor(x.recordedByRole),
      mandatory: false
    };
  }
  // Step 1 of downloading any receipt: show an unsigned preview of exactly
  // what will be signed, with a "Sign & download" button that starts the
  // e-signature step (see signAndPreviewReceipt below). Nothing is
  // print-able yet — a receipt only reaches the printable/final state once
  // it's been through signing.
  var pendingReceiptRenderFn = buildReceiptHTML;
  function viewReceipt(opts, renderFn, docLabel){
    if(!opts){ toast('That record is no longer available.'); return; }
    pendingReceiptOpts = opts;
    pendingReceiptRenderFn = renderFn || buildReceiptHTML;
    var draftHtml = pendingReceiptRenderFn(opts);
    openModal(
      '<div class="modal-head"><h3>'+esc(docLabel||'Receipt')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
      '<div style="max-height:55vh; overflow:auto; margin-bottom:14px">'+draftHtml+'</div>'+
      '<p class="hint" style="margin-top:-6px">This is a preview. Signing it electronically adds your signature and a verification code that proves it hasn\'t been altered afterward.</p>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn primary" data-action="sign-pending-receipt">Sign &amp; download</button></div>'
    );
  }
  // Wraps a signReceipt/verifyReceipt call with a couple of automatic
  // retries (a short pause between each — worth it on a spotty rural mobile
  // signal, which is the normal case out on a farm), and — importantly —
  // refuses to show an error that didn't actually come from OUR Cloud
  // Function. A genuine error from a Functions call always has a `code`
  // starting with "functions/" (e.g. "functions/failed-precondition") —
  // that's how the Firebase client SDK tags it. Anything else (a dropped
  // connection, or an unrelated background hiccup rejecting at the exact
  // wrong moment) isn't a real answer about the receipt. If it's still not
  // a real Functions error after all retries are used up, callers get one
  // clean, honest message instead of confusing, unrelated text.
  function callFunctionResilient(name, data){
    function attempt(){ return firebase.functions().httpsCallable(name)(data); }
    function isRealFunctionsError(err){ return !!(err && typeof err.code === 'string' && err.code.indexOf('functions/') === 0); }
    function delay(ms){ return new Promise(function(res){ setTimeout(res, ms); }); }
    function tryOnce(attemptsLeft){
      return attempt().catch(function(err){
        if(isRealFunctionsError(err)) throw err;
        console.error(name+': unrelated error, '+attemptsLeft+' retries left', err);
        if(attemptsLeft <= 0){
          var cleanErr = new Error('an unexpected error happened while contacting the server — please try again');
          cleanErr.code = 'client/unexpected';
          throw cleanErr;
        }
        return delay(900).then(function(){ return tryOnce(attemptsLeft-1); });
      });
    }
    return tryOnce(2);
  }
  // Step 2: capture a drawn signature, bind it (and who/when) into the
  // canonical fields, ask the server to sign them, then show the final,
  // printable document with the signature image, verification code, and QR
  // code embedded. If signing fails (e.g. not set up yet), the document is
  // still shown — just clearly marked unsigned rather than blocked outright.
  // Builds the {code, qrDataUrl, blob} verify payload from a finished set
  // of fields + the code signReceipt returned — shared by every path that
  // ends in a finished, downloadable receipt (signing solo, an
  // administrator's approval, or a skip), so the QR/blob logic only lives
  // in one place.
  function buildVerifyPayload(fields, code){
    if(!code) return null;
    var blobStr = JSON.stringify({fields: fields, code: code});
    var blobB64 = utf8ToBase64Url(blobStr);
    var verifyUrl = window.location.origin + window.location.pathname + '?verify=' + blobB64;
    var qrDataUrl = null;
    try{
      var qr = qrcode(0, 'M');
      qr.addData(verifyUrl);
      qr.make();
      qrDataUrl = qr.createDataURL(4, 8);
    }catch(e){ /* falls back to no QR image, code still shown */ }
    return {code: code, qrDataUrl: qrDataUrl, blob: blobB64};
  }
  // The final step for every signing path: show the finished, printable
  // document with whichever signature(s), verification code and QR code it
  // ended up with.
  function showSignedReceiptModal(finalOpts, renderFn, docLabel){
    renderFn = renderFn || pendingReceiptRenderFn || buildReceiptHTML;
    pendingReceiptHtml = renderFn(finalOpts);
    pendingVerifyLink = (finalOpts.verify && finalOpts.verify.blob) ? (window.location.origin + window.location.pathname + '?verify=' + finalOpts.verify.blob) : null;
    openModal(
      '<div class="modal-head"><h3>'+esc(docLabel||finalOpts.title||'Receipt')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
      '<div style="max-height:60vh; overflow:auto; margin-bottom:14px">'+pendingReceiptHtml+'</div>'+
      (pendingVerifyLink ? '<p class="hint" style="margin-top:-6px">Checking this on a different device (like a laptop)? Tap "Copy verify link" and paste it into "Verify a receipt" there — no scanning needed.</p>' : '')+
      '<div class="modal-foot">'+
        (pendingVerifyLink ? '<button type="button" class="btn" data-action="copy-verify-link">Copy verify link</button>' : '')+
        '<button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn primary" data-action="print-pending-receipt">Print / Save as PDF</button></div>'
    );
  }
  // Step 2: capture a drawn signature, bind it (and who/when) into the
  // canonical fields, then either finish immediately (the administrator
  // signing, or a document that only ever needed one signature) or hand
  // off to the co-signing flow below (a team member signing a document
  // that also needs the administrator's signature).
  function signAndPreviewReceipt(opts, renderFn, docLabel){
    if(!opts){ toast('That record is no longer available.'); return; }
    renderFn = renderFn || pendingReceiptRenderFn || buildReceiptHTML;
    var who = currentUser ? (currentUser.name || currentUser.email || 'Unknown') : 'Guest';
    var roleText = currentUser ? roleLabel(currentUser) : 'Guest';
    // Each document names exactly who is expected to sign it (e.g. an
    // Administrator line, and — for money-related receipts — a Financial
    // Staff line too). Whoever is signed in must match ONE of those lines
    // by their real role — there's no fallback slot any more. Without this
    // check, anyone who could open the receipt could end up signing into
    // whichever line came first (often "Administrator"), which defeats the
    // whole point of a named signature.
    var expectedSignatures = (opts.signatures && opts.signatures.length ? opts.signatures : [{role:'Administrator'}]);
    var mayISign = expectedSignatures.some(function(s){ return s.role===roleText; });
    if(!mayISign){
      var expectedRoles = expectedSignatures.map(function(s){ return s.role; }).join(' or ');
      toast('Only '+expectedRoles+' can sign this document — you\'re signed in as '+roleText+'.');
      return;
    }
    // The administrator always signs directly — there's nobody above them
    // to route a request to. Same for a document that only ever needed one
    // signature (e.g. this one was recorded by the administrator
    // themselves — see receiptSignaturesFor). Everyone else, on a document
    // that also needs the administrator's signature, goes through
    // requestCoSignoff below instead.
    var needsCoSign = roleText!=='Administrator' && expectedSignatures.length>1;
    openSignaturePad(opts.title, function(sigDataUrl, sigHash){
      var signedAt = new Date().toISOString();
      var myFields = [
        ['Signed by ('+roleText+')', who+' ('+roleText+')'],
        ['Signed at ('+roleText+')', signedAt],
        ['Signature hash ('+roleText+')', sigHash]
      ];
      var signatures = expectedSignatures.map(function(s){
        return s.role===roleText ? Object.assign({}, s, {img: sigDataUrl}) : Object.assign({}, s);
      });

      if(needsCoSign){
        requestCoSignoff(opts, expectedSignatures, myFields, sigDataUrl);
        return;
      }

      openModal('<div class="modal-head"><h3>Signing…</h3></div><p class="hint" style="margin:0">Getting a verification code for this document.</p>');

      function finish(verify, unsigned, reason){
        var finalOpts = Object.assign({}, opts, {signatures: signatures, verify: verify, unsigned: unsigned, unsignedReason: reason});
        showSignedReceiptModal(finalOpts, renderFn, docLabel);
      }

      if(!cloudMode){
        var offlineReason = 'you appear to be offline — signing needs an internet connection';
        toast('Signing needs to be online — showing an unsigned copy.');
        finish(null, true, offlineReason);
        return;
      }
      var fields = receiptCanonicalFields(opts).concat(myFields);
      callFunctionResilient('signReceipt', {fields: fields}).then(function(res){
        finish(buildVerifyPayload(fields, res.data && res.data.code), false);
      }).catch(function(err){
        // Show the ACTUAL reason on the receipt itself (not just a toast
        // that can be missed) — makes it possible to tell "secret not set
        // up yet" apart from "functions not deployed" or a network error
        // just from looking at the printed page.
        var reasonMsg = (err && err.message) || 'an unknown error happened while contacting the server';
        toast('Could not get a verification code — showing an unsigned copy.');
        finish(null, true, reasonMsg);
      });
    });
  }
  // Sends a team member's own half of a two-signature document to the
  // administrator instead of finishing it — see requestReceiptSignoff in
  // roles.js. On success, opens the live "pending" view (showPendingSignoffModal)
  // that watches the request until the administrator approves it (or it
  // gets skipped).
  function requestCoSignoff(opts, expectedSignatures, myFields, sigDataUrl){
    if(!cloudMode){ toast('Sending this to the administrator needs an internet connection.'); return; }
    openModal('<div class="modal-head"><h3>Sending…</h3></div><p class="hint" style="margin:0">Sending your signature to the administrator.</p>');
    var payload = {
      opts: { title: opts.title, receiptNo: opts.receiptNo, date: opts.date, rows: opts.rows, amountLabel: opts.amountLabel, amount: opts.amount },
      signatures: expectedSignatures,
      firstSignerFields: myFields,
      signatureImg: sigDataUrl,
      mandatory: !!opts.mandatory
    };
    callFunctionResilient('requestReceiptSignoff', payload).then(function(res){
      toast('Sent — the administrator will get a signature for this shortly.');
      showPendingSignoffModal(res.data && res.data.id);
    }).catch(function(err){
      toast((err && err.message) || 'Could not send this to the administrator — please try again.');
    });
  }
  // pendingSignoffs stores each signature block as [{label,value}, ...]
  // rather than [[label,value], ...] — Firestore refuses to store an array
  // directly inside another array, so roles.js converts before writing
  // (see tripleToFieldObjects there). Converting back here is what lets
  // this reconstruct the exact same [label,value] pairs that were signed,
  // for hashing/verifying and for receiptCanonicalFields to concatenate with.
  function fieldObjectsToTuples(fields){
    return (fields||[]).map(function(f){ return [f.label, f.value]; });
  }
  // The exact fields that were (or would be) signed for a pendingSignoffs
  // document — reconstructed the same way whether we're watching it live
  // right after signing, or reopening it later from a Messages notification.
  function finalizedSignoffFields(doc){
    var fields = receiptCanonicalFields(doc.opts).concat(fieldObjectsToTuples(doc.firstSignerFields));
    if(doc.status==='approved' && doc.adminFields) fields = fields.concat(fieldObjectsToTuples(doc.adminFields));
    return fields;
  }
  function stopPendingSignoffWatch(){
    if(pendingSignoffUnsubDoc){ pendingSignoffUnsubDoc(); pendingSignoffUnsubDoc = null; }
    if(pendingSignoffUnsubAdmin){ pendingSignoffUnsubAdmin(); pendingSignoffUnsubAdmin = null; }
  }
  // Live "waiting for the administrator" view — used right after a team
  // member signs their half, and again any time the same request is
  // reopened later (from Messages, or from Team → Pending signatures).
  // Watches the request itself, to flip to the finished receipt the moment
  // it's approved or skipped, AND (purely as an FYI note, not a gate — see
  // skipPendingSignoff) the administrator's own account, so an "I'm away"
  // toggle shows up here instantly without needing to refresh or reopen
  // anything.
  function showPendingSignoffModal(id){
    if(!id){ toast('That request is missing.'); return; }
    if(!db){ toast('Needs an internet connection.'); return; }
    stopPendingSignoffWatch();
    var adminAway = false;
    var lastDoc = null;
    function draw(){
      if(!lastDoc) return;
      if(lastDoc.status==='approved' || lastDoc.status==='skipped'){
        stopPendingSignoffWatch();
        var fields = finalizedSignoffFields(lastDoc);
        var verify = buildVerifyPayload(fields, lastDoc.code);
        var finalOpts = Object.assign({}, lastDoc.opts, {
          signatures: lastDoc.signatures, verify: verify,
          unsigned: !verify, unsignedReason: verify ? null : 'this document\'s verification code could not be found'
        });
        showSignedReceiptModal(finalOpts, pendingReceiptRenderFn || buildReceiptHTML, lastDoc.opts.title);
        return;
      }
      // Any team member can skip waiting at any time — the one thing that
      // can never be skipped is a mandatory (withdrawal) request, no matter
      // what. Whether the administrator is marked away is shown below only
      // as a heads-up, it doesn't change whether Skip is offered.
      var canSkip = !lastDoc.mandatory;
      var draftOpts = Object.assign({}, lastDoc.opts, {signatures: lastDoc.signatures, unsigned:true, unsignedReason:"waiting for the administrator's signature"});
      var draftHtml = (pendingReceiptRenderFn || buildReceiptHTML)(draftOpts);
      openModal(
        '<div class="modal-head"><h3>'+esc(lastDoc.opts.title||'Receipt')+' — pending</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
        '<div style="max-height:50vh; overflow:auto; margin-bottom:14px">'+draftHtml+'</div>'+
        '<p class="hint" style="margin-top:-6px">Sent to the administrator — this usually takes a few minutes. You\'ll be notified the moment it\'s approved; you can safely close this and reopen it from Messages later.</p>'+
        (canSkip ? '<p class="hint" style="margin-top:4px">Not urgent enough to wait? Tap "Skip and send" below to finish with just your own signature'+(adminAway?' — the administrator is currently marked away':'')+'. They\'ll see it in Pending signatures either way.</p>' : '')+
        '<div class="modal-foot">'+
          '<button type="button" class="btn" data-action="close-modal">Close</button>'+
          (canSkip ? '<button type="button" class="btn" data-action="skip-pending-signoff:'+esc(id)+'">Skip and send</button>' : '')+
        '</div>'
      );
    }
    pendingSignoffUnsubDoc = db.collection('pendingSignoffs').doc(id).onSnapshot(function(snap){
      if(!snap.exists){ stopPendingSignoffWatch(); toast('That request no longer exists.'); closeModal(); return; }
      lastDoc = Object.assign({id:id}, snap.data());
      if(!pendingSignoffUnsubAdmin && lastDoc.adminUid){
        pendingSignoffUnsubAdmin = db.collection('users').doc(lastDoc.adminUid).onSnapshot(function(asnap){
          adminAway = !!(asnap.exists && asnap.data().away);
          draw();
        }, function(){});
      }
      draw();
    }, function(){ toast('Could not load this document right now.'); });
  }
  // Team member skips waiting and finishes with just their own signature —
  // available any time for a non-mandatory request (skipReceiptSignoff
  // re-checks "not mandatory" fresh on the server regardless of what the
  // client believes). The administrator is still notified immediately and
  // still sees it afterward in Pending signatures, just as an FYI instead
  // of something to approve.
  function skipPendingSignoff(id){
    confirmModal("Send this without waiting for the administrator's signature? They'll be notified immediately and will still see it under Pending signatures.", function(){
      if(!cloudMode){ toast('Needs an internet connection to finish this.'); return; }
      openModal('<div class="modal-head"><h3>Sending…</h3></div><p class="hint" style="margin:0">Finishing this document with just your signature.</p>');
      db.collection('pendingSignoffs').doc(id).get().then(function(snap){
        if(!snap.exists) throw Object.assign(new Error('That request no longer exists.'), {code:'client/gone'});
        var doc = snap.data();
        var fields = receiptCanonicalFields(doc.opts).concat(fieldObjectsToTuples(doc.firstSignerFields));
        return callFunctionResilient('signReceipt', {fields: fields}).then(function(res){
          var code = res.data && res.data.code;
          return callFunctionResilient('skipReceiptSignoff', {id: id, code: code}).then(function(){
            var finalOpts = Object.assign({}, doc.opts, {signatures: doc.signatures, verify: buildVerifyPayload(fields, code), unsigned:false});
            showSignedReceiptModal(finalOpts, pendingReceiptRenderFn || buildReceiptHTML, doc.opts.title);
          });
        });
      }).catch(function(err){
        toast((err && err.message) || 'Could not finish this — please try again.');
        showPendingSignoffModal(id);
      });
    }, {confirmLabel:'Skip and send', danger:false});
  }
  // Reopens a request from its Messages notification — whichever role is
  // looking at it: the administrator gets the review-and-sign modal if it's
  // still pending, everyone else (and anyone looking at an already-resolved
  // request) gets the live/finished view above.
  function openPendingSignoffFromMessage(id){
    if(!db){ toast('Needs an internet connection.'); return; }
    if(isAdminLevel()){
      db.collection('pendingSignoffs').doc(id).get().then(function(snap){
        if(!snap.exists){ toast('That request no longer exists.'); return; }
        var doc = snap.data();
        if(doc.status==='pending') openAdminReviewModal(id); else showPendingSignoffModal(id);
      }).catch(function(){ toast('Could not fetch that document right now.'); });
      return;
    }
    showPendingSignoffModal(id);
  }
  // Administrator's side: review a team member's half, add their own
  // signature, and call signReceipt with BOTH signers' fields combined —
  // this is the one and only moment the document actually becomes final.
  function openAdminReviewModal(id){
    if(!db){ toast('Needs an internet connection.'); return; }
    openModal('<div class="modal-head"><h3>Opening…</h3></div><p class="hint" style="margin:0">Fetching this document.</p>');
    db.collection('pendingSignoffs').doc(id).get().then(function(snap){
      if(!snap.exists){ toast('That request no longer exists.'); closeModal(); return; }
      var doc = snap.data();
      if(doc.status!=='pending'){ showPendingSignoffModal(id); return; }
      var draftOpts = Object.assign({}, doc.opts, {signatures: doc.signatures, unsigned:true, unsignedReason:'waiting for your signature'});
      var draftHtml = (pendingReceiptRenderFn || buildReceiptHTML)(draftOpts);
      openModal(
        '<div class="modal-head"><h3>Review &amp; sign</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
        '<p class="hint">From '+esc(doc.createdByLabel||doc.createdByRole)+'. Adding your signature finishes this document — it becomes downloadable to them right away.</p>'+
        '<div style="max-height:50vh; overflow:auto; margin-bottom:14px">'+draftHtml+'</div>'+
        '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn primary" data-action="approve-pending-signoff:'+esc(id)+'">Sign &amp; approve</button></div>'
      );
    }).catch(function(){ toast('Could not fetch that document right now.'); closeModal(); });
  }
  function approvePendingSignoff(id){
    if(!db){ toast('Needs an internet connection.'); return; }
    db.collection('pendingSignoffs').doc(id).get().then(function(snap){
      if(!snap.exists){ toast('That request no longer exists.'); closeModal(); return; }
      var doc = snap.data();
      if(doc.status!=='pending'){ toast('That request was already '+doc.status+'.'); showPendingSignoffModal(id); return; }
      var who = currentUser ? (currentUser.name || currentUser.email || 'Unknown') : 'Administrator';
      openSignaturePad(doc.opts.title, function(sigDataUrl, sigHash){
        var adminFields = [
          ['Signed by (Administrator)', who+' (Administrator)'],
          ['Signed at (Administrator)', new Date().toISOString()],
          ['Signature hash (Administrator)', sigHash]
        ];
        var fields = receiptCanonicalFields(doc.opts).concat(fieldObjectsToTuples(doc.firstSignerFields)).concat(adminFields);
        openModal('<div class="modal-head"><h3>Signing…</h3></div><p class="hint" style="margin:0">Getting a verification code for this document.</p>');
        if(!cloudMode){ toast('Approving needs an internet connection.'); showPendingSignoffModal(id); return; }
        callFunctionResilient('signReceipt', {fields: fields}).then(function(res){
          var code = res.data && res.data.code;
          return callFunctionResilient('approveReceiptSignoff', {id: id, signatureImg: sigDataUrl, adminFields: adminFields, code: code}).then(function(){
            var signatures = (doc.signatures||[]).map(function(s){ return s.role==='Administrator' ? Object.assign({}, s, {img: sigDataUrl}) : s; });
            var finalOpts = Object.assign({}, doc.opts, {signatures: signatures, verify: buildVerifyPayload(fields, code), unsigned:false});
            toast('Signed and approved.');
            showSignedReceiptModal(finalOpts, pendingReceiptRenderFn || buildReceiptHTML, doc.opts.title);
          });
        }).catch(function(err){
          toast((err && err.message) || 'Could not approve this — please try again.');
          openAdminReviewModal(id);
        });
      });
    }).catch(function(){ toast('Could not fetch that document right now.'); });
  }
  function signoffsPanel(){
    if(!isAdminLevel()) return '<div class="empty">'+ICONS.empty+'<div>Only the administrator sees this.</div></div>';
    if(!pendingSignoffsForAdmin.length) return '<div class="empty">'+ICONS.empty+'<div>Nothing here right now.</div></div>';
    function when(doc){ return (doc.createdAt && doc.createdAt.toDate) ? fmtDate(doc.createdAt.toDate(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Just now'; }
    var pending = pendingSignoffsForAdmin.filter(function(d){ return d.status==='pending'; });
    var skipped = pendingSignoffsForAdmin.filter(function(d){ return d.status==='skipped'; });
    var pendingSoPage = paginate('signoffs-pending', pending);
    var skippedPage = paginate('signoffs-skipped', skipped);
    var pendingRows = pendingSoPage.items.map(function(doc){
      return '<div class="card" style="margin-bottom:10px">'+
        '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">'+
          '<div>'+
            '<strong>'+esc(doc.opts.title||'Receipt')+'</strong> — '+esc(doc.opts.receiptNo||'')+
            '<div class="hint">From '+esc(doc.createdByLabel||doc.createdByRole)+' · '+when(doc)+(doc.mandatory?' · <strong>Withdrawal — cannot be skipped</strong>':'')+'</div>'+
          '</div>'+
          '<button class="btn primary" data-action="review-pending-signoff:'+esc(doc.id)+'">Review &amp; sign</button>'+
        '</div>'+
      '</div>';
    }).join('');
    var skippedRows = skippedPage.items.map(function(doc){
      return '<div class="card" style="margin-bottom:10px">'+
        '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">'+
          '<div>'+
            '<strong>'+esc(doc.opts.title||'Receipt')+'</strong> — '+esc(doc.opts.receiptNo||'')+
            '<div class="hint">From '+esc(doc.createdByLabel||doc.createdByRole)+' · '+when(doc)+' · <span class="role-pill pending">Skipped — already downloaded</span></div>'+
          '</div>'+
          '<button class="btn" data-action="open-pending-signoff:'+esc(doc.id)+'">View</button>'+
        '</div>'+
      '</div>';
    }).join('');
    return (pending.length ? '<p class="hint" style="margin-bottom:10px">Waiting on your signature before the team member can download them.</p>'+pendingRows+pagerHtml('signoffs-pending', pendingSoPage.pageCount, pendingSoPage.page) : '<div class="empty">'+ICONS.empty+'<div>Nothing waiting on your signature right now.</div></div>')+
      (skipped.length ? '<div class="card-title" style="margin-top:18px"><h3>Signed without you</h3><span class="hint">Sent on and already downloaded — nothing to do, just for your records</span></div>'+skippedRows+pagerHtml('signoffs-skipped', skippedPage.pageCount, skippedPage.page) : '');
  }
  function printReceiptNow(html){
    if(!html){ toast('That record is no longer available.'); return; }
    var area = document.getElementById('receipt-print-area');
    area.innerHTML = html;
    window.print();
  }
  function utf8ToBase64Url(str){
    var b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function base64UrlToUtf8(b64){
    var s = String(b64||'').replace(/-/g,'+').replace(/_/g,'/');
    while(s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  /* ============================= SIGNATURE PAD ============================= */
  var sigPadCanvas = null, sigPadCtx = null, sigPadDrawing = false, sigPadLastPt = null, sigPadOnConfirm = null, sigPadEndHandler = null;
  // Each completed pen stroke is kept as its own list of points (not just
  // pixels on the canvas) specifically so a single wrong stroke can be
  // undone on its own — "Clear all" wipes everything, "Undo last" only
  // removes the most recent stroke and redraws the rest from scratch.
  var sigPadStrokes = [];
  var sigPadCurrentStroke = null;
  function signaturePadModalHtml(personLabel){
    return '<div class="modal-head"><h3>Sign electronically</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
      '<p class="hint" style="margin-top:-4px">Draw your signature below to confirm you generated this '+esc(personLabel||'document')+'. It gets embedded in the receipt and locked into its verification code — if the receipt is edited afterward, the code stops matching.</p>'+
      '<div class="sigpad-wrap"><canvas id="sigpad-canvas" width="560" height="180"></canvas></div>'+
      '<div class="sigpad-hint">Use your mouse or finger to sign above.</div>'+
      '<div class="modal-foot">'+
        '<button type="button" class="btn" data-action="close-modal">Cancel</button>'+
        '<button type="button" class="btn" id="sigpad-undo-btn" disabled data-action="sigpad-undo">Undo last</button>'+
        '<button type="button" class="btn" data-action="sigpad-clear">Clear all</button>'+
        '<button type="button" class="btn primary" id="sigpad-confirm-btn" disabled data-action="sigpad-confirm">Confirm signature</button>'+
      '</div>';
  }
  function openSignaturePad(personLabel, onConfirm){
    sigPadOnConfirm = onConfirm;
    openModal(signaturePadModalHtml(personLabel));
    setupSignaturePad();
  }
  function setupSignaturePad(){
    sigPadCanvas = document.getElementById('sigpad-canvas');
    if(!sigPadCanvas) return;
    sigPadCtx = sigPadCanvas.getContext('2d');
    sigPadCtx.lineWidth = 3.6;
    sigPadCtx.lineCap = 'round';
    sigPadCtx.lineJoin = 'round';
    sigPadCtx.strokeStyle = '#000000';
    sigPadStrokes = []; sigPadCurrentStroke = null; sigPadDrawing = false; sigPadLastPt = null;
    updateSigPadButtons();
    function ptFromEvent(e){
      var rect = sigPadCanvas.getBoundingClientRect();
      var cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      var cy = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
      var scaleX = sigPadCanvas.width / rect.width, scaleY = sigPadCanvas.height / rect.height;
      return {x: (cx-rect.left)*scaleX, y: (cy-rect.top)*scaleY};
    }
    function start(e){
      e.preventDefault();
      sigPadDrawing = true;
      sigPadLastPt = ptFromEvent(e);
      sigPadCurrentStroke = [sigPadLastPt];
    }
    function move(e){
      if(!sigPadDrawing) return;
      e.preventDefault();
      var p = ptFromEvent(e);
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(sigPadLastPt.x, sigPadLastPt.y);
      sigPadCtx.lineTo(p.x, p.y);
      sigPadCtx.stroke();
      sigPadLastPt = p;
      if(sigPadCurrentStroke) sigPadCurrentStroke.push(p);
    }
    function end(){
      // Only a stroke with an actual line in it (2+ points) leaves a mark —
      // a plain tap with no drag draws nothing, so there's nothing to keep.
      if(sigPadCurrentStroke && sigPadCurrentStroke.length > 1) sigPadStrokes.push(sigPadCurrentStroke);
      sigPadDrawing = false; sigPadLastPt = null; sigPadCurrentStroke = null;
      updateSigPadButtons();
    }
    sigPadCanvas.addEventListener('mousedown', start);
    sigPadCanvas.addEventListener('mousemove', move);
    sigPadCanvas.addEventListener('touchstart', start, {passive:false});
    sigPadCanvas.addEventListener('touchmove', move, {passive:false});
    sigPadCanvas.addEventListener('touchend', end);
    if(sigPadEndHandler) window.removeEventListener('mouseup', sigPadEndHandler);
    sigPadEndHandler = end;
    window.addEventListener('mouseup', sigPadEndHandler);
  }
  function updateSigPadButtons(){
    var confirmBtn = document.getElementById('sigpad-confirm-btn');
    var undoBtn = document.getElementById('sigpad-undo-btn');
    var hasInk = sigPadStrokes.length > 0;
    if(confirmBtn) confirmBtn.disabled = !hasInk;
    if(undoBtn) undoBtn.disabled = !hasInk;
  }
  function redrawSigPadStrokes(){
    if(!sigPadCtx || !sigPadCanvas) return;
    sigPadCtx.clearRect(0, 0, sigPadCanvas.width, sigPadCanvas.height);
    sigPadStrokes.forEach(function(stroke){
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(stroke[0].x, stroke[0].y);
      for(var i=1; i<stroke.length; i++) sigPadCtx.lineTo(stroke[i].x, stroke[i].y);
      sigPadCtx.stroke();
    });
  }
  // Removes just the most recent pen stroke — for the common "one part of
  // the signature came out wrong" case, without losing everything else
  // already drawn correctly.
  function undoLastSignatureStroke(){
    if(!sigPadStrokes.length) return;
    sigPadStrokes.pop();
    redrawSigPadStrokes();
    updateSigPadButtons();
  }
  function clearSignaturePad(){
    if(!sigPadCtx || !sigPadCanvas) return;
    sigPadCtx.clearRect(0, 0, sigPadCanvas.width, sigPadCanvas.height);
    sigPadStrokes = [];
    updateSigPadButtons();
  }
  function confirmSignaturePad(){
    if(!sigPadCanvas || !sigPadStrokes.length) return;
    var dataUrl = sigPadCanvas.toDataURL('image/png');
    var cb = sigPadOnConfirm;
    sha256Hex(dataUrl).then(function(hash){
      if(cb) cb(dataUrl, hash);
    });
  }
  function sha256Hex(text){
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(function(buf){
      var bytes = new Uint8Array(buf), hex = '';
      for(var i=0;i<bytes.length;i++){ hex += bytes[i].toString(16).padStart(2,'0'); }
      return hex;
    });
  }

  /* ============================= VERIFY A RECEIPT ============================= */
  function verifyCheckerModalHtml(prefill){
    prefill = prefill || {};
    return '<div class="modal-head"><h3>Verify a receipt</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
      '<p class="hint" style="margin-top:-4px">Easiest way: on the device that signed the receipt, tap "Copy verify link" and paste it below — works on any other device, no scanning needed. You can also scan the QR code with your phone\'s camera, or paste the text printed under the QR on a paper receipt.</p>'+
      '<div class="field-row"><label>Details from the receipt (link, or the printed text)</label><textarea class="field" id="verify-blob-input" rows="4" placeholder="Paste the verify link, or the printed verification text, here">'+esc(prefill.blob||'')+'</textarea></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Verification code (only needed if it wasn\'t included above)</label><input class="field" id="verify-code-input" type="text" value="'+esc(prefill.code||'')+'" placeholder="XXXXX-XXXXX"></div>'+
      '<div id="verify-result-area"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn primary" data-action="run-verify-receipt">Check now</button></div>';
  }
  function openVerifyChecker(prefill){
    openModal(verifyCheckerModalHtml(prefill));
  }
  // Accepts whatever got pasted in — the raw base64url blob, raw JSON, or a
  // full verify link (https://.../?verify=<blob>&other=stuff) copied from
  // "Copy verify link" or scanned from the QR — and pulls out just the part
  // that actually needs decoding.
  function extractVerifyBlob(raw){
    var s = String(raw||'').trim();
    var m = s.match(/[?&#]verify=([^&#\s]+)/);
    return m ? decodeURIComponent(m[1]) : s;
  }
  function runVerifyReceipt(){
    var blobRaw = (document.getElementById('verify-blob-input')||{}).value || '';
    var codeRaw = (document.getElementById('verify-code-input')||{}).value || '';
    var resultArea = document.getElementById('verify-result-area');
    var blob = extractVerifyBlob(blobRaw);
    var fields, parsedCode;
    try{
      var parsed = JSON.parse(blob.indexOf('{')===0 ? blob : base64UrlToUtf8(blob));
      fields = parsed.fields;
      parsedCode = parsed.code;
    }catch(e){
      if(resultArea) resultArea.innerHTML = '<div class="verify-result bad">Couldn\'t read those details — paste the verify link or the exact text printed on the receipt, unedited.</div>';
      return;
    }
    var code = (codeRaw || parsedCode || '').trim();
    if(!code || !fields){
      if(resultArea) resultArea.innerHTML = '<div class="verify-result bad">Missing the verification code or receipt details.</div>';
      return;
    }
    if(resultArea) resultArea.innerHTML = '<div class="hint">Checking…</div>';
    callFunctionResilient('verifyReceipt', {fields: fields, code: code}).then(function(res){
      if(!resultArea) return;
      var fieldsHtml = fields.map(function(f){ return '<div class="kv-row"><span>'+esc(f[0])+'</span><span>'+esc(f[1])+'</span></div>'; }).join('');
      if(res.data && res.data.valid){
        resultArea.innerHTML = '<div class="verify-result good">'+ICONS.verify+' This receipt is genuine and matches what was originally signed.</div><div class="verify-fields">'+fieldsHtml+'</div>';
      } else {
        resultArea.innerHTML = '<div class="verify-result bad">'+ICONS.close+' This does not check out — the code doesn\'t match these details. Something may have been altered.</div><div class="verify-fields">'+fieldsHtml+'</div>';
      }
    }).catch(function(err){
      if(resultArea) resultArea.innerHTML = '<div class="verify-result bad">Could not check right now — '+esc((err&&err.message)||'try again shortly.')+'</div>';
    });
  }
  // If someone opens the app from a QR code / verify link, auto-open the
  // checker pre-filled with what the QR encoded — they still have to press
  // "Check now" themselves, so a glance at the pre-filled fields against the
  // printed paper still catches an obvious mismatch before they even check.
  function checkVerifyLinkOnLoad(){
    try{
      var params = new URLSearchParams(window.location.search);
      var v = params.get('verify');
      if(!v) return;
      var parsed = JSON.parse(base64UrlToUtf8(v));
      openVerifyChecker({blob: JSON.stringify(parsed), code: parsed.code});
    }catch(e){ /* not a valid verify link — ignore */ }
  }

  /* ============================= CUSTOMERS ============================= */
  // A lightweight buyer directory that mostly builds itself: whenever a
  // Flock or Egg sale is recorded with a name in "Sold to", that name is
  // matched (case-insensitively) to an existing customer or turned into a
  // new one automatically — no separate "save this buyer" step. Someone who
  // only ever sells one-off at the local market can just leave "Sold to"
  // blank, or type something generic like "Local market", and it becomes
  // its own low-effort running total rather than cluttering real names.
  // Purchase totals are always computed fresh from the actual sale records
  // (never stored redundantly on the customer itself), the same way feed
  // and health stats are computed from their own logs elsewhere in the app.
  function resolveOrCreateCustomer(s, rawName){
    var name = String(rawName||'').trim();
    if(!name) return null;
    if(!Array.isArray(s.customers)) s.customers = [];
    var existing = s.customers.find(function(c){ return c.name.toLowerCase()===name.toLowerCase(); });
    if(existing) return existing.id;
    var rec = {id:uid('cust'), name:name, phone:'', note:'', createdDate:todayISO()};
    s.customers.push(rec);
    return rec.id;
  }
  function customerSoldRecords(customerId){
    var out = [];
    state.flock.forEach(function(b){
      (b.removals||[]).forEach(function(r){ if(r.reason==='sold' && r.customerId===customerId) out.push({date:r.date, amount:r.saleAmount||0, kind:'flock'}); });
    });
    (state.eggLosses||[]).forEach(function(x){
      if(x.reason==='sold' && x.customerId===customerId) out.push({date:x.date, amount:x.saleAmount||0, kind:'egg'});
    });
    return out;
  }
  function customerStats(customerId){
    var recs = customerSoldRecords(customerId);
    var totalSpent = recs.reduce(function(a,r){return a+r.amount;},0);
    var lastDate = recs.length ? recs.reduce(function(a,r){return r.date>a?r.date:a;}, recs[0].date) : null;
    return { count: recs.length, totalSpent: totalSpent, lastDate: lastDate };
  }
  function customerNamesDatalist(){
    return '<datalist id="customer-names-list">'+state.customers.map(function(c){ return '<option value="'+esc(c.name)+'">'; }).join('')+'</datalist>';
  }
  function customersPanel(){
    var list = (state.customers||[]).slice().map(function(c){ return Object.assign({}, c, customerStats(c.id)); })
      .sort(function(a,b){ return b.totalSpent-a.totalSpent; });
    var custPage = paginate('customers', list);
    var rows = custPage.items.map(function(c){
      return '<tr><td>'+esc(c.name)+'</td><td>'+esc(c.phone||'—')+'</td><td class="num">'+fmtMoney(c.totalSpent)+'</td><td class="num">'+c.count+'</td>'+
      '<td>'+(c.lastDate?fmtDate(parseISO(c.lastDate)):'—')+'</td><td>'+esc(c.note||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="edit-customer:'+c.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-customer:'+c.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');
    var totalAcrossAll = list.reduce(function(a,c){return a+c.totalSpent;},0);
    return '<div class="grid stats">'+
      statTile('Customers', list.length.toLocaleString(), '')+
      statTile('Total sales linked to a buyer', fmtMoney(totalAcrossAll), '')+
    '</div>'+
    '<div class="card"><div class="card-title"><h3>Directory</h3><span class="hint">'+list.length+' recorded'+'</span></div>'+
      '<p class="hint" style="margin-top:-4px; margin-bottom:12px">Builds itself from "Sold to" on Flock and Egg sales — add one here only to save contact details ahead of their first sale.</p>'+
      '<div class="table-wrap">'+
      (list.length ? '<table><thead><tr><th>Name</th><th>Phone</th><th class="num">Total spent</th><th class="num">Purchases</th><th>Last purchase</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No customers yet — they\'ll show up here as soon as a sale names a buyer.</div></div>')+
      '</div>'+pagerHtml('customers', custPage.pageCount, custPage.page)+'</div>';
  }
  function customerFormHtml(id){
    var c = id ? state.customers.find(function(x){return x.id===id;}) : null;
    return '<div class="modal-head"><h3>'+(c?'Edit customer':'Add customer')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="customer">'+
      '<input type="hidden" name="id" value="'+(c?c.id:'')+'">'+
      '<div class="field-row"><label>Name</label><input class="field" type="text" name="name" value="'+(c?esc(c.name):'')+'" required autofocus></div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Phone (optional)</label><input class="field" type="text" name="phone" value="'+(c?esc(c.phone||''):'')+'" placeholder="07xx xxx xxx"></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(c?esc(c.note||''):'')+'" placeholder="Optional"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(c?'Save changes':'Add customer')+'</button></div>'+
    '</form>';
  }

  /* ============================= EXPENSES / INCOME ============================= */
  // Admin-only "could my eggs cover this spend" indicator — see
  // EGG_UNIT_VALUE_KSH / eggsAvailableCount above for why this is kept
  // completely separate from real income (Income → Egg Sales already
  // records actual money from eggs sold; this is a hypothetical asset
  // value on top, never summed into it). The egg-asset value itself is a
  // single running stock figure (on hand right now), weighed here against
  // each period's actual spend — it's the same number in every row on
  // purpose, since eggs on hand don't reset at the start of a week/month.
  function eggAssetCoverageCardHTML(){
    if(!isAdmin()) return '';
    var eggsOnHand = eggsAvailableCount();
    var eggValue = eggAssetValueTotal();
    var periodsDef = [['day','Today'],['week','This week'],['month','This month'],['year','This year']];
    var rows = periodsDef.map(function(pd){
      var r = getRange(pd[0]);
      var expenseTotal = sumMoney(state.expenses, r.startISO, r.endISO);
      var net = expenseTotal - eggValue;
      var netColor = net<=0 ? 'var(--good)' : 'var(--bad)';
      var netText = net<=0 ? 'Covered, '+fmtMoney(Math.abs(net))+' to spare' : fmtMoney(net)+' short';
      return '<tr><td>'+pd[1]+'</td><td class="num">'+fmtMoney(expenseTotal)+'</td><td class="num" style="color:'+netColor+'">'+netText+'</td></tr>';
    }).join('');
    return '<div class="card"><div class="card-title"><h3>Egg assets vs. spend</h3><span class="hint">Only visible to you</span></div>'+
      '<div class="hint" style="margin-bottom:10px">'+eggsOnHand.toLocaleString()+' eggs on hand right now × KSh '+EGG_UNIT_VALUE_KSH+' = <strong style="color:var(--ink)">'+fmtMoney(eggValue)+'</strong> in egg assets. Weighed against expenses below — never counted as income.</div>'+
      '<div class="table-wrap"><table><thead><tr><th>Period</th><th class="num">Expenses</th><th class="num">Net after egg value</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '</div>';
  }
  function moneyBreakdownPanel(list, categories, kind){
    var moneyNavHtml = moneyCrossNavHTML(kind==='expense'?'expenses':'income');
    var periodsDef = [['day','Today'],['week','This week'],['month','This month'],['year','This year']];
    var cards = periodsDef.map(function(pd){
      var r = getRange(pd[0]);
      var total = sumMoney(list, r.startISO, r.endISO);
      var breakdown = breakdownByCategory(list, r.startISO, r.endISO);
      return '<div class="card"><div class="card-title"><h3>'+pd[1]+'</h3><span class="hint num">'+fmtMoney(total)+'</span></div>'+categoryBars(breakdown)+'</div>';
    }).join('');

    var entries = list.slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var moneyPage = paginate(kind+'-log', entries);
    var rows = moneyPage.items.map(function(x){
      return '<tr><td>'+fmtDate(parseISO(x.date))+'</td><td><span class="pill">'+esc(x.category)+'</span></td><td class="num">'+fmtMoney(x.amount)+'</td><td>'+esc(x.note||'—')+(x.photoURL?' 📷':'')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="view-'+kind+'-receipt:'+x.id+'" title="View receipt">'+ICONS.receipt+'</button>'+
        '<button class="icon-btn" data-action="edit-'+kind+':'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        '<button class="icon-btn" data-action="delete-'+kind+':'+x.id+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>'+
      '</div></td></tr>';
    }).join('');

    return moneyNavHtml+'<div class="grid four">'+cards+'</div>'+
    (kind==='expense' ? eggAssetCoverageCardHTML() : '')+
    '<div class="card"><div class="card-title"><h3>All '+(kind==='expense'?'expenses':'income')+'</h3><span class="hint">'+entries.length+' records</span></div>'+
      '<div class="table-wrap">'+
      (entries.length ? '<table><thead><tr><th>Date</th><th>Category</th><th class="num">Amount</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>Nothing recorded yet.</div></div>')+
      '</div>'+pagerHtml(kind+'-log', moneyPage.pageCount, moneyPage.page)+'</div>';
  }
  function moneyFormHtml(kind,id){
    var list = kind==='expense' ? state.expenses : state.incomes;
    var categories = kind==='expense' ? state.settings.expenseCategories : state.settings.incomeCategories;
    var x = id ? list.find(function(i){return i.id===id;}) : null;
    var curAmount = x ? (x.amount * rateOf(state.settings.displayCurrency)).toFixed(2) : '';
    return '<div class="modal-head"><h3>'+(x?'Edit '+kind:'Add '+kind)+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="'+kind+'">'+
      '<input type="hidden" name="id" value="'+(x?x.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(x?x.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
        '<div class="field-row"><label>Category</label><select class="field" name="category">'+categories.map(function(c){ return '<option '+(x&&x.category===c?'selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select></div>'+
      '</div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Amount</label><input class="field" type="number" min="0" step="0.01" name="amount" value="'+curAmount+'" required></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="currency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(x?esc(x.note||''):'')+'" placeholder="Optional"></div>'+
      (kind==='expense' ? attachPhotoBlockHtml('expense', x?x.id:null, x&&x.photoURL) : '')+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(x?'Save changes':'Add '+kind)+'</button></div>'+
    '</form>';
  }

  /* ============================= SETTINGS ============================= */
  function categoryListHTML(type){
    var list = type==='expense' ? state.settings.expenseCategories : state.settings.incomeCategories;
    var usage = {};
    (type==='expense' ? state.expenses : state.incomes).forEach(function(x){ usage[x.category]=true; });
    var rows = list.map(function(c){
      return '<div class="kv-row"><span>'+esc(c)+'</span>'+(usage[c] ? '<span class="hint">in use</span>' : '<button class="icon-btn" data-action="delete-category:'+type+':'+esc(c)+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>')+'</div>';
    }).join('');
    return '<div>'+rows+'</div>'+
    '<form data-form="category-'+type+'" style="display:flex; gap:8px; margin-top:12px">'+
      '<input class="field" type="text" name="name" placeholder="New category name" required>'+
      '<button class="btn" type="submit" '+(readOnly?'disabled':'')+'>Add</button>'+
    '</form>';
  }
  function settingsPanel(){
    var currRows = Object.entries(state.settings.currencies).map(function(entry){
      var code=entry[0], c=entry[1];
      return '<tr><td>'+code+(code==='KES'?' <span class="hint">(base)</span>':'')+'</td><td>'+esc(c.symbol)+'</td><td class="num">'+c.rate+'</td><td class="num">'+c.decimals+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="icon-btn" data-action="open-edit-currency:'+code+'" '+(readOnly?'disabled':'')+'>'+ICONS.edit+'</button>'+
        (code!=='KES' ? '<button class="icon-btn" data-action="delete-currency:'+code+'" '+(readOnly?'disabled':'')+'>'+ICONS.trash+'</button>' : '')+
      '</div></td></tr>';
    }).join('');

    var lang = (state.settings.language)||'en';
    var trashCount = visibleTrashItems().length;
    return (currentUser ? accountCardHTML() : guestAccountCardHTML())+
    '<div class="card"><div class="card-title"><h3>Trash</h3><span class="hint">'+trashCount+' item'+(trashCount===1?'':'s')+' — recoverable for 30 days</span></div>'+
      '<button class="btn" data-action="nav:trash">'+ICONS.trash+' Open Trash</button>'+
    '</div>'+
    '<div class="card"><div class="card-title"><h3>Language</h3><span class="hint">Covers navigation, page headers, and common buttons so far</span></div>'+
      '<div style="display:flex; gap:10px">'+
        '<button class="btn '+(lang==='en'?'primary':'')+'" data-action="set-language:en">English</button>'+
        '<button class="btn '+(lang==='sw'?'primary':'')+'" data-action="set-language:sw">Kiswahili</button>'+
      '</div>'+
    '</div>'+
    '<div class="card">'+
      '<div class="card-title"><h3>Currencies</h3><span class="hint">Rates are set by you — there\'s no internet access to fetch live rates.</span></div>'+
      '<div class="table-wrap"><table><thead><tr><th>Code</th><th>Symbol</th><th class="num">Rate (per 1 KES)</th><th class="num">Decimals</th><th></th></tr></thead><tbody>'+currRows+'</tbody></table></div>'+
      '<div style="margin-top:14px; display:flex; gap:16px; align-items:flex-end; flex-wrap:wrap">'+
        '<button class="btn" data-action="open-add-currency" '+(readOnly?'disabled':'')+'>'+ICONS.plus+' Add currency</button>'+
        '<div class="field-row" style="max-width:180px"><label>Display currency</label><select class="field" data-change="display-currency">'+currencyOptions()+'</select></div>'+
      '</div></div>'+
    '<div class="grid two">'+
      '<div class="card"><div class="card-title"><h3>Expense categories</h3></div>'+categoryListHTML('expense')+'</div>'+
      '<div class="card"><div class="card-title"><h3>Income categories</h3></div>'+categoryListHTML('income')+'</div>'+
    '</div>'+
    '<div class="card"><div class="card-title"><h3>Backup</h3><span class="hint">Keep a copy of your records</span></div>'+
      '<div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">'+
        '<button class="btn" data-action="export-backup">Download backup (.json)</button>'+
        '<label class="btn" style="margin:0">Restore from backup<input type="file" accept="application/json" data-change="import-file" style="display:none"></label>'+
      '</div>'+
      '<p class="hint" style="margin-top:10px">Restoring replaces everything currently in the app with the contents of the backup file.</p>'+
    '</div>'+
    '<div class="card"><div class="card-title"><h3>About this app</h3></div>'+
      '<div class="kv-row"><span>Version</span><span class="num">'+APP_VERSION+'</span></div>'+
      '<p class="hint" style="margin-top:8px">When a new version is published, you\'ll see an "Update available" notice with a Refresh button the next time you open the app — refreshing always gets you the latest build.</p>'+
    '</div>';
  }
  function currencyFormHtml(code){
    var c = code ? state.settings.currencies[code] : null;
    return '<div class="modal-head"><h3>'+(c?'Edit currency':'Add currency')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="currency">'+
      '<input type="hidden" name="prevCode" value="'+(code||'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Code</label><input class="field" type="text" name="code" maxlength="4" style="text-transform:uppercase" value="'+(code||'')+'" '+(code==='KES'?'readonly':'')+' required></div>'+
        '<div class="field-row"><label>Symbol</label><input class="field" type="text" name="symbol" value="'+(c?esc(c.symbol):'')+'" required></div>'+
        '<div class="field-row"><label>Rate (units per 1 KES)</label><input class="field" type="number" step="0.0001" min="0" name="rate" value="'+(c?c.rate:'')+'" '+(code==='KES'?'readonly':'')+' required></div>'+
        '<div class="field-row"><label>Decimal places</label><select class="field" name="decimals"><option value="0" '+(c&&c.decimals===0?'selected':'')+'>0</option><option value="2" '+(!c||c.decimals===2?'selected':'')+'>2</option></select></div>'+
      '</div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }

  /* ============================= ROLES & ACCESS ============================= */
  // currentUser: null (signed out / guest) or { uid, email, role, jobTitle }.
  // role is 'administrator' or 'employee'; jobTitle (employees only) is one
  // of JOB_TITLES below. These mirror the Firebase Auth custom claims set by
  // the roles.js Cloud Functions — the claims are the actual source of
  // truth (and what Firestore security rules check), this is just a local
  // copy for rendering.
  var JOB_TITLE_LABELS = { supervisor:'Supervisor', vet:'Vet / Doctor', financial:'Financial Staff', farmhand:'Farmhand' };
  function jobTitleLabel(jt){ return JOB_TITLE_LABELS[jt] || jt || '—'; }
  function roleLabel(u){
    if(!u) return 'Guest';
    if(u.role==='administrator') return 'Administrator';
    if(u.role==='coadmin') return 'Co-Administrator';
    return jobTitleLabel(u.jobTitle);
  }
  // A sensible starting draft for "About" — the obvious, generic version of
  // what each role does — so nobody's Team Directory card ever sits blank.
  // Only ever used when the person hasn't written their own yet (see
  // directoryPanel/profileEditFormHTML below); the moment they save
  // anything of their own, that replaces this everywhere, including here.
  var DEFAULT_ABOUT_BY_ROLE = {
    administrator: 'Runs Kenokip Farm day to day — the final word on the flock, the money, and the team.',
    coadmin: 'A second administrator on Kenokip Farm — same access as the administrator, except final say on Finance.',
    supervisor: 'Oversees daily farm operations — keeping the flock, feed, and records on track.',
    vet: 'Looks after the health of the flock — vaccinations, treatments, and checkups.',
    financial: "Manages the farm's money — recording expenses, income, and receipts.",
    farmhand: 'Handles the day-to-day farm work — feeding, egg collection, and general upkeep.'
  };
  function defaultAboutForRole(u){
    if(!u) return '';
    var key = u.role==='administrator' ? 'administrator' : (u.role==='coadmin' ? 'coadmin' : u.jobTitle);
    return DEFAULT_ABOUT_BY_ROLE[key] || 'Part of the Kenokip Farm team.';
  }
  function isAdmin(){ return !!currentUser && currentUser.role==='administrator'; }
  // Co-Administrator: a second admin-level account (see roles.js) — same
  // access as the administrator almost everywhere (isAdminLevel() below),
  // except Finance authority (editing/deleting entries, approving pending
  // ones, opening/setting balances, sending M-Pesa payouts, clearing a
  // Finance lock), which stays isAdmin()-only, and the administrator's own
  // account, which a Co-Administrator can never edit, disable, or delete
  // (enforced server-side in updateStaffAccount/deleteStaffAccount).
  function isCoAdmin(){ return !!currentUser && currentUser.role==='coadmin'; }
  function isAdminLevel(){ return isAdmin() || isCoAdmin(); }
  function isFinancialStaffUser(){ return !!currentUser && currentUser.role==='employee' && currentUser.jobTitle==='financial'; }
  function isSupervisorUser(){ return !!currentUser && currentUser.role==='employee' && currentUser.jobTitle==='supervisor'; }
  function isVetUser(){ return !!currentUser && currentUser.role==='employee' && currentUser.jobTitle==='vet'; }
  function isFarmhandUser(){ return !!currentUser && currentUser.role==='employee' && currentUser.jobTitle==='farmhand'; }
  function canSeeFinance(){ return isAdmin() || isCoAdmin() || isFinancialStaffUser(); }
  function canProposeFinance(){ return canSeeFinance(); }
  // Each employee only sees the pages that match their job — matches what
  // roles.js sets as custom claims and what firestore.rules enforces on the
  // server, so this is a convenience (hide what you can't use) on top of a
  // real restriction, not the restriction itself. The administrator and
  // anyone not signed in (guest/demo mode) are unaffected — this only
  // narrows things down for a signed-in *employee* account.
  function sectionAllowed(key){
    if(isAdminLevel() || !currentUser) return sectionAllowedUngated(key);
    switch(key){
      case 'finance':
      case 'reports':
      case 'expenses':
      case 'income':
        return isFinancialStaffUser();
      case 'flock':
      case 'eggs':
      case 'feed':
        return isSupervisorUser() || isFarmhandUser();
      case 'health':
        return isSupervisorUser() || isVetUser();
      case 'customers':
        return isSupervisorUser();
      case 'team':
      case 'signoffs':
        return false;
      case 'directory':
        return !!currentUser;
      default:
        return sectionAllowedUngated(key);
    }
  }
  // The pre-role-restrictions rule set — still applies as-is to the
  // administrator and to guest/demo mode (no employee jobTitle to restrict
  // by), and as the fallback for sections switch() above doesn't mention
  // (overview, about, settings, messages).
  function sectionAllowedUngated(key){
    if(key==='finance') return canSeeFinance();
    if(key==='reports') return canSeeFinance();
    if(key==='team') return isAdminLevel();
    if(key==='signoffs') return isAdminLevel();
    if(key==='messages') return !!currentUser;
    if(key==='directory') return !!currentUser;
    return true;
  }
  function accountCardHTML(){
    if(!currentUser) return '';
    var notifSupported = (typeof Notification !== 'undefined');
    var notifPerm = notifSupported ? Notification.permission : 'unsupported';
    var notifRowHtml;
    if(!notifSupported){
      notifRowHtml = '<span class="hint">Background alerts aren\'t supported in this browser.</span>';
    } else if(notifPerm==='granted'){
      notifRowHtml = '<span class="hint">✓ Urgent messages can pop up on this device even when you\'re not looking at the app.</span>';
    } else if(notifPerm==='denied'){
      notifRowHtml = '<span class="hint">Background alerts are blocked for this site — turn on notifications for it in your browser\'s site settings to enable this.</span>';
    } else {
      notifRowHtml = '<button class="btn" data-action="enable-notifications">Enable background urgent alerts</button>';
    }
    return '<div class="card"><div class="card-title"><h3>Your account</h3><span class="role-pill '+(isAdminLevel()?'admin':'')+'">'+esc(roleLabel(currentUser))+'</span></div>'+
      '<p class="hint">Signed in as '+esc(currentUser.email||'')+'.'+
      (idleTimeoutApplies() ? ((isAdminLevel()||isFinancialStaffUser())
        ? ' For the safety of financial data, this account signs out automatically after 10 minutes of inactivity — using the app (even in another tab) keeps you signed in, and it applies in the background too.'
        : ' This account signs out automatically after 5 hours of inactivity — using the app (even in another tab) keeps you signed in, and it applies in the background too.') : '')+
      '</p>'+
      '<form data-form="update-own-name" style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap; margin-bottom:14px">'+
        '<div class="field-row" style="max-width:220px"><label>Your name (shown in messages)</label><input class="field" type="text" name="name" maxlength="60" placeholder="e.g. John" value="'+esc(currentUser.name||'')+'"></div>'+
        '<button class="btn" type="submit">Save name</button>'+
      '</form>'+
      '<div style="margin-bottom:14px">'+notifRowHtml+
        '<p class="hint" style="margin-top:6px">This lets an <strong>Urgent</strong> message pop up as a notification on this device while the app or browser is running in the background (another tab, minimized, or your phone locked with it still open) — not while it\'s fully closed. Needs to be turned on once per device.</p>'+
      '</div>'+
      '<div style="margin-bottom:14px"><button type="button" class="btn" data-action="open-set-own-dob">'+ICONS.cake+' '+(myDob?'Change your birthday':'Set your birthday')+'</button>'+
        (myDob ? ' <span class="hint">Currently: '+esc(fmtDate(new Date(myDob+'T00:00:00')))+'</span>' : ' <span class="hint">Kept private — see Team Directory for who else can see it.</span>')+
      '</div>'+
      (canSeeFinance() ? authAppSectionHTML() : '')+
      (isAdmin() ? birthdayPinSectionHTML() : '')+
      (isAdmin() ? awayToggleHTML() : '')+
      '<div style="display:flex; gap:10px; flex-wrap:wrap">'+
        '<button class="btn" data-action="open-change-password">Change password</button>'+
        '<button class="btn ghost" data-action="signout">Sign out</button>'+
      '</div>'+
    '</div>';
  }
  // Administrator-only "I'm away" switch — the whole point of the
  // co-signing skip path (see signAndPreviewReceipt / the "Pending
  // signatures" panel) is that a team member instantly knows whether
  // waiting for a real-time approval makes sense right now, without
  // guessing or having to ask. It's a manual switch you control yourself,
  // not automatic detection — flip it off again as soon as you're back.
  function awayToggleHTML(){
    var away = !!(currentUser && currentUser.away);
    return '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap">'+
      '<div>'+
        '<strong>'+(away?"You're marked away":"You're marked available")+'</strong>'+
        '<p class="hint" style="margin:2px 0 0">'+(away
          ? 'Team members signing a document that also needs your signature will see a "Skip and send" option (except withdrawals — those always wait for you).'
          : 'Team members signing a document that also needs your signature will wait for you to review and approve it before they can download it.')+'</p>'+
      '</div>'+
      '<button type="button" class="btn '+(away?'primary':'')+'" data-action="toggle-away">'+(away?"I'm back — mark available":"Mark myself away")+'</button>'+
    '</div>';
  }
  function authAppSectionHTML(){
    var enrolled = !!(currentUser && currentUser.totpEnrolled);
    var portalEnrolled = !!(currentUser && currentUser.portalTotpEnrolled);
    return '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px">'+
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.shield+'</span><strong>Authenticator app</strong></div>'+
      (enrolled
        ? '<p class="hint">✓ Set up on this account — codes from it are needed to reveal Finance amounts and to send money via M-Pesa.</p>'+
          '<button class="btn sm" data-action="open-authapp-setup">Set up on a new device</button>'
        : '<p class="hint">Not set up yet. Once it is, revealing Finance amounts and sending money via M-Pesa will require a code from an app like Google Authenticator or Authy.</p>'+
          '<button class="btn sm primary" data-action="open-authapp-setup">Set up authenticator app</button>')+
    '</div>'+
    '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px">'+
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.shield+'</span><strong>Finance portal authenticator</strong></div>'+
      (portalEnrolled
        ? '<p class="hint">✓ Set up — this is a separate code (its own entry in your authenticator app) needed, along with the Finance portal password, to open Finance at all.</p>'+
          '<button class="btn sm" data-action="open-portal-authapp-setup">Set up on a new device</button>'
        : '<p class="hint">Not set up yet. This is a second, separate code from the one above — set it up here, then ask the administrator for the Finance portal password, to be able to open Finance.</p>'+
          '<button class="btn sm primary" data-action="open-portal-authapp-setup">Set up Finance portal authenticator</button>')+
    '</div>'+
    financeFingerprintPinSectionHTML();
  }
  // Fingerprint/Face + personal PIN — a faster alternative to the password
  // + authenticator-code method above, not a replacement for it (that one
  // still works exactly as before). Both your PIN and enrolled devices are
  // yours alone; nobody else, including the administrator, can see or use
  // them, and losing one without the other still can't unlock Finance.
  function financeFingerprintPinSectionHTML(){
    var supported = webauthnSupported();
    var gs = financeGuardStatus;
    var devices = (gs && gs.fingerprintDevices) || [];
    var deviceRows = devices.map(function(d){
      return '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-top:1px solid var(--border, #eee)">'+
        '<span><span class="inline-ico" style="width:14px; height:14px; vertical-align:-2px">'+ICONS.fingerprint+'</span> '+esc(d.label||'A device')+(d.addedAt?' <span class="hint">— added '+fmtDate(new Date(d.addedAt))+'</span>':'')+'</span>'+
        '<button class="icon-btn" data-action="remove-finance-fingerprint:'+esc(d.id||'')+'" title="Remove">'+ICONS.trash+'</button>'+
      '</div>';
    }).join('');
    return '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px">'+
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.fingerprint+'</span><strong>Fingerprint / Face unlock for Finance</strong></div>'+
      (!supported
        ? '<p class="hint">This browser doesn\'t support it yet — try an up-to-date Chrome, Edge, or Safari. The password + code method above always works.</p>'
        : (!gs
          ? '<p class="hint">Loading…</p>'
          : ((gs.fingerprintEnrolled ? '<div style="margin-bottom:8px">'+deviceRows+'</div>' : '<p class="hint">Not set up yet. Once it is, you can open the Finance portal with your fingerprint or Face unlock plus your personal PIN below, instead of the password + code.</p>')+
            '<button class="btn sm '+(gs.fingerprintEnrolled?'':'primary')+'" data-action="enroll-finance-fingerprint">'+ICONS.fingerprint+' '+(gs.fingerprintEnrolled?'Add this device':'Set up fingerprint / Face unlock')+'</button>')))+
    '</div>'+
    '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px">'+
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.lockClosed+'</span><strong>Your personal Finance PIN</strong></div>'+
      '<p class="hint">Required together with fingerprint/Face unlock above — yours alone, separate from the shared Finance portal password and from your own sign-in password. Nobody else knows it, not even the administrator.</p>'+
      (gs && gs.pinSet ? '<p class="hint">✓ A PIN is set.</p>' : '')+
      '<form data-form="set-finance-pin" style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap">'+
        '<div class="field-row" style="max-width:160px"><label>'+(gs && gs.pinSet ? 'New PIN' : 'PIN')+' (4–8 digits)</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin" required></div>'+
        '<div class="field-row" style="max-width:160px"><label>Confirm PIN</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin2" required></div>'+
        '<button class="btn" type="submit">'+(gs && gs.pinSet ? 'Change PIN' : 'Set PIN')+'</button>'+
      '</form>'+
    '</div>';
  }
  // Dedicated Birthday PIN — administrator only, entirely separate from the
  // Finance PIN above (its own hash, its own lockout — see privacyGuard.js).
  // This is what's asked for in Team Directory before anyone else's date of
  // birth unmasks; yours and your own account's Finance PIN are unaffected
  // either way.
  function birthdayPinSectionHTML(){
    var bgs = birthdayGuardStatus;
    return '<div style="margin-bottom:14px; padding:12px; border:1px solid var(--border, #ddd); border-radius:10px">'+
      '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.cake+'</span><strong>Birthday PIN</strong></div>'+
      '<p class="hint">A separate, dedicated PIN — not your Finance PIN, not your sign-in password — needed to reveal any team member\'s date of birth in Team Directory. Nobody else knows it.</p>'+
      (bgs===null ? '<p class="hint">Loading…</p>' : (
        (bgs.pinSet ? '<p class="hint">✓ A PIN is set.</p>' : '')+
        (bgs.locked
          ? '<p class="hint" style="color:var(--bad, #b3261e)">🔒 Locked after repeated wrong attempts.</p>'+
            '<button type="button" class="btn sm" data-action="clear-birthday-lock">Clear lock</button>'
          : '<form data-form="set-birthday-pin" style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap">'+
              '<div class="field-row" style="max-width:160px"><label>'+(bgs.pinSet ? 'New PIN' : 'PIN')+' (4–8 digits)</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin" required></div>'+
              '<div class="field-row" style="max-width:160px"><label>Confirm PIN</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin2" required></div>'+
              '<button class="btn" type="submit">'+(bgs.pinSet ? 'Change PIN' : 'Set PIN')+'</button>'+
            '</form>')
      ))+
    '</div>';
  }

  /* ---- full-screen real-photo viewer (Flock/Eggs icons + page banners) ---- */
  function openPhotoLightbox(key){
    var src = FARM_PHOTOS.lightbox[key];
    if(!src) return;
    var box = document.getElementById('photo-lightbox');
    var img = document.getElementById('photo-lightbox-img');
    if(!box || !img) return;
    img.src = src;
    box.hidden = false;
  }
  function closePhotoLightbox(){
    var box = document.getElementById('photo-lightbox');
    if(box) box.hidden = true;
  }
  /* ---- sign-in gate (shown before the app is usable) ---- */
  var authGateMode = 'welcome'; // 'welcome' | 'signin' | 'forgot'
  var authGateError = '';
  var authGateNotice = '';
  function updateAuthGate(){
    var gate = document.getElementById('auth-gate');
    if(!gate) return;
    if(currentUser || guestMode){ gate.hidden = true; gate.innerHTML = ''; return; }
    gate.hidden = false;
    gate.innerHTML = authGateHtml();
  }
  // Split sign-in screen: a real farm photo (with the owner's own portrait
  // and a short line about the farm, styled like a testimonial) on one side,
  // the actual sign-in form on the other. The photo side hides on narrow
  // screens (see .auth-photo-panel media query) so the form is never cramped.
  function authGatePhotoPanelHtml(){
    return '<div class="auth-photo-panel">'+
      '<div class="auth-photo-half portrait-half" style="background-image:url(\''+FARM_PHOTOS.portraitHalf+'\')">'+
        '<div class="auth-photo-caption"><strong>Enock Kiplangat</strong><span>Founder, Kenokip Farm</span></div>'+
      '</div>'+
      '<div class="auth-photo-half" style="background-image:url(\''+FARM_PHOTOS.heroHalf+'\')">'+
        '<div class="auth-photo-quote"><p>"I built Kenokip Farm to keep track of my own flock, eggs, and finances — properly, every day."</p></div>'+
      '</div>'+
    '</div>';
  }
  function authGateHtml(){
    var brandMark = '<img class="brand-mark" src="icons/logo-mark.png" alt="Kenokip Farm">';
    var formHtml;
    if(authGateMode==='forgot'){
      formHtml = '<div class="auth-card">'+brandMark+
        '<h1>Reset your password</h1><p class="hint">Enter your account email — if it has an account, we\'ll send a link to set a new password.</p>'+
        (authGateNotice ? '<div class="banner" style="text-align:left; margin-bottom:14px">'+esc(authGateNotice)+'</div>' : '')+
        (authGateError ? '<div class="banner bad" style="text-align:left; margin-bottom:14px">'+esc(authGateError)+'</div>' : '')+
        '<form data-form="forgot-password" style="text-align:left">'+
          '<div class="field-row"><label>Email</label><input class="field" type="email" name="email" autocomplete="username" required autofocus></div>'+
          '<button class="btn primary" type="submit" style="width:100%; margin-top:16px">Send reset link</button>'+
        '</form>'+
        '<button class="btn ghost" data-action="auth-gate-back">Back</button>'+
      '</div>';
    } else if(authGateMode==='signin'){
      formHtml = '<div class="auth-card">'+brandMark+
        '<h1>Sign in</h1><p class="hint">Administrator and employee accounts only — guests don\'t need a password.</p>'+
        (authGateError ? '<div class="banner bad" style="text-align:left; margin-bottom:14px">'+esc(authGateError)+'</div>' : '')+
        '<form data-form="signin" style="text-align:left">'+
          '<div class="field-row"><label>Email</label><input class="field" type="email" name="email" autocomplete="username" required autofocus></div>'+
          '<div class="field-row" style="margin-top:12px"><label>Password</label><input class="field" type="password" name="password" autocomplete="current-password" required></div>'+
          '<button class="btn primary" type="submit" style="width:100%; margin-top:16px">Sign in</button>'+
        '</form>'+
        '<button class="btn ghost" data-action="auth-gate-forgot">Forgot password?</button>'+
        '<button class="btn ghost" data-action="auth-gate-back">Back</button>'+
      '</div>';
    } else {
      formHtml = '<div class="auth-card">'+brandMark+
        '<h1>Kenokip Farm</h1><p class="hint">Poultry Keeping — sign in to your account, or continue as a guest to view the farm\'s records.</p>'+
        '<button class="btn primary" data-action="auth-gate-signin"><span class="inline-ico" style="width:18px; height:18px">'+ICONS.feather+'</span>Sign in</button>'+
        '<button class="btn" data-action="auth-gate-guest">Continue as Guest</button>'+
      '</div>';
    }
    return '<div class="auth-split">'+authGatePhotoPanelHtml()+'<div class="auth-form-panel">'+formHtml+'</div></div>';
  }

  /* ---- Inactivity / offline sign-out, for every signed-in role AND guests
     ---- Resets on real activity (mouse/keyboard/touch/scroll), same idea as
     a normal idle timer, just checked against a stored timestamp with
     Date.now() rather than one long-running setTimeout — a background tab
     can get its timers throttled or paused by the browser, so this
     re-checks on a short interval and whenever the tab regains visibility,
     which catches time that passed while it was in the background too. The
     last-activity time lives in localStorage (keyed by uid, or "guest" for
     someone viewing without an account) so it survives a page reload —
     reloading with nothing else happening does NOT reset the clock.
     Separately, going offline for the same length of time ALSO ends the
     session, even if someone's still actively tapping around — tracked with
     its own "offline since" timestamp rather than folded into the activity
     one, since the two are meant to be independent triggers.
     The threshold isn't the same for everyone: the Administrator and
     Financial Staff handle money, so they keep the tight 10-minute timeout
     that was always here. Everyone else — Supervisor, Vet, Farmhand, and
     now guests too (guests never had ANY timeout before) — signs out after
     15 minutes instead, of either inactivity or being offline.
     Ending the session doesn't just quietly drop back to the sign-in form —
     it shows the full-screen "Session Timeout" explainer (see
     showSessionTimeoutScreen below) first, same spirit as the app-update
     overlay: tell the person what happened instead of leaving them
     wondering why they're suddenly looking at a login screen. */
  function idleTimeoutApplies(){ return !!currentUser || guestMode; }
  function sessionLimitMs(){ return (isAdminLevel() || isFinancialStaffUser()) ? SESSION_LIMIT_MS : OTHER_ROLES_SESSION_LIMIT_MS; }
  function sessionLimitLabel(){ return (isAdminLevel() || isFinancialStaffUser()) ? '10 minutes' : '15 minutes'; }
  function sessionKeyId(){ return currentUser ? currentUser.uid : 'guest'; }
  function lastActivityKey(uid){ return 'kenokip-last-activity-'+uid; }
  function offlineSinceKey(uid){ return 'kenokip-offline-since-'+uid; }
  // Lets an already-signed-in account keep working offline past its ID
  // token's 1-hour lifetime (see the onAuthStateChanged catch above) —
  // only ever a fallback for a device that has successfully signed in
  // before, never a way to sign in fresh without a network at all (Firebase
  // has to check a password against its servers; nothing here can do that
  // offline, and it shouldn't try to).
  function cachedClaimsKey(uid){ return 'kenokip-cached-claims-'+uid; }
  function cacheClaimsForOffline(uid, claims){
    try{ localStorage.setItem(cachedClaimsKey(uid), JSON.stringify({role:claims.role||null, jobTitle:claims.jobTitle||null})); }catch(e){}
  }
  function readCachedClaimsForOffline(uid){
    try{
      var raw = localStorage.getItem(cachedClaimsKey(uid));
      if(!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.role ? parsed : null;
    }catch(e){ return null; }
  }
  var lastActivityWriteAt = 0;
  function markSessionActivity(){
    if(!idleTimeoutApplies()) return;
    var now = Date.now();
    if(now - lastActivityWriteAt < 5000) return; // throttle localStorage writes
    lastActivityWriteAt = now;
    try{ localStorage.setItem(lastActivityKey(sessionKeyId()), String(now)); }catch(e){}
  }
  // Tracks how long the device has been continuously offline, independent of
  // whether someone's still tapping around — that's the whole point of a
  // separate "offline" trigger rather than just letting it fall under plain
  // inactivity. Started/stopped alongside the idle timer itself.
  function markOfflineStart(){
    if(!idleTimeoutApplies()) return;
    var key = offlineSinceKey(sessionKeyId());
    try{ if(!localStorage.getItem(key)) localStorage.setItem(key, String(Date.now())); }catch(e){}
  }
  function clearOfflineStart(){
    try{ localStorage.removeItem(offlineSinceKey(sessionKeyId())); }catch(e){}
  }
  // The one place that actually ends a timed-out session — handles a real
  // signed-in account and a guest differently (a guest never had a Firebase
  // user to sign out of in the first place), then shows the full-screen
  // explainer so the person understands why they're suddenly at a sign-in
  // screen instead of wondering if something broke.
  function endTimedSession(reasonText){
    stopIdleTimer();
    try{
      localStorage.removeItem(lastActivityKey(sessionKeyId()));
      localStorage.removeItem(offlineSinceKey(sessionKeyId()));
    }catch(e){}
    showSessionTimeoutScreen(reasonText);
    if(currentUser){ firebase.auth().signOut(); }
    else if(guestMode){ guestMode = false; readOnly = false; render(); }
  }
  function sessionExpiryCheck(){
    if(!idleTimeoutApplies()) return;
    var limitMs = sessionLimitMs();
    var actKey = lastActivityKey(sessionKeyId());
    var last = Number(localStorage.getItem(actKey) || 0);
    if(!last){
      last = Date.now();
      try{ localStorage.setItem(actKey, String(last)); }catch(e){}
    }
    if(Date.now() - last >= limitMs){
      var label = sessionLimitLabel();
      endTimedSession('It looks like you\'ve been inactive for '+label+', so we\'ve signed you out to keep your account secure. Don\'t worry, you can sign back in and pick up right where you left off.');
      return;
    }
    // Offline check — separate clock, same limit. navigator.onLine is a
    // best-effort browser signal (it can occasionally read "online" on a
    // connection that's actually dead), so this is a reasonable proxy for
    // "no real connectivity for a while", not a guarantee.
    if(typeof navigator!=='undefined' && navigator.onLine===false){
      markOfflineStart();
      var offKey = offlineSinceKey(sessionKeyId());
      var offlineSince = Number(localStorage.getItem(offKey) || 0);
      if(offlineSince && Date.now() - offlineSince >= limitMs){
        var offLabel = sessionLimitLabel();
        endTimedSession('It looks like this device has been offline for '+offLabel+', so we\'ve signed you out to keep your account secure. Don\'t worry, you can sign back in and pick up right where you left off.');
        return;
      }
    } else {
      clearOfflineStart();
    }
  }
  function startIdleTimer(){
    stopIdleTimer();
    if(!idleTimeoutApplies()) return;
    if(typeof navigator!=='undefined' && navigator.onLine===false) markOfflineStart(); else clearOfflineStart();
    sessionExpiryCheck();
    idleTimer = setInterval(sessionExpiryCheck, 15000);
    document.addEventListener('visibilitychange', sessionExpiryCheck);
    window.addEventListener('online', clearOfflineStart);
    window.addEventListener('offline', markOfflineStart);
    ['mousemove','keydown','click','touchstart','scroll'].forEach(function(evt){
      document.addEventListener(evt, markSessionActivity, {passive:true});
    });
  }
  function stopIdleTimer(){
    clearInterval(idleTimer);
    idleTimer = null;
    document.removeEventListener('visibilitychange', sessionExpiryCheck);
    window.removeEventListener('online', clearOfflineStart);
    window.removeEventListener('offline', markOfflineStart);
    ['mousemove','keydown','click','touchstart','scroll'].forEach(function(evt){
      document.removeEventListener(evt, markSessionActivity);
    });
  }
  // Full-screen "Session Timeout" explainer — replaces the sign-in gate
  // entirely (rather than just toasting and dropping back to it) until
  // "Go to Sign in" is clicked, same one-way-out idea as the app-update
  // overlay near the end of this file. hideSessionTimeoutScreen() is what
  // finally reveals the normal sign-in form again.
  function showSessionTimeoutScreen(reasonText){
    var el = document.getElementById('session-timeout-backdrop');
    if(!el) return;
    el.innerHTML =
      '<div class="session-timeout-card" role="alertdialog" aria-live="assertive" aria-label="Session timeout">' +
        '<div class="session-timeout-icon">'+ICONS.warning+'</div>' +
        '<h1>Session Timeout</h1>' +
        '<p>'+esc(reasonText)+'</p>' +
        '<button type="button" class="btn primary" id="session-timeout-signin-btn">Go to Sign in</button>' +
      '</div>';
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('session-timeout-signin-btn').addEventListener('click', hideSessionTimeoutScreen);
  }
  function hideSessionTimeoutScreen(){
    var el = document.getElementById('session-timeout-backdrop');
    if(!el || el.hidden) return;
    el.hidden = true;
    el.innerHTML = '';
    document.body.style.overflow = '';
    render();
  }

  /* ---- Finance portal: a separate 2-minute *activity-based* idle lock,
     independent of the 10-minute session-expiry clock above. This one
     behaves like the old idle timer used to (resets on mouse/keyboard/touch
     activity) — it locks the Finance portal (back to asking for the portal
     password + its own code) rather than signing the whole app out. ---- */
  var FINANCE_PORTAL_IDLE_MS = 2*60*1000;
  function resetFinancePortalIdleTimer(){
    if(!financePortalUnlocked) return;
    clearTimeout(financePortalIdleTimer);
    financePortalIdleTimer = setTimeout(function(){
      lockFinancePortal('Finance portal locked after 2 minutes of inactivity.');
    }, FINANCE_PORTAL_IDLE_MS);
  }
  function startFinancePortalTimer(){
    stopFinancePortalTimer();
    ['mousemove','keydown','click','touchstart','scroll'].forEach(function(evt){
      document.addEventListener(evt, resetFinancePortalIdleTimer, {passive:true});
    });
    resetFinancePortalIdleTimer();
  }
  function stopFinancePortalTimer(){
    clearTimeout(financePortalIdleTimer);
    ['mousemove','keydown','click','touchstart','scroll'].forEach(function(evt){
      document.removeEventListener(evt, resetFinancePortalIdleTimer);
    });
  }
  function lockFinancePortal(msg){
    if(!financePortalUnlocked) return;
    financePortalUnlocked = false;
    stopFinancePortalTimer();
    if(msg) toast(msg);
    render();
  }

  /* ---- access logging (who signed in, from where) ---- */
  // Turns coordinates into a place name (e.g. "Kondele, Kisumu, Kenya") using
  // OpenStreetMap's free Nominatim service, done here in the browser (not in
  // the Cloud Function) because Nominatim's usage policy blocks a lot of
  // requests coming from cloud-server IP addresses, but is fine with normal
  // browsers. Best-effort — if it fails or times out, the log just falls
  // back to showing the raw coordinates.
  function reverseGeocodePlace(lat, lng){
    var url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+lat+'&lon='+lng+'&zoom=16&addressdetails=1';
    var ctrl = (typeof AbortController!=='undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 6000) : null;
    return fetch(url, { headers:{ 'Accept':'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function(res){ return res.ok ? res.json() : null; })
      .then(function(data){
        if(timer) clearTimeout(timer);
        if(!data) return null;
        var a = data.address || {};
        var specific = a.road || a.neighbourhood || a.suburb || a.village || a.town || null;
        var city = a.city || a.town || a.county || null;
        var country = a.country || null;
        var parts = [specific, (specific && specific===city ? null : city), country].filter(Boolean);
        return parts.length ? parts.join(', ') : (data.display_name || null);
      })
      .catch(function(){ if(timer) clearTimeout(timer); return null; });
  }
  function captureAccessLog(){
    if(!(window.firebase && firebase.functions)) return;
    var send = function(loc){ firebase.functions().httpsCallable('logAccess')(loc).catch(function(){}); };
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        reverseGeocodePlace(lat, lng).then(function(place){
          send({ locationStatus:'granted', lat:lat, lng:lng, place: place||null });
        });
      }, function(err){
        // Distinguish *why* it failed — "denied" specifically means the
        // person (or their device's Location Services setting) said no;
        // it's not a bug in the app.
        var status = 'denied';
        if(err){
          if(err.code === err.TIMEOUT) status = 'timeout';
          else if(err.code === err.POSITION_UNAVAILABLE) status = 'unavailable';
        }
        send({ locationStatus: status });
      }, { timeout:8000, maximumAge:60000 });
    } else {
      send({ locationStatus:'unsupported' });
    }
  }

  /* ---- sign-in flow (bootstrap-first-admin, then normal role resolution) ---- */
  function finishSignIn(user, claims){
    currentUser = { uid:user.uid, email:user.email, role:claims.role, jobTitle:claims.jobTitle||null, name:null, totpEnrolled:false, portalTotpEnrolled:false, away:false };
    financeRevealed = false;
    financePortalUnlocked = false;
    stopFinancePortalTimer();
    birthdaysRevealed = false;
    teamBirthdays = null;
    myDob = null;
    myDobLoaded = false;
    guestMode = false;
    readOnly = false;
    // Always land on Overview right after signing in — simple, predictable,
    // and it's also what makes the section-permission check just above
    // unnecessary now (any section a role can't see would've been caught
    // there before too, but this is the actual place the user asked for).
    ui.section = 'overview';
    navHistory = [];
    saveUIPref();
    if(canSeeFinance()) initFinanceSync();
    initDirectorySync();
    initMessagesSync();
    initOwnProfileSync();
    if(isAdminLevel()){ initAdminLogsSync(); initSecurityEventsSync(); initPendingSignoffsAdminSync(); initC2BLogSync(); }
    if(isAdminLevel() && mpesaEnabled) initMpesaQueriesSync();
    if(canSeeFinance()){ financeGuardStatus = null; refreshFinanceGuardStatus(); }
    if(isAdmin()){ birthdayGuardStatus = null; refreshBirthdayGuardStatus(); }
    refreshMyDob();
    captureAccessLog();
    startIdleTimer();
    if(typeof Notification!=='undefined' && Notification.permission==='granted') registerForPush();
    kemAiSetVisible(true);
    render();
    applyLaunchShortcut();
  }
  function handleSignedInUser(user, claims){
    if(claims && claims.role){ finishSignIn(user, claims); return; }
    // No role claim yet — this is either the very first sign-in ever (which
    // becomes Administrator automatically) or an account that was removed /
    // never set up by the administrator.
    firebase.functions().httpsCallable('bootstrapFirstAdmin')().then(function(){
      return user.getIdTokenResult(true);
    }).then(function(res){
      if(res.claims && res.claims.role){ finishSignIn(user, res.claims); }
      else {
        authGateError = 'Almost done — please sign in once more to finish setting up your account.';
        authGateMode = 'signin';
        firebase.auth().signOut();
      }
    }).catch(function(){
      authGateError = 'This account isn\'t set up yet — ask the administrator to add you as a team member.';
      authGateMode = 'signin';
      firebase.auth().signOut();
    });
  }

  /* ---- team directory (any signed-in account — needed to pick a message recipient) ---- */
  function initDirectorySync(){
    if(directorySyncStarted || !db || !currentUser) return;
    directorySyncStarted = true;
    db.collection('users').onSnapshot(function(snap){
      teamUsers = [];
      snap.forEach(function(doc){ teamUsers.push(Object.assign({uid:doc.id}, doc.data())); });
      render();
    }, function(){ /* a failure here just leaves the roster showing its last-known data */ });
  }
  /* ---- access log (administrator only) ---- */
  function initAdminLogsSync(){
    if(logsSyncStarted || !db || !isAdminLevel()) return;
    logsSyncStarted = true;
    db.collection('accessLogs').orderBy('at','desc').limit(200).onSnapshot(function(snap){
      accessLogs = [];
      snap.forEach(function(doc){ accessLogs.push(Object.assign({id:doc.id}, doc.data())); });
      if(ui.section==='team') render();
    }, function(){});
  }
  /* ---- Till (C2B) webhook activity log (administrator only) ---- */
  function initC2BLogSync(){
    if(c2bLogSyncStarted || !db || !isAdminLevel()) return;
    c2bLogSyncStarted = true;
    db.collection('c2bLog').orderBy('at','desc').limit(50).onSnapshot(function(snap){
      c2bLog = [];
      snap.forEach(function(doc){ c2bLog.push(Object.assign({id:doc.id}, doc.data())); });
      if(ui.section==='team') render();
    }, function(){});
  }
  /* ---- Finance security alerts (administrator only) ---- */
  function initSecurityEventsSync(){
    if(securityEventsSyncStarted || !db || !isAdminLevel()) return;
    securityEventsSyncStarted = true;
    db.collection('securityEvents').orderBy('at','desc').limit(200).onSnapshot(function(snap){
      securityEvents = [];
      snap.forEach(function(doc){ securityEvents.push(Object.assign({id:doc.id}, doc.data())); });
      if(ui.section==='team') render();
    }, function(){});
  }
  /* ---- Account Balance / Transaction Status results (administrator/co-admin only) ---- */
  function initMpesaQueriesSync(){
    if(mpesaQueriesSyncStarted || !db || !isAdminLevel()) return;
    mpesaQueriesSyncStarted = true;
    db.collection('mpesaQueries').orderBy('requestedAt','desc').limit(20).onSnapshot(function(snap){
      mpesaQueries = [];
      snap.forEach(function(doc){ mpesaQueries.push(Object.assign({id:doc.id}, doc.data())); });
      if(ui.section==='finance') render();
    }, function(){ /* a failure here just leaves the last-known results showing */ });
  }
  function latestMpesaQuery(type){
    for(var i=0;i<mpesaQueries.length;i++){ if(mpesaQueries[i].type===type) return mpesaQueries[i]; }
    return null;
  }
  // Every receipt currently waiting on the administrator's signature (see
  // the "Pending signatures" section and signAndPreviewReceipt) — a single
  // equality filter, sorted client-side, so this never needs a Firestore
  // composite index set up separately.
  function initPendingSignoffsAdminSync(){
    if(pendingSignoffsAdminSyncStarted || !db || !isAdminLevel()) return;
    pendingSignoffsAdminSyncStarted = true;
    // Both statuses so a skipped request still shows up here as an FYI —
    // "approved" ones aren't included since those were the administrator's
    // own action and don't need to linger in this list.
    db.collection('pendingSignoffs').where('status','in',['pending','skipped']).onSnapshot(function(snap){
      pendingSignoffsForAdmin = [];
      snap.forEach(function(doc){ pendingSignoffsForAdmin.push(Object.assign({id:doc.id}, doc.data())); });
      pendingSignoffsForAdmin.sort(function(a,b){
        var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      render();
    }, function(){ /* a failure here just leaves the list showing its last-known data */ });
  }
  // Locked state, and whether THIS person has fingerprint/PIN unlock set
  // up — fetched once per sign-in (see finishSignIn) and again right after
  // any action that could change it (enrolling, setting a PIN, an unlock
  // attempt). Safe to call often — it's a single lightweight read.
  function refreshFinanceGuardStatus(){
    if(!currentUser || !canSeeFinance() || financeGuardStatusLoading) return;
    financeGuardStatusLoading = true;
    firebase.functions().httpsCallable('getFinanceGuardStatus')().then(function(res){
      financeGuardStatus = res.data;
      financeGuardStatusLoading = false;
      render();
    }).catch(function(){ financeGuardStatusLoading = false; });
  }
  // Same idea, for the dedicated Birthday PIN (privacyGuard.js) — whether
  // it's set up yet and whether it's currently locked out. Administrator
  // only; nobody else has this PIN at all.
  function refreshBirthdayGuardStatus(){
    if(!currentUser || !isAdmin() || birthdayGuardStatusLoading) return;
    birthdayGuardStatusLoading = true;
    firebase.functions().httpsCallable('getBirthdayGuardStatus')().then(function(res){
      birthdayGuardStatus = res.data;
      birthdayGuardStatusLoading = false;
      render();
    }).catch(function(){ birthdayGuardStatusLoading = false; });
  }
  // This account's own date of birth — any signed-in account may read its
  // own back, no PIN needed (see getMyDob in privacyGuard.js). Fetched once
  // per sign-in; re-fetched after saving a change (see the 'set-own-dob'
  // form handler).
  function refreshMyDob(){
    if(!currentUser) return;
    firebase.functions().httpsCallable('getMyDob')().then(function(res){
      myDob = (res.data && res.data.dob) || null;
      myDobLoaded = true;
      render();
    }).catch(function(){ myDobLoaded = true; });
  }
  function staffFormHtml(){
    return '<div class="modal-head"><h3>Add team member</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Creates a sign-in for an employee. Share the email and password with them directly — there\'s no self-registration.</p>'+
    '<form data-form="add-staff">'+
      '<div class="field-row"><label>Name</label><input class="field" type="text" name="name" maxlength="60" placeholder="e.g. John" required autofocus></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Email</label><input class="field" type="email" name="email" required></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Temporary password</label><input class="field" type="text" name="password" minlength="6" placeholder="At least 6 characters" required></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Role</label><select class="field" name="roleChoice">'+
        '<option value="supervisor">Supervisor</option>'+
        '<option value="vet">Vet / Doctor</option>'+
        '<option value="financial">Financial Staff</option>'+
        '<option value="farmhand">Farmhand</option>'+
        '<option value="coadmin">Co-Administrator</option>'+
      '</select><span class="hint">Co-Administrator gets the same access as you everywhere except Finance — there, they can add entries, but final approval stays with you.</span></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Gender</label><select class="field" name="gender">'+
        '<option value="unspecified" selected>Unspecified</option>'+
        '<option value="female">Female</option>'+
        '<option value="male">Male</option>'+
      '</select><span class="hint">Just picks their default profile icon before they upload a real photo — they can change this themselves later too.</span></div>'+
      (isAdmin()
        ? '<div class="field-row" style="margin-top:12px"><label>Date of birth (optional)</label><input class="field" type="date" name="dob"></div>'+
          '<span class="hint">Kept private — they can set/fix this themselves too, and only you, with your dedicated Birthday PIN, can reveal it in Team Directory afterward.</span>'
        : '<p class="hint" style="margin-top:12px">Date of birth can be added afterward, by the administrator or by the person themselves.</p>')+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Create account</button></div>'+
    '</form>';
  }
  // Promote/demote an existing team member — swap between a specific
  // employee job title and Co-Administrator. Never offered for the
  // administrator's own row (see teamPanel), and blocked server-side too
  // (updateStaffAccount refuses any target whose role is 'administrator')
  // — this is what makes "can't overrun me" real, not just a hidden button.
  function changeRoleFormHtml(uid, currentRole, currentJobTitle){
    var cur = currentRole==='coadmin' ? 'coadmin' : (currentJobTitle||'supervisor');
    return '<div class="modal-head"><h3>Change role</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Co-Administrator gets the same access as you everywhere except Finance — there, they can add entries, but final approval stays with you.</p>'+
    '<form data-form="change-role">'+
      '<input type="hidden" name="uid" value="'+esc(uid)+'">'+
      '<div class="field-row"><label>Role</label><select class="field" name="roleChoice">'+
        '<option value="supervisor" '+(cur==='supervisor'?'selected':'')+'>Supervisor</option>'+
        '<option value="vet" '+(cur==='vet'?'selected':'')+'>Vet / Doctor</option>'+
        '<option value="financial" '+(cur==='financial'?'selected':'')+'>Financial Staff</option>'+
        '<option value="farmhand" '+(cur==='farmhand'?'selected':'')+'>Farmhand</option>'+
        '<option value="coadmin" '+(cur==='coadmin'?'selected':'')+'>Co-Administrator</option>'+
      '</select></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function changePasswordFormHtml(){
    return '<div class="modal-head"><h3>Change password</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="change-password">'+
      '<div class="field-row"><label>Current password</label><input class="field" type="password" name="current" autocomplete="current-password" required autofocus></div>'+
      '<div class="field-row" style="margin-top:12px"><label>New password</label><input class="field" type="password" name="new1" minlength="6" placeholder="At least 6 characters" autocomplete="new-password" required></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Confirm new password</label><input class="field" type="password" name="new2" minlength="6" autocomplete="new-password" required></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function editStaffNameFormHtml(uid, currentName, currentGender){
    return '<div class="modal-head"><h3>Edit name &amp; gender</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">For team members added before these existed, or if theirs still needs fixing — gender only picks their default profile icon before a real photo, and they can change it themselves too.</p>'+
    '<form data-form="edit-staff-name">'+
      '<input type="hidden" name="uid" value="'+esc(uid)+'">'+
      '<div class="field-row"><label>Name</label><input class="field" type="text" name="name" maxlength="60" placeholder="e.g. John" value="'+esc(currentName||'')+'" required autofocus></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Gender</label><select class="field" name="gender">'+
        '<option value="unspecified" '+((!currentGender||currentGender==='unspecified')?'selected':'')+'>Unspecified</option>'+
        '<option value="female" '+(currentGender==='female'?'selected':'')+'>Female</option>'+
        '<option value="male" '+(currentGender==='male'?'selected':'')+'>Male</option>'+
      '</select></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  // Your own date of birth — self-service, no PIN needed, it's your own
  // data (see getMyDob/setOwnDob in privacyGuard.js). Anyone signed in can
  // set or change this from Team Directory or Settings → Your account.
  function setOwnDobFormHtml(){
    return '<div class="modal-head"><h3>'+ICONS.cake+' Your birthday</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Kept private — only you can see this here, and the administrator, who needs a dedicated PIN just to reveal it.</p>'+
    '<form data-form="set-own-dob">'+
      '<div class="field-row"><label>Date of birth</label><input class="field" type="date" name="dob" value="'+esc(myDob||'')+'" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  // Administrator sets or fixes a team member's date of birth — e.g. from
  // their ID, when they haven't set it themselves yet. Writing this does
  // not need the Birthday PIN (see setStaffDob in privacyGuard.js); only
  // reading someone else's back does.
  function setStaffDobFormHtml(uid, name, existingDob){
    return '<div class="modal-head"><h3>'+ICONS.cake+' '+esc(name)+'\'s birthday</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    (existingDob ? '' : '<p class="hint">Not revealed this sitting, so this starts blank — entering a date here sets/overwrites it either way.</p>')+
    '<form data-form="set-staff-dob">'+
      '<input type="hidden" name="uid" value="'+esc(uid)+'">'+
      '<div class="field-row"><label>Date of birth</label><input class="field" type="date" name="dob" value="'+esc(existingDob||'')+'" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function resetStaffPasswordFormHtml(uid, email){
    return '<div class="modal-head"><h3>Reset password</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">There\'s no way to see '+esc(email||'this account')+'\'s existing password — Firebase never stores it in a readable form, not even for the administrator. This sets a new one instead, which you then share with them the same way as before.</p>'+
    '<form data-form="reset-staff-password">'+
      '<input type="hidden" name="uid" value="'+esc(uid)+'">'+
      '<div class="field-row"><label>New password</label><input class="field" type="text" name="password" minlength="6" placeholder="At least 6 characters" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Set password</button></div>'+
    '</form>';
  }
  // Rough-location note shown once, above the table, so the numbers below
  // are never mistaken for more than they are: a real clue, not a precise
  // address, and easy for someone on a VPN or mobile data to throw off.
  function describeEventGeo(ev){
    if(ev.geo && (ev.geo.city || ev.geo.country)) return [ev.geo.city, ev.geo.country].filter(Boolean).join(', ');
    if(ev.ip) return 'Unresolved (IP: '+ev.ip+')';
    return 'Unknown';
  }
  var SECURITY_EVENT_LABELS = {
    'password-totp': 'Password + code', 'fingerprint-pin': 'Fingerprint + PIN', 'admin-clear': 'Admin cleared lock',
    'pin-only': 'Quick PIN unlock', 'fingerprint-only': 'Quick fingerprint unlock', 'quick-unlock': 'Quick unlock',
    'payout-pin': 'Payout — PIN', 'payout-fingerprint': 'Payout — fingerprint',
  };
  var SECURITY_OUTCOME_PILLS = {
    success: '<span class="pill" style="background:var(--good-tint); color:var(--good)">Success</span>',
    fail: '<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Wrong attempt</span>',
    locked: '<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Locked portal</span>',
    'blocked-while-locked': '<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Tried while locked</span>',
  };
  function financeSecurityCardHTML(){
    var locked = financeGuardStatus && financeGuardStatus.locked;
    var LOG_PAGE_SIZE = PAGE_SIZE;
    var totalPages = Math.max(1, Math.ceil(securityEvents.length / LOG_PAGE_SIZE));
    if(securityEventPage >= totalPages) securityEventPage = totalPages - 1;
    if(securityEventPage < 0) securityEventPage = 0;
    var paged = securityEvents.slice(securityEventPage*LOG_PAGE_SIZE, securityEventPage*LOG_PAGE_SIZE + LOG_PAGE_SIZE);
    var rows = paged.map(function(ev){
      var when = (ev.at && ev.at.toDate) ? fmtDate(ev.at.toDate(),{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      return '<tr><td>'+when+'</td>'+
        '<td>'+(SECURITY_OUTCOME_PILLS[ev.outcome]||esc(ev.outcome||'—'))+'</td>'+
        '<td>'+esc(SECURITY_EVENT_LABELS[ev.method]||ev.method||'—')+'</td>'+
        '<td>'+esc(ev.device||'—')+'</td>'+
        '<td>'+ICONS.pin+' '+esc(describeEventGeo(ev))+'</td>'+
        '<td>'+esc(ev.email||'—')+'</td></tr>';
    }).join('');
    var pagerHtml = securityEvents.length ? '<div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:10px">'+
        '<button class="btn sm" data-action="security-log-page:prev" '+(securityEventPage<=0?'disabled':'')+'>Prev</button>'+
        '<span class="hint">Page '+(securityEventPage+1)+' of '+totalPages+'</span>'+
        '<button class="btn sm" data-action="security-log-page:next" '+(securityEventPage>=totalPages-1?'disabled':'')+'>Next</button>'+
      '</div>' : '';
    return '<div class="card">'+
      '<div class="card-title"><h3>Finance security</h3>'+(locked?'<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Locked</span>':'')+'</div>'+
      (locked
        ? '<div class="banner bad" style="margin-bottom:12px">🔒 The Finance portal is locked after '+3+' wrong attempts in a row — nobody can get in, even with correct details, until '+(isAdmin()?'you clear':'the administrator clears')+' it.</div>'+
          (isAdmin() ? '<button class="btn primary" data-action="open-clear-finance-lock">Clear lock</button>' : '<p class="hint">Only the administrator can clear a Finance portal lock.</p>')
        : '<p class="hint">Locks itself automatically after 3 wrong attempts on either unlock method, and alerts you immediately (as an Urgent message + notification) every time one is wrong. Rough location below is based on IP address — genuinely useful, but only ever a clue: it\'s city-level at best, and a VPN or mobile data can throw it off.</p>')+
      (securityEvents.length ? '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>When</th><th>Result</th><th>Method</th><th>Device</th><th>Rough location</th><th>Account</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pagerHtml
        : '<div class="empty" style="margin-top:12px">'+ICONS.empty+'<div>No Finance unlock attempts recorded yet.</div></div>')+
    '</div>';
  }
  // Admin-triggered "push update to everyone" — bumps meta/appUpdate's
  // pushedAt so every open device's onSnapshot listener (see initArtifact)
  // fires and shows the mandatory refresh prompt within moments, instead of
  // each device waiting for its own periodic service-worker check. This
  // doesn't create or fetch a new version by itself — it's meant to be
  // clicked right after a real deploy has actually gone out, to make sure
  // everyone picks it up promptly rather than whenever their app happens to
  // notice on its own.
  function pushAppUpdateToEveryone(){
    if(!db){ toast('Not connected — try again once you\'re back online.'); return; }
    db.collection('meta').doc('appUpdate').set({
      pushedAt: firebase.firestore.FieldValue.serverTimestamp(),
      pushedBy: (currentUser && (currentUser.name || currentUser.email)) || 'Admin'
    }, {merge:true}).then(function(){
      toast('Update pushed — everyone with the app open will see a refresh prompt shortly.');
    }).catch(function(){
      toast('Could not push the update — check your connection and try again.');
    });
  }
  function teamPanel(){
    if(!isAdminLevel()) return '<div class="empty">'+ICONS.empty+'<div>Only the administrator can manage the team.</div></div>';
    var teamSorted = teamUsers.slice().sort(function(a,b){ return (a.email||'').localeCompare(b.email||''); });
    var teamPage = paginate('team-list', teamSorted);
    var rows = teamPage.items.map(function(u){
      var isSelf = u.uid === currentUser.uid;
      var pillAdmin = u.role==='administrator' || u.role==='coadmin';
      return '<tr><td>'+esc(u.name||'—')+'</td><td>'+esc(u.email||'—')+'</td>'+
        '<td><span class="role-pill '+(pillAdmin?'admin':'')+'">'+esc(roleLabel(u))+'</span></td>'+
        '<td>'+(u.disabled?'<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Disabled</span>':'<span class="pill" style="background:var(--good-tint); color:var(--good)">Active</span>')+'</td>'+
        '<td><div class="row-actions">'+
          (u.role==='administrator' || isSelf ? '<span class="hint">—</span>' :
            '<button class="btn sm" data-action="open-edit-name:'+u.uid+'">Edit name &amp; gender</button>'+
            '<button class="btn sm" data-action="open-change-role:'+u.uid+'">Change role</button>'+
            '<button class="btn sm" data-action="open-reset-password:'+u.uid+'">Reset password</button>'+
            '<button class="btn sm" data-action="toggle-staff:'+u.uid+'">'+(u.disabled?'Enable':'Disable')+'</button>'+
            '<button class="icon-btn" data-action="delete-staff:'+u.uid+'">'+ICONS.trash+'</button>')+
        '</div></td></tr>';
    }).join('');

    var pending = financeState().transactions.filter(function(t){ return t.status==='pending'; });
    var pendingPage = paginate('team-pending-finance', pending);
    var pendingRows = pendingPage.items.map(function(t){
      return '<tr><td>'+fmtDate(parseISO(t.date))+'</td>'+
        '<td>'+(t.type==='deposit'?'Deposit':'Withdrawal')+'</td>'+
        '<td class="num">'+fmtMoney(t.amount)+'</td>'+
        '<td>'+esc(t.note||'—')+'</td>'+
        '<td>'+esc(t.proposedByEmail||'—')+'</td>'+
        '<td><div class="row-actions">'+
          '<button class="btn sm primary" data-action="review-finance:'+t.id+':approve">Approve</button>'+
          '<button class="btn sm danger" data-action="review-finance:'+t.id+':reject">Reject</button>'+
        '</div></td></tr>';
    }).join('');

    var LOCATION_STATUS_LABELS = { denied:'Location denied', unavailable:'Location unavailable', timeout:'Location timed out', unsupported:'Not supported on this device', unknown:'Unknown' };
    var LOG_PAGE_SIZE = PAGE_SIZE;
    var totalLogPages = Math.max(1, Math.ceil(accessLogs.length / LOG_PAGE_SIZE));
    if(accessLogPage >= totalLogPages) accessLogPage = totalLogPages - 1;
    if(accessLogPage < 0) accessLogPage = 0;
    var pagedLogs = accessLogs.slice(accessLogPage*LOG_PAGE_SIZE, accessLogPage*LOG_PAGE_SIZE + LOG_PAGE_SIZE);
    var accessRows = pagedLogs.map(function(l){
      var when = (l.at && l.at.toDate) ? fmtDate(l.at.toDate(),{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      var loc;
      if(l.place){ loc = l.place; }
      else if(typeof l.lat==='number' && typeof l.lng==='number'){ loc = l.lat.toFixed(4)+', '+l.lng.toFixed(4); }
      else { loc = LOCATION_STATUS_LABELS[l.locationStatus] || 'Unknown'; }
      return '<tr><td>'+esc(l.email||'—')+'</td><td>'+esc(roleLabel({role:l.role, jobTitle:l.jobTitle}))+'</td><td>'+when+'</td><td>'+ICONS.pin+' '+esc(loc)+'</td><td>'+esc(l.device||'—')+'</td></tr>';
    }).join('');
    var logPagerHtml = accessLogs.length ? '<div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:10px">'+
        '<button class="btn sm" data-action="access-log-page:prev" '+(accessLogPage<=0?'disabled':'')+'>Prev</button>'+
        '<span class="hint">Page '+(accessLogPage+1)+' of '+totalLogPages+'</span>'+
        '<button class="btn sm" data-action="access-log-page:next" '+(accessLogPage>=totalLogPages-1?'disabled':'')+'>Next</button>'+
      '</div>' : '';

    // Till (C2B) webhook activity — lets the admin actually see, from
    // inside the app, whether Safaricom's direct-till-payment calls are
    // reaching us at all, and whether they were accepted or rejected (a
    // rejected row almost always means the C2B URLs need re-registering
    // with the current webhook key — see SETUP-SECURITY.md / SETUP-MPESA.md).
    var KEY_SOURCE_LABELS = { query: 'In URL (?key=)', path: 'In URL (path)', none: 'Not received at all' };
    var c2bRows = c2bLog.map(function(l){
      var when = (l.at && l.at.toDate) ? fmtDate(l.at.toDate(),{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      var statusPill = l.accepted ? '<span class="pill" style="background:var(--good-tint); color:var(--good)">Accepted</span>' : '<span class="pill" style="background:var(--bad-tint); color:var(--bad)">Rejected</span>';
      var who = l.payer || l.msisdn || '—';
      // Only meaningful for a Rejected row: tells apart "Safaricom never even
      // sent a key" (a URL/registration problem — see keySource:'none') from
      // "it sent one, but it didn't match" (a MPESA_WEBHOOK_SECRET mismatch).
      var keyCell = l.accepted ? '—' : esc(KEY_SOURCE_LABELS[l.keySource] || 'Unknown');
      return '<tr><td>'+when+'</td><td>'+esc(l.endpoint||'—')+'</td><td>'+statusPill+'</td><td>'+keyCell+'</td><td class="num">'+(l.amount!=null?fmtMoney(l.amount):'—')+'</td><td>'+esc(who)+'</td></tr>';
    }).join('');

    // Anyone (besides the administrator, who writes their own from Team
    // Directory) still missing a saved About — covers the team added before
    // this existed. New team members get one automatically now (see
    // 'add-staff' in handleForm), so this count should shrink to zero and
    // stay there.
    var missingAboutUsers = teamUsers.filter(function(u){ return u.uid!==currentUser.uid && !u.about; });

    return '<div class="card"><div class="card-title"><h3>App updates</h3><span class="hint">Push a refresh to every device</span></div>'+
        '<p class="hint">Use this right after a new version of the app has actually gone out (check Settings → About this app for the version number). Everyone with the app open — team members and anyone viewing as a guest — will see a mandatory "Update available" prompt within moments, instead of waiting for their own app to notice on its own. This only tells devices to refresh; it doesn\'t publish anything by itself.</p>'+
        '<button type="button" class="btn primary" data-action="push-app-update">'+ICONS.refresh+'Push update to everyone</button>'+
      '</div>'+
      (pending.length && isAdmin() ? '<div class="card"><div class="card-title"><h3>Pending Finance approvals</h3><span class="hint">'+pending.length+' waiting on you</span></div>'+
        '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th class="num">Amount</th><th>Note</th><th>Proposed by</th><th></th></tr></thead><tbody>'+pendingRows+'</tbody></table></div>'+
        pagerHtml('team-pending-finance', pendingPage.pageCount, pendingPage.page)+
      '</div>' : '')+
      '<div class="card"><div class="card-title"><h3>Team</h3><span class="hint">'+teamUsers.length+' account'+(teamUsers.length===1?'':'s')+'</span></div>'+
        '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
        pagerHtml('team-list', teamPage.pageCount, teamPage.page)+
        '<div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap; align-items:center">'+
          '<button class="btn primary" data-action="open-add-staff">'+ICONS.plus+'Add team member</button>'+
          (missingAboutUsers.length ? '<button class="btn" data-action="bulk-seed-about">Fill in starter Abouts ('+missingAboutUsers.length+' missing)</button>' : '')+
        '</div>'+
      '</div>'+
      (isAdmin() ? '<div class="card"><div class="card-title"><h3>Finance portal password</h3></div>'+
        '<p class="hint">A separate password — not anyone\'s sign-in password — that only you set. Share it only with whoever should be able to open the Finance portal; they\'ll also need their own Finance portal authenticator code (Settings → Your account) to get in.</p>'+
        '<form data-form="set-finance-portal-password" style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap">'+
          '<div class="field-row" style="max-width:220px"><label>New Finance portal password</label><input class="field" type="password" name="password" minlength="6" placeholder="At least 6 characters" required></div>'+
          '<button class="btn primary" type="submit">Save</button>'+
        '</form>'+
      '</div>' : '')+
      financeSecurityCardHTML()+
      '<div class="card"><div class="card-title"><h3>Access log</h3><span class="hint">'+accessLogs.length+' sign-ins, '+PAGE_SIZE+' per page — visible only to you</span></div>'+
        '<p class="hint" style="margin-top:-6px">Location needs the person to allow it when their browser asks, and — on iPhone/Android — Location Services turned on for that browser at the device level. "Location denied" means one of those was off, not a fault in the app.</p>'+
        '<div class="table-wrap">'+(accessRows ? '<table><thead><tr><th>Email</th><th>Role</th><th>When</th><th>Location</th><th>Device</th></tr></thead><tbody>'+accessRows+'</tbody></table>' : '<div class="empty">'+ICONS.empty+'<div>No sign-ins recorded yet.</div></div>')+'</div>'+
        logPagerHtml+
      '</div>'+
      '<div class="card"><div class="card-title"><h3>Till payment webhook activity</h3><span class="hint">Last '+c2bLog.length+' Safaricom call'+(c2bLog.length===1?'':'s')+' — visible only to you</span></div>'+
        '<p class="hint" style="margin-top:-6px">Every time Safaricom calls our Till (C2B) webhook — whether we accepted it or not — shows up here. If a real till payment never appears in Finance/Income, check here first. Nothing at all means Safaricom isn\'t reaching us at all (the C2B URLs likely need re-registering). A "Rejected" row with Key = "Not received at all" means the call arrived but carried no key whatsoever — that\'s a URL/registration problem, not a wrong-value problem. A "Rejected" row with Key = "In URL (…)" means a key DID arrive but doesn\'t match MPESA_WEBHOOK_SECRET.</p>'+
        '<div class="table-wrap">'+(c2bRows ? '<table><thead><tr><th>When</th><th>Endpoint</th><th>Status</th><th>Key</th><th class="num">Amount</th><th>From</th></tr></thead><tbody>'+c2bRows+'</tbody></table>' : '<div class="empty">'+ICONS.empty+'<div>No Till webhook calls recorded yet.</div></div>')+'</div>'+
      '</div>';
  }

  /* ============================= TEAM DIRECTORY (photo + About, shared with everyone) ============================= */
  // A small circular photo, or — if this person hasn't set one — their
  // initials on a soft tinted circle in the current section's color, so it
  // never looks like a broken image.
  function avatarHTML(u, size){
    size = size || 40;
    u = u || {};
    var label = (u.name || (u.email ? u.email.split('@')[0] : '')).trim();
    var initials = label ? label.split(/\s+/).map(function(w){ return w[0]; }).slice(0,2).join('').toUpperCase() : '?';
    if(u.photoURL){
      return '<img src="'+esc(u.photoURL)+'" alt="" style="width:'+size+'px; height:'+size+'px; border-radius:50%; object-fit:cover; flex:none; background:var(--surface-2)">';
    }
    // Before a real photo exists, someone marked Female/Male gets a small
    // illustrated placeholder (see PICS.lady/PICS.man) instead of plain
    // initials — purely a nicer-looking stand-in, never shown once they
    // upload a real photo. Left unset ("Unspecified"/not chosen yet) keeps
    // the original initials-on-a-tinted-circle, which already tells people
    // apart just fine without guessing at anyone's gender.
    if(u.gender==='female' || u.gender==='male'){
      var picIcon = u.gender==='female' ? PICS.lady : PICS.man;
      return '<div style="width:'+size+'px; height:'+size+'px; border-radius:50%; background:var(--surface-2); display:flex; align-items:center; justify-content:center; flex:none; overflow:hidden"><span class="avatar-pic" style="width:'+Math.round(size*0.72)+'px; height:'+Math.round(size*0.72)+'px">'+picIcon+'</span></div>';
    }
    return '<div style="width:'+size+'px; height:'+size+'px; border-radius:50%; background:var(--accent-tint); color:var(--accent-ink); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:'+Math.round(size*0.38)+'px; flex:none">'+esc(initials)+'</div>';
  }
  // The "edit yourself" card shown at the top of the Team Directory — photo
  // upload (tap the camera badge) plus a free-text About. Anyone signed in
  // can only ever edit their own; everyone else's shows read-only below.
  function profileEditFormHTML(){
    var mine = teamUsers.find(function(u){ return currentUser && u.uid===currentUser.uid; }) || {};
    var meForAvatar = Object.assign({}, mine, {name: (currentUser&&currentUser.name) || mine.name});
    return '<div style="display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap">'+
      '<div style="text-align:center; flex:none">'+
        '<div style="position:relative; display:inline-block">'+
          '<span id="profile-photo-preview">'+avatarHTML(meForAvatar, 84)+'</span>'+
          '<label class="icon-btn" style="position:absolute; bottom:-2px; right:-2px; background:var(--accent); color:var(--accent-ink); border:2px solid var(--surface); cursor:pointer" title="Change photo">'+ICONS.camera+
            '<input type="file" accept="image/*" data-change="profile-photo-file" style="display:none">'+
          '</label>'+
        '</div>'+
        '<div class="hint" style="margin-top:6px; max-width:120px">Tap the camera to change your photo</div>'+
      '</div>'+
      '<form data-form="update-own-profile" style="flex:1; min-width:220px">'+
        '<div class="field-row"><label>Gender</label><select class="field" name="gender">'+
          '<option value="unspecified" '+((!mine.gender||mine.gender==='unspecified')?'selected':'')+'>Unspecified</option>'+
          '<option value="female" '+(mine.gender==='female'?'selected':'')+'>Female</option>'+
          '<option value="male" '+(mine.gender==='male'?'selected':'')+'>Male</option>'+
        '</select><span class="hint">Just picks your default profile icon before you upload a real photo.</span></div>'+
        '<div class="field-row" style="margin-top:12px"><label>About you</label><textarea class="field" name="about" rows="3" maxlength="500" placeholder="Your role, what you look after on the farm, anything the team should know">'+esc(mine.about||defaultAboutForRole(mine))+'</textarea>'+
          (mine.about ? '' : '<span class="hint">We started you off with the obvious version — edit it to make it yours.</span>')+
        '</div>'+
        '<button class="btn primary" type="submit" style="margin-top:8px">Save</button>'+
      '</form>'+
    '</div>';
  }
  // Resizes/compresses to a square JPEG client-side before it ever leaves
  // the device — keeps uploads small and fast on a slow farm connection,
  // and means everyone's photo renders at a predictable size everywhere.
  function uploadProfilePhoto(file){
    if(!file || !currentUser) return;
    if(!storage){ toast('Photo upload needs an internet connection.'); return; }
    if(file.type.indexOf('image/')!==0){ toast('Please choose an image file.'); return; }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      URL.revokeObjectURL(url);
      var SIZE = 320;
      var canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      var ctx = canvas.getContext('2d');
      var side = Math.min(img.naturalWidth, img.naturalHeight);
      var sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      canvas.toBlob(function(blob){
        if(!blob){ toast('Could not process that image.'); return; }
        toast('Uploading photo…');
        var ref = storage.ref('profilePhotos/'+currentUser.uid+'/photo.jpg');
        ref.put(blob, {contentType:'image/jpeg'}).then(function(){
          return ref.getDownloadURL();
        }).then(function(downloadURL){
          return firebase.functions().httpsCallable('updateOwnProfile')({photoURL: downloadURL});
        }).then(function(){
          toast('Photo updated.');
          var preview = document.getElementById('profile-photo-preview');
          if(preview) preview.innerHTML = avatarHTML({photoURL: currentURLWithCacheBust(), name: currentUser.name}, 84);
          if(ui.section==='directory') render();
        }).catch(function(err){ toast((err&&err.message) || 'Could not upload that photo — please try again.'); });
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); toast('Could not read that image file.'); };
    img.src = url;
  }
  // Same client-side resize-before-upload approach as the profile photo
  // above, but for a Health record or Expense's own attachment — full
  // aspect ratio kept (a receipt or a sick bird photo isn't square),
  // capped at 1280px on the long edge so it stays quick to upload on a
  // slow connection. Written straight onto the record in the shared farm
  // document (mutate), same as every other field on it — no separate
  // Cloud Function needed, since this isn't security-sensitive the way a
  // profile/role claim is.
  var ATTACH_ARRAY_BY_TYPE = { health:'healthRecords', expense:'expenses' };
  function attachPhotoTo(type, id, file){
    if(!file || !id) return;
    if(!storage){ toast('Photo upload needs an internet connection.'); return; }
    if(file.type.indexOf('image/')!==0){ toast('Please choose an image file.'); return; }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      URL.revokeObjectURL(url);
      var MAXDIM = 1280;
      var scale = Math.min(1, MAXDIM/Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.max(1,Math.round(img.naturalWidth*scale)), h = Math.max(1,Math.round(img.naturalHeight*scale));
      var canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img, 0,0, w,h);
      canvas.toBlob(function(blob){
        if(!blob){ toast('Could not process that image.'); return; }
        toast('Uploading photo…');
        var ref = storage.ref('attachments/'+type+'/'+id+'/'+uid('photo')+'.jpg');
        ref.put(blob, {contentType:'image/jpeg'}).then(function(){
          return ref.getDownloadURL();
        }).then(function(downloadURL){
          mutate(function(s){
            var arrName = ATTACH_ARRAY_BY_TYPE[type];
            var rec = (s[arrName]||[]).find(function(x){return x.id===id;});
            if(rec) rec.photoURL = downloadURL;
          });
          toast('Photo attached.');
          openModal(type==='health' ? healthFormHtml(id) : moneyFormHtml('expense', id));
        }).catch(function(err){ toast((err&&err.message) || 'Could not upload that photo — please try again.'); });
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); toast('Could not read that image file.'); };
    img.src = url;
  }
  function attachPhotoBlockHtml(type, id, photoURL){
    if(!id) return '<p class="hint" style="margin-top:12px">Save this first, then reopen it to attach a photo.</p>';
    return '<div class="field-row" style="margin-top:12px"><label>Photo</label>'+
      (photoURL ? '<a href="'+esc(photoURL)+'" target="_blank" rel="noopener"><img src="'+esc(photoURL)+'" style="max-width:180px; max-height:180px; border-radius:8px; display:block; margin-bottom:8px; object-fit:cover"></a>' : '')+
      '<div style="display:flex; gap:8px">'+
        '<label class="btn" style="margin:0">'+(photoURL?'Replace photo':'Add photo')+'<input type="file" accept="image/*" data-change="attach-photo:'+type+':'+id+'" style="display:none" '+(readOnly?'disabled':'')+'></label>'+
        (photoURL ? '<button type="button" class="btn" data-action="remove-photo:'+type+':'+id+'" '+(readOnly?'disabled':'')+'>Remove photo</button>' : '')+
      '</div></div>';
  }
  // Storage URLs already carry their own unique download token, so the
  // browser never caches a stale photo under a "new" upload's URL — the
  // live users/{uid} listener (initDirectorySync) refreshes the real
  // photoURL a moment later anyway, this just avoids a blank flash.
  function currentURLWithCacheBust(){
    var mine = teamUsers.find(function(u){ return currentUser && u.uid===currentUser.uid; });
    return mine && mine.photoURL;
  }
  function directoryPanel(){
    if(!currentUser) return '<div class="empty">'+ICONS.empty+'<div>Sign in to see the team directory.</div></div>';
    var roster = teamUsers.filter(function(u){ return !u.disabled; }).slice().sort(function(a,b){
      var aRank = a.role==='administrator' ? 0 : (a.role==='coadmin' ? 1 : 2);
      var bRank = b.role==='administrator' ? 0 : (b.role==='coadmin' ? 1 : 2);
      if(aRank !== bRank) return aRank - bRank;
      return (a.name||a.email||'').localeCompare(b.name||b.email||'');
    });
    var dirPage = paginate('directory', roster);
    var dirAdmin = isAdmin();
    var dirAdminLevel = isAdminLevel();
    var cards = dirPage.items.map(function(u){
      var isSelf = currentUser && u.uid===currentUser.uid;
      var roleTxt = roleLabel(u);
      // Birthday row: always visible (and self-editable) for your own card;
      // for everyone else's, only the administrator sees anything here at
      // all, and even then only after the dedicated Birthday PIN reveal
      // (see birthday-reveal-prompt) — every other role never sees another
      // team member's date of birth anywhere in this app.
      var dobRow = '';
      if(isSelf){
        dobRow = '<div style="margin-top:6px; display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-2)">'+
          '<span class="inline-ico" style="width:14px; height:14px">'+ICONS.cake+'</span>'+
          (myDob ? esc(fmtDate(new Date(myDob+'T00:00:00'))) : '<span class="hint">Birthday not set</span>')+
          ' <button type="button" class="linklike" data-action="open-set-own-dob" style="font-size:12.5px">'+(myDob?'Edit':'Add')+'</button>'+
        '</div>';
      } else if(dirAdmin){
        var dv = teamBirthdays && teamBirthdays[u.uid];
        dobRow = '<div style="margin-top:6px; display:flex; align-items:center; gap:6px; font-size:13px; color:var(--ink-2)">'+
          '<span class="inline-ico" style="width:14px; height:14px">'+ICONS.cake+'</span>'+
          (birthdaysRevealed
            ? ((dv ? esc(fmtDate(new Date(dv+'T00:00:00'))) : '<span class="hint">Not set</span>') + ' <button type="button" class="linklike" data-action="open-set-staff-dob:'+u.uid+'" style="font-size:12.5px">Edit</button>')
            : '<span class="hint">Hidden</span>')+
        '</div>';
      }
      return '<div class="card" style="display:flex; gap:14px; align-items:flex-start">'+
        avatarHTML(u, 56)+
        '<div style="flex:1; min-width:0">'+
          '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap"><strong>'+esc(u.name||(u.email?u.email.split('@')[0]:'Unnamed'))+'</strong>'+
            '<span class="role-pill '+((u.role==='administrator'||u.role==='coadmin')?'admin':'')+'">'+esc(roleTxt)+'</span>'+
            (isSelf ? '<span class="hint">(you)</span>' : '')+
          '</div>'+
          (u.about ? '<p style="margin:6px 0 0; white-space:pre-wrap; color:var(--ink-2); font-size:13.5px">'+esc(u.about)+'</p>' : '<p style="margin:6px 0 0; white-space:pre-wrap; color:var(--ink-2); font-size:13.5px">'+esc(defaultAboutForRole(u))+'</p>')+
          dobRow+
          (!isSelf && dirAdminLevel ? '<button type="button" class="btn sm" style="margin-top:8px" data-action="open-kudos:'+esc(u.uid)+'">🎉 Congratulate</button>' : '')+
        '</div>'+
      '</div>';
    }).join('');
    var birthdayEyeBtn = dirAdmin
      ? '<button class="icon-btn" style="margin-left:6px" data-action="'+(birthdaysRevealed?'birthday-reveal-hide':'birthday-reveal-prompt')+'" title="'+(birthdaysRevealed?'Hide birthdays':'Show birthdays')+'">'+(birthdaysRevealed?ICONS.eyeOff:ICONS.eye)+'</button>'
      : '';
    return '<div class="card"><div class="card-title"><h3>Your profile</h3><span class="hint">Photo &amp; About — visible to the whole team</span></div>'+
        profileEditFormHTML()+
      '</div>'+
      '<div class="card-title" style="margin-top:4px"><h3>Everyone on the farm'+birthdayEyeBtn+'</h3><span class="hint">'+roster.length+' member'+(roster.length===1?'':'s')+'</span></div>'+
      (dirAdmin && !birthdaysRevealed ? '<div class="hint" style="margin-bottom:10px">Birthdays are masked on screen — tap <span class="inline-ico">'+ICONS.eye+'</span> to reveal them (needs your Birthday PIN).</div>' : '')+
      '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:12px">'+cards+'</div>'+
      pagerHtml('directory', dirPage.pageCount, dirPage.page);
  }

  /* ============================= MESSAGING (team-wide broadcast + one-to-one) ============================= */
  var urgentAlertQueue = [];
  // Three gentle, procedurally-synthesized sounds (Web Audio — no audio
  // files to fetch or license) instead of the old flat square-wave beep,
  // one per alert kind: a soft chick "peep" for a document waiting on your
  // signature, a soft hen "cluck" for egg activity, and a soft rooster
  // "crow" for a plain team message. All three are deliberately quiet —
  // sine/triangle waves with a gentle attack/decay, never a harsh buzz.
  function playChickSound(){
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext; if(!Ctx) return;
      var ctx = new Ctx();
      [0, 0.16].forEach(function(delay){
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        var t0 = ctx.currentTime + delay;
        o.frequency.setValueAtTime(1500, t0);
        o.frequency.exponentialRampToValueAtTime(1900, t0+0.09);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.11, t0+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0+0.14);
      });
    }catch(e){}
  }
  function playHenSound(){
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext; if(!Ctx) return;
      var ctx = new Ctx();
      [0, 0.24].forEach(function(delay){
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        var t0 = ctx.currentTime + delay;
        o.frequency.setValueAtTime(360, t0);
        o.frequency.exponentialRampToValueAtTime(240, t0+0.16);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.10, t0+0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0+0.22);
      });
    }catch(e){}
  }
  function playRoosterSound(){
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext; if(!Ctx) return;
      var ctx = new Ctx();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      var t0 = ctx.currentTime;
      var notes = [520, 640, 560, 420]; // a gentle up-down "crow" shape, soft not sharp
      var segDur = 0.14;
      notes.forEach(function(f, i){
        var when = t0 + i*segDur;
        if(i===0) o.frequency.setValueAtTime(f, when);
        else o.frequency.exponentialRampToValueAtTime(f, when);
      });
      var total = notes.length*segDur;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+total);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0+total+0.05);
    }catch(e){}
  }
  function renderUrgentAlert(){
    var el = document.getElementById('urgent-alert');
    if(!el) return;
    if(!urgentAlertQueue.length){ el.hidden = true; el.innerHTML = ''; return; }
    var msg = urgentAlertQueue[0];
    var isSignoff = msg.kind==='signoff-request';
    var isHatch = msg.kind==='hatch';
    var isBirthday = msg.kind==='birthday-wish' || msg.kind==='birthday-announcement';
    var isKudos = msg.kind==='kudos';
    var celebrationClass = isHatch?' hatch':(isBirthday?' birthday':(isKudos?' kudos':''));
    var icon = isSignoff?ICONS.signature:isHatch?'🐣':isBirthday?'🎂':isKudos?'🎉':ICONS.warning;
    var lead = isSignoff?'Waiting on your signature — ':isHatch?'Chicks hatched! — '
      :msg.kind==='birthday-wish'?'Happy Birthday! — ':msg.kind==='birthday-announcement'?'Birthday today — '
      :isKudos?'Congratulations! — ':'Urgent message from ';
    el.hidden = false;
    el.innerHTML = '<div class="urgent-alert-box'+(isSignoff?' signoff':'')+celebrationClass+'">'+
      '<span class="urgent-alert-icon">'+icon+'</span>'+
      '<div class="urgent-alert-text"><strong>'+lead+esc(msg.fromLabel||'a team member')+'</strong>'+esc((msg.body||'').slice(0,180))+'</div>'+
      '<div class="urgent-alert-actions">'+
        '<button class="btn sm primary" data-action="urgent-alert-view">View</button>'+
        '<button class="btn sm ghost" data-action="urgent-alert-dismiss">Dismiss</button>'+
      '</div></div>';
  }
  function triggerUrgentAlert(msg){
    urgentAlertQueue.push(msg);
    renderUrgentAlert();
    if(msg.kind==='signoff-request' || msg.kind==='hatch' || msg.kind==='birthday-wish' || msg.kind==='birthday-announcement' || msg.kind==='kudos') playChickSound(); else playRoosterSound();
    showBackgroundAlert(msg);
  }
  // Surfaces whatever urgent items were already waiting — a signature
  // request, an Urgent message — before this device even opened the app,
  // using the same popup + sound a live arrival would get. Called exactly
  // once, right after the very first snapshot of each messages listener
  // loads (see initMessagesSync): that batch reports every existing
  // matching message as 'added', so without this filter every message
  // you'd ever received would re-pop on every single app open — instead
  // only ones still unread get the alert, and it stops repeating for a
  // given message as soon as it's opened/marked read.
  function queueInitialUrgentAlerts(list){
    if(!currentUser) return;
    var qualifying = list.filter(function(m){
      return isMessageForMe(m) && (m.readBy||[]).indexOf(currentUser.uid)===-1 &&
        (m.kind==='signoff-request' || m.urgency==='urgent');
    });
    if(!qualifying.length) return;
    qualifying.sort(function(a,b){
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return ta - tb; // oldest first, so "View" walks through them in arrival order
    });
    qualifying.forEach(function(m){ urgentAlertQueue.push(m); });
    renderUrgentAlert();
    // One sound for the whole batch, not one per pending item.
    if(qualifying.some(function(m){ return m.kind==='signoff-request' || m.kind==='hatch' || m.kind==='birthday-wish' || m.kind==='birthday-announcement' || m.kind==='kudos'; })) playChickSound(); else playRoosterSound();
    showBackgroundAlert(qualifying[0]);
  }
  // The soft, nothing-to-do egg notification — bottom-corner toast, hen
  // sound, gone on its own after 30s. Deliberately separate from
  // triggerUrgentAlert above: this never interrupts with a popup or asks
  // for a decision, it's purely "here's what happened, and who did it".
  function triggerEggToast(msg){
    var root = document.getElementById('egg-toast-root');
    if(!root) return;
    var el = document.createElement('div');
    el.className = 'egg-toast';
    el.innerHTML = '<span class="egg-toast-icon">'+ICONS.eggs+'</span>'+
      '<div class="egg-toast-text"><strong>'+esc(msg.fromLabel||'A team member')+'</strong>'+esc((msg.body||'').slice(0,180))+'</div>';
    root.appendChild(el);
    playHenSound();
    setTimeout(function(){
      el.classList.add('closing');
      setTimeout(function(){ el.remove(); }, 320);
    }, 30000);
  }
  // A real system notification for Urgent messages, so they're impossible
  // to miss even when this tab isn't the one on screen — another tab is
  // focused, the window is minimized, or (on a phone) the screen is off
  // with the app still running underneath. Below this is the separate,
  // fully-closed-app case (registerForPush / sw.js's onBackgroundMessage) —
  // this function only covers "tab open somewhere, just not focused".
  function showBackgroundAlert(msg){
    if(typeof Notification==='undefined' || Notification.permission!=='granted') return;
    if(!document.hidden) return; // in-page banner + sound already cover the foreground case
    var title = msg.kind==='hatch' ? '🐣 Chicks hatched!' : msg.kind==='signoff-request' ? 'Waiting on your signature'
      : msg.kind==='birthday-wish' ? '🎂 Happy Birthday!' : msg.kind==='birthday-announcement' ? '🎂 Birthday today'
      : msg.kind==='kudos' ? '🎉 Congratulations!' : 'Urgent — '+(msg.fromLabel||'a team member');
    var opts = {
      body: (msg.body||'').slice(0,180),
      icon: './icons/icon-192.png',
      tag: 'kenokip-urgent-'+(msg.id||Date.now()),
      requireInteraction: true
    };
    if(navigator.serviceWorker && navigator.serviceWorker.ready){
      navigator.serviceWorker.ready.then(function(reg){ reg.showNotification(title, opts); }).catch(function(){
        try{ new Notification(title, opts); }catch(e){}
      });
    } else {
      try{ new Notification(title, opts); }catch(e){}
    }
  }
  // Registers this device for real push notifications (Firebase Cloud
  // Messaging) — these reach the phone even with the app fully closed,
  // unlike showBackgroundAlert() above which needs a tab still open
  // somewhere. Requires a VAPID key from the Firebase console (see
  // SETUP-PUSH.md) — until that's filled in, this quietly does nothing, so
  // the button above still works for the tab-open case either way.
  function registerForPush(){
    if(!currentUser) return;
    if(!VAPID_KEY || VAPID_KEY.indexOf('PASTE_')===0) return;
    if(!(window.firebase && firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported())) return;
    if(!navigator.serviceWorker){ return; }
    navigator.serviceWorker.ready.then(function(reg){
      var messaging = firebase.messaging();
      return messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    }).then(function(token){
      if(!token) return;
      return firebase.functions().httpsCallable('registerPushToken')({ token: token });
    }).catch(function(){ /* best-effort — the in-tab alert path still works */ });
  }
  function isMessageForMe(m){
    if(!currentUser || m.fromUid===currentUser.uid) return false;
    return m.toUid===currentUser.uid || m.toUid==='all';
  }
  function unreadMessageCount(){
    if(!currentUser) return 0;
    return messages.filter(function(m){ return isMessageForMe(m) && (m.readBy||[]).indexOf(currentUser.uid)===-1; }).length;
  }
  function initOwnProfileSync(){
    if(!db || !currentUser) return;
    db.collection('users').doc(currentUser.uid).onSnapshot(function(snap){
      if(snap.exists && currentUser){
        var d = snap.data();
        currentUser.name = d.name || null;
        currentUser.totpEnrolled = !!d.totpEnrolled;
        currentUser.portalTotpEnrolled = !!d.portalTotpEnrolled;
        currentUser.away = !!d.away;
        render();
      }
    }, function(){});
  }
  function initMessagesSync(){
    if(messagesSyncStarted || !db || !currentUser) return;
    messagesSyncStarted = true;
    var merged = {};
    function applyAll(){
      messages = Object.keys(merged).map(function(k){ return merged[k]; }).sort(function(a,b){
        var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      render();
    }
    function makeHandler(){
      var seenInitial = false;
      return function(snap){
        var initialBatch = [];
        snap.docChanges().forEach(function(change){
          if(change.type==='removed'){ delete merged[change.doc.id]; return; }
          var data = Object.assign({id:change.doc.id}, change.doc.data());
          merged[change.doc.id] = data;
          if(!seenInitial){
            // The very first snapshot from a fresh listener delivers every
            // already-existing matching message as an 'added' change, not
            // just genuinely new ones — collected here so they can be
            // checked for anything still unread once the whole batch is in
            // (see queueInitialUrgentAlerts below), instead of popping the
            // big alert for the entire history on every app open.
            initialBatch.push(data);
          } else if(change.type==='added' && data.fromUid!==currentUser.uid &&
             (data.toUid===currentUser.uid || data.toUid==='all')){
            // Egg activity is always a soft, no-action toast (see
            // notifyEggActivity/triggerEggToast) — never the big popup,
            // even though it's carried on the same messages collection.
            if(data.kind==='egg-activity') triggerEggToast(data);
            else if(data.urgency==='urgent') triggerUrgentAlert(data);
          }
        });
        if(!seenInitial){
          seenInitial = true;
          queueInitialUrgentAlerts(initialBatch);
        }
        applyAll();
      };
    }
    if(isAdminLevel()){
      db.collection('messages').orderBy('createdAt','desc').limit(300).onSnapshot(makeHandler(), function(){});
    } else {
      db.collection('messages').where('toUid','==','all').onSnapshot(makeHandler(), function(){});
      db.collection('messages').where('toUid','==',currentUser.uid).onSnapshot(makeHandler(), function(){});
      db.collection('messages').where('fromUid','==',currentUser.uid).onSnapshot(makeHandler(), function(){});
    }
  }
  function composeMessageFormHtml(prefill){
    prefill = prefill || {};
    var others = teamUsers.filter(function(u){ return currentUser && u.uid!==currentUser.uid && !u.disabled; });
    var options = others.map(function(u){
      var label = roleLabel(u)+'('+(u.name||(u.email?u.email.split('@')[0]:'Unnamed'))+')';
      return '<option value="'+esc(u.uid)+'"'+(prefill.to===u.uid?' selected':'')+'>'+esc(label)+'</option>';
    }).join('');
    var quoteHtml = prefill.quoteBody ? '<div class="hint" style="margin-bottom:12px; padding:8px 10px; border-left:3px solid var(--accent, #4a7); border-radius:6px; background:rgba(127,127,127,.12)">Replying to '+esc(prefill.quoteFrom||'a message')+': "'+esc(prefill.quoteBody)+'"</div>' : '';
    return '<div class="modal-head"><h3>'+(prefill.replyTo?'Reply':'New message')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="compose-message">'+
      quoteHtml+
      '<input type="hidden" name="replyTo" value="'+esc(prefill.replyTo||'')+'">'+
      '<div class="field-row"><label>To</label><select class="field" name="to">'+
        (isAdminLevel() ? '<option value="all"'+(prefill.to==='all'?' selected':'')+'>Everyone</option>' : '')+
        options+
      '</select></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Urgency</label><select class="field" name="urgency">'+
        '<option value="normal">Normal</option>'+
        '<option value="important">Important</option>'+
        '<option value="urgent">Urgent — pops up with a sound for the recipient</option>'+
      '</select></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Message</label><textarea class="field" name="body" rows="4" maxlength="2000" required autofocus></textarea></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Send</button></div>'+
    '</form>';
  }
  // A small colored kind-pill so a glance down the list tells "needs your
  // signature" (chick/gold), "egg activity" (hen/amber) and a plain message
  // apart, without having to read the body text.
  function messageKindPillHtml(m){
    if(m.kind==='signoff-request') return '<span class="pill" style="background:hsl(38,75%,90%); color:hsl(30,70%,30%)">🐣 Needs your signature</span>';
    if(m.kind==='hatch') return '<span class="pill" style="background:hsl(44,80%,90%); color:hsl(38,70%,26%)">🐣 Chicks hatched</span>';
    if(m.kind==='egg-activity') return '<span class="pill" style="background:hsl(44,70%,90%); color:hsl(30,55%,28%)">🥚 Egg activity</span>';
    if(m.kind==='digest') return '<span class="pill" style="background:hsl(200,55%,92%); color:hsl(205,60%,30%)">📊 Weekly digest</span>';
    if(m.kind==='birthday-wish' || m.kind==='birthday-announcement') return '<span class="pill" style="background:hsl(44,80%,90%); color:hsl(38,70%,26%)">🎂 Birthday</span>';
    if(m.kind==='kudos') return '<span class="pill" style="background:hsl(44,80%,90%); color:hsl(38,70%,26%)">🎉 Kudos'+(m.reward?' + reward':'')+'</span>';
    return '';
  }
  function messageRowHtml(m){
    var unread = isMessageForMe(m) && (m.readBy||[]).indexOf(currentUser.uid)===-1;
    var when = (m.createdAt && m.createdAt.toDate) ? fmtDate(m.createdAt.toDate(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Sending…';
    var toLabel = m.toUid==='all' ? 'Everyone' : (m.toLabel || 'a team member');
    var attr = unread ? ' data-action="mark-message-read:'+m.id+'"' : '';
    var quoteBlock = m.replyToSnippet ? '<div class="hint" style="margin:6px 0; padding:6px 8px; border-left:3px solid var(--border, #ccc)">↩ '+esc(m.replyToFromLabel||'a message')+': "'+esc(m.replyToSnippet)+'"</div>' : '';
    var canReply = currentUser && m.fromUid && m.fromUid!==currentUser.uid && m.fromUid!=='system';
    var sender = teamUsers.find(function(u){ return u.uid===m.fromUid; });
    return '<div class="message-row'+(unread?' unread':'')+'"'+attr+'>'+
      avatarHTML(sender || {name:m.fromLabel}, 38)+
      '<div style="flex:1; min-width:0">'+
        '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap">'+(unread?'<strong>':'')+esc(m.fromLabel||'Unknown')+(unread?'</strong>':'')+' <span class="hint">→ '+esc(toLabel)+'</span>'+messageKindPillHtml(m)+'</div>'+
        quoteBlock+
        '<div style="margin-top:3px">'+esc(m.body||'')+'</div>'+
        '<div class="message-meta">'+when+(unread?' · tap to mark read':'')+'</div>'+
        (canReply || m.pendingSignoffId ? '<div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap">'+
          (m.pendingSignoffId ? '<button class="btn sm primary" data-action="open-pending-signoff:'+esc(m.pendingSignoffId)+'">Open document</button>' : '')+
          (canReply ? '<button class="btn sm" data-action="reply-message:'+esc(m.id)+'">Reply</button>' : '')+
        '</div>' : '')+
      '</div>'+
    '</div>';
  }
  function messagesPanel(){
    if(!currentUser) return '<div class="empty">'+ICONS.empty+'<div>Sign in to use Messages.</div></div>';
    var showAll = isAdminLevel() && messagesViewAll;
    var list = showAll ? messages : messages.filter(function(m){ return isMessageForMe(m) || m.fromUid===currentUser.uid; });
    var groups = [['urgent','Urgent'],['important','Important'],['normal','Normal']];
    var sectionsHtml = groups.map(function(g){
      var allItems = list.filter(function(m){ return (m.urgency||'normal')===g[0]; });
      if(!allItems.length) return '';
      var pageKey = 'messages-'+g[0];
      var msgPage = paginate(pageKey, allItems);
      var items = msgPage.items;
      return '<div class="card"><div class="card-title"><h3><span class="role-pill '+g[0]+'">'+g[1]+'</span></h3><span class="hint">'+allItems.length+'</span></div>'+
        items.map(messageRowHtml).join('')+
        pagerHtml(pageKey, msgPage.pageCount, msgPage.page)+
      '</div>';
    }).join('');
    return '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px">'+
        '<button class="btn primary" data-action="open-compose-message">'+ICONS.plus+'New message</button>'+
        (isAdminLevel() ? '<button class="btn" data-action="open-kudos:all">🎉 Congratulate the team</button>' : '')+
        (isAdminLevel() ? '<button class="btn" data-action="toggle-messages-view">'+(showAll?'Show my messages':'Show all team messages')+'</button>' : '')+
      '</div>'+
      (sectionsHtml || '<div class="empty">'+ICONS.empty+'<div>No messages yet.</div></div>');
  }
  // Ready-made sentences the administrator can pick from when sending
  // Kudos, instead of writing one from scratch every time — still just a
  // starting point in the message textarea, editable before sending.
  // {name} is swapped for the recipient's first name client-side.
  var KUDOS_INDIVIDUAL_TEMPLATES = [
    'Great job, {name}! Your hard work on the farm hasn\'t gone unnoticed — thank you for everything you do. 🌟',
    '{name}, you went above and beyond recently and it made a real difference. Well done! 👏',
    'A big thank you to {name} for the excellent work lately — Kenokip Farm is lucky to have you. 🙌',
    '{name}, your dedication and attention to detail continue to impress. Keep up the great work! 💪',
    'Kudos to {name} for stepping up and getting the job done so well. We appreciate you! 🎉'
  ];
  var KUDOS_GROUP_TEMPLATES = [
    'Amazing teamwork, everyone! What we accomplished together shows exactly why Kenokip Farm is special. 🙌',
    'Great job, team! Your combined effort and hard work really paid off — thank you all. 🌟',
    'To the whole Kenokip Farm team: well done on a fantastic effort. I\'m proud of what we\'ve built together. 👏',
    'Everyone pulled together and it showed — thank you, team, for your commitment and hard work. 🎉',
    'Outstanding work, team! Let\'s keep this momentum going — you should all be proud. 💪'
  ];
  var KUDOS_REWARD_OPTIONS = [
    'A bonus in your next pay',
    'An extra day off',
    'Airtime / data bundle',
    'A small gift from the farm',
    'Public recognition at the next team meeting'
  ];
  function kudosFormHtml(toUid, toName){
    var isGroup = toUid==='all';
    var firstName = (toName||'').split(' ')[0] || 'them';
    var templates = (isGroup ? KUDOS_GROUP_TEMPLATES : KUDOS_INDIVIDUAL_TEMPLATES).map(function(t){
      return t.split('{name}').join(firstName);
    });
    var templateOptions = '<option value="">Choose a ready-made sentence… (optional)</option>'+
      templates.map(function(t){ return '<option value="'+esc(t)+'">'+esc(t.length>72?t.slice(0,72)+'…':t)+'</option>'; }).join('');
    var rewardOptions = '<option value="">No reward this time</option>'+
      KUDOS_REWARD_OPTIONS.map(function(r){ return '<option value="'+esc(r)+'">'+esc(r)+'</option>'; }).join('')+
      '<option value="__custom__">Something else…</option>';
    return '<div class="modal-head"><h3>🎉 Congratulate '+(isGroup?'the team':esc(toName))+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Sent as a message from you'+(isGroup?' to everyone':' to '+esc(toName))+' — pick a ready sentence below or write your own.</p>'+
    '<form data-form="send-kudos">'+
      '<input type="hidden" name="to" value="'+esc(toUid)+'">'+
      '<div class="field-row"><label>Ready-made sentence (optional)</label><select class="field" data-change="kudos-template-pick">'+templateOptions+'</select></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Message</label><textarea class="field" id="kudos-message" name="message" rows="4" maxlength="500" placeholder="Write your congratulations…" required autofocus></textarea></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Reward (optional)</label><select class="field" name="rewardChoice" data-change="kudos-reward-pick">'+rewardOptions+'</select></div>'+
      '<div class="field-row" id="kudos-reward-custom-row" style="margin-top:8px; display:none"><label>Describe the reward</label><input class="field" type="text" name="rewardCustom" maxlength="200" placeholder="e.g. KSh 500 airtime"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Send'+(isGroup?' to everyone':'')+'</button></div>'+
    '</form>';
  }

  /* ============================= FINANCE (administrator + financial staff, approval-gated) ============================= */
  function defaultFinanceState(){ return { openingBalance:0, openingDate: todayISO(), transactions:[] }; }
  function financeState(){
    if(!state.finance || !Array.isArray(state.finance.transactions)) state.finance = defaultFinanceState();
    return state.finance;
  }
  function financeBalance(){
    var f = financeState();
    var net = f.transactions.reduce(function(a,t){
      var status = t.status || 'approved'; // legacy entries (from before approvals existed) count as approved
      if(status !== 'approved') return a;
      return a + (t.type==='deposit'?t.amount:-t.amount);
    }, 0);
    return (f.openingBalance||0) + net;
  }
  function financeTopbarActions(){
    if(!canSeeFinance()) return '';
    if(!financePortalUnlocked) return '';
    var actions = currencySelectHTML();
    if(isAdmin()) actions += '<button class="btn" data-action="open-set-opening">Opening balance</button>';
    if(mpesaEnabled && canProposeFinance()) actions += '<button class="btn" data-action="open-mpesa-deposit">Add via M-Pesa</button>';
    if(mpesaEnabled && isAdmin()) actions += mpesaPayoutsEnabled
      ? '<button class="btn" data-action="open-mpesa-withdraw">Send via M-Pesa</button>'
      : '<button class="btn" data-action="open-mpesa-withdraw" title="Payouts aren\'t available on this M-Pesa account yet" style="opacity:.55">Send via M-Pesa</button>';
    actions += addBtn('open-add-finance', isAdmin() ? 'Add transaction' : 'New transaction');
    return actions;
  }
  // ---- Money: lightweight cross-navigation ---------------------------
  // Income, Expenses, Finance, and Reports stay their own separate
  // sections (Finance's PIN/fingerprint/lockout gating is too
  // security-sensitive to risk merging into a shared route right now) —
  // but each now carries the same "Money" quick-switcher the other
  // partitioned sections (Flock/Eggs/Health) use, so hopping between them
  // doesn't mean going back to the sidebar every time. Deliberately never
  // shown on the Finance lock/PIN screens themselves.
  var MONEY_VIEWS = [['income','Income'],['expenses','Expenses'],['finance','Finance'],['reports','Reports']];
  function moneyCrossNavHTML(currentKey){
    return '<div class="card" style="padding:12px 16px; margin-bottom:14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap">'+
      '<label class="hint" style="margin:0">Money</label>'+
      '<select class="field" data-change="money-nav" style="max-width:200px; width:auto">'+
        MONEY_VIEWS.filter(function(v){ return sectionAllowed(v[0]); }).map(function(v){ return '<option value="'+v[0]+'" '+(currentKey===v[0]?'selected':'')+'>'+v[1]+'</option>'; }).join('')+
      '</select>'+
    '</div>';
  }
  function financePanel(){
    if(!canSeeFinance()) return '<div class="empty">'+ICONS.empty+'<div>Finance isn\'t available for your account.</div></div>';
    if(!financePortalUnlocked) return financePortalGateHTML();
    return moneyCrossNavHTML('finance') + financePanelInner();
  }
  function financePanelInner(){
    var f = financeState();
    var r = getRange('month');
    var visible = f.transactions.filter(function(t){
      var status = t.status || 'approved';
      return status==='approved' || isAdmin() || t.proposedBy===currentUser.uid;
    });
    var txns = visible.slice().sort(function(a,b){ return a.date<b.date?1:-1; });
    var approved = txns.filter(function(t){ return (t.status||'approved')==='approved'; });
    var inThisMonth = approved.filter(function(t){ return t.type==='deposit' && inRange(t.date,r.startISO,r.endISO); }).reduce(function(a,t){return a+t.amount;},0);
    var outThisMonth = approved.filter(function(t){ return t.type==='withdrawal' && inRange(t.date,r.startISO,r.endISO); }).reduce(function(a,t){return a+t.amount;},0);
    var balance = financeBalance();
    var revealed = financeRevealed;

    var lockNote = isAdmin()
      ? '<div class="banner">You can add, edit, approve, and delete entries here.'+(mpesaEnabled?' Payments made straight to the farm\'s M-Pesa till are picked up automatically.':'')+'</div>'
      : '<div class="banner">Deposits you add count right away. Withdrawals wait for the administrator\'s approval before they affect the balance.</div>';

    var eyeBtn = '<button class="icon-btn" style="margin-left:6px" data-action="'+(revealed?'finance-reveal-hide':'finance-reveal-prompt')+'" title="'+(revealed?'Hide amounts':'Show amounts')+'">'+(revealed?ICONS.eyeOff:ICONS.eye)+'</button>';
    var privacyNote = revealed ? '' : '<div class="hint" style="margin-bottom:10px">Amounts and notes are masked on screen — tap <span class="inline-ico">'+ICONS.eye+'</span> to reveal them (needs '+(isAdmin()?'your Finance PIN':'a code from your authenticator app')+').</div>';

    var finPage = paginate('finance-txns', txns);
    var rows = finPage.items.map(function(t){
      var status = t.status || 'approved';
      var good = t.type==='deposit';
      var statusPill = status==='pending' ? ' <span class="role-pill pending">Pending</span>' : (status==='rejected' ? ' <span class="role-pill rejected">Rejected</span>' : '');
      var amountText = revealed ? fmtMoney(t.amount) : maskMoneyDisplay(t.amount);
      var noteText = t.note ? (revealed ? esc(t.note) : esc(maskString(t.note))) : '—';
      return '<tr><td>'+fmtDate(parseISO(t.date))+'</td>'+
        '<td><span class="pill" style="background:'+(good?'var(--good-tint)':'var(--bad-tint)')+';color:'+(good?'var(--good)':'var(--bad)')+'">'+(good?'Deposit':'Withdrawal')+'</span>'+statusPill+'</td>'+
        '<td class="num">'+amountText+'</td>'+
        '<td>'+noteText+'</td>'+
        '<td><div class="row-actions">'+
          (revealed && status==='approved' ? '<button class="icon-btn" data-action="view-finance-receipt:'+t.id+'" title="View receipt">'+ICONS.receipt+'</button>' : '')+
          (isAdmin() ? '<button class="icon-btn" data-action="edit-finance:'+t.id+'">'+ICONS.edit+'</button><button class="icon-btn" data-action="delete-finance:'+t.id+'">'+ICONS.trash+'</button>' : '')+
        '</div></td></tr>';
    }).join('');

    return lockNote+privacyNote+
    '<div class="grid stats">'+
      statTile('Bank balance', (revealed?fmtMoney(balance):maskMoneyDisplay(balance)), '<span class="hint">Poultry-only account</span>'+eyeBtn)+
      statTile('In this month', (revealed?fmtMoney(inThisMonth):maskMoneyDisplay(inThisMonth)), '')+
      statTile('Out this month', (revealed?fmtMoney(outThisMonth):maskMoneyDisplay(outThisMonth)), '')+
    '</div>'+
    mpesaToolsCardHTML()+
    '<div class="card"><div class="card-title"><h3>Transactions</h3><span class="hint">'+txns.length+' recorded'+(f.openingDate?' · opening balance set '+fmtDate(parseISO(f.openingDate)):'')+'</span></div>'+
      '<div class="table-wrap">'+
      (txns.length ? '<table><thead><tr><th>Date</th><th>Type</th><th class="num">Amount</th><th>Note</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'
        : '<div class="empty">'+ICONS.empty+'<div>No transactions recorded yet.</div></div>')+
      '</div>'+pagerHtml('finance-txns', finPage.pageCount, finPage.page)+'</div>';
  }
  // WebAuthn (fingerprint/Face) needs the browser's newer JSON-friendly
  // helpers (PublicKeyCredential.parseCreationOptionsFromJSON etc.) — most
  // current Chrome/Edge/Safari have them; a few older or less common
  // browsers don't. Feature-detected rather than assumed, so those
  // browsers just don't show the tab at all and fall back to the
  // password + code method, which always works everywhere.
  function webauthnSupported(){
    return !!(window.PublicKeyCredential && PublicKeyCredential.parseCreationOptionsFromJSON && PublicKeyCredential.parseRequestOptionsFromJSON && navigator.credentials);
  }
  // The fingerprint/Face prompt itself is entirely the browser's/OS's own
  // native UI (Windows Hello, Touch ID, Android's fingerprint sheet) — this
  // app never sees the fingerprint or face data, only a yes/no "the
  // platform verified this person" result plus a signed proof, exactly
  // like a normal website sign-in with a security key.
  function enrollFinanceFingerprint(){
    if(!webauthnSupported()){ toast('Fingerprint/Face unlock needs a newer browser — try an up-to-date Chrome, Edge, or Safari.'); return; }
    firebase.functions().httpsCallable('startFinanceFingerprintEnrollment')().then(function(res){
      var publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(res.data);
      return navigator.credentials.create({ publicKey: publicKey });
    }).then(function(cred){
      return firebase.functions().httpsCallable('finishFinanceFingerprintEnrollment')({ response: cred.toJSON() });
    }).then(function(){
      toast('Fingerprint/Face unlock set up on this device.');
      refreshFinanceGuardStatus();
    }).catch(function(err){
      if(err && (err.name==='NotAllowedError' || err.code==='cancelled')){ toast('Cancelled.'); return; }
      toast((err&&err.message)||'Could not set up fingerprint/Face unlock.');
    });
  }
  function removeFinanceFingerprintDevice(id){
    firebase.functions().httpsCallable('removeFinanceFingerprint')({ id: id }).then(function(){
      toast('Removed.');
      refreshFinanceGuardStatus();
    }).catch(function(err){ toast((err&&err.message)||'Could not remove that device.'); });
  }
  function unlockWithFinanceFingerprint(){
    if(!webauthnSupported()){ toast('Fingerprint/Face unlock needs a newer browser.'); return; }
    var pinEl = document.getElementById('finance-fingerprint-pin');
    var pin = pinEl ? pinEl.value : '';
    if(!pin){ toast('Enter your personal PIN.'); return; }
    var btn = document.getElementById('unlock-finance-fingerprint-submit');
    var resetBtn = function(){ if(btn){ btn.disabled = false; btn.innerHTML = ICONS.fingerprint+' Unlock with fingerprint / Face'; } };
    if(btn){ btn.disabled = true; btn.textContent = 'Checking…'; }
    firebase.functions().httpsCallable('startFinanceFingerprintUnlock')().then(function(res){
      var publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(res.data);
      return navigator.credentials.get({ publicKey: publicKey });
    }).then(function(cred){
      return firebase.functions().httpsCallable('finishFinanceFingerprintUnlock')({ response: cred.toJSON(), pin: pin });
    }).then(function(){
      financePortalUnlocked = true;
      startFinancePortalTimer();
      toast('Finance portal unlocked.');
      render();
    }).catch(function(err){
      resetBtn();
      refreshFinanceGuardStatus();
      if(err && err.name==='NotAllowedError'){ toast('Cancelled.'); return; }
      toast((err&&err.message)||'Could not unlock the Finance portal.');
      render();
    });
  }
  // ---- Administrator's quick PIN pad (financeQuickPinGateHTML above) ----
  // Digit taps update the DOM directly (no render()) so it feels instant and
  // never desyncs mid-typing; render() only happens once, on submit success
  // or failure, or when switching tabs — see quickPinBuffer's own comment.
  function quickPinRenderDots(){
    var wrap = document.getElementById('quickpin-dots');
    if(!wrap) return;
    var dots = wrap.children;
    for(var i=0;i<dots.length;i++){ dots[i].classList.toggle('filled', i < quickPinBuffer.length); }
  }
  function quickPinSetStatus(msg){
    var el = document.getElementById('quickpin-status');
    if(el) el.textContent = msg || ' ';
  }
  function quickPinShake(){
    var wrap = document.getElementById('quickpin-dots');
    if(!wrap) return;
    wrap.classList.remove('shake');
    // Force a reflow so re-adding the class restarts the animation even if
    // it just ran (e.g. two wrong PINs typed back to back).
    void wrap.offsetWidth;
    wrap.classList.add('shake');
  }
  function quickPinPressDigit(d){
    if(quickPinBusy || !financeGuardStatus || !financeGuardStatus.pinSet) return;
    var pinLen = financeGuardStatus.pinLength || 4;
    if(quickPinBuffer.length >= pinLen) return;
    quickPinBuffer += String(d);
    quickPinRenderDots();
    quickPinSetStatus('');
    if(quickPinBuffer.length === pinLen) quickPinSubmit();
  }
  function quickPinBackspaceKey(){
    if(quickPinBusy) return;
    quickPinBuffer = quickPinBuffer.slice(0, -1);
    quickPinRenderDots();
  }
  // Auto-submits the moment the PIN pad is full — no OK button, matching
  // what was asked for. Wrong PIN: dots shake, buffer clears, and (per
  // quickUnlockFinancePortal in financeGuard.js) it counts toward the same
  // shared 3-strikes lockout / admin alert as every other Finance security
  // check — a 3rd wrong entry surfaces the authenticator step-up on the
  // lock screen (financeLockedGateHTML), not silently, and the
  // administrator gets an alert on every wrong attempt either way.
  function quickPinSubmit(){
    quickPinBusy = true;
    quickPinSetStatus('Checking…');
    var pinVal = quickPinBuffer;
    firebase.functions().httpsCallable('quickUnlockFinancePortal')({ pin: pinVal }).then(function(){
      financePortalUnlocked = true;
      startFinancePortalTimer();
      toast('Finance portal unlocked.');
      render();
    }).catch(function(err){
      quickPinBusy = false;
      quickPinBuffer = '';
      quickPinRenderDots();
      quickPinShake();
      quickPinSetStatus((err&&err.message)||'Incorrect PIN.');
      refreshFinanceGuardStatus();
      if(err && err.code==='permission-denied' && /locked/i.test((err&&err.message)||'')) render();
    });
  }
  function quickPinFingerprint(){
    if(!webauthnSupported()){ toast('Fingerprint/Face unlock needs a newer browser.'); return; }
    quickPinSetStatus('Checking…');
    firebase.functions().httpsCallable('startFinanceFingerprintUnlock')().then(function(res){
      var publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(res.data);
      return navigator.credentials.get({ publicKey: publicKey });
    }).then(function(cred){
      return firebase.functions().httpsCallable('quickUnlockFinancePortal')({ response: cred.toJSON() });
    }).then(function(){
      financePortalUnlocked = true;
      startFinancePortalTimer();
      toast('Finance portal unlocked.');
      render();
    }).catch(function(err){
      quickPinSetStatus('');
      refreshFinanceGuardStatus();
      if(err && err.name==='NotAllowedError'){ toast('Cancelled.'); return; }
      toast((err&&err.message)||'Could not unlock the Finance portal.');
      render();
    });
  }
  // "Use fingerprint" from inside the Send-via-M-Pesa modal — gathers the
  // already-typed phone/amount/note directly from the open modal's fields
  // (this is a plain button, not a form submit, so handleForm's FormData
  // helper doesn't apply here) and confirms the payout with a fingerprint/
  // Face check instead of the PIN field.
  function mpesaWithdrawWithFingerprint(){
    if(!webauthnSupported()){ toast('Fingerprint/Face unlock needs a newer browser.'); return; }
    var phone = ((document.getElementById('mpesa-withdraw-phone')||{}).value||'').trim();
    var amount = Number((document.getElementById('mpesa-withdraw-amount')||{}).value||0);
    var note = ((document.getElementById('mpesa-withdraw-note')||{}).value||'').trim();
    if(!phone || !amount){ toast('Enter the recipient phone and amount first.'); return; }
    var btn = document.getElementById('mpesa-withdraw-submit');
    if(btn) btn.disabled = true;
    firebase.functions().httpsCallable('startFinanceFingerprintUnlock')().then(function(res){
      var publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(res.data);
      return navigator.credentials.get({ publicKey: publicKey });
    }).then(function(cred){
      return firebase.functions().httpsCallable('initiateWithdrawal')({ amount: amount, phone: phone, note: note, fingerprintResponse: cred.toJSON() });
    }).then(function(res){
      closeModal();
      toast((res.data && res.data.message) || 'Payout sent — it will show up here once Safaricom confirms it.');
    }).catch(function(err){
      if(btn) btn.disabled = false;
      if(err && err.name==='NotAllowedError'){ toast('Cancelled.'); return; }
      toast((err&&err.message)||'Could not send that payout.');
    });
  }
  function financePortalGateHTML(){
    if(financeGuardStatus===null) refreshFinanceGuardStatus();
    if(financeGuardStatus && financeGuardStatus.locked){
      return financeLockedGateHTML();
    }
    var admin = isAdmin();
    // The administrator's quick PIN-alone/fingerprint-alone unlock is the
    // default view for them — matching how they asked their own Finance
    // login to work — but only once it's actually usable (a PIN set and/or
    // a fingerprint enrolled) and only until they explicitly pick a
    // different tab themselves, which sticks for the rest of the session.
    var quickAvailable = admin && financeGuardStatus && (financeGuardStatus.pinSet || financeGuardStatus.fingerprintEnrolled);
    var effectiveTab = (!financeUnlockTabTouched && quickAvailable) ? 'quickpin' : financeUnlockTab;
    if(effectiveTab==='quickpin' && !quickAvailable) effectiveTab = 'password';
    if(effectiveTab==='quickpin') return financeQuickPinGateHTML();

    var showFingerprintTab = webauthnSupported();
    var tabsHtml = showFingerprintTab ? '<div class="segmented" style="margin-bottom:14px">'+
        '<button class="'+(financeUnlockTab==='password'?'active':'')+'" data-action="finance-unlock-tab:password" type="button">Password + code</button>'+
        '<button class="'+(financeUnlockTab==='fingerprint'?'active':'')+'" data-action="finance-unlock-tab:fingerprint" type="button">'+ICONS.fingerprint+' Fingerprint + PIN</button>'+
      '</div>' : '';
    var passwordTabHtml = '<form data-form="unlock-finance-portal">'+
        '<div class="field-row"><label>Finance portal password</label><input class="field" type="password" name="password" autocomplete="off" required autofocus></div>'+
        '<div class="field-row" style="margin-top:12px"><label>Finance portal authenticator code</label><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" placeholder="6-digit code" required></div>'+
        '<button class="btn primary" type="submit" style="width:100%; margin-top:16px" id="unlock-finance-portal-submit">Unlock Finance</button>'+
      '</form>'+
      (!(currentUser && currentUser.portalTotpEnrolled) ? '<p class="hint" style="margin-top:14px">Haven\'t set up the Finance portal authenticator yet? Do that first from Settings → Your account.</p>' : '');
    var fingerprintTabHtml;
    if(!showFingerprintTab){
      fingerprintTabHtml = '';
    } else if(!financeGuardStatus){
      fingerprintTabHtml = '<p class="hint">Loading…</p>';
    } else if(!financeGuardStatus.fingerprintEnrolled || !financeGuardStatus.pinSet){
      fingerprintTabHtml = '<p class="hint">Set up '+(!financeGuardStatus.fingerprintEnrolled?'fingerprint/Face unlock':'')+
        (!financeGuardStatus.fingerprintEnrolled && !financeGuardStatus.pinSet?' and ':'')+
        (!financeGuardStatus.pinSet?'your personal Finance PIN':'')+' first, from Settings → Your account.</p>';
    } else {
      fingerprintTabHtml = '<p class="hint">Your fingerprint or Face unlock proves this is your device; your personal PIN proves it\'s you — both are checked, every time.</p>'+
        '<div class="field-row"><label>Your personal Finance PIN</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" id="finance-fingerprint-pin" placeholder="Your PIN" autocomplete="off"></div>'+
        '<button class="btn primary" type="button" style="width:100%; margin-top:16px" id="unlock-finance-fingerprint-submit" data-action="unlock-finance-fingerprint">'+ICONS.fingerprint+' Unlock with fingerprint / Face</button>';
    }
    return '<div class="card" style="max-width:420px; margin:0 auto">'+
      '<div class="card-title"><h3><span class="inline-ico" style="width:18px; height:18px; margin-right:6px; vertical-align:-3px">'+ICONS.shield+'</span>Finance portal locked</h3></div>'+
      (quickAvailable ? '<p class="hint" style="margin-bottom:10px"><button type="button" style="background:none;border:none;color:var(--accent-strong);font:inherit;font-weight:600;cursor:pointer;padding:0" data-action="finance-unlock-tab:quickpin">⚡ Use your quick PIN / fingerprint instead</button></p>' : '')+
      (financeUnlockTab==='password' ? '<p class="hint">Enter the Finance portal password and a current Finance portal authenticator code to continue. Both are separate from your regular sign-in password and from the authenticator code used to reveal amounts or send M-Pesa payouts.</p>' : '')+
      tabsHtml+
      ((financeUnlockTab==='fingerprint' && showFingerprintTab) ? fingerprintTabHtml : passwordTabHtml)+
    '</div>';
  }
  // The administrator's fast, single-factor door: PIN alone, or
  // fingerprint/Face alone — deliberately not combined, and deliberately
  // restricted server-side (quickUnlockFinancePortal in financeGuard.js) to
  // the administrator's own account, so nobody else's login even offers
  // this. Styled distinctly on purpose — this should visually read as "a
  // different, faster door", not just another tab on the same form.
  // Two simple flat-illustration hen silhouettes, drawn as inline SVG (no
  // external image), reused as decorative background layers behind every
  // fullscreen PIN card — see .quickpin-scene-hen / .quickpin-fullscreen
  // above for how they're positioned and faded.
  var QUICKPIN_SCENE_HENS =
    '<svg class="quickpin-scene-hen h1" viewBox="0 0 100 100" aria-hidden="true">'+
      '<ellipse cx="52" cy="62" rx="30" ry="23" fill="#EAF6F1"/>'+
      '<circle cx="80" cy="42" r="13" fill="#EAF6F1"/>'+
      '<polygon points="92,42 104,38 104,47" fill="#E7A93D"/>'+
      '<path d="M74 31 q3 -9 8 -2 q3 -8 7 2 q-3 3 -7 3 q-4 0 -8 -3 z" fill="#E7A93D"/>'+
      '<ellipse cx="24" cy="70" rx="9" ry="12" fill="#EAF6F1"/>'+
      '<rect x="42" y="82" width="4" height="13" fill="#EAF6F1"/>'+
      '<rect x="60" y="82" width="4" height="13" fill="#EAF6F1"/>'+
    '</svg>'+
    '<svg class="quickpin-scene-hen h2" viewBox="0 0 100 100" aria-hidden="true">'+
      '<ellipse cx="52" cy="62" rx="30" ry="23" fill="#EAF6F1"/>'+
      '<circle cx="80" cy="42" r="13" fill="#EAF6F1"/>'+
      '<polygon points="92,42 104,38 104,47" fill="#E7A93D"/>'+
      '<path d="M74 31 q3 -9 8 -2 q3 -8 7 2 q-3 3 -7 3 q-4 0 -8 -3 z" fill="#E7A93D"/>'+
      '<ellipse cx="24" cy="70" rx="9" ry="12" fill="#EAF6F1"/>'+
      '<rect x="42" y="82" width="4" height="13" fill="#EAF6F1"/>'+
      '<rect x="60" y="82" width="4" height="13" fill="#EAF6F1"/>'+
    '</svg>';
  function financeQuickPinGateHTML(){
    quickPinBuffer = '';
    quickPinBusy = false;
    var pinLen = (financeGuardStatus && financeGuardStatus.pinLength) || 4;
    var hasPin = !!(financeGuardStatus && financeGuardStatus.pinSet);
    var hasFp = !!(financeGuardStatus && financeGuardStatus.fingerprintEnrolled);
    var dotsHtml = '';
    for(var i=0;i<pinLen;i++) dotsHtml += '<div class="quickpin-dot"></div>';
    var padHtml = '<div class="quickpin-pad">'+
      [1,2,3,4,5,6,7,8,9].map(function(k){ return '<button type="button" class="quickpin-key" data-action="quickpin-key:'+k+'">'+k+'</button>'; }).join('')+
      '<span></span>'+
      '<button type="button" class="quickpin-key" data-action="quickpin-key:0">0</button>'+
      '<button type="button" class="quickpin-key ghost" data-action="quickpin-backspace" aria-label="Backspace">⌫</button>'+
    '</div>';
    var body;
    if(hasPin){
      body = '<div class="quickpin-label">Enter PIN</div>'+
        '<div class="quickpin-dots" id="quickpin-dots">'+dotsHtml+'</div>'+
        '<div class="quickpin-status" id="quickpin-status">&nbsp;</div>'+
        padHtml;
    } else if(hasFp){
      body = '<p class="hint" style="color:#CDE7DE">No Finance PIN set yet — use fingerprint / Face below, or set a PIN from Settings → Your account.</p>'+
        '<div class="quickpin-status" id="quickpin-status">&nbsp;</div>';
    } else {
      body = '<p class="hint" style="color:#CDE7DE">Set up your personal Finance PIN first, from Settings → Your account.</p>';
    }
    return '<div class="quickpin-fullscreen">'+
      QUICKPIN_SCENE_HENS+
      '<div class="quickpin-card">'+
      '<div class="quickpin-avatar-ring">'+avatarHTML(currentUser||{}, 84)+'</div>'+
      '<div class="quickpin-title">'+esc((currentUser&&currentUser.name)||'Administrator')+'</div>'+
      '<div class="quickpin-sub">Kenokip Farm · Finance access</div>'+
      body+
      (hasFp ? '<div><button type="button" class="quickpin-fp-btn" data-action="quickpin-fingerprint">'+ICONS.fingerprint+' Use fingerprint / Face instead</button></div>' : '')+
      '<div class="quickpin-links">'+
        '<button type="button" class="linklike" data-action="finance-unlock-tab:password">Use password + code</button>'+
        '<span></span>'+
      '</div>'+
    '</div></div>';
  }
  // Administrator's "Show amounts" PIN pad — same auto-detecting, no-OK-
  // button style as financeQuickPinGateHTML above, reused here (inside the
  // reveal modal) so every admin-only PIN prompt in the app looks and
  // behaves the same way. Verifies via verifyFinancePinReveal, which is not
  // lockout-gated on its own (matches the old TOTP-reveal behavior) — a
  // wrong PIN here just shakes and clears, no strike against the shared
  // 3-attempt lockout.
  function financeRevealQuickPinHtml(){
    revealPinMode = 'finance';
    revealPinBuffer = '';
    revealPinBusy = false;
    var pinLen = (financeGuardStatus && financeGuardStatus.pinLength) || 4;
    var dotsHtml = '';
    for(var i=0;i<pinLen;i++) dotsHtml += '<div class="quickpin-dot"></div>';
    var padHtml = '<div class="quickpin-pad">'+
      [1,2,3,4,5,6,7,8,9].map(function(k){ return '<button type="button" class="quickpin-key" data-action="revealpin-key:'+k+'">'+k+'</button>'; }).join('')+
      '<span></span>'+
      '<button type="button" class="quickpin-key" data-action="revealpin-key:0">0</button>'+
      '<button type="button" class="quickpin-key ghost" data-action="revealpin-backspace" aria-label="Backspace">⌫</button>'+
    '</div>';
    return '<div class="quickpin-fullscreen">'+
      QUICKPIN_SCENE_HENS+
      '<div class="quickpin-card">'+
      '<button class="modal-close" data-action="close-modal" style="position:absolute; top:14px; right:14px; z-index:2; color:#EAF6F1">'+ICONS.close+'</button>'+
      '<div class="quickpin-avatar-ring">'+avatarHTML(currentUser||{}, 84)+'</div>'+
      '<div class="quickpin-title">Show amounts</div>'+
      '<div class="quickpin-sub">Enter your Finance PIN</div>'+
      '<div class="quickpin-dots" id="revealpin-dots">'+dotsHtml+'</div>'+
      '<div class="quickpin-status" id="revealpin-status">&nbsp;</div>'+
      padHtml+
      '<div class="quickpin-links"><button type="button" class="linklike" data-action="close-modal">Cancel</button><span></span></div>'+
    '</div></div>';
  }
  // Same pad, same buffer/keyboard plumbing (see revealPinMode), for
  // revealing a team member's date of birth instead of Finance amounts —
  // administrator only, verified via getTeamBirthdays (privacyGuard.js),
  // which unmasks every date of birth in Team Directory at once, the same
  // way revealing Finance amounts unmasks every figure on that page.
  function birthdayRevealQuickPinHtml(){
    revealPinMode = 'birthday';
    revealPinBuffer = '';
    revealPinBusy = false;
    var pinLen = (birthdayGuardStatus && birthdayGuardStatus.pinLength) || 4;
    var dotsHtml = '';
    for(var i=0;i<pinLen;i++) dotsHtml += '<div class="quickpin-dot"></div>';
    var padHtml = '<div class="quickpin-pad">'+
      [1,2,3,4,5,6,7,8,9].map(function(k){ return '<button type="button" class="quickpin-key" data-action="revealpin-key:'+k+'">'+k+'</button>'; }).join('')+
      '<span></span>'+
      '<button type="button" class="quickpin-key" data-action="revealpin-key:0">0</button>'+
      '<button type="button" class="quickpin-key ghost" data-action="revealpin-backspace" aria-label="Backspace">⌫</button>'+
    '</div>';
    return '<div class="quickpin-fullscreen">'+
      QUICKPIN_SCENE_HENS+
      '<div class="quickpin-card">'+
      '<button class="modal-close" data-action="close-modal" style="position:absolute; top:14px; right:14px; z-index:2; color:#EAF6F1">'+ICONS.close+'</button>'+
      '<div class="quickpin-avatar-ring">'+avatarHTML(currentUser||{}, 84)+'</div>'+
      '<div class="quickpin-title">Show birthdays</div>'+
      '<div class="quickpin-sub">Enter your Birthday PIN</div>'+
      '<div class="quickpin-dots" id="revealpin-dots">'+dotsHtml+'</div>'+
      '<div class="quickpin-status" id="revealpin-status">&nbsp;</div>'+
      padHtml+
      '<div class="quickpin-links"><button type="button" class="linklike" data-action="close-modal">Cancel</button><span></span></div>'+
    '</div></div>';
  }
  function revealPinRenderDots(){
    var wrap = document.getElementById('revealpin-dots');
    if(!wrap) return;
    var dots = wrap.children;
    for(var i=0;i<dots.length;i++){ dots[i].classList.toggle('filled', i < revealPinBuffer.length); }
  }
  function revealPinSetStatus(msg){
    var el = document.getElementById('revealpin-status');
    if(el) el.textContent = msg || ' ';
  }
  function revealPinShake(){
    var wrap = document.getElementById('revealpin-dots');
    if(!wrap) return;
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
  }
  function revealPinPressDigit(d){
    if(revealPinBusy) return;
    var pinLen = revealPinMode==='birthday'
      ? ((birthdayGuardStatus && birthdayGuardStatus.pinLength) || 4)
      : ((financeGuardStatus && financeGuardStatus.pinLength) || 4);
    if(revealPinBuffer.length >= pinLen) return;
    revealPinBuffer += String(d);
    revealPinRenderDots();
    revealPinSetStatus('');
    if(revealPinBuffer.length === pinLen) revealPinSubmit();
  }
  function revealPinBackspaceKey(){
    if(revealPinBusy) return;
    revealPinBuffer = revealPinBuffer.slice(0, -1);
    revealPinRenderDots();
  }
  function revealPinSubmit(){
    revealPinBusy = true;
    revealPinSetStatus('Checking…');
    var pinVal = revealPinBuffer;
    var call = revealPinMode==='birthday'
      ? firebase.functions().httpsCallable('getTeamBirthdays')({ pin: pinVal }).then(function(res){
          teamBirthdays = (res.data && res.data.dobs) || {};
          birthdaysRevealed = true;
        })
      : firebase.functions().httpsCallable('verifyFinancePinReveal')({ pin: pinVal }).then(function(){
          financeRevealed = true;
        });
    call.then(function(){
      closeModal();
      render();
    }).catch(function(err){
      revealPinBusy = false;
      revealPinBuffer = '';
      revealPinRenderDots();
      revealPinShake();
      revealPinSetStatus((err&&err.message)||'Incorrect PIN.');
    });
  }
  // Shown once the shared 3-strikes lockout has actually tripped (any
  // method — see financeGuard.js). For the administrator this now offers a
  // faster way back in than a trip to Settings: their main authenticator
  // app code, right here, clears the lock immediately — exactly the step-up
  // the administrator asked for after repeated wrong PIN attempts. Everyone
  // else still has to ask the administrator, same as before.
  function financeLockedGateHTML(){
    var admin = isAdmin();
    return '<div class="card" style="max-width:420px; margin:0 auto">'+
      '<div class="card-title"><h3><span class="inline-ico" style="width:18px; height:18px; margin-right:6px; vertical-align:-3px; color:var(--bad)">'+ICONS.lockClosed+'</span>Finance portal locked</h3></div>'+
      '<p class="hint">Locked after repeated wrong attempts, for safety — nobody can get in, including with correct details, until it\'s cleared.</p>'+
      (admin
        ? '<p class="hint">Enter your main authenticator app code below — the same one already used to reveal amounts or send M-Pesa payouts — to clear the lock and try again.</p>'+
          '<form data-form="quickpin-clear-lock">'+
            '<div class="field-row"><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" placeholder="6-digit authenticator code" required autofocus></div>'+
            '<button class="btn primary" type="submit" style="width:100%; margin-top:12px">Clear lock &amp; continue</button>'+
          '</form>'+
          '<p class="hint" style="margin-top:12px">You can also clear it any time from Settings → Team → Finance security.</p>'
        : '<p class="hint">Ask the administrator to clear it from Settings.</p>')+
    '</div>';
  }
  function financeFormHtml(id){
    var f = financeState();
    var t = id ? f.transactions.find(function(x){return x.id===id;}) : null;
    var curAmount = t ? (t.amount * rateOf(state.settings.displayCurrency)).toFixed(2) : '';
    return '<div class="modal-head"><h3>'+(t?'Edit transaction':(isAdmin()?'Add transaction':'New transaction'))+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    (!t && !isAdmin() ? '<p class="hint">A deposit is added right away. A withdrawal is sent to the administrator for approval before it affects the balance.</p>' : '')+
    '<form data-form="finance">'+
      '<input type="hidden" name="id" value="'+(t?t.id:'')+'">'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Type</label><select class="field" name="type">'+
          '<option value="deposit" '+(!t||t.type==='deposit'?'selected':'')+'>Deposit (money in)</option>'+
          '<option value="withdrawal" '+(t&&t.type==='withdrawal'?'selected':'')+'>Withdrawal (money out)</option>'+
        '</select></div>'+
        '<div class="field-row"><label>Date</label><input class="field" type="date" name="date" value="'+(t?t.date:todayISO())+'" max="'+todayISO()+'" required></div>'+
      '</div>'+
      '<div class="field-grid" style="margin-top:12px">'+
        '<div class="field-row"><label>Amount</label><input class="field" type="number" min="0" step="0.01" name="amount" value="'+curAmount+'" required></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="currency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note</label><input class="field" type="text" name="note" value="'+(t?esc(t.note||''):'')+'" placeholder="e.g. Egg sales deposit, feed supplier payment"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">'+(t?'Save changes':'Add transaction')+'</button></div>'+
    '</form>';
  }
  function openingBalanceFormHtml(){
    var f = financeState();
    var curAmount = ((f.openingBalance||0) * rateOf(state.settings.displayCurrency)).toFixed(2);
    return '<div class="modal-head"><h3>Set opening balance</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<form data-form="finance-opening">'+
      '<p class="hint">The balance this account had before you started tracking transactions here — the app adds deposits and subtracts withdrawals from it.</p>'+
      '<div class="field-grid">'+
        '<div class="field-row"><label>Opening balance</label><input class="field" type="number" step="0.01" name="amount" value="'+curAmount+'" required></div>'+
        '<div class="field-row"><label>Currency</label><select class="field" name="currency">'+currencyOptions()+'</select></div>'+
      '</div>'+
      '<div class="field-row" style="margin-top:12px"><label>As of date</label><input class="field" type="date" name="date" value="'+(f.openingDate||todayISO())+'" max="'+todayISO()+'"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Save</button></div>'+
    '</form>';
  }
  function mpesaDepositFormHtml(){
    return '<div class="modal-head"><h3>Add via M-Pesa</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Enter an amount and the Safaricom number to pay from. You\'ll get the normal M-Pesa prompt on that phone — enter your PIN there, not here. The balance updates itself once M-Pesa confirms it.</p>'+
    '<form data-form="mpesa-deposit">'+
      (mpesaPaybillStkEnabled ? '<div class="field-row"><label>Receiving account</label><select class="field" name="account">'+
        '<option value="till">Till (usual)</option>'+
        '<option value="paybill">Paybill</option>'+
      '</select></div>' : '')+
      '<div class="field-row" style="margin-top:12px"><label>Amount (KES)</label><input class="field" type="number" min="1" step="1" name="amount" required autofocus></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Phone number</label><input class="field" type="tel" name="phone" placeholder="0712345678" value="'+esc(state.settings.ownerPhone||'')+'" required></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" id="mpesa-deposit-submit">Send M-Pesa prompt</button></div>'+
    '</form>';
  }
  function mpesaWithdrawFormHtml(){
    var hasPin = !!(financeGuardStatus && financeGuardStatus.pinSet);
    var hasFp = !!(financeGuardStatus && financeGuardStatus.fingerprintEnrolled);
    var confirmHint = hasPin && hasFp ? 'Confirm with your Finance PIN, or fingerprint/Face.'
      : hasPin ? 'Confirm with your Finance PIN.'
      : hasFp ? 'Confirm with fingerprint/Face below.'
      : 'Set up your personal Finance PIN or fingerprint/Face unlock first, from Settings → Your account.';
    return '<div class="modal-head"><h3>Send via M-Pesa</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Sends real money out of the farm\'s M-Pesa account to the number below — this can\'t be undone once Safaricom processes it. '+confirmHint+'</p>'+
    '<form data-form="mpesa-withdraw">'+
      '<div class="field-row"><label>Recipient phone</label><input class="field" type="tel" name="phone" id="mpesa-withdraw-phone" placeholder="0712345678" required autofocus></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Amount (KES)</label><input class="field" type="number" min="1" step="1" name="amount" id="mpesa-withdraw-amount" required></div>'+
      '<div class="field-row" style="margin-top:12px"><label>Note (optional)</label><input class="field" type="text" name="note" id="mpesa-withdraw-note" maxlength="100" placeholder="What this payout is for"></div>'+
      (hasPin ? '<div class="field-row" style="margin-top:12px"><label>Your Finance PIN</label><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin" placeholder="Your PIN"></div>' : '')+
      '<div class="modal-foot">'+
        '<button type="button" class="btn" data-action="close-modal">Cancel</button>'+
        (hasFp ? '<button type="button" class="btn" data-action="mpesa-withdraw-fingerprint">'+ICONS.fingerprint+' Fingerprint</button>' : '')+
        '<button class="btn danger" type="submit" id="mpesa-withdraw-submit"'+((!hasPin&&!hasFp)?' disabled':'')+'>Send</button>'+
      '</div>'+
    '</form>';
  }
  // M-Pesa's real Account Balance / Transaction Status answers arrive a few
  // seconds after being requested (see checkAccountBalance /
  // checkTransactionStatus in functions/index.js) — this card just shows
  // whatever the mpesaQueries listener currently has, live, rather than
  // needing its own polling.
  function mpesaToolsCardHTML(){
    if(!mpesaEnabled) return '';
    var showBalanceStatus = isAdminLevel();
    var showQR = canProposeFinance();
    if(!showBalanceStatus && !showQR) return '';
    var balanceHTML = '';
    if(showBalanceStatus){
      var bq = latestMpesaQuery('balance');
      var body = '<div class="hint">Not checked yet.</div>';
      if(bq){
        if(bq.status==='pending') body = '<div class="hint">Checking with Safaricom…</div>';
        else if(bq.status==='failed') body = '<div class="hint">Could not get the balance — '+esc(bq.resultDesc||'try again')+'.</div>';
        else body = '<div style="font-size:1.1em;font-weight:600">'+esc(bq.workingAccountCurrency||'KES')+' '+esc(bq.workingAccountBalance||'—')+'</div>'+
          '<div class="hint">'+esc(bq.workingAccountName||'Working Account')+(bq.completedAt?' · checked '+fmtDate(new Date(bq.completedAt)):'')+'</div>';
      }
      balanceHTML = '<div style="margin-bottom:14px"><div class="row-actions" style="justify-content:space-between;margin-bottom:6px"><strong>M-Pesa account balance</strong><button class="btn" data-action="mpesa-check-balance">Check now</button></div>'+body+'</div>';
    }
    var statusHTML = '';
    if(showBalanceStatus){
      var checks = mpesaQueries.filter(function(q){ return q.type==='txnstatus'; }).slice(0,5);
      var rowsHtml = checks.length ? '<div class="table-wrap"><table><thead><tr><th>Receipt</th><th>Status</th><th class="num">Amount</th></tr></thead><tbody>'+
        checks.map(function(q){
          var statusText = q.status==='pending' ? 'Checking…' : (q.status==='failed' ? esc(q.resultDesc||'Failed') : esc(q.transactionStatus||'—'));
          return '<tr><td>'+esc(q.transactionId||'—')+'</td><td>'+statusText+'</td><td class="num">'+(q.amount?fmtMoney(Number(q.amount)):'—')+'</td></tr>';
        }).join('')+'</tbody></table></div>' : '<div class="hint">No transactions checked yet.</div>';
      statusHTML = '<div style="margin-bottom:14px"><div class="row-actions" style="justify-content:space-between;margin-bottom:6px"><strong>Transaction status</strong><button class="btn" data-action="open-mpesa-txnstatus">Check a receipt</button></div>'+rowsHtml+'</div>';
    }
    var qrHTML = '';
    if(showQR){
      qrHTML = '<div><div class="row-actions" style="justify-content:space-between;margin-bottom:6px"><strong>Payment QR code</strong><button class="btn" data-action="open-mpesa-qr">Generate</button></div>'+
        '<div class="hint">Let a customer scan and pay straight from their own M-Pesa app — no till number to read out.</div></div>';
    }
    return '<div class="card"><div class="card-title"><h3>M-Pesa tools</h3></div>'+balanceHTML+statusHTML+qrHTML+'</div>';
  }
  function mpesaTxnStatusFormHtml(){
    return '<div class="modal-head"><h3>Check transaction status</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Enter the M-Pesa receipt code (from an SMS confirmation or a customer\'s screenshot) — Safaricom will report its current status here in a few seconds.</p>'+
    '<form data-form="mpesa-txnstatus">'+
      '<div class="field-row"><label>Receipt code</label><input class="field" type="text" name="transactionId" placeholder="OEI2AK4Q16" required autofocus style="text-transform:uppercase"></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" id="mpesa-txnstatus-submit">Check</button></div>'+
    '</form>';
  }
  function mpesaQRFormHtml(){
    return '<div class="modal-head"><h3>Generate payment QR code</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Shows a code a customer scans in their own M-Pesa app to pay this till directly. Leave the amount blank to let them type their own.</p>'+
    '<form data-form="mpesa-qr">'+
      '<div class="field-row"><label>Amount (KES, optional)</label><input class="field" type="number" min="0" step="1" name="amount" placeholder="Leave blank for any amount" autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" id="mpesa-qr-submit">Generate</button></div>'+
    '</form>';
  }
  function mpesaQRResultHtml(qrCode){
    return '<div class="modal-head"><h3>Scan to pay Kenokip Farm</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<div style="text-align:center"><img src="data:image/png;base64,'+qrCode+'" alt="M-Pesa payment QR code" style="max-width:100%;width:260px;height:260px;border-radius:8px;background:#fff;padding:8px"></div>'+
    '<p class="hint" style="text-align:center;margin-top:10px">In M-Pesa: Lipa na M-Pesa → Scan QR.</p>'+
    '<div class="modal-foot"><button type="button" class="btn primary" data-action="close-modal">Done</button></div>';
  }
  function financeRevealFormHtml(){
    var admin = isAdmin();
    return '<div class="modal-head"><h3>Show amounts</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">'+(admin ? 'Enter your personal Finance PIN.' : 'Enter the current code from your authenticator app.')+'</p>'+
    '<form data-form="finance-reveal-code">'+
      (admin
        ? '<div class="field-row"><input class="field" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" name="pin" placeholder="Your Finance PIN" required autofocus></div>'
        : '<div class="field-row"><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" placeholder="6-digit code" required autofocus></div>')+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Show</button></div>'+
    '</form>';
  }
  // Loads a script from the network at most once (reused if already
  // present/loading), resolving when it's ready and rejecting on failure —
  // used below to fetch a small QR-code-drawing library on demand, only
  // when someone actually opens authenticator setup, never as part of the
  // app's normal load. If it fails (offline, blocked), setup still works
  // fine via the manual key entry shown either way.
  function loadScriptOnce(src){
    return new Promise(function(resolve, reject){
      var existing = document.querySelector('script[data-src="'+src+'"]');
      if(existing){
        if(window.QRCode) { resolve(); return; }
        existing.addEventListener('load', function(){ resolve(); });
        existing.addEventListener('error', function(){ reject(new Error('load failed')); });
        return;
      }
      var s = document.createElement('script');
      s.src = src; s.async = true; s.setAttribute('data-src', src);
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function ensureQRCodeLib(){
    if(window.QRCode) return Promise.resolve();
    var urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
    ];
    return urls.reduce(function(chain, url){
      return chain.catch(function(){ return loadScriptOnce(url); });
    }, Promise.reject());
  }
  function renderAuthAppQR(otpauthUri){
    var el = document.getElementById('authapp-qr');
    if(!el) return;
    ensureQRCodeLib().then(function(){
      if(!window.QRCode || !document.getElementById('authapp-qr')) return;
      el.innerHTML = '';
      new QRCode(el, { text: otpauthUri, width:176, height:176, correctLevel: QRCode.CorrectLevel.M });
    }).catch(function(){
      // No network / blocked — leave the placeholder empty, the manual key
      // below still works fine on its own.
      if(el) el.style.display = 'none';
    });
  }
  function authAppSetupFormHtml(data){
    return '<div class="modal-head"><h3>Set up authenticator app</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Scan this with Google Authenticator, Authy, or similar — or, if it doesn\'t load, enter the key below manually instead:</p>'+
    '<div id="authapp-qr" style="display:flex; justify-content:center; align-items:center; min-height:60px; margin-bottom:14px"><span class="hint">Loading code…</span></div>'+
    '<div class="card" style="margin-bottom:14px"><div style="display:grid; gap:6px; font-size:13px">'+
      '<div><strong>Account:</strong> Kenokip Farm ('+esc(currentUser.email||'')+')</div>'+
      '<div><strong>Key:</strong> <span class="num" style="letter-spacing:1px; word-break:break-all">'+esc(data.secret)+'</span></div>'+
      '<div><strong>Type:</strong> Time based</div>'+
    '</div></div>'+
    '<form data-form="confirm-authapp">'+
      '<div class="field-row"><label>Then enter the current 6-digit code it shows</label><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Confirm</button></div>'+
    '</form>';
  }
  function portalAuthAppSetupFormHtml(data){
    return '<div class="modal-head"><h3>Set up Finance portal authenticator</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">This is a separate code from your regular authenticator entry — it\'ll show up as its own entry ("Kenokip Farm Finance Portal") in your app. Scan this, or enter the key manually:</p>'+
    '<div id="authapp-qr" style="display:flex; justify-content:center; align-items:center; min-height:60px; margin-bottom:14px"><span class="hint">Loading code…</span></div>'+
    '<div class="card" style="margin-bottom:14px"><div style="display:grid; gap:6px; font-size:13px">'+
      '<div><strong>Account:</strong> Kenokip Farm Finance Portal ('+esc(currentUser.email||'')+')</div>'+
      '<div><strong>Key:</strong> <span class="num" style="letter-spacing:1px; word-break:break-all">'+esc(data.secret)+'</span></div>'+
      '<div><strong>Type:</strong> Time based</div>'+
    '</div></div>'+
    '<form data-form="confirm-portal-authapp">'+
      '<div class="field-row"><label>Then enter the current 6-digit code it shows</label><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Confirm</button></div>'+
    '</form>';
  }
  function clearFinanceLockFormHtml(){
    return '<div class="modal-head"><h3>Clear Finance portal lock</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
    '<p class="hint">Confirm it\'s really you with your main authenticator code (Settings → Your account — the same one used to reveal Finance figures and send M-Pesa payouts, not the Finance portal one). This also resets the failed-attempt count to zero.</p>'+
    '<form data-form="clear-finance-lock">'+
      '<div class="field-row"><label>Your authenticator code</label><input class="field" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" name="code" placeholder="6-digit code" required autofocus></div>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Clear lock</button></div>'+
    '</form>';
  }
  function initFinanceSync(){
    if(financeSyncStarted || !db) return;
    financeSyncStarted = true;
    // Tracks which approved transaction ids this client has already seen,
    // so the celebration below only fires the moment a NEW one appears
    // (Safaricom's callback landing in Firestore and this listener
    // picking it up) — not for the entire transaction history on first
    // load, and not twice for one the admin has already looked at.
    var seenApprovedTxnIds = null;
    db.collection(FINANCE_COLLECTION).doc(FINANCE_DOC).onSnapshot(function(snap){
      state.finance = snap.exists ? Object.assign(defaultFinanceState(), snap.data()) : defaultFinanceState();
      if(!Array.isArray(state.finance.transactions)) state.finance.transactions = [];
      var newlyApproved = [];
      var nextSeen = {};
      state.finance.transactions.forEach(function(t){
        var approved = (t.status||'approved')==='approved';
        if(approved){
          nextSeen[t.id] = true;
          if(seenApprovedTxnIds && !seenApprovedTxnIds[t.id]) newlyApproved.push(t);
        }
      });
      seenApprovedTxnIds = nextSeen;
      render();
      if(newlyApproved.length && canSeeFinance()){
        var t0 = newlyApproved[newlyApproved.length-1];
        celebrate({
          title:'Transaction successful',
          subtitle:(t0.type==='withdrawal'?'−':'+')+fmtMoney(Math.abs(t0.amount))+(t0.date?' · '+fmtDate(parseISO(t0.date)):'')
        });
      }
    }, function(){ /* Finance reads are restricted by rule to administrator/financial staff; a failure here just leaves Finance showing its last-known data */ });
  }

  var SECTIONS = {
    overview:{ topbar:function(){ return topbarHTML(t('title.overview','Overview'),t('sub.overview','How the farm is doing'), periodSegment('overview')+currencySelectHTML(), PICS.overview); }, panel:overviewPanel },
    flock:{ topbar:function(){ return topbarHTML(t('title.flock','Flock'),t('sub.flock','Current inventory by age and gender'), '<button class="btn" data-action="open-record-loss" '+(readOnly?'disabled':'')+'>Record loss</button>'+addBtn('open-add-flock','Add birds'), flockPhotoIcon('flockIcon')); }, panel:flockPanel },
    eggs:{ topbar:function(){ return topbarHTML(t('title.eggs','Eggs'),t('sub.eggs','Daily production, tallied up'), addBtn('open-add-egg','Log eggs'), eggsPhotoIcon()); }, panel:eggsPanel },
    feed:{ topbar:function(){ return topbarHTML(t('title.feed','Feed'),t('sub.feed','Consumption, cost, and feed-per-egg'), addBtn('open-add-feed','Log feed'), flockPhotoIcon('feedIcon')); }, panel:feedPanel },
    health:{ topbar:function(){ return topbarHTML(t('title.health','Health'),t('sub.health','Vaccinations, treatments &amp; reminders'), addBtn('open-add-health','Add record'), PICS.health); }, panel:healthPanel },
    reports:{ topbar:function(){ return topbarHTML(t('title.reports','Reports'),t('sub.reports','Print or export a period summary'), '', PICS.reports); }, panel:reportsPanel },
    expenses:{ topbar:function(){ return topbarHTML(t('title.expenses','Expenses'),t('sub.expenses','What you’re spending, by category'), currencySelectHTML()+addBtn('open-add-expense','Add expense'), PICS.expenses); }, panel:function(){ return moneyBreakdownPanel(state.expenses, state.settings.expenseCategories, 'expense'); } },
    income:{ topbar:function(){ return topbarHTML(t('title.income','Income'),t('sub.income','Money coming in, by category'), currencySelectHTML()+addBtn('open-add-income','Add income'), PICS.income); }, panel:function(){ return moneyBreakdownPanel(state.incomes, state.settings.incomeCategories, 'income'); } },
    customers:{ topbar:function(){ return topbarHTML(t('title.customers','Customers'),t('sub.customers','Buyers, repeat and one-off'), addBtn('open-add-customer','Add customer'), PICS.customers); }, panel:customersPanel },
    finance:{ topbar:function(){ return topbarHTML(t('title.finance','Finance'),t('sub.finance','Your poultry-only bank account'), financeTopbarActions(), PICS.finance); }, panel:financePanel },
    about:{ topbar:function(){ return topbarHTML(t('title.about','About'),t('sub.about','The story behind Kenokip Farm'), isAdminLevel() ? '<button class="btn" data-action="open-edit-about">'+ICONS.edit+'Edit</button>' : '', PICS.about); }, panel:aboutPanel },
    settings:{ topbar:function(){ return topbarHTML(t('title.settings','Settings'),t('sub.settings','Currencies, categories & backup'), readOnlyBadge(), PICS.settings); }, panel:settingsPanel },
    trash:{ topbar:function(){ return topbarHTML('Trash','Deleted records — recoverable for 30 days', '', PICS.trash); }, panel:trashPanel },
    team:{ topbar:function(){ return topbarHTML(t('title.team','Team'),t('sub.team','Accounts, approvals & access log'), '', PICS.team); }, panel:teamPanel },
    messages:{ topbar:function(){ return topbarHTML(t('title.messages','Messages'),t('sub.messages','Talk to the team'), '', PICS.messages); }, panel:messagesPanel },
    signoffs:{ topbar:function(){ return topbarHTML(t('title.signoffs','Pending signatures'),t('sub.signoffs','Documents waiting on your signature'), '', PICS.signoffs); }, panel:signoffsPanel },
    directory:{ topbar:function(){ return topbarHTML(t('title.directory','Team Directory'),t('sub.directory','Everyone on the farm, in one place'), '', PICS.directory); }, panel:directoryPanel }
  };
  // Plain display names for each section key — used by voice control's
  // confirmation toast ("Opened Flock.") since SECTIONS[key] only holds
  // functions, not a label string.
  var SECTION_LABELS = {
    overview:'Overview', flock:'Flock', eggs:'Eggs', feed:'Feed', health:'Health',
    reports:'Reports', expenses:'Expenses', income:'Income', customers:'Customers',
    finance:'Finance', about:'About', settings:'Settings', team:'Team', messages:'Messages', signoffs:'Pending signatures'
  };

  /* ============================= GLOBAL SEARCH ============================= */
  // One search box, present on every page (see the static "global-search-bar"
  // container, rendered once below — not part of the normal render() cycle,
  // so typing in it never gets wiped out by a Firestore update elsewhere).
  // Built fresh from whatever's already loaded in `state` every time someone
  // types — there's no separate search index to keep in sync, and farm-sized
  // data (hundreds, not millions, of records) makes that cheap enough to not
  // matter. Respects the same visibility rules as the rest of the app:
  // Finance only searches if canSeeFinance() (and masks amounts the same way
  // the Finance page itself does), Team only if isAdmin().
  function gsMatch(hay, q){ return hay && hay.toLowerCase().indexOf(q) !== -1; }
  function buildGlobalSearchIndex(){
    var idx = [];
    (state.flock||[]).forEach(function(b){
      var label = genderLabel(b.gender);
      idx.push({
        cat:'Flock', title:b.count+' '+label+(b.count===1?'':'s'),
        sub:(b.source?b.source+' — ':'')+'added '+fmtDate(parseISO(b.dateAdded)),
        section:'flock', followup:null,
        text:[label, b.source, b.dateAdded].join(' ')
      });
      (b.removals||[]).forEach(function(r){
        var reasonLbl = removalReasonLabel(r.reason);
        idx.push({
          cat:'Flock activity',
          title:(r.reason==='sold' ? 'Sold '+r.count+' '+label+(r.buyer?' to '+r.buyer:'') : reasonLbl+' — '+r.count+' '+label),
          sub:fmtDate(parseISO(r.date))+(r.saleAmount?' — '+fmtMoney(r.saleAmount):''),
          section:'flock', followup:'open-history:'+b.id,
          text:[reasonLbl, r.buyer, r.note, label].join(' ')
        });
      });
    });
    (state.eggs||[]).forEach(function(e){
      idx.push({
        cat:'Eggs', title:e.total+' eggs collected', sub:fmtDate(parseISO(e.date))+(e.note?' — '+e.note:''),
        section:'eggs', followup:'edit-egg:'+e.id, text:['collected', e.note, e.date].join(' ')
      });
    });
    (state.eggLosses||[]).forEach(function(x){
      var reasonLbl = eggLossReasonLabel(x.reason);
      idx.push({
        cat:'Eggs', title:(x.reason==='sold' ? 'Sold '+x.count+' eggs'+(x.buyer?' to '+x.buyer:'') : reasonLbl+' — '+x.count+' eggs'),
        sub:fmtDate(parseISO(x.date))+(x.saleAmount?' — '+fmtMoney(x.saleAmount):''),
        section:'eggs', followup:'edit-eggloss:'+x.id, text:[reasonLbl, x.buyer, x.note].join(' ')
      });
    });
    (state.feedLogs||[]).forEach(function(f){
      idx.push({
        cat:'Feed', title:f.quantityKg+' kg — '+(f.feedType||'Other'), sub:fmtDate(parseISO(f.date))+(f.note?' — '+f.note:''),
        section:'feed', followup:'edit-feed:'+f.id, text:[f.feedType, f.note].join(' ')
      });
    });
    (state.healthRecords||[]).forEach(function(h){
      idx.push({
        cat:'Health', title:h.title, sub:healthTypeLabel(h.type)+' — '+healthBatchLabel(h.batchId)+' — '+fmtDate(parseISO(h.date)),
        section:'health', followup:'edit-health:'+h.id, text:[h.title, h.note, healthTypeLabel(h.type)].join(' ')
      });
    });
    (state.expenses||[]).forEach(function(x){
      idx.push({
        cat:'Expenses', title:(x.category||'Other')+' — '+fmtMoney(x.amount), sub:fmtDate(parseISO(x.date))+(x.note?' — '+x.note:''),
        section:'expenses', followup:'edit-expense:'+x.id, text:[x.category, x.note].join(' ')
      });
    });
    (state.incomes||[]).forEach(function(x){
      idx.push({
        cat:'Income', title:(x.category||'Other')+' — '+fmtMoney(x.amount), sub:fmtDate(parseISO(x.date))+(x.note?' — '+x.note:''),
        section:'income', followup:'edit-income:'+x.id, text:[x.category, x.note].join(' ')
      });
    });
    (state.customers||[]).forEach(function(c){
      idx.push({
        cat:'Customers', title:c.name, sub:(c.phone?c.phone+' — ':'')+'KSh '+customerStats(c.id).totalSpent+' spent',
        section:'customers', followup:'edit-customer:'+c.id, text:[c.name, c.phone, c.note].join(' ')
      });
    });
    if(canSeeFinance()){
      var f = financeState();
      (f.transactions||[]).forEach(function(t){
        var amountText = financeRevealed ? fmtMoney(t.amount) : maskMoneyDisplay(t.amount);
        idx.push({
          cat:'Finance', title:(t.type==='deposit'?'Deposit':'Withdrawal')+' — '+amountText,
          sub:fmtDate(parseISO(t.date))+(t.note?' — '+t.note:''),
          section:'finance', followup:null, text:[t.note, t.source, t.status].join(' ')
        });
      });
    }
    if(isAdminLevel()){
      teamUsers.forEach(function(u){
        idx.push({
          cat:'Team', title:u.name||u.email||'Unnamed', sub:roleLabel(u)+(u.email?' — '+u.email:''),
          section:'team', followup:null, text:[u.name, u.email, roleLabel(u)].join(' ')
        });
      });
    }
    return idx;
  }
  function performGlobalSearch(query){
    var q = String(query||'').trim().toLowerCase();
    if(!q) return [];
    var idx = buildGlobalSearchIndex();
    var perCat = {};
    var out = [];
    for(var i=0;i<idx.length && out.length<40;i++){
      var item = idx[i];
      if(!gsMatch(item.title,q) && !gsMatch(item.sub,q) && !gsMatch(item.text,q)) continue;
      perCat[item.cat] = (perCat[item.cat]||0)+1;
      if(perCat[item.cat]>8) continue;
      out.push(item);
    }
    return out;
  }
  function gsResultsHtml(results, query){
    if(!query.trim()) return '<div class="gs-hint">Type to search flock, eggs, feed, health, money, and customers'+(isAdminLevel()?', plus Team':'')+'. Or tap the mic and just say it.</div>';
    if(!results.length) return '<div class="gs-empty">No matches for "'+esc(query)+'".</div>';
    var lastCat = null, html = '';
    results.forEach(function(item, i){
      if(item.cat!==lastCat){ html += '<div class="gs-group">'+esc(item.cat)+'</div>'; lastCat = item.cat; }
      html += '<button type="button" class="gs-item" data-gs-index="'+i+'">'+esc(item.title)+'<span class="gs-sub">'+esc(item.sub||'')+'</span></button>';
    });
    return html;
  }
  var gsLastResults = [];
  function renderGlobalSearchResults(query){
    gsLastResults = performGlobalSearch(query);
    var root = document.getElementById('global-search-results');
    if(!root) return;
    root.innerHTML = gsResultsHtml(gsLastResults, query);
  }
  function gsSelectResult(item){
    var input = document.getElementById('global-search-input');
    var root = document.getElementById('global-search-results');
    if(input) input.value = '';
    if(root){ root.hidden = true; root.innerHTML = ''; }
    ui.section = item.section;
    saveUIPref();
    render();
    if(item.followup) handleAction(item.followup);
  }
  function renderGlobalSearchBar(){
    var bar = document.getElementById('global-search-bar');
    if(!bar) return;
    bar.innerHTML =
      '<div class="global-search-box">'+
        '<span class="gs-search-ico">'+ICONS.search+'</span>'+
        '<input type="search" id="global-search-input" placeholder="Search everything, or tap the mic and say it…" autocomplete="off">'+
        (voiceSupported() ? '<button type="button" class="icon-btn" id="global-search-mic" title="Voice command">'+ICONS.mic+'</button>' : '')+
      '</div>'+
      '<div class="global-search-results" id="global-search-results" hidden></div>';
    var input = document.getElementById('global-search-input');
    var results = document.getElementById('global-search-results');
    input.addEventListener('focus', function(){ results.hidden = false; renderGlobalSearchResults(input.value); });
    input.addEventListener('input', function(){ results.hidden = false; renderGlobalSearchResults(input.value); });
    input.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ input.blur(); results.hidden = true; }
      if(e.key==='Enter' && gsLastResults.length){ gsSelectResult(gsLastResults[0]); }
    });
    results.addEventListener('click', function(e){
      var el = e.target.closest('.gs-item');
      if(!el) return;
      var item = gsLastResults[Number(el.dataset.gsIndex)];
      if(item) gsSelectResult(item);
    });
    document.addEventListener('click', function(e){
      if(!bar.contains(e.target)) results.hidden = true;
    });
    var micBtn = document.getElementById('global-search-mic');
    if(micBtn) micBtn.addEventListener('click', function(){ toggleVoiceCommand(micBtn, input, results); });
  }

  /* ---- voice commands ("open eggs", "search john", or just say what you
     want and it's used as a search) — a convenience layer only. It is
     NEVER used to unlock anything or approve anything; see the separate,
     clearly-optional voice tag in Settings for the one place voice touches
     Finance at all, and even that is informational-only, never a lock. ---- */
  var VOICE_SECTION_WORDS = {
    overview:['overview','home','dashboard'], flock:['flock','birds','chicken','chickens'], eggs:['eggs','egg'],
    feed:['feed','feeding'], health:['health'], expenses:['expenses','expense','spending'],
    income:['income','sales','earnings'], customers:['customers','customer','buyers'], finance:['finance','bank','money'],
    reports:['reports','report'], messages:['messages','message','inbox'], about:['about'], settings:['settings'], team:['team'],
    signoffs:['pending signatures','pending signature','signatures','approvals']
  };
  function voiceSupported(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  var voiceRecognition = null;
  function getVoiceRecognition(){
    if(voiceRecognition) return voiceRecognition;
    var Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Ctor) return null;
    voiceRecognition = new Ctor();
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = false;
    voiceRecognition.maxAlternatives = 1;
    try{ voiceRecognition.lang = (navigator.language || 'en-US'); }catch(e){}
    return voiceRecognition;
  }
  function handleVoiceTranscript(transcript, input, results){
    var text = String(transcript||'').trim();
    if(!text) return;
    var lower = text.toLowerCase();
    var m = lower.match(/^(?:open|go to|show|switch to)\s+(.+)$/);
    var target = m ? m[1].trim() : null;
    if(target){
      var hit = Object.keys(VOICE_SECTION_WORDS).find(function(key){
        return VOICE_SECTION_WORDS[key].some(function(w){ return target.indexOf(w)!==-1; });
      });
      if(hit && sectionAllowed(hit)){
        ui.section = hit; saveUIPref(); render();
        toast('Opened '+esc(SECTION_LABELS[hit]||hit)+'.');
        return;
      }
    }
    var searchTerm = lower.replace(/^(?:search|find|look up|look for)\s+/,'');
    if(input){ input.value = searchTerm; input.focus(); }
    if(results){ results.hidden = false; renderGlobalSearchResults(searchTerm); }
  }
  function toggleVoiceCommand(micBtn, input, results){
    var rec = getVoiceRecognition();
    if(!rec){ toast('Voice commands need Chrome, Edge, or Safari.'); return; }
    if(micBtn.classList.contains('listening')){ rec.stop(); return; }
    micBtn.classList.add('listening');
    var done = false;
    var finish = function(){ if(done) return; done = true; micBtn.classList.remove('listening'); };
    rec.onresult = function(e){
      finish();
      var transcript = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
      handleVoiceTranscript(transcript, input, results);
    };
    rec.onerror = function(e){
      finish();
      if(e.error==='no-speech'){ toast('Didn\'t catch that — try again.'); return; }
      if(e.error==='not-allowed' || e.error==='service-not-allowed'){ toast('Microphone access is blocked for this site.'); return; }
      toast('Voice command failed — try again.');
    };
    rec.onend = finish;
    try{ rec.start(); }catch(e){ finish(); }
  }

  /* ============================= KEM AI ASSISTANT =============================
     A free, scripted (no external AI service, nothing sent off-device)
     assistant — pattern-matches the question against a fixed list of
     things it knows how to answer, either a live number worked out from
     `state` (same helper functions the real pages use, so it can never
     disagree with what's on screen) or a canned how-to explanation.
     Available to every signed-in account (not guests), each person seeing
     only what their own role already allows — Finance numbers only if
     canSeeFinance(), Team numbers only if isAdmin(), same as everywhere
     else in the app. The conversation lives in memory only for this
     browser tab — nothing is saved, and it's gone on reload or sign-out
     (a shared farm computer should never show the next person's chat). */
  var kemAiOpen = false;
  var kemAiMessages = [];
  var KEM_AI_SUGGESTIONS = ['How many eggs today?', "What's my flock total?", 'How do I log feed?', 'How do I unlock Finance with my fingerprint?'];
  function kemAiSetVisible(show){
    var root = document.getElementById('kem-ai-root');
    if(!root) return;
    root.hidden = !show;
    if(!show){ kemAiOpen = false; kemAiMessages = []; var panel = document.getElementById('kemai-panel'); if(panel) panel.hidden = true; kemAiRenderMessages(); }
  }
  function kemAiScrollToBottom(){
    var m = document.getElementById('kemai-messages');
    if(m) m.scrollTop = m.scrollHeight;
  }
  function kemAiSuggestionsHtml(){
    return '<div class="kemai-suggestions">'+KEM_AI_SUGGESTIONS.map(function(s){
      return '<button type="button" class="kemai-chip" data-kemai-chip="'+esc(s)+'">'+esc(s)+'</button>';
    }).join('')+'</div>';
  }
  function kemAiRenderMessages(){
    var root = document.getElementById('kemai-messages');
    if(!root) return;
    var html;
    if(!kemAiMessages.length){
      var proactive = kemAiProactiveInsights();
      var proactiveHtml = proactive.length ? '<div class="kemai-msg assistant">Hi, I\'m Kem. Before you ask — a couple of things I noticed:<br><br>'+
        proactive.map(function(i){ return i.icon+' '+esc(i.text); }).join('<br><br>')+'</div>' : '';
      html = proactiveHtml+'<div class="kemai-intro">'+(proactive.length?'Ask me anything else about your numbers, or how to do something in the app.':'Hi, I\'m Kem — ask me about your farm\'s numbers, or how to do something in the app.')+'</div>'+kemAiSuggestionsHtml();
    } else {
      html = kemAiMessages.map(function(m){ return '<div class="kemai-msg '+(m.role==='user'?'user':'assistant')+'">'+esc(m.text)+'</div>'; }).join('');
    }
    root.innerHTML = html;
    Array.prototype.forEach.call(root.querySelectorAll('[data-kemai-chip]'), function(btn){
      btn.addEventListener('click', function(){ kemAiAsk(btn.getAttribute('data-kemai-chip')); });
    });
    kemAiScrollToBottom();
  }
  function kemAiAsk(question){
    question = String(question||'').trim();
    if(!question) return;
    kemAiMessages.push({ role:'user', text:question });
    kemAiRenderMessages();
    var answer = kemAiAnswer(question);
    setTimeout(function(){
      kemAiMessages.push({ role:'assistant', text:answer });
      kemAiRenderMessages();
    }, 260);
  }
  function kemAiRenderShell(){
    var root = document.getElementById('kem-ai-root');
    if(!root) return;
    root.innerHTML =
      '<button type="button" class="kemai-bubble" id="kemai-bubble" title="Kem AI Assistant" aria-label="Open Kem AI Assistant">'+ICONS.kemai+'</button>'+
      '<div class="kemai-panel" id="kemai-panel" hidden>'+
        '<div class="kemai-head"><h3>'+ICONS.kemai+'Kem AI Assistant</h3><button type="button" class="icon-btn" id="kemai-close" title="Close">'+ICONS.close+'</button></div>'+
        '<div class="kemai-messages" id="kemai-messages"></div>'+
        '<div class="kemai-inputrow"><input type="text" id="kemai-input" placeholder="Ask about your farm, or how to do something…" autocomplete="off"><button type="button" class="kemai-send" id="kemai-send" title="Send">'+ICONS.send+'</button></div>'+
      '</div>';
    kemAiRenderMessages();
    var bubble = document.getElementById('kemai-bubble');
    var panel = document.getElementById('kemai-panel');
    var input = document.getElementById('kemai-input');
    bubble.addEventListener('click', function(){
      kemAiOpen = !kemAiOpen;
      panel.hidden = !kemAiOpen;
      if(kemAiOpen){ input.focus(); kemAiScrollToBottom(); }
    });
    document.getElementById('kemai-close').addEventListener('click', function(){ kemAiOpen = false; panel.hidden = true; });
    function submit(){ var v = input.value.trim(); if(!v) return; input.value = ''; kemAiAsk(v); }
    document.getElementById('kemai-send').addEventListener('click', submit);
    input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); submit(); } });
  }
  // A short, friendly stand-in for "you don't have access to that" — used
  // for both Finance- and Team-gated questions so a restricted account
  // never sees the real number, just a polite redirect.
  function kemAiRestricted(what){ return "That's part of "+what+", which isn't available on your account. Ask the administrator if you need it."; }
  function financeMoneyDisplay(amount){ return financeRevealed ? fmtMoney(amount) : maskMoneyDisplay(amount); }
  function kemAiAnswer(raw){
    var q = String(raw||'').trim().toLowerCase();
    if(!q) return 'Ask me something like "how many eggs today" or "how do I log feed".';

    if(/^(hi|hello|hey|jambo|habari)\b/.test(q)) return "Hi! I'm Kem, your farm assistant. Ask me about your numbers (eggs, flock, feed, money) or how to do something in the app.";
    if(/\b(thank you|thanks|asante)\b/.test(q)) return "You're welcome — anytime.";
    if(/\bwho are you\b|\bwhat are you\b|\byour name\b/.test(q)) return "I'm Kem, the Kenokip Farm assistant — a free, built-in helper, not a connection to any outside AI service. I can work out numbers from what's already in the app, and explain how to use any feature. I don't chat about anything outside the farm.";

    /* ---- how-to first: these are checked before the live numbers below on
       purpose. "How do I log eggs" mentions "eggs" too, and if the numbers
       check ran first it would answer with today's egg count instead of
       ever explaining how to log one — every how-to pattern here requires
       an action word (add/log/record/set up/...) alongside the topic, so a
       plain "how many eggs" still falls through to the number below. ---- */
    if(/\badd\b.*\b(bird|flock|chick|hen|rooster)\b|\bnew batch\b/.test(q)) return 'Go to Flock, then tap "Add birds" (or the + on a Chicks/Growers/Layers card) — enter how many, their gender, and where they came from.';
    if(/\b(sold|sell|lost|died|predator|cull)\b.*\b(bird|flock|hen)\b|\brecord loss\b/.test(q)) return 'On the Flock page, find the batch\'s row and tap "Record loss" (or "Record loss or sale" next to it) — pick the reason, how many, and for a sale, the buyer and amount.';
    if(/\b(log|add|record)\b.*\begg/.test(q)) return 'Go to Eggs and tap "Log eggs" — enter the date and how many were collected. Tick "Grade by size" if you want to break that down into small/medium/large/jumbo instead of one flat number.';
    if(/\b(log|add|record)\b.*\bfeed/.test(q)) return 'Go to Feed and tap "Log feed" — enter the type, quantity in kg, and cost.';
    if(/\brestock\b.*\bfeed\b|\bfeed\b.*\bstock\b.*\bhow\b/.test(q)) return 'Go to Feed and tap "Restock" — enter how much you bought, and it\'s added to what you have on hand. The app then tells you roughly how many days that\'ll last based on your recent usage.';
    if(/\b(add|record)\b.*\bhealth|\bvaccinat.*\bhow\b|\b(log|record)\b.*\btreatment/.test(q)) return 'Go to Health and tap "Add record" — pick vaccination, treatment, checkup, or illness, which batch it\'s for, and (optionally) a follow-up reminder date.';
    if(/\b(add|record)\b.*\bexpense/.test(q)) return 'Go to Expenses and tap "Add expense" — pick a category, amount, date, and an optional note.';
    if(/\b(add|record)\b.*\bincome/.test(q)) return 'Go to Income and tap "Add income" — pick a category, amount, date, and an optional note.';
    if(/\badd\b.*\bcustomer/.test(q)) return 'Go to Customers and tap "Add customer" — their name is enough to start; phone and notes are optional. Sales linked to them (from Flock or Eggs) show up automatically.';
    if(/\bdeposit\b|\badd.*money\b|\bstk\b/.test(q)){ if(!canSeeFinance()) return kemAiRestricted('Finance'); return 'On the Finance page, tap "Add via M-Pesa" and confirm the PIN prompt on your phone — Safaricom handles that step directly, this app never sees your M-Pesa PIN.'; }
    if(/\bwithdraw\b|\bsend.*money\b|\bpay ?out\b|\bb2c\b/.test(q)){ if(!canSeeFinance()) return kemAiRestricted('Finance'); if(!mpesaPayoutsEnabled) return 'Payouts aren\'t available on this M-Pesa account yet — Safaricom needs to confirm B2C access for our Paybill first. Until then, payments out still have to be sent manually.'; return 'On the Finance page, tap "Send via M-Pesa", enter the phone number and amount — it goes out as a normal M-Pesa payment.'; }
    if(/\bfingerprint\b|\bface unlock\b|\bfinance pin\b/.test(q)) return 'From Settings → Your account: set a personal Finance PIN, then tap "Set up fingerprint / Face unlock" and follow your device\'s own prompt. After that, the Finance portal offers a Fingerprint + PIN tab as a faster alternative to password + code — either one alone still can\'t get in.';
    if(/\bsearch box\b|\bhow.*search\b/.test(q)) return 'The search box above every page searches flock, eggs, feed, health, expenses, income, and customers as you type (plus Finance and Team if your account can see those) — tap a result to jump straight to it.';
    if(/\bvoice\b/.test(q)) return 'Tap the mic in the search box and say something like "open eggs" to jump to a page, or just say what you\'re looking for and it searches for it. Needs Chrome, Edge, or Safari.';
    if(/\bchange.*password\b|\breset.*password\b/.test(q)) return 'From Settings → Your account, tap "Change password". If you\'re signed out and can\'t remember it, use "Forgot password?" on the sign-in screen instead.';
    if(/\badd\b.*\b(team member|staff|employee)\b/.test(q)){ if(!isAdminLevel()) return kemAiRestricted('Team'); return 'From Team, tap "Add team member" — set their name, email, a temporary password, and role (Supervisor, Vet, Financial Staff, Farmhand, or Co-Administrator), then share the login with them directly.'; }
    if(/\bnotification\b|\bpush\b|\balert\b/.test(q)) return 'From Settings → Your account, tap "Enable background urgent alerts" — that lets an Urgent message pop up on this device even when the app is in the background.';
    if(/\bcurrency\b/.test(q)) return 'From Settings, pick your display currency — everything already recorded converts automatically, nothing needs re-entering.';
    if(/\bbackup\b|\bexport\b/.test(q)) return 'Settings has a backup/export option for your records. Ask an administrator if you\'re not sure where your farm\'s backups are kept.';
    if(/\bsecurity log\b|\baccess log\b|\bwho.*(logged in|accessed)\b/.test(q)){ if(!isAdminLevel()) return kemAiRestricted('the security and access logs'); return 'Team → Access log shows every sign-in, and Team → Finance security shows every Finance unlock attempt with device and rough location.'; }
    if(/\babout page\b/.test(q)) return 'The About page tells your farm\'s story — the administrator or co-administrator can edit it with the pencil icon at the top of that page.';

    /* ---- live numbers, worked out fresh from state every time ---- */
    if(/\begg/.test(q)){
      if(/\btoday\b/.test(q)){ var r=getRange('day'); return "You've logged "+sumEggs(r.startISO,r.endISO).toLocaleString()+" eggs today."; }
      if(/\bthis week\b|\bweek\b/.test(q)){ var r=getRange('week'); return sumEggs(r.startISO,r.endISO).toLocaleString()+" eggs collected "+r.label.toLowerCase()+"."; }
      if(/\bthis month\b|\bmonth\b/.test(q)){ var r=getRange('month'); return sumEggs(r.startISO,r.endISO).toLocaleString()+" eggs collected in "+r.label+"."; }
      if(/\btotal\b|\ball.time\b|\bever\b|\bso far\b/.test(q)){ var total=state.eggs.reduce(function(a,x){return a+x.total;},0); return total.toLocaleString()+" eggs collected in total, across "+state.eggs.length+" logged day"+(state.eggs.length===1?'':'s')+"."; }
      var rToday=getRange('day'); return "You've logged "+sumEggs(rToday.startISO,rToday.endISO).toLocaleString()+" eggs today. Ask \"this week\" or \"this month\" for a wider total.";
    }
    if(/\b(flock|birds?|hens?|roosters?|chickens?)\b/.test(q) && !/\bfeed\b/.test(q)){
      var totalNow = birdsAsOf(todayISO());
      var inv = buildInventory();
      if(/\bhen/.test(q)) return (inv.chick.female+inv.grower.female+inv.layer.female)+" hens on the farm right now.";
      if(/\brooster/.test(q)) return (inv.chick.male+inv.grower.male+inv.layer.male)+" roosters on the farm right now.";
      return totalNow.toLocaleString()+" birds on the farm right now, across "+state.flock.length+" recorded batch"+(state.flock.length===1?'':'es')+".";
    }
    if(/\bstock\b|\bon hand\b|\brunning (out|low)\b/.test(q) && /\bfeed\b/.test(q)){
      var fsi = feedStockInfo();
      if(!fsi.started) return "You haven't started tracking feed stock yet — tap Restock on the Feed page the first time you buy feed.";
      return fsi.onHandKg.toFixed(1)+' kg of feed on hand'+(fsi.daysLeft!=null?', about '+Math.max(0,Math.round(fsi.daysLeft))+' day'+(Math.round(fsi.daysLeft)===1?'':'s')+' left at your recent usage rate':'')+(fsi.low?' — that\'s at or below your low-stock warning level.':'.');
    }
    if(/\bfeed\b/.test(q)){
      var r2 = /\bthis month\b|\bmonth\b/.test(q) ? getRange('month') : getRange('week');
      var kg = totalFeedKg(r2.startISO, r2.endISO), cost = totalFeedCost(r2.startISO, r2.endISO);
      return kg.toLocaleString()+" kg of feed logged "+r2.label.toLowerCase()+", costing "+fmtMoney(cost)+".";
    }
    if(/\bhealth\b|\bvaccin|\breminder/.test(q)){
      var overdue = overdueHealthCount();
      return overdue>0 ? overdue+" health reminder"+(overdue===1?'':'s')+" overdue — check the Health page for which." : "No overdue health reminders right now.";
    }
    if(/\bcustomer/.test(q)){
      var list = (state.customers||[]).slice().map(function(c){ return Object.assign({}, c, customerStats(c.id)); }).sort(function(a,b){ return b.totalSpent-a.totalSpent; });
      if(/\btop\b|\bbest\b|\bbiggest\b/.test(q)){
        return list.length ? "Your top customer is "+list[0].name+", "+fmtMoney(list[0].totalSpent)+" spent so far." : "No customers recorded yet.";
      }
      return list.length+" customer"+(list.length===1?'':'s')+" recorded.";
    }
    if(/\bexpense|\bspen[dt]/.test(q)){
      if(canSeeFinance()===false && /\bfinance\b/.test(q)) return kemAiRestricted('Finance');
      var r3 = /\bthis month\b|\bmonth\b/.test(q) ? getRange('month') : (/\btoday\b/.test(q) ? getRange('day') : getRange('week'));
      return fmtMoney(sumMoney(state.expenses, r3.startISO, r3.endISO))+" in expenses "+r3.label.toLowerCase()+".";
    }
    if(/\bincome\b|\bsales\b|\bearn/.test(q)){
      var r4 = /\bthis month\b|\bmonth\b/.test(q) ? getRange('month') : (/\btoday\b/.test(q) ? getRange('day') : getRange('week'));
      return fmtMoney(sumMoney(state.incomes, r4.startISO, r4.endISO))+" in income "+r4.label.toLowerCase()+".";
    }
    if(/\bprofit\b|\bdeficit\b|\bbottom line\b/.test(q)){
      if(!canSeeFinance()) return kemAiRestricted('the farm\'s profit figures');
      var r5 = /\bthis month\b|\bmonth\b/.test(q) ? getRange('month') : getRange('week');
      var p = sumMoney(state.incomes,r5.startISO,r5.endISO) - sumMoney(state.expenses,r5.startISO,r5.endISO);
      return (p<0 ? "A deficit of "+fmtMoney(Math.abs(p)) : "A profit of "+fmtMoney(p))+" "+r5.label.toLowerCase()+".";
    }
    if(/\bbalance\b|\bhow much (money|cash)\b|\bfinance\b.*\bbalance\b/.test(q)){
      if(!canSeeFinance()) return kemAiRestricted('Finance');
      return "Your Finance balance is "+financeMoneyDisplay(financeBalance())+(financeRevealed?'':' (tap the eye icon on the Finance page to reveal the exact figure).');
    }
    if(/\bteam\b|\bstaff\b|\bemployee/.test(q) && /\bhow many\b|\bcount\b/.test(q)){
      if(!isAdminLevel()) return kemAiRestricted('Team');
      return teamUsers.length+" team account"+(teamUsers.length===1?'':'s')+" set up.";
    }

    return "I don't have an answer for that yet. Try asking about eggs, flock, feed, health, money, or customers — or \"how do I\" do something. You can also use the search box above to find a specific record.";
  }

  /* ============================= MODAL / TOAST ============================= */
  function openModal(html){
    var root = document.getElementById('modal-root');
    // Runs a light Kiswahili pass over common button/label text only — see
    // the comment above the I18N/COMMON_SW declarations for why this is
    // scoped to modal content (mostly static labels) rather than the
    // data-bearing panels (which can contain a farmer's own note text).
    root.innerHTML = '<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">'+swTranslateFragment(html)+'</div></div>';
    var first = root.querySelector('input,select,textarea') || root.querySelector('button');
    if(first) first.focus();
  }
  function closeModal(){ document.getElementById('modal-root').innerHTML = ''; }
  // ---- Celebration overlay -------------------------------------------
  // One shared confetti-style "something nice happened" overlay, used for
  // three moments: a Finance transaction actually confirming (see the
  // finance snapshot diff in initFinanceSync), chicks hatching (see
  // 'resolve-brooding' in handleForm), and a profitable month of eggs
  // (see checkMonthlyEggProfitCelebration). Auto-dismisses on its own;
  // tapping the backdrop or the "Nice!" link also closes it right away.
  var CELEBRATION_COLORS = ['#E7A93D','#5FBA80','#3D8F6B','#F2BE63','#D6273C','#4FA8D8','#EAF6F1'];
  var CELEBRATION_CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#3D8F6B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var celebrationTimer = null;
  function celebrate(opts){
    opts = opts || {};
    var root = document.getElementById('celebration-root');
    if(!root) return;
    var confettiHtml = '';
    for(var i=0;i<40;i++){
      var left = (Math.random()*100).toFixed(1);
      var delay = (Math.random()*0.5).toFixed(2);
      var duration = (2.4+Math.random()*1.6).toFixed(2);
      var color = CELEBRATION_COLORS[i % CELEBRATION_COLORS.length];
      var rotate = Math.round(Math.random()*360);
      var wide = Math.random()>0.5;
      confettiHtml += '<div class="confetti-piece" style="left:'+left+'%; background:'+color+'; animation-delay:'+delay+'s; animation-duration:'+duration+'s; transform:rotate('+rotate+'deg);'+(wide?'width:12px;height:8px;':'')+'"></div>';
    }
    root.innerHTML = confettiHtml+
      '<div class="celebration-backdrop" data-action="dismiss-celebration"></div>'+
      '<div class="celebration-card">'+
        '<div class="celebration-icon">'+(opts.icon||CELEBRATION_CHECK_SVG)+'</div>'+
        '<div class="celebration-title">'+esc(opts.title||'Nice!')+'</div>'+
        (opts.subtitle?'<div class="celebration-sub">'+esc(opts.subtitle)+'</div>':'')+
        '<button type="button" class="celebration-dismiss" data-action="dismiss-celebration">Nice!</button>'+
      '</div>';
    requestAnimationFrame(function(){
      var bd = root.querySelector('.celebration-backdrop'); if(bd) bd.classList.add('show');
      var card = root.querySelector('.celebration-card'); if(card) card.classList.add('show');
    });
    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(dismissCelebration, 4200);
  }
  function dismissCelebration(){
    clearTimeout(celebrationTimer);
    var root = document.getElementById('celebration-root');
    if(root) root.innerHTML = '';
  }
  function confirmModal(message, onYes, opts){
    opts = opts || {};
    // Defaults to a red "Delete" button since most callers are destructive
    // deletes — pass opts.danger:false (and usually a opts.confirmLabel) for
    // a non-destructive confirmation like "skip and send anyway".
    var confirmClass = opts.danger===false ? 'btn' : 'btn danger';
    openModal(
      '<div class="modal-head"><h3>'+(opts.title||'Are you sure?')+'</h3><button class="modal-close" data-action="close-modal">'+ICONS.close+'</button></div>'+
      '<p style="font-size:14px; margin:0">'+esc(message)+'</p>'+
      '<div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="button" class="'+confirmClass+'" id="confirm-yes-btn">'+(opts.confirmLabel||'Delete')+'</button></div>'
    );
    var btn = document.getElementById('confirm-yes-btn');
    if(btn) btn.addEventListener('click', function(){ closeModal(); onYes(); });
  }
  function toast(msg){
    var root = document.getElementById('toast-root');
    var el = document.createElement('div'); el.className='toast'; el.textContent=msg;
    root.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2600);
  }

  /* ============================= MUTATE + SYNC ============================= */
  function mutate(fn){ fn(state); render(); scheduleSave(); }
  // Best-effort FYI to the administrator when a team member (never the
  // administrator themself — nothing to tell yourself) logs or loses eggs.
  // Fire-and-forget: the egg entry itself already saved via mutate() above,
  // so a failure here (offline, cold function) must never surface to the
  // person logging the eggs.
  function notifyEggActivity(action, detail){
    if(!currentUser || isAdmin() || !cloudMode) return;
    try{
      firebase.functions().httpsCallable('notifyEggActivity')({action:action, detail:detail}).catch(function(){});
    }catch(e){}
  }
  // A brooding hatch is exciting enough — and rare enough — that everyone
  // on the team should hear about it right away, even with the app fully
  // closed, not just whoever happens to be looking at the Brooding page.
  // Unlike notifyEggActivity above (a soft FYI to the administrator only),
  // this reaches every team member (via the same real push-notification
  // path as an Urgent message) and shows the same big "needs a look" popup
  // — fire-and-forget for the same reason: the hatch itself already saved
  // via mutate() before this ever runs.
  function notifyHatch(detail){
    if(!currentUser || !cloudMode) return;
    try{
      firebase.functions().httpsCallable('notifyHatch')({detail:detail}).catch(function(){});
    }catch(e){}
  }
  function persistLocalFallback(){ try{ localStorage.setItem('coop-ledger-state', JSON.stringify(state)); }catch(e){ toast('Could not save — your browser storage may be full or blocked.'); } }
  function scheduleSave(){
    // Always keep an instant local copy — works offline, and is the only
    // copy at all if the cloud database can't be reached.
    persistLocalFallback();
    if(!cloudMode || !db){ setSyncStatus('local'); return; }
    setSyncStatus('saving');
    db.collection(FARM_COLLECTION).doc(FARM_DOC).set(state).catch(function(){
      // Firestore already queued this write locally and will retry once
      // back online — the onSnapshot listener below reflects that as
      // 'offline'. A genuine failure (e.g. rules reject it) falls back
      // to noting it's only saved on this device for now.
      setSyncStatus('err');
    });
  }
  function initArtifact(){
    standaloneMode = true;
    if(!(window.firebase && firebase.apps)){
      // Firebase SDK didn't load (offline on first-ever visit, or blocked) —
      // sign-in needs Firebase Auth, so only Guest (view-only) access works
      // until connectivity returns.
      localMode = true;
      setSyncStatus('local');
      updateAuthGate();
      return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      storage = firebase.storage ? firebase.storage() : null;
      mpesaEnabled = !!firebase.functions;
      try{ db.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}
      cloudMode = true;
      setSyncStatus('connecting');
      db.collection(FARM_COLLECTION).doc(FARM_DOC).onSnapshot(function(snap){
        if(snap.exists){
          state = migrateState(snap.data());
          persistLocalFallback();
          render();
          setSyncStatus(snap.metadata.fromCache ? 'offline' : 'synced');
        } else {
          // Nobody has saved to the shared farm document yet — seed it with
          // whatever this device currently has (the backup that was baked
          // into this build, or an existing local copy), so every other
          // device that opens the app afterward starts from the same data.
          db.collection(FARM_COLLECTION).doc(FARM_DOC).set(state).catch(function(){});
        }
      }, function(){
        cloudMode = false;
        localMode = true;
        setSyncStatus('err');
      });
      // Admin "push update to everyone" — see meta/appUpdate in
      // firestore.rules and the Team page's button (pushAppUpdateToEveryone
      // below). Every device, signed in or guest, watches this doc; the
      // hasPendingWrites check skips the pusher's own optimistic local echo
      // (which briefly carries a null placeholder timestamp) so only the
      // real, server-confirmed change is ever compared/acted on. The very
      // first snapshot after load just establishes the current baseline —
      // it must never itself pop the refresh prompt, or every fresh page
      // load would show it once for free.
      (function(){
        var lastAppUpdateTS;
        db.collection('meta').doc('appUpdate').onSnapshot(function(snap){
          if(!snap.exists || snap.metadata.hasPendingWrites) return;
          var ts = snap.data().pushedAt;
          var tsKey = (ts && ts.toMillis) ? ts.toMillis() : (ts || null);
          if(lastAppUpdateTS === undefined){ lastAppUpdateTS = tsKey; return; }
          if(tsKey !== lastAppUpdateTS){
            lastAppUpdateTS = tsKey;
            if(window.__triggerAppUpdatePopup) window.__triggerAppUpdatePopup();
          }
        }, function(){ /* best-effort — offline is fine, the service-worker-based check still works */ });
      })();
      if(firebase.auth){
        // Sign-ins are remembered on this device (Firebase's normal
        // default), so reloading the page — or closing the app and
        // reopening it later — doesn't force the sign-in form again.
        // Administrator and Financial Staff accounts are the exception:
        // see sessionExpiryCheck()/startIdleTimer() below, which signs
        // those two roles out automatically after 10 minutes with no real
        // activity (mouse/keyboard/touch/scroll) — using the app resets the
        // clock, and it keeps counting correctly even while the app sits in
        // the background. It doesn't force a fresh sign-in on every single
        // reload the way the old "never remember" setting did. Every other
        // role has no such timeout at all and stays signed in indefinitely,
        // foreground or background.
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}).then(function(){
          firebase.auth().onAuthStateChanged(function(user){
            stopIdleTimer();
            if(!user){
              if(currentUser){ try{ localStorage.removeItem(lastActivityKey(currentUser.uid)); }catch(e){} }
              currentUser = null;
              financePortalUnlocked = false;
              stopFinancePortalTimer();
              readOnly = guestMode;
              kemAiSetVisible(false);
              render();
              return;
            }
            user.getIdTokenResult(false).then(function(res){
              cacheClaimsForOffline(user.uid, res.claims || {});
              offlineSessionActive = false;
              handleSignedInUser(user, res.claims || {});
            }).catch(function(err){
              // A cached (already-signed-in) session hitting this on a
              // network hiccup used to get silently signed out — genuinely
              // offline is exactly when you most need the app to still
              // open. If we have this account's role/jobTitle cached from
              // a previous successful check, use that instead of the
              // network round-trip getIdTokenResult() needs, and show a
              // small banner rather than pretending everything's normal.
              // Anything that ISN'T a plain connectivity problem (a
              // revoked/invalid token, a disabled account) still signs out
              // as before — that's a real "you're not allowed in" case,
              // not a network one.
              var offline = !navigator.onLine || (err && err.code==='auth/network-request-failed');
              var cached = offline ? readCachedClaimsForOffline(user.uid) : null;
              if(cached){
                offlineSessionActive = true;
                handleSignedInUser(user, cached);
              } else {
                firebase.auth().signOut();
              }
            });
          });
        });
      } else {
        updateAuthGate();
      }
    }catch(e){
      localMode = true;
      setSyncStatus('local');
      updateAuthGate();
    }
  }
  function nativeDownload(filename, data){
    try{
      var blob = new Blob([data], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      toast('Backup downloaded.');
    }catch(e){ toast('Could not save the backup.'); }
  }
  function doExportBackup(){
    var data = JSON.stringify(state, null, 2);
    var filename = 'coop-ledger-backup-'+todayISO()+'.json';
    if(window.claude && window.claude.use){
      window.claude.use('downloads').then(function(dl){
        if(!dl){ nativeDownload(filename, data); return; }
        return dl.save({filename:filename, data:data}).then(function(){ toast('Backup saved.'); });
      }).catch(function(){ nativeDownload(filename, data); });
    } else {
      nativeDownload(filename, data);
    }
  }
  function importBackupFile(file){
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      var data;
      try{ data = JSON.parse(reader.result); }catch(e){ toast('Could not read that file.'); return; }
      if(!data || !data.settings || !Array.isArray(data.flock)){ toast('That file doesn\'t look like a Kenokip Farm backup.'); return; }
      confirmModal('This will replace everything currently in the app with this backup. Continue?', function(){
        var merged = migrateState(data);
        mutate(function(s){
          Object.keys(s).forEach(function(k){ delete s[k]; });
          Object.assign(s, merged);
        });
        toast('Backup restored.');
      }, {confirmLabel:'Restore'});
    };
    reader.readAsText(file);
  }

  /* ============================= ACTIONS / FORMS ============================= */
  function handleAction(action){
    var parts = action.split(':');
    var verb = parts[0], a1 = parts[1], a2 = parts[2];
    switch(verb){
      case 'nav': goToSection(a1); break;
      case 'view-photo': openPhotoLightbox(a1); break;
      case 'close-photo-lightbox': closePhotoLightbox(); break;
      case 'push-app-update': pushAppUpdateToEveryone(); break;
      // "← Back to Overview" link on a partitioned section's sub-page
      // (Flock/Eggs/Money/Health) — the dropdown itself (data-change, see
      // handleChange) covers switching to any other view; this is just a
      // one-tap shortcut back to 'overview'. a1=section key, a2=view.
      case 'view-select': setView(a1, a2); render(); break;
      case 'dismiss-celebration': dismissCelebration(); break;
      // Phone tab bar only: tapping a group tab (Farm Records, Money,
      // Team) jumps to whichever of its sections was open last, or its
      // first allowed one if none was — the actual page never becomes a
      // group, ui.section is always a real leaf section either way.
      case 'nav-group': {
        var navGroup = NAV_GROUPS.find(function(g){ return g.key===a1 && g.children; });
        if(navGroup){
          var navKids = navGroup.children.filter(function(c){ return sectionAllowed(c.key); });
          if(navKids.length && !navKids.some(function(c){ return c.key===ui.section; })){
            goToSection(navKids[0].key);
            break;
          }
        }
        render();
        break;
      }
      // The back arrow and "Back to homepage" button in the topbar (see
      // navControlsHTML) — not shown at all while already on Overview.
      case 'nav-back': goBack(); break;
      case 'nav-home': goToSection('overview'); break;
      case 'period': ui.periods[a1] = a2; render(); break;
      case 'pager-prev': setPageFor(a1, pageFor(a1)-1); render(); break;
      case 'pager-next': setPageFor(a1, pageFor(a1)+1); render(); break;
      case 'close-modal': closeModal(); break;
      case 'open-add-egg': openModal(eggFormHtml()); break;
      case 'edit-egg': openModal(eggFormHtml(a1)); break;
      case 'delete-egg': confirmModal('Delete this entry? You can restore it from Trash for 30 days.', function(){ mutate(function(s){ var x=s.eggs.find(function(i){return i.id===a1;}); if(x) trashPush(s,'egg',x); s.eggs = s.eggs.filter(function(x){return x.id!==a1;}); }); }); break;
      case 'open-add-eggloss': openModal(eggLossFormHtml()); break;
      case 'edit-eggloss': openModal(eggLossFormHtml(a1)); break;
      case 'delete-eggloss':
        confirmModal('Delete this entry? You can restore it from Trash for 30 days.', function(){
          mutate(function(s){
            var x = (s.eggLosses||[]).find(function(i){return i.id===a1;});
            var linked = [];
            if(x && x.linkedIncomeId){
              var linkedInc = s.incomes.find(function(i){return i.id===x.linkedIncomeId;});
              if(linkedInc) linked.push({arr:'incomes', record:linkedInc});
              s.incomes = s.incomes.filter(function(i){return i.id!==x.linkedIncomeId;});
            }
            if(x) trashPush(s,'eggloss',x,linked);
            s.eggLosses = s.eggLosses.filter(function(i){return i.id!==a1;});
          });
        });
        break;
      case 'view-finance-receipt': viewReceipt(financeReceiptOpts(a1)); break;
      case 'view-flock-receipt': viewReceipt(flockReceiptOpts(a1, a2)); break;
      case 'view-egg-receipt': viewReceipt(eggReceiptOpts(a1)); break;
      case 'view-expense-receipt': viewReceipt(expenseReceiptOpts(a1)); break;
      case 'view-income-receipt': viewReceipt(incomeReceiptOpts(a1)); break;
      case 'view-feed-receipt': viewReceipt(feedReceiptOpts(a1)); break;
      case 'view-health-receipt': viewReceipt(healthReceiptOpts(a1)); break;
      case 'sign-pending-receipt': signAndPreviewReceipt(pendingReceiptOpts, pendingReceiptRenderFn, pendingReceiptOpts && pendingReceiptOpts.isStatement ? 'Activity Statement' : 'Receipt'); break;
      case 'print-pending-receipt': printReceiptNow(pendingReceiptHtml); break;
      case 'copy-verify-link':
        if(!pendingVerifyLink){ toast('No verification link for this document.'); break; }
        copyTextToClipboard(pendingVerifyLink).then(function(ok){
          toast(ok ? 'Verification link copied — paste it into "Verify a receipt" on any device.' : 'Could not copy automatically — long-press the link in the receipt and copy it that way.');
        });
        break;
      case 'sigpad-clear': clearSignaturePad(); break;
      case 'sigpad-undo': undoLastSignatureStroke(); break;
      case 'open-pending-signoff': openPendingSignoffFromMessage(a1); break;
      case 'review-pending-signoff': openAdminReviewModal(a1); break;
      case 'approve-pending-signoff': approvePendingSignoff(a1); break;
      case 'skip-pending-signoff': skipPendingSignoff(a1); break;
      case 'sigpad-confirm': confirmSignaturePad(); break;
      case 'open-verify-receipt': openVerifyChecker(); break;
      case 'run-verify-receipt': runVerifyReceipt(); break;
      case 'open-activity-statement': openModal(activityStatementFormHtml()); break;
      case 'open-add-flock': openModal(flockFormHtml(null, a1)); break;
      case 'edit-flock': openModal(flockFormHtml(a1)); break;
      case 'delete-flock':
        confirmModal('Delete this batch and its history? You can restore it from Trash for 30 days.', function(){
          mutate(function(s){
            var b = s.flock.find(function(x){return x.id===a1;});
            var linked = [];
            if(b){
              (b.removals||[]).forEach(function(r){
                if(r.linkedIncomeId){
                  var li = s.incomes.find(function(i){return i.id===r.linkedIncomeId;});
                  if(li) linked.push({arr:'incomes', record:li});
                  s.incomes = s.incomes.filter(function(i){return i.id!==r.linkedIncomeId;});
                }
              });
              if(b.linkedAcqExpenseId){
                var le = s.expenses.find(function(x){return x.id===b.linkedAcqExpenseId;});
                if(le) linked.push({arr:'expenses', record:le});
                s.expenses = s.expenses.filter(function(x){return x.id!==b.linkedAcqExpenseId;});
              }
              trashPush(s,'flock',b,linked);
            }
            s.flock = s.flock.filter(function(x){return x.id!==a1;});
          });
        });
        break;
      case 'open-remove-flock': openModal(removalFormHtml(a1)); break;
      case 'edit-removal': openModal(removalFormHtml(a1, a2)); break;
      case 'open-record-loss': openModal(removalFormHtml()); break;
      case 'open-resex': openModal(resexFormHtml(a1)); break;
      case 'open-history': openModal(historyModalHtml(a1)); break;
      case 'delete-removal': {
        var hBatchId=a1, hRemId=a2;
        confirmModal('Undo this entry and restore the birds to this batch?', function(){
          mutate(function(s){
            var b = s.flock.find(function(x){return x.id===hBatchId;}); if(!b) return;
            var rem = (b.removals||[]).find(function(r){return r.id===hRemId;}); if(!rem) return;
            b.removals = b.removals.filter(function(r){return r.id!==hRemId;});
            if(rem.linkedIncomeId) s.incomes = s.incomes.filter(function(i){return i.id!==rem.linkedIncomeId;});
            if(rem.linkedBatchId) s.flock = s.flock.filter(function(x){return x.id!==rem.linkedBatchId;});
          });
          openModal(historyModalHtml(hBatchId));
        });
        break;
      }
      case 'open-add-brooding': openModal(broodingFormHtml()); break;
      case 'open-resolve-brooding': openModal(resolveBroodingFormHtml(a1)); break;
      case 'open-edit-brooding': openModal(editBroodingFormHtml(a1)); break;
      case 'delete-brooding': {
        var delBrood = (state.broodings||[]).find(function(x){return x.id===a1;});
        var delMsg = (delBrood && delBrood.chickBatchId) ? 'Delete this brooding record? This will also remove the chicks batch it added to the flock.' : 'Delete this brooding record?';
        confirmModal(delMsg+' You can restore it from Trash for 30 days.', function(){
          mutate(function(s){
            var brood = (s.broodings||[]).find(function(x){return x.id===a1;});
            var linked = [];
            if(brood){
              if(brood.eggLossId){
                var lel = (s.eggLosses||[]).find(function(x){return x.id===brood.eggLossId;});
                if(lel) linked.push({arr:'eggLosses', record:lel});
                s.eggLosses = (s.eggLosses||[]).filter(function(x){return x.id!==brood.eggLossId;});
              }
              if(brood.chickBatchId){
                var lfb = s.flock.find(function(x){return x.id===brood.chickBatchId;});
                if(lfb) linked.push({arr:'flock', record:lfb});
                s.flock = s.flock.filter(function(x){return x.id!==brood.chickBatchId;});
              }
              trashPush(s,'brooding',brood,linked);
            }
            s.broodings = (s.broodings||[]).filter(function(x){return x.id!==a1;});
          });
        }, {confirmLabel:'Delete'});
        break;
      }
      case 'open-add-feed': openModal(feedFormHtml()); break;
      case 'edit-feed': openModal(feedFormHtml(a1)); break;
      case 'open-restock-feed': openModal(feedStockFormHtml()); break;
      case 'delete-feed':
        confirmModal('Delete this feed entry? You can restore it from Trash for 30 days.', function(){
          mutate(function(s){
            var fx = (s.feedLogs||[]).find(function(x){return x.id===a1;});
            var linked = [];
            if(fx && fx.linkedExpenseId){
              var lfe = s.expenses.find(function(x){return x.id===fx.linkedExpenseId;});
              if(lfe) linked.push({arr:'expenses', record:lfe});
              s.expenses = s.expenses.filter(function(x){return x.id!==fx.linkedExpenseId;});
            }
            if(fx){
              s.feedStock = s.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
              s.feedStock.onHandKg = (s.feedStock.onHandKg||0) + (fx.quantityKg||0);
              trashPush(s,'feed',fx,linked);
            }
            s.feedLogs = (s.feedLogs||[]).filter(function(x){return x.id!==a1;});
          });
        });
        break;
      case 'open-add-health': openModal(healthFormHtml()); break;
      case 'edit-health': openModal(healthFormHtml(a1)); break;
      case 'delete-health':
        confirmModal('Delete this health record? You can restore it from Trash for 30 days.', function(){ mutate(function(s){ var x=(s.healthRecords||[]).find(function(i){return i.id===a1;}); if(x) trashPush(s,'health',x); s.healthRecords = (s.healthRecords||[]).filter(function(x){return x.id!==a1;}); }); });
        break;
      case 'open-add-customer': openModal(customerFormHtml()); break;
      case 'edit-customer': openModal(customerFormHtml(a1)); break;
      case 'delete-customer':
        confirmModal('Delete this customer? Their past sales and receipts are unaffected — this only removes them from the directory. You can restore them from Trash for 30 days.', function(){
          mutate(function(s){ var x=(s.customers||[]).find(function(i){return i.id===a1;}); if(x) trashPush(s,'customer',x); s.customers = (s.customers||[]).filter(function(c){return c.id!==a1;}); });
        });
        break;
      case 'open-add-expense': openModal(moneyFormHtml('expense')); break;
      case 'edit-expense': openModal(moneyFormHtml('expense',a1)); break;
      case 'delete-expense': confirmModal('Delete this expense? You can restore it from Trash for 30 days.', function(){ mutate(function(s){ var x=s.expenses.find(function(i){return i.id===a1;}); if(x) trashPush(s,'expense',x); s.expenses = s.expenses.filter(function(x){return x.id!==a1;}); }); }); break;
      case 'open-add-income': openModal(moneyFormHtml('income')); break;
      case 'edit-income': openModal(moneyFormHtml('income',a1)); break;
      case 'delete-income': confirmModal('Delete this income record? You can restore it from Trash for 30 days.', function(){ mutate(function(s){ var x=s.incomes.find(function(i){return i.id===a1;}); if(x) trashPush(s,'income',x); s.incomes = s.incomes.filter(function(x){return x.id!==a1;}); }); }); break;
      case 'open-edit-about':
        if(!isAdminLevel()){ toast('Only the administrator can edit this.'); break; }
        openModal(aboutFormHtml());
        break;
      case 'open-add-currency': openModal(currencyFormHtml()); break;
      case 'open-edit-currency': openModal(currencyFormHtml(a1)); break;
      case 'delete-currency':
        if(a1==='KES'){ toast('KES is the base currency and can\'t be removed.'); break; }
        if(state.settings.displayCurrency===a1){ toast('Switch away from '+a1+' before deleting it.'); break; }
        confirmModal('Delete currency '+a1+'?', function(){ mutate(function(s){ delete s.settings.currencies[a1]; }); });
        break;
      case 'delete-category': {
        var type=a1, name=a2;
        var used = (type==='expense'?state.expenses:state.incomes).some(function(x){return x.category===name;});
        if(used){ toast('That category is in use and can\'t be deleted.'); break; }
        confirmModal('Delete category "'+name+'"?', function(){
          mutate(function(s){
            var key = type==='expense' ? 'expenseCategories' : 'incomeCategories';
            s.settings[key] = s.settings[key].filter(function(c){return c!==name;});
          });
        });
        break;
      }
      case 'remove-photo': {
        var rpType=a1, rpId=a2;
        var rpArrName = ATTACH_ARRAY_BY_TYPE[rpType];
        var rpRec = rpArrName ? (state[rpArrName]||[]).find(function(x){return x.id===rpId;}) : null;
        var rpOldURL = rpRec && rpRec.photoURL;
        mutate(function(s){
          var rec = (s[rpArrName]||[]).find(function(x){return x.id===rpId;});
          if(rec) rec.photoURL = null;
        });
        if(storage && rpOldURL){ try{ storage.refFromURL(rpOldURL).delete().catch(function(){}); }catch(e){} }
        openModal(rpType==='health' ? healthFormHtml(rpId) : moneyFormHtml('expense', rpId));
        break;
      }
      case 'restore-trash': restoreTrashItem(a1); break;
      case 'purge-trash':
        confirmModal('Delete this forever? This can\'t be undone.', function(){ purgeTrashItem(a1); });
        break;
      case 'set-language':
        mutate(function(s){ s.settings.language = (a1==='sw') ? 'sw' : 'en'; });
        break;
      case 'export-backup': doExportBackup(); break;
      case 'export-report-csv': exportReportCSV(getRange(ui.periods.reports)); break;
      case 'print-report': window.print(); break;
      case 'signout': firebase.auth().signOut(); toast('Signed out.'); break;
      case 'toggle-away': {
        if(!isAdmin()) break;
        var nextAway = !(currentUser && currentUser.away);
        firebase.functions().httpsCallable('updateOwnProfile')({away: nextAway}).then(function(){
          toast(nextAway ? "You're marked away — team members can skip a document that needs your signature." : "You're marked available again.");
        }).catch(function(){ toast('Could not update this — please try again.'); });
        break;
      }
      case 'guest-signin': guestMode = false; readOnly = false; authGateMode = 'welcome'; authGateError=''; render(); break;
      case 'auth-gate-signin': authGateMode = 'signin'; authGateError = ''; authGateNotice = ''; updateAuthGate(); break;
      case 'auth-gate-forgot': authGateMode = 'forgot'; authGateError = ''; authGateNotice = ''; updateAuthGate(); break;
      case 'auth-gate-back': authGateMode = 'welcome'; authGateError = ''; authGateNotice = ''; updateAuthGate(); break;
      case 'auth-gate-guest': guestMode = true; readOnly = true; ui.section = 'overview'; navHistory = []; saveUIPref(); startIdleTimer(); render(); toast('Viewing as a guest — read-only, Finance hidden.'); break;
      case 'open-add-finance':
        if(!canProposeFinance()){ toast('Sign in as the administrator or financial staff to add Finance entries.'); break; }
        openModal(financeFormHtml());
        break;
      case 'edit-finance':
        if(!isAdmin()){ toast('Only the administrator can edit entries.'); break; }
        openModal(financeFormHtml(a1));
        break;
      case 'delete-finance':
        if(!isAdmin()){ toast('Only the administrator can delete entries.'); break; }
        confirmModal('Delete this transaction? This can\'t be undone.', function(){
          firebase.functions().httpsCallable('deleteFinanceEntry')({id:a1}).then(function(){ toast('Deleted.'); }).catch(function(err){ toast((err&&err.message)||'Could not delete.'); });
        });
        break;
      case 'open-set-opening':
        if(!isAdmin()){ toast('Only the administrator can set this.'); break; }
        openModal(openingBalanceFormHtml());
        break;
      case 'open-mpesa-deposit':
        if(!canProposeFinance()){ toast('Only the administrator, co-administrator, or financial staff can start M-Pesa deposits.'); break; }
        if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); break; }
        openModal(mpesaDepositFormHtml());
        break;
      case 'open-mpesa-withdraw':
        if(!isAdmin()){ toast('Only the administrator can send money out.'); break; }
        if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); break; }
        if(!mpesaPayoutsEnabled){ toast('Payouts aren\'t available on this M-Pesa account yet.'); break; }
        // Payouts are confirmed with the Finance PIN or fingerprint/Face now
        // (see mpesaWithdrawFormHtml/initiateWithdrawal) — the main
        // authenticator app is no longer part of this flow, so it's no
        // longer required just to open this form.
        if(!(financeGuardStatus && (financeGuardStatus.pinSet || financeGuardStatus.fingerprintEnrolled))){
          toast('Set up your personal Finance PIN or fingerprint/Face unlock first, in Settings → Your account.'); break;
        }
        openModal(mpesaWithdrawFormHtml());
        break;
      case 'mpesa-check-balance':
        if(!isAdminLevel()){ toast('Only the administrator or co-administrator can check the M-Pesa balance.'); break; }
        if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); break; }
        toast('Checking with Safaricom…');
        firebase.functions().httpsCallable('checkAccountBalance')().catch(function(err){ toast((err&&err.message)||'Could not check the balance.'); });
        break;
      case 'open-mpesa-txnstatus':
        if(!isAdminLevel()){ toast('Only the administrator or co-administrator can check a transaction.'); break; }
        if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); break; }
        openModal(mpesaTxnStatusFormHtml());
        break;
      case 'open-mpesa-qr':
        if(!canProposeFinance()){ toast('Only the administrator, co-administrator, or financial staff can generate a payment QR code.'); break; }
        if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); break; }
        openModal(mpesaQRFormHtml());
        break;
      case 'open-authapp-setup':
        if(!canSeeFinance()){ toast('Not available for your account.'); break; }
        firebase.functions().httpsCallable('startTotpEnrollment')().then(function(res){
          openModal(authAppSetupFormHtml(res.data));
          renderAuthAppQR(res.data.otpauthUri);
        }).catch(function(err){ toast((err&&err.message)||'Could not start setup.'); });
        break;
      case 'open-portal-authapp-setup':
        if(!canSeeFinance()){ toast('Not available for your account.'); break; }
        firebase.functions().httpsCallable('startPortalTotpEnrollment')().then(function(res){
          openModal(portalAuthAppSetupFormHtml(res.data));
          renderAuthAppQR(res.data.otpauthUri);
        }).catch(function(err){ toast((err&&err.message)||'Could not start setup.'); });
        break;
      case 'finance-unlock-tab':
        financeUnlockTab = a1;
        financeUnlockTabTouched = true;
        render();
        break;
      case 'unlock-finance-fingerprint':
        unlockWithFinanceFingerprint();
        break;
      case 'quickpin-key':
        quickPinPressDigit(a1);
        break;
      case 'quickpin-backspace':
        quickPinBackspaceKey();
        break;
      case 'quickpin-fingerprint':
        quickPinFingerprint();
        break;
      case 'mpesa-withdraw-fingerprint':
        mpesaWithdrawWithFingerprint();
        break;
      case 'enroll-finance-fingerprint':
        enrollFinanceFingerprint();
        break;
      case 'remove-finance-fingerprint':
        if(!confirm('Remove fingerprint/Face unlock for this device? You can set it up again any time.')) break;
        removeFinanceFingerprintDevice(a1);
        break;
      case 'open-clear-finance-lock':
        if(!isAdmin()){ toast('Only the administrator can do this.'); break; }
        openModal(clearFinanceLockFormHtml());
        break;
      case 'security-log-page':
        securityEventPage = a1==='prev' ? securityEventPage-1 : securityEventPage+1;
        render();
        break;
      case 'finance-reveal-prompt':
        if(!canSeeFinance()) break;
        if(isAdmin()){
          if(financeGuardStatus===null) refreshFinanceGuardStatus();
          if(financeGuardStatus && !financeGuardStatus.pinSet){ toast('Set up your personal Finance PIN first, in Settings → Your account.'); break; }
          openModal(financeRevealQuickPinHtml());
          break;
        }
        if(!currentUser.totpEnrolled){ toast('Set up your authenticator app first, in Settings → Your account.'); break; }
        openModal(financeRevealFormHtml());
        break;
      case 'revealpin-key':
        revealPinPressDigit(a1);
        break;
      case 'revealpin-backspace':
        revealPinBackspaceKey();
        break;
      case 'finance-reveal-hide':
        financeRevealed = false;
        render();
        break;
      case 'clear-birthday-lock':
        if(!isAdmin()) break;
        firebase.functions().httpsCallable('clearBirthdayLock')().then(function(){
          toast('Birthday PIN lock cleared.');
          refreshBirthdayGuardStatus();
        }).catch(function(err){ toast((err&&err.message)||'Could not clear that lock.'); });
        break;
      case 'birthday-reveal-prompt':
        if(!isAdmin()) break;
        if(birthdayGuardStatus===null) refreshBirthdayGuardStatus();
        if(birthdayGuardStatus && !birthdayGuardStatus.pinSet){ toast('Set up your Birthday PIN first, in Settings → Your account.'); break; }
        if(birthdayGuardStatus && birthdayGuardStatus.locked){ toast('Birthday viewing is locked after repeated wrong attempts — clear it from Settings → Your account.'); break; }
        openModal(birthdayRevealQuickPinHtml());
        break;
      case 'birthday-reveal-hide':
        birthdaysRevealed = false;
        teamBirthdays = null;
        render();
        break;
      case 'open-add-staff':
        if(!isAdminLevel()){ toast('Only the administrator can do this.'); break; }
        openModal(staffFormHtml());
        break;
      case 'bulk-seed-about': {
        if(!isAdminLevel()) break;
        var seedTargets = teamUsers.filter(function(u){ return u.uid!==currentUser.uid && !u.about; });
        if(!seedTargets.length){ toast('Everyone already has an About.'); break; }
        toast('Saving starter Abouts…');
        Promise.all(seedTargets.map(function(u){
          return firebase.functions().httpsCallable('updateStaffAccount')({uid:u.uid, about: defaultAboutForRole(u)}).catch(function(){ return null; });
        })).then(function(){
          toast('Starter Abouts saved — everyone can edit their own from Team Directory.');
        });
        break;
      }
      case 'open-change-password':
        if(!currentUser){ toast('Sign in first.'); break; }
        openModal(changePasswordFormHtml());
        break;
      case 'open-reset-password': {
        if(!isAdminLevel()) break;
        var resetUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!resetUser) break;
        openModal(resetStaffPasswordFormHtml(a1, resetUser.email));
        break;
      }
      case 'open-edit-name': {
        if(!isAdminLevel()) break;
        var editNameUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!editNameUser) break;
        openModal(editStaffNameFormHtml(a1, editNameUser.name, editNameUser.gender));
        break;
      }
      case 'open-set-own-dob':
        if(!currentUser) break;
        openModal(setOwnDobFormHtml());
        break;
      case 'open-set-staff-dob': {
        if(!isAdmin()) break;
        var dobUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!dobUser) break;
        // Prefilled only if already revealed this sitting (see
        // birthday-reveal-prompt) — entering a value you can already see
        // isn't a new "reveal"; if it isn't revealed yet, the field just
        // starts blank and the administrator can still set/overwrite it.
        var existingDob = (teamBirthdays && teamBirthdays[a1]) || '';
        openModal(setStaffDobFormHtml(a1, dobUser.name || (dobUser.email?dobUser.email.split('@')[0]:'this team member'), existingDob));
        break;
      }
      case 'open-change-role': {
        if(!isAdminLevel()) break;
        var changeRoleUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!changeRoleUser) break;
        if(changeRoleUser.role==='administrator'){ toast("The administrator's account can't be changed here."); break; }
        openModal(changeRoleFormHtml(a1, changeRoleUser.role, changeRoleUser.jobTitle));
        break;
      }
      case 'enable-notifications':
        if(typeof Notification==='undefined'){ toast('Background alerts aren\'t supported in this browser.'); break; }
        Notification.requestPermission().then(function(perm){
          toast(perm==='granted' ? 'Background urgent alerts enabled on this device.' : 'Blocked — enable notifications for this site in your browser settings to turn this on.');
          render();
          if(perm==='granted') registerForPush();
        });
        break;
      case 'toggle-staff': {
        if(!isAdminLevel()) break;
        var staffUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!staffUser) break;
        var nextDisabled = !staffUser.disabled;
        firebase.functions().httpsCallable('updateStaffAccount')({uid:a1, disabled:nextDisabled}).then(function(){
          toast(nextDisabled ? 'Account disabled.' : 'Account enabled.');
        }).catch(function(err){ toast((err&&err.message)||'Could not update that account.'); });
        break;
      }
      case 'delete-staff':
        if(!isAdminLevel()) break;
        confirmModal('Remove this team member\'s account? They will no longer be able to sign in.', function(){
          firebase.functions().httpsCallable('deleteStaffAccount')({uid:a1}).then(function(){ toast('Account removed.'); }).catch(function(err){ toast((err&&err.message)||'Could not remove that account.'); });
        }, {confirmLabel:'Remove'});
        break;
      case 'review-finance': {
        if(!isAdmin()) break;
        var decision = a2==='reject' ? 'reject' : 'approve';
        firebase.functions().httpsCallable('reviewFinanceEntry')({id:a1, decision:decision}).then(function(){
          toast(decision==='approve' ? 'Approved.' : 'Rejected.');
        }).catch(function(err){ toast((err&&err.message)||'Could not review that entry.'); });
        break;
      }
      case 'access-log-page':
        if(a1==='prev') accessLogPage = Math.max(0, accessLogPage-1);
        else accessLogPage = accessLogPage+1;
        render();
        break;
      case 'open-compose-message':
        if(!currentUser){ toast('Sign in first.'); break; }
        openModal(composeMessageFormHtml());
        break;
      case 'open-kudos': {
        if(!isAdminLevel()){ toast('Only the administrator can do this.'); break; }
        if(a1==='all'){ openModal(kudosFormHtml('all', null)); break; }
        var kudosUser = teamUsers.find(function(x){ return x.uid===a1; });
        if(!kudosUser){ toast("That team member's account no longer exists."); break; }
        openModal(kudosFormHtml(a1, kudosUser.name || (kudosUser.email?kudosUser.email.split('@')[0]:'them')));
        break;
      }
      case 'toggle-messages-view':
        if(!isAdminLevel()) break;
        messagesViewAll = !messagesViewAll;
        render();
        break;
      case 'mark-message-read':
        firebase.functions().httpsCallable('markMessageRead')({id:a1}).catch(function(){});
        break;
      case 'reply-message': {
        if(!currentUser){ toast('Sign in first.'); break; }
        var replyMsg = messages.find(function(m){ return m.id===a1; });
        if(!replyMsg){ toast('That message is no longer available.'); break; }
        openModal(composeMessageFormHtml({
          to: replyMsg.fromUid,
          quoteFrom: replyMsg.fromLabel,
          quoteBody: (replyMsg.body||'').slice(0,160),
          replyTo: replyMsg.id
        }));
        break;
      }
      case 'urgent-alert-dismiss':
        urgentAlertQueue.shift();
        renderUrgentAlert();
        break;
      case 'urgent-alert-view':
        urgentAlertQueue.shift();
        renderUrgentAlert();
        ui.section = 'messages'; saveUIPref(); render();
        break;
      default: break;
    }
  }
  function eggSizeFieldsSum(){
    var total = 0;
    EGG_SIZES.forEach(function(p){ var i = document.querySelector('[name="size_'+p[0]+'"]'); if(i) total += Math.max(0, Number(i.value||0)); });
    return total;
  }
  function handleChange(name, el){
    if(name==='money-nav'){ goToSection(el.value); return; }
    if(name.indexOf('view-select:')===0){
      // Overview + dropdown sub-pages (Flock: Chicks/Growers/Hens/Cocks/
      // Brooding; same pattern used for Eggs, Money and Health) — see
      // currentView()/setView() and each section's own *ViewSwitcherHTML().
      setView(name.split(':')[1], el.value);
      render();
      return;
    }
    if(name.indexOf('attach-photo:')===0){
      var apParts = name.split(':');
      attachPhotoTo(apParts[1], apParts[2], el.files[0]);
      el.value = '';
      return;
    }
    if(name==='egg-grade-toggle'){
      var fields = document.getElementById('egg-size-fields');
      var totalInput = document.getElementById('egg-total-input');
      if(fields) fields.style.display = el.checked ? 'grid' : 'none';
      if(totalInput){
        totalInput.readOnly = el.checked;
        if(el.checked) totalInput.value = eggSizeFieldsSum();
      }
      return;
    }
    if(name==='egg-size-input'){
      var totalInput2 = document.getElementById('egg-total-input');
      if(totalInput2) totalInput2.value = eggSizeFieldsSum();
      return;
    }
    if(name==='kudos-template-pick'){
      var kudosMsgBox = document.getElementById('kudos-message');
      if(kudosMsgBox && el.value) kudosMsgBox.value = el.value;
      return;
    }
    if(name==='kudos-reward-pick'){
      var kudosCustomRow = document.getElementById('kudos-reward-custom-row');
      if(kudosCustomRow) kudosCustomRow.style.display = el.value==='__custom__' ? 'block' : 'none';
      return;
    }
    if(name==='removal-reason'){
      var sf = document.getElementById('sale-fields');
      if(sf) sf.style.display = el.value==='sold' ? 'grid' : 'none';
      return;
    }
    if(name==='removal-batch'){
      var chosen = state.flock.find(function(x){return x.id===el.value;});
      var cMax = chosen ? currentCount(chosen) : 0;
      var countInput = document.getElementById('removal-count-input');
      if(countInput){ countInput.max = cMax; if(Number(countInput.value||0)>cMax) countInput.value = cMax || 1; }
      var hint = document.getElementById('removal-batch-hint');
      if(hint) hint.textContent = cMax+' bird'+(cMax===1?'':'s')+' available in this batch.';
      return;
    }
    if(name==='display-currency'){ mutate(function(s){ s.settings.displayCurrency = el.value; }); return; }
    if(name==='import-file'){ importBackupFile(el.files[0]); el.value=''; return; }
    if(name==='profile-photo-file'){ uploadProfilePhoto(el.files[0]); el.value=''; return; }
    if(name==='brooding-date'){
      var preview = document.getElementById('brooding-hatch-preview');
      if(preview && el.value) preview.textContent = fmtDate(parseISO(addDaysISO(el.value, EGG_INCUBATION_DAYS)));
      return;
    }
    if(name==='eggloss-reason'){
      var esf = document.getElementById('egg-sale-fields');
      if(esf) esf.style.display = el.value==='sold' ? 'grid' : 'none';
      return;
    }
  }
  function handleForm(name, form){
    var fd = new FormData(form);
    function val(k){ return fd.get(k); }

    if(name==='egg'){
      var id = val('id') || null;
      var graded = document.getElementById('egg-grade-toggle') ? document.getElementById('egg-grade-toggle').checked : false;
      var sizes = null;
      if(graded){
        sizes = {};
        EGG_SIZES.forEach(function(p){ sizes[p[0]] = Math.max(0, Number(val('size_'+p[0])||0)); });
      }
      var total = graded ? EGG_SIZES.reduce(function(a,p){ return a+(sizes[p[0]]||0); },0) : Math.max(0, Number(val('eggs')||0));
      var date = val('date'), note = val('note') || '';
      mutate(function(s){
        if(id){ var e = s.eggs.find(function(x){return x.id===id;}); if(e){ e.date=date; e.total=total; e.note=note; e.sizes=sizes; } }
        else {
          var existing = s.eggs.find(function(x){return x.date===date;});
          if(existing){ existing.total=total; existing.note=note; existing.sizes=sizes; }
          else s.eggs.push({id:uid('egg'), date:date, total:total, note:note, sizes:sizes});
        }
      });
      closeModal(); toast('Egg log saved.');
      notifyEggActivity('logged', total+' egg(s) for '+fmtDate(parseISO(date))+(note?' — '+note:''));
      checkMonthlyEggProfitCelebration();
      return;
    }
    if(name==='eggloss'){
      var elId = val('id') || null;
      var elReason = val('reason'), elCount = Math.max(1, Number(val('count')||0));
      var elDate = val('date'), elNote = val('note') || '';
      var elSaleAmount = Number(val('saleAmount')||0), elSaleCurrency = val('saleCurrency');
      var elBuyer = (val('buyer')||'').trim();
      var newElId = null;
      mutate(function(s){
        if(!Array.isArray(s.eggLosses)) s.eggLosses = [];
        var x = elId ? s.eggLosses.find(function(i){return i.id===elId;}) : null;
        if(!x){ x = {id:uid('eggloss')}; s.eggLosses.push(x); }
        // Editing always drops any previously linked income first, then
        // recreates it if this is still (or newly) a sale with an amount —
        // simplest way to keep the two in sync without drifting.
        if(x.linkedIncomeId){ s.incomes = s.incomes.filter(function(i){return i.id!==x.linkedIncomeId;}); x.linkedIncomeId = null; }
        x.date = elDate; x.reason = elReason; x.count = elCount; x.note = elNote;
        if(elReason==='sold'){
          x.buyer = elBuyer;
          x.customerId = resolveOrCreateCustomer(s, elBuyer);
          x.saleAmount = elSaleAmount>0 ? fromCurrency(elSaleAmount, elSaleCurrency) : 0;
          x.recordedByRole = x.recordedByRole || roleLabel(currentUser);
          if(elSaleAmount>0){
            var incRec = {id:uid('inc'), date:elDate, category:'Egg Sales', amount: x.saleAmount, note: elNote || ('Sale of '+elCount+' egg(s)'), recordedByRole: roleLabel(currentUser)};
            s.incomes.push(incRec);
            x.linkedIncomeId = incRec.id;
          }
        } else {
          x.buyer = null; x.customerId = null; x.saleAmount = 0; x.recordedByRole = null;
        }
        newElId = x.id;
      });
      closeModal();
      if(elReason==='sold'){ viewReceipt(eggReceiptOpts(newElId)); }
      else { toast(elId?'Saved.':'Egg loss logged.'); }
      notifyEggActivity('lost', elCount+' egg(s) — '+elReason+(elNote?' — '+elNote:''));
      return;
    }
    if(name==='flock'){
      var fid = val('id') || null;
      var gender = val('gender'), count = Math.max(1, Number(val('count')||0));
      var dateAdded = val('dateAdded'), ageWeeksV = Math.max(0, Number(val('ageWeeks')||0));
      var birthDate = toISO(addDays(parseISO(dateAdded), -ageWeeksV*7));
      var source = val('source') || '';
      var acqCostRaw = Number(val('acquisitionCost')||0), acqCurrency = val('acqCurrency');
      var autoVaccinate = !fid && val('autoVaccinate')==='1';
      mutate(function(s){
        var acqCost = acqCostRaw>0 ? fromCurrency(acqCostRaw, acqCurrency) : 0;
        var b, isNew = !fid;
        if(fid){ b = s.flock.find(function(x){return x.id===fid;}); if(b){ b.gender=gender; b.count=count; b.dateAdded=dateAdded; b.birthDate=birthDate; b.source=source; } }
        else { b = {id:uid('batch'), gender:gender, count:count, dateAdded:dateAdded, birthDate:birthDate, source:source, removals:[]}; s.flock.push(b); }
        if(!b) return;
        if(isNew && autoVaccinate) queueVaccinationSchedule(s, b.id, birthDate);
        b.acquisitionCost = acqCost;
        s.expenses = s.expenses || [];
        // Same linked-expense pattern as feed logging — one Expense entry
        // stays in sync with this field, never entered twice.
        if(acqCost>0){
          var linkedExp = b.linkedAcqExpenseId ? s.expenses.find(function(x){return x.id===b.linkedAcqExpenseId;}) : null;
          if(linkedExp){ linkedExp.date=dateAdded; linkedExp.amount=acqCost; linkedExp.note='Acquired batch: '+genderLabel(gender)+(gender!=='unsexed'?'s':'')+(source?' — '+source:''); }
          else {
            var newExp = {id:uid('exp'), date:dateAdded, category:'Chicks / Restocking', amount:acqCost, note:'Acquired batch: '+genderLabel(gender)+(gender!=='unsexed'?'s':'')+(source?' — '+source:'')};
            s.expenses.push(newExp);
            b.linkedAcqExpenseId = newExp.id;
          }
        } else if(b.linkedAcqExpenseId){
          s.expenses = s.expenses.filter(function(x){return x.id!==b.linkedAcqExpenseId;});
          b.linkedAcqExpenseId = null;
        }
      });
      closeModal(); toast(fid?'Batch updated.':'Batch added.');
      return;
    }
    if(name==='removal'){
      var remEditId = val('id') || null;
      var batchId = val('batchId'), reason = val('reason'), rcount = Math.max(1, Number(val('count')||0));
      var rdate = val('date'), rnote = val('note') || '';
      var saleAmount = Number(val('saleAmount')||0), saleCurrency = val('saleCurrency');
      var buyer = (val('buyer')||'').trim();
      var error = null;
      var newRemId = null;
      mutate(function(s){
        var b = s.flock.find(function(x){return x.id===batchId;}); if(!b) return;
        b.removals = b.removals || [];
        var rem = remEditId ? b.removals.find(function(r){return r.id===remEditId;}) : null;
        // Editing gives this entry's own birds back to the pool first, so
        // raising the count is allowed too, up to what's really available.
        var avail = currentCount(b) + (rem ? rem.count : 0);
        if(rcount>avail){ error = 'Only '+avail+' birds available for this entry.'; return; }
        if(!rem){ rem = {id:uid('rem')}; b.removals.push(rem); }
        // Editing always drops any previously linked income first, then
        // recreates it if this is still (or newly) a sale with an amount —
        // simplest way to keep the two in sync without drifting (same
        // pattern as editing an egg sale/loss).
        if(rem.linkedIncomeId){ s.incomes = s.incomes.filter(function(i){return i.id!==rem.linkedIncomeId;}); rem.linkedIncomeId = null; }
        rem.date = rdate; rem.count = rcount; rem.reason = reason; rem.note = rnote;
        if(reason==='sold'){
          rem.buyer = buyer;
          rem.customerId = resolveOrCreateCustomer(s, buyer);
          rem.saleAmount = saleAmount>0 ? fromCurrency(saleAmount, saleCurrency) : 0;
          rem.recordedByRole = rem.recordedByRole || roleLabel(currentUser);
          if(saleAmount>0){
            var incRec = {id:uid('inc'), date:rdate, category:'Bird Sales', amount: rem.saleAmount, note: rnote || ('Sale of '+rcount+' bird(s)'), recordedByRole: roleLabel(currentUser)};
            s.incomes.push(incRec);
            rem.linkedIncomeId = incRec.id;
          }
        } else {
          rem.buyer = null; rem.customerId = null; rem.saleAmount = 0; rem.recordedByRole = null;
        }
        newRemId = rem.id;
      });
      if(error){ toast(error); return; }
      closeModal();
      if(reason==='sold'){ viewReceipt(flockReceiptOpts(batchId, newRemId)); }
      else { toast(remEditId?'Saved.':'Recorded.'); }
      return;
    }
    if(name==='resex'){
      var rbId = val('batchId'), targetGender = val('targetGender'), scount = Math.max(1, Number(val('count')||0)), sdate = val('date');
      var serror = null;
      mutate(function(s){
        var b = s.flock.find(function(x){return x.id===rbId;}); if(!b) return;
        if(b.gender!=='unsexed'){ serror = 'Only unsexed batches can be sexed.'; return; }
        var avail = currentCount(b);
        if(scount>avail){ serror = 'Only '+avail+' birds available.'; return; }
        b.removals = b.removals || [];
        var newBatchId = uid('batch');
        b.removals.push({id:uid('rem'), date:sdate, count:scount, reason:'resexed', note:'', linkedBatchId:newBatchId});
        s.flock.push({id:newBatchId, gender:targetGender, count:scount, dateAdded:sdate, birthDate:b.birthDate, source:'Sexed from earlier batch', removals:[], resex:true});
      });
      if(serror){ toast(serror); return; }
      closeModal(); toast('Batch updated.');
      return;
    }
    if(name==='brooding'){
      var bgEggs = Math.max(1, Number(val('eggsGiven')||0));
      var bgDate = val('dateStarted'), bgNote = val('note') || '';
      mutate(function(s){
        if(!Array.isArray(s.broodings)) s.broodings = [];
        var lossRec = {id:uid('eggloss'), date:bgDate, reason:'brooding', count:bgEggs, note:bgNote};
        s.eggLosses = s.eggLosses || [];
        s.eggLosses.push(lossRec);
        s.broodings.push({id:uid('brood'), dateStarted:bgDate, eggsGiven:bgEggs, note:bgNote, status:'pending', eggLossId:lossRec.id});
      });
      closeModal(); toast('Brooding started — expected to hatch in '+EGG_INCUBATION_DAYS+' days.');
      return;
    }
    if(name==='resolve-brooding'){
      var rbId2 = val('id'), rbDate = val('date');
      var rbError = null, rbChicks = 0;
      mutate(function(s){
        var brood = (s.broodings||[]).find(function(x){return x.id===rbId2}); if(!brood){ rbError='That brooding record is no longer available.'; return; }
        if(brood.status==='hatched'){ rbError = 'This one has already been recorded.'; return; }
        var notHatched = Math.max(0, Math.min(brood.eggsGiven, Number(val('eggsNotHatched')||0)));
        var chicks = brood.eggsGiven - notHatched;
        rbChicks = chicks;
        brood.status = 'hatched';
        brood.eggsNotHatched = notHatched;
        brood.chicksAdded = chicks;
        brood.resolvedDate = rbDate;
        if(chicks>0){
          var chickBatchId = uid('batch');
          s.flock.push({id:chickBatchId, gender:'unsexed', count:chicks, dateAdded:rbDate, birthDate:rbDate, source:'Hatched from brooding', removals:[]});
          brood.chickBatchId = chickBatchId;
        }
      });
      if(rbError){ toast(rbError); return; }
      closeModal(); toast(rbChicks>0 ? rbChicks+' chick'+(rbChicks===1?'':'s')+' added to the flock.' : 'Recorded — none of the eggs hatched.');
      if(rbChicks>0){
        var rbBrood = (state.broodings||[]).find(function(x){return x.id===rbId2;});
        notifyHatch(rbChicks+' chick'+(rbChicks===1?'':'s')+' hatched from the brooding started '+fmtDate(parseISO(rbBrood?rbBrood.dateStarted:rbDate))+'.');
        celebrate({ title:rbChicks+' chick'+(rbChicks===1?'':'s')+' hatched!', subtitle:'Added to the flock as a new batch.' });
      }
      return;
    }
    if(name==='edit-brooding'){
      var ebId = val('id');
      var ebEggs = Math.max(1, Number(val('eggsGiven')||0));
      var ebDate = val('dateStarted');
      var ebNote = val('note') || '';
      var ebError = null;
      mutate(function(s){
        var b = (s.broodings||[]).find(function(x){return x.id===ebId;});
        if(!b){ ebError = 'That brooding record is no longer available.'; return; }
        if(b.status==='hatched'){
          var ebChicks = Math.max(0, Number(val('chicksAdded')||0));
          var ebNotHatched = Math.max(0, Number(val('eggsNotHatched')||0));
          if(ebChicks + ebNotHatched !== ebEggs){ ebError = 'Chicks hatched plus eggs that did not hatch must add up to the eggs given.'; return; }
          if(b.chickBatchId){
            var batch = s.flock.find(function(x){return x.id===b.chickBatchId;});
            if(batch){
              var removedSoFar = (batch.removals||[]).reduce(function(a,r){return a+r.count;},0);
              if(ebChicks < removedSoFar){ ebError = 'Can\'t reduce chicks hatched below '+removedSoFar+' — that many have already been removed from that batch.'; return; }
              batch.count = ebChicks;
            } else if(ebChicks>0){
              var newBatchId = uid('batch');
              s.flock.push({id:newBatchId, gender:'unsexed', count:ebChicks, dateAdded:b.resolvedDate||ebDate, birthDate:b.resolvedDate||ebDate, source:'Hatched from brooding', removals:[]});
              b.chickBatchId = newBatchId;
            }
          } else if(ebChicks>0){
            var newBatchId2 = uid('batch');
            s.flock.push({id:newBatchId2, gender:'unsexed', count:ebChicks, dateAdded:b.resolvedDate||ebDate, birthDate:b.resolvedDate||ebDate, source:'Hatched from brooding', removals:[]});
            b.chickBatchId = newBatchId2;
          }
          b.chicksAdded = ebChicks;
          b.eggsNotHatched = ebNotHatched;
        }
        b.eggsGiven = ebEggs;
        b.dateStarted = ebDate;
        b.note = ebNote;
        // Keep the linked "given for brooding" egg-loss entry (on the Eggs
        // page) in sync, so the two never quietly disagree about the count.
        if(b.eggLossId){
          var loss = (s.eggLosses||[]).find(function(x){return x.id===b.eggLossId;});
          if(loss){ loss.count = ebEggs; loss.date = ebDate; loss.note = ebNote; }
        }
      });
      if(ebError){ toast(ebError); return; }
      closeModal(); toast('Brooding record updated.');
      return;
    }
    if(name==='about'){
      if(!isAdminLevel()){ toast('Only the administrator can edit this.'); return; }
      var aboutBio = (val('bio')||'').trim(), aboutMission = (val('mission')||'').trim(), aboutVision = (val('vision')||'').trim();
      mutate(function(s){
        s.settings.about = { bio: aboutBio, mission: aboutMission, vision: aboutVision };
      });
      closeModal(); toast('About saved.');
      return;
    }
    if(name==='customer'){
      var custId = val('id') || null;
      var custName = (val('name')||'').trim();
      var custPhone = (val('phone')||'').trim();
      var custNote = (val('note')||'').trim();
      if(!custName){ toast('Enter a name.'); return; }
      mutate(function(s){
        s.customers = s.customers || [];
        if(custId){ var c = s.customers.find(function(i){return i.id===custId;}); if(c){ c.name=custName; c.phone=custPhone; c.note=custNote; } }
        else s.customers.push({id:uid('cust'), name:custName, phone:custPhone, note:custNote, createdDate:todayISO()});
      });
      closeModal(); toast(custId?'Saved.':'Customer added.');
      return;
    }
    if(name==='feed'){
      var fid = val('id') || null, fdate = val('date'), feedType = val('feedType') || 'Other';
      var qtyKg = Math.max(0, Number(val('quantityKg')||0));
      var fcurrency = val('currency');
      var fcostRaw = Number(val('cost')||0);
      var fnote = val('note') || '';
      mutate(function(s){
        var fcost = fcostRaw>0 ? fromCurrency(fcostRaw, fcurrency) : 0;
        s.feedLogs = s.feedLogs || [];
        s.expenses = s.expenses || [];
        s.feedStock = s.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
        var entry, prevQty = 0;
        if(fid){ entry = s.feedLogs.find(function(x){return x.id===fid;}); if(entry) prevQty = entry.quantityKg||0; }
        if(!entry){
          entry = {id:uid('feed'), feedType:feedType, date:fdate, quantityKg:qtyKg, cost:fcost, note:fnote, recordedByRole: roleLabel(currentUser)};
          s.feedLogs.push(entry);
        } else {
          entry.feedType = feedType; entry.date = fdate; entry.quantityKg = qtyKg; entry.cost = fcost; entry.note = fnote;
        }
        // Usage draws down stock on hand — a new entry subtracts its full
        // quantity, editing one only subtracts the change since last save,
        // so re-saving the same entry twice never double-counts.
        s.feedStock.onHandKg = (s.feedStock.onHandKg||0) - (qtyKg - prevQty);
        // Keep a linked Expense entry (category "Feed") in sync with the cost
        // on this feed log, so it's never entered twice — editing or zeroing
        // the cost here updates/removes the Expense automatically.
        if(fcost>0){
          var linkedExp = entry.linkedExpenseId ? s.expenses.find(function(x){return x.id===entry.linkedExpenseId;}) : null;
          if(linkedExp){ linkedExp.date=fdate; linkedExp.amount=fcost; linkedExp.note='Feed: '+feedType+(fnote?' — '+fnote:''); }
          else {
            var newExp = {id:uid('exp'), date:fdate, category:'Feed', amount:fcost, note:'Feed: '+feedType+(fnote?' — '+fnote:'')};
            s.expenses.push(newExp);
            entry.linkedExpenseId = newExp.id;
          }
        } else if(entry.linkedExpenseId){
          s.expenses = s.expenses.filter(function(x){return x.id!==entry.linkedExpenseId;});
          entry.linkedExpenseId = null;
        }
      });
      closeModal(); toast(fid ? 'Feed entry updated.' : 'Feed logged.');
      return;
    }
    if(name==='feed-stock'){
      var rsQty = Math.max(0, Number(val('quantityKg')||0));
      var rsType = val('feedType') || 'Other', rsDate = val('date') || todayISO(), rsNote = val('note')||'';
      var rsCurrency = val('currency'), rsCostRaw = Number(val('cost')||0);
      var rsLowStock = Math.max(0, Number(val('lowStockKg')||0));
      if(rsQty<=0){ toast('Enter how much feed you added.'); return; }
      mutate(function(s){
        var rsCost = rsCostRaw>0 ? fromCurrency(rsCostRaw, rsCurrency) : 0;
        s.feedStock = s.feedStock || {onHandKg:0, lowStockKg:20, restocks:[]};
        s.feedStock.onHandKg = (s.feedStock.onHandKg||0) + rsQty;
        s.feedStock.lowStockKg = rsLowStock;
        s.feedStock.restocks = s.feedStock.restocks || [];
        var rec = {id:uid('restock'), date:rsDate, feedType:rsType, quantityKg:rsQty, cost:rsCost, note:rsNote, recordedByRole: roleLabel(currentUser)};
        s.feedStock.restocks.push(rec);
        if(rsCost>0){
          s.expenses = s.expenses || [];
          s.expenses.push({id:uid('exp'), date:rsDate, category:'Feed', amount:rsCost, note:'Feed restock: '+rsType+(rsNote?' — '+rsNote:''), linkedRestockId: rec.id});
        }
      });
      closeModal(); toast('Stock updated.');
      return;
    }
    if(name==='health'){
      var hid = val('id') || null, hdate = val('date'), htype = val('type') || 'other';
      var htitle = (val('title')||'').trim(), hbatchId = val('batchId') || null, hnextDue = val('nextDueDate') || null, hnote = val('note') || '';
      if(!htitle){ toast('Enter what this record is for.'); return; }
      mutate(function(s){
        s.healthRecords = s.healthRecords || [];
        if(hid){
          var hx = s.healthRecords.find(function(x){return x.id===hid;});
          if(hx){ hx.date=hdate; hx.type=htype; hx.title=htitle; hx.batchId=hbatchId||null; hx.nextDueDate=hnextDue||null; hx.note=hnote; }
        } else {
          s.healthRecords.push({id:uid('health'), date:hdate, type:htype, title:htitle, batchId:hbatchId||null, nextDueDate:hnextDue||null, note:hnote, recordedByRole: roleLabel(currentUser)});
        }
      });
      closeModal(); toast(hid ? 'Health record updated.' : 'Health record added.');
      return;
    }
    if(name==='expense' || name==='income'){
      var mid = val('id') || null, mdate = val('date'), category = val('category'), currency = val('currency');
      var amountRaw = Number(val('amount')||0), mnote = val('note') || '';
      mutate(function(s){
        var amount = fromCurrency(amountRaw, currency);
        var list = name==='expense' ? s.expenses : s.incomes;
        if(mid){ var x = list.find(function(i){return i.id===mid;}); if(x){ x.date=mdate; x.category=category; x.amount=amount; x.note=mnote; } }
        else list.push({id:uid(name==='expense'?'exp':'inc'), date:mdate, category:category, amount:amount, note:mnote, recordedByRole: roleLabel(currentUser)});
      });
      closeModal(); toast('Saved.');
      checkMonthlyEggProfitCelebration();
      return;
    }
    if(name==='activity-statement-range'){
      var stStart = val('startDate'), stEnd = val('endDate');
      if(stStart > stEnd){ toast('The "From" date must be before the "To" date.'); return; }
      closeModal();
      viewReceipt(activityStatementOpts(stStart, stEnd), buildActivityStatementHTML, 'Activity Statement');
      return;
    }
    if(name==='currency'){
      var prevCode = val('prevCode') || null;
      var code = (val('code')||'').toUpperCase().trim();
      var symbol = val('symbol');
      var rate = prevCode==='KES' ? 1 : Number(val('rate')||0);
      var decimals = Number(val('decimals')||0);
      if(!code){ toast('Enter a currency code.'); return; }
      mutate(function(s){
        var prevDef = s.settings.currencies[code];
        if(prevCode && prevCode!==code){
          delete s.settings.currencies[prevCode];
          if(s.settings.displayCurrency===prevCode) s.settings.displayCurrency = code;
        }
        s.settings.currencies[code] = {symbol:symbol, rate: rate>0 ? rate : (prevDef ? prevDef.rate : 1), decimals:decimals};
      });
      closeModal(); toast('Currency saved.');
      return;
    }
    if(name==='category-expense' || name==='category-income'){
      var ctype = name==='category-expense' ? 'expense' : 'income';
      var cname = (val('name')||'').trim();
      if(!cname) return;
      mutate(function(s){
        var key = ctype==='expense' ? 'expenseCategories' : 'incomeCategories';
        var exists = s.settings[key].some(function(c){ return c.toLowerCase()===cname.toLowerCase(); });
        if(!exists) s.settings[key].push(cname);
      });
      form.reset();
      toast('Category added.');
      return;
    }
    if(name==='finance'){
      if(!canProposeFinance()){ toast('Sign in as the administrator or financial staff first.'); return; }
      var tid = val('id') || null;
      var ttype = val('type'), tdate = val('date'), tcurrency = val('currency');
      var tamountRaw = Number(val('amount')||0), tnote = val('note') || '';
      var amount = fromCurrency(tamountRaw, tcurrency);
      if(tid){
        if(!isAdmin()){ toast('Only the administrator can edit entries.'); return; }
        firebase.functions().httpsCallable('editFinanceEntry')({id:tid, type:ttype, date:tdate, amount:amount, note:tnote}).then(function(){
          closeModal(); toast('Saved.');
        }).catch(function(err){ toast((err&&err.message)||'Could not save.'); });
      } else {
        firebase.functions().httpsCallable('proposeFinanceEntry')({type:ttype, date:tdate, amount:amount, note:tnote}).then(function(res){
          closeModal();
          toast((res.data && res.data.status==='pending') ? 'Sent for the administrator\'s approval.' : 'Added.');
        }).catch(function(err){ toast((err&&err.message)||'Could not add.'); });
      }
      return;
    }
    if(name==='finance-opening'){
      if(!isAdmin()){ toast('Only the administrator can set this.'); return; }
      var oDate = val('date') || todayISO(), oCurrency = val('currency');
      var oAmountRaw = Number(val('amount')||0);
      var oAmount = fromCurrency(oAmountRaw, oCurrency);
      firebase.functions().httpsCallable('setOpeningBalance')({amount:oAmount, date:oDate}).then(function(){
        closeModal(); toast('Opening balance saved.');
      }).catch(function(err){ toast((err&&err.message)||'Could not save.'); });
      return;
    }
    if(name==='signin'){
      var sgEmail = (val('email')||'').trim(), sgPassword = val('password')||'';
      if(!(window.firebase && firebase.auth)){ authGateError = 'Sign-in isn\'t available right now — check your connection.'; updateAuthGate(); return; }
      var signinBtn = form.querySelector('button[type="submit"]');
      if(signinBtn){ signinBtn.disabled = true; signinBtn.textContent = 'Signing in…'; }
      firebase.auth().signInWithEmailAndPassword(sgEmail, sgPassword).then(function(){
        authGateError = '';
      }).catch(function(err){
        // Signing in for the very first time on a device genuinely can't
        // work offline — Firebase has to check the password against its
        // own servers, there's no way around that safely. Once it's
        // succeeded here at least once, THAT'S when this device can keep
        // working offline afterward (see cacheClaimsForOffline /
        // onAuthStateChanged) — so this message is honest about the one
        // case that's a hard limit, not a bug.
        var isNetworkErr = !navigator.onLine || (err && err.code==='auth/network-request-failed');
        authGateError = isNetworkErr
          ? 'Couldn\'t sign in — no internet connection. Signing in for the first time on this device needs one; after that, this device can stay signed in offline.'
          : 'Sign-in failed — ' + (err && err.code==='auth/invalid-credential' ? 'check your email and password.' : (err && err.code==='auth/user-disabled' ? 'this account has been disabled.' : (err && err.message) || 'please try again.'));
        authGateMode = 'signin';
        updateAuthGate();
      });
      return;
    }
    if(name==='forgot-password'){
      var fpEmail = (val('email')||'').trim();
      if(!(window.firebase && firebase.auth)){ authGateError = 'Not available right now — check your connection.'; updateAuthGate(); return; }
      var fpBtn = form.querySelector('button[type="submit"]');
      if(fpBtn){ fpBtn.disabled = true; fpBtn.textContent = 'Sending…'; }
      firebase.auth().sendPasswordResetEmail(fpEmail).then(function(){
        authGateNotice = 'If an account exists for that email, a reset link is on its way.';
        authGateError = '';
        updateAuthGate();
      }).catch(function(){
        // Same message either way — don't reveal whether the email has an account.
        authGateNotice = 'If an account exists for that email, a reset link is on its way.';
        authGateError = '';
        updateAuthGate();
      });
      return;
    }
    if(name==='add-staff'){
      if(!isAdminLevel()){ toast('Only the administrator can do this.'); return; }
      var sName = (val('name')||'').trim(), sEmail = (val('email')||'').trim().toLowerCase(), sPassword = val('password')||'', sRoleChoice = val('roleChoice'), sGender = val('gender')||'unspecified';
      var sDob = val('dob')||'';
      var sIsCoAdmin = sRoleChoice === 'coadmin';
      var sJobTitle = sIsCoAdmin ? null : sRoleChoice;
      // Saved as real data from the moment the account exists (the obvious
      // one-liner for their role) — not just shown until they write their
      // own — so it's already there for the whole team to see right away.
      var sAbout = defaultAboutForRole(sIsCoAdmin ? {role:'coadmin'} : {role:'employee', jobTitle:sJobTitle});
      var sPayload = {name:sName, email:sEmail, password:sPassword, gender:sGender, about:sAbout, role: sIsCoAdmin ? 'coadmin' : 'employee'};
      if(!sIsCoAdmin) sPayload.jobTitle = sJobTitle;
      firebase.functions().httpsCallable('createStaffAccount')(sPayload).then(function(res){
        closeModal(); toast('Account created — share the email and password with them.');
        // Date of birth goes through setStaffDob (privateProfiles/{uid}),
        // never createStaffAccount itself — that call only ever touches
        // users/{uid}, which every signed-in account can read.
        if(sDob && res.data && res.data.uid){
          firebase.functions().httpsCallable('setStaffDob')({uid:res.data.uid, dob:sDob}).catch(function(){
            toast('Account created, but the birthday didn\'t save — set it from Team Directory.');
          });
        }
      }).catch(function(err){ toast((err&&err.message)||'Could not create the account.'); });
      return;
    }
    if(name==='change-role'){
      if(!isAdminLevel()){ toast('Only the administrator can do this.'); return; }
      var crUid = val('uid'), crRoleChoice = val('roleChoice');
      var crIsCoAdmin = crRoleChoice === 'coadmin';
      var crPayload = { uid: crUid, role: crIsCoAdmin ? 'coadmin' : 'employee' };
      if(!crIsCoAdmin) crPayload.jobTitle = crRoleChoice;
      firebase.functions().httpsCallable('updateStaffAccount')(crPayload).then(function(){
        closeModal(); toast('Role updated.');
      }).catch(function(err){ toast((err&&err.message)||'Could not update that account.'); });
      return;
    }
    if(name==='update-own-name'){
      if(!currentUser){ toast('Sign in first.'); return; }
      var ownName = (val('name')||'').trim();
      if(!ownName){ toast('Enter a name.'); return; }
      firebase.functions().httpsCallable('updateOwnProfile')({name:ownName}).then(function(){
        toast('Name saved.');
      }).catch(function(err){ toast((err&&err.message)||'Could not save your name.'); });
      return;
    }
    if(name==='update-own-profile'){
      if(!currentUser){ toast('Sign in first.'); return; }
      var ownAbout = (val('about')||'').trim();
      var ownGender = val('gender')||'unspecified';
      firebase.functions().httpsCallable('updateOwnProfile')({about:ownAbout, gender:ownGender}).then(function(){
        toast('Saved.');
      }).catch(function(err){ toast((err&&err.message)||'Could not save this.'); });
      return;
    }
    if(name==='set-own-dob'){
      if(!currentUser){ toast('Sign in first.'); return; }
      var ownDob = val('dob')||'';
      if(!/^\d{4}-\d{2}-\d{2}$/.test(ownDob)){ toast('Enter a valid date.'); return; }
      firebase.functions().httpsCallable('setOwnDob')({dob:ownDob}).then(function(res){
        myDob = (res.data && res.data.dob) || ownDob;
        closeModal(); toast('Birthday saved.'); render();
      }).catch(function(err){ toast((err&&err.message)||'Could not save that date.'); });
      return;
    }
    if(name==='set-staff-dob'){
      if(!isAdmin()){ toast('Only the administrator can do this.'); return; }
      var sdUid = val('uid'), sdDob = val('dob')||'';
      if(!/^\d{4}-\d{2}-\d{2}$/.test(sdDob)){ toast('Enter a valid date.'); return; }
      firebase.functions().httpsCallable('setStaffDob')({uid:sdUid, dob:sdDob}).then(function(){
        if(teamBirthdays) teamBirthdays[sdUid] = sdDob; // keep the already-revealed view in sync without a re-reveal
        closeModal(); toast('Birthday saved.'); render();
      }).catch(function(err){ toast((err&&err.message)||'Could not save that date.'); });
      return;
    }
    if(name==='send-kudos'){
      if(!isAdminLevel()){ toast('Only the administrator can do this.'); return; }
      var kTo = val('to');
      var kMessage = (val('message')||'').trim();
      if(!kMessage){ toast('Write a congratulation message first.'); return; }
      var kRewardChoice = val('rewardChoice')||'';
      var kReward = kRewardChoice==='__custom__' ? (val('rewardCustom')||'').trim() : kRewardChoice;
      var kPayload = {to:kTo, message:kMessage};
      if(kReward) kPayload.reward = kReward;
      firebase.functions().httpsCallable('sendKudos')(kPayload).then(function(){
        closeModal(); toast('Sent!');
      }).catch(function(err){ toast((err&&err.message)||'Could not send that.'); });
      return;
    }
    if(name==='compose-message'){
      if(!currentUser){ toast('Sign in first.'); return; }
      var toVal = val('to'), msgUrgency = val('urgency')||'normal', msgBody = (val('body')||'').trim();
      var msgReplyTo = (val('replyTo')||'').trim();
      if(!msgBody){ toast('Write a message first.'); return; }
      if(toVal==='all' && !isAdminLevel()){ toast('Only the administrator can message everyone.'); return; }
      if(!toVal){ toast('Choose who to send this to.'); return; }
      var msgPayload = {to:toVal, body:msgBody, urgency:msgUrgency};
      if(msgReplyTo) msgPayload.replyTo = msgReplyTo;
      firebase.functions().httpsCallable('sendMessage')(msgPayload).then(function(){
        closeModal(); toast(msgReplyTo ? 'Reply sent.' : 'Message sent.');
      }).catch(function(err){ toast((err&&err.message)||'Could not send that message.'); });
      return;
    }
    if(name==='edit-staff-name'){
      if(!isAdminLevel()){ toast('Only the administrator can do this.'); return; }
      var enUid = val('uid'), enName = (val('name')||'').trim(), enGender = val('gender')||'unspecified';
      if(!enName){ toast('Enter a name.'); return; }
      firebase.functions().httpsCallable('updateStaffAccount')({uid:enUid, name:enName, gender:enGender}).then(function(){
        closeModal(); toast('Saved.');
      }).catch(function(err){ toast((err&&err.message)||'Could not save that.'); });
      return;
    }
    if(name==='change-password'){
      if(!currentUser || !(window.firebase && firebase.auth && firebase.auth().currentUser)){ toast('Sign in first.'); return; }
      var curPass = val('current')||'', newPass1 = val('new1')||'', newPass2 = val('new2')||'';
      if(newPass1.length<6){ toast('New password needs at least 6 characters.'); return; }
      if(newPass1!==newPass2){ toast('New passwords don\'t match.'); return; }
      var pwUser = firebase.auth().currentUser;
      var pwCred = firebase.auth.EmailAuthProvider.credential(pwUser.email, curPass);
      var pwBtn = form.querySelector('button[type="submit"]');
      if(pwBtn){ pwBtn.disabled = true; pwBtn.textContent = 'Saving…'; }
      pwUser.reauthenticateWithCredential(pwCred).then(function(){
        return pwUser.updatePassword(newPass1);
      }).then(function(){
        closeModal(); toast('Password changed.');
      }).catch(function(err){
        if(pwBtn){ pwBtn.disabled = false; pwBtn.textContent = 'Save'; }
        var code = err && err.code;
        var msg = (code==='auth/wrong-password' || code==='auth/invalid-credential') ? 'Current password is incorrect.' : ((err && err.message) || 'Could not change your password.');
        toast(msg);
      });
      return;
    }
    if(name==='reset-staff-password'){
      if(!isAdminLevel()){ toast('Only the administrator can do this.'); return; }
      var rUid = val('uid'), rPassword = val('password')||'';
      if(rPassword.length<6){ toast('Password needs at least 6 characters.'); return; }
      firebase.functions().httpsCallable('updateStaffAccount')({uid:rUid, password:rPassword}).then(function(){
        closeModal(); toast('Password reset — share the new one with them.');
      }).catch(function(err){ toast((err&&err.message)||'Could not reset that password.'); });
      return;
    }
    if(name==='mpesa-deposit'){
      if(!canProposeFinance()){ toast('Only the administrator, co-administrator, or financial staff can start M-Pesa deposits.'); return; }
      if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); return; }
      var mAmount = Number(val('amount')||0), mPhone = (val('phone')||'').trim();
      var mAccount = (mpesaPaybillStkEnabled ? (val('account')||'till') : 'till').trim();
      var submitBtn = document.getElementById('mpesa-deposit-submit');
      if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending prompt…'; }
      mutate(function(s){ s.settings.ownerPhone = mPhone; });
      firebase.functions().httpsCallable('initiateDeposit')({ amount: mAmount, phone: mPhone, account: mAccount }).then(function(res){
        closeModal();
        toast((res.data && res.data.message) || 'Check your phone for the M-Pesa prompt.');
      }).catch(function(err){
        if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Send M-Pesa prompt'; }
        toast('Could not start the deposit — ' + ((err && err.message) || 'try again.'));
      });
      return;
    }
    if(name==='mpesa-withdraw'){
      if(!isAdmin()){ toast('Only the administrator can send money out.'); return; }
      if(!mpesaEnabled){ toast('M-Pesa isn\'t set up on this deployment yet.'); return; }
      if(!mpesaPayoutsEnabled){ toast('Payouts aren\'t available on this M-Pesa account yet.'); return; }
      var wAmount = Number(val('amount')||0), wPhone = (val('phone')||'').trim(), wNote = (val('note')||'').trim(), wPin = (val('pin')||'').trim();
      if(!wPin){ toast('Enter your Finance PIN, or use the fingerprint button.'); return; }
      var wBtn = document.getElementById('mpesa-withdraw-submit');
      if(wBtn){ wBtn.disabled = true; wBtn.textContent = 'Sending…'; }
      firebase.functions().httpsCallable('initiateWithdrawal')({ amount: wAmount, phone: wPhone, note: wNote, pin: wPin }).then(function(res){
        closeModal();
        toast((res.data && res.data.message) || 'Payout sent — it will show up here once Safaricom confirms it.');
      }).catch(function(err){
        if(wBtn){ wBtn.disabled = false; wBtn.textContent = 'Send'; }
        toast((err && err.message) || 'Could not send that payout.');
      });
      return;
    }
    if(name==='mpesa-txnstatus'){
      if(!isAdminLevel()){ toast('Only the administrator or co-administrator can check a transaction.'); return; }
      var txnId = (val('transactionId')||'').trim().toUpperCase();
      var tsBtn = document.getElementById('mpesa-txnstatus-submit');
      if(tsBtn){ tsBtn.disabled = true; tsBtn.textContent = 'Checking…'; }
      firebase.functions().httpsCallable('checkTransactionStatus')({ transactionId: txnId }).then(function(){
        closeModal();
        toast('Checking with Safaricom — the result will show up on the Finance page in a few seconds.');
      }).catch(function(err){
        if(tsBtn){ tsBtn.disabled = false; tsBtn.textContent = 'Check'; }
        toast((err && err.message) || 'Could not check that transaction.');
      });
      return;
    }
    if(name==='mpesa-qr'){
      if(!canProposeFinance()){ toast('Only the administrator, co-administrator, or financial staff can generate a payment QR code.'); return; }
      var qrAmount = Number(val('amount')||0);
      var qrBtn = document.getElementById('mpesa-qr-submit');
      if(qrBtn){ qrBtn.disabled = true; qrBtn.textContent = 'Generating…'; }
      firebase.functions().httpsCallable('generateDynamicQR')({ amount: qrAmount }).then(function(res){
        openModal(mpesaQRResultHtml(res.data.qrCode));
      }).catch(function(err){
        if(qrBtn){ qrBtn.disabled = false; qrBtn.textContent = 'Generate'; }
        toast((err && err.message) || 'Could not generate the QR code.');
      });
      return;
    }
    if(name==='confirm-authapp'){
      if(!canSeeFinance()){ toast('Not available for your account.'); return; }
      var setupCode = (val('code')||'').trim();
      firebase.functions().httpsCallable('confirmTotpEnrollment')({ code: setupCode }).then(function(){
        closeModal(); toast('Authenticator app set up.');
      }).catch(function(err){ toast((err&&err.message)||'That code didn\'t work — try again.'); });
      return;
    }
    if(name==='finance-reveal-code'){
      if(!canSeeFinance()){ toast('Not available for your account.'); return; }
      if(isAdmin()){
        var revealPin = (val('pin')||'').trim();
        firebase.functions().httpsCallable('verifyFinancePinReveal')({ pin: revealPin }).then(function(){
          financeRevealed = true;
          closeModal(); render();
        }).catch(function(err){ toast((err&&err.message)||'Incorrect PIN — try again.'); });
        return;
      }
      var revealCode = (val('code')||'').trim();
      firebase.functions().httpsCallable('verifyTotpCode')({ code: revealCode }).then(function(){
        financeRevealed = true;
        closeModal(); render();
      }).catch(function(err){ toast((err&&err.message)||'That code didn\'t work — try again.'); });
      return;
    }
    if(name==='quickpin-clear-lock'){
      if(!isAdmin()){ toast('Only the administrator can clear a Finance portal lock.'); return; }
      var clearCode = (val('code')||'').trim();
      var clearBtn = form.querySelector('button[type="submit"]');
      if(clearBtn){ clearBtn.disabled = true; clearBtn.textContent = 'Clearing…'; }
      firebase.functions().httpsCallable('adminClearFinanceLock')({ code: clearCode }).then(function(){
        toast('Lock cleared.');
        refreshFinanceGuardStatus();
        render();
      }).catch(function(err){
        if(clearBtn){ clearBtn.disabled = false; clearBtn.textContent = 'Clear lock & continue'; }
        toast((err&&err.message)||'That code didn\'t work — try again.');
      });
      return;
    }
    if(name==='confirm-portal-authapp'){
      if(!canSeeFinance()){ toast('Not available for your account.'); return; }
      var portalSetupCode = (val('code')||'').trim();
      firebase.functions().httpsCallable('confirmPortalTotpEnrollment')({ code: portalSetupCode }).then(function(){
        closeModal(); toast('Finance portal authenticator set up.');
      }).catch(function(err){ toast((err&&err.message)||'That code didn\'t work — try again.'); });
      return;
    }
    if(name==='unlock-finance-portal'){
      if(!canSeeFinance()){ toast('Not available for your account.'); return; }
      var fpPassword = val('password')||'', fpCode = (val('code')||'').trim();
      var fpBtn = document.getElementById('unlock-finance-portal-submit');
      if(fpBtn){ fpBtn.disabled = true; fpBtn.textContent = 'Checking…'; }
      firebase.functions().httpsCallable('unlockFinancePortal')({ password: fpPassword, code: fpCode }).then(function(){
        financePortalUnlocked = true;
        startFinancePortalTimer();
        toast('Finance portal unlocked.');
        render();
      }).catch(function(err){
        if(fpBtn){ fpBtn.disabled = false; fpBtn.textContent = 'Unlock Finance'; }
        refreshFinanceGuardStatus();
        toast((err&&err.message)||'Could not unlock the Finance portal.');
        render();
      });
      return;
    }
    if(name==='set-finance-pin'){
      if(!canSeeFinance()){ toast('Not available for your account.'); return; }
      var newPin = (val('pin')||'').trim();
      var newPin2 = (val('pin2')||'').trim();
      if(!/^\d{4,8}$/.test(newPin)){ toast('Use a 4 to 8 digit PIN.'); return; }
      if(newPin!==newPin2){ toast('Those two PINs don\'t match.'); return; }
      firebase.functions().httpsCallable('setFinancePin')({ pin: newPin }).then(function(){
        toast('Your personal Finance PIN is set.');
        refreshFinanceGuardStatus();
        try{ form.reset(); }catch(e){}
      }).catch(function(err){ toast((err&&err.message)||'Could not save that PIN.'); });
      return;
    }
    if(name==='set-birthday-pin'){
      if(!isAdmin()){ toast('Only the administrator can do this.'); return; }
      var newBPin = (val('pin')||'').trim();
      var newBPin2 = (val('pin2')||'').trim();
      if(!/^\d{4,8}$/.test(newBPin)){ toast('Use a 4 to 8 digit PIN.'); return; }
      if(newBPin!==newBPin2){ toast('Those two PINs don\'t match.'); return; }
      firebase.functions().httpsCallable('setBirthdayPin')({ pin: newBPin }).then(function(){
        toast('Your Birthday PIN is set.');
        refreshBirthdayGuardStatus();
        try{ form.reset(); }catch(e){}
      }).catch(function(err){ toast((err&&err.message)||'Could not save that PIN.'); });
      return;
    }
    if(name==='clear-finance-lock'){
      if(!isAdmin()){ toast('Only the administrator can do this.'); return; }
      var clearCode = (val('code')||'').trim();
      firebase.functions().httpsCallable('adminClearFinanceLock')({ code: clearCode }).then(function(){
        closeModal();
        toast('Finance portal lock cleared.');
        refreshFinanceGuardStatus();
        render();
      }).catch(function(err){ toast((err&&err.message)||'That code didn\'t work — try again.'); });
      return;
    }
    if(name==='set-finance-portal-password'){
      if(!isAdmin()){ toast('Only the administrator can do this.'); return; }
      var newPortalPw = val('password')||'';
      if(newPortalPw.length<6){ toast('Use at least 6 characters.'); return; }
      firebase.functions().httpsCallable('setFinancePortalPassword')({ password: newPortalPw }).then(function(){
        toast('Finance portal password saved — share it only with whoever should have Finance access.');
        try{ form.reset(); }catch(e){}
      }).catch(function(err){ toast((err&&err.message)||'Could not save that password.'); });
      return;
    }
  }

  /* ============================= BOOTSTRAP ============================= */
  // Firebase project: kenokip-farm. The apiKey below isn't a secret — Firebase
  // web apps are meant to ship it client-side; access is actually controlled
  // by the Firestore security rules set on the project, which restrict reads
  // and writes to just this one shared document.
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyAEsReYhd4No6-_-TxmzLaTZef9J8cTFe4",
    authDomain: "kenokip-farm.firebaseapp.com",
    projectId: "kenokip-farm",
    storageBucket: "kenokip-farm.firebasestorage.app",
    messagingSenderId: "386891888391",
    appId: "1:386891888391:web:d038b1fde6e4f223ff37a2"
  };
  // Web Push certificate key from Firebase Console → Project Settings →
  // Cloud Messaging → Web Push certificates. Needed so the browser can ask
  // Google to deliver a push to this exact site — replace the placeholder
  // below with the real key (starts with a long random string) once you've
  // generated it there; see SETUP-PUSH.md. Until it's a real key, "Enable
  // background alerts" still turns on the notification permission and the
  // existing while-the-tab-is-open alerts, it just can't register for the
  // fully-closed-app kind yet.
  var VAPID_KEY = 'PASTE_YOUR_VAPID_KEY_HERE';
  var FARM_COLLECTION = 'farms';
  var FARM_DOC = 'kenokip';
  var FINANCE_COLLECTION = 'finance';
  var FINANCE_DOC = 'kenokip';

  var PRISTINE_HTML = document.documentElement.outerHTML;
  var state = loadState();
  // Which sub-page is showing within a section that's been split into
  // "Overview + a dropdown of dedicated pages" (Flock, Eggs, Money,
  // Health) — keyed by section, defaulting to 'overview'. In-memory only,
  // same as the rest of `ui` (a reload starting back on Overview is fine).
  var ui = { section: getSavedSection(), periods:{overview:'week', reports:'month'}, pages:{}, view:{} };
  function currentView(key){ return ui.view[key] || 'overview'; }
  function setView(key, v){ ui.view[key] = v; }
  // Where you've been, so the back arrow (see navControlsHTML) has
  // somewhere to go — a plain stack of previously-visited section keys,
  // most recent last. In-memory only (a reload starting fresh is normal
  // for a "back" history — browsers do the same). Capped so it can't grow
  // without bound over a long session.
  var navHistory = [];
  var NAV_HISTORY_MAX = 30;
  var syncStatus = 'idle';
  var readOnly = false;
  var localMode = false;
  var standaloneMode = false;
  var cloudMode = false;
  var db = null;
  var storage = null; // Firebase Storage — only used for profile photo uploads (see uploadProfilePhoto)
  var currentUser = null; // null (signed out) or { uid, email, role, jobTitle, name, totpEnrolled, portalTotpEnrolled }
  var guestMode = false;
  var offlineSessionActive = false; // true only when signed in from cached claims while offline — see onAuthStateChanged
  var financeRevealed = false; // masked by default — cleared back to false on every fresh page load
  var mpesaEnabled = false;
  // Kill-switch mirroring PAYOUTS_ENABLED in functions/index.js — keeps the UI
  // from opening the payout form / server from even being asked, while this
  // Till's B2C-via-API access with Safaricom is unresolved (see SETUP-B2C.md
  // and the M-Pesa Business team correspondence). Flip both flags back to
  // true together once B2C is confirmed working.
  var mpesaPayoutsEnabled = true;
  // Separate kill-switch for STK Push FROM the Paybill (a collection, not a
  // payout — money coming in, not going out — so it's lower-risk than
  // mpesaPayoutsEnabled above, but still needs MPESA_PAYOUT_PASSKEY set on
  // the backend before it'll actually work). Once that secret is set and
  // deployed, flip this to true to show the account picker in "Add via
  // M-Pesa" — see HOW-TO-APPLY-DUAL-ACCOUNT.md.
  var mpesaPaybillStkEnabled = true;
  var financeSyncStarted = false;
  var directorySyncStarted = false;
  var logsSyncStarted = false;
  var securityEventsSyncStarted = false;
  var mpesaQueriesSyncStarted = false;
  var mpesaQueries = []; // Account Balance / Transaction Status check results, newest first
  var messagesSyncStarted = false;
  var teamUsers = [];
  // Two-person receipt co-signing (see signAndPreviewReceipt) — the
  // administrator's live list of requests waiting on their signature, and
  // the two listeners kept open while a "pending" modal is on screen (one
  // on the request itself, one on the administrator's own account so an
  // "I'm away" toggle flip shows up in there instantly — see
  // showPendingSignoffModal). Both are torn down as soon as that modal
  // reaches a final state or the admin list is no longer needed.
  var pendingSignoffsAdminSyncStarted = false;
  var pendingSignoffsForAdmin = [];
  var pendingSignoffUnsubDoc = null;
  var pendingSignoffUnsubAdmin = null;
  var accessLogs = [];
  var accessLogPage = 0;
  var c2bLogSyncStarted = false;
  var c2bLog = []; // Till (C2B) webhook calls, newest first — see initC2BLogSync
  var securityEvents = [];
  var securityEventPage = 0;
  var messages = [];
  var messagesViewAll = false;
  var idleTimer = null;
  var SESSION_LIMIT_MS = 10*60*1000;
  var OTHER_ROLES_SESSION_LIMIT_MS = 15*60*1000; // also applies to guests now — see idleTimeoutApplies()
  var financePortalUnlocked = false; // in-memory only — re-locks on reload, and re-asks after 2 minutes idle
  var financePortalIdleTimer = null;
  // Finance Guard: the fingerprint/Face + personal PIN unlock option, and
  // the lockout it shares with the password + authenticator-code method.
  // null until the first refreshFinanceGuardStatus() call comes back.
  var financeGuardStatus = null;
  var financeGuardStatusLoading = false;
  var financeUnlockTab = 'password'; // 'password' | 'fingerprint' | 'quickpin' — which tab the gate shows
  // True once the administrator has explicitly picked a tab themselves —
  // until then, financePortalGateHTML defaults them into 'quickpin' instead
  // of 'password' whenever it's available, without permanently overriding
  // an explicit choice to go back to password + code.
  var financeUnlockTabTouched = false;
  // Digits typed so far into the administrator's quick-unlock PIN pad — kept
  // outside the render cycle and mutated directly by the keypad handlers
  // (not via render()) so each tap feels instant, with no flicker. Reset to
  // '' every time financeQuickPinGateHTML() builds fresh (unfilled) dots, so
  // it can never end up out of sync with what's on screen.
  var quickPinBuffer = '';
  var quickPinBusy = false;
  // Same idea as quickPinBuffer above, but for the administrator's "Show
  // amounts" PIN pad (financeRevealQuickPinHtml) — a separate buffer because
  // this one lives inside a modal rather than the full Finance-gate screen,
  // and can in principle be open at a different moment than the portal gate.
  var revealPinBuffer = '';
  var revealPinBusy = false;
  // Which reveal the PIN pad above (revealpin-dots) is currently for —
  // 'finance' (Finance amounts, administrator only within that flow) or
  // 'birthday' (other team members' dates of birth, administrator only).
  // Both share the exact same pad/buffer/keyboard-listener plumbing since
  // only one can ever be open at a time; only revealPinSubmit and
  // revealPinPressDigit branch on it, to know which PIN length and which
  // Cloud Function apply.
  var revealPinMode = 'finance';
  // Birthday privacy: myDob is this signed-in account's own date of birth
  // (fetched via getMyDob — never stored on users/{uid}, see
  // privateProfiles/{uid} in firestore.rules). birthdaysRevealed/
  // teamBirthdays are administrator-only and populated only after a
  // successful Birthday PIN check (getTeamBirthdays) — cleared back on
  // every fresh page load, same masking pattern as financeRevealed.
  var myDob = null;
  var myDobLoaded = false;
  var birthdaysRevealed = false;
  var teamBirthdays = null;
  var birthdayGuardStatus = null;
  var birthdayGuardStatusLoading = false;
  var artifactApi = null;
  var saveTimer = null;

  document.addEventListener('click', function(e){
    if(e.target.classList && e.target.classList.contains('modal-backdrop')){ closeModal(); return; }
    var el = e.target.closest('[data-action]');
    if(!el) return;
    e.preventDefault();
    handleAction(el.dataset.action);
  });
  // Lets a laptop/desktop keyboard drive either fullscreen PIN pad
  // directly — typing digits or tapping Backspace — instead of forcing a
  // mouse click on the on-screen keys. Whichever pad's dots element is
  // currently on screen (quickpin-dots for the Finance quick-unlock gate,
  // revealpin-dots for the "Show amounts" pad) is the one listening; both
  // can never be open at the same time. Ignored while typing into an
  // actual text field/textarea elsewhere on the page (e.g. the password +
  // code tab, or any open form) so this never steals normal typing.
  document.addEventListener('keydown', function(e){
    var typingInField = e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.isContentEditable);
    if(typingInField) return;
    var quickpinOpen = !!document.getElementById('quickpin-dots');
    var revealpinOpen = !document.getElementById('revealpin-dots') ? false : true;
    if(!quickpinOpen && !revealpinOpen) return;
    if(/^[0-9]$/.test(e.key)){
      e.preventDefault();
      if(quickpinOpen) quickPinPressDigit(e.key); else revealPinPressDigit(e.key);
    } else if(e.key==='Backspace'){
      e.preventDefault();
      if(quickpinOpen) quickPinBackspaceKey(); else revealPinBackspaceKey();
    }
  });
  document.addEventListener('submit', function(e){
    var form = e.target.closest ? e.target.closest('form[data-form]') : null;
    if(!form) return;
    e.preventDefault();
    handleForm(form.dataset.form, form);
  });
  document.addEventListener('change', function(e){
    var el = e.target.closest('[data-change]');
    if(!el) return;
    handleChange(el.dataset.change, el);
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  // Keeps the Overview greeting's "morning"/"afternoon"/etc. correct if the
  // app is just left open across that boundary, without needing a full
  // reload or touching the rest of the page.
  setInterval(function(){
    if(ui.section==='overview'){
      var el = document.getElementById('overview-greeting');
      if(el) el.outerHTML = overviewGreetingHTML();
    }
  }, 60000);

  render();
  renderGlobalSearchBar();
  kemAiRenderShell();
  initArtifact();
  checkVerifyLinkOnLoad();
})();

/* ---- app-update / service-worker refresh gate ---- */
  // "New version available" gate. sw.js is a cache-first service worker with
  // a versioned CACHE_NAME — every time this app gets redeployed with that
  // version bumped, browsers that already have the app open (or installed)
  // will, on their own, download the new sw.js, install it, and — because
  // sw.js calls self.skipWaiting()+clients.claim() — activate it and take
  // over the open page automatically. The one thing the browser can't do on
  // its own is make an already-loaded page re-fetch the new index.html, so
  // this listens for that hand-over and asks the person to refresh instead
  // of silently leaving them on stale HTML/JS talking to a newer backend.
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      var hadControllerAtLoad = !!navigator.serviceWorker.controller;
      var updateAvailable = false;
      var overlayShown = false;
      var gateObserver = null;

      function buildOverlay(){
        if(document.getElementById('app-update-backdrop')) return;
        var refreshIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 9 15 9"/></svg>';
        var el = document.createElement('div');
        el.id = 'app-update-backdrop';
        el.className = 'app-update-backdrop';
        el.hidden = true;
        el.innerHTML =
          '<div class="app-update-card" role="alertdialog" aria-live="assertive" aria-label="Update available">' +
            '<div class="app-update-head">' +
              '<div class="app-update-icon">' + refreshIcon + '</div>' +
              '<div class="app-update-head-text"><strong>Update available</strong><span>A newer version of Kenokip Farm is ready. Refresh to keep going.</span></div>' +
            '</div>' +
            '<button type="button" class="btn primary" id="app-update-refresh-btn">Refresh</button>' +
          '</div>';
        document.body.appendChild(el);
        document.getElementById('app-update-refresh-btn').addEventListener('click', function(){
          this.disabled = true;
          this.textContent = 'Refreshing…';
          location.reload();
        });
      }

      // Deliberately doesn't gate on currentUser/guestMode directly (this
      // script runs outside the app's own IIFE) — the auth-gate element's
      // own hidden state is already exactly that signal: it's unhidden
      // while signing in and hidden the moment someone is in, as guest or
      // signed in for real.
      function isPastSignIn(){
        var gate = document.getElementById('auth-gate');
        return !gate || gate.hidden === true;
      }

      function revealIfReady(){
        if(!updateAvailable || overlayShown || !isPastSignIn()) return;
        buildOverlay();
        document.getElementById('app-update-backdrop').hidden = false;
        document.body.style.overflow = 'hidden';
        overlayShown = true;
        if(gateObserver){ gateObserver.disconnect(); gateObserver = null; }
      }

      function watchForSignIn(){
        var gate = document.getElementById('auth-gate');
        if(!gate || gateObserver) return;
        gateObserver = new MutationObserver(revealIfReady);
        gateObserver.observe(gate, { attributes:true, attributeFilter:['hidden'] });
      }

      function onUpdateDetected(){
        if(updateAvailable) return;
        updateAvailable = true;
        watchForSignIn();
        revealIfReady();
      }

      // Bridge for the admin "Push update to everyone" button (Team page):
      // that button just bumps a Firestore doc, and the app's own realtime
      // listener on it (see meta/appUpdate in initArtifact, inside the main
      // app script) calls this exact same function — same overlay, same
      // "wait until past sign-in" gating, same one-way-out-is-Refresh
      // behavior, just triggered by an admin's click instead of a real
      // service-worker update. Guarded with a typeof check anywhere it's
      // called from, since very old browsers without serviceWorker support
      // never reach this script at all.
      window.__triggerAppUpdatePopup = onUpdateDetected;

      // Fires once the freshly-installed service worker actually takes over
      // this page. hadControllerAtLoad tells a real update (a worker was
      // already in charge, and now a different one is) apart from the very
      // first install on a brand-new visit (no worker yet, so this is just
      // this page's own first activation, not "a newer version exists").
      navigator.serviceWorker.addEventListener('controllerchange', function(){
        if(hadControllerAtLoad) onUpdateDetected();
        hadControllerAtLoad = true;
      });

      navigator.serviceWorker.register('sw.js').then(function(reg){
        // A phone left open for days shouldn't have to wait for the
        // browser's own (much lazier) background update schedule — nudge it
        // to check whenever the tab is looked at again or comes back online.
        document.addEventListener('visibilitychange', function(){
          if(document.visibilityState === 'visible') reg.update().catch(function(){});
        });
        window.addEventListener('online', function(){ reg.update().catch(function(){}); });
        setInterval(function(){ reg.update().catch(function(){}); }, 15 * 60 * 1000);
      }).catch(function(){ /* offline support is best-effort */ });
    });
  }
