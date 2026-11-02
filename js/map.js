/* RS Vietnam Trip — 🗺 Map (v3.1)
   An offline, hand-drawn map of the Hanoi days they do themselves (Tue 24, Thu 26, Fri 27, Sun 29).
   Real GPS points from data/trip.json, simplified lakes + Red River, day-coloured routes with 👫 walk / 🚗 cab,
   pinch zoom, filter chips, GPS blue dot, tap card with address for the cab. No map tiles, no internet needed. */
'use strict';

const MAP_DAYS = [1, 3, 4, 6];
const MAP_COL = { 1: '#1E66D0', 3: '#7B3FB5', 4: '#E8710A', 6: '#0E8C7F' };
const MAP_TAG = { 1: 'TUE', 3: 'THU', 4: 'FRI', 6: 'SUN' };
const MAP_ICON = {
  'd1-bachma': '⛩', 'd1-market': '🛍', 'd3-tranquoc': '🛕', 'd3-ethno': '🏛', 'd3-lotte': '🏙', 'd4-citadel': '🏯',
  'd4-temple': '🎓', 'd4-cathedral': '⛪', 'd4-lake': '🐢', 'd4-ngocson': '🌉', 'd4-puppet': '🎭', 'd4-walkst': '🎶',
  'd6-hcm': '🕊', 'd6-onepillar': '🌸', 'd6-hoalo': '⛓', 'd6-women': '👩'
};
const MAP_SPLIT = { 4: 'd4-lunch' };                        // Friday: morning ends with lunch
const MB = { latMin: 21.015, latMax: 21.065, lngMin: 105.790, lngMax: 105.885 };
const MX = lng => (lng - MB.lngMin) * 103920, MY = lat => (MB.latMax - lat) * 110700;
const MW = MX(MB.lngMax), MH = MY(MB.latMin);

// Simplified water shapes [lat, lng]
const WATER = [
  { name: 'West Lake', at: [21.060, 105.822], pts: [[21.0475, 105.8355], [21.0455, 105.8300], [21.0440, 105.8240], [21.0450, 105.8170], [21.0490, 105.8105], [21.0560, 105.8060], [21.0640, 105.8070], [21.0720, 105.8130], [21.0760, 105.8230], [21.0740, 105.8330], [21.0680, 105.8380], [21.0600, 105.8390], [21.0530, 105.8380], [21.0490, 105.8375]] },
  { name: 'Truc Bach', at: [21.0462, 105.8422], pts: [[21.0485, 105.8395], [21.0482, 105.8440], [21.0465, 105.8458], [21.0442, 105.8452], [21.0436, 105.8420], [21.0445, 105.8392], [21.0468, 105.8385]] },
  { name: 'Hoan Kiem Lake', at: [21.0278, 105.8545], pts: [[21.0316, 105.8527], [21.0308, 105.8536], [21.0290, 105.8537], [21.0270, 105.8530], [21.0255, 105.8521], [21.0252, 105.8512], [21.0262, 105.8508], [21.0283, 105.8513], [21.0303, 105.8516], [21.0313, 105.8519]] },
  { name: 'Red River', at: [21.040, 105.866], river: true, pts: (() => {
      const w = [[21.075, 105.835], [21.062, 105.846], [21.050, 105.853], [21.042, 105.857], [21.030, 105.861], [21.018, 105.866], [21.005, 105.872]];
      return w.concat(w.slice().reverse().map(([a, b]) => [a + 0.001, b + 0.011]));
    })() }
];

/* ---------- Data: one route per day, from the plan ---------- */
function mapData() {
  const H = DATA.trip.hotel, hotel = { id: 'hotel', lat: H.lat, lng: H.lng };
  const amy = { lat: 21.03358, lng: 105.848834 };
  const days = [], places = [], meals = {};
  MAP_DAYS.forEach(n => {
    const day = DATA.trip.days.find(d => d.day === n); if (!day) return;
    const list = day.stops.filter(s => (!day.brief || s.card) && (isPlace(s) || s.type === 'meal'));
    let prev = hotel, k = 0, part = 'am'; const segs = [];
    list.forEach(s => {
      const pt = s.lat != null ? s : amy;                       // Sunday lunch "your choice" → near the hotel
      const dist = ((s.how?.en || '').match(/(~|about )?\d+(\.\d+)? ?k?m\b/i) || [''])[0].replace(/about /i, '~');
      segs.push({ a: prev, b: pt, mode: s.how?.mode || 'cab', dist, day: n, part });
      if (isPlace(s)) places.push({ s, day, n, no: ++k, part });
      else { const key = pt.lat.toFixed(4); (meals[key] = meals[key] || { s, pt, days: new Set() }).days.add(n); }
      if (MAP_SPLIT[n] === s.id) part = 'pm';
      prev = pt;
    });
    days.push({ n, day, segs, first: list.find(isPlace) });
  });
  return { hotel, days, places, meals: Object.values(meals) };
}

/* ---------- Render ---------- */
let MAPV = null;   // state while the map screen is open
function mapDefaultDay() {
  const cur = currentTripDay();
  return !cur.before && !cur.after && MAP_DAYS.includes(cur.day.day) ? String(cur.day.day) : 'all';
}
function renderMap() {
  const D = mapData(), p = routeParam();
  const stopDay = p && D.places.concat(D.meals).find(x => x.s.id === p);
  const sel = /^day\d$/.test(p) ? p.slice(3) : stopDay ? String(stopDay.n || [...stopDay.days][0]) : mapDefaultDay();
  const chip = (v, label, col) => `<button type="button" class="mchip" data-mday="${v}" aria-pressed="${sel === v}" style="--dc:${col || '#444'}">${label}</button>`;
  const dayChips = MAP_DAYS.map(n => { const d = DATA.trip.days.find(x => x.day === n);
    return chip(String(n), new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' }).replace(',', ''), MAP_COL[n]); }).join('');
  return `<div class="mapbar">${chip('all', 'All')}${dayChips}</div>
    <div class="mapwrap" id="mapwrap">
      <svg id="mapsvg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of your Hanoi places">${mapSvg(D)}</svg>
      <div class="mapctl">
        <button type="button" class="mbtn" data-mz="in" aria-label="Zoom in">＋</button>
        <button type="button" class="mbtn" data-mz="out" aria-label="Zoom out">−</button>
        <button type="button" class="mbtn" data-mz="fit" aria-label="Reset">⟲</button>
        <button type="button" class="mbtn" data-mz="oq" aria-label="Old Quarter">🔍</button>
        <button type="button" class="mbtn" data-mz="me" aria-label="Where am I" hidden>◎</button>
      </div>
      <a class="maphotel" href="#driver:hotel-${Math.max(1, currentTripDay().day?.day || 1)}">🏨 Hotel</a>
      <p class="maplegend">★ Hotel · 🍽 Meal<br>👫 Walk · 🚗 Cab</p>
      <div class="mpart" id="mpart" hidden>
        <button type="button" data-mpart="am">☀ Morning</button><button type="button" data-mpart="pm">🌙 Afternoon</button><button type="button" data-mpart="all">Whole day</button>
      </div>
      <button type="button" class="mapnote" id="mapnote" hidden></button>
      <div class="mapcard" id="mapcard" hidden></div>
    </div>`;
}

function mapSvg(D) {
  const pts = a => a.map(([la, ln]) => `${MX(ln).toFixed(0)},${MY(la).toFixed(0)}`).join(' ');
  const water = WATER.map(w => `<polygon class="${w.river ? 'river' : 'lake'}" points="${pts(w.pts)}"/>`).join('')
    + WATER.map(w => `<g class="sc wlabel" data-x="${MX(w.at[1])}" data-y="${MY(w.at[0])}"><text>${w.name}</text></g>`).join('');
  const visited = getVisited();
  const segs = D.days.flatMap(d => d.segs.map((g, i) => {
    const x1 = MX(g.a.lng), y1 = MY(g.a.lat), x2 = MX(g.b.lng), y2 = MY(g.b.lat);
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 5) return '';
    const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return `<g class="seg" data-day="${g.day}" data-part="${g.part}" style="--dc:${MAP_COL[g.day]}">
      <line class="${g.mode}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" vector-effect="non-scaling-stroke"/>
      <g class="sc arrow" data-x="${x1 + (x2 - x1) * .7}" data-y="${y1 + (y2 - y1) * .7}" data-r="${ang}"><path d="M-6,-5 L5,0 L-6,5 Z"/></g>
      <g class="sc seglab" data-x="${(x1 + x2) / 2}" data-y="${(y1 + y2) / 2}" data-len="${len}"><rect x="-27" y="-10" width="54" height="20" rx="10"/>
        <text x="0" y="1">${g.mode === 'walk' ? '👫' : '🚗'} ${esc(g.dist)}</text></g></g>`;
  })).join('');
  const meals = D.meals.map(m => `<g class="sc pin meal" data-days="${[...m.days].join(' ')}" data-pin="${m.s.id}" data-x="${MX(m.pt.lng)}" data-y="${MY(m.pt.lat)}">
      <circle class="hit" r="24"/><circle class="mbg" r="11"/><text class="emo" y="1">🍽</text>
      <text class="plabel" y="25">${esc(m.s.den || m.s.en)}</text></g>`).join('');
  const places = D.places.map(({ s, n, no, part }) => `<g class="sc pin place${visited[s.id] ? ' done' : ''}" data-days="${n}" data-part="${part}" data-pin="${s.id}" data-x="${MX(s.lng)}" data-y="${MY(s.lat)}" style="--dc:${MAP_COL[n]}">
      <circle class="hit" r="26"/><circle class="pulse" r="18"/><circle class="pbg" r="16"/><text class="emo" y="1">${MAP_ICON[s.id] || '📍'}</text>
      <circle class="nbg" cx="13" cy="-13" r="9"/><text class="nno" x="13" y="-12.5">${no}</text>
      ${visited[s.id] ? '<circle class="dk" cx="-13" cy="-13" r="8"/><text class="dkt" x="-13" y="-12.5">✓</text>' : ''}
      <text class="plabel" y="31">${esc(s.en.replace(/ \(.*\)$/, ''))}</text></g>`).join('');
  const tags = D.days.filter(d => d.first).map(d => `<g class="sc dtag" data-days="${d.n}" data-x="${MX(d.first.lng)}" data-y="${MY(d.first.lat)}" style="--dc:${MAP_COL[d.n]}">
      <rect x="-22" y="-52" width="44" height="18" rx="9"/><text y="-42.5">${MAP_TAG[d.n]}</text></g>`).join('');
  const H = D.hotel;
  const hotel = `<g class="sc pin hotel" data-pin="hotel" data-x="${MX(H.lng)}" data-y="${MY(H.lat)}"><circle class="hit" r="26"/>
      <circle class="hbg" r="17"/><text class="hstar" y="1">★</text><text class="plabel hl" y="32">Hotel</text></g>`;
  const leaders = D.places.map(({ s }) => `<line class="leader" id="ld-${s.id}" x1="0" y1="0" x2="0" y2="0" vector-effect="non-scaling-stroke"/>`).join('');
  return `<rect class="land" x="-5000" y="-5000" width="${MW + 10000}" height="${MH + 10000}"/>${water}<g id="segs">${segs}</g><g id="leaders">${leaders}</g>${meals}${places}${tags}${hotel}
    <g class="sc me" id="medot" data-x="-99999" data-y="-99999"><circle class="mehalo" r="16"/><circle class="medot" r="7"/></g>`;
}

/* ---------- Pan / zoom by moving the SVG viewBox ---------- */
function mapApply() {
  const v = MAPV; if (!v) return;
  const W = v.wrap.clientWidth, Hh = v.wrap.clientHeight; if (!W || !Hh) return;
  v.vb.h = v.vb.w * Hh / W;
  v.svg.setAttribute('viewBox', `${v.vb.x} ${v.vb.y} ${v.vb.w} ${v.vb.h}`);
  const mpp = v.vb.w / W;                                     // metres per screen pixel
  const small = mpp > 6 ? 0.72 : 1;                           // far out: smaller pins so the city doesn't clog
  const shown = el => !el.classList.contains('dim') && !el.classList.contains('off');
  // 1) Pins closer than ~36 px fan out a little (the hotel stays put); a thin line points to the true spot
  const pins = [...v.svg.querySelectorAll('.pin')].filter(shown).map(g => ({ g, x: +g.dataset.x, y: +g.dataset.y, fixed: g.classList.contains('hotel') }));
  const minD = 36 * mpp * small;
  for (let it = 0; it < 8; it++) for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
    const a = pins[i], b = pins[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d >= minD) continue; if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
    const push = (minD - d) / (a.fixed || b.fixed ? 1 : 2), ux = dx / d, uy = dy / d;
    if (!a.fixed) { a.x -= ux * push; a.y -= uy * push; } if (!b.fixed) { b.x += ux * push; b.y += uy * push; }
  }
  pins.forEach(p => { p.g.dataset.px = p.x; p.g.dataset.py = p.y; });
  v.svg.querySelectorAll('.leader').forEach(l => {
    const g = v.svg.querySelector(`[data-pin="${l.id.slice(3)}"]`), on = g && shown(g) && Math.hypot(g.dataset.px - g.dataset.x, g.dataset.py - g.dataset.y) > 3 * mpp;
    l.style.display = on ? '' : 'none';
    if (on) { l.setAttribute('x1', g.dataset.x); l.setAttribute('y1', g.dataset.y); l.setAttribute('x2', g.dataset.px); l.setAttribute('y2', g.dataset.py); }
  });
  v.svg.querySelectorAll('.sc').forEach(g => {
    const r = g.dataset.r ? ` rotate(${g.dataset.r})` : '';
    const x = g.dataset.px ?? g.dataset.x, y = g.dataset.py ?? g.dataset.y;
    g.setAttribute('transform', `translate(${x},${y})${r} scale(${mpp * (g.classList.contains('pin') || g.classList.contains('dtag') ? small : 1)})`);
  });
  // 2) Distance badges: hide any that would sit on a pin or on another badge (they come back when zoomed in)
  const boxes = pins.map(p => [p.x - 20 * mpp, p.y - 20 * mpp, p.x + 20 * mpp, p.y + 20 * mpp]);
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  v.svg.querySelectorAll('.seg').forEach(seg => {
    const lab = seg.querySelector('.seglab'); if (!lab) return;
    if (!shown(seg) || lab.dataset.len / mpp < 70) { lab.classList.add('hide'); return; }
    const x = +lab.dataset.x, y = +lab.dataset.y, bx = [x - 28 * mpp, y - 11 * mpp, x + 28 * mpp, y + 11 * mpp];
    const clash = boxes.some(b => hit(bx, b));
    lab.classList.toggle('hide', clash);
    if (!clash) boxes.push(bx);
  });
  v.svg.classList.toggle('zin', mpp < 1.7);                   // names only when there is room
}
function mapFit(box) {                                         // box: [[lat,lng],[lat,lng]] or 'oq' or nothing (= what is shown)
  const v = MAPV;
  let xs, ys;
  if (box) {
    const b = box === 'oq' ? [[21.0255, 105.8455], [21.0390, 105.8545]] : box;
    xs = b.map(p => MX(p[1])); ys = b.map(p => MY(p[0]));
  } else {
    const ps = [...v.svg.querySelectorAll('.pin')].filter(g => !g.classList.contains('dim') && !g.classList.contains('off'));
    xs = ps.map(g => +g.dataset.x); ys = ps.map(g => +g.dataset.y);
  }
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  // keep pins clear of the Hotel button / legend (top) and the zoom buttons (bottom): padding in screen pixels
  const W = v.wrap.clientWidth, Hh = v.wrap.clientHeight, P = { l: 34, r: 34, t: v.part && v.sel === '4' ? 120 : 82, b: 82 };
  const bw = Math.max(350, x1 - x0), bh = Math.max(350, y1 - y0);
  const mpp = Math.max(bw / (W - P.l - P.r), bh / (Hh - P.t - P.b));
  const w = W * mpp, cx = (x0 + x1) / 2 - (P.l - P.r) / 2 * mpp, cy = (y0 + y1) / 2 - (P.t - P.b) / 2 * mpp;
  v.vb = { x: cx - w / 2, y: cy - Hh * mpp / 2, w, h: Hh * mpp };
  mapApply();
}
function mapZoom(f, cx, cy) {                                  // cx, cy in screen px inside the map
  const v = MAPV, W = v.wrap.clientWidth, Hh = v.wrap.clientHeight;
  if (cx == null) { cx = W / 2; cy = Hh / 2; }
  const nw = Math.min(14000, Math.max(220, v.vb.w * f)), k = nw / v.vb.w;
  const mx = v.vb.x + cx / W * v.vb.w, my = v.vb.y + cy / Hh * v.vb.h;
  v.vb = { x: mx - (mx - v.vb.x) * k, y: my - (my - v.vb.y) * k, w: nw, h: v.vb.h * k };
  mapApply();
}
function mapDefaultPart() {
  const cur = currentTripDay();
  if (!cur.before && !cur.after && cur.day.day === 4) {
    const [h, m] = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
    return h * 60 + m >= 12 * 60 + 30 ? 'pm' : 'am';
  }
  return 'am';
}
function mapFilter(sel, part) {
  const v = MAPV; v.sel = sel;
  v.part = MAP_SPLIT[sel] ? (part || v.part || mapDefaultPart()) : '';
  document.querySelectorAll('.mchip').forEach(b => b.setAttribute('aria-pressed', b.dataset.mday === sel));
  const mp = document.getElementById('mpart'); mp.hidden = !v.part;
  mp.querySelectorAll('[data-mpart]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mpart === v.part));
  v.svg.querySelectorAll('[data-day],[data-days]').forEach(el => {
    const ds = (el.dataset.days || el.dataset.day).split(' ');
    el.classList.toggle('dim', sel !== 'all' && !ds.includes(sel));            // other days: hidden
    el.classList.toggle('off', !!v.part && v.part !== 'all' && !!el.dataset.part && el.dataset.part !== v.part);
  });
  v.svg.classList.toggle('alldays', sel === 'all');
  mapFit();
}

/* ---------- Tap card ---------- */
function mapCard(id) {
  const v = MAPV, card = document.getElementById('mapcard');
  if (!id) { card.hidden = true; return; }
  const H = DATA.trip.hotel;
  const hit = v.D.places.find(x => x.s.id === id) || v.D.meals.find(x => x.s.id === id);
  const s = id === 'hotel' ? { id: 'hotel', en: H.en, addr_vi: H.address_vi, addr_en: `${H.en}, ${H.address_en}`, go: H.go, lat: H.lat, lng: H.lng } : hit.s;
  const day = hit?.day || (hit?.days && DATA.trip.days.find(d => d.day === [...hit.days][0]));
  const isMeal = hit && !hit.no;
  let warn = '';
  if (s.closes && day && vnDate() === day.date) {
    const m = /(\d+):(\d+) (am|pm)/.exec(s.closes);
    if (m) {
      const close = (+m[1] % 12 + (m[3] === 'pm' ? 12 : 0)) * 60 + +m[2];
      const [hh, mm] = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
      const now = hh * 60 + mm;
      if (now >= close) warn = `<p class="mwarn">⛔ Closed now — it closed at ${esc(s.closes)}</p>`;
      else if (close - now <= 45) warn = `<p class="mwarn">⚠️ Closes soon — at ${esc(s.closes)}</p>`;
    }
  }
  let near = '';
  if (v.me && s.lat != null) {
    const km = haversineKm(v.me, s), m = Math.round(km * 1.3 * 1000 / 50) * 50;
    near = `<p class="mnear">📍 You are ${km < 1 ? m + ' m' : (km * 1.3).toFixed(1) + ' km'} away · ${km < 1.5 ? `about ${Math.max(2, Math.round(km * 1.3 / 4.5 * 60))} min walk` : 'take a cab'}</p>`;
  }
  const driverId = id === 'hotel' ? 'hotel-' + Math.max(1, currentTripDay().day?.day || 1) : s.id;
  const name = isMeal ? (s.den || s.en) : s.en;
  const meta = id === 'hotel' ? 'Your hotel — start and end of every day'
    : isMeal ? `Meal · ${[...hit.days].map(n => MAP_TAG[n]).join(', ')}`
    : `${MAP_TAG[hit.n]} ${esc(dayLabel(day).split(' · ')[1])} · Place ${hit.no} · ${esc(stopTimeLabel(day, s))}${s.closes ? ` · closes ${esc(s.closes)}` : ''}`;
  card.innerHTML = `<button type="button" class="mclose" data-mclose aria-label="Close">✕</button>
    <h3>${id === 'hotel' ? '★' : isMeal ? '🍽' : MAP_ICON[id] || '📍'} ${esc(name)}</h3>
    <p class="muted small">${meta}</p>${warn}${near}
    ${s.addr_vi ? `<p class="maddr" lang="vi">${esc(s.addr_vi)}</p><p class="muted small">${esc(s.addr_en || '')}</p>` : ''}
    <div class="actions">
      <a class="btn green" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.go || s.addr_en)}&travelmode=${s.walk ? 'walking' : 'driving'}" target="_blank" rel="noopener">▶ Go</a>
      <a class="btn secondary" href="#driver:${esc(driverId)}">🚕 Show driver</a>
      <button type="button" class="btn secondary" data-mcopy="${esc(s.go || s.addr_en || '')}">📋 Copy address</button>
      ${id !== 'hotel' ? `<a class="btn secondary" href="#plan:${esc(s.id)}">📅 Open in Plan</a>` : ''}
    </div>`;
  card.hidden = false;
}

/* ---------- Screen life cycle ---------- */
function startMap() {
  document.body.classList.add('onmap');
  const wrap = document.getElementById('mapwrap'), svg = document.getElementById('mapsvg');
  const D = mapData(), p = routeParam();
  MAPV = { wrap, svg, D, vb: { x: 0, y: 0, w: MW, h: MH }, sel: 'all', part: '', me: null };
  const size = () => { wrap.style.height = Math.max(320, innerHeight - wrap.getBoundingClientRect().top - (document.querySelector('.tabbar')?.offsetHeight || 64) - 6) + 'px'; };
  size();
  const sel = document.querySelector('.mchip[aria-pressed="true"]')?.dataset.mday || 'all';
  const hitP = p && D.places.find(x => x.s.id === p);
  mapFilter(sel, hitP && MAP_SPLIT[hitP.n] ? hitP.part : undefined);
  // NEXT pulses (same NEXT as Plan)
  const cur = currentTripDay();
  if (!cur.before && !cur.after) { const n = dayNextStop(cur.day); n && svg.querySelector(`[data-pin="${n.id}"]`)?.classList.add('next'); }
  if (p && !/^day/.test(p)) {                                 // opened for one place (Today "See on map")
    const hit = D.places.concat(D.meals).find(x => x.s.id === p);
    if (hit) { const s = hit.s.lat != null ? hit.s : hit.pt; mapFit([[s.lat - 0.004, s.lng - 0.004], [s.lat + 0.004, s.lng + 0.004]]); mapCard(p); }
  }

  // Gestures: drag to move, pinch / wheel to zoom, tap a pin for its card
  const ptrs = new Map(); let moved = 0, last = null;
  const local = e => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = e => { if (e.target.closest('.mapctl,.mapcard,.maphotel,.mpart,.mapnote')) return; svg.setPointerCapture?.(e.pointerId); ptrs.set(e.pointerId, local(e)); moved = 0; last = null; };
  const move = e => {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId), now = local(e); ptrs.set(e.pointerId, now);
    const v = MAPV, mpp = v.vb.w / wrap.clientWidth;
    if (ptrs.size === 1) {
      moved += Math.abs(now[0] - prev[0]) + Math.abs(now[1] - prev[1]);
      v.vb.x -= (now[0] - prev[0]) * mpp; v.vb.y -= (now[1] - prev[1]) * mpp; mapApply();
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (last) mapZoom(last / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      last = d; moved = 99;
    }
  };
  const up = e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId); if (ptrs.size < 2) last = null;
    if (moved < 10 && ptrs.size === 0) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pin]');
      mapCard(el && !el.classList.contains('dim') ? el.dataset.pin : null);
    }
  };
  const wheel = e => { e.preventDefault(); const [x, y] = local(e); mapZoom(e.deltaY > 0 ? 1.2 : 1 / 1.2, x, y); };
  const click = async e => {
    const c = e.target.closest('[data-mday]'); if (c) { mapCard(null); return mapFilter(c.dataset.mday); }
    const pt = e.target.closest('[data-mpart]'); if (pt) { mapCard(null); return mapFilter(MAPV.sel, pt.dataset.mpart); }
    if (e.target.closest('#mapnote')) { e.target.closest('#mapnote').hidden = true; MAPV.noteOff = true; return; }
    const z = e.target.closest('[data-mz]');
    if (z) {
      const k = z.dataset.mz;
      if (k === 'in') mapZoom(1 / 1.6); else if (k === 'out') mapZoom(1.6); else if (k === 'fit') mapFit(); else if (k === 'oq') mapFit('oq');
      else if (k === 'me' && MAPV.me) mapFit([[MAPV.me.lat - 0.003, MAPV.me.lng - 0.003], [MAPV.me.lat + 0.003, MAPV.me.lng + 0.003]]);
      return;
    }
    if (e.target.closest('[data-mclose]')) return mapCard(null);
    const cp = e.target.closest('[data-mcopy]');
    if (cp) {
      try { await navigator.clipboard.writeText(cp.dataset.mcopy); toast('Address copied ✓ — paste it in Grab'); }
      catch (err) { toast('Could not copy — use Show driver.', 3000); }
    }
  };
  svg.addEventListener('pointerdown', down); svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', wheel, { passive: false });
  const main = document.getElementById('screen'); main.addEventListener('click', click);
  addEventListener('resize', size);

  // GPS blue dot
  let watch = null;
  if ('geolocation' in navigator) {
    watch = navigator.geolocation.watchPosition(pos => {
      const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }; MAPV.me = me;
      const dot = document.getElementById('medot'), inside = me.lat > MB.latMin && me.lat < MB.latMax && me.lng > MB.lngMin && me.lng < MB.lngMax;
      dot.dataset.x = MX(me.lng); dot.dataset.y = MY(me.lat); mapApply();
      const note = document.getElementById('mapnote');
      note.hidden = inside || !!MAPV.noteOff; note.textContent = 'You are outside this city map — the blue dot appears in Hanoi. ✕';
      document.querySelector('[data-mz="me"]').hidden = !inside;
    }, () => {}, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }
  return () => {
    document.body.classList.remove('onmap');
    if (watch != null) navigator.geolocation.clearWatch(watch);
    main.removeEventListener('click', click); removeEventListener('resize', size);
    MAPV = null;
  };
}

ROUTES.map = { title: 'Map', tab: 'map', render: renderMap, after: startMap };
