/* RS Vietnam Trip — Today screen (Phase 2)
   Greeting, two live clocks, Now / Next card, progress rings. */
'use strict';

function renderToday() {
  if (!DATA.trip) return `<div class="card"><h2>Trip data not loaded</h2>
    <p>Close the app and open it again.</p><p class="kn">ಆ್ಯಪ್ ಮುಚ್ಚಿ ಮತ್ತೆ ತೆರೆಯಿರಿ.</p></div>`;

  const cur = currentTripDay();
  const day = cur.day;

  let banner = '';
  if (cur.before) banner = `<div class="banner gold">
      <strong>Trip starts in ${cur.daysLeft} day${cur.daysLeft > 1 ? 's' : ''}</strong>
      <span class="kn">ಪ್ರಯಾಣಕ್ಕೆ ಇನ್ನು ${cur.daysLeft} ದಿನ</span></div>`;
  if (cur.after) banner = `<div class="banner green">
      <strong>Welcome home! 🙏</strong><span class="kn">ಮನೆಗೆ ಸ್ವಾಗತ!</span></div>`;

  return `${banner}
    <section class="card hello">
      <h2>Namaskara 🙏 <span class="kn">ನಮಸ್ಕಾರ</span></h2>
      <p class="dayline">${esc(dayLabel(day))}</p>
      <p>${esc(day.title_en)}<br><span class="kn muted">${esc(day.title_kn)}</span></p>
    </section>

    <section class="clocks" aria-label="Clocks">
      <div class="clock"><div class="clabel">🇮🇳 India</div>
        <div class="ctime" id="clock-in">--:--</div><div class="cdate" id="date-in"></div></div>
      <div class="clock"><div class="clabel">🇻🇳 Vietnam</div>
        <div class="ctime" id="clock-vn">--:--</div><div class="cdate" id="date-vn"></div></div>
    </section>
    <p class="muted small center">Vietnam is 1½ hours ahead of India.<br>
      <span class="kn">ವಿಯೆಟ್ನಾಂ ಸಮಯ ಭಾರತಕ್ಕಿಂತ 1½ ಗಂಟೆ ಮುಂದೆ.</span></p>

    <div id="nownext">${renderNowNext(cur)}</div>
    ${renderProgress(day)}
    ${renderAsk(['What should we do if we finish early?', 'We are tired. What is an easy plan for the rest of today?'],
      `Today is ${dayLabel(day)}: ${day.title_en}. Plan: ${day.stops.map(s => s.time + ' ' + s.en).join('; ')}. Hotel in Hanoi Old Quarter (Bat Su street).`)}`;
}

function stopRow(day, s, label) {
  return `<a class="stoprow" href="#plan:${esc(s.id)}">
    <span class="tag">${label}</span>
    <span class="sicon" aria-hidden="true">${STOP_ICON[s.type] || '📍'}</span>
    <span class="sbody">
      <strong>${esc(s.en)}</strong>
      <span class="kn muted">${esc(s.kn)}</span>
      <span class="stime">${esc(stopTimeLabel(day, s))}</span>
    </span>
    <span class="chev" aria-hidden="true">›</span>
  </a>`;
}

function renderNowNext(cur) {
  if (cur.after) return '';
  const day = cur.day;
  const now = new Date();
  let { nowStop, nextStop } = nowNext(day, now);
  if (cur.before) nowStop = null;

  // Day finished → point to the first stop of tomorrow
  let nextDay = day;
  if (!nextStop) {
    const days = DATA.trip.days;
    const nd = days[days.indexOf(day) + 1];
    if (nd) { nextDay = nd; nextStop = nd.stops[0]; }
  }

  let html = '<section class="card nn">';
  if (nowStop) html += stopRow(day, nowStop, 'NOW');
  else if (!cur.before) html += `<p class="muted">Nothing planned right now.<br><span class="kn">ಈಗ ಯಾವುದೇ ಯೋಜನೆ ಇಲ್ಲ.</span></p>`;
  if (nextStop) html += stopRow(nextDay, nextStop, nextDay === day ? 'NEXT' : 'TOMORROW');
  return html + '</section>';
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
  <p class="muted small center">Tick places in Plan.<br><span class="kn">"Plan" ನಲ್ಲಿ ನೋಡಿದ ಸ್ಥಳಗಳನ್ನು ಟಿಕ್ ಮಾಡಿ.</span></p>`;
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
ROUTES.today.after = startTodayClocks;
