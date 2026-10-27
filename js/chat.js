/* RS Vietnam Trip — Ask the helper (v2.0)
   Voice in: the phone's speech recognition (Chrome, kn-IN / en-IN, needs internet).
   Brain: DeepSeek, given ALL the app's trip info + live info (time, ticks, contacts, document names & notes).
   Voice out: the phone's own text-to-speech. Passport and Visa documents are never sent. */
'use strict';

const CHAT_SKIP_CATS = ['passport', 'visa'];          // never leaves the phone
const chat = { lang: Store.get('chatLang', 'kn'), busy: false, rec: null };
const CHAT_QUICK = ["What is next today?", "What is tomorrow's plan?", 'Hotel address and phone',
  'When is our flight home?', 'What can I eat here?', 'How much is 100,000 dong?'];

/* ---------- Knowledge: everything the app knows (English, compact). Built once. ---------- */
let kbCache = '';
function kbStatic() {
  if (kbCache) return kbCache;
  const T = DATA.trip, L = [];
  const fmtF = iso => new Date(iso).toLocaleString('en-GB', { timeZone: iso.endsWith('+07:00') ? 'Asia/Ho_Chi_Minh' : 'Asia/Kolkata',
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  L.push('# TRAVELLERS', 'Two parents, about 60, from Bengaluru, Kannada speakers, first trip abroad. Pure vegetarian (eggs OK). Relaxed pace.',
    'Trip: 23–30 Nov 2026. Hanoi, Ha Long Bay cruise, Ninh Binh. Vietnam time = India time + 1 h 30 min.');
  L.push('# HOTEL', `${T.hotel.en}, ${T.hotel.address_en} (Vietnamese: ${T.hotel.address_vi}). In the Old Quarter.`);
  L.push('# FLIGHTS (IndiGo)');
  [...T.flights.out, ...T.flights.back].forEach(f => L.push(`${f.no} ${f.from}→${f.to}: departs ${fmtF(f.dep)}${f.depTerm ? ' (' + f.depTerm + ')' : ''}, arrives ${fmtF(f.arr)}${f.arrTerm ? ' (' + f.arrTerm + ')' : ''}. Local times.`));
  L.push('# DAY-BY-DAY PLAN (local times)');
  T.days.forEach(d => {
    L.push(`## ${dayLabel(d)} — ${d.title_en}`);
    if (d.brief) {
      L.push(d.brief.who_en);
      d.brief.rows.forEach(r => L.push(`- ${r.when ? r.when + ': ' : ''}${r.en}${r.note_en ? ' — ' + r.note_en : ''}`));
      L.push('Food: ' + d.brief.food_en);
    } else d.stops.forEach(s => L.push(`- ${s.pending ? '(time to be confirmed) ' : stopTimeLabel(d, s) + ': '}${s.en}${s.mins ? ` (${s.mins} min)` : ''}${s.note_en ? ' — ' + s.note_en : ''}${s.pending_en ? ' — ' + s.pending_en : ''}`));
  });
  if (DATA.prep) {
    L.push('# AIRPORT STEPS');
    DATA.prep.airport.forEach(a => L.push(`## ${a.en} (${a.when})`, ...a.steps.map((s, i) => `${i + 1}. ${s.en}`)));
    L.push('# PACKING CHECKLISTS');
    DATA.prep.lists.forEach(l => L.push(`${l.en}: ${l.items.map(i => i.en).join('; ')}`));
  }
  if (DATA.restaurants) {
    L.push('# VEG RESTAURANTS (pure = pure vegetarian)');
    DATA.restaurants.restaurants.forEach(r => {
      const area = DATA.restaurants.areas.slice().sort((a, b) => haversineKm(r, a) - haversineKm(r, b))[0];
      L.push(`- ${r.name} [${r.veg}, ${r.cuisine}] ${r.addr}. Area: ${area.en}, ${haversineKm(r, area).toFixed(1)} km from its centre. Hours ${r.hours}. ${r.price}. ${r.note_en}`);
    });
    DATA.restaurants.areas.forEach(a => a.note_en && L.push(`Note for ${a.en}: ${a.note_en}`));
  }
  if (DATA.dishes) L.push('# SAFE VEG DISHES TO ORDER (Vietnamese – English)', ...DATA.dishes.dishes.map(d => `- ${d.vi} – ${d.en}`));
  if (DATA.phrases) {
    L.push('# WAITER CARD', `Vietnamese: ${DATA.phrases.waiter.vi}`, `English: ${DATA.phrases.waiter.en}`, '# PHRASES (Vietnamese [say it like] – English)');
    DATA.phrases.groups.forEach(g => L.push(`${g.name}: ${g.phrases.map(p => `${p.vi} [${p.say}] – ${p.en}`).join('; ')}`));
  }
  L.push('# MONEY', 'Currency: Vietnamese dong (₫). Notes: 10k, 20k, 50k, 100k, 200k, 500k. 20,000 and 500,000 are both blue; 10,000 and 100,000 differ by one zero — count the zeros.',
    'Bargaining: offer half, settle at 60–70%, smile, pay cash in dong, walk away if too high.');
  if (typeof CASH_STEPS !== 'undefined') {                // v2.2: cash plan + SIM
    L.push('# CASH PLAN', `Take US$${CASH_TOTAL} cash: US$${HOTEL_USD} is the hotel balance (pay at the hotel, keep receipt); the rest for meals, Hanoi taxis, tickets, shopping. Ha Long cruise and Ninh Binh are already paid.`,
      ...CASH_STEPS.map((s, i) => `Step ${i + 1} (${s.when}): ${s.en}.`),
      'Buy dollars in Bengaluru from: ' + BLR_FX.map(f => `${f.name} (${f.how}; ${f.docs})`).join('; ') + '. Ask for clean $100 notes, 2013 series or newer. Keep the forex receipt.',
      'Dollars to dong in Vietnam: ' + VN_FX.map(f => `${f.name} — ${f.hours}; ${f.note}`).join(' | '),
      'Leftover dong: spend first, keep ~200,000 dong; on Sunday 29 Nov change at Quang Huy 130 Hang Bac (open Sunday) or the airport bank counter before security.',
      '# SIM / INTERNET', 'Airtel free roaming pack (new postpaid plans ₹499+): 5 GB data, 60 min calls, 25 SMS, 5 days from first connecting abroad; turn on data roaming and activate in the Airtel Thanks app after landing in Hanoi (not in Mumbai). Visit the Airtel store in Sahakar Nagar before the trip to confirm plan, Vietnam coverage and enable roaming.',
      'Backup local SIM at Noi Bai arrivals (passport needed): ' + VN_SIMS.map(v => `${v[0]} ${v[1]}, ${v[2]}`).join('; ') + '.');
  }
  if (DATA.shopping) {
    L.push('# SHOPPING (prices in dong)');
    DATA.shopping.items.forEach(i => L.push(`- ${i.en}: ${i.vmin == null ? 'fixed/ask' : i.vmin + (i.vmax ? '–' + i.vmax : '+')} ₫. ${i.why_en} Tip: ${i.tip_en}`));
    L.push("Don't buy: " + DATA.shopping.skip.en.join('; '));
  }
  if (DATA.explore) {
    L.push('# OPTIONAL "MORE PLACES" (not in the plan; distance from hotel)');
    DATA.explore.places.forEach(x => L.push(`- #${x.rank} ${x.en}: ~${x.km} km, ~${x.mins} min. ${x.why_en} Best: ${x.best_en} Fits: ${x.fits_en}. Walking: ${x.walk_en}. Entry: ${x.entry}. ${x.tip_en}`));
  }
  if (DATA.emergency) {
    const E = DATA.emergency;
    L.push('# EMERGENCY', 'Police 113, Ambulance 115, Fire 114.',
      `Indian Embassy: ${E.embassy.en}, ${E.embassy.addr_en}. Emergency ${E.embassy.emergency}, office ${E.embassy.phone}. ${E.embassy.hours}.`,
      ...E.hospitals.map(h => `Hospital: ${h.en}, ${h.addr_en}, phone ${h.phone}. ${h.note_en}`));
  }
  if (DATA.places) {
    L.push('# PLACE STORIES (guide)');
    Object.entries(DATA.places).forEach(([k, p]) => k !== '_note' && L.push(`## ${p.en}`, [].concat(p.story_en).join(' ')));
  }
  L.push('# APP', 'Tabs: Today, Plan, Money, Food, More. Red SOS in the top bar. Plan: Mark done, Go (Google Maps), Show driver (address in Vietnamese). Food: Waiter card, Safe dishes. More: Phrases, Shopping, More places, Docs, Prep, Emergency, Settings.');
  return (kbCache = L.join('\n'));
}

async function kbLive() {
  const now = new Date(), s = getSettings(), cur = currentTripDay(now), nn = tripNowNext(now), v = getVisited();
  const t = (tz, o) => now.toLocaleString('en-GB', { timeZone: tz, ...o });
  const L = ['# RIGHT NOW',
    `Vietnam time: ${t('Asia/Ho_Chi_Minh', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. India time: ${t('Asia/Kolkata', { hour: 'numeric', minute: '2-digit' })}.`,
    cur.before ? `Trip has not started. Starts in ${cur.daysLeft} day(s).` : cur.after ? 'Trip is over — they are home.' : `Today is ${dayLabel(cur.day)} (${cur.day.title_en}).`,
    nn.inFlight ? 'They are in flight now.' : nn.now ? `Now: ${nn.now.s.en} (${stopTimeLabel(nn.now.day, nn.now.s)}).` : '',
    nn.next ? `Next: ${nn.next.s.en} at ${stopTimeLabel(nn.next.day, nn.next.s)} (${dayLabel(nn.next.day)}).` : '',
    `Marked done in Plan: ${Object.keys(v).join(', ') || 'nothing yet'}.`];
  const fx = getFx();
  L.push(`Exchange rate: 1 USD = ${fx.INR} INR = ${fx.VND} VND, so 100,000 ₫ ≈ ₹${Math.round(100000 / fx.VND * fx.INR)}.`);
  L.push('# SAVED NUMBERS');
  [[s.c1Name || 'Family 1', s.c1Phone], [s.c2Name || 'Family 2', s.c2Phone], ['Hotel', s.hotelPhone], ['Cruise', s.cruisePhone],
   ['Ninh Binh driver', s.driverPhone], ['Insurance helpline', s.insurancePhone]]
    .forEach(([n, p]) => L.push(`${n}: ${p || 'not saved'}`));
  if (s.medical) L.push(`Health notes: ${s.medical}`);
  try {
    const docs = (await DocDB.all()).filter(d => !d.deleted && !CHAT_SKIP_CATS.includes(d.cat));
    L.push('# DOCUMENTS SAVED IN THE APP (names and notes only; Passport and Visa are private and never shared)',
      ...(docs.length ? docs.map(d => `- [${docCat(d.cat)[2]}] ${d.name}${d.note ? ' — note: ' + d.note : ''}`) : ['None.']));
  } catch (e) {}
  return L.filter(Boolean).join('\n');
}

const chatSystem = lang => `You are a kind, calm helper inside the "RS Vietnam Trip" phone app, for two Indian parents (about 60, Kannada speakers) on their first trip abroad.
Use ONLY the trip information below and the live information sent with each question. If the answer is not there, say you don't know and suggest calling family (use the saved family name) or the hotel. Never invent times, prices, phone numbers or addresses. For any health emergency say: call 115 and the hotel, press the red SOS.
Be clear, direct and short: at most 2 short sentences, the most important fact first (time, place, number). No lists, no markdown, no emojis.
Use Vietnam time for things in Vietnam and India time for things in India. For directions say: open Plan and tap Show driver or Go.
Reply in EXACTLY this format:
${lang === 'kn' ? 'KN: <answer in simple, warm spoken Kannada (Kannada script)>\n' : ''}EN: <answer in simple English>
FROM: <the part of the information you used, e.g. Day 5 plan, Flights, Saved numbers, Documents>

=== TRIP INFORMATION ===
${kbStatic()}`;

/* ---------- DeepSeek ---------- */
async function chatAsk(question) {
  const key = getSettings().deepseekKey;
  if (!key) return { error: 'The helper is not set up. Ask family to add the DeepSeek key in Settings.', errorKn: 'ಸಹಾಯಕ ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ. Settings ನಲ್ಲಿ DeepSeek ಕೀ ಸೇರಿಸಲು ಮನೆಯವರಿಗೆ ಹೇಳಿ.' };
  if (!navigator.onLine) return { error: 'No internet. Connect to the hotel Wi-Fi and ask again.', errorKn: 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ಹೋಟೆಲ್ Wi-Fi ಗೆ ಸಂಪರ್ಕಿಸಿ ಮತ್ತೆ ಕೇಳಿ.' };
  const log = getChatLog().filter(m => m.a).slice(-2);
  const messages = [{ role: 'system', content: chatSystem(chat.lang) }];
  log.forEach(m => messages.push({ role: 'user', content: m.q }, { role: 'assistant', content: m.raw }));
  messages.push({ role: 'user', content: `${await kbLive()}\n\nQUESTION: ${question}` });
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(DS_URL, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.2, max_tokens: 350, messages })
    });
    if (r.status === 401) return { error: 'The DeepSeek key was not accepted. Ask family to check it in Settings.' };
    if (r.status === 402) return { error: 'DeepSeek balance is empty. Ask family to top up.' };
    if (r.status === 429) return { error: 'Too many questions. Wait a minute and ask again.' };
    if (!r.ok) return { error: `Service problem (${r.status}). Try again later.` };
    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content?.trim();
    return raw ? { raw } : { error: 'No answer. Please ask again.' };
  } catch (e) {
    return e.name === 'AbortError' ? { error: 'Too slow. Please ask again.', errorKn: 'ತುಂಬಾ ತಡವಾಯಿತು. ಮತ್ತೆ ಕೇಳಿ.' }
      : { error: 'Could not reach the helper. Check the Wi-Fi and ask again.', errorKn: 'ಸಹಾಯಕ ಸಿಗಲಿಲ್ಲ. Wi-Fi ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಕೇಳಿ.' };
  } finally { clearTimeout(timer); }
}
function parseAnswer(raw) {
  const pick = tag => (raw.match(new RegExp(`^\\s*${tag}:\\s*([\\s\\S]*?)(?=^\\s*(?:KN|EN|FROM):|$(?![\\s\\S]))`, 'm')) || [])[1]?.trim() || '';
  const kn = pick('KN'), en = pick('EN'), from = pick('FROM');
  return kn || en ? { kn, en, from } : { kn: '', en: raw, from: '' };
}

/* ---------- Log (last 20, on this phone) ---------- */
const getChatLog = () => Store.get('chatLog', []);
const saveChatLog = l => Store.set('chatLog', l.slice(-20));

/* ---------- Voice out ---------- */
async function chatSpeak(a) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const useKn = chat.lang === 'kn' && a.kn;
  const code = useKn ? 'kn-IN' : 'en-IN';
  const voice = pickVoice(await getVoicesAsync(), code);
  if (useKn && !voice) { toast('Kannada voice not installed — reading in English. / ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ.', 3500); }
  const u = new SpeechSynthesisUtterance(useKn && voice ? a.kn : a.en);
  u.lang = useKn && voice ? code : 'en-IN';
  const v2 = useKn && voice ? voice : pickVoice(await getVoicesAsync(), 'en-IN');
  if (v2) u.voice = v2;
  u.rate = 0.92;
  speechSynthesis.speak(u);
}

/* ---------- Screen ---------- */
function msgHtml(m, i) {
  const q = `<div class="bub me"><p>${esc(m.q)}</p></div>`;
  if (m.err) return q + `<div class="bub bot err"><p>${esc(m.err)}</p>${m.errKn ? `<p class="kn">${esc(m.errKn)}</p>` : ''}</div>`;
  if (!m.a) return q + `<div class="bub bot"><p class="muted">Thinking… <span class="kn">ಯೋಚಿಸುತ್ತಿದೆ…</span></p></div>`;
  return q + `<div class="bub bot">
      ${m.a.kn ? `<p class="kn big">${esc(m.a.kn)}</p>` : ''}
      ${m.a.en ? `<p${m.a.kn ? ' class="muted"' : ''}>${esc(m.a.en)}</p>` : ''}
      <div class="bub-foot">${m.a.from ? `<span class="from">📖 ${esc(m.a.from)}</span>` : ''}
        <button type="button" class="hear" data-hear="${i}" aria-label="Hear again">🔊 Hear</button></div>
    </div>`;
}

function renderChat() {
  const log = getChatLog();
  const noKey = !getSettings().deepseekKey;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return `<div class="chat">
    <div class="seg chat-lang" role="group" aria-label="Language">
      <button type="button" data-clang="kn" aria-pressed="${chat.lang === 'kn'}">ಕನ್ನಡ</button>
      <button type="button" data-clang="en" aria-pressed="${chat.lang === 'en'}">English</button>
    </div>
    ${noKey ? `<div class="card warn"><p><strong>Helper not set up yet.</strong> Ask family to add the DeepSeek key in Settings.</p>
      <p class="kn">ಸಹಾಯಕ ಇನ್ನೂ ಸಿದ್ಧವಿಲ್ಲ. Settings ನಲ್ಲಿ DeepSeek ಕೀ ಸೇರಿಸಲು ಮನೆಯವರಿಗೆ ಹೇಳಿ.</p></div>` : ''}
    <div id="chat-log" class="chat-log" aria-live="polite">${log.length ? log.map(msgHtml).join('')
      : `<div class="chat-hello"><p class="chat-big">🙏 Ask me anything about your trip</p>
          <p class="kn">ನಿಮ್ಮ ಪ್ರವಾಸದ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ — ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ</p>
          <p class="muted small">Flights, today's plan, food, money, phone numbers, your documents…</p></div>`}</div>
    <div class="fchips chat-quick">${CHAT_QUICK.map(q => `<button type="button" class="fchip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="chat-bar">
      ${SR ? `<button type="button" id="chat-mic" class="chat-mic" aria-label="Tap and speak">🎤</button>` : ''}
      <p id="chat-status" class="chat-status">${SR ? 'Tap the mic and speak <span class="kn">ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ</span>'
        : 'Voice input not available on this phone — please type. <span class="kn">ಟೈಪ್ ಮಾಡಿ</span>'}</p>
    </div>
    <form id="chat-form" class="chat-type" autocomplete="off">
      <input id="chat-input" type="text" placeholder="Or type your question…" aria-label="Type your question">
      <button type="submit" class="btn">Ask</button>
    </form>
    ${log.length ? '<button type="button" class="btn secondary" id="chat-clear">🗑 Clear chat</button>' : ''}
    <p class="muted small center">Answers use your trip info. Passport and visa are never shared. Check important things with family.</p>
  </div>`;
}

async function chatSubmit(q) {
  q = (q || '').trim();
  if (!q || chat.busy) return;
  chat.busy = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const log = getChatLog(); log.push({ q }); saveChatLog(log);
  paintLog();
  const res = await chatAsk(q);
  const l2 = getChatLog(), m = l2[l2.length - 1];
  if (res.raw) { m.raw = res.raw; m.a = parseAnswer(res.raw); } else { m.err = res.error; m.errKn = res.errorKn || ''; }
  saveChatLog(l2); chat.busy = false;
  if (currentRoute() !== 'chat') return;
  paintLog();
  if (m.a) chatSpeak(m.a);
}

function paintLog() {
  const box = document.getElementById('chat-log');
  if (!box) return;
  const log = getChatLog();
  if (!log.length) return;                     // keep the hello card
  box.innerHTML = log.map(msgHtml).join('');
  const last = box.lastElementChild;
  if (last) last.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = document.getElementById('chat-status'), mic = document.getElementById('chat-mic');
  if (!SR || !mic) return;
  if (chat.rec) { chat.rec.stop(); return; }                  // tap again = stop
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const rec = chat.rec = new SR();
  rec.lang = chat.lang === 'kn' ? 'kn-IN' : 'en-IN';
  rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let text = '';
  mic.classList.add('on');
  status.innerHTML = 'Listening… speak now <span class="kn">ಕೇಳುತ್ತಿದೆ… ಮಾತನಾಡಿ</span>';
  rec.onresult = e => {
    text = [...e.results].map(r => r[0].transcript).join(' ');
    status.innerHTML = `“${esc(text)}”`;
  };
  rec.onerror = e => {
    const msg = { 'not-allowed': 'Microphone not allowed. Tap "Allow" when the phone asks. / ಮೈಕ್ ಅನುಮತಿ ಕೊಡಿ.',
      'no-speech': "Didn't hear anything. Tap the mic and speak again. / ಕೇಳಿಸಲಿಲ್ಲ, ಮತ್ತೆ ಮಾತನಾಡಿ.",
      'network': 'Voice needs internet. Connect to Wi-Fi. / ಇಂಟರ್ನೆಟ್ ಬೇಕು.' }[e.error];
    if (msg) toast(msg, 4000);
  };
  rec.onend = () => {
    chat.rec = null;
    mic.classList.remove('on');
    status.innerHTML = 'Tap the mic and speak <span class="kn">ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ</span>';
    if (text.trim()) chatSubmit(text);
  };
  try { rec.start(); } catch (e) { chat.rec = null; mic.classList.remove('on'); }
}

function startChat() {
  const main = document.getElementById('screen');
  paintLog();
  const onClick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'chat-mic') return startListening();
    if (b.dataset.q) return chatSubmit(b.dataset.q);
    if (b.dataset.hear) { const m = getChatLog()[Number(b.dataset.hear)]; if (m?.a) chatSpeak(m.a); return; }
    if (b.dataset.clang) {
      chat.lang = b.dataset.clang; Store.set('chatLang', chat.lang);
      document.querySelectorAll('[data-clang]').forEach(x => x.setAttribute('aria-pressed', x === b));
      return;
    }
    if (b.id === 'chat-clear') { saveChatLog([]); render(); }
  };
  const onSubmit = e => {
    if (e.target.id !== 'chat-form') return;
    e.preventDefault();
    const inp = document.getElementById('chat-input');
    chatSubmit(inp.value); inp.value = ''; inp.blur();
  };
  main.addEventListener('click', onClick);
  main.addEventListener('submit', onSubmit);
  return () => {
    main.removeEventListener('click', onClick); main.removeEventListener('submit', onSubmit);
    if (chat.rec) { chat.rec.onend = null; chat.rec.abort(); chat.rec = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };
}

let chatFrom = 'today';
ROUTES.chat = { title: 'Ask the helper', tab: '', back: () => chatFrom,
  render: () => { if (!/^#chat/.test(prevHash) && prevHash) chatFrom = prevHash.slice(1) || 'today'; return renderChat(); },
  after: startChat };
