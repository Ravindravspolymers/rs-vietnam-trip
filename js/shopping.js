/* RS Vietnam Trip — Shopping (Phase 6)
   44 items from data/shopping.json. Filters: category, price band, where, easy to carry.
   "Bought ✓" ticks saved on the phone. ₹ prices use the Money screen's saved rate. */
'use strict';

const shopF = { cat: '', price: '', where: '', easy: false, open: false };
const getBought = () => Store.get('bought', {});

const vndShort = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1000) + 'k';
const toINR = v => { const fx = getFx(); return Math.round(v / fx.VND * fx.INR / 10) * 10; };
const inr = n => '₹' + n.toLocaleString('en-IN');

function priceBand(it) {
  const top = it.vmax ?? it.vmin;
  if (top == null) return 'ask';
  return top <= 100000 ? 'low' : top <= 300000 ? 'mid' : 'high';
}
function priceText(it) {
  if (it.vmin == null) return 'Fixed price on tag, or ask';
  if (it.vmax == null) return `from ${vndShort(it.vmin)} ₫ ≈ ${inr(toINR(it.vmin))}+`;
  if (it.vmin === it.vmax) return `about ${vndShort(it.vmin)} ₫ ≈ ${inr(toINR(it.vmin))}`;
  return `${vndShort(it.vmin)}–${vndShort(it.vmax)} ₫ ≈ ${inr(toINR(it.vmin))}–${inr(toINR(it.vmax))}`;
}

function shopFiltered() {
  return DATA.shopping.items.filter(it =>
    (!shopF.cat || it.cat === shopF.cat) &&
    (!shopF.price || priceBand(it) === shopF.price) &&
    (!shopF.where || it.where.includes(shopF.where)) &&
    (!shopF.easy || it.easy));
}

function chipRow(key, options) {
  return `<div class="fchips">${[['', 'All'], ...options].map(([v, l]) =>
    `<button type="button" class="fchip" data-f="${key}:${v}" aria-pressed="${shopF[key] === v}">${esc(l)}</button>`).join('')}</div>`;
}

function renderShopping() {
  const S = DATA.shopping;
  if (!S) return `<div class="card"><p>Shopping list not loaded. Close and reopen the app.</p></div>`;
  const list = shopFiltered();
  const bought = getBought();
  const nBought = S.items.filter(i => bought[i.id]).length;
  const active = [shopF.cat, shopF.price, shopF.where, shopF.easy ? 'easy' : ''].filter(Boolean).length;

  // Group by category (in category order) for easy scanning
  const groups = S.cats.map(([c, name]) => [name, list.filter(i => i.cat === c)]).filter(([, l]) => l.length);
  const cards = groups.map(([name, l]) =>
    `<h3 class="sect">${esc(name)}</h3>${l.map(it => shopCard(it, !!bought[it.id])).join('')}`).join('');

  return `<section class="card accent">
      <h3>🌙 Best shopping night: Fri 27 Nov</h3>
      <p>After the puppet show, walk to the Weekend Night Market (Fri–Sun evenings).</p>
      <p class="kn">ಶುಕ್ರವಾರ 27 ನವೆಂಬರ್, ಬೊಂಬೆಯಾಟದ ನಂತರ ವಾರಾಂತ್ಯದ ರಾತ್ರಿ ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಿ.</p>
    </section>
    <section class="card">
      <h3>🤝 How to bargain</h3>
      <p>Offer half. Settle at 60–70%. Smile. Pay cash in đồng. Walk away if too high.</p>
      <p class="kn">ಅರ್ಧ ಬೆಲೆ ಹೇಳಿ. 60–70%ಕ್ಕೆ ಒಪ್ಪಿ. ನಗುತ್ತಿರಿ. ಡಾಂಗ್ ನಗದು ಕೊಡಿ. ದುಬಾರಿ ಎನಿಸಿದರೆ ಹೊರಡಿ.</p>
    </section>

    <button type="button" class="btn secondary" id="shop-filters">🔎 Filters${active ? ` (${active})` : ''}</button>
    <section class="card filters" id="shop-panel" ${shopF.open ? '' : 'hidden'}>
      <p class="flabel">Category</p>${chipRow('cat', S.cats)}
      <p class="flabel">Price</p>${chipRow('price', [['low', 'Under 100k ₫'], ['mid', '100k–300k ₫'], ['high', 'Over 300k ₫'], ['ask', 'Ask / tag']])}
      <p class="flabel">Where</p>${chipRow('where', S.wheres)}
      <button type="button" class="fchip wide" data-f="easy:" aria-pressed="${shopF.easy}">🎒 Easy to carry only</button>
      ${active ? '<button type="button" class="btn" data-f="clear:">Clear filters</button>' : ''}
    </section>

    <p class="muted center">Showing ${list.length} of ${S.items.length} · Bought ${nBought} ✓</p>
    ${cards || `<div class="card"><p>Nothing matches. Clear the filters.</p><p class="kn">ಫಿಲ್ಟರ್ ತೆಗೆದು ನೋಡಿ.</p></div>`}

    <section class="card warn">
      <h3>🚫 Don't buy</h3>
      <ul>${S.skip.en.map((t, i) => `<li>${esc(t)}<br><span class="kn">${esc(S.skip.kn[i])}</span></li>`).join('')}</ul>
    </section>`;
}

function shopCard(it, done) {
  const pl = DATA.shopping.places[it.place];
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pl.q)}`;
  return `<article class="card shop${done ? ' visited' : ''}" id="shop-${it.id}">
    <div class="dish-head"><span class="dish-ic" aria-hidden="true">${it.icon}</span>
      <div><h3>${esc(it.en)}</h3><p class="kn muted">${esc(it.kn)}</p></div></div>
    <p class="price">💰 ${esc(priceText(it))}</p>
    <p>${esc(it.why_en)}<br><span class="kn">${esc(it.why_kn)}</span></p>
    <div class="tip"><strong>💡 Tip</strong><p>${esc(it.tip_en)}</p><p class="kn">${esc(it.tip_kn)}</p></div>
    <div class="actions">
      <a class="btn secondary" href="${map}" target="_blank" rel="noopener">📍 ${esc(pl.label)}</a>
      <button type="button" class="tick" data-bought="${it.id}" aria-pressed="${done}">${done ? '✓ Bought' : '○ Bought?'}</button>
    </div>
  </article>`;
}

function startShopping() {
  const main = document.getElementById('screen');
  const onClick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'shop-filters') { shopF.open = !shopF.open; document.getElementById('shop-panel').hidden = !shopF.open; return; }
    if (b.dataset.bought) {
      const id = b.dataset.bought, all = getBought(), on = !all[id];
      if (on) all[id] = true; else delete all[id];
      Store.set('bought', all);
      b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ Bought' : '○ Bought?';
      b.closest('.shop').classList.toggle('visited', on);
      return;
    }
    if (b.dataset.f) {
      const [k, v] = b.dataset.f.split(':');
      if (k === 'clear') Object.assign(shopF, { cat: '', price: '', where: '', easy: false });
      else if (k === 'easy') shopF.easy = !shopF.easy;
      else shopF[k] = v;
      const y = window.scrollY; render(); window.scrollTo(0, y);   // keep position while filtering
    }
  };
  main.addEventListener('click', onClick);
  return () => main.removeEventListener('click', onClick);
}

ROUTES.shopping.render = renderShopping;
ROUTES.shopping.after = startShopping;
