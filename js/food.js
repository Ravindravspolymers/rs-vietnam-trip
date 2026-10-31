/* RS Vietnam Trip — Food (Phase 5)
   Step 1: where are you? → Step 2: nearest veg restaurants. Plus waiter card and safe dishes.
   All data offline (data/restaurants.json, data/dishes.json, data/phrases.json → waiter). */
'use strict';

// F15: GPS position kept for this session so #food:gps survives a reload
let foodGps = (() => { try { return JSON.parse(sessionStorage.getItem('rs.foodGps')); } catch (e) { return null; } })();

function renderFood() {
  const p = routeParam();
  if (p) return renderFoodList(p);
  const R = DATA.restaurants;
  if (!R) return `<div class="card"><p>Food data not loaded. Close and reopen the app.</p></div>`;
  const tiles = R.areas.map(a => `<a class="tile area" href="#food:${a.id}">
      <span>${esc(a.en)}</span>${a.vi ? `<span class="vi small">${esc(a.vi)}</span>` : ''}<span class="kn small">${esc(a.kn)}</span></a>`).join('');
  // F21: one primary action (location), then two helpers, then the area tiles
  return `<h2 class="sect">Find veg food near you <span class="kn muted">ಹತ್ತಿರದ ಸಸ್ಯಾಹಾರಿ ಊಟ</span></h2>
    <button type="button" class="btn green" id="food-gps">📍 Use my location</button>
    <div class="actions">
      <a class="btn secondary" href="#waiter">🙋 Waiter card</a>
      <a class="btn secondary" href="#dishes">🥢 Safe dishes</a>
    </div>
    <h3 class="sect">Or choose a place <span class="kn muted">ಅಥವಾ ಜಾಗ ಆರಿಸಿ</span></h3>
    <div class="grid">${tiles}</div>`;
}

function renderFoodList(p) {
  const R = DATA.restaurants;
  let center, title, area = null;
  if (p === 'gps' && !foodGps) { location.replace('#food'); return ''; }
  if (p === 'gps' && foodGps) {
    center = foodGps; title = 'Near you';
    // Use the nearest area's notes and search radius
    area = R.areas.slice().sort((a, b) => haversineKm(center, a) - haversineKm(center, b))[0];
  } else {
    area = R.areas.find(a => a.id === p);
    if (!area) return `<div class="card"><p>Area not found.</p></div>`;
    center = area; title = area.en;
  }
  const radius = area ? area.radius : 3;
  const list = R.restaurants
    .map(r => ({ r, km: haversineKm(center, r) }))
    .filter(x => x.km <= radius)
    .sort((a, b) => a.km - b.km)
    .slice(0, 8);

  const note = area?.note_en ? `<div class="card warn"><p>${esc(area.note_en)}</p><p class="kn">${esc(area.note_kn)}</p></div>` : '';
  const cards = list.map(({ r, km }) => restaurantCard(r, km)).join('');
  const empty = !list.length ? `<div class="card"><p>No veg restaurants saved near here. Use the waiter card and the safe dishes list.</p>
      <p class="kn">ಇಲ್ಲಿ ಹತ್ತಿರ ಸಸ್ಯಾಹಾರಿ ಹೋಟೆಲ್ ಇಲ್ಲ. ವೇಟರ್ ಕಾರ್ಡ್ ಮತ್ತು ಸುರಕ್ಷಿತ ಖಾದ್ಯಗಳ ಪಟ್ಟಿ ಬಳಸಿ.</p></div>` : '';

  const ask = renderAsk(['What veg dish should I order here?', 'How do I say "no fish sauce"?'],
    `They are near: ${title}, Vietnam. Ordering food at a local Vietnamese restaurant.`);
  return `<h2 class="sect">${esc(title)}</h2>${note}${cards}${empty}${ask}
    <a class="btn" href="#waiter">🙋 Show waiter card</a>
    <a class="btn secondary" href="#dishes">🥢 Safe veg dishes</a>`;
}

function restaurantCard(r, km) {
  const dist = km < 1 ? `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m` : `${km.toFixed(1)} km`;
  const mode = km < 1.5 ? 'walking' : 'driving';
  const go = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.go || r.name + ', ' + r.addr)}&travelmode=${mode}`;
  const vegTag = r.veg === 'pure' ? '<span class="vtag pure">🟢 Pure veg</span>' : '<span class="vtag friendly">🟡 Veg-friendly</span>';
  return `<article class="card rest">
    <div class="tags">${vegTag}<span class="vtag">${esc(r.cuisine)}</span><span class="vtag dist">${dist}</span></div>
    <h3>${esc(r.name)}</h3>
    <p class="muted small">${esc(r.addr)}</p>
    <p>🕒 ${esc(r.hours)}<br>💰 ${esc(r.price)}</p>
    <p>${esc(r.note_en)}<br><span class="kn">${esc(r.note_kn)}</span></p>
    <a class="btn green" href="${go}" target="_blank" rel="noopener">▶ Go (${mode === 'walking' ? 'walk' : 'drive'})</a>
  </article>`;
}

function startFood() {
  const btn = document.getElementById('food-gps');
  if (!btn) return;
  const onClick = () => {
    if (!('geolocation' in navigator)) return toast('Location not available.');
    btn.disabled = true; btn.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        foodGps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try { sessionStorage.setItem('rs.foodGps', JSON.stringify(foodGps)); } catch (e) {}
        location.hash = '#food:gps';
      },
      () => { btn.disabled = false; btn.textContent = '📍 Use my location';
              toast('Location off. Please pick a place below. / ಕೆಳಗೆ ಜಾಗ ಆರಿಸಿ.', 4000); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 });
  };
  btn.addEventListener('click', onClick);
  return () => btn.removeEventListener('click', onClick);
}

/* ----- Safe dishes ----- */
function renderDishes() {
  const D = DATA.dishes?.dishes || [];
  return `<div class="card accent">
      <p><strong>When ordering, add:</strong></p>
      <p class="vi big-vi">chay, không nước mắm</p>
      <p>"vegetarian, no fish sauce"<br><span class="kn">"ಸಸ್ಯಾಹಾರ, ಮೀನಿನ ಸಾಸ್ ಬೇಡ"</span></p>
      <button type="button" class="btn secondary" data-say="Chay, không nước mắm">▶ Play</button>
    </div>
    ${renderAsk(['What veg dish should I order here?', 'How do I say "no fish sauce"?'], 'Ordering at a Vietnamese restaurant in Hanoi.')}
    ${D.map(d => `<article class="card dish">
      <div class="dish-head"><span class="dish-ic" aria-hidden="true">${d.icon}</span>
        <div><p class="vi big-vi">${esc(d.vi)}</p><p>${esc(d.en)}</p><p class="kn muted">${esc(d.kn)}</p></div></div>
      ${d.nofish ? `<p class="nofish">⚠️ Say: <strong>không nước mắm</strong> (no fish sauce)<br><span class="kn">ಮೀನಿನ ಸಾಸ್ ಬೇಡ ಎಂದು ಹೇಳಿ</span></p>` : ''}
      <button type="button" class="btn secondary" data-say="${esc(d.vi + (d.nofish ? ', không nước mắm' : ''))}">▶ Play</button>
    </article>`).join('')}`;
}

/* ----- Waiter card (full screen) ----- */
function renderWaiter() {
  const w = DATA.phrases?.waiter;
  if (!w) return `<div class="card"><p>Not loaded.</p></div>`;
  return `<section class="driver">
    <p class="dr-name" style="font-size:clamp(26px,7.5vw,36px)">${esc(w.vi)}</p>
    <button type="button" class="btn green" data-say="${esc(w.vi)}">▶ Play in Vietnamese</button>
    <hr>
    <p class="dr-en">${esc(w.en)}</p>
    <p class="kn" style="color:#333">${esc(w.kn)}</p>
  </section>`;
}

ROUTES.food.render = renderFood;
ROUTES.food.after = startFood;
ROUTES.food.back = () => routeParam() ? 'food' : null;
ROUTES.dishes = { title: 'Safe veg dishes', tab: 'food', back: 'food', render: renderDishes, after: () => startSayButtons() };
ROUTES.waiter = { title: 'Waiter card', tab: 'food', back: 'food', render: renderWaiter,
                  after: () => { document.body.classList.add('fullscreen'); const off = startSayButtons();
                                 return () => { document.body.classList.remove('fullscreen'); off(); }; } };
