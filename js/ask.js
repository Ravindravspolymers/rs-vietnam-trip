/* RS Vietnam Trip — DeepSeek "Ask" preset questions (Phase 9)
   No open chat box: 2–4 preset buttons per screen. Hidden until a key is saved in Settings.
   Answers are saved on the phone so they can be re-read offline. */
'use strict';

const DS_URL = 'https://api.deepseek.com/chat/completions';
const DS_SYSTEM = [
  'You help two Indian tourists, about 60 years old, on their first trip abroad: Hanoi, Ha Long Bay and Ninh Binh in Vietnam, 24–29 November 2026.',
  'They are pure vegetarian: no meat, no fish, no fish sauce, no oyster sauce, no meat stock. Eggs are OK.',
  'They walk slowly; care about knees, steps and rest.',
  'Answer in at most 3 short lines of very simple English. Then give the same answer in natural spoken Kannada (Kannada script), also at most 3 short lines.',
  'Never invent prices, opening hours, phone numbers or addresses. If unsure, say "please check locally".',
  'No markdown, no lists, no emojis.'
].join(' ');

const getAskCache = () => Store.get('askCache', {});
function saveAnswer(key, text) {
  const c = getAskCache();
  c[key] = { text, at: Date.now() };
  const keys = Object.keys(c).sort((a, b) => c[b].at - c[a].at);
  keys.slice(50).forEach(k => delete c[k]);          // keep the latest 50
  Store.set('askCache', c);
}

async function askDeepSeek(question, context) {
  const key = getSettings().deepseekKey;
  if (!key) return { error: 'Add the DeepSeek key in Settings first.' };
  if (!navigator.onLine) return { error: 'No internet now. Ask again when online.\nಈಗ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ನಂತರ ಮತ್ತೆ ಕೇಳಿ.' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(DS_URL, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'deepseek-chat', temperature: 0.3, max_tokens: 300,
        messages: [{ role: 'system', content: DS_SYSTEM },
                   { role: 'user', content: (context ? `Context: ${context}\n\n` : '') + `Question: ${question}` }]
      })
    });
    if (r.status === 401) return { error: 'The key was not accepted. Check it in Settings.' };
    if (r.status === 402) return { error: 'DeepSeek balance is empty. Ask your family to top up.' };
    if (r.status === 429) return { error: 'Too many questions. Wait a minute and try again.' };
    if (!r.ok) return { error: `Service problem (${r.status}). Try later.` };
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content?.trim();
    return text ? { text } : { error: 'No answer. Try again.' };
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'Too slow. Try again.\nತುಂಬಾ ತಡವಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' };
    return { error: 'Could not reach DeepSeek (weak signal, or blocked by the browser). Try again later.' };
  } finally { clearTimeout(timer); }
}

/* ----- UI block: call renderAsk(presets, context) from any screen ----- */
let askSeq = 0;
function renderAsk(presets, context) {
  // v2.0: one helper for everything — the small preset boxes now point to the 🎤 Ask screen
  return getSettings().deepseekKey ? `<a class="btn secondary" href="#chat">🎤 Ask the helper <span class="kn">ಸಹಾಯಕನನ್ನು ಕೇಳಿ</span></a>` : '';
}
function renderAskOld(presets, context) {
  if (!getSettings().deepseekKey) return '';           // hidden until a key is saved
  const id = 'ask' + (++askSeq);
  const cache = getAskCache();
  return `<section class="card ask" id="${id}" data-ctx="${esc(context || '')}">
    <h3>🤖 Ask a helper <span class="kn muted">ಸಹಾಯಕನನ್ನು ಕೇಳಿ</span></h3>
    ${presets.map(q => `<button type="button" class="btn secondary ask-q" data-ask="${esc(q)}">${esc(q)}${cache[askKey(q, context)] ? ' ✓' : ''}</button>`).join('')}
    <div class="ask-out" aria-live="polite" hidden></div>
    <p class="muted small">AI answers can be wrong. Check important things locally.</p>
  </section>`;
}
const askKey = (q, ctx) => q + '|' + (ctx || '');

async function runAsk(btn, question) {
  const box = btn.closest('.ask');
  const out = box.querySelector('.ask-out');
  const ctx = box.dataset.ctx;
  const k = askKey(question, ctx);
  out.hidden = false;
  const cached = getAskCache()[k];
  if (cached && !navigator.onLine) { showAnswer(out, question, cached.text, true); return; }
  out.innerHTML = `<p class="muted">Thinking… <span class="kn">ಯೋಚಿಸುತ್ತಿದೆ…</span></p>`;
  box.querySelectorAll('button').forEach(b => b.disabled = true);
  const res = await askDeepSeek(question, ctx);
  box.querySelectorAll('button').forEach(b => b.disabled = false);
  if (res.text) { saveAnswer(k, res.text); showAnswer(out, question, res.text, false); }
  else if (cached) showAnswer(out, question, cached.text, true, res.error);
  else out.innerHTML = `<p class="ask-err">${esc(res.error).replace(/\n/g, '<br>')}</p>`;
}

function showAnswer(out, q, text, old, note) {
  out.innerHTML = `<p class="ask-qline">❓ ${esc(q)}</p>
    <div class="ask-a">${esc(text).split(/\n+/).map(l => `<p${/[ಀ-೿]/.test(l) ? ' class="kn"' : ''}>${l}</p>`).join('')}</div>
    ${old ? `<p class="muted small">Saved answer${note ? ' — ' + esc(note) : ''}</p>` : ''}`;
  out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// One handler for every screen
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ask]');
  if (b) return runAsk(b, b.dataset.ask);
  const pf = e.target.closest('[data-ask-price]');
  if (pf) {
    const item = pf.dataset.askPrice;
    const vnd = parseFloat((document.getElementById('fx-VND')?.value || '').replace(/\D/g, '')) || 0;
    if (!vnd) return toast('First type the price in the ₫ box. / ಮೊದಲು ₫ ಬೆಲೆ ಟೈಪ್ ಮಾಡಿ.', 3500);
    const fx = getFx();
    runAsk(pf, `Is ${vnd.toLocaleString('en-US')} đồng (about ₹${Math.round(vnd / fx.VND * fx.INR)}) a fair price for ${item} in Hanoi?`);
  }
});

/* Money screen: price check with preset items (F36). Uses the ₫ box of the converter. */
const PRICE_ITEMS = ['Silk scarf', 'Coffee 500 g', 'Lacquer box', 'Conical hat', 'Silk lantern', 'T-shirt'];
function renderAskPrice() {
  if (!getSettings().deepseekKey) return '';
  return `<section class="card ask" data-ctx="Shopping in Hanoi Old Quarter markets">
    <h3>🤖 Is this price fair? <span class="kn muted">ಬೆಲೆ ಸರಿಯೇ?</span></h3>
    <p class="muted small">1. Type the price in the ₫ box above. 2. Tap the item.</p>
    <div class="fchips">${PRICE_ITEMS.map(i => `<button type="button" class="fchip" data-ask-price="${esc(i)}">${esc(i)}</button>`).join('')}</div>
    <div class="ask-out" aria-live="polite" hidden></div>
    <p class="muted small">AI answers can be wrong. Use as a guide for bargaining.</p>
  </section>`;
}
