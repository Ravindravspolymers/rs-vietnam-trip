/* RS Vietnam Trip — Today screen (Phase 2)
   Greeting, two live clocks, Now / Next card, progress rings. */
'use strict';

function renderToday() {
  if (!DATA.trip) return `<div class="card"><h2>Trip data not loaded</h2>
    <p>Close the app and open it again.</p><p class="kn">ಆ್ಯಪ್ ಮುಚ್ಚಿ ಮತ್ತೆ ತೆರೆಯಿರಿ.</p></div>`;

  const cur = currentTripDay();
  const day = cur.day;

  let banner = '';
  if (cur.before) banner = cur.daysLeft === 1
    ? `<div class="banner gold"><strong>Trip starts tomorrow!</strong><span class="kn">ನಾಳೆ ಪ್ರಯಾಣ!</span></div>`
    : `<div class="banner gold"><strong>Trip starts in ${cur.daysLeft} days</strong><span class="kn">ಪ್ರಯಾಣಕ್ಕೆ ಇನ್ನು ${cur.daysLeft} ದಿನ</span></div>`;
  if (cur.after) banner = `<div class="banner green"><strong>Welcome home! 🙏</strong><span class="kn">ಮನೆಗೆ ಸ್ವಾಗತ!</span></div>`;

  // F17 order: banner → greeting (one line) → Now/Next → hotel → ready/backup → clocks → rings
  // v1.5: during the trip, clocks/progress/helper fold away so NOW/NEXT and the hotel fill the screen
  const during = !cur.before && !cur.after;
  return `${banner}
    ${renderTaskAlerts(cur)}
    <p class="hello1"><strong>Namaskara${getSettings().travellers ? ' ' + esc(getSettings().travellers.replace(/^Mr\s+|Mrs\s+/g, '').replace(' and ', ' & ')) : ''} 🙏</strong> <span class="kn">ನಮಸ್ಕಾರ</span>${cur.after ? '' :
      ` · <span class="dayline">${esc(dayLabel(day))}</span>`}</p>
    <div id="nownext">${renderNowNext(cur)}</div>
    ${cur.after ? '' : (() => { const wd = cur.before || cur.day.day === 0 ? DATA.trip.days[1] : cur.day;
      return `<a class="card wxtoday" href="#plan:day${wd.day}">${cur.before || cur.day.day === 0 ? `<span class="muted small">${esc(dayLabel(wd))} — Hanoi</span>` : ''}<span class="wxline" data-wxline="${wd.day}">${wxLine(wd)}</span></a>`; })()}
    ${renderHotelCard(cur)}
    ${renderReadyCard()}
    ${renderBackupNudge()}
    ${during ? '<details class="card fold"><summary>🕒 Clocks &amp; progress</summary>' : ''}
    <section class="clocks" aria-label="Clocks">
      <div class="clock"><div class="clabel">🇮🇳 India</div>
        <div class="ctime" id="clock-in">--:--</div><div class="cdate" id="date-in"></div></div>
      <div class="clock"><div class="clabel">🇻🇳 Vietnam</div>
        <div class="ctime" id="clock-vn">--:--</div><div class="cdate" id="date-vn"></div></div>
    </section>
    <p class="muted small center">Vietnam is 1½ hours ahead of India.<br>
      <span class="kn">ವಿಯೆಟ್ನಾಂ ಸಮಯ ಭಾರತಕ್ಕಿಂತ 1½ ಗಂಟೆ ಮುಂದೆ.</span></p>
    ${renderProgress(day)}
    ${renderAsk(['What should we do if we finish early?', 'We are tired. What is an easy plan for the rest of today?'],
      `Today is ${dayLabel(day)}: ${day.title_en}. Plan: ${day.stops.map(s => s.time + ' ' + s.en).join('; ')}. Hotel in Hanoi Old Quarter (Bat Su street).`)}
    ${during ? '</details>' : ''}`;
}

// F02: a pending stop never shows a raw TODO — it shows a bilingual "to be confirmed" line
function pendingLine(s) {
  return `⏳ ${esc(s.pending_en || 'Time to be confirmed — ask hotel')} <span class="kn">${esc(s.pending_kn || 'ಸಮಯ ಖಚಿತವಾಗಬೇಕು — ಹೋಟೆಲ್‌ನಲ್ಲಿ ಕೇಳಿ')}</span>`;
}

function stopRow(day, s, label) {
  return `<a class="stoprow" href="#plan:${esc(s.id)}">
    <span class="tag">${label}</span>
    <span class="sicon" aria-hidden="true">${STOP_ICON[s.type] || '📍'}</span>
    <span class="sbody">
      <strong>${esc(s.en)}</strong>
      <span class="kn muted">${esc(s.kn)}</span>
      <span class="stime">${s.pending ? pendingLine(s) : esc(stopTimeLabel(day, s))}</span>
    </span>
    <span class="chev" aria-hidden="true">›</span>
  </a>`;
}

function renderNowNext(cur) {
  if (cur.after) return '';
  const now = new Date();
  const r = tripNowNext(now);
  let html = '<section class="card nn">';
  if (r.inFlight) html += `<p class="inflight">✈️ In flight <span class="kn">ವಿಮಾನದಲ್ಲಿ</span></p>`;
  else if (r.now && !cur.before) html += stopRow(r.now.day, r.now.s, 'NOW');
  else if (!cur.before) html += `<p class="muted">Nothing planned right now.<br><span class="kn">ಈಗ ಯಾವುದೇ ಯೋಜನೆ ಇಲ್ಲ.</span></p>`;
  if (r.next) {
    const soon = r.next.day === cur.day || r.next.start - now < 6 * 3600000;
    html += stopRow(r.next.day, r.next.s, cur.before ? 'FIRST' : soon ? 'NEXT' : 'TOMORROW');
  }
  return html + '</section>';
}

/* U1: compact hotel card on trip days (Days 1–6) */
function renderHotelCard(cur) {
  if (cur.before || cur.after || cur.day.day < 1) return '';
  const h = DATA.trip.hotel, tel = digits(getSettings().hotelPhone);
  return `<section class="card hotelcard">
    <p><strong>🏨 ${esc(h.en)}</strong></p>
    <p class="vi">${esc(h.address_vi)}</p>
    <a class="btn" href="#driver:hotel-${cur.day.day}">🚕 Take me to hotel</a>
    <div class="actions">
      ${tel ? `<a class="btn secondary" href="tel:+${tel}">📞 Call hotel</a>` : ''}
      <a class="btn secondary" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(h.en + ', ' + h.address_en)}&travelmode=walking" target="_blank" rel="noopener">▶ Go</a>
    </div>
  </section>`;
}

/* U3: "Ready?" card before departure (until 23 Nov 6:30 pm IST). Voice rows fill in after render. */
const READY_UNTIL = new Date('2026-11-23T18:30:00+05:30');
function readyChecks() {
  const s = getSettings();
  const docsAt = Store.get('docsChangedAt', 0), bk = Store.get('lastBackup', 0);
  return [
    ['Family phone numbers saved', 'ಮನೆಯವರ ಫೋನ್ ನಂಬರ್ ಉಳಿಸಲಾಗಿದೆ', !!s.c1Phone && normPhone(s.c1Phone).ok, '#settings'],
    ['Cruise phone saved', 'ಹಡಗಿನ ಫೋನ್ ನಂಬರ್ ಉಳಿಸಲಾಗಿದೆ', !!digits(s.cruisePhone), '#settings'],
    ['Insurance helpline saved', 'ವಿಮೆ ಸಹಾಯವಾಣಿ ಉಳಿಸಲಾಗಿದೆ', !!digits(s.insurancePhone), '#settings'],
    ['Storage protected', 'ಸಂಗ್ರಹಣೆ ಸುರಕ್ಷಿತ', !!Store.get('persisted', false), '#docs'],
    ['Backup done after last document change', 'ಕೊನೆಯ ಬದಲಾವಣೆಯ ನಂತರ ಬ್ಯಾಕಪ್ ಆಗಿದೆ', !!bk && bk >= docsAt, '#docs']
  ];
}
function renderReadyCard() {
  if (Date.now() >= READY_UNTIL) return '';
  const row = ([en, kn, ok, href], id = '') => `<a class="readyrow ${ok ? 'ok' : 'no'}" href="${href}"${id ? ` id="${id}"` : ''}>
      <span class="mark">${ok ? '✓' : '✗'}</span><span><strong>${en}</strong><br><span class="kn">${kn}</span></span></a>`;
  return `<section class="card ready"><h3>Ready for the trip? <span class="kn muted">ಪ್ರಯಾಣಕ್ಕೆ ತಯಾರಾ?</span></h3>
    ${readyChecks().map(c => row(c)).join('')}
    ${row(['Kannada voice installed', 'ಕನ್ನಡ ಧ್ವನಿ ಇದೆ', false, '#voicehelp'], 'rv-kn')}
    ${row(['Vietnamese voice installed', 'ವಿಯೆಟ್ನಾಮೀಸ್ ಧ್ವನಿ ಇದೆ', false, '#voicehelp'], 'rv-vi')}
  </section>`;
}
async function fillVoiceChecks() {
  if (!document.getElementById('rv-kn') || typeof getVoicesAsync !== 'function') return;
  const v = await getVoicesAsync();
  [['rv-kn', 'kn-IN'], ['rv-vi', 'vi-VN']].forEach(([id, code]) => {
    const el = document.getElementById(id); if (!el) return;
    const ok = !!pickVoice(v, code);
    el.className = 'readyrow ' + (ok ? 'ok' : 'no'); el.querySelector('.mark').textContent = ok ? '✓' : '✗';
  });
}

/* F23: nudge when documents changed since the last backup */
function renderBackupNudge() {
  const docsAt = Store.get('docsChangedAt', 0), bk = Store.get('lastBackup', 0);
  if (!docsAt || bk >= docsAt) return '';
  return `<a class="banner gold nudge" href="#docs"><strong>💾 Back up your documents</strong><span class="kn">ನಿಮ್ಮ ದಾಖಲೆಗಳ ಬ್ಯಾಕಪ್ ಮಾಡಿ</span></a>`;
}

function ring(done, total, label, labelKn) {
  const r = 34, c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return `<div class="ring">
    <svg viewBox="0 0 80 80" width="96" height="96" aria-hidden="true">
      <circle cx="40" cy="40" r="${r}" class="ring-bg"/>
      <circle cx="40" cy="40" r="${r}" class="ring-fg"
        stroke-dasharray="${(pct * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/>
      <text x="40" y="46" text-anchor="middle" class="ring-txt">${done}/${total}</text>
    </svg>
    <div><strong>${label}</strong><br><span class="kn muted small">${labelKn}</span></div>
  </div>`;
}

function renderProgress(day) {
  const v = getVisited();
  const today = day.stops.filter(isPlace);
  const all = DATA.trip.days.flatMap(d => d.stops.filter(isPlace));
  const count = list => list.filter(s => v[s.id]).length;
  return `<section class="card rings">
    ${today.length ? ring(count(today), today.length, 'Today', 'ಇಂದು ನೋಡಿದ್ದು') : ''}
    ${ring(count(all), all.length, 'Whole trip', 'ಪೂರ್ತಿ ಪ್ರವಾಸ')}
  </section>
  <p class="muted small center">Tick each activity in Plan when done.<br><span class="kn">"Plan" ನಲ್ಲಿ ಮುಗಿದ ಪ್ರತಿ ಕೆಲಸವನ್ನು ಟಿಕ್ ಮಾಡಿ.</span></p>`;
}

function startTodayClocks() {
  const fmt = tz => new Intl.DateTimeFormat('en-IN', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
  const fmtD = tz => new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
  const fIN = fmt(TZ_NAME.IST), fVN = fmt(TZ_NAME.ICT), dIN = fmtD(TZ_NAME.IST), dVN = fmtD(TZ_NAME.ICT);
  let lastMinute = -1;
  const tick = () => {
    const n = new Date();
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('clock-in', fIN.format(n).toLowerCase()); set('clock-vn', fVN.format(n).toLowerCase());
    set('date-in', dIN.format(n).replace(',', '')); set('date-vn', dVN.format(n).replace(',', ''));
    // Refresh Now / Next once a minute
    if (n.getMinutes() !== lastMinute) {
      if (lastMinute !== -1) { const nn = document.getElementById('nownext'); if (nn) nn.innerHTML = renderNowNext(currentTripDay(n)); }
      lastMinute = n.getMinutes();
    }
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}

ROUTES.today.render = renderToday;
ROUTES.today.after = () => { fillVoiceChecks(); wxFetch(); return startTodayClocks(); };
