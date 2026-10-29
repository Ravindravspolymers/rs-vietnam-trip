/* RS Vietnam Trip — Weather + air quality (v2.4)
   Open-Meteo (free, no key): 16-day forecast + 5-day air quality, for the place of each trip day.
   Saved on the phone; refreshed when online and older than 3 hours. Beyond 16 days → typical late-November weather. */
'use strict';

const WX_LOC = {
  han: { en: 'Hanoi', lat: 21.034, lng: 105.847, usual: { hi: 24, lo: 17, code: 2, pop: 20, sunset: '17:15' } },
  halong: { en: 'Ha Long Bay', lat: 20.91, lng: 107.07, usual: { hi: 23, lo: 17, code: 2, pop: 20, sunset: '17:10' } },
  ninhbinh: { en: 'Ninh Binh', lat: 20.25, lng: 105.97, usual: { hi: 24, lo: 17, code: 2, pop: 20, sunset: '17:15' } },
  blr: { en: 'Bengaluru', lat: 12.97, lng: 77.59, usual: { hi: 27, lo: 18, code: 2, pop: 25, sunset: '17:50' } }
};
const WX_DAY_LOC = { 0: 'blr', 1: 'han', 2: 'halong', 3: 'halong', 4: 'han', 5: 'ninhbinh', 6: 'han' };
const WX_MAX_AGE = 3 * 3600 * 1000;

function wxIcon(code) {
  if (code == null) return ['⛅', 'Partly cloudy'];
  if (code === 0) return ['☀️', 'Clear'];
  if (code <= 2) return ['🌤', 'Mostly sunny'];
  if (code === 3) return ['☁️', 'Cloudy'];
  if (code <= 48) return ['🌫', 'Foggy'];
  if (code <= 57) return ['🌦', 'Drizzle'];
  if (code <= 67 || (code >= 80 && code <= 82)) return ['🌧', 'Rain'];
  if (code >= 95) return ['⛈', 'Thunderstorm'];
  return ['☁️', 'Cloudy'];
}
const aqiLabel = a => a == null ? null : a <= 50 ? ['🟢', 'Good', 'ಉತ್ತಮ'] : a <= 100 ? ['🟡', 'Moderate', 'ಸಾಧಾರಣ']
  : a <= 150 ? ['🟠', 'Poor', 'ಕಳಪೆ'] : ['🔴', 'Unhealthy', 'ಅನಾರೋಗ್ಯಕರ'];
const hh = h => { const n = h % 12 || 12; return `${n}${h < 12 ? ' am' : ' pm'}`; };

/* ---------- Data ---------- */
// Returns { hi, lo, code, pop, sunset, rain:[startHour,endHour]|null, aqi, live:true/false, place }
function wxFor(day) {
  const key = WX_DAY_LOC[day.day] || 'han', L = WX_LOC[key];
  const live = Store.get('wx', null)?.locs?.[key]?.[day.date];
  return live ? { ...live, live: true, place: L.en } : { ...L.usual, rain: null, aqi: null, live: false, place: L.en };
}
const wxAge = () => { const f = Store.get('wx', null)?.fetched; return f ? Date.now() - f : Infinity; };

async function wxFetch(force) {
  if (!navigator.onLine || (!force && wxAge() < WX_MAX_AGE)) return false;
  const keys = Object.keys(WX_LOC), lat = keys.map(k => WX_LOC[k].lat).join(','), lng = keys.map(k => WX_LOC[k].lng).join(',');
  try {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 12000);
    const [fr, ar] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&hourly=precipitation_probability&timezone=auto&forecast_days=16`, { signal: ctrl.signal }),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=us_aqi&timezone=auto&forecast_days=5`, { signal: ctrl.signal }).catch(() => null)
    ]);
    clearTimeout(t);
    if (!fr.ok) return false;
    let F = await fr.json(); if (!Array.isArray(F)) F = [F];
    let A = ar && ar.ok ? await ar.json() : []; if (!Array.isArray(A)) A = [A];
    const locs = {};
    keys.forEach((k, i) => {
      const f = F[i], a = A[i], out = {};
      if (!f?.daily) return;
      f.daily.time.forEach((date, j) => {
        const hours = (f.hourly?.time || []).map((ts, n) => [ts, f.hourly.precipitation_probability[n]])
          .filter(([ts, p]) => ts.startsWith(date) && p != null && p >= 50).map(([ts]) => Number(ts.slice(11, 13))).filter(h => h >= 6 && h <= 22);
        const aq = (a?.hourly?.time || []).map((ts, n) => [ts, a.hourly.us_aqi[n]])
          .filter(([ts, v]) => ts.startsWith(date) && v != null && Number(ts.slice(11, 13)) >= 7 && Number(ts.slice(11, 13)) <= 21).map(([, v]) => v);
        out[date] = { hi: Math.round(f.daily.temperature_2m_max[j]), lo: Math.round(f.daily.temperature_2m_min[j]), code: f.daily.weather_code[j],
          pop: f.daily.precipitation_probability_max[j], sunset: (f.daily.sunset[j] || '').slice(11, 16),
          rain: hours.length ? [Math.min(...hours), Math.max(...hours) + 1] : null, aqi: aq.length ? Math.max(...aq) : null };
      });
      locs[k] = out;
    });
    Store.set('wx', { fetched: Date.now(), locs });
    wxPaint();
    return true;
  } catch (e) { return false; }
}

/* ---------- Pieces of UI ---------- */
const wxChip = day => { const w = wxFor(day); return `${wxIcon(w.code)[0]} ${w.hi}°`; };
function wxLine(day) {
  const w = wxFor(day), [ic, label] = wxIcon(w.code), q = aqiLabel(w.aqi);
  const sunset = w.sunset ? (() => { const [h, m] = w.sunset.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} pm`; })() : '';
  const tips = [];
  if ((w.pop || 0) >= 50) tips.push('☂️ Umbrella <span class="kn">ಛತ್ರಿ</span>');
  if (w.lo < 18) tips.push('🧥 Light jacket <span class="kn">ಜಾಕೆಟ್</span>');
  if (day.day === 2 || day.day === 3) tips.push('🧣 Shawl on deck <span class="kn">ಶಾಲು</span>');
  if (w.aqi != null && w.aqi > 100) tips.push('😷 Mask outdoors <span class="kn">ಮಾಸ್ಕ್</span>');
  return `<span class="wxmain">${ic} <strong>${w.hi}° / ${w.lo}°</strong> · ${label} · ${esc(w.place)}</span>
    ${w.rain ? `<span>🌧 Rain likely ${hh(w.rain[0])}–${hh(w.rain[1])}${w.pop ? ` (${w.pop}%)` : ''} <span class="kn">ಮಳೆ ಸಾಧ್ಯತೆ</span></span>`
      : (w.pop || 0) >= 50 ? `<span>🌧 Rain likely (${w.pop}%) <span class="kn">ಮಳೆ ಸಾಧ್ಯತೆ</span></span>` : ''}
    ${q ? `<span>${q[0]} Air: ${q[1]} (AQI ${w.aqi}) <span class="kn">ಗಾಳಿ: ${q[2]}</span></span>` : ''}
    ${sunset ? `<span>🌅 Sunset ${sunset}</span>` : ''}
    ${tips.length ? `<span class="wxtips">${tips.join(' · ')}</span>` : ''}
    <span class="wxsrc">${w.live ? `Forecast · updated ${wxUpdated()}` : 'Usual weather for late November — live forecast appears about 2 weeks before'}</span>`;
}
function wxUpdated() {
  const a = wxAge();
  if (a === Infinity) return 'never';
  const m = Math.round(a / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

// After a fetch: refresh weather spots on screen without re-drawing the page
function wxPaint() {
  const days = DATA.trip?.days || [];
  document.querySelectorAll('[data-wxchip]').forEach(el => { const d = days.find(x => x.day === +el.dataset.wxchip); if (d) el.textContent = wxChip(d); });
  document.querySelectorAll('[data-wxline]').forEach(el => { const d = days.find(x => x.day === +el.dataset.wxline); if (d) el.innerHTML = wxLine(d); });
}

// For the 💬 helper
function wxForHelper() {
  return (DATA.trip?.days || []).map(d => {
    const w = wxFor(d), q = aqiLabel(w.aqi);
    return `${dayLabel(d)} ${w.place}: ${w.hi}°/${w.lo}°C, ${wxIcon(w.code)[1]}${w.pop != null ? `, rain chance ${w.pop}%` : ''}${w.rain ? ` (likely ${hh(w.rain[0])}–${hh(w.rain[1])})` : ''}${q ? `, air ${q[1]} (AQI ${w.aqi})` : ''}${w.live ? '' : ' (typical, not a forecast yet)'}.`;
  }).join('\n');
}

window.addEventListener('online', () => wxFetch());
document.addEventListener('DOMContentLoaded', () => setTimeout(() => wxFetch(), 1500));
