/* RS Vietnam Trip — Guide stories + voice (Phase 4)
   Reads data/places.json. Speaks with the phone's own text-to-speech (works offline
   once the voice is installed). Speaks sentence by sentence so Pause/Resume is reliable on Android. */
'use strict';

const TTS_LANG = { kn: 'kn-IN', en: 'en-IN' };
const tts = { chunks: [], idx: 0, lang: 'kn', state: 'idle', token: 0 }; // state: idle | playing | paused

/* ----- Voices ----- */
function getVoicesAsync() {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res([]);
    const v = speechSynthesis.getVoices();
    if (v.length) return res(v);
    const done = () => res(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}
function pickVoice(voices, code) {
  const norm = l => l.replace('_', '-').toLowerCase();
  return voices.find(v => norm(v.lang) === code.toLowerCase())
      || voices.find(v => norm(v.lang).startsWith(code.slice(0, 2)));
}

/* ----- Text → sentences (each remembers its paragraph for highlighting) ----- */
function toChunks(paras) {
  const out = [];
  paras.forEach((p, i) => p.split(/(?<=[.!?।])\s+/).forEach(t => { if (t.trim()) out.push({ t: t.trim(), p: i }); }));
  return out;
}

/* ----- Player ----- */
async function ttsPlay(lang) {
  if (!('speechSynthesis' in window)) return toast('Voice not supported on this phone.');
  const place = storyPlace();
  if (!place) return;
  ttsStop();
  showStoryLang(lang);
  const voices = await getVoicesAsync();
  const voice = pickVoice(voices, TTS_LANG[lang]);
  if (lang === 'kn' && !voice) showKnHelp();   // F19: show help every time the voice is missing; still try to speak
  Object.assign(tts, { chunks: toChunks(place['story_' + lang]), idx: 0, lang, voice, state: 'playing' });
  speakNext();
}

function speakNext() {
  if (tts.state !== 'playing') return;
  if (tts.idx >= tts.chunks.length) { ttsStop(); return; }
  const my = ++tts.token;
  const c = tts.chunks[tts.idx];
  const u = new SpeechSynthesisUtterance(c.t);
  u.lang = TTS_LANG[tts.lang];
  if (tts.voice) u.voice = tts.voice;
  u.rate = 0.9;
  u.onend = () => { if (my !== tts.token) return; tts.idx++; speakNext(); };
  u.onerror = e => {
    if (my !== tts.token || e.error === 'interrupted' || e.error === 'canceled') return;
    if (tts.lang === 'kn') showKnHelp();
    else toast('Could not play voice.');
    ttsStop();
  };
  highlight(tts.idx);
  speechSynthesis.speak(u);
  updateControls();
}

function ttsPause() {
  if (tts.state !== 'playing') return;
  tts.state = 'paused'; tts.token++;
  speechSynthesis.cancel();             // Android pause() is unreliable; we restart the sentence on resume
  updateControls();
}
function ttsResume() {
  if (tts.state !== 'paused') return;
  tts.state = 'playing';
  speakNext();
}
function ttsStop() {
  tts.token++; tts.state = 'idle'; tts.idx = 0;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  highlight(-1);
  updateControls();
}

/* ----- UI helpers ----- */
function highlight(ci) {
  document.querySelectorAll('.story-text .speaking').forEach(el => el.classList.remove('speaking'));
  if (ci < 0) return;
  const el = document.querySelector(`.story-text[data-lang="${tts.lang}"] span[data-c="${ci}"]`);
  if (el) { el.classList.add('speaking'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

function updateControls() {
  const bar = document.getElementById('tts-bar');
  if (!bar) return;
  bar.hidden = tts.state === 'idle';
  const pr = document.getElementById('tts-pause');
  if (pr) pr.textContent = tts.state === 'paused' ? '▶ Resume' : '⏸ Pause';
  const lbl = document.getElementById('tts-now');
  if (lbl) lbl.textContent = (tts.lang === 'kn' ? 'Kannada' : 'English') + (tts.state === 'paused' ? ' — paused' : ' — playing');
}

function showStoryLang(lang) {
  document.querySelectorAll('.story-text').forEach(el => { el.hidden = el.dataset.lang !== lang; });
  document.querySelectorAll('[data-show]').forEach(b => b.setAttribute('aria-pressed', b.dataset.show === lang));
}

function showKnHelp() {
  const box = document.getElementById('kn-help');
  if (box) { box.hidden = false; box.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
}

/* ----- Screen ----- */
function storyStop() {
  const id = routeParam();
  for (const d of DATA.trip?.days || []) {
    const s = d.stops.find(x => x.id === id);
    if (s) return s;
  }
  return null;
}
const storyPlace = () => { const s = storyStop(); return s && DATA.places ? DATA.places[s.place] : null; };

function renderStory() {
  const place = storyPlace();
  if (!place) return `<div class="card"><h2>Story not found</h2></div>`;
  // Each sentence is a span (same split as the speaker uses) so the current sentence can be highlighted
  const paras = (list, lang) => {
    const chunks = toChunks(list);
    return list.map((t, i) => `<p data-p="${i}"${lang === 'kn' ? ' class="kn"' : ''}>${chunks.map((c, ci) => c.p === i
      ? `<span data-c="${ci}">${esc(c.t)}</span> ` : '').join('')}</p>`).join('');
  };

  return `<section class="card story-head">
      <h2>${esc(place.en)}</h2>
      ${place.vi ? `<p class="vi">${esc(place.vi)}</p>` : ''}
      <p class="kn muted">${esc(place.kn)}</p>
      <button type="button" class="btn" data-listen="kn">▶ Listen in Kannada</button>
      <button type="button" class="btn green" data-listen="en">▶ Listen in English</button>
    </section>
    ${renderAsk(['Tell me a short fun fact', 'Is this good for knee pain? Many steps?', 'What should I not miss here?'],
      `Place: ${place.en}, Vietnam. ${storyStop()?.note_en || ''}`)}

    <section class="card kn-help" id="kn-help" hidden>
      <h3>Kannada voice not found</h3>
      <p class="kn">ಈ ಫೋನ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ. ಹೀಗೆ ಸೇರಿಸಿ:</p>
      ${voiceSteps('Kannada (India)', 'ಕನ್ನಡ')}
      <button type="button" class="btn secondary" data-close-help>OK</button>
    </section>

    <div class="seg story-lang" role="group" aria-label="Show text in">
      <button type="button" data-show="kn" aria-pressed="true">Kannada</button>
      <button type="button" data-show="en" aria-pressed="false">English</button>
    </div>

    <section class="card story-text" data-lang="kn">${paras(place.story_kn, 'kn')}</section>
    <section class="card story-text" data-lang="en" hidden>${paras(place.story_en, 'en')}</section>

    <div class="tts-bar" id="tts-bar" hidden>
      <span id="tts-now" class="tts-now"></span>
      <div class="tts-btns">
        <button type="button" class="btn secondary" id="tts-pause">⏸ Pause</button>
        <button type="button" class="btn" id="tts-stop">⏹ Stop</button>
      </div>
    </div>`;
}

function startStory() {
  const main = document.getElementById('screen');
  const onClick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.listen) return ttsPlay(b.dataset.listen);
    if (b.dataset.show) { if (tts.state !== 'idle' && tts.lang !== b.dataset.show) ttsStop(); return showStoryLang(b.dataset.show); }
    if (b.hasAttribute('data-close-help')) { document.getElementById('kn-help').hidden = true; return; }
    if (b.id === 'tts-pause') return tts.state === 'paused' ? ttsResume() : ttsPause();
    if (b.id === 'tts-stop') return ttsStop();
  };
  main.addEventListener('click', onClick);
  return () => { main.removeEventListener('click', onClick); ttsStop(); };
}

/* F19: shared, bilingual voice-install steps (step 0 covers Samsung phones) */
function voiceSteps(lang, langKn) {
  return `<ol class="vsteps">
    <li>Phone <strong>Settings</strong> → search <strong>Text-to-speech</strong> → <strong>Preferred engine</strong> → choose <strong>Speech Services by Google</strong>
      <br><span class="kn">ಫೋನ್ ಸೆಟ್ಟಿಂಗ್ಸ್ → 'Text-to-speech' ಹುಡುಕಿ → 'Preferred engine' → 'Speech Services by Google' ಆರಿಸಿ (ಸ್ಯಾಮ್‌ಸಂಗ್ ಫೋನ್‌ಗಳಲ್ಲಿ ಮುಖ್ಯ)</span></li>
    <li>Tap ⚙ next to <strong>Speech Services by Google</strong><br><span class="kn">ಅದರ ಪಕ್ಕದ ⚙ ಒತ್ತಿ</span></li>
    <li><strong>Install voice data</strong> → <strong>${lang}</strong> → download ⬇<br><span class="kn">'Install voice data' → ${langKn} → ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ</span></li>
    <li>Come back and try again<br><span class="kn">ವಾಪಸ್ ಬಂದು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ</span></li>
  </ol>`;
}

function renderVoiceHelp() {
  return `<section class="card"><h2>Kannada voice <span class="kn muted">ಕನ್ನಡ ಧ್ವನಿ</span></h2>
      ${voiceSteps('Kannada (India)', 'ಕನ್ನಡ')}
      <button type="button" class="btn" data-vtest="kn-IN|ನಮಸ್ಕಾರ, ಶುಭ ಪ್ರಯಾಣ">▶ Test Kannada voice</button></section>
    <section class="card"><h2>Vietnamese voice <span class="kn muted">ವಿಯೆಟ್ನಾಮೀಸ್ ಧ್ವನಿ</span></h2>
      ${voiceSteps('Vietnamese', 'ವಿಯೆಟ್ನಾಮೀಸ್')}
      <button type="button" class="btn" data-vtest="vi-VN|Xin chào. Cảm ơn.">▶ Test Vietnamese voice</button></section>
    <p id="vtest-out" class="center" aria-live="polite"></p>`;
}
function startVoiceHelp() {
  const main = document.getElementById('screen');
  const onClick = async e => {
    const b = e.target.closest('[data-vtest]'); if (!b) return;
    const [code, text] = b.dataset.vtest.split('|');
    const out = document.getElementById('vtest-out');
    if (!('speechSynthesis' in window)) { out.textContent = 'Voice not supported on this phone.'; return; }
    const v = pickVoice(await getVoicesAsync(), code);
    out.innerHTML = v ? '✓ Voice found / ಧ್ವನಿ ಇದೆ' : '✗ Voice not found — follow the steps / ಧ್ವನಿ ಇಲ್ಲ — ಮೇಲಿನ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ';
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = code; if (v) u.voice = v; speechSynthesis.speak(u);
  };
  main.addEventListener('click', onClick);
  return () => main.removeEventListener('click', onClick);
}
ROUTES.voicehelp = { title: 'Voice setup', tab: 'more', back: 'today', render: renderVoiceHelp, after: startVoiceHelp };

ROUTES.story = { title: 'Guide story', tab: 'plan', back: () => 'plan:' + routeParam(),
                 render: renderStory, after: startStory };
