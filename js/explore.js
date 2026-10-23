/* RS Vietnam Trip — Explore: optional places not in the plan, best first (v1.3).
   Swipe cards (native scroll-snap) + big ‹ › buttons for anyone who doesn't swipe. Data: data/explore.json */
'use strict';

const xList = () => (DATA.explore?.places || []).slice().sort((a, b) => a.rank - b.rank);
const X_KEY = 'xIdx';                                   // last card seen (this session)

function xCard(x, i, n) {
  const go = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(x.addr_en)}&travelmode=${x.mode === 'walk' ? 'walking' : 'driving'}&dir_action=navigate`;   // v1.3.1: starts navigation at once
  return `<article class="xcard" id="${esc(x.id)}" style="--xc:${esc(x.color)}" aria-label="${i + 1} of ${n}: ${esc(x.en)}">
    <a class="xhead" href="${go}" target="_blank" rel="noopener" aria-label="Navigate to ${esc(x.en)}">
      <span class="xrank">#${x.rank}</span><span class="xtag">${esc(x.tag)}</span>
      <span class="xicon" aria-hidden="true">${x.icon}</span>
      <span class="xdist">${x.mode === 'walk' ? '🚶' : '🚗'} ${esc(x.km)} km · ~${x.mins} min</span>
      <span class="xnavhint">📍 Tap to navigate</span>
    </a>
    <div class="xbody">
      <h2><a class="xname" href="${go}" target="_blank" rel="noopener">${esc(x.en)} <span aria-hidden="true">📍</span></a></h2>
      <p class="vi">${esc(x.vi)}</p>
      <p class="kn muted">${esc(x.kn)}</p>
      <p class="xh">✨ Why it's great</p>
      <p>${esc(x.why_en)}</p><p class="kn">${esc(x.why_kn)}</p>
      <p class="xh">🕒 Best time</p>
      <p>${esc(x.best_en)}</p><p class="kn">${esc(x.best_kn)}</p>
      <p class="xfits">📅 Fits your plan: <strong>${esc(x.fits_en)}</strong><br><span class="kn">${esc(x.fits_kn)}</span></p>
      <ul class="xfacts">
        <li>🦵 ${esc(x.walk_en)}<br><span class="kn">${esc(x.walk_kn)}</span></li>
        <li>🎟 ${esc(x.entry)}</li>
      </ul>
      <div class="tip"><strong>💡 Tip</strong><p>${esc(x.tip_en)}</p><p class="kn">${esc(x.tip_kn)}</p></div>
      <div class="actions">
        <a class="btn green" href="${go}" target="_blank" rel="noopener">▶ Go now</a>
        <a class="btn secondary" href="#driver:${esc(x.id)}">🚕 Show driver</a>
      </div>
    </div>
  </article>`;
}

function renderExplore() {
  const list = xList();
  if (!list.length) return `<div class="card"><p>Not loaded. Close and reopen the app.</p></div>`;
  return `<p class="xintro">Optional extra places — only if you feel fresh. Best first.<br>
      <span class="kn">ಹೆಚ್ಚುವರಿ ಸ್ಥಳಗಳು — ಆಯಾಸವಿಲ್ಲದಿದ್ದರೆ ಮಾತ್ರ. ಉತ್ತಮವಾದದ್ದು ಮೊದಲು.</span></p>
    <div class="xnav">
      <button type="button" class="xbtn" id="xprev" aria-label="Previous place">‹</button>
      <p class="xcount"><strong id="xnum">1</strong> of ${list.length}<span>Swipe ← → <span class="kn">ಸರಿಸಿ</span></span></p>
      <button type="button" class="xbtn" id="xnext" aria-label="Next place">›</button>
    </div>
    <div class="xdots" aria-hidden="true">${list.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
    <div class="xtrack" id="xtrack">${list.map((x, i) => xCard(x, i, list.length)).join('')}</div>`;
}

function startExplore() {
  const track = document.getElementById('xtrack');
  if (!track) return;
  const cards = [...track.querySelectorAll('.xcard')];
  const num = document.getElementById('xnum'), dots = [...document.querySelectorAll('.xdots i')];
  const prev = document.getElementById('xprev'), next = document.getElementById('xnext');
  let idx = 0;

  const nearest = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, d = Infinity;
    cards.forEach((c, i) => { const m = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (m < d) { d = m; best = i; } });
    return best;
  };
  const mark = i => {
    idx = i;
    num.textContent = i + 1;
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    cards.forEach((c, k) => c.classList.toggle('active', k === i));
    prev.disabled = i === 0; next.disabled = i === cards.length - 1;
    try { sessionStorage.setItem('rs.' + X_KEY, i); } catch (e) {}
  };
  const show = (i, smooth) => {
    i = Math.max(0, Math.min(cards.length - 1, i));
    const c = cards[i];
    track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
    mark(i);
    // If the reader had scrolled down a long card, bring the top of the new card back into view
    const top = document.querySelector('.xnav').getBoundingClientRect().top;
    if (smooth && top < 0) window.scrollBy({ top: top - 70, behavior: 'smooth' });
  };

  // Start at the card asked for (#explore:x-id, e.g. coming back from Show driver) or the last one seen
  const want = cards.findIndex(c => c.id === routeParam());
  let saved = 0; try { saved = Number(sessionStorage.getItem('rs.' + X_KEY)) || 0; } catch (e) {}
  show(want >= 0 ? want : saved, false);

  let raf = 0;
  const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const n = nearest(); if (n !== idx) mark(n); }); };
  const onPrev = () => show(idx - 1, true), onNext = () => show(idx + 1, true);
  const onKey = e => { if (e.key === 'ArrowRight') onNext(); if (e.key === 'ArrowLeft') onPrev(); };
  track.addEventListener('scroll', onScroll, { passive: true });
  prev.addEventListener('click', onPrev); next.addEventListener('click', onNext);
  document.addEventListener('keydown', onKey);
  return () => { document.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); };
}

// v1.4: Back returns to where More places was opened (More tab or a Plan day)
let xFrom = 'more';
function renderExploreFrom() {
  if (!/^#(driver|explore)/.test(prevHash)) xFrom = prevHash.startsWith('#plan') ? prevHash.slice(1) : 'more';
  return renderExplore();
}
ROUTES.explore = { title: 'More places', tab: 'more', back: () => xFrom, render: renderExploreFrom, after: startExplore };
