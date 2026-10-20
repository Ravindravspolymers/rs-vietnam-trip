/* RS Vietnam Trip — Plan screen (Phase 3)
   Day selector, destination cards, Go (Google Maps), visited ticks, driver cards,
   travel-time estimates and long-drive warning. Visit order is fixed in data/trip.json. */
'use strict';

const TYPE_LABEL = {
  home: 'Home', airport: 'Airport', hotel: 'Hotel', lake: 'Lake', cruise: 'Cruise',
  boat: 'Boat', temple: 'Temple', market: 'Market', theatre: 'Show', viewpoint: 'Viewpoint', meal: 'Meal'
};
const LONG_DRIVE_MINS = 150;   // F35: also flagged per day in trip.json (longDrive)

/* ----- Travel estimates (no internet needed) ----- */
function haversineKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Returns { mins, mode: 'walk'|'car'|'flight' } or null when no estimate makes sense
function legEstimate(from, to) {
  if (!from || !to || from.lat == null || to.lat == null) return null;
  const km = haversineKm(from, to);
  if (km < 0.2) return null;                       // same place
  if (km > 400) return { mins: 0, mode: 'flight' };
  if (to.walk && km < 2) return { mins: Math.max(5, Math.round(km * 1.3 / 4 * 60)), mode: 'walk' };
  // Road distance ≈ straight line × factor; slower in the city, faster on expressways
  const road = km * (km > 40 ? 1.2 : 1.3);
  const speed = road < 15 ? 18 : road < 50 ? 30 : 55;  // km/h
  return { mins: Math.round(road / speed * 60) + 5, mode: 'car' };
}

const fmtDur = m => {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
};
const fmtDurApprox = m => fmtDur(m < 60 ? Math.round(m / 5) * 5 : Math.round(m / 15) * 15);

// Legs between consecutive stops that have coordinates
function dayLegs(day) {
  const legs = {}; let prev = null, roadTotal = 0;
  for (const s of day.stops) {
    if (s.lat == null) continue;
    const leg = legEstimate(prev, s);
    if (leg) { legs[s.id] = leg; if (leg.mode !== 'flight') roadTotal += leg.mins; }
    prev = s;
  }
  return { legs, roadTotal };
}

/* ----- Which day to show ----- */
function planDayFromParam(param) {
  const days = DATA.trip.days;
  const m = /^day(\d)$/.exec(param);
  if (m) return days.find(d => d.day === Number(m[1]));
  if (param) return days.find(d => d.stops.some(s => s.id === param));
  return null;
}

/* ----- Render ----- */
function renderPlan() {
  if (!DATA.trip) return `<div class="card"><h2>Trip data not loaded</h2><p>Close the app and open it again.</p></div>`;
  const day = planDayFromParam(routeParam()) || currentTripDay().day;
  const visited = getVisited();
  const { legs, roadTotal } = dayLegs(day);

  const chips = DATA.trip.days.map(d => {
    const dt = new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
    return `<a class="daychip" href="#plan:day${d.day}" aria-current="${d === day}">
      <strong>Day ${d.day}</strong><span>${dt.replace(',', '')}</span></a>`;
  }).join('');

  const last = day.stops[day.stops.length - 1];
  const finish = stopEnd(day, last);
  const longDrive = day.longDrive || roadTotal > LONG_DRIVE_MINS;

  const head = `<section class="card dayhead">
      <p class="dayline">${esc(dayLabel(day))}</p>
      <h2>${esc(day.title_en)}</h2>
      <p class="kn muted">${esc(day.title_kn)}</p>
      <p class="daysum">
        ${roadTotal ? `🚗 Road travel about <strong>${fmtDurApprox(roadTotal)}</strong><br>` : ''}
        🏁 Day ends about <strong>${fmtTime(finish, stopTz(day, last))}${stopTz(day, last) !== day.tz ? ' (India time)' : ''}${last.date && last.date !== day.date
          ? ' · ' + new Date(last.date + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
          : ''}</strong>
      </p>
      ${longDrive ? `<p class="drivewarn">Long drive today. Ask the driver to stop for tea and toilet break.<br>
        <span class="kn">ಇಂದು ದೀರ್ಘ ಪ್ರಯಾಣ. ಚಹಾ ಮತ್ತು ಶೌಚಾಲಯಕ್ಕೆ ನಿಲ್ಲಿಸಲು ಚಾಲಕನಿಗೆ ಹೇಳಿ.</span></p>` : ''}
      ${day.day >= 1 ? `<a class="btn secondary" href="#driver:hotel-${day.day}">🏨 Hotel address for driver</a>` : ''}
    </section>`;

  const nextS = dayNextStop(day);          // v1.2: glow the next activity
  const cards = day.stops.map(s => {
    const leg = legs[s.id];
    const fade = visited[s.id] ? ' faded' : '';
    const legHtml = !leg ? '' : leg.mode === 'flight'
      ? `<div class="leg${fade}">✈️ Flight</div>`
      : `<div class="leg${fade}">${leg.mode === 'walk' ? '🚶 Walk' : '🚗 Drive'} about ${fmtDurApprox(leg.mins)}</div>`;
    return legHtml + stopCard(day, s, !!visited[s.id], nextS === s);
  }).join('');

  return `<nav class="daybar" aria-label="Days">${chips}</nav>${head}${cards}`;
}

function stopCard(day, s, done, isNext) {
  const hasMap = s.lat != null;
  const mode = s.walk ? 'walking' : 'driving';
  // Navigate by full name + address (robust); fall back to coordinates
  const dest = s.addr_en ? encodeURIComponent(s.addr_en) : `${s.lat},${s.lng}`;
  const goUrl = hasMap ? `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}` : '';
  return `<article class="card stop${done ? ' visited' : ''}${isNext ? ' next' : ''}" id="stop-${esc(s.id)}">
    ${isNext ? '<p class="nextflag">▶ NEXT <span class="kn">ಮುಂದಿನದು</span></p>' : ''}
    <div class="stop-head">
      <span class="sicon" aria-hidden="true">${STOP_ICON[s.type] || '📍'}</span>
      <div>
        <span class="stype">${TYPE_LABEL[s.type] || 'Place'}</span>
        <h3>${esc(s.en)}</h3>
        ${s.vi ? `<p class="vi">${esc(s.vi)}</p>` : ''}
        <p class="kn muted">${esc(s.kn)}</p>
      </div>
    </div>
    <div class="facts">
      <div><span>${['home', 'hotel'].includes(s.type) && s.mins === 0 ? 'Leave' : isPlace(s) || s.type === 'meal' ? 'Arrive' : 'At'}</span>
        <strong>${s.pending ? '⏳ To be confirmed' : esc(stopTimeLabel(day, s))}</strong></div>
      ${s.mins ? `<div><span>Spend</span><strong>${fmtDur(s.mins)}</strong></div>` : ''}
    </div>
    ${s.note_en ? `<div class="tip"><strong>💡 Good to know</strong><p>${esc(s.note_en)}</p><p class="kn">${esc(s.note_kn || '')}</p></div>` : ''}
    ${s.pending ? `<p class="pending">${pendingLine(s)}</p>` : ''}
    ${s.place && DATA.places?.[s.place] ? `<a class="btn story-btn" href="#story:${esc(s.id)}">🎧 Guide story</a>` : ''}
    ${s.airport ? `<a class="btn secondary" href="#airport:${esc(s.airport)}">✈️ Airport steps</a>` : ''}
    ${s.food ? `<a class="btn secondary" href="#food:${esc(s.food)}">🍽 Veg restaurants nearby</a>` : ''}
    <div class="actions">
      ${hasMap ? `<a class="btn green" href="${goUrl}" target="_blank" rel="noopener">▶ Go</a>` : ''}
      ${s.addr_vi ? `<a class="btn secondary" href="#driver:${esc(s.id)}">🚕 Show driver</a>` : ''}
    </div>
    <button type="button" class="tick" data-tick="${esc(s.id)}" aria-pressed="${done}">${tickLabel(done)}</button>
  </article>`;
}

// Card top just under the title bar, with a sliver of the done card above it
function scrollToCard(el, smooth) {
  const bar = document.querySelector('.topbar')?.offsetHeight || 64;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar - 56, behavior: smooth ? 'smooth' : 'auto' });
}
const tickLabel = on => on ? '✓ Done — tap to undo' : '○ Mark done';

// v1.2: re-mark which card glows as NEXT (after a tick / untick), without re-drawing the screen
function refreshNext(day) {
  const n = dayNextStop(day);
  document.querySelectorAll('.stop').forEach(el => {
    const on = !!n && el.id === 'stop-' + n.id;
    el.classList.toggle('next', on);
    const f = el.querySelector('.nextflag');
    if (on && !f) el.insertAdjacentHTML('afterbegin', '<p class="nextflag">▶ NEXT <span class="kn">ಮುಂದಿನದು</span></p>');
    if (!on && f) f.remove();
  });
  return n;
}

function startPlan() {
  const main = document.getElementById('screen');
  const day = planDayFromParam(routeParam()) || currentTripDay().day;
  // Jump to the stop opened from Today (e.g. #plan:d4-temple); otherwise open at the NEXT activity
  const target = document.getElementById('stop-' + routeParam());
  const next = document.querySelector('.stop.next');
  if (target) {
    target.scrollIntoView({ block: 'center' });
    target.classList.add('flash');
  } else if (next && next.previousElementSibling?.matches('.stop, .leg')) {
    scrollToCard(next);
  }
  // Keep the selected day chip in view (scroll the chip bar only, not the page)
  const chip = document.querySelector('.daychip[aria-current="true"]'), bar = chip?.parentElement;
  if (bar) bar.scrollLeft = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;

  const onClick = e => {
    const b = e.target.closest('[data-tick]');
    if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    setVisited(b.dataset.tick, on);
    b.setAttribute('aria-pressed', on);
    b.textContent = tickLabel(on);
    const card = b.closest('.stop');
    card.classList.toggle('visited', on);
    const leg = card.previousElementSibling;
    if (leg?.classList.contains('leg')) leg.classList.toggle('faded', on);
    const n = refreshNext(day);
    if (on && n) setTimeout(() => { const el = document.getElementById('stop-' + n.id); if (el) scrollToCard(el, true); }, 250);
  };
  main.addEventListener('click', onClick);
  return () => main.removeEventListener('click', onClick);
}

/* ----- Driver card (full screen, large Vietnamese) ----- */
function driverTarget() {
  const p = routeParam();
  const trip = DATA.trip;
  if (p.startsWith('hotel-')) {
    const h = trip.hotel;
    return { vi: 'Khách sạn Hanoi Chic Boutique', addr_vi: h.address_vi, en: h.en, addr_en: h.address_en,
             back: /^#(em:|sos|helpcard)/.test(prevHash) ? prevHash.slice(1) : 'plan:day' + p.split('-')[1], hotel: true };   // v1.2: back to where it was opened
  }
  const E = DATA.emergency;
  if (E && p === 'embassy') return { vi: E.embassy.vi, addr_vi: E.embassy.addr_vi, en: E.embassy.en, addr_en: E.embassy.addr_en, back: 'em:embassy' };
  const h = E?.hospitals.find(x => x.id === p);
  if (h) return { vi: h.vi, addr_vi: h.addr_vi, en: h.en, addr_en: h.addr_en, back: 'em:hosp' };
  for (const d of trip.days) {
    const s = d.stops.find(x => x.id === p);
    if (s) return { vi: s.type === 'hotel' ? 'Khách sạn Hanoi Chic Boutique' : s.vi,
                    addr_vi: s.addr_vi, en: s.en, addr_en: s.addr_en, back: 'plan:' + s.id, hotel: s.type === 'hotel' };
  }
  return null;
}

function renderDriver() {
  const t = driverTarget();
  if (!t) return `<div class="card"><p>Place not found.</p></div>`;
  const hotelTel = digits(getSettings().hotelPhone);
  return `<section class="driver">
    <p class="dr-ask">Xin vui lòng đưa tôi đến:</p>
    <p class="dr-name">${esc(t.vi || t.en)}</p>
    <p class="dr-addr">${esc(t.addr_vi || '')}</p>
    <hr>
    <p class="dr-en"><strong>Please take me to:</strong><br>${esc(t.en)}<br>${esc(t.addr_en || '')}</p>
    <p class="kn muted">ಈ ಪರದೆಯನ್ನು ಚಾಲಕನಿಗೆ ತೋರಿಸಿ.</p>
    ${t.hotel && hotelTel ? `<a class="btn green" href="tel:+${hotelTel}">📞 Call hotel</a>` : ''}
  </section>`;
}

function startDriver() {
  document.body.classList.add('fullscreen');
  return () => document.body.classList.remove('fullscreen');
}

ROUTES.plan.render = renderPlan;
ROUTES.plan.after = startPlan;
ROUTES.driver = { title: 'Show Driver', tab: 'plan', back: () => driverTarget()?.back || 'plan',
                  render: renderDriver, after: startDriver };
