/* RS Vietnam Trip — Emergency screen + "Show this card" help card (Phase 8). Data: data/emergency.json */
'use strict';

const telHref = n => 'tel:+' + digits(n);
const mapHref = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const hotelDay = () => { const d = currentTripDay().day.day; return d >= 1 ? d : 1; };

/* v1.2: Emergency home = one big help-card button + tiles. Each tile opens one small page. */
const EM_TILES = [
  ['hotel', '🏨', 'Hotel', 'ಹೋಟೆಲ್'], ['family', '👪', 'Family', 'ಮನೆಯವರು'],
  ['call', '🚓', 'Police · Ambulance', 'ಪೊಲೀಸ್ · ಆಂಬುಲೆನ್ಸ್'], ['embassy', '🇮🇳', 'Indian Embassy', 'ಭಾರತ ರಾಯಭಾರ ಕಚೇರಿ'],
  ['hosp', '🏥', 'Hospitals', 'ಆಸ್ಪತ್ರೆ'], ['mine', '📒', 'My numbers', 'ನನ್ನ ನಂಬರ್‌ಗಳು']
];
function renderEmergency() {
  if (!DATA.emergency) return renderSOS();
  return `<a class="btn sos-big" href="#helpcard">🆘 Show help card to anyone</a>
    <div class="grid">${EM_TILES.map(([id, ic, en, kn]) =>
      `<a class="tile area${id === 'call' ? ' danger' : ''}" href="#em:${id}"><span>${ic}</span><span>${en}</span><span class="kn small">${kn}</span></a>`).join('')}
      <a class="tile area" href="#print"><span>🖨</span><span>Print sheet</span><span class="kn small">ಮುದ್ರಿಸಿ</span></a>
    </div>
    <p class="muted small center">Details checked Oct 2026. <span class="kn">ಅಕ್ಟೋಬರ್ 2026ರಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.</span></p>`;
}

function renderEmPage() {
  const E = DATA.emergency, s = getSettings(), id = routeParam();
  const t = EM_TILES.find(x => x[0] === id);
  if (!E || !t) return `<div class="card"><p>Not found.</p></div>`;
  document.getElementById('screen-title').textContent = t[2];
  const em = E.embassy, h = DATA.trip.hotel, tel = digits(s.hotelPhone);
  switch (id) {
    case 'hotel': return `<section class="card accent"><h3>🏨 ${esc(h.en)}</h3><p class="vi">${esc(h.driver_vi)}</p><p>${esc(h.address_en)}</p></section>
      <a class="btn" href="#driver:hotel-${hotelDay()}">🚕 Take me to hotel</a>
      ${tel ? `<a class="btn green" href="tel:+${tel}">📞 Call hotel</a>` : '<a class="btn secondary" href="#settings">Add hotel phone in Settings</a>'}`;
    case 'family': return renderFamilySOS();
    case 'call': return `<p class="kn">ತುರ್ತು ಸಂಖ್ಯೆಗಳು — ಒತ್ತಿದರೆ ಕರೆ ಹೋಗುತ್ತದೆ</p>
      <a class="btn" href="tel:113">🚓 Police — 113</a>
      <a class="btn" href="tel:115">🚑 Ambulance — 115</a>
      <a class="btn" href="tel:114">🚒 Fire — 114</a>`;
    case 'embassy': return `<section class="card"><h3>🇮🇳 ${esc(em.en)}</h3>
      <p class="vi">${esc(em.vi)}</p>
      <p>${esc(em.addr_en)}<br><span class="muted small">${esc(em.hours)}</span><br><span class="kn">${esc(em.hours_kn || '')}</span></p></section>
      <a class="btn" href="${telHref(em.emergency)}">📞 Emergency: ${esc(em.emergency)}</a>
      <a class="btn secondary" href="${telHref(em.phone)}">📞 Office: ${esc(em.phone)}</a>
      <div class="actions">
        <a class="btn secondary" href="${mapHref(em.q)}" target="_blank" rel="noopener">📍 Map</a>
        <a class="btn secondary" href="#driver:embassy">🚕 Show driver</a>
      </div>
      <p class="muted small">Lost passport? Go here. <span class="kn">ಪಾಸ್‌ಪೋರ್ಟ್ ಕಳೆದುಹೋದರೆ ಇಲ್ಲಿಗೆ ಹೋಗಿ.</span></p>`;
    case 'hosp': return `<p class="kn">ಇಂಗ್ಲಿಷ್ ಮಾತನಾಡುವ ಆಸ್ಪತ್ರೆಗಳು</p>${E.hospitals.map(x => `<section class="card">
        <p><strong>${esc(x.en)}</strong><br><span class="vi">${esc(x.vi)}</span><br>${esc(x.addr_en)}<br>${esc(x.note_en)}<br><span class="kn">${esc(x.note_kn)}</span></p>
        <a class="btn" href="${telHref(x.phone)}">📞 ${esc(x.phone)}</a>
        <div class="actions">
          <a class="btn secondary" href="${mapHref(x.q)}" target="_blank" rel="noopener">📍 Map</a>
          <a class="btn secondary" href="#driver:${x.id}">🚕 Show driver</a>
        </div></section>`).join('')}`;
    case 'mine': {
      const mine = [['🏨 Hotel', s.hotelPhone], ['🚢 Cruise', s.cruisePhone], ['⚡ Express immigration', s.fasttrackPhone], ['🚗 Ninh Binh driver', s.driverPhone], ['🛡 Insurance helpline', s.insurancePhone]]
        .filter(([, n]) => digits(n));
      return `${mine.length ? mine.map(([l, n]) => `<a class="btn secondary" href="${telHref(n)}">${l}: ${esc(n)}</a>`).join('')
        : '<p class="muted">Add numbers in Settings.</p>'}
        <a class="btn secondary" href="#settings">⚙ Edit in Settings</a>`;
    }
  }
}

/* ----- Help card: full screen, big Vietnamese (F05: hotel first) ----- */
function renderHelpCard() {
  const E = DATA.emergency, s = getSettings(), h = DATA.trip.hotel;
  const nums = [['Hotel', s.hotelPhone], [s.c1Name || 'Family', s.c1Phone], [s.c2Name || 'Family', s.c2Phone]]
    .filter(([, n]) => digits(n));
  return `<section class="driver">
    <p class="dr-name" style="font-size:clamp(24px,7vw,34px)">${esc(E.help_vi)}</p>
    ${nums.map(([l, n]) => `<a class="help-num" href="${telHref(n)}">${esc(n)}<span>${esc(l)}</span></a>`).join('')
      || '<p class="todo">Add phone numbers in Settings.</p>'}
    <p class="dr-ask">Khách sạn của chúng tôi / Our hotel:</p>
    <p class="dr-addr">${esc(h.driver_vi)}</p>
    <a class="btn" href="#driver:hotel-${hotelDay()}">🚕 Take me to hotel</a>
    ${s.medical ? `<p class="help-med"><strong>Y tế / Medical:</strong> ${esc(s.medical)}</p>` : ''}
    <hr>
    <p class="dr-en">${esc(E.help_en)}</p>
    <p class="kn" style="color:#333">${esc(E.help_kn)}</p>
  </section>`;
}

/* ----- U4: printable one-page help sheet ----- */
function renderPrint() {
  const E = DATA.emergency, s = getSettings(), h = DATA.trip.hotel;
  const rows = [
    ['Hotel / Khách sạn', s.hotelPhone], [s.c1Name || 'Family 1', s.c1Phone], [s.c2Name || 'Family 2', s.c2Phone],
    ['Indian Embassy emergency', E.embassy.emergency], ['Police / Công an', '113'], ['Ambulance / Cấp cứu', '115'], ['Fire / Cứu hỏa', '114'],
    ['Insurance helpline', s.insurancePhone], ['Cruise', s.cruisePhone], ['Ninh Binh driver', s.driverPhone]
  ].filter(([, n]) => n);
  return `<button type="button" class="btn no-print" onclick="window.print()">🖨 Print / Save as PDF</button>
    <section class="printsheet">
      <h2>RS Vietnam Trip — Help sheet</h2>
      <p class="ps-vi">${esc(E.help_vi)}</p>
      <p>${esc(E.help_en)}</p>
      <h3>Hotel / Khách sạn</h3>
      <p class="ps-vi">${esc(h.driver_vi)}</p><p>${esc(h.en)}, ${esc(h.address_en)}</p>
      <h3>Phone numbers</h3>
      <table class="ps-table">${rows.map(([l, n]) => `<tr><td>${esc(l)}</td><td><strong>${esc(n)}</strong></td></tr>`).join('')}</table>
      ${s.medical ? `<h3>Medical / Y tế</h3><p>${esc(s.medical)}</p>` : ''}
      <p class="ps-kn kn">${esc(E.help_kn)}</p>
    </section>`;
}

ROUTES.emergency.render = renderEmergency;
ROUTES.helpcard = { title: 'Help card', tab: '', back: 'emergency', render: renderHelpCard,
  after: () => { document.body.classList.add('fullscreen'); return () => document.body.classList.remove('fullscreen'); } };
ROUTES.em = { title: 'Emergency', tab: 'more', back: 'emergency', render: renderEmPage };
ROUTES.print = { title: 'Help sheet', tab: 'more', back: 'emergency', render: renderPrint };

// U1: SOS screen — Take me to hotel first, then help card, family, emergency numbers, embassy
ROUTES.sos.render = () => `<a class="btn" href="#driver:hotel-${hotelDay()}">🏨 Take me to hotel</a>
  <a class="btn sos-big" href="#helpcard">🆘 Show help card</a>
  ${renderSOS()}
  ${DATA.emergency ? `<a class="btn secondary" href="${telHref(DATA.emergency.embassy.emergency)}">🇮🇳 Indian Embassy emergency</a>
  <a class="btn secondary" href="#emergency">More: hospitals, embassy, police ›</a>` : ''}`;
