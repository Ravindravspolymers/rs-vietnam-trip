/* RS Vietnam Trip — 🎤 Translator (v2.1)
   🗣 I speak (Kannada / English) → DeepSeek writes short, polite, persuasive Vietnamese → phone speaks it (vi-VN).
   👂 They speak (Vietnamese) → spoken Kannada/English + price in ₹ + bargaining coach with one-tap replies.
   Always truthful and on our side. No tactics with police / airport / hospital. Offline: quick phrases with sound. */
'use strict';

const tr = { busy: false, rec: null, show: null };
const getTrLog = () => { try { return JSON.parse(sessionStorage.getItem('rs.trLog') || '[]'); } catch (e) { return []; } };
const saveTrLog = l => { try { sessionStorage.setItem('rs.trLog', JSON.stringify(l.slice(-30))); } catch (e) {} };

// Offline quick phrases (from data/phrases.json, spoken by the phone — no internet needed)
const TR_QUICK = ['How much?', 'Too expensive!', 'Can you reduce the price?', 'Please write the price on paper', "I'll take this",
  'Just looking', 'Thank you very much', 'I am vegetarian', 'No fish sauce', 'Take me to my hotel', "I don't understand"];
const trQuick = () => (DATA.phrases?.groups || []).flatMap(g => g.phrases).filter(p => TR_QUICK.includes(p.en))
  .sort((a, b) => TR_QUICK.indexOf(a.en) - TR_QUICK.indexOf(b.en));

const vndToInr = v => { const fx = getFx(); return Math.round(v / fx.VND * fx.INR); };
const fmtV = v => Number(v).toLocaleString('en-US') + ' ₫';

/* ---------- DeepSeek ---------- */
function trPrices() {
  const S = DATA.shopping;
  return S ? S.items.filter(i => i.vmin != null).map(i => `${i.en}: ${i.vmin}${i.vmax ? '–' + i.vmax : '+'} VND`).join('; ') : '';
}
const TR_RULES = `You are the voice of two Indian travellers, about 60 years old, pure vegetarian, visiting Vietnam (Hanoi, Ha Long Bay, Ninh Binh). You are ALWAYS on their side.
Style for anything said to Vietnamese people: short (1–2 sentences), warm, polite and respectful. Use "tôi"/"chúng tôi" for us; avoid "bạn" — use polite forms (anh/chị only if clearly known, otherwise leave out the pronoun). Add "ạ" or "nhé" where natural.
Be persuasive in a gentle way: a sincere compliment (liking), a reason (we'll buy two, we are guests — reciprocity), calibrated questions ("How can we make this price work?"), labeling ("It looks like you work hard on these"), and a polite no ("That is a bit hard for us").
Be TRUTHFUL: never invent facts, other shops' prices, deadlines or promises they did not make. Keep every number exactly as given. If they say an amount in rupees, convert it to đồng with the rate given.
If their words are rude or angry, keep their meaning but say it politely.
With police, officials, airport, immigration, hotel reception for problems, doctors or hospitals: translate plainly and respectfully, no persuasion tactics.
Current rate: 1 USD = ${'${fx}'}.
Typical fair prices in Hanoi markets: ${'${prices}'}`;

function trSystem() {
  const fx = getFx();
  return TR_RULES.replace('${fx}', `${fx.INR} INR = ${fx.VND} VND (100,000 VND ≈ ₹${vndToInr(100000)})`).replace('${prices}', trPrices());
}

async function trCall(task, text) {
  const key = getSettings().deepseekKey;
  if (!key) return { error: 'Translator not set up. Ask family to add the DeepSeek key in Settings.', errorKn: 'ಅನುವಾದಕ ಸಿದ್ಧವಿಲ್ಲ. Settings ನಲ್ಲಿ DeepSeek ಕೀ ಸೇರಿಸಲು ಮನೆಯವರಿಗೆ ಹೇಳಿ.' };
  if (!navigator.onLine) return { error: 'No internet. Use the quick phrases below.', errorKn: 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ಕೆಳಗಿನ ಸಿದ್ಧ ವಾಕ್ಯಗಳನ್ನು ಬಳಸಿ.' };
  const hist = getTrLog().filter(m => (m.who === 'me' && m.vi) || (m.who === 'them' && !m.pending)).slice(-6).map(m => m.who === 'me' ? `Traveller said (in Vietnamese): ${m.vi}` : `Vietnamese person said: ${m.said}`).join('\n') || '(start of conversation)';
  const lang = chat.lang === 'kn' ? 'Kannada (simple spoken Kannada, Kannada script)' : 'simple English';
  const user = task === 'me'
    ? `Conversation so far:\n${hist}\n\nThe traveller now says (in ${chat.lang === 'kn' ? 'Kannada or English' : 'English'}): "${text}"
Return JSON: {"vi": "<what to say in Vietnamese>", "back": "<the same Vietnamese message in ${lang}, so the traveller knows what is being said>"}`
    : `Conversation so far:\n${hist}\n\nThe Vietnamese person now says: "${text}"
Return JSON: {"meaning": "<what they said, in ${lang}>",
"price_vnd": <number if they named a price for something, else null>,
"fair_low": <fair price low in VND if you can judge from the fair-price list or common sense, else null>, "fair_high": <number or null>,
"advice": "<one short tip for the traveller in ${lang}, on their side>",
"replies": [ {"label": "<2–5 word button text in ${lang}>", "vi": "<polite persuasive Vietnamese to say>"} ] }
Give 2–3 replies the traveller can tap (e.g. a counter-offer about 30–40% lower if a price was named, a polite question, a polite thank-you-and-leave). If no price, replies can be a simple polite answer.`;
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(DS_URL, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, max_tokens: 400, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: trSystem() }, { role: 'user', content: user }] })
    });
    if (r.status === 401) return { error: 'The DeepSeek key was not accepted. Ask family to check Settings.' };
    if (r.status === 402) return { error: 'DeepSeek balance is empty. Ask family to top up.' };
    if (!r.ok) return { error: `Service problem (${r.status}). Use the quick phrases below.` };
    const j = await r.json();
    return { data: JSON.parse(j.choices?.[0]?.message?.content || '{}') };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'Too slow. Please try again.' : 'Could not connect. Check Wi-Fi or use the quick phrases.',
      errorKn: 'ಸಂಪರ್ಕ ಸಿಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಸಿದ್ಧ ವಾಕ್ಯಗಳನ್ನು ಬಳಸಿ.' };
  } finally { clearTimeout(timer); }
}

/* ---------- Voice out ---------- */
async function trSayHome(text) {                       // Kannada (or English) for the traveller
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const code = chat.lang === 'kn' ? 'kn-IN' : 'en-IN';
  const voice = pickVoice(await getVoicesAsync(), code);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = code; if (voice) u.voice = voice; u.rate = 0.92;
  speechSynthesis.speak(u);
}

/* ---------- Conversation ---------- */
function trMsgHtml(m, i) {
  if (m.who === 'me') return `<div class="bub me tr-me">
      <p class="vi-big" lang="vi">${esc(m.vi)}</p>
      ${m.back ? `<p class="${chat.lang === 'kn' ? 'kn ' : ''}muted">🗣 ${esc(m.back)}</p>` : ''}
      <div class="bub-foot"><button type="button" class="hear" data-trsay="${i}">🔊 Again</button>
        <button type="button" class="hear" data-trshow="${i}">📺 Show vendor</button></div></div>`;
  if (m.err) return `<div class="bub bot err"><p>${esc(m.err)}</p>${m.errKn ? `<p class="kn">${esc(m.errKn)}</p>` : ''}</div>`;
  if (m.pending) return `<div class="bub ${m.who === 'them' ? 'bot' : 'me'}"><p class="muted">${m.who === 'them' ? '👂' : '🗣'} “${esc(m.said || '')}”<br>Translating… <span class="kn">ಅನುವಾದಿಸುತ್ತಿದೆ…</span></p></div>`;
  const price = m.price ? `<p class="tr-price">💰 ${fmtV(m.price)} = <strong>₹${vndToInr(m.price).toLocaleString('en-IN')}</strong>
      ${m.fl && m.fh ? `<br><span class="muted">Fair: ${fmtV(m.fl)}–${fmtV(m.fh)} (₹${vndToInr(m.fl)}–${vndToInr(m.fh)})</span>` : ''}</p>` : '';
  return `<div class="bub bot tr-them">
      <p class="${chat.lang === 'kn' ? 'kn ' : ''}big">${esc(m.meaning)}</p>
      <p class="muted small" lang="vi">👂 ${esc(m.said)}</p>
      ${price}
      ${m.advice ? `<p class="tr-advice">💡 <span class="${chat.lang === 'kn' ? 'kn' : ''}">${esc(m.advice)}</span></p>` : ''}
      <div class="bub-foot"><button type="button" class="hear" data-trhear="${i}">🔊 Hear</button></div>
      ${(m.replies || []).length ? `<p class="tr-tap">Tap to reply in Vietnamese <span class="kn">ಒತ್ತಿ — ವಿಯೆಟ್ನಾಮೀಸ್‌ನಲ್ಲಿ ಹೇಳುತ್ತದೆ</span></p>
        <div class="tr-replies">${m.replies.map((r, k) => `<button type="button" class="fchip" data-trreply="${i}:${k}">${esc(r.label)}</button>`).join('')}</div>` : ''}
    </div>`;
}

function renderTranslate() {
  const log = getTrLog();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ready = !!getSettings().deepseekKey && navigator.onLine;
  return `<div class="tr">
    <div class="seg chat-lang" role="group" aria-label="My language">
      <button type="button" data-clang="kn" aria-pressed="${chat.lang === 'kn'}">ಕನ್ನಡ</button>
      <button type="button" data-clang="en" aria-pressed="${chat.lang === 'en'}">English</button>
    </div>
    ${!ready ? `<div class="card warn"><p><strong>${navigator.onLine ? 'Translator not set up yet (needs the DeepSeek key in Settings).' : 'No internet — use the quick phrases below.'}</strong></p>
      <p class="kn">${navigator.onLine ? 'Settings ನಲ್ಲಿ DeepSeek ಕೀ ಬೇಕು.' : 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ — ಕೆಳಗಿನ ಸಿದ್ಧ ವಾಕ್ಯಗಳನ್ನು ಒತ್ತಿ.'}</p></div>` : ''}
    <p class="flabel">Quick phrases (work without internet) <span class="kn muted">ಸಿದ್ಧ ವಾಕ್ಯಗಳು</span></p>
    <div class="fchips chat-quick">${trQuick().map(p => `<button type="button" class="fchip" data-trquick="${esc(p.vi)}">${esc(p.en)}</button>`).join('')}</div>
    <div id="tr-log" class="chat-log" aria-live="polite">${log.length ? log.map(trMsgHtml).join('') : `<div class="chat-hello">
        <p class="chat-big">🗣 ↔ 🇻🇳 Talk with anyone</p>
        <p>1. Tap <strong>I speak</strong> and say it in ${chat.lang === 'kn' ? 'Kannada' : 'English'}. The phone says it politely in Vietnamese.</p>
        <p>2. Tap <strong>They speak</strong> and hold the phone to them. You hear it in ${chat.lang === 'kn' ? 'Kannada' : 'English'}.</p>
        <p class="kn">1. "I speak" ಒತ್ತಿ ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ — ಫೋನ್ ವಿಯೆಟ್ನಾಮೀಸ್‌ನಲ್ಲಿ ವಿನಯದಿಂದ ಹೇಳುತ್ತದೆ. 2. "They speak" ಒತ್ತಿ ಫೋನ್ ಅವರ ಕಡೆ ಹಿಡಿಯಿರಿ — ನಿಮಗೆ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿಸುತ್ತದೆ.</p>
      </div>`}</div>
    <div class="tr-bar">
      <p id="tr-status" class="chat-status">${SR ? 'Tap a button, then speak <span class="kn">ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ</span>' : 'Voice input not available on this phone. Use quick phrases.'}</p>
      <div class="tr-btns">
        <button type="button" class="tr-btn me" data-listen="me" ${SR && ready ? '' : 'disabled'}>🗣<span>I speak</span><span class="kn">ನಾನು</span></button>
        <button type="button" class="tr-btn them" data-listen="them" ${SR && ready ? '' : 'disabled'}>👂<span>They speak</span><span class="kn">ಅವರು</span></button>
      </div>
      <button type="button" class="tr-new" id="tr-new" ${log.length ? '' : 'hidden'}>↺ New vendor <span class="kn">ಹೊಸ ವ್ಯಕ್ತಿ</span></button>
    </div>
  </div>`;
}

function trPaint() {
  const box = document.getElementById('tr-log'), log = getTrLog();
  if (!box || !log.length) return;
  box.innerHTML = log.map(trMsgHtml).join('');
  box.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  const nv = document.getElementById('tr-new'); if (nv) nv.hidden = false;
}

async function trHandle(who, said) {
  said = (said || '').trim();
  if (!said || tr.busy) return;
  tr.busy = true;
  const log = getTrLog(); log.push({ who, said, pending: true }); saveTrLog(log); trPaint();
  const res = await trCall(who, said);
  const l2 = getTrLog(), m = l2[l2.length - 1];
  delete m.pending;
  if (res.error) Object.assign(m, { who: 'err', err: res.error, errKn: res.errorKn || '' });
  else if (who === 'me') Object.assign(m, { vi: res.data.vi || '', back: res.data.back || '' });
  else {
    const d = res.data, num = v => (typeof v === 'number' && v > 0 ? Math.round(v) : null);
    Object.assign(m, { meaning: d.meaning || said, price: num(d.price_vnd), fl: num(d.fair_low), fh: num(d.fair_high), advice: d.advice || '',
      replies: (Array.isArray(d.replies) ? d.replies : []).filter(r => r && r.vi && r.label).slice(0, 3) });
  }
  if (m.who === 'me' && !m.vi) Object.assign(m, { who: 'err', err: 'Could not translate. Please try again.' });
  saveTrLog(l2); tr.busy = false;
  if (currentRoute() !== 'translate') return;
  trPaint();
  if (m.who === 'me') speakVi(m.vi);
  else if (m.who === 'them') trSayHome(m.meaning + (m.price ? (chat.lang === 'kn' ? ` — ${vndToInr(m.price)} ರೂಪಾಯಿ.` : ` — about ${vndToInr(m.price)} rupees.`) : ''));
}

function trListen(who) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = document.getElementById('tr-status');
  if (!SR || tr.busy) return;
  if (tr.rec) { tr.rec.stop(); return; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const btn = document.querySelector(`[data-listen="${who}"]`);
  const rec = tr.rec = new SR();
  rec.lang = who === 'them' ? 'vi-VN' : chat.lang === 'kn' ? 'kn-IN' : 'en-IN';
  rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let text = '';
  btn?.classList.add('on');
  status.innerHTML = who === 'them' ? 'Listening to them… hold the phone towards them <span class="kn">ಅವರ ಕಡೆ ಫೋನ್ ಹಿಡಿಯಿರಿ</span>'
    : 'Listening… speak now <span class="kn">ಮಾತನಾಡಿ</span>';
  rec.onresult = e => { text = [...e.results].map(r => r[0].transcript).join(' '); status.innerHTML = `“${esc(text)}”`; };
  rec.onerror = e => {
    const msg = { 'not-allowed': 'Microphone not allowed. Tap "Allow" when asked. / ಮೈಕ್ ಅನುಮತಿ ಕೊಡಿ.',
      'no-speech': "Didn't hear anything. Try again. / ಕೇಳಿಸಲಿಲ್ಲ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      'network': 'Voice needs internet. / ಇಂಟರ್ನೆಟ್ ಬೇಕು.', 'language-not-supported': 'This language is not available for voice on this phone.' }[e.error];
    if (msg) toast(msg, 4000);
  };
  rec.onend = () => {
    tr.rec = null; btn?.classList.remove('on');
    if (status) status.innerHTML = 'Tap a button, then speak <span class="kn">ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ</span>';
    if (text.trim()) trHandle(who, text);
  };
  try { rec.start(); } catch (e) { tr.rec = null; btn?.classList.remove('on'); }
}

/* ---------- Show vendor: full-screen huge Vietnamese ---------- */
function trShowVendor(vi) {
  document.getElementById('tr-show')?.remove();
  const d = document.createElement('div');
  d.id = 'tr-show'; d.className = 'tr-show'; d.setAttribute('role', 'dialog');
  d.innerHTML = `<p lang="vi">${esc(vi)}</p>
    <div class="tr-show-btns"><button type="button" class="btn" data-showsay>🔊 Speak</button>
      <button type="button" class="btn secondary" data-showclose>✕ Close</button></div>`;
  d.addEventListener('click', e => {
    if (e.target.closest('[data-showsay]')) return speakVi(vi);
    if (e.target.closest('[data-showclose]') || e.target === d) d.remove();
  });
  document.body.appendChild(d);
}

function startTranslate() {
  const main = document.getElementById('screen');
  const onClick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.listen) return trListen(b.dataset.listen);
    if (b.dataset.trquick) return speakVi(b.dataset.trquick);
    const log = getTrLog();
    if (b.dataset.trsay) return speakVi(log[+b.dataset.trsay]?.vi || '');
    if (b.dataset.trshow) return trShowVendor(log[+b.dataset.trshow]?.vi || '');
    if (b.dataset.trhear) { const m = log[+b.dataset.trhear]; return trSayHome(m?.meaning || ''); }
    if (b.dataset.trreply) {                                    // one tap: say the suggested reply in Vietnamese
      const [i, k] = b.dataset.trreply.split(':').map(Number), r = log[i]?.replies?.[k];
      if (!r) return;
      log.push({ who: 'me', said: r.label, vi: r.vi, back: r.label }); saveTrLog(log); trPaint(); speakVi(r.vi);
      return;
    }
    if (b.dataset.clang) {
      chat.lang = b.dataset.clang; Store.set('chatLang', chat.lang);
      document.querySelectorAll('[data-clang]').forEach(x => x.setAttribute('aria-pressed', x === b));
      return;
    }
    if (b.id === 'tr-new') { saveTrLog([]); render(); toast('Ready for a new person ✓ / ಸಿದ್ಧ'); }
  };
  main.addEventListener('click', onClick);
  // Vietnamese voice check, once per session
  try {
    if (!sessionStorage.getItem('rs.viChecked')) {
      sessionStorage.setItem('rs.viChecked', '1');
      getVoicesAsync().then(v => { if (v.length && !pickVoice(v, 'vi-VN')) showViHelp(); });
    }
  } catch (e) {}
  return () => {
    main.removeEventListener('click', onClick);
    if (tr.rec) { tr.rec.onend = null; tr.rec.abort(); tr.rec = null; }
    document.getElementById('tr-show')?.remove();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };
}

let trFrom = 'today';
ROUTES.translate = { title: 'Translate', tab: '', back: () => trFrom,
  render: () => { if (!/^#translate/.test(prevHash) && prevHash) trFrom = prevHash.slice(1) || 'today'; return renderTranslate(); },
  after: startTranslate };
