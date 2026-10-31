/* RS Vietnam Trip — Money screen (Phase 2)
   INR ⇄ VND ⇄ USD converter, live rates with offline fallback, quick amounts, VND note guide. */
'use strict';

// Built-in fallback (open.er-api.com, 18 Oct 2026). Used until the phone fetches a fresh rate.
const FX_FALLBACK = { INR: 95.08, VND: 25861, date: '2026-10-18' };
const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const FX_MAX_AGE = 6 * 3600 * 1000; // refresh at most every 6 hours

const getFx = () => Store.get('fx', FX_FALLBACK);

// Draw-in-code notes (no photos). Colours approximate the real polymer notes.
const VND_NOTES = [
  { v: 10000,  color: '#B5853A', alike: 100000, alikeWhy: 'zeros' },
  { v: 20000,  color: '#3C6EB4', alike: 500000, alikeWhy: 'colour' },
  { v: 50000,  color: '#C2547E' },
  { v: 100000, color: '#4C8A52', alike: 10000,  alikeWhy: 'zeros' },
  { v: 200000, color: '#C4613A' },
  { v: 500000, color: '#2F8DAE', alike: 20000,  alikeWhy: 'colour' }
];

const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtVND = n => Math.round(n).toLocaleString('en-US') + ' ₫';
const fmtUSD = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kShort = v => v >= 1000 ? (v / 1000) + 'k' : String(v);

function fxStatusText(fx) {
  const d = new Date(fx.date + (fx.date.length === 10 ? 'T00:00:00Z' : ''));
  const ds = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `Rate from ${ds}, approx.`;
}

function renderMoney() {
  const fx = getFx();
  const r100k = 100000 / fx.VND * fx.INR;      // ₹ per 100k VND
  const vndPer100 = 100 / fx.INR * fx.VND;      // VND per ₹100

  const quick = (cur, list) => `<div class="qchips">${list.map(([v, l]) =>
    `<button type="button" class="qchip" data-quick="${cur}:${v}">${l}</button>`).join('')}</div>`;

  // v1.2: quick amounts sit right above their box; notes moved to their own page (💵 at top)
  return `<div class="money-top">
      <p class="muted small" id="fx-status">${esc(fxStatusText(fx))}</p>
      <a class="notes-link" href="#notes" aria-label="Vietnam notes pictures">💵 Notes</a>
    </div>
    ${payDong()}
    <section class="card conv">
      <label for="fx-INR">₹ Indian Rupee</label>
      ${quick('INR', [[500, '₹500'], [1000, '₹1,000'], [2000, '₹2,000'], [5000, '₹5,000']])}
      <input id="fx-INR" data-cur="INR" type="text" inputmode="numeric" placeholder="0" autocomplete="off">
      <label for="fx-VND">₫ Vietnam Dong</label>
      ${quick('VND', [[50000, '50k'], [100000, '100k'], [200000, '200k'], [500000, '500k']])}
      <input id="fx-VND" data-cur="VND" type="text" inputmode="numeric" placeholder="0" autocomplete="off">
      <label for="fx-USD">$ US Dollar</label>
      <input id="fx-USD" data-cur="USD" type="text" inputmode="decimal" placeholder="0" autocomplete="off">
    </section>
    ${renderCashPlan()}
    ${renderAskPrice()}

    <section class="card accent" id="fx-rule">
      <h3>Easy rule</h3>
      <p><strong>100,000 ₫ ≈ ${fmtINR(r100k)}</strong><br><strong>₹100 ≈ ${fmtVND(vndPer100)}</strong></p>
      <p class="kn">ಸುಲಭ ಲೆಕ್ಕ: 1 ಲಕ್ಷ ಡಾಂಗ್ ≈ ${fmtINR(r100k)}</p>
    </section>

    ${zerosCard()}`;
}

const zerosCard = () => `<section class="card warn">
      <h3>⚠️ Count the zeros!</h3>
      <p>Notes look alike. 20k and 500k are both blue. 10k and 100k differ by one zero.</p>
      <p class="kn">⚠️ ಸೊನ್ನೆಗಳನ್ನು ಎಣಿಸಿ! 20k ಮತ್ತು 500k ಎರಡೂ ನೀಲಿ ಬಣ್ಣ. 10k ಮತ್ತು 100k ನಲ್ಲಿ ಒಂದು ಸೊನ್ನೆ ಮಾತ್ರ ವ್ಯತ್ಯಾಸ.</p>
    </section>`;

/* v1.2: notes picture page (opened from 💵 at the top of Money) */
function renderNotesPage() {
  return `<p class="kn">ವಿಯೆಟ್ನಾಂ ನೋಟುಗಳು — ರೂಪಾಯಿಯಲ್ಲಿ ಎಷ್ಟು</p>
    <div id="fx-notes">${renderNotes(getFx())}</div>${zerosCard()}`;
}

function renderNotes(fx) {
  return VND_NOTES.map(n => {
    const s = n.v.toLocaleString('en-US');            // "100,000"
    const lead = s.replace(/[,0]+$/, '');              // "1"
    const zeros = s.slice(lead.length);                // "00,000"
    const alike = n.alike ? `<p class="alike">⚠️ Looks like ${kShort(n.alike)} — ${n.alikeWhy === 'colour' ? 'same colour' : 'count zeros'}<br>
        <span class="kn">${kShort(n.alike)} ನಂತೆ ಕಾಣುತ್ತದೆ — ${n.alikeWhy === 'colour' ? 'ಒಂದೇ ಬಣ್ಣ' : 'ಸೊನ್ನೆ ಎಣಿಸಿ'}</span></p>` : '';
    return `<div class="note-row">
      <div class="note" style="--nc:${n.color}">
        <span class="note-val">${lead}<span class="zeros">${zeros}</span></span>
        <span class="note-unit">đồng</span>
      </div>
      <div class="note-info">
        <strong class="note-inr">≈ ${fmtINR(n.v / fx.VND * fx.INR)}</strong>
        <span class="muted">${kShort(n.v)} ₫</span>
        ${alike}
      </div>
    </div>`;
  }).join('');
}

/* ----- Converter logic ----- */
function parseAmt(str, cur) {
  const clean = cur === 'USD' ? str.replace(/[^\d.]/g, '') : str.replace(/\D/g, '');
  return { clean, n: parseFloat(clean) || 0 };
}

function convertFrom(cur, amount) {
  const fx = getFx();
  const rate = { USD: 1, INR: fx.INR, VND: fx.VND };
  const usd = amount / rate[cur];
  ['INR', 'VND', 'USD'].filter(c => c !== cur).forEach(c => {
    const el = document.getElementById('fx-' + c);
    if (!el) return;
    const v = usd * rate[c];
    el.value = !amount ? '' :
      c === 'USD' ? v.toFixed(2) :
      Math.round(v).toLocaleString(c === 'INR' ? 'en-IN' : 'en-US');
  });
}

function onFxInput(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.cur) return;
  const cur = el.dataset.cur;
  const { clean, n } = parseAmt(el.value, cur);
  if (cur !== 'USD') el.value = clean ? Number(clean).toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US') : '';
  convertFrom(cur, n);
}

function setQuick(cur, v) {
  const el = document.getElementById('fx-' + cur);
  el.value = v.toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US');
  convertFrom(cur, v);
}

async function refreshFx() {
  const fx = getFx();
  if (!navigator.onLine) return;
  if (fx.fetched && Date.now() - fx.fetched < FX_MAX_AGE) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const j = await (await fetch(FX_URL, { signal: ctrl.signal, cache: 'no-store' })).json();
    clearTimeout(t);
    if (j.result !== 'success' || !j.rates?.INR || !j.rates?.VND) return;
    const fresh = { INR: j.rates.INR, VND: j.rates.VND,
      date: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10), fetched: Date.now() };
    Store.set('fx', fresh);
    // Update the screen if still on Money
    if (currentRoute() !== 'money') return;
    const st = document.getElementById('fx-status'); if (st) st.textContent = fxStatusText(fresh);
    const notes = document.getElementById('fx-notes'); if (notes) notes.innerHTML = renderNotes(fresh);
    const filled = ['INR', 'VND', 'USD'].find(c => document.getElementById('fx-' + c)?.value);
    if (filled) convertFrom(filled, parseAmt(document.getElementById('fx-' + filled).value, filled).n);
    const rule = document.getElementById('fx-rule');
    if (rule) rule.outerHTML = new DOMParser().parseFromString(renderMoney(), 'text/html').getElementById('fx-rule').outerHTML;
  } catch (e) { /* offline or blocked — keep saved rate */ }
}

function startMoney() {
  const main = document.getElementById('screen');
  const onClick = e => {
    const b = e.target.closest('[data-quick]');
    if (!b) return;
    const [cur, v] = b.dataset.quick.split(':');
    setQuick(cur, Number(v));
  };
  main.addEventListener('input', onFxInput);
  main.addEventListener('click', onClick);
  refreshFx();
  return () => { main.removeEventListener('input', onFxInput); main.removeEventListener('click', onClick); };
}

ROUTES.money.render = renderMoney;
ROUTES.money.after = startMoney;
ROUTES.notes = { title: 'Vietnam notes', tab: 'money', back: 'money', render: renderNotesPage };
