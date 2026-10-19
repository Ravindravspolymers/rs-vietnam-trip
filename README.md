# RS Vietnam Trip — offline travel app

An app for two travellers (Hanoi, Ha Long Bay, Ninh Binh — 23–30 Nov 2026).
It installs from a web link and works **without internet** after the first open.

---

## 1. Put it online (one time, ~15 min, use a laptop)

1. **Unzip** the project zip. Open the `rs-vietnam-trip` folder. You should see:
   `css` `data` `fonts` `icons` `js` folders and `index.html`, `manifest.json`, `service-worker.js`, `README.md`, `sources.md`, `INSTALL_FOR_PARENTS.md`.
2. Go to **github.com** → **Sign up** (email, password, short username, e.g. `abhi-trips`).
3. Top-right **+** → **New repository** → name `rs-vietnam-trip` → **Public** → **Create repository**.
4. Click the blue link **"uploading an existing file"**.
5. Select **everything inside** the folder (Ctrl+A / Cmd+A) → drag into the browser → wait until all files are listed → **Commit changes**.
   - ✅ Check: the repository page shows `css`, `data`, `fonts`, `icons`, `js`, `index.html`…
   - ❌ If you see only one folder `rs-vietnam-trip`, you uploaded the outer folder. Upload the files inside it.
6. **Settings** tab → **Pages** (left menu) → Source: **Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
7. Wait 2 minutes, refresh. Copy the link: `https://YOUR-USERNAME.github.io/rs-vietnam-trip/`

## 2. Install on a phone

See **INSTALL_FOR_PARENTS.md** (English + Kannada). Short version: open the link in **Chrome** → wait 10 seconds → ⋮ → **Add to Home screen** → **Install**.

## 3. Release an update (every time files change)

1. In `js/app.js` change `APP_VERSION` (e.g. `'1.0.0'` → `'1.0.1'`).
2. In `service-worker.js` change `CACHE_VERSION` to match (e.g. `'rs-v1.0.1'`).
3. If you **added a new file**, add its path to the `ASSETS` list in `service-worker.js`.
4. Repository → **Add file** → **Upload files** → drag the changed files (same folder structure) → **Commit changes**.
5. Phones (online): open the app → green bar **"New version available — tap to update"** → tap.

> Forgot step 1–2? Phones keep the old version. Always bump both versions.

## 4. Change content without coding

All text lives in `data/` (JSON files). On GitHub, open a file → ✏️ pencil icon → edit → **Commit changes**. Then bump the versions (section 3).

| File | What it holds |
|---|---|
| `data/trip.json` | Days, stops, times, addresses, tips, flights, hotel |
| `data/places.json` | Guide stories (English + Kannada) |
| `data/restaurants.json` | Veg restaurants + food areas |
| `data/dishes.json` | Safe veg dishes |
| `data/phrases.json` | 52 phrases + waiter card |
| `data/shopping.json` | 44 shopping items, places, "don't buy" list |
| `data/prep.json` | Checklists + airport guide |
| `data/emergency.json` | Embassy, hospitals, help card text |

Rules for JSON: keep the quotes `"…"` and commas exactly as they are. If the app shows "not loaded" after an edit, the JSON has a typo — paste it into jsonlint.com to find it.

**Times:** each stop's `time` is local; `"tz": "IST"` marks India time. **Personal phone numbers are never in these files** — they are typed in the app's Settings on each phone.

## 5. Code map (for reference)

`index.html` shell · `css/style.css` look · `js/app.js` router, Settings, SOS, storage · `trip.js` time helpers · `today.js` · `money.js` · `plan.js` (+ driver cards) · `story.js` (stories + voice) · `food.js` · `phrases.js` (+ Vietnamese voice) · `shopping.js` · `docs.js` (vault, Bin, backup) · `prep.js` · `emergency.js` · `ask.js` (DeepSeek) · `service-worker.js` offline cache.

Storage on the phone: `localStorage` keys starting `rs.` (settings, ticks, rates, saved answers) and IndexedDB `rs-vietnam` (documents). Backup/Restore covers both.

## 6. Phone test checklist (do once before the trip)

- [ ] Install from the link → airplane mode → open app → tap every tab
- [ ] Settings: type contacts, medical notes, text size; close app, reopen — still there
- [ ] Plan: tick a place → Today ring updates; ▶ Go opens Google Maps at the right place
- [ ] Story: ▶ Listen in Kannada and English (install voices if asked)
- [ ] Phrases: ▶ Play speaks Vietnamese
- [ ] Money: rate updates online; shows "Rate from…" offline
- [ ] Docs: 📷 camera photo, 📁 PDF, View, Share, Bin → Restore; 💾 Backup → send on WhatsApp → ♻️ Restore on another phone
- [ ] SOS: "Send my location" opens WhatsApp with a map link
- [ ] DeepSeek: Settings → paste key → **Test key** (if "Blocked by browser (CORS)", ask Claude for the small relay fix)
- [ ] Push a tiny update (bump versions) → "New version available" bar appears → tap → ticks and docs still there

## 7. Open items (⚠️ TODO)

- Ambassador cruise: pickup time, port, check-in and disembark times, phone (edit `trip.json` Day 2–3, and Settings → Cruise phone)
- Ninh Binh: car pickup time and driver contact (`trip.json` Day 5)
- IndiGo: are bags through-checked both ways? Which Mumbai terminal does 6E-5094 land at? Does the T1↔T2 shuttle run at night?
- Mumbai overnight on 29–30 Nov (8.5 h): lounge or airport hotel?
- Hotel: kept on the night of 25 Nov, or luggage stored? Day 6 checkout / late checkout time
- Embassy address: confirm 58-60 Tran Hung Dao (one embassy page still says 63)
- Kannada proofreading by a native speaker (stories in `places.json`)
- DeepSeek browser test on a real phone

Sources for every fact: see `sources.md`.
