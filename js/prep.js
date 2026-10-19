/* RS Vietnam Trip — Prep checklists + Airport guide (Phase 8). Data: data/prep.json */
'use strict';

const getPrepTicks = () => Store.get('prep', {});

function renderPrep() {
  const P = DATA.prep;
  if (!P) return `<div class="card"><p>Not loaded. Close and reopen the app.</p></div>`;
  const t = getPrepTicks();
  const all = P.lists.flatMap(l => l.items), done = all.filter(i => t[i.id]).length;
  return `<section class="card rings">${ring(done, all.length, 'Ready to go', 'ಪ್ರಯಾಣಕ್ಕೆ ತಯಾರಿ')}</section>
    <h3 class="sect">Checklists <span class="kn muted">ಪಟ್ಟಿಗಳು</span></h3>
    <div class="grid">${P.lists.map(l => {
      const n = l.items.filter(i => t[i.id]).length;
      return `<a class="tile area${n === l.items.length ? ' done' : ''}" href="#check:${l.id}">
        <span>${l.icon}</span><span>${esc(l.en)}</span><span class="kn small">${esc(l.kn)}</span>
        <span class="count">${n}/${l.items.length}${n === l.items.length ? ' ✓' : ''}</span></a>`;
    }).join('')}</div>
    <a class="btn" href="#airport" style="margin-top:18px">✈️ Airport guide — step by step</a>
    <a class="btn secondary" href="#print">🖨 Printable help sheet</a>`;
}

function renderCheck() {
  const l = DATA.prep?.lists.find(x => x.id === routeParam());
  if (!l) return `<div class="card"><p>List not found.</p></div>`;
  const t = getPrepTicks();
  return `<h2 class="sect">${l.icon} ${esc(l.en)} <span class="kn muted">${esc(l.kn)}</span></h2>
    ${l.items.map(i => `<button type="button" class="card checkrow" data-prep="${i.id}" aria-pressed="${!!t[i.id]}">
      <span class="box" aria-hidden="true">${t[i.id] ? '✓' : ''}</span>
      <span><strong>${esc(i.en)}</strong><br><span class="kn">${esc(i.kn)}</span></span></button>`).join('')}`;
}

function startCheck() {
  const main = document.getElementById('screen');
  const onClick = e => {
    const b = e.target.closest('[data-prep]');
    if (!b) return;
    const t = getPrepTicks(), on = !t[b.dataset.prep];
    if (on) t[b.dataset.prep] = true; else delete t[b.dataset.prep];
    Store.set('prep', t);
    b.setAttribute('aria-pressed', on);
    b.querySelector('.box').textContent = on ? '✓' : '';
  };
  main.addEventListener('click', onClick);
  return () => main.removeEventListener('click', onClick);
}

/* ----- Airport guide: one leg at a time, numbered step cards ----- */
function renderAirport() {
  const legs = DATA.prep?.airport;
  if (!legs) return `<div class="card"><p>Not loaded.</p></div>`;
  const leg = legs.find(l => l.id === routeParam()) || legs[0];
  const i = legs.indexOf(leg);
  const chips = legs.map((l, n) => `<a class="daychip" href="#airport:${l.id}" aria-current="${l === leg}">
      <strong>${l.icon} ${n + 1}</strong><span>${esc(l.en.split(' — ')[0])}</span></a>`).join('');
  const next = legs[i + 1];
  return `<nav class="daybar" aria-label="Airports">${chips}</nav>
    <section class="card accent"><h2>${esc(leg.en)}</h2><p class="kn">${esc(leg.kn)}</p>
      <p class="stime">${esc(leg.when)}</p>${leg.when_kn ? `<p class="kn">${esc(leg.when_kn)}</p>` : ''}</section>
    ${leg.steps.map((s, n) => `<div class="card step"><span class="stepno">${n + 1}</span>
      <p><strong>${esc(s.en)}</strong><br><span class="kn">${esc(s.kn)}</span></p></div>`).join('')}
    ${next ? `<a class="btn" href="#airport:${next.id}">Next: ${esc(next.en)} ›</a>` : ''}`;
}

ROUTES.prep.render = renderPrep;
ROUTES.check = { title: 'Checklist', tab: 'more', back: 'prep', render: renderCheck, after: startCheck };
ROUTES.airport = { title: 'Airport guide', tab: 'more', back: 'prep', render: renderAirport,
  after: () => { document.querySelector('.daychip[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }); } };
