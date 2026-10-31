/* RS Vietnam Trip — core app shell (Phase 1)
   Router, tab bar, More grid, SOS, Settings, update banner, storage helpers. */
'use strict';

const APP_VERSION = '2.8.0'; // keep in sync with CACHE_VERSION in service-worker.js

/* ---------- Storage helpers (localStorage, never crash) ---------- */
const Store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('rs.' + key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('rs.' + key, JSON.stringify(value)); return true; }
    catch (e) { toast('Could not save. Phone storage may be full.'); return false; }
  }
};

/* ---------- Small utilities ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const digits = s => String(s || '').replace(/\D/g, '');

/* F03: phone normaliser. Returns { ok, pretty } — pretty is '+91 98450 12345' style, '' if empty. */
const PHONE_FIELDS = ['c1Phone', 'c2Phone', 'hotelPhone', 'cruisePhone', 'fasttrackPhone', 'driverPhone', 'insurancePhone'];
function normPhone(raw) {
  const t = String(raw || '').trim();
  if (!t) return { ok: true, pretty: '' };
  let d = digits(t);
  if (!t.startsWith('+')) {
    d = d.replace(/^0+/, '');
    if (/^[6-9]\d{9}$/.test(d)) d = '91' + d;          // Indian mobile without country code
  }
  if (d.length < 11 || d.length > 15) return { ok: false, pretty: t };
  const pretty = d.startsWith('91') && d.length === 12 ? `+91 ${d.slice(2, 7)} ${d.slice(7)}`
    : d.startsWith('84') ? `+84 ${d.slice(2).replace(/(\d{2,3})(?=(\d{3})+$)/g, '$1 ')}` : '+' + d;
  return { ok: true, pretty };
}

/* ---------- Bundled data (loaded once at start; served offline by the service worker) ---------- */
const DATA = {};
async function loadJSON(name) {
  try { DATA[name] = await (await fetch(`data/${name}.json`)).json(); }
  catch (e) { DATA[name] = null; }
}

function toast(msg, ms = 2500) {
  document.querySelectorAll('.toast').forEach(el => el.remove()); // one message at a time
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- Settings defaults ---------- */
const DEFAULT_SETTINGS = {
  c1Name: '', c1Phone: '',
  c2Name: '', c2Phone: '',
  hotelPhone: '+84 97 413 51 07',   // Hanoi Chic Boutique Hotel (business number)
  cruisePhone: '', driverPhone: '+84 97 413 51 07', insurancePhone: '', medical: '',   // Ninh Binh car is arranged by the hotel → hotel number
  fasttrackPhone: '+84 96 246 0477',
  travellers: 'Mr Ravindra and Mrs Sudha',   // v2.8: shown in messages, help card and greeting   // Klook express-immigration operator hotline (business number)
  textSize: 'normal',
  theme: 'light',                 // v1.2: light always unless Dark chosen
  deepseekKey: ''
};
const getSettings = () => {
  const s = Object.assign({}, DEFAULT_SETTINGS, Store.get('settings', {}));
  if (!s.driverPhone) s.driverPhone = s.hotelPhone;          // v2.8: Ninh Binh car is arranged by the hotel
  if (!s.travellers) s.travellers = DEFAULT_SETTINGS.travellers;
  return s;
};
const saveSettings = s => Store.set('settings', s);

function applyTextSize(size) {
  document.documentElement.dataset.size = size === 'normal' ? '' : size;
}
function applyTheme(t) { document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light'; }

/* ---------- Screens ---------- */
// tab = which bottom tab is highlighted; back = show Back button (sub-screens)
const ROUTES = {
  today:     { title: 'Today',     tab: 'today', render: () => soon('☀', 'Clocks, Now / Next and progress', 2) },
  plan:      { title: 'Plan',      tab: 'plan',  render: () => soon('🗺', 'Day-wise place cards', 3) },
  money:     { title: 'Money',     tab: 'money', render: () => soon('₫', 'Currency converter and notes', 2) },
  food:      { title: 'Food',      tab: 'food',  render: () => soon('🍽', 'Veg restaurants and safe dishes', 5) },
  more:      { title: 'More',      tab: 'more',  render: renderMore },
  phrases:   { title: 'Phrases',   tab: 'more', back: 'more', render: () => soon('💬', 'Vietnamese phrases with sound', 5) },
  shopping:  { title: 'Shopping',  tab: 'more', back: 'more', render: () => soon('🛍', 'What to buy and where', 6) },
  docs:      { title: 'Docs',      tab: 'more', back: 'more', render: () => soon('📄', 'Passports, tickets, vouchers', 7) },
  prep:      { title: 'Prep',      tab: 'more', back: 'more', render: () => soon('✅', 'Packing lists and airport guide', 8) },
  emergency: { title: 'Emergency', tab: 'more', back: 'more', render: renderSOS },
  settings:  { title: 'Settings',  tab: 'more', back: 'more', render: renderSettings },
  about:     { title: 'About', tab: 'more', back: 'settings', render: renderAbout },
  sos:       { title: 'SOS',       tab: '',     back: 'today', render: renderSOS }
};

function soon(icon, what, phase) {
  return `<div class="card soon">
    <div class="ic" aria-hidden="true">${icon}</div>
    <h2>${esc(what)}</h2>
    <p class="muted">Coming soon (Phase ${phase}).</p>
  </div>`;
}

function renderMore() {
  const tiles = [
    ['phrases', '💬', 'Phrases'], ['shopping', '🛍', 'Shopping'],
    ['explore', '🧭', 'More places'], ['sim', '📶', 'SIM & internet'],
    ['transport', '🚕', 'Taxi & Grab'],
    ['docs', '📄', 'Docs'],       ['prep', '✅', 'Prep'],
    ['emergency', '🚨', 'Emergency'], ['settings', '⚙', 'Settings']
  ];
  return `<div class="grid">${tiles.map(([id, ic, label]) =>
    `<a class="tile${id === 'emergency' ? ' danger' : ''}" href="#${id}">
       <span class="ic" aria-hidden="true">${ic}</span><span>${label}</span></a>`).join('')}</div>`;
}

/* ---------- About & credits ---------- */
function renderAbout() {
  return `<section class="card accent"><h2>RS Vietnam Trip</h2>
      <p>Version ${APP_VERSION}. Made with love for your Vietnam trip, 23–30 Nov 2026.</p>
      <p class="kn">ನಿಮ್ಮ ವಿಯೆಟ್ನಾಂ ಪ್ರವಾಸಕ್ಕಾಗಿ ಪ್ರೀತಿಯಿಂದ ಮಾಡಿದ ಆ್ಯಪ್.</p></section>
    <section class="card"><h3>🔒 Privacy</h3>
      <p>No account, no tracking. Your documents, ticks and contacts stay only on this phone.</p>
      <p class="kn">ಯಾವುದೇ ಖಾತೆ ಇಲ್ಲ. ನಿಮ್ಮ ದಾಖಲೆಗಳು ಈ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಇರುತ್ತವೆ.</p>
      <p class="muted small">Internet is used only for exchange rates, the 🎤 helper (DeepSeek + the phone's voice typing) and Google Maps.
        The helper sends your question, the trip plan, saved numbers and document names/notes to DeepSeek. Passport and Visa are never sent.</p></section>
    <section class="card"><h3>📚 Information sources</h3>
      <ul>
        <li>Embassy of India, Hanoi (indembassyhanoi.gov.in)</li>
        <li>Exchange rates: open.er-api.com</li>
        <li>Restaurants, shopping prices, hospitals: travel guides checked Oct 2026</li>
        <li>History in stories: widely documented facts; Bai Dinh: VietNamNet, north-vietnam.com; Bodhi tree: QĐND</li>
      </ul>
      <p class="muted small">Prices and hours are approximate (Oct 2026). Please check locally.</p></section>
    <section class="card"><h3>🔤 Fonts & icons</h3>
      <p>Noto Sans and Noto Sans Kannada by Google — SIL Open Font License 1.1. Icons are the phone's own emoji.</p></section>
    <section class="card"><h3>🗣 Language note</h3>
      <p>Kannada text should be checked by a native speaker. Vietnamese pronunciation guides are simplified.</p></section>`;
}

/* ---------- SOS: WhatsApp / Call / SMS per contact (F04, F24) ---------- */
function renderSOS() {
  const s = getSettings();
  const contacts = [[s.c1Name || 'Family 1', s.c1Phone], [s.c2Name || 'Family 2', s.c2Phone]];
  const blocks = contacts.map(([name, phone], i) => digits(phone)
    ? `<div class="sos-contact"><p class="sos-name">${esc(name)}</p>
        <button class="btn" data-sos="${i}" data-via="wa">📍 WhatsApp my location</button>
        <a class="btn green" href="tel:+${digits(phone)}">📞 Call ${esc(name)}</a>
        <button class="btn secondary" data-sos="${i}" data-via="sms">✉️ SMS my location</button></div>`
    : `<a class="btn secondary" href="#settings">Add ${esc(name)} in Settings</a>`).join('');
  return renderFamilySOS(blocks) + `
    <div class="card">
      <h2>Call for help (Vietnam)</h2>
      <a class="btn" href="tel:113">🚓 Police — 113</a>
      <a class="btn" href="tel:115">🚑 Ambulance — 115</a>
      <a class="btn" href="tel:114">🚒 Fire — 114</a>
    </div>`;
}

function renderFamilySOS(blocks) {
  if (blocks === undefined) {          // called on its own (Emergency screen)
    const tmp = document.createElement('div'); tmp.innerHTML = renderSOS();
    return tmp.querySelector('.card.accent').outerHTML;
  }
  return `<div class="card accent">
      <h2>Tell family where you are</h2>
      <p class="kn">ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ಮನೆಯವರಿಗೆ ತಿಳಿಸಿ</p>
      <div id="sos-status" aria-live="polite"></div>
      ${blocks}
    </div>`;
}

let sosPending = null;
function sendLocation(index, via) {
  const s = getSettings();
  const phone = digits(index === 0 ? s.c1Phone : s.c2Phone);
  const status = document.getElementById('sos-status');
  const urlFor = text => via === 'sms'
    ? `sms:+${phone}?body=${encodeURIComponent(text)}`
    : `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const open = text => {
    sosPending = null;
    if (status) status.innerHTML = '';
    const url = urlFor(text);
    if (via === 'sms') { location.href = url; return; }
    const w = window.open(url, '_blank');
    if (!w) location.href = url;
  };
  const noLoc = 'I need help. Please call me. (Location not available)';
  if (!('geolocation' in navigator)) return open(noLoc);
  const token = sosPending = {};
  if (status) status.innerHTML = `<p class="muted">Finding your location… <span class="kn">ನಿಮ್ಮ ಸ್ಥಳ ಹುಡುಕುತ್ತಿದೆ…</span></p>`;
  setTimeout(() => {
    if (sosPending !== token || !status) return;
    status.innerHTML += `<button type="button" class="btn" data-sendnow="${index}" data-via="${via}">${via === 'sms' ? 'Send SMS now' : 'Open WhatsApp now'} (without location)</button>`;
  }, 3000);
  navigator.geolocation.getCurrentPosition(
    pos => {
      if (sosPending !== token) return;
      const { latitude: lat, longitude: lng } = pos.coords;
      open(`I need help. My location: https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`);
    },
    () => { if (sosPending === token) open(noLoc); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}

/* ---------- Settings ---------- */
function renderSettings() {
  const s = getSettings();
  const field = (id, label, type = 'tel', ph = '') =>
    `<label for="${id}">${label}</label>
     <input id="${id}" type="${type}" value="${esc(s[id])}" placeholder="${esc(ph)}" autocomplete="off">`;
  const sizeBtn = (v, l) => `<button type="button" data-size="${v}" aria-pressed="${s.textSize === v}">${l}</button>`;
  const last = Store.get('lastBackup', 0);

  return `<details class="card fold" open>
      <summary>📞 Contacts and health notes</summary>
      <form id="contacts-form">
        <p class="muted small">Indian mobiles: 10 digits is fine (+91 is added). Others: with country code.</p>
        ${field('travellers', 'Travellers (names used in messages)', 'text', 'Mr Ravindra and Mrs Sudha')}
        ${field('c1Name', 'Family 1 — name', 'text', 'e.g. Son')}
        ${field('c1Phone', 'Family 1 — phone', 'tel', '+91 9XXXX XXXXX')}
        ${field('c2Name', 'Family 2 — name', 'text', 'e.g. Daughter')}
        ${field('c2Phone', 'Family 2 — phone', 'tel', '+91 9XXXX XXXXX')}
        ${field('hotelPhone', 'Hotel phone')}
        ${field('cruisePhone', 'Cruise phone', 'tel', 'Not set')}
        ${field('fasttrackPhone', 'Express immigration (Klook) WhatsApp')}
        ${field('driverPhone', 'Ninh Binh car (arranged by the hotel)', 'tel', 'Hotel number')}
        ${field('insurancePhone', 'Insurance helpline', 'tel', 'Not set')}
        ${field('medical', 'Medicines / health notes (shown on help card)', 'text', 'e.g. BP tablets daily')}
        <button class="btn" type="submit">Save contacts</button>
      </form>
    </details>

    <details class="card fold">
      <summary>🔠 Text size</summary>
      <div class="seg">${sizeBtn('normal', 'A')}${sizeBtn('large', 'A+')}${sizeBtn('xlarge', 'A++')}</div>
    </details>

    <details class="card fold">
      <summary>🎨 Colours</summary>
      <div class="seg"><button type="button" data-theme="light" aria-pressed="${s.theme !== 'dark'}">☀ Light</button><button type="button" data-theme="dark" aria-pressed="${s.theme === 'dark'}">🌙 Dark</button></div>
    </details>

    <details class="card fold">
      <summary>💾 Backup</summary>
      <p>Save documents, ticks and contacts in one file.</p>
      <p class="muted small">Last backup: ${last ? new Date(last).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'never'}</p>
      <button type="button" class="btn green" data-backup>💾 Backup now</button>
      <button type="button" class="btn secondary" data-restore>♻️ Restore from backup</button>
    </details>

    <details class="card fold">
      <summary>🤖 DeepSeek helper</summary>
      <p class="muted small">Powers the 🎤 Ask helper. Key stays on this phone only and is never put in backups.
        Questions are sent to DeepSeek with the trip plan, saved numbers and document names/notes — never Passport or Visa.</p>
      <p>Status: <strong id="ds-status">${s.deepseekKey ? 'Saved ✓' : 'Not set'}</strong></p>
      <label for="ds-key">API key</label>
      <input id="ds-key" type="password" placeholder="Paste key here" autocomplete="off">
      <button class="btn" id="ds-save" type="button">Save key</button>
      <button class="btn secondary" id="ds-test" type="button" ${s.deepseekKey ? '' : 'disabled'}>Test key</button>
      ${s.deepseekKey ? '<button class="btn secondary" id="ds-clear" type="button">Remove key</button>' : ''}
    </details>

    <details class="card fold">
      <summary>ℹ️ App</summary>
      <p>Version <strong>${APP_VERSION}</strong></p>
      <button class="btn secondary" id="check-update" type="button">Check for update</button>
      <a class="btn secondary" href="#about">ℹ️ About & credits</a>
    </details>`;
}

async function testDeepSeek(key) {
  if (!navigator.onLine) return 'No internet. Try later.';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 5,
        messages: [{ role: 'user', content: 'Say OK' }] })
    });
    if (r.ok) return 'Works ✓';
    if (r.status === 401) return 'Key not accepted. Check and paste again.';
    if (r.status === 402) return 'Account has no balance.';
    return 'Error ' + r.status + '. Try later.';
  } catch (e) {
    return e.name === 'AbortError' ? 'Too slow. Try later.' : 'Blocked by browser (CORS) or no internet.';
  } finally { clearTimeout(timer); }
}

/* ---------- One click handler for the whole app ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.dataset.sos) return sendLocation(Number(t.dataset.sos), t.dataset.via || 'wa');
  if (t.dataset.sendnow) {
    sosPending = null;
    const s = getSettings(), phone = digits(t.dataset.sendnow === '0' ? s.c1Phone : s.c2Phone);
    const text = encodeURIComponent('I need help. Please call me.');
    if (t.dataset.via === 'sms') { location.href = `sms:+${phone}?body=${text}`; return; }
    const url = `https://wa.me/${phone}?text=${text}`;
    if (!window.open(url, '_blank')) location.href = url;
    return;
  }
  // Backup/Restore buttons on Settings (the Docs screen handles its own)
  if (currentRoute() === 'settings' && t.dataset.backup !== undefined) return doBackup();
  if (currentRoute() === 'settings' && t.dataset.restore !== undefined) return doRestore();

  if (t.dataset.size) {
    const s = getSettings(); s.textSize = t.dataset.size; saveSettings(s);
    applyTextSize(s.textSize);
    document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }

  if (t.dataset.theme) {
    const s = getSettings(); s.theme = t.dataset.theme; saveSettings(s);
    applyTheme(s.theme);
    document.querySelectorAll('button[data-theme]').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }

  switch (t.id) {
    case 'back-btn': {
      // F16: go back in history only if the previous screen IS the parent; otherwise replace (never loops)
      const b = ROUTES[currentRoute()]?.back;
      const target = '#' + ((typeof b === 'function' ? b() : b) || 'today');
      if (prevHash === target) history.back(); else location.replace(target);
      break;
    }
    case 'ds-save': {
      const key = $('#ds-key').value.trim();
      if (!key) return toast('Paste the key first.');
      const s = getSettings(); s.deepseekKey = key; saveSettings(s);
      toast('Key saved ✓'); render(); break;
    }
    case 'ds-test': {
      t.disabled = true; t.textContent = 'Testing…';
      toast(await testDeepSeek(getSettings().deepseekKey), 4000);
      t.disabled = false; t.textContent = 'Test key'; break;
    }
    case 'ds-clear': {
      if (!confirm('Remove the DeepSeek key from this phone?')) return;
      const s = getSettings(); s.deepseekKey = ''; saveSettings(s); render(); break;
    }
    case 'check-update': checkForUpdate(true); break;
    case 'update-banner': applyUpdate(); break;
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'contacts-form') return;
  e.preventDefault();
  const s = getSettings();
  const LABEL = { c1Phone: 'Family 1', c2Phone: 'Family 2', hotelPhone: 'Hotel', cruisePhone: 'Cruise', fasttrackPhone: 'Express immigration', driverPhone: 'Driver', insurancePhone: 'Insurance' };
  for (const id of PHONE_FIELDS) {
    const r = normPhone($('#' + id).value);
    if (!r.ok) {
      $('#' + id).focus();
      return toast(`${LABEL[id]} number looks wrong. Check it. / ${LABEL[id]} ನಂಬರ್ ತಪ್ಪಾಗಿದೆ, ಪರಿಶೀಲಿಸಿ.`, 5000);
    }
    s[id] = r.pretty;
  }
  ['travellers', 'c1Name', 'c2Name', 'medical'].forEach(id => { s[id] = $('#' + id).value.trim(); });
  saveSettings(s);
  PHONE_FIELDS.forEach(id => { $('#' + id).value = s[id]; });       // show the formatted numbers back
  toast(`✓ Saved${s.c1Phone ? ': ' + s.c1Phone : ''} / ಉಳಿಸಲಾಗಿದೆ`, 3500);
});

/* ---------- Router ---------- */
// Hash format: #name or #name:param (e.g. #plan:d4-temple)
const currentRoute = () => {
  const r = location.hash.slice(1).split(':')[0];
  return ROUTES[r] ? r : 'today';
};
const routeParam = () => location.hash.slice(1).split(':')[1] || '';

let leaveScreen = null; // cleanup for the current screen (e.g. stop clock timer)
let prevHash = '', curHash = location.hash || '#today';

function render() {
  if (leaveScreen) { leaveScreen(); leaveScreen = null; }
  if ((location.hash || '#today') !== curHash) { prevHash = curHash; curHash = location.hash || '#today'; }
  const name = currentRoute();
  const route = ROUTES[name];
  $('#screen-title').textContent = route.title;
  $('#back-btn').hidden = !(typeof route.back === 'function' ? route.back() : route.back);
  $('#mic-btn').hidden = $('#chat-btn').hidden = ['chat', 'translate'].includes(name);
  document.querySelector('.sos-top').hidden = name === 'sos';   // v2.0: SOS always in the top bar
  document.querySelectorAll('.tabbar a').forEach(a =>
    a.classList.toggle('active', a.dataset.tab === route.tab));
  const main = $('#screen');
  main.innerHTML = route.render();
  window.scrollTo(0, 0);
  if (route.after) leaveScreen = route.after() || null; // after() may return a cleanup fn
}
window.addEventListener('hashchange', render);

/* ---------- Service worker + update banner ---------- */
let waitingWorker = null;

function showUpdateBanner(worker) {
  waitingWorker = worker;
  $('#update-banner').hidden = false;
}
let updateRequested = false;
function applyUpdate() {
  updateRequested = true;
  if (waitingWorker) waitingWorker.postMessage('skipWaiting');
}
async function checkForUpdate(manual) {
  if (!('serviceWorker' in navigator)) return manual && toast('Updates not supported here.');
  if (!navigator.onLine) return manual && toast('No internet. Try later.');
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  await reg.update();
  if (manual && !reg.waiting && !reg.installing) toast('You have the latest version ✓');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js');
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(nw);
        });
      });
    } catch (e) { /* offline first load or file:// — app still works */ }
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !updateRequested) return;   // F28: no reload on first install
    reloading = true; location.reload();
  });
}

/* ---------- First run ---------- */
// Runs after all screen scripts (today.js, money.js…) have registered their routes
document.addEventListener('DOMContentLoaded', async () => {
  applyTextSize(getSettings().textSize);
  applyTheme(getSettings().theme);
  await Promise.all(['trip', 'places', 'restaurants', 'dishes', 'phrases', 'shopping', 'prep', 'emergency', 'explore'].map(loadJSON));
  render();
  // F23: ask for protected storage; remember the answer and retry on later opens until granted
  if (navigator.storage?.persist && !Store.get('persisted', false)) {
    try {
      const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      Store.set('persisted', already || await navigator.storage.persist());
    } catch (e) { Store.set('persisted', false); }
  }
});
