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
  if (lang === 'kn' && !voice) showKnHelp(false);   // one-time help; still try to speak
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
    if (tts.lang === 'kn') showKnHelp(true);
    else toast('Could not play voice.');
    ttsStop();
  };
  highlight(c.p);
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
function highlight(p) {
  document.querySelectorAll('.story-text p.speaking').forEach(el => el.classList.remove('speaking'));
  if (p < 0) return;
  const el = document.querySelector(`.story-text[data-lang="${tts.lang}"] p[data-p="${p}"]`);
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

function showKnHelp(force) {
  if (!force && Store.get('knHelpSeen', false)) return;
  const box = document.getElementById('kn-help');
  if (box) { box.hidden = false; box.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  Store.set('knHelpSeen', true);
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
  const paras = (list, lang) => list.map((t, i) =>
    `<p data-p="${i}"${lang === 'kn' ? ' class="kn"' : ''}>${esc(t)}</p>`).join('');

  return `<section class="card story-head">
      <h2>${esc(place.en)}</h2>
      <p class="kn muted">${esc(place.kn)}</p>
      <button type="button" class="btn" data-listen="kn">▶ Listen in Kannada</button>
      <button type="button" class="btn green" data-listen="en">▶ Listen in English</button>
    </section>
    ${renderAsk(['Tell me a short fun fact', 'Is this good for knee pain? Many steps?', 'What should I not miss here?'],
      `Place: ${place.en}, Vietnam. ${storyStop()?.note_en || ''}`)}

    <section class="card kn-help" id="kn-help" hidden>
      <h3>Kannada voice not found</h3>
      <p class="kn">ಈ ಫೋನ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ. ಹೀಗೆ ಸೇರಿಸಿ:</p>
      <ol>
        <li>Open phone <strong>Settings</strong> <span class="kn">(ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಿರಿ)</span></li>
        <li>Search <strong>Text-to-speech</strong> <span class="kn">(ಹುಡುಕಿ)</span></li>
        <li>Tap ⚙ next to <strong>Speech Services by Google</strong></li>
        <li><strong>Install voice data</strong> → <strong>Kannada (India)</strong> → download ⬇</li>
        <li>Come back and tap Listen again <span class="kn">(ಮತ್ತೆ ಕೇಳಿ ಒತ್ತಿ)</span></li>
      </ol>
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

ROUTES.story = { title: 'Guide story', tab: 'plan', back: () => 'plan:' + routeParam(),
                 render: renderStory, after: startStory };
