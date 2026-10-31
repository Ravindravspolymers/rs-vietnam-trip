/* RS Vietnam Trip — Cash plan + SIM (v2.2)
   Money tab: 4-step cash plan (INR→USD, USD→VND, VND→USD, USD→INR) with simple tables.
   More → SIM: Airtel free roaming pack + Vietnam local SIMs. Today: bright reminders until ticked done.
   Rates: live MARKET rate from the Money converter (open.er-api.com); exchangers add a margin — shown as an estimate.
   Details researched Oct 2026 — confirm locally. Ticks share the Plan "done" store (getVisited/setVisited). */
'use strict';

const CASH_TOTAL = 650, INR_CASH = 5000, AIRPORT_USD = '400–500', HOTEL_USD = 190;   // v2.7: family's plan — $100 notes; change $400–500 at the airport, rest at the hotel if needed
const mapQ = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const isDone = id => !!getVisited()[id];
const r1 = n => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });

/* ---------- Content ---------- */
const CASH_STEPS = [
  { id: 't-cash', page: 'buy', icon: '💵', en: `Buy US$${CASH_TOTAL} cash in Bengaluru`, kn: `ಬೆಂಗಳೂರಿನಲ್ಲಿ ${CASH_TOTAL} ಡಾಲರ್ ನಗದು ಖರೀದಿಸಿ`, when: 'Before 23 Nov' },
  { id: 'd1-cash', page: 'vnd', icon: '🇻🇳', en: 'Change dollars to đồng in Hanoi', kn: 'ಹನೋಯ್‌ನಲ್ಲಿ ಡಾಲರ್ → ಡಾಂಗ್', when: 'Day 1 · Tue 24 Nov, at the airport' },
  { id: 'd6-cashback', page: 'back', icon: '↩️', en: 'Change leftover đồng to dollars', kn: 'ಉಳಿದ ಡಾಂಗ್ → ಡಾಲರ್', when: 'Day 6 · Sun 29 Nov' },
  { id: 't-usdinr', page: 'home', icon: '🇮🇳', en: 'Change leftover dollars to rupees', kn: 'ಉಳಿದ ಡಾಲರ್ → ರೂಪಾಯಿ', when: 'Back home · from Mon 30 Nov' }
];

const BLR_FX = [   // v2.3: 1 online + 3 walk-in shops near Sahakar Nagar / MG Road
  { name: 'BookMyForex (MakeMyTrip)', type: 'Online', how: 'Order online — cash delivered home', link: 'https://www.bookmyforex.com/currency-exchange/bangalore/sahakar-nagar/',
    margin: [0.3, 0.8], charges: 'GST ≈ ₹110 on $650; delivery fee shown at checkout', docs: 'Passport, air ticket, PAN (upload)', trust: 'RBI-authorised · MakeMyTrip group' },
  { name: 'Thomas Cook — Sahakara Nagar', type: 'Walk-in · near home', how: '1st Floor, SV Arcade, 60 Feet Main Rd, Park View Layout, Sahakara Nagar',
    link: mapQ('Thomas Cook, SV Arcade, 60 Feet Main Road, Sahakara Nagar, Bengaluru 560092'),
    margin: [1, 2], charges: 'GST ≈ ₹120; small service fee possible', docs: 'Passport, air ticket/visa, PAN (originals)', trust: "India's largest forex company · RBI-authorised" },
  { name: 'Thomas Cook — MG Road', type: 'Walk-in · MG Road', how: 'Building No 70, 2nd–3rd Floor, Ashok Nagar, MG Road',
    link: mapQ('Thomas Cook, Building No 70, MG Road, Ashok Nagar, Bengaluru 560001'),
    margin: [1, 2], charges: 'GST ≈ ₹120; small service fee possible', docs: 'Passport, air ticket/visa, PAN (originals)', trust: "India's largest forex company · RBI-authorised" },
  { name: 'Unimoni (formerly UAE Exchange) — MG Road', type: 'Walk-in · off MG Road', how: 'Ground Floor, North Block, Manipal Centre, Dickenson Rd',
    link: mapQ('Unimoni, Manipal Centre, Dickenson Road, Bengaluru 560042'),
    margin: [1, 2], charges: 'GST ≈ ₹120', docs: 'Passport, air ticket/visa, PAN (originals)', trust: 'Large RBI-licensed chain · helpline 1800 102 0555' }
];
// v2.7: the family's own budget (₹). Already paid before the trip: ₹1,62,000 (flights, cruise, hotel, visa).
const BUDGET = [   // [label, ₹, must-pay]
  ['🏨 Hotel — premium room balance', 14100, true], ['🏨 Hotel — standard room, 28–29 Nov', 4000, true],
  ['🚕 Airport → hotel car', 1700, true], ['🚕 Hotel → airport car', 1700, true],
  ['🍽 Lunch + dinner', 7000], ['🚖 Local taxis', 8000], ['🛍 Shopping', 20000], ['🆘 Extra', 5000]
];
const PAID_INR = 162000;
const TICKETS = [   // per person, ₫ (researched Oct 2026; confirm locally)
  ['🎭 Water puppet show (Day 4)', '100,000–200,000', 'Economy / Standard / VIP seats'],
  ['🏛 Temple of Literature (Day 4)', '70,000', ''], ['🌊 Ngoc Son Temple, Hoan Kiem Lake (Day 1)', '50,000', ''],
  ['🚣 Trang An boat (Day 5)', '250,000–350,000', 'Ask the driver if included'], ['🛕 Bai Dinh buggy + stupa (Day 5)', '100,000 + 60,000', 'Ask the driver if included'],
  ['⛰ Mua Cave (Day 5)', '100,000', 'Ask the driver if included']
];
const VN_FX = [
  { name: 'BIDV bank counter — Noi Bai airport (arrivals)', link: mapQ('BIDV currency exchange Noi Bai International Airport Terminal 2'),
    hours: 'Every day, 6:30 am – midnight', margin: [0.8, 1.5], docs: 'Passport', receipt: 'Yes', note: 'Easiest — change right after landing. Count the notes at the counter.' },
  { name: 'Vietcombank — bank branch, Hoan Kiem', link: mapQ('Vietcombank Hoan Kiem Hanoi'),
    hours: 'Mon–Fri 8:00–16:30 (lunch break ~11:30–13:30), Sat morning', margin: [1, 2], docs: 'Passport + a short form', receipt: 'Yes', note: 'Safest place in the city. May ask for a minimum of about $100.' },
  { name: 'Quang Huy (gold & gem shop), 130 Hang Bac — Old Quarter', link: mapQ('Quang Huy 130 Hang Bac Hanoi'),
    hours: 'Every day 8:00–21:30 (also Sunday)', margin: [0.5, 1], docs: 'Usually none for small amounts', receipt: 'No', note: 'Best rate, open late. Look for the sign "Đại lý thu đổi ngoại tệ" (licensed exchange). Never change money with people on the street.' }
];

/* ---------- Helpers ---------- */
function mkt() {
  const fx = getFx();
  return { inr: fx.INR, vnd: fx.VND, date: fx.date };       // per 1 USD
}
const fxDate = d => new Date(d + (d.length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
function doneBtn(id) {
  const on = isDone(id);
  return `<button type="button" class="tick" data-task="${esc(id)}" aria-pressed="${on}">${on ? '✓ Done — tap to undo' : '○ Mark done'}</button>`;
}
function kv(rows) {                                            // mobile "table": label | value rows
  return `<table class="kv">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>`;
}

/* v2.6: everything in Vietnam is paid in đồng */
const payDong = () => `<section class="paydong"><strong>₫ In Vietnam, pay everything in đồng — not US dollars</strong>
    <span>Hotel, taxis, food, shops, tickets: all in đồng. Dollars are only for changing money.</span>
    <span class="kn">ವಿಯೆಟ್ನಾಂನಲ್ಲಿ ಎಲ್ಲಾ ಪಾವತಿ ಡಾಂಗ್‌ನಲ್ಲೇ — ಡಾಲರ್‌ನಲ್ಲಿ ಅಲ್ಲ. ಹೋಟೆಲ್, ಟ್ಯಾಕ್ಸಿ, ಊಟ, ಅಂಗಡಿ — ಎಲ್ಲಾ ಡಾಂಗ್.</span></section>`;

/* ---------- Money tab: the cash plan list ---------- */
function renderCashPlan() {
  return `<section class="card cashplan">
      <h3>💵 Cash plan <span class="kn muted">ಹಣದ ಯೋಜನೆ</span></h3>
      ${CASH_STEPS.map((s, i) => `<a class="cashrow${isDone(s.id) ? ' done' : ''}" href="#cash:${s.page}">
        <span class="cnum">${isDone(s.id) ? '✓' : i + 1}</span>
        <span><strong>${s.icon} ${esc(s.en)}</strong><br><span class="kn">${esc(s.kn)}</span><br><span class="muted small">${esc(s.when)}</span></span>
        <span class="chev" aria-hidden="true">›</span></a>`).join('')}
    </section>`;
}

/* ---------- Cash pages ---------- */
function renderCashPage() {
  const p = routeParam(), m = mkt();
  const step = CASH_STEPS.find(s => s.page === p) || CASH_STEPS[0];
  document.getElementById('screen-title').textContent = { buy: 'Buy dollars', vnd: 'Dollars → đồng', back: 'Đồng → dollars', home: 'Dollars → rupees' }[step.page];
  const head = `<section class="card accent"><h2>${step.icon} ${esc(step.en)}</h2><p class="kn">${esc(step.kn)}</p>
      <p class="muted small">${esc(step.when)} · Market rate ${fxDate(m.date)}: <strong>$1 = ₹${r1(m.inr)} = ${Math.round(m.vnd).toLocaleString('en-US')} ₫</strong></p></section>`;

  if (step.page === 'buy') {
    const total = BUDGET.reduce((a, [, v]) => a + v, 0);   // ₹
    return head + `<p>Exchangers add a small margin over the market rate. Compare, then buy from the cheapest.<br>
        <span class="kn">ಮಾರುಕಟ್ಟೆ ದರಕ್ಕಿಂತ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ತೆಗೆದುಕೊಳ್ಳುತ್ತಾರೆ. ಹೋಲಿಸಿ, ಕಡಿಮೆ ಬೆಲೆಯಲ್ಲಿ ಕೊಳ್ಳಿ.</span></p>
      ${BLR_FX.map(f => `<section class="card fx">
        <h3>${esc(f.name)} <span class="ftype">${esc(f.type)}</span></h3>
        ${kv([['Where', `<a href="${f.link}" target="_blank" rel="noopener">${esc(f.how)} ↗</a>`],
              ['Rate (approx.)', `₹${r1(m.inr * (1 + f.margin[0] / 100))}–${r1(m.inr * (1 + f.margin[1] / 100))} per $`],
              [`$${CASH_TOTAL} costs`, `≈ ₹${Math.round(CASH_TOTAL * m.inr * (1 + f.margin[0] / 100)).toLocaleString('en-IN')}–${Math.round(CASH_TOTAL * m.inr * (1 + f.margin[1] / 100)).toLocaleString('en-IN')}`],
              ['Charges', esc(f.charges)], ['Carry', esc(f.docs)], ['Trust', esc(f.trust)]])}
      </section>`).join('')}
      <section class="card">
        <h3>🧮 Your budget in Vietnam <span class="kn muted">ಖರ್ಚಿನ ಅಂದಾಜು</span></h3>
        ${kv(BUDGET.map(([k, v, must]) => [k + (must ? ' <span class="must">must pay</span>' : ''), `₹${v.toLocaleString('en-IN')} <span class="muted">≈ ${(Math.round(v / m.inr * m.vnd / 100000) / 10)}M ₫</span>`])
          .concat([['<strong>Total</strong>', `<strong>₹${total.toLocaleString('en-IN')}</strong> <span class="muted">≈ $${Math.round(total / m.inr)}</span>`]]))}
        <p><strong>Carry: US$${CASH_TOTAL} (in $100 notes) + ₹${INR_CASH.toLocaleString('en-IN')} cash for India.</strong></p>
        <p class="muted small">Already paid: ₹${PAID_INR.toLocaleString('en-IN')} (flights, cruise, hotel booking, visa). Ninh Binh tour is paid.</p>
      </section>
      <section class="card">
        <h3>🎟 Entry tickets to pay there (per person)</h3>
        ${kv(TICKETS.map(([k, v, note]) => [k, `${v} ₫${note ? `<br><span class="muted small">${note}</span>` : ''}`]))}
        <p class="muted small">Hanoi tickets fit in "Extra". If Ninh Binh entries are not in the tour, keep about 1.5 million ₫ for two.</p>
      </section>
      <section class="card warn">
        <h3>✅ When you buy</h3>
        <ul>
          <li>Ask for <strong>$100 notes, 2013 series or newer</strong>, clean, no tears or marks — Vietnam gives the best rate for these and may refuse damaged notes.<br><span class="kn">ಹೊಸ, ಸ್ವಚ್ಛ 100 ಡಾಲರ್ ನೋಟು ಕೇಳಿ — ಹರಿದ ನೋಟು ಬೇಡ.</span></li>
          <li>Keep the <strong>forex receipt</strong> — needed to change dollars back to rupees.<br><span class="kn">ರಸೀದಿ ಜೋಪಾನವಾಗಿಡಿ.</span></li>
          <li>Split the cash: some in the hotel safe, some in a money belt — not all in one wallet.<br><span class="kn">ಹಣವನ್ನು ಎರಡು ಕಡೆ ಇಡಿ.</span></li>
        </ul>
      </section>
      <section class="card">
        <h3>💳 Also: turn on cards for abroad</h3>
        <p>In the bank app, switch on <strong>international use</strong> for one debit and one credit card — the backup if cash runs out.</p>
        <p class="kn">ಬ್ಯಾಂಕ್ ಆ್ಯಪ್‌ನಲ್ಲಿ ಡೆಬಿಟ್/ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗೆ ವಿದೇಶ ಬಳಕೆ ಆನ್ ಮಾಡಿ.</p>
        ${doneBtn('t-cards')}
      </section>
      ${doneBtn(step.id)}`;
  }

  if (step.page === 'vnd') {
    const good = Math.round(m.vnd * 0.985 / 100) * 100;
    return head + payDong() + `<section class="card nudge-ok">
        <p><strong>Good rate check:</strong> accept if they give <strong>${good.toLocaleString('en-US')} ₫ or more</strong> for $1.</p>
        <p class="kn">1 ಡಾಲರ್‌ಗೆ ${good.toLocaleString('en-US')} ಡಾಂಗ್ ಅಥವಾ ಹೆಚ್ಚು ಕೊಟ್ಟರೆ ಒಪ್ಪಿ.</p>
        <p>Change <strong>US$${AIRPORT_USD}</strong> (four or five $100 notes) ≈ ${Math.round(400 * m.vnd * 0.99 / 100000) / 10}–${Math.round(500 * m.vnd * 0.99 / 100000) / 10} million ₫. This covers the hotel, the cars and the first days. Change the rest at the hotel reception later, only if needed.</p>
        <p class="kn">ವಿಮಾನ ನಿಲ್ದಾಣದಲ್ಲಿ 400–500 ಡಾಲರ್ ಬದಲಿಸಿ. ಉಳಿದದ್ದು ಬೇಕಾದರೆ ಮಾತ್ರ ಹೋಟೆಲ್‌ನಲ್ಲಿ.</p>
        <p class="muted small">Must-pay in đồng: hotel rooms (≈ ₹18,100) and the two airport cars (≈ ₹3,400) — about ${(Math.round(21500 / m.inr * m.vnd / 100000) / 10)} million ₫.</p>
      </section>
      ${vnTable(VN_FX)}
      <section class="card warn"><h3>⚠️ Safety</h3><ul>
        <li>Ask for small notes too (50k, 100k, 200k). <span class="kn">ಸಣ್ಣ ನೋಟುಗಳನ್ನೂ ಕೇಳಿ.</span></li>
        <li>Count the money before leaving the counter — notes stick together. <span class="kn">ಕೌಂಟರ್ ಬಿಡುವ ಮೊದಲು ಎಣಿಸಿ.</span></li>
        <li>Never change money with people on the street or at hotels/tour shops (worst rates). <span class="kn">ಬೀದಿಯಲ್ಲಿ ಹಣ ಬದಲಿಸಬೇಡಿ.</span></li>
      </ul></section>
      ${doneBtn(step.id)}`;
  }

  if (step.page === 'back') {
    return head + `<p>Best: <strong>spend the đồng first</strong>. Keep about 200,000 ₫ for snacks and the taxi. Changing back loses 2–3%.<br>
        <span class="kn">ಮೊದಲು ಡಾಂಗ್ ಖರ್ಚು ಮಾಡಿ. 2 ಲಕ್ಷ ಡಾಂಗ್ ಇಟ್ಟುಕೊಳ್ಳಿ. ವಾಪಸ್ ಬದಲಿಸಿದರೆ 2–3% ನಷ್ಟ.</span></p>
      ${vnTable([
        { name: 'Quang Huy, 130 Hang Bac — Old Quarter (Sunday morning, before leaving)', link: VN_FX[2].link, hours: 'Every day 8:00–21:30', margin: [1, 2], docs: 'Usually none', receipt: 'No', note: 'Open on Sunday — banks in the city are closed. Change before 3:30 pm hotel departure.' },
        { name: 'Bank counter — Noi Bai airport, before security', link: mapQ('BIDV currency exchange Noi Bai International Airport Terminal 2'), hours: 'Daily (BIDV until midnight)', margin: [2, 3], docs: 'Passport (may ask for your exchange receipt)', receipt: 'Yes', note: 'Easy, but a slightly worse rate.' }
      ], true)}
      ${doneBtn(step.id)}`;
  }

  // home: USD → INR
  return head + `<p>Small amounts (under $100) are fine to keep for the next trip. For more:<br>
      <span class="kn">100 ಡಾಲರ್‌ಗಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಮುಂದಿನ ಪ್ರವಾಸಕ್ಕೆ ಇಟ್ಟುಕೊಳ್ಳಿ.</span></p>
    ${BLR_FX.map(f => `<section class="card fx"><h3>${esc(f.name)} <span class="ftype">${esc(f.type)}</span></h3>
      ${kv([['Where', `<a href="${f.link}" target="_blank" rel="noopener">${esc(f.how.replace('cash delivered home', 'they collect and pay to bank'))} ↗</a>`],
            ['They pay (approx.)', `₹${r1(m.inr * 0.97)}–${r1(m.inr * 0.985)} per $`], ['Carry', 'Passport, PAN, the forex receipt']])}</section>`).join('')}
    <p class="muted small">Avoid the Bengaluru airport counter — lowest rate. <span class="kn">ವಿಮಾನ ನಿಲ್ದಾಣದ ಕೌಂಟರ್ ಬೇಡ.</span></p>
    ${doneBtn(step.id)}`;
}

function vnTable(list, sell) {
  const m = mkt();
  return list.map(f => `<section class="card fx"><h3>${esc(f.name)}</h3>
    ${kv([['Where', `<a href="${f.link}" target="_blank" rel="noopener">Open map ↗</a>`], ['Open', esc(f.hours)],
          [sell ? 'You get (approx.)' : 'You get for $1 (approx.)', sell
            ? `$1 for about ${Math.round(m.vnd * (1 + f.margin[0] / 100) / 100) * 100}–${Math.round(m.vnd * (1 + f.margin[1] / 100) / 100) * 100} ₫`
            : `${(Math.round(m.vnd * (1 - f.margin[1] / 100) / 100) * 100).toLocaleString('en-US')}–${(Math.round(m.vnd * (1 - f.margin[0] / 100) / 100) * 100).toLocaleString('en-US')} ₫`],
          ['Carry', esc(f.docs)], ['Receipt', esc(f.receipt)]])}
    <p class="muted small">${esc(f.note)}</p></section>`).join('');
}

/* ---------- SIM (More → SIM) ---------- */
const VN_SIMS = [   // [name, data, calls, validity, price, note] — v2.3: ₹240 daily plan first (recommended)
  ['Vinaphone daily plan ⭐', '1.5 GB a day', 'Check at kiosk', '7 days', '~70,000 ₫ (≈ ₹240)', 'Recommended — enough for WhatsApp, maps and video calls'],
  ['Pre-booked airport pickup SIM', '6 GB a day', '200 local minutes', '7 days', '~$7.75 (≈ ₹680)', 'Book online before the trip, collect at Noi Bai'],
  ['Viettel tourist SIM', '5 GB a day', 'Unlimited local', '30 days', '~200,000 ₫ (≈ ₹700)', 'Best coverage, more than needed'],
  ['Mobifone tourist SIM', '30 GB total', 'Check at kiosk', '30 days', '~250,000 ₫ (≈ ₹850)', '']
];

function renderSim() {
  const p = routeParam();
  if (p === 'airtel') {
    document.getElementById('screen-title').textContent = 'Airtel roaming';
    return `<section class="card accent"><h2>📶 Airtel — free 5-day roaming pack (phone 1)</h2>
        <p class="kn">ಏರ್‌ಟೆಲ್ — ಉಚಿತ 5 ದಿನದ ರೋಮಿಂಗ್ ಪ್ಯಾಕ್</p></section>
      <section class="card">${kv([['Data', '5 GB high-speed'], ['Calls', '60 minutes (outgoing + incoming)'], ['SMS', '25 outgoing · incoming free'],
        ['Validity', '5 days from when the phone first connects abroad'], ['Cost', 'Free — one trip a year per SIM'],
        ['Who gets it', 'Airtel <strong>postpaid on the new plans</strong> (₹499 and above, from 8 Oct 2026)'], ['Countries', '180+ (confirm Vietnam at the store)']])}</section>
      <section class="card">
        <h3>🏬 At the Airtel store, Sahakar Nagar (before 23 Nov)</h3>
        <a class="btn secondary" href="${mapQ('Airtel Store Sahakar Nagar Bengaluru')}" target="_blank" rel="noopener">📍 Find the store ↗</a>
        <ol class="vsteps">
          <li>Take <strong>both phones</strong> and Aadhaar. <span class="kn">ಎರಡೂ ಫೋನ್ ಮತ್ತು ಆಧಾರ್ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.</span></li>
          <li>Ask: <em>"Are we on the new postpaid plan with the free international roaming pack? Is Vietnam covered?"</em> If not, ask them to upgrade. <span class="kn">ಹೊಸ ಪ್ಲಾನ್ ಇದೆಯೇ, ವಿಯೆಟ್ನಾಂಗೆ ಸಿಗುತ್ತದೆಯೇ ಎಂದು ಕೇಳಿ.</span></li>
          <li>Ask them to <strong>switch on international roaming</strong> and show how to activate the pack in the Airtel Thanks app. <span class="kn">ರೋಮಿಂಗ್ ಆನ್ ಮಾಡಿಸಿ, ಪ್ಯಾಕ್ ಆಕ್ಟಿವೇಟ್ ಮಾಡುವುದು ಹೇಗೆ ಎಂದು ತೋರಿಸಲು ಹೇಳಿ.</span></li>
          <li>Ask: <em>"What is charged after 5 GB / 60 minutes or after 5 days?"</em> Write it down. <span class="kn">ಮಿತಿ ಮೀರಿದರೆ ಎಷ್ಟು ಶುಲ್ಕ ಎಂದು ಕೇಳಿ ಬರೆದುಕೊಳ್ಳಿ.</span></li>
        </ol>
      </section>
      <section class="card warn"><h3>✈️ When you land in Hanoi</h3><ul>
        <li>Turn on <strong>Data roaming</strong>, then activate the pack in the app. Not in Mumbai — that is still India. <span class="kn">ಹನೋಯ್ ತಲುಪಿದ ಮೇಲೆ ರೋಮಿಂಗ್ ಆನ್ ಮಾಡಿ.</span></li>
        <li>The 5 days run from 24 Nov morning to about 29 Nov morning. On the last afternoon use hotel and airport Wi-Fi. <span class="kn">ಕೊನೆಯ ದಿನ ಮಧ್ಯಾಹ್ನ Wi-Fi ಬಳಸಿ.</span></li>
        <li>Use <strong>WhatsApp calls on Wi-Fi</strong> to save the 60 minutes. <span class="kn">Wi-Fi ನಲ್ಲಿ WhatsApp ಕರೆ ಮಾಡಿ.</span></li>
      </ul></section>
      ${doneBtn('t-airtel')}`;
  }
  if (p === 'local') {
    document.getElementById('screen-title').textContent = 'Vietnam SIM';
    return `<section class="card accent"><h2>🇻🇳 Vietnam local SIM — for the second phone</h2>
        <p class="kn">ಎರಡನೇ ಫೋನ್‌ಗೆ ಸ್ಥಳೀಯ ಸಿಮ್ — ನೋಯ್ ಬಾಯ್ ವಿಮಾನ ನಿಲ್ದಾಣದಲ್ಲಿ ಕೊಳ್ಳಿ</p></section>
      ${VN_SIMS.map(([n, data, calls, valid, price, note]) => `<section class="card fx"><h3>${n}</h3>${kv([['Data', data], ['Calls', calls], ['Validity', valid], ['Price', price]].concat(note ? [['Note', note]] : []))}</section>`).join('')}
      <section class="card"><h3>🛂 How to buy</h3><ul>
        <li>SIM kiosks in Noi Bai arrivals hall — open for every flight. Airport price is a little higher (about 250,000–300,000 ₫).</li>
        <li>Bring the <strong>passport</strong>; they take a photo and set it up in about 5 minutes. Test before paying.</li>
        <li>Ask for the <strong>Vinaphone 1.5 GB/day, 7-day plan (~70,000 ₫)</strong> — plenty for WhatsApp, maps and video calls.</li>
      </ul><p class="kn">ಪಾಸ್‌ಪೋರ್ಟ್ ಬೇಕು. 5 ನಿಮಿಷದಲ್ಲಿ ಸಿದ್ಧ. ದಿನಕ್ಕೆ 1.5 GB ಸಾಕು.</p></section>`;
  }
  return `<p><strong>Plan:</strong> phone 1 = Airtel roaming, phone 2 = local Vinaphone SIM bought at Noi Bai. <span class="kn">ಫೋನ್ 1 = ಏರ್‌ಟೆಲ್ ರೋಮಿಂಗ್, ಫೋನ್ 2 = ಸ್ಥಳೀಯ ಸಿಮ್.</span></p>
    <div class="grid">
      <a class="tile area${isDone('t-airtel') ? ' done' : ''}" href="#sim:airtel"><span>📶</span><span>Airtel roaming</span><span class="kn small">ಏರ್‌ಟೆಲ್</span>
        <span class="count">${isDone('t-airtel') ? 'Done ✓' : 'Phone 1 · free'}</span></a>
      <a class="tile area" href="#sim:local"><span>🇻🇳</span><span>Vietnam local</span><span class="kn small">ಸ್ಥಳೀಯ ಸಿಮ್</span><span class="count">${isDone('d1-sim') ? 'Bought ✓' : 'Buy at airport'}</span></a>
    </div>
    <p class="muted small">Details checked Oct 2026 — confirm at the store/kiosk.</p>`;
}

/* ---------- Today: bright reminders until ticked done ---------- */
function renderTaskAlerts(cur) {
  // v2.3: done items stay (greyed) with an Undo button; pre-trip block ends with a link to Prep
  const list = [], pre = cur.before || (cur.day.day === 0 && !cur.after);
  const during = !cur.before && !cur.after;
  if (pre) {
    list.push(['t-cash', '#cash:buy', `💵 Collect US$${CASH_TOTAL} + ₹${INR_CASH.toLocaleString('en-IN')} cash`, `${CASH_TOTAL} ಡಾಲರ್ + ₹${INR_CASH} ನಗದು ಪಡೆಯಿರಿ`, 'See Money → Cash plan']);
    list.push(['t-airtel', '#sim:airtel', '📶 Airtel store, Sahakar Nagar: free roaming pack', 'ಸಹಕಾರ ನಗರ ಏರ್‌ಟೆಲ್ ಆಫೀಸ್: ಉಚಿತ ರೋಮಿಂಗ್', 'See More → SIM']);
    list.push(['t-cards', '#cash:buy', '💳 Turn on cards for use abroad', 'ಕಾರ್ಡ್‌ಗೆ ವಿದೇಶ ಬಳಕೆ ಆನ್ ಮಾಡಿ', 'In your bank app']);
    list.push(['t-msgs', '#confirm', '📲 Message hotel, cruise & express immigration', 'ಹೋಟೆಲ್, ಹಡಗು, ಇಮಿಗ್ರೇಶನ್‌ಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ', 'Ready-made English + Vietnamese messages']);
  }
  if (during && cur.day.day === 1)
    list.push(['d1-cash', '#cash:vnd', '🇻🇳 Change dollars to đồng at the airport', 'ವಿಮಾನ ನಿಲ್ದಾಣದಲ್ಲಿ ಡಾಲರ್ → ಡಾಂಗ್', 'Change $400–500 · pay everything in đồng']);
    list.push(['d1-sim', '#sim:local', '📶 Buy one local SIM at the airport', 'ವಿಮಾನ ನಿಲ್ದಾಣದಲ್ಲಿ ಒಂದು ಸ್ಥಳೀಯ ಸಿಮ್', 'Vinaphone 1.5 GB/day · ~70,000 ₫ · passport']);
  if (during && cur.day.day === 6)
    list.push(['d6-cashback', '#cash:back', '↩️ Leftover đồng → dollars today', 'ಉಳಿದ ಡಾಂಗ್ → ಡಾಲರ್ ಇಂದು', 'Old Quarter shop or airport counter']);
  if (cur.after)
    list.push(['t-usdinr', '#cash:home', '🇮🇳 Leftover dollars → rupees', 'ಉಳಿದ ಡಾಲರ್ → ರೂಪಾಯಿ', 'Keep the forex receipt and PAN ready']);
  return list.map(([id, href, en, kn, sub]) => {
    const done = isDone(id);
    return `<section class="alertcard${done ? ' done' : ''}">
      <a href="${href}"><strong>${done ? '✓ ' : ''}${esc(en)}</strong><span class="kn">${esc(kn)}</span><span class="asub">${done ? 'Done' : esc(sub) + ' ›'}</span></a>
      <button type="button" class="adone" data-task="${id}" aria-label="${done ? 'Undo' : 'Mark done'}">${done ? '↺ Undo' : '✓ Done'}</button>
    </section>`;
  }).join('') + (pre ? `<a class="btn secondary preplink" href="#prep">✅ Check all prep items <span class="kn">ಎಲ್ಲಾ ತಯಾರಿ ಪಟ್ಟಿ ನೋಡಿ</span></a>` : '');
}

/* ---------- One click handler for ticks (Today, Money pages) ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-task]');
  if (!b) return;
  setVisited(b.dataset.task, !isDone(b.dataset.task));
  toast(isDone(b.dataset.task) ? 'Marked done ✓ / ಮುಗಿದಿದೆ' : 'Undone / ಮತ್ತೆ ಬಾಕಿ');
  const y = window.scrollY; render(); window.scrollTo(0, y);
});

ROUTES.cash = { title: 'Cash plan', tab: 'money', back: 'money', render: renderCashPage };
ROUTES.sim = { title: 'SIM & internet', tab: 'more', back: () => (routeParam() ? 'sim' : 'more'), render: renderSim };
