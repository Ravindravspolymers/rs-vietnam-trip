/* RS Vietnam Trip — core app shell (Phase 1)
   Router, tab bar, More grid, SOS, Settings, update banner, storage helpers. */
'use strict';

const APP_VERSION = '1.0.0'; // keep in sync with CACHE_VERSION in service-worker.js

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
  cruisePhone: '', insurancePhone: '', medical: '',
  textSize: 'normal',
  deepseekKey: ''
};
const getSettings = () => Object.assign({}, DEFAULT_SETTINGS, Store.get('settings', {}));
const saveSettings = s => Store.set('settings', s);

function applyTextSize(size) {
  document.documentElement.dataset.size = size === 'normal' ? '' : size;
}

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
      <p class="muted small">Internet is used only for exchange rates, the DeepSeek helper and Google Maps.</p></section>
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

/* ---------- SOS (basic, working now; full Emergency screen in Phase 8) ---------- */
function renderSOS() {
  const s = getSettings();
  const contacts = [[s.c1Name || 'Contact 1', s.c1Phone], [s.c2Name || 'Contact 2', s.c2Phone]];
  const waBtns = contacts.map(([name, phone], i) => digits(phone)
    ? `<button class="btn" data-sos="${i}">📍 Send my location to ${esc(name)}</button>`
    : `<a class="btn secondary" href="#settings">Add ${esc(name)} in Settings</a>`).join('');

  return `<div class="card accent">
      <h2>Send location on WhatsApp</h2>
      <p class="kn">ನಿಮ್ಮ ಸ್ಥಳವನ್ನು WhatsApp ಮೂಲಕ ಕಳುಹಿಸಿ</p>
      ${waBtns}
    </div>
    <div class="card">
      <h2>Call for help (Vietnam)</h2>
      <a class="btn" href="tel:113">🚓 Police — 113</a>
      <a class="btn" href="tel:115">🚑 Ambulance — 115</a>
      <a class="btn" href="tel:114">🚒 Fire — 114</a>
      ${digits(s.hotelPhone) ? `<a class="btn green" href="tel:+${digits(s.hotelPhone)}">🏨 Call hotel</a>` : ''}
    </div>`;
}

function sendLocation(index) {
  const s = getSettings();
  const phone = digits(index === 0 ? s.c1Phone : s.c2Phone);
  const open = text => { location.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; };
  if (!('geolocation' in navigator)) { open('I need help. Please call me.'); return; }
  toast('Finding your location…', 6000);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      open(`I need help. My location: https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`);
    },
    () => open('I need help. Please call me. (Location not available)'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/* ---------- Settings ---------- */
function renderSettings() {
  const s = getSettings();
  const field = (id, label, type = 'tel', ph = '') =>
    `<label for="${id}">${label}</label>
     <input id="${id}" type="${type}" value="${esc(s[id])}" placeholder="${esc(ph)}" autocomplete="off">`;
  const sizeBtn = (v, l) => `<button type="button" data-size="${v}" aria-pressed="${s.textSize === v}">${l}</button>`;

  return `<div class="card">
      <h2>Text size</h2>
      <div class="seg">${sizeBtn('normal', 'A')}${sizeBtn('large', 'A+')}${sizeBtn('xlarge', 'A++')}</div>
    </div>

    <form class="card" id="contacts-form">
      <h2>Contacts</h2>
      <p class="muted small">Type numbers with country code. Example: +91 98450 12345</p>
      ${field('c1Name', 'Contact 1 — name', 'text', 'e.g. Abhi')}
      ${field('c1Phone', 'Contact 1 — phone', 'tel', '+91 …')}
      ${field('c2Name', 'Contact 2 — name', 'text', 'e.g. Sanjana')}
      ${field('c2Phone', 'Contact 2 — phone', 'tel', '+91 …')}
      ${field('hotelPhone', 'Hotel phone')}
      ${field('cruisePhone', 'Cruise phone', 'tel', 'Not set')}
      ${field('insurancePhone', 'Insurance helpline', 'tel', 'Not set')}
      ${field('medical', 'Medicines / health notes (shown on help card)', 'text', 'e.g. BP tablets, diabetic')}
      <button class="btn" type="submit">Save contacts</button>
    </form>

    <div class="card">
      <h2>DeepSeek helper</h2>
      <p class="muted small">Optional. Key stays on this phone only.</p>
      <p>Status: <strong id="ds-status">${s.deepseekKey ? 'Saved ✓' : 'Not set'}</strong></p>
      <label for="ds-key">API key</label>
      <input id="ds-key" type="password" placeholder="Paste key here" autocomplete="off">
      <button class="btn" id="ds-save" type="button">Save key</button>
      <button class="btn secondary" id="ds-test" type="button" ${s.deepseekKey ? '' : 'disabled'}>Test key</button>
      ${s.deepseekKey ? '<button class="btn secondary" id="ds-clear" type="button">Remove key</button>' : ''}
    </div>

    <div class="card">
      <h2>Backup</h2>
      <p>Save documents, ticks and contacts in one file.</p>
      <p class="muted small">Last backup: ${Store.get('lastBackup', 0) ? new Date(Store.get('lastBackup', 0)).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'never'}</p>
      <button type="button" class="btn green" data-backup>💾 Backup now</button>
      <button type="button" class="btn secondary" data-restore>♻️ Restore from backup</button>
    </div>

    <div class="card">
      <h2>App</h2>
      <p>Version <strong>${APP_VERSION}</strong></p>
      <button class="btn secondary" id="check-update" type="button">Check for update</button>
      <a class="btn secondary" href="#about">ℹ️ About & credits</a>
    </div>`;
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

  if (t.dataset.sos) return sendLocation(Number(t.dataset.sos));
  // Backup/Restore buttons on Settings (the Docs screen handles its own)
  if (currentRoute() === 'settings' && t.dataset.backup !== undefined) return doBackup();
  if (currentRoute() === 'settings' && t.dataset.restore !== undefined) return doRestore();

  if (t.dataset.size) {
    const s = getSettings(); s.textSize = t.dataset.size; saveSettings(s);
    applyTextSize(s.textSize);
    document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }

  switch (t.id) {
    case 'back-btn': {
      const b = ROUTES[currentRoute()]?.back;
      location.hash = '#' + ((typeof b === 'function' ? b() : b) || 'today'); break;
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
  ['c1Name','c1Phone','c2Name','c2Phone','hotelPhone','cruisePhone','insurancePhone','medical']
    .forEach(id => { s[id] = $('#' + id).value.trim(); });
  saveSettings(s);
  toast('Saved ✓');
});

/* ---------- Router ---------- */
// Hash format: #name or #name:param (e.g. #plan:d4-temple)
const currentRoute = () => {
  const r = location.hash.slice(1).split(':')[0];
  return ROUTES[r] ? r : 'today';
};
const routeParam = () => location.hash.slice(1).split(':')[1] || '';

let leaveScreen = null; // cleanup for the current screen (e.g. stop clock timer)

function render() {
  if (leaveScreen) { leaveScreen(); leaveScreen = null; }
  const name = currentRoute();
  const route = ROUTES[name];
  $('#screen-title').textContent = route.title;
  $('#back-btn').hidden = !(typeof route.back === 'function' ? route.back() : route.back);
  $('#sos-btn').hidden = name === 'sos';
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
function applyUpdate() {
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
    if (reloading) return; reloading = true; location.reload();
  });
}

/* ---------- First run ---------- */
// Runs after all screen scripts (today.js, money.js…) have registered their routes
document.addEventListener('DOMContentLoaded', async () => {
  applyTextSize(getSettings().textSize);
  await Promise.all(['trip', 'places', 'restaurants', 'dishes', 'phrases', 'shopping', 'prep', 'emergency'].map(loadJSON));
  render();
  if (!Store.get('persistAsked', false) && navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch (e) {}
    Store.set('persistAsked', true);
  }
});
