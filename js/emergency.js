/* RS Vietnam Trip — Emergency screen + "Show this card" help card (Phase 8). Data: data/emergency.json */
'use strict';

const telHref = n => 'tel:+' + digits(n);
const mapHref = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function renderEmergency() {
  const E = DATA.emergency;
  const s = getSettings();
  if (!E) return renderSOS();
  const mine = [['🏨 Hotel', s.hotelPhone], ['🚢 Cruise', s.cruisePhone], ['🛡 Insurance helpline', s.insurancePhone]]
    .filter(([, n]) => digits(n));
  const em = E.embassy;

  return `<a class="btn sos-big" href="#helpcard">🆘 Show help card to anyone <span class="kn">ಯಾರಿಗಾದರೂ ಈ ಕಾರ್ಡ್ ತೋರಿಸಿ</span></a>
    ${renderSOS()}

    <section class="card">
      <h2>🇮🇳 ${esc(em.en)}</h2>
      <p class="vi">${esc(em.vi)}</p>
      <p>${esc(em.addr_en)}<br><span class="muted small">${esc(em.hours)}</span></p>
      <a class="btn" href="${telHref(em.emergency)}">📞 Emergency: ${esc(em.emergency)}</a>
      <a class="btn secondary" href="${telHref(em.phone)}">📞 Office: ${esc(em.phone)}</a>
      <div class="actions">
        <a class="btn secondary" href="${mapHref(em.q)}" target="_blank" rel="noopener">📍 Map</a>
        <a class="btn secondary" href="#driver:embassy">🚕 Show driver</a>
      </div>
      <p class="muted small">Lost passport? Go here. <span class="kn">ಪಾಸ್‌ಪೋರ್ಟ್ ಕಳೆದುಹೋದರೆ ಇಲ್ಲಿಗೆ ಹೋಗಿ.</span></p>
    </section>

    <h3 class="sect">🏥 Hospitals (English-speaking) <span class="kn muted">ಆಸ್ಪತ್ರೆಗಳು</span></h3>
    ${E.hospitals.map(h => `<section class="card">
      <h3>${esc(h.en)}</h3><p class="vi">${esc(h.vi)}</p>
      <p>${esc(h.addr_en)}<br><strong>${esc(h.note_en)}</strong><br><span class="kn">${esc(h.note_kn)}</span></p>
      <a class="btn" href="${telHref(h.phone)}">📞 ${esc(h.phone)}</a>
      <div class="actions">
        <a class="btn secondary" href="${mapHref(h.q)}" target="_blank" rel="noopener">📍 Map</a>
        <a class="btn secondary" href="#driver:${h.id}">🚕 Show driver</a>
      </div></section>`).join('')}

    <section class="card">
      <h3>📒 My numbers <span class="kn muted">ನನ್ನ ನಂಬರ್‌ಗಳು</span></h3>
      ${mine.length ? mine.map(([l, n]) => `<a class="btn secondary" href="${telHref(n)}">${l}: ${esc(n)}</a>`).join('')
        : '<p class="muted">Add numbers in Settings.</p>'}
      <a class="btn secondary" href="#settings">⚙ Edit in Settings</a>
    </section>
    <p class="muted small center">Details checked Oct 2026. <span class="kn">ಅಕ್ಟೋಬರ್ 2026ರಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.</span></p>`;
}

/* ----- Help card: full screen, big Vietnamese ----- */
function renderHelpCard() {
  const E = DATA.emergency, s = getSettings();
  const nums = [[s.c1Name || 'Family', s.c1Phone], [s.c2Name || 'Family', s.c2Phone], ['Hotel', s.hotelPhone]]
    .filter(([, n]) => digits(n));
  return `<section class="driver">
    <p class="dr-name" style="font-size:clamp(24px,7vw,34px)">${esc(E.help_vi)}</p>
    ${nums.map(([l, n]) => `<a class="help-num" href="${telHref(n)}">${esc(n)}<span>${esc(l)}</span></a>`).join('')
      || '<p class="todo">Add phone numbers in Settings.</p>'}
    ${s.medical ? `<p class="help-med"><strong>Y tế / Medical:</strong> ${esc(s.medical)}</p>` : ''}
    <hr>
    <p class="dr-en">${esc(E.help_en)}</p>
    <p class="kn" style="color:#333">${esc(E.help_kn)}</p>
  </section>`;
}

ROUTES.emergency.render = renderEmergency;
ROUTES.helpcard = { title: 'Help card', tab: '', back: 'emergency', render: renderHelpCard,
  after: () => { document.body.classList.add('fullscreen'); return () => document.body.classList.remove('fullscreen'); } };

// Quick SOS screen (red button): help card first, then WhatsApp location + calls, then embassy
ROUTES.sos.render = () => `<a class="btn sos-big" href="#helpcard">🆘 Show help card <span class="kn">ಸಹಾಯ ಕಾರ್ಡ್ ತೋರಿಸಿ</span></a>
  ${renderSOS()}
  ${DATA.emergency ? `<a class="btn secondary" href="${telHref(DATA.emergency.embassy.emergency)}">🇮🇳 Indian Embassy emergency</a>
  <a class="btn secondary" href="#emergency">More: hospitals, embassy ›</a>` : ''}`;
