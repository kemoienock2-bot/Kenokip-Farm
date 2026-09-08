// Turns a User-Agent header into a short, friendly "Windows · Chrome"-style
// label. Shared by access logging (roles.js) and the Finance security-alert
// log (financeGuard.js) so a sign-in and a failed Finance attempt describe
// devices the same way.
function describeDevice(ua) {
  if (!ua) return 'Unknown device';
  let os = 'Unknown OS';
  if (/iPhone/.test(ua)) os = 'iPhone';
  else if (/iPad/.test(ua)) os = 'iPad';
  else if (/Android/.test(ua)) {
    const m = ua.match(/Android [\d.]+; ([^;)]+)/);
    os = m ? m[1].trim() : 'Android';
  } else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'Mac';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = 'Opera';
  else if (/CriOS\//.test(ua)) browser = 'Chrome';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  return os + ' · ' + browser;
}

module.exports = { describeDevice };
