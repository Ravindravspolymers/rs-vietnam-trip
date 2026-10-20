/* RS Vietnam Trip — Docs vault, Bin, Backup/Restore (Phase 7)
   Files live in IndexedDB on this phone only. Delete = move to Bin. Nothing is ever erased.
   Backup = one .json file (docs + ticks + settings) to share on WhatsApp; Restore adds it back. */
'use strict';

const DOC_CATS = [
  ['passport', '🛂', 'Passports'], ['visa', '📑', 'Visa'], ['flight', '✈️', 'Flights'],
  ['hotel', '🏨', 'Hotel'], ['cruise', '🚢', 'Cruise'], ['insurance', '🛡', 'Insurance'], ['other', '📁', 'Other']
];
const docCat = id => DOC_CATS.find(c => c[0] === id) || DOC_CATS[6];

/* ---------- IndexedDB (tiny helper) ---------- */
const DocDB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('rs-vietnam', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' });
      r.onsuccess = () => { this._db = r.result; res(this._db); };
      r.onerror = () => rej(r.error);
    });
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('docs', mode);
      const req = fn(t.objectStore('docs'));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  all() { return this.run('readonly', s => s.getAll()); },
  get(id) { return this.run('readonly', s => s.get(id)); },
  put(doc) { return this.run('readwrite', s => s.put(doc)); }
};

/* ---------- Helpers ---------- */
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const fmtDay = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
let docUrls = [];                       // object URLs to free when leaving a screen
const blobUrl = b => { const u = URL.createObjectURL(b); docUrls.push(u); return u; };
const freeUrls = () => { docUrls.forEach(u => URL.revokeObjectURL(u)); docUrls = []; };

// Shrink big photos (keeps passports readable, saves space and backup size)
async function shrinkImage(file) {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1048576) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88));
    return out && out.size < file.size ? out : file;
  } catch (e) { return file; }
}

async function addFiles(files, cat) {
  let n = 0;
  for (const f of files) {
    if (!/^image\/|application\/pdf/.test(f.type)) { toast('Only photos and PDF files. / ಫೋಟೋ ಮತ್ತು PDF ಮಾತ್ರ.'); continue; }
    const blob = await shrinkImage(f);
    const name = f.name && !/^image\.\w+$/.test(f.name) ? f.name : `${docCat(cat)[2]} photo ${new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
    try {
      await DocDB.put({ id: newId(), cat, name, type: blob.type || f.type, size: blob.size, blob, added: Date.now(), deleted: null });
      n++;
    } catch (e) { toast('Could not save. Phone storage may be full. / ಉಳಿಸಲಾಗಲಿಲ್ಲ — ಫೋನ್ ತುಂಬಿರಬಹುದು.', 4000); break; }
  }
  if (n) { markDocsChanged(); toast(`Saved ${n} ✓ / ಉಳಿಸಲಾಗಿದೆ`); }
}

async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Saved to Downloads ✓ / ಡೌನ್‌ಲೋಡ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ');
}
const docFileName = d => {
  const ext = d.type === 'application/pdf' ? '.pdf' : d.type === 'image/png' ? '.png' : '.jpg';
  return /\.\w{2,4}$/.test(d.name) ? d.name : d.name.replace(/[^\w\- ]+/g, '') + ext;
};

const markDocsChanged = () => Store.set('docsChangedAt', Date.now());   // F23

/* ---------- Docs screen (v1.2: folder tiles → open a folder → act) ---------- */
let docsAddCat = '';                     // kept for older code paths; folders pass their own category

function renderDocs() { return '<div id="docs-root"><p class="muted center">Loading…</p></div>'; }

async function fillDocs() {
  const root = document.getElementById('docs-root');
  if (!root) return;
  let docs = [];
  try { docs = await DocDB.all(); }
  catch (e) { root.innerHTML = `<div class="card warn"><p>Storage not available in this browser.</p></div>`; return; }
  const live = docs.filter(d => !d.deleted);
  const binCount = docs.length - live.length;
  const used = live.reduce((s, d) => s + d.size, 0);

  const persisted = Store.get('persisted', false);
  const docsAt = Store.get('docsChangedAt', 0), bk = Store.get('lastBackup', 0);
  const warn = (!persisted && live.length ? `<section class="card warn"><p><strong>Storage not protected — back up now.</strong></p>
      <p class="kn">ಸಂಗ್ರಹಣೆ ಸುರಕ್ಷಿತವಿಲ್ಲ — ಈಗಲೇ ಬ್ಯಾಕಪ್ ಮಾಡಿ.</p></section>` : '')
    + (docsAt && bk < docsAt ? `<section class="card warn"><p><strong>Documents changed since your last backup.</strong></p>
      <p class="kn">ಕೊನೆಯ ಬ್ಯಾಕಪ್ ನಂತರ ದಾಖಲೆಗಳು ಬದಲಾಗಿವೆ.</p>
      <button type="button" class="btn green" data-backup>💾 Backup now</button></section>` : '');
  const tiles = DOC_CATS.map(([id, ic, l]) => {
    const n = live.filter(d => d.cat === id).length;
    return `<a class="tile area${n ? '' : ' empty'}" href="#folder:${id}"><span>${ic}</span><span>${l}</span>
      <span class="count">${n ? n + (n === 1 ? ' file' : ' files') : 'Empty'}</span></a>`;
  }).join('');
  root.innerHTML = `${warn}<div class="grid">${tiles}
      <a class="tile area" href="#bin"><span>🗑</span><span>Bin</span><span class="count">${binCount}</span></a></div>
    <p class="muted small center">${live.length} documents · ${fmtSize(used)} used</p>
    <details class="card fold">
      <summary>💾 Backup &amp; restore</summary>
      <p>Save everything in one file. Send it to yourself on WhatsApp.</p>
      <p class="kn">ಎಲ್ಲವನ್ನೂ ಒಂದು ಫೈಲ್‌ನಲ್ಲಿ ಉಳಿಸಿ. WhatsApp ನಲ್ಲಿ ನಿಮಗೇ ಕಳುಹಿಸಿ.</p>
      <button type="button" class="btn green" data-backup>💾 Backup now</button>
      <button type="button" class="btn secondary" data-restore>♻️ Restore from backup</button>
    </details>`;
}

/* One folder: add buttons on top, then its documents */
function renderFolder() { return '<div id="folder-root"><p class="muted center">Loading…</p></div>'; }
async function fillFolder() {
  const root = document.getElementById('folder-root');
  const cat = docCat(routeParam());
  const docs = (await DocDB.all().catch(() => [])).filter(d => !d.deleted && d.cat === cat[0]).sort((a, b) => b.added - a.added);
  if (!root) return;
  document.getElementById('screen-title').textContent = cat[2];
  root.innerHTML = `<div class="actions">
      <label class="btn green file-btn">📷 Take photo
        <input type="file" accept="image/*" capture="environment" data-add="${cat[0]}" hidden></label>
      <label class="btn secondary file-btn">📁 From phone
        <input type="file" accept="image/*,application/pdf" multiple data-add="${cat[0]}" hidden></label>
    </div>
    ${docs.length ? docs.map(docCard).join('')
      : `<div class="card center"><p>${cat[1]} No files here yet.</p><p class="kn">ಇಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ದಾಖಲೆ ಇಲ್ಲ. ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿ ಸೇರಿಸಿ.</p></div>`}`;
}

function docCard(d) {
  const id = esc(d.id);
  const isImg = d.type.startsWith('image/');
  const thumb = isImg ? `<img class="doc-thumb" src="${blobUrl(d.blob)}" alt="" loading="lazy">` : `<span class="doc-thumb pdf">PDF</span>`;
  return `<article class="card doc">
    <a class="doc-row" href="#doc:${id}">${thumb}
      <span><strong>${esc(d.name)}</strong><br><span class="muted small">${fmtDay(d.added)} · ${fmtSize(d.size)}</span></span></a>
    <div class="actions three">
      <a class="btn secondary" href="#doc:${id}">👁 View</a>
      <button type="button" class="btn secondary" data-share="${id}">📤 Share</button>
      <button type="button" class="btn secondary" data-rename="${id}">✏️ Rename</button>
      <button type="button" class="btn secondary" data-del="${id}">🗑 Bin</button>
    </div>
  </article>`;
}

/* ---------- Single document (full screen) ---------- */
function renderDoc() { return '<div id="doc-root"><p class="muted center">Loading…</p></div>'; }
async function fillDoc() {
  const root = document.getElementById('doc-root');
  const d = await DocDB.get(routeParam()).catch(() => null);
  if (!root) return;
  if (!d) { root.innerHTML = '<div class="card"><p>Document not found.</p></div>'; return; }
  docBack = 'folder:' + docCat(d.cat)[0];
  document.getElementById('screen-title').textContent = docCat(d.cat)[2];
  const url = blobUrl(d.blob);
  const body = d.type.startsWith('image/')
    ? `<img class="doc-full" src="${url}" alt="${esc(d.name)}"><p class="muted small center">Pinch with two fingers to zoom. <span class="kn">ಎರಡು ಬೆರಳಿನಿಂದ ದೊಡ್ಡದು ಮಾಡಿ.</span></p>`
    : `<div class="card center"><p class="doc-thumb pdf big">PDF</p>
        <button type="button" class="btn green" data-share="${esc(d.id)}">📤 Open with… (Share)</button>
        <a class="btn secondary" href="${url}" target="_blank" rel="noopener">📖 Open PDF</a></div>`;
  root.innerHTML = `<h2>${esc(d.name)}</h2>${body}
    <div class="actions">
      <button type="button" class="btn secondary" data-share="${esc(d.id)}">📤 Share</button>
      <button type="button" class="btn secondary" data-rename="${esc(d.id)}">✏️ Rename</button>
    </div>`;
}

/* ---------- Bin ---------- */
function renderBin() { return '<div id="bin-root"><p class="muted center">Loading…</p></div>'; }
async function fillBin() {
  const root = document.getElementById('bin-root');
  const docs = (await DocDB.all().catch(() => [])).filter(d => d.deleted).sort((a, b) => b.deleted - a.deleted);
  if (!root) return;
  root.innerHTML = `<div class="card accent"><p>Items here are safe. Nothing is ever erased.</p>
      <p class="kn">ಇಲ್ಲಿರುವುದು ಸುರಕ್ಷಿತ. ಯಾವುದನ್ನೂ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದಿಲ್ಲ.</p></div>
    ${docs.length ? docs.map(d => `<article class="card doc">
        <div class="doc-row">${d.type.startsWith('image/') ? `<img class="doc-thumb" src="${blobUrl(d.blob)}" alt="">` : '<span class="doc-thumb pdf">PDF</span>'}
          <span><strong>${esc(d.name)}</strong><br><span class="muted small">${docCat(d.cat)[2]} · moved ${fmtDay(d.deleted)}</span></span></div>
        <button type="button" class="btn green" data-undel="${esc(d.id)}">↩️ Restore</button></article>`).join('')
      : '<div class="card center"><p>Bin is empty.</p><p class="kn">ಬಿನ್ ಖಾಲಿ ಇದೆ.</p></div>'}`;
}

/* ---------- Backup & Restore (also used from Settings) ---------- */
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });

async function doBackup() {
  toast('Preparing backup… / ಬ್ಯಾಕಪ್ ತಯಾರಾಗುತ್ತಿದೆ…', 3000);
  try {
    const docs = await DocDB.all();
    const local = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k.startsWith('rs.') || k === 'rs.askCache') continue;
      let v = localStorage.getItem(k);
      if (k === 'rs.settings') { try { const o = JSON.parse(v); delete o.deepseekKey; v = JSON.stringify(o); } catch (e) {} }  // F06
      local[k] = v;
    }
    // F23: build the file in parts (one document at a time) instead of one giant string
    const parts = [`{"app":"rs-vietnam-trip","version":${JSON.stringify(APP_VERSION)},"created":${JSON.stringify(new Date().toISOString())},"local":${JSON.stringify(local)},"docs":[`];
    for (let i = 0; i < docs.length; i++) {
      const { blob, ...meta } = docs[i];
      parts.push((i ? ',' : '') + JSON.stringify({ ...meta, data: await blobToDataURL(blob) }));
    }
    parts.push(']}');
    const name = `rs-vietnam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    await shareOrDownload(new Blob(parts, { type: 'application/json' }), name);
    Store.set('lastBackup', Date.now());
    toast('Backup saved (DeepSeek key not included) / ಬ್ಯಾಕಪ್ ಉಳಿಸಲಾಗಿದೆ', 4000);
  } catch (e) { toast('Backup failed. Try again. / ಬ್ಯಾಕಪ್ ಆಗಲಿಲ್ಲ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', 4000); }
}

function doRestore() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { return toast('This is not a backup file. / ಇದು ಬ್ಯಾಕಪ್ ಫೈಲ್ ಅಲ್ಲ.', 4000); }
    if (data.app !== 'rs-vietnam-trip') return toast('This is not an RS Vietnam Trip backup.', 4000);
    const existing = new Set((await DocDB.all()).map(d => d.id));
    const toAdd = (data.docs || []).filter(d => !existing.has(d.id));
    const msg = `Restore backup from ${fmtDay(data.created)}?\n\n• Add ${toAdd.length} document(s). Your current documents stay.\n• Replace ticks, contacts and settings with the backup's.`;
    if (!confirm(msg)) return;
    try {
      for (const d of toAdd) {
        const blob = await (await fetch(d.data)).blob();
        const { data: _, ...meta } = d;
        await DocDB.put({ ...meta, blob });
      }
      const keepKey = getSettings().deepseekKey;
      Object.entries(data.local || {}).forEach(([k, v]) => { if (k.startsWith('rs.')) localStorage.setItem(k, v); });
      if (keepKey) { const st = getSettings(); st.deepseekKey = keepKey; saveSettings(st); }
      applyTextSize(getSettings().textSize); applyTheme(getSettings().theme);
      toast(`Restored ✓ (${toAdd.length} documents) / ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ`, 4000);
      render();
    } catch (e) { toast('Restore stopped. Phone storage may be full.', 5000); }
  };
  inp.click();
}

/* ---------- Clicks ---------- */
function startDocsScreen(fill) {
  return () => {
    const main = document.getElementById('screen');
    fill();
    const onClick = async e => {
      const b = e.target.closest('[data-addcat],[data-share],[data-del],[data-undel],[data-rename],[data-pin],[data-backup],[data-restore]');
      if (!b) return;
      if (b.dataset.addcat !== undefined) { docsAddCat = b.dataset.addcat; freeUrls(); return fill(); }
      if (b.dataset.backup !== undefined) { await doBackup(); freeUrls(); return fill(); }
      if (b.dataset.restore !== undefined) return doRestore();
      const id = b.dataset.share || b.dataset.del || b.dataset.undel || b.dataset.rename || b.dataset.pin;
      const d = await DocDB.get(id);
      if (!d) return;
      if (b.dataset.share) return shareOrDownload(d.blob, docFileName(d));
      if (b.dataset.rename) {
        const n = prompt('New name:', d.name);
        if (n && n.trim()) { d.name = n.trim(); await DocDB.put(d); markDocsChanged(); freeUrls(); fill(); }
        return;
      }
      if (b.dataset.pin) {
        d.pinned = !d.pinned; await DocDB.put(d); markDocsChanged();
        toast(d.pinned ? 'Pinned ⭐ / ಮೇಲೆ ಇರಿಸಲಾಗಿದೆ' : 'Unpinned / ತೆಗೆಯಲಾಗಿದೆ'); freeUrls(); return fill();
      }
      d.deleted = b.dataset.del ? Date.now() : null;
      await DocDB.put(d); markDocsChanged();
      toast(b.dataset.del ? 'Moved to Bin. You can restore it anytime. / ಬಿನ್‌ಗೆ ಹಾಕಲಾಗಿದೆ, ಯಾವಾಗ ಬೇಕಾದರೂ ವಾಪಸ್ ತರಬಹುದು.' : 'Restored ✓ / ವಾಪಸ್ ತರಲಾಗಿದೆ', 3000);
      freeUrls(); fill();
    };
    const onChange = async e => {
      if (!e.target.matches('[data-add]') || !e.target.files.length) return;
      const cat = e.target.dataset.add || docsAddCat; docsAddCat = '';
      toast('Saving… / ಉಳಿಸಲಾಗುತ್ತಿದೆ…', 2000);
      await addFiles([...e.target.files], cat);
      freeUrls(); fill();
    };
    main.addEventListener('click', onClick);
    main.addEventListener('change', onChange);
    return () => { main.removeEventListener('click', onClick); main.removeEventListener('change', onChange); freeUrls(); };
  };
}

ROUTES.docs.render = renderDocs;
ROUTES.docs.after = startDocsScreen(fillDocs);
let docBack = 'docs';                 // set when a document opens: Back returns to its folder
ROUTES.folder = { title: 'Folder', tab: 'more', back: 'docs', render: renderFolder, after: startDocsScreen(fillFolder) };
ROUTES.doc = { title: 'Document', tab: 'more', back: () => docBack, render: renderDoc, after: startDocsScreen(fillDoc) };
ROUTES.bin = { title: 'Bin', tab: 'more', back: 'docs', render: renderBin, after: startDocsScreen(fillBin) };
