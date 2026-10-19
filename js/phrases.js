/* RS Vietnam Trip — Phrases (Phase 5) + shared Vietnamese voice helper
   data/phrases.json: 6 groups, 52 phrases. ▶ Play uses the phone's vi-VN voice. */
'use strict';

/* ----- Speak Vietnamese (used by Phrases, Dishes, Waiter card) ----- */
async function speakVi(text) {
  if (!('speechSynthesis' in window)) return toast('Voice not supported on this phone.');
  speechSynthesis.cancel();
  const voices = await getVoicesAsync();               // from story.js
  const voice = pickVoice(voices, 'vi-VN');
  if (!voice) showViHelp();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN'; if (voice) u.voice = voice; u.rate = 0.8;
  u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') showViHelp(); };
  speechSynthesis.speak(u);
}

function showViHelp() {   // F19: every time the voice is missing
  if (document.getElementById('vi-help')) return;
  const d = document.createElement('div');
  d.id = 'vi-help'; d.className = 'overlay';
  d.innerHTML = `<div class="card kn-help" role="dialog" aria-label="Vietnamese voice">
    <h3>Vietnamese voice not found</h3>
    <p class="kn">ವಿಯೆಟ್ನಾಮೀಸ್ ಧ್ವನಿ ಇಲ್ಲ. ಹೀಗೆ ಸೇರಿಸಿ:</p>
    ${voiceSteps('Vietnamese', 'ವಿಯೆಟ್ನಾಮೀಸ್')}
    <p class="muted small">Meanwhile, just show the big Vietnamese text.<br><span class="kn">ಅಲ್ಲಿಯವರೆಗೆ ದೊಡ್ಡ ಅಕ್ಷರವನ್ನು ತೋರಿಸಿ.</span></p>
    <button type="button" class="btn secondary" id="vi-help-ok">OK</button></div>`;
  document.body.appendChild(d);
  d.querySelector('#vi-help-ok').addEventListener('click', () => d.remove());
}

// Wires every [data-say] button on the current screen. Returns cleanup.
function startSayButtons() {
  const main = document.getElementById('screen');
  const onClick = e => { const b = e.target.closest('[data-say]'); if (b) speakVi(b.dataset.say); };
  main.addEventListener('click', onClick);
  return () => { main.removeEventListener('click', onClick); if ('speechSynthesis' in window) speechSynthesis.cancel(); };
}

/* ----- Phrases screen ----- */
const GROUP_ICON = { Greetings: '🙏', Food: '🍽', Shopping: '🛍', Directions: '🧭', Hotel: '🏨', Help: '🆘' };

function renderPhrases() {
  const groups = DATA.phrases?.groups;
  if (!groups) return `<div class="card"><p>Phrases not loaded. Close and reopen the app.</p></div>`;
  const cur = groups.find(g => g.name === routeParam()) || groups[0];
  const chips = groups.map(g => `<a class="daychip" href="#phrases:${g.name}" aria-current="${g === cur}">
      <strong>${GROUP_ICON[g.name] || ''}</strong><span>${g.name}</span></a>`).join('');
  const cards = cur.phrases.map(p => `<article class="card phrase">
      <p class="vi big-vi">${esc(p.vi)}</p>
      <p class="say">Say: <em>${esc(p.say)}</em></p>
      <p><strong>${esc(p.en)}</strong><br><span class="kn">${esc(p.kn)}</span></p>
      <button type="button" class="btn secondary" data-say="${esc(p.vi)}">▶ Play</button>
    </article>`).join('');
  return `<nav class="daybar" aria-label="Phrase groups">${chips}</nav>${cards}`;
}

ROUTES.phrases.render = renderPhrases;
ROUTES.phrases.after = () => {
  document.querySelector('.daychip[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  return startSayButtons();
};
