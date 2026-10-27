/* RS Vietnam Trip — Taxi & Grab (v2.3)
   More → Taxi & Grab: (1) Grab step by step, from installing to paying; (2) local taxi: safe brands,
   meter, approx fares (by km and hotel → each place), how to agree a price. Fares researched Oct 2026, approx. */
'use strict';

const GRAB_PLAY = 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger';
// Metered 4-seat taxi (Mai Linh / G7 / Taxi Group): ~12,000 ₫ start + ~15,000 ₫ per km. Grab car is similar, price fixed in the app.
const taxiFare = km => 12000 + 15000 * km;
const fareTxt = km => { const f = taxiFare(km), lo = Math.round(f * 0.9 / 5000) * 5000, hi = Math.round(f * 1.1 / 5000) * 5000;
  return `${(lo / 1000)}k–${(hi / 1000)}k ₫`; };
const fareInr = km => { const fx = getFx(); return '₹' + Math.round(taxiFare(km) / fx.VND * fx.INR / 10) * 10; };
const roadKm = (a, b) => haversineKm(a, b) * 1.35;

/* A simple drawn phone screen (illustration — not the real app's look) */
const phone = inner => `<div class="mockphone" aria-hidden="true"><div class="mp-top"></div>${inner}</div>`;
const GRAB_STEPS = [
  { t: 'Install the app (in Bengaluru, on Wi-Fi)', d: 'Open Play Store, search "Grab", install the green Grab app. Do this before the trip.',
    k: 'ಬೆಂಗಳೂರಿನಲ್ಲೇ Play Store ನಲ್ಲಿ "Grab" ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ.',
    m: phone(`<div class="mp-search">🔍 Grab</div><div class="mp-row"><span class="mp-ic">🟩</span><b>Grab</b><span class="mp-btn">Install</span></div>`) },
  { t: 'Sign up with your Indian mobile number', d: 'Open the app → enter your number with +91 → type the 6-digit code (OTP) that comes by SMS. Add your name. Email is optional.',
    k: '+91 ನಿಮ್ಮ ಮೊಬೈಲ್ ನಂಬರ್ ಹಾಕಿ → SMS ನಲ್ಲಿ ಬರುವ 6 ಅಂಕಿಯ ಕೋಡ್ ಟೈಪ್ ಮಾಡಿ → ಹೆಸರು ಹಾಕಿ.',
    m: phone(`<p class="mp-h">Enter your number</p><div class="mp-field">🇮🇳 +91 98XXX XXXXX</div><p class="mp-h">Code sent by SMS</p><div class="mp-otp"><i>4</i><i>8</i><i>1</i><i>2</i><i>9</i><i>6</i></div>`) },
  { t: 'Choose "Cash" as payment', d: 'Tap Payment → choose Cash. No card needed. You pay the driver in đồng at the end.',
    k: 'Payment → Cash ಆರಿಸಿ. ಕೊನೆಗೆ ಚಾಲಕರಿಗೆ ಡಾಂಗ್‌ನಲ್ಲಿ ಕೊಡಿ.',
    m: phone(`<p class="mp-h">Payment</p><div class="mp-row sel">💵 <b>Cash</b><span>✓</span></div><div class="mp-row">💳 Card</div>`) },
  { t: 'Save the hotel as "Home"', d: 'Tap Saved places → Home → type "Hanoi Chic Boutique Hotel" → choose 51-53 Bat Su. Now "Home" is one tap.',
    k: 'Saved places → Home → "Hanoi Chic Boutique Hotel" ಟೈಪ್ ಮಾಡಿ ಉಳಿಸಿ.',
    m: phone(`<p class="mp-h">Saved places</p><div class="mp-row sel">🏠 <b>Home</b><small>Hanoi Chic Boutique Hotel, 51-53 Bát Sứ</small></div>`) },
  { t: 'In Hanoi: turn on data, tap "Car"', d: 'Make sure the internet is on (Airtel roaming or hotel Wi-Fi at the start). Open Grab → tap Car (not Bike).',
    k: 'ಇಂಟರ್ನೆಟ್ ಆನ್ ಇರಲಿ. Grab ತೆರೆಯಿರಿ → Car ಒತ್ತಿ (Bike ಬೇಡ).',
    m: phone(`<div class="mp-grid"><span class="sel">🚗<br>Car</span><span>🛵<br>Bike</span><span>🍜<br>Food</span></div>`) },
  { t: 'Type where you want to go', d: 'In "Where to?" type the place name in English (e.g. "Temple of Literature"). Check the pickup pin is where you stand.',
    k: '"Where to?" ನಲ್ಲಿ ಸ್ಥಳದ ಹೆಸರು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ. ನೀವು ನಿಂತಿರುವ ಜಾಗ ಸರಿಯಾಗಿದೆಯೇ ನೋಡಿ.',
    m: phone(`<div class="mp-field">📍 Your location</div><div class="mp-field sel">🏁 Temple of Literature</div>`) },
  { t: 'Choose "GrabCar" (4 seats) and see the price', d: 'The price is shown BEFORE you book and does not change. Tap Book.',
    k: 'GrabCar (4 ಸೀಟ್) ಆರಿಸಿ. ಬೆಲೆ ಮೊದಲೇ ಕಾಣುತ್ತದೆ, ಬದಲಾಗುವುದಿಲ್ಲ. Book ಒತ್ತಿ.',
    m: phone(`<div class="mp-row sel">🚗 <b>GrabCar</b><span>52,000₫</span></div><div class="mp-row">🚙 GrabCar 7-seat<span>68,000₫</span></div><div class="mp-book">Book GrabCar</div>`) },
  { t: 'Check the number plate before you get in', d: 'The app shows the driver photo, car colour and plate (e.g. 30A-123.45). Get in only if the plate matches.',
    k: 'ಕಾರಿನ ನಂಬರ್ ಪ್ಲೇಟ್ ಆ್ಯಪ್‌ನಲ್ಲಿರುವುದಕ್ಕೆ ಹೊಂದಿದರೆ ಮಾತ್ರ ಹತ್ತಿ.',
    m: phone(`<p class="mp-h">Driver is coming · 3 min</p><div class="mp-row">👤 <b>Driver</b><small>White Toyota Vios</small></div><div class="mp-plate">30A-123.45</div>`) },
  { t: 'Pay the shown price in cash', d: 'Pay exactly the app price (round up to the next 10,000 ₫ if you like). You can rate the driver after.',
    k: 'ಆ್ಯಪ್ ತೋರಿಸಿದ ಬೆಲೆಯನ್ನೇ ನಗದಾಗಿ ಕೊಡಿ.',
    m: phone(`<p class="mp-h">Trip complete</p><div class="mp-big">52,000₫</div><p class="mp-h">Pay by cash</p><div class="mp-stars">★★★★★</div>`) }
];

function renderTransport() {
  const p = routeParam(), H = DATA.trip.hotel;
  if (p === 'grab') {
    document.getElementById('screen-title').textContent = 'Grab app';
    return `<section class="card accent"><h2>🚗 Grab: book a car on the phone</h2>
        <p>Like Ola/Uber. The price is fixed before you book — no bargaining, no meter.</p>
        <p class="kn">ಓಲಾ/ಊಬರ್‌ನಂತೆ. ಬೆಲೆ ಮೊದಲೇ ನಿಗದಿ — ಚೌಕಾಸಿ ಇಲ್ಲ.</p>
        <a class="btn green" href="${GRAB_PLAY}" target="_blank" rel="noopener">⬇ Get Grab on Play Store</a></section>
      ${GRAB_STEPS.map((s, i) => `<section class="card gstep">
        <div class="gtext"><span class="stepno">${i + 1}</span><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p><p class="kn">${esc(s.k)}</p></div>
        ${s.m}</section>`).join('')}
      <section class="card warn"><h3>💡 Good to know</h3><ul>
        <li>The SMS code needs your Indian number to receive SMS — easiest to sign up in Bengaluru before the trip.</li>
        <li>Always choose <strong>Car</strong>, never Bike. <span class="kn">ಯಾವಾಗಲೂ Car, Bike ಬೇಡ.</span></li>
        <li>Driver calling you? Show the hotel card or use the 🎤 translator.</li>
        <li>Pictures above are simple drawings to explain the steps — the real app looks a little different.</li>
      </ul></section>`;
  }
  if (p === 'taxi') {
    document.getElementById('screen-title').textContent = 'Local taxi';
    const kms = [1, 2, 3, 5, 8, 10, 15];
    const places = [
      ...DATA.trip.days.flatMap(d => d.stops).filter(s => s.lat != null && ['temple', 'market', 'lake', 'theatre'].includes(s.type)),
      ...(DATA.explore?.places || [])
    ].map(x => ({ en: x.en, km: roadKm(H, x) })).filter(x => x.km > 0.3).sort((a, b) => a.km - b.km);
    return `<section class="card accent"><h2>🚕 Metered taxi — the safe way</h2>
        <p>Use only these companies: <strong>Mai Linh</strong> (green, 1055 on the door), <strong>Xanh SM</strong> (green electric), <strong>G7</strong> or <strong>Taxi Group</strong> (white). Best: ask the hotel to call one.</p>
        <p class="kn">ಈ ಕಂಪನಿಯ ಟ್ಯಾಕ್ಸಿ ಮಾತ್ರ: Mai Linh, Xanh SM, G7, Taxi Group. ಹೋಟೆಲ್‌ನವರಿಗೆ ಕರೆಸಲು ಹೇಳಿ.</p></section>
      <section class="card"><h3>📏 Approx fare by distance</h3>
        <table class="kv fares"><tr><th>Distance</th><td><strong>Fare (4-seat)</strong></td></tr>
        ${kms.map(k => `<tr><th>${k} km</th><td>${fareTxt(k)} <span class="muted">(${fareInr(k)})</span></td></tr>`).join('')}</table>
        <p class="muted small">Airport ↔ hotel (about 30 km): 350k–450k ₫. Grab car costs about the same.</p></section>
      <section class="card"><h3>🏨 From the hotel to…</h3>
        <table class="kv fares">${places.map(x => `<tr><th>${esc(x.en)}</th><td>${x.km < 1.2 ? '🚶 Walk' : `~${x.km.toFixed(1)} km · ${fareTxt(x.km)}`}</td></tr>`).join('')}</table>
        <p class="muted small">Approx. Traffic and night-time can add a little.</p></section>
      <section class="card"><h3>🤝 How to take a taxi or agree a price</h3>
        <ol class="vsteps">
          <li>Before getting in, say <em>"Bật đồng hồ"</em> (turn on the meter). <button type="button" class="hear" data-say="Bật đồng hồ giúp tôi">🔊</button></li>
          <li>Show the place name on the phone (Plan → Show driver).</li>
          <li>Watch the meter start at about 10,000–12,000 ₫. If it jumps fast or the driver says "broken", get out politely.</li>
          <li>No meter (cyclo, private car)? Agree the price FIRST using the table above. Ask <em>"Bao nhiêu tiền?"</em> <button type="button" class="hear" data-say="Bao nhiêu tiền?">🔊</button>, then write the number on paper and show it.</li>
          <li>Pay with small notes and count aloud. Round up to the next 10,000 ₫ — no tip needed.</li>
        </ol>
        <p class="kn">ಹತ್ತುವ ಮೊದಲು ಮೀಟರ್ ಹಾಕಲು ಹೇಳಿ. ಮೀಟರ್ ಇಲ್ಲದಿದ್ದರೆ ಮೊದಲೇ ಬೆಲೆ ಒಪ್ಪಿಕೊಳ್ಳಿ, ಕಾಗದದಲ್ಲಿ ಬರೆದು ತೋರಿಸಿ.</p></section>
      <section class="card warn"><h3>⚠️ Avoid</h3><ul>
        <li>Motorbike taxis (xe ôm / bike) — not safe for knees. <span class="kn">ಬೈಕ್ ಟ್ಯಾಕ್ಸಿ ಬೇಡ.</span></li>
        <li>Drivers who call out to you on the street near the lake. <span class="kn">ಬೀದಿಯಲ್ಲಿ ಕರೆಯುವವರ ಬಳಿ ಹೋಗಬೇಡಿ.</span></li>
        <li>Cyclo rides without a fixed price — agree price and time first (about 150k–200k ₫ an hour).</li>
      </ul></section>`;
  }
  return `<p>Two easy ways to get around Hanoi. <span class="kn">ಹನೋಯ್‌ನಲ್ಲಿ ಓಡಾಡಲು ಎರಡು ದಾರಿ.</span></p>
    <div class="grid">
      <a class="tile area" href="#transport:grab"><span>🚗</span><span>Grab app</span><span class="kn small">ಗ್ರಾಬ್ ಆ್ಯಪ್</span><span class="count">Fixed price</span></a>
      <a class="tile area" href="#transport:taxi"><span>🚕</span><span>Local taxi</span><span class="kn small">ಸ್ಥಳೀಯ ಟ್ಯಾಕ್ಸಿ</span><span class="count">Meter · fares</span></a>
    </div>
    <p class="muted small">Walking is easiest in the Old Quarter — most places near the hotel are 5–15 minutes on foot.</p>`;
}

ROUTES.transport = { title: 'Taxi & Grab', tab: 'more', back: () => (routeParam() ? 'transport' : 'more'), render: renderTransport,
  after: () => startSayButtons() };
