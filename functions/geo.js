// Best-effort "roughly where did this request come from" — used only for
// the Finance security-alert log (financeGuard.js), never for anything that
// gates access. Two honest limits worth knowing:
//   1. This is IP-based, not GPS-based. It's normally accurate to a city,
//      sometimes only to a country — nowhere near "their exact address".
//   2. Anyone using a VPN, a proxy, or mobile data can show up somewhere
//      they aren't. It's a genuinely useful clue, not proof of a location.
// Both of those are stated plainly in the app itself wherever this data is
// shown, rather than oversold.
const fetch = require('node-fetch');
const logger = require('firebase-functions/logger');

function clientIp(req) {
  if (!req) return null;
  var fwd = req.headers && req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return (req.ip || (req.connection && req.connection.remoteAddress) || null);
}

function fetchWithTimeout(url, ms) {
  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;
  return fetch(url, { signal: ctrl ? ctrl.signal : undefined }).finally(function () {
    if (timer) clearTimeout(timer);
  });
}

// Skips private/loopback addresses (local testing, the Functions emulator)
// rather than sending them to a public API, which would just return an
// error anyway.
function isPublicIp(ip) {
  if (!ip) return false;
  if (ip === '::1' || ip === '127.0.0.1') return false;
  if (/^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return false;
  return true;
}

async function lookupIpGeo(ip) {
  if (!isPublicIp(ip)) return null;
  try {
    const res = await fetchWithTimeout('https://ipapi.co/' + encodeURIComponent(ip) + '/json/', 4000);
    if (!res.ok) return null;
    const data = await res.json().catch(function () { return null; });
    if (!data || data.error) return null;
    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      lat: typeof data.latitude === 'number' ? data.latitude : null,
      lon: typeof data.longitude === 'number' ? data.longitude : null,
      isp: data.org || null,
    };
  } catch (e) {
    logger.warn('IP geolocation lookup failed (non-fatal)', e && e.message);
    return null;
  }
}

module.exports = { clientIp, lookupIpGeo };
