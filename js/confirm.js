/* RS Vietnam Trip — 📲 Messages, day by day (v2.9)
   Short messages to the hotel, the cruise and the express-immigration (Klook) operator — each on the day it is needed.
   English + Vietnamese, one-tap WhatsApp, copy, or 📺 show at the desk. Names / booking numbers stay on this phone only.
   📒 Numbers you receive (Wi-Fi, drivers) are typed once and used by the call buttons and the 💬 helper. */
'use strict';

const MSG_TASKS = ['t-msg-hotel', 't-msg-cruise', 't-msg-ft'];          // before the trip → Today reminder "t-msgs"
const getMsgInfo = () => { const i = Object.assign({ names: '', hotelRef: '', cruiseRef: '', ftRef: '' }, Store.get('msgInfo', {})); if (!i.names) i.names = getSettings().travellers || ''; return i; };
const refEn = r => r ? ` (booking ${r})` : '', refVi = r => r ? ` (mã đặt chỗ ${r})` : '';
const HOTEL_EN = 'Hanoi Chic Boutique Hotel', HOTEL_VI = 'khách sạn Hanoi Chic Boutique';

/* day 0 = before the trip. to: which saved number WhatsApp opens. */
function allMessages() {
  const i = getMsgInfo(), n = i.names || '[your names]';
  return [
    { id: 't-msg-hotel', day: 0, to: 'hotel', icon: '🏨', title: HOTEL_EN, when_en: 'Send once, a week before the trip', when_kn: 'ಪ್ರಯಾಣಕ್ಕೆ ಒಂದು ವಾರ ಮೊದಲು',
      en: `Hello ${HOTEL_EN}. This is ${n}, staying with you from 24 to 29 November${refEn(i.hotelRef)}. This is my WhatsApp number.
We land at Noi Bai Airport, Terminal 2, at 10:00 am on 24 November (IndiGo 6E-1637). We have express immigration.
1. Please confirm the airport car: driver at the arrivals exit at 10:45–11:00 am, with a sign showing our name. Please send the driver's name, phone number and car number plate.
2. We reach the hotel around 12 noon — early check-in if possible, or a place to rest.
3. Please book 2 tickets for the Thang Long Water Puppet show at about 5 pm on Friday 27 November.
4. We will pay everything in đồng. Thank you very much!`,
      vi: `Xin chào ${HOTEL_VI}. Tôi là ${n}, ở khách sạn từ ngày 24 đến 29 tháng 11${refVi(i.hotelRef)}. Đây là số WhatsApp của tôi.
Chúng tôi hạ cánh tại sân bay Nội Bài, nhà ga T2, lúc 10:00 sáng ngày 24/11 (chuyến bay IndiGo 6E-1637). Chúng tôi có dịch vụ nhập cảnh nhanh.
1. Xin vui lòng xác nhận xe đón sân bay: tài xế chờ ở cửa ra khu đến lúc 10:45–11:00 sáng, cầm biển ghi tên chúng tôi. Xin gửi tên, số điện thoại và biển số xe của tài xế.
2. Chúng tôi đến khách sạn khoảng 12 giờ trưa — xin cho nhận phòng sớm nếu được, hoặc một chỗ để nghỉ.
3. Xin đặt giúp 2 vé xem Múa rối nước Thăng Long suất khoảng 5 giờ chiều thứ Sáu 27/11.
4. Chúng tôi sẽ thanh toán tất cả bằng tiền đồng. Cảm ơn rất nhiều!` },
    { id: 't-msg-cruise', day: 0, to: 'cruise', icon: '🚢', title: 'Ambassador Cruise', when_en: 'Send once, a week before the trip', when_kn: 'ಪ್ರಯಾಣಕ್ಕೆ ಒಂದು ವಾರ ಮೊದಲು',
      en: `Hello Ambassador Cruise. This is ${n}, booked on the cruise on 25–26 November${refEn(i.cruiseRef)}. This is my WhatsApp number.
1. Please send the shuttle pickup time at Hanoi Chic Boutique Hotel, 51-53 Bat Su, Hoan Kiem, Hanoi.
2. Please confirm pure vegetarian Indian meals for both of us, as booked: no meat, no fish, no fish sauce. Eggs are OK.
Thank you very much!`,
      vi: `Xin chào Ambassador Cruise. Tôi là ${n}, đã đặt du thuyền ngày 25–26 tháng 11${refVi(i.cruiseRef)}. Đây là số WhatsApp của tôi.
1. Xin vui lòng gửi giờ xe đón tại khách sạn Hanoi Chic Boutique, 51-53 Bát Sứ, Hoàn Kiếm, Hà Nội.
2. Xin xác nhận bữa ăn chay kiểu Ấn Độ cho cả hai người như đã đặt: không thịt, không cá, không nước mắm. Trứng thì được.
Cảm ơn rất nhiều!` },
    { id: 't-msg-ft', day: 0, to: 'ft', icon: '⚡', title: 'Express immigration (Klook)', when_en: 'Send once, a week before the trip', when_kn: 'ಪ್ರಯಾಣಕ್ಕೆ ಒಂದು ವಾರ ಮೊದಲು',
      en: `Hello. This is ${n}. We booked the Fast Track / priority immigration service on Klook${refEn(i.ftRef)}. This is my WhatsApp number.
We arrive at Noi Bai Airport, Terminal 2, on 24 November, IndiGo 6E-1637 from Mumbai, landing at 10:00 am.
Please confirm where your staff will meet us. Thank you very much!`,
      vi: `Xin chào. Tôi là ${n}. Chúng tôi đã đặt dịch vụ nhập cảnh nhanh (Fast Track) qua Klook${refVi(i.ftRef)}. Đây là số WhatsApp của tôi.
Chúng tôi đến sân bay Nội Bài, nhà ga T2, ngày 24 tháng 11, chuyến bay IndiGo 6E-1637 từ Mumbai, hạ cánh lúc 10:00 sáng.
Xin vui lòng xác nhận nhân viên sẽ đón chúng tôi ở đâu. Cảm ơn rất nhiều!` },

    { id: 'm-d1-hotel', day: 1, to: 'hotel', icon: '🏨', title: 'Hotel — after check-in', when_en: 'Send after you check in', when_kn: 'ಚೆಕ್-ಇನ್ ನಂತರ ಕಳುಹಿಸಿ',
      en: `Hello, this is ${n}. We have checked in — thank you!
1. Please send us the Wi-Fi name and password.
2. Tomorrow (25 Nov) the Ambassador Cruise bus picks us up here. Please confirm the pickup time.
3. Please keep our big bags at the hotel while we are on the cruise (25–26 Nov). We come back on 26 Nov afternoon.
4. Did you get our 2 puppet show tickets for Friday 27 Nov (about 5 pm)?
Thank you very much!`,
      vi: `Xin chào, tôi là ${n}. Chúng tôi đã nhận phòng — cảm ơn!
1. Xin gửi giúp tên Wi-Fi và mật khẩu.
2. Ngày mai (25/11) xe của du thuyền Ambassador đón chúng tôi ở đây. Xin xác nhận giờ đón.
3. Xin giữ giúp hành lý lớn của chúng tôi tại khách sạn trong thời gian đi du thuyền (25–26/11). Chúng tôi về chiều ngày 26/11.
4. Khách sạn đã mua được 2 vé múa rối nước cho thứ Sáu 27/11 (khoảng 5 giờ chiều) chưa ạ?
Cảm ơn rất nhiều!` },

    { id: 'm-d2-cruise', day: 2, to: 'cruise', icon: '🚢', title: 'Cruise — after boarding', when_en: 'Send after you board (or tell the guide)', when_kn: 'ಹಡಗು ಹತ್ತಿದ ನಂತರ (ಅಥವಾ ಗೈಡ್‌ಗೆ ಹೇಳಿ)',
      en: `Hello, this is ${n}, on board today. Thank you!
1. Reminder: pure vegetarian meals for both of us — no meat, no fish, no fish sauce. Eggs are OK.
2. Tomorrow (26 Nov), what time will the bus drop us at Hanoi Chic Boutique Hotel, 51-53 Bat Su?
Thank you very much!`,
      vi: `Xin chào, tôi là ${n}, đang ở trên tàu hôm nay. Cảm ơn!
1. Xin nhắc lại: bữa ăn chay cho cả hai người — không thịt, không cá, không nước mắm. Trứng thì được.
2. Ngày mai (26/11), mấy giờ xe đưa chúng tôi về khách sạn Hanoi Chic Boutique, 51-53 Bát Sứ?
Cảm ơn rất nhiều!` },

    { id: 'm-d3-hotel', day: 3, to: 'hotel', icon: '🏨', title: 'Hotel — coming back today', when_en: 'Send in the morning, from the ship', when_kn: 'ಬೆಳಿಗ್ಗೆ ಹಡಗಿನಿಂದ ಕಳುಹಿಸಿ',
      en: `Hello, this is ${n}. We come back from the cruise today and reach the hotel around 1:30 pm. Please have our room and our bags ready. Thank you very much!`,
      vi: `Xin chào, tôi là ${n}. Hôm nay chúng tôi đi du thuyền về, đến khách sạn khoảng 1:30 chiều. Xin chuẩn bị sẵn phòng và hành lý của chúng tôi. Cảm ơn rất nhiều!` },

    { id: 'm-d4-hotel', day: 4, to: 'hotel', icon: '🏨', title: 'Hotel — tomorrow Ninh Binh', when_en: 'Send in the morning, before you go out', when_kn: 'ಬೆಳಿಗ್ಗೆ ಹೊರಡುವ ಮೊದಲು',
      en: `Good morning, this is ${n}.
1. Please give us today's puppet show tickets and tell us the exact show time.
2. Tomorrow (Sat 28 Nov) is our Ninh Binh tour. Please confirm the pickup time, and send the driver's name and phone number.
3. Tomorrow we move to the standard room for the last night. We will pack tonight — please move our bags while we are in Ninh Binh.
Thank you very much!`,
      vi: `Chào buổi sáng, tôi là ${n}.
1. Xin đưa giúp vé múa rối nước hôm nay và cho biết giờ diễn chính xác.
2. Ngày mai (thứ Bảy 28/11) chúng tôi đi tour Ninh Bình. Xin xác nhận giờ đón, và gửi tên và số điện thoại của tài xế.
3. Ngày mai chúng tôi chuyển sang phòng tiêu chuẩn cho đêm cuối. Tối nay chúng tôi sẽ đóng gói — xin chuyển giúp hành lý khi chúng tôi đi Ninh Bình.
Cảm ơn rất nhiều!` },

    { id: 'm-d5-hotel', day: 5, to: 'hotel', icon: '🏨', title: 'Hotel — tomorrow: early checkout', when_en: 'Send this evening, after Ninh Binh', when_kn: 'ಇಂದು ಸಂಜೆ, ನಿನ್ ಬಿನ್ ನಂತರ',
      why_en: 'Why: tomorrow you leave the hotel at about 7 am for the Mausoleum, Hoa Lo and the Women\'s Museum, and come back only at 3:20 pm for the airport car. So you check out early — only after breakfast — and the hotel keeps your bags.',
      why_kn: 'ಏಕೆ: ನಾಳೆ ಬೆಳಿಗ್ಗೆ 7ಕ್ಕೆ ಹೊರಟು ಮಧ್ಯಾಹ್ನ 3:20ಕ್ಕೆ ಮಾತ್ರ ವಾಪಸ್. ಆದ್ದರಿಂದ ಉಪಾಹಾರದ ನಂತರ ಬೇಗ ಚೆಕ್-ಔಟ್; ಬ್ಯಾಗ್ ಹೋಟೆಲ್‌ನಲ್ಲಿ.',
      en: `Hello, this is ${n}. Tomorrow (Sun 29 Nov) is our last day. We go sightseeing early and fly home in the evening.
1. Please arrange breakfast for us at 6:30 am (or a packed breakfast if the restaurant is not open yet).
2. We will check out at about 7:00 am, after breakfast, and pay the balance in đồng. Please have the bill ready.
3. Please keep our bags at reception until 3:20 pm.
4. Please confirm the car to Noi Bai Airport at 3:30 pm, and send the driver's name, phone number and car number plate.
Thank you very much!`,
      vi: `Xin chào, tôi là ${n}. Ngày mai (Chủ nhật 29/11) là ngày cuối của chúng tôi. Chúng tôi đi tham quan sớm và bay về vào buổi tối.
1. Xin chuẩn bị bữa sáng cho chúng tôi lúc 6:30 sáng (hoặc bữa sáng mang đi nếu nhà hàng chưa mở).
2. Chúng tôi sẽ trả phòng khoảng 7:00 sáng, sau bữa sáng, và thanh toán số tiền còn lại bằng tiền đồng. Xin chuẩn bị sẵn hóa đơn.
3. Xin giữ giúp hành lý của chúng tôi ở lễ tân đến 3:20 chiều.
4. Xin xác nhận xe ra sân bay Nội Bài lúc 3:30 chiều, và gửi tên, số điện thoại và biển số xe của tài xế.
Cảm ơn rất nhiều!` },

    { id: 'm-d6-hotel', day: 6, to: 'hotel', icon: '🏨', title: 'Hotel — on the way back', when_en: 'Send at lunch, around 2:30 pm', when_kn: 'ಊಟದ ಸಮಯದಲ್ಲಿ, ಸುಮಾರು 2:30ಕ್ಕೆ',
      en: `Hello, this is ${n}. We will be back at the hotel by 3:20 pm. Please keep our bags ready, and please confirm the airport car at 3:30 pm. Thank you very much!`,
      vi: `Xin chào, tôi là ${n}. Chúng tôi sẽ về khách sạn trước 3:20 chiều. Xin chuẩn bị sẵn hành lý, và xác nhận xe ra sân bay lúc 3:30 chiều. Cảm ơn rất nhiều!` }
  ];
}
const msgPhone = to => { const s = getSettings(); return to === 'hotel' ? s.hotelPhone : to === 'cruise' ? s.cruisePhone : s.fasttrackPhone; };
const msgsForDay = d => allMessages().filter(m => m.day === d);

function msgCard(m) {
  const done = isDone(m.id), phone = msgPhone(m.to), tel = digits(phone);
  const wa = text => `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
  const box = (lang, text) => `<div class="msgbox"><p class="flabel">${lang === 'en' ? 'English' : 'Tiếng Việt (Vietnamese)'}</p>
      <pre class="msgtext" lang="${lang}">${esc(text)}</pre>
      <div class="actions">
        <button type="button" class="btn secondary" data-copy="${m.id}:${lang}">📋 Copy</button>
        ${tel ? `<a class="btn secondary" href="${wa(text)}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
      </div></div>`;
  return `<section class="card msgcard${done ? ' done' : ''}">
    <h3>${m.icon} ${esc(m.title)}</h3>
    <p class="muted small">🕒 ${esc(m.when_en)} <span class="kn">${esc(m.when_kn)}</span></p>
    ${m.why_en && !done ? `<p class="msgwhy">${esc(m.why_en)}<br><span class="kn">${esc(m.why_kn)}</span></p>` : ''}
    ${done ? '' : `${tel ? `<a class="btn sendboth" href="${wa(m.en + '\n\n— Tiếng Việt —\n' + m.vi)}" target="_blank" rel="noopener">💬 Send on WhatsApp (English + Vietnamese)</a>
        <p class="muted small">Opens WhatsApp with the message ready — just tap ➤ Send. <span class="kn">WhatsApp ತೆರೆದು ➤ ಒತ್ತಿ.</span></p>`
      : '<a class="btn secondary" href="#settings">Add their number in Settings</a>'}
      <button type="button" class="btn secondary" data-showmsg="${m.id}">📺 Show at the desk <span class="kn">ಕೌಂಟರ್‌ನಲ್ಲಿ ತೋರಿಸಿ</span></button>
      <details class="fold msgfold"><summary>Read / copy the message</summary>${box('en', m.en)}${box('vi', m.vi)}</details>`}
    ${doneBtn(m.id)}
  </section>`;
}

// Plan (each day) and Today: "📲 Messages to send today"
function dayMsgCard(day, today) {
  const list = msgsForDay(day.day);
  if (!list.length) return '';
  const left = list.filter(m => !isDone(m.id)).length;
  return `<details class="card msgday"${left ? ' open' : ''}><summary>📲 ${today ? 'Messages to send today' : 'Messages for this day'} <span class="badge">${left ? left + ' to send' : '✓ sent'}</span>
      <span class="kn">${today ? 'ಇಂದು ಕಳುಹಿಸಬೇಕಾದ ಸಂದೇಶ' : 'ಈ ದಿನದ ಸಂದೇಶ'}</span></summary>
    ${list.map(msgCard).join('')}</details>`;
}

/* ---------- 📒 Numbers you receive ---------- */
const GOT_FIELDS = [
  ['wifi', '📶 Hotel Wi-Fi (name + password)', 'ಹೋಟೆಲ್ ವೈ-ಫೈ', false],
  ['airportDriver', '🚗 Airport driver (24 Nov)', 'ವಿಮಾನ ನಿಲ್ದಾಣದ ಚಾಲಕ', true],
  ['cruiseBus', '🚌 Cruise bus / guide', 'ಹಡಗಿನ ಬಸ್ / ಗೈಡ್', true],
  ['nbDriver', '🚗 Ninh Binh driver (28 Nov)', 'ನಿನ್ ಬಿನ್ ಚಾಲಕ', true],
  ['sunCar', '🚗 Airport car (29 Nov)', 'ವಿಮಾನ ನಿಲ್ದಾಣದ ಕಾರು', true]
];
const getGot = () => Store.get('gotNums', {});
function renderGotNums(open) {
  const g = getGot();
  return `<details class="card fold gotnums"${open ? ' open' : ''}><summary>📒 Numbers you receive <span class="kn">ನಿಮಗೆ ಬರುವ ನಂಬರ್‌ಗಳು</span></summary>
    <p class="muted small">When the hotel or cruise sends a number or the Wi-Fi password, type it here once. <span class="kn">ಒಮ್ಮೆ ಇಲ್ಲಿ ಬರೆಯಿರಿ.</span></p>
    ${GOT_FIELDS.map(([k, en, kn, isTel]) => { const v = g[k] || '', t = isTel ? digits(v) : '';
      return `<label for="got-${k}">${en} <span class="kn">${kn}</span></label>
      <div class="gotrow"><input id="got-${k}" data-got="${k}" type="${isTel ? 'tel' : 'text'}" value="${esc(v)}" autocomplete="off" placeholder="${isTel ? '+84 …' : 'Name / password'}">
        ${t ? `<a class="btn secondary" href="tel:+${t}" aria-label="Call">📞</a>` : ''}</div>`; }).join('')}
  </details>`;
}
// For the 💬 helper
const gotForHelper = () => GOT_FIELDS.map(([k, en]) => getGot()[k] ? `${en.replace(/^\S+ /, '')}: ${getGot()[k]}` : '').filter(Boolean).join('\n');

/* ---------- 📲 Messages page (all days) ---------- */
function renderConfirm() {
  const i = getMsgInfo();
  const inp = (id, label, ph) => `<label for="mi-${id}">${label}</label><input id="mi-${id}" data-mi="${id}" type="text" value="${esc(i[id])}" placeholder="${esc(ph)}" autocomplete="off">`;
  const days = DATA.trip?.days || [];
  return `<section class="card accent"><h2>📲 Messages, day by day</h2>
      <p>Each message is ready in English and Vietnamese. Send it on the day shown — one tap opens WhatsApp. Or show it at the hotel desk.</p>
      <p class="kn">ಪ್ರತಿ ದಿನದ ಸಂದೇಶ ಸಿದ್ಧವಿದೆ. ಒಂದು ಒತ್ತಿನಲ್ಲಿ WhatsApp — ಅಥವಾ ಕೌಂಟರ್‌ನಲ್ಲಿ ತೋರಿಸಿ.</p></section>
    <details class="card fold"><summary>✏️ Names and booking numbers</summary>
      ${inp('names', 'Your names (as on the booking)', 'e.g. Mr & Mrs Rao')}
      ${inp('hotelRef', 'Hotel booking number (optional)', '')}
      ${inp('cruiseRef', 'Cruise booking number (optional)', '')}
      ${inp('ftRef', 'Klook booking number (optional)', '')}
      <p class="muted small">Saved on this phone only. The messages update as you type.</p>
    </details>
    ${renderGotNums(false)}
    <div id="msg-list">${msgSections(days)}</div>`;
}
function msgSections(days) {
  return [0, 1, 2, 3, 4, 5, 6].map(d => {
    const list = msgsForDay(d); if (!list.length) return '';
    const day = days.find(x => x.day === d);
    return `<h3 class="msgsec">${d === 0 ? '🧳 Before the trip <span class="kn">ಪ್ರಯಾಣಕ್ಕೆ ಮೊದಲು</span>' : esc(day ? dayLabel(day) + ' — ' + day.title_en : 'Day ' + d)}</h3>
      ${list.map(msgCard).join('')}`;
  }).join('');
}

/* ---------- 📺 Show at the desk ---------- */
function msgShow(vi) {
  document.getElementById('tr-show')?.remove();
  const d = document.createElement('div');
  d.id = 'tr-show'; d.className = 'tr-show long'; d.setAttribute('role', 'dialog');
  d.innerHTML = `<p class="small muted" style="font-size:16px;font-weight:400;margin:0 0 8px">Xin vui lòng đọc tin nhắn này. / Please read this message.</p>
    <p lang="vi">${esc(vi)}</p>
    <div class="tr-show-btns"><button type="button" class="btn" data-showsay>🔊 Speak</button>
      <button type="button" class="btn secondary" data-showclose>✕ Close</button></div>`;
  d.addEventListener('click', e => {
    if (e.target.closest('[data-showsay]')) return typeof speakVi === 'function' && speakVi(vi);
    if (e.target.closest('[data-showclose]')) { if ('speechSynthesis' in window) speechSynthesis.cancel(); d.remove(); }
  });
  document.body.appendChild(d);
}

/* One handler for every screen that shows message cards or the numbers box (Plan, Today, Messages) */
document.addEventListener('click', async e => {
  const s = e.target.closest('[data-showmsg]');
  if (s) { const m = allMessages().find(x => x.id === s.dataset.showmsg); if (m) msgShow(m.vi); return; }
  const b = e.target.closest('[data-copy]'); if (!b || !/^(t-msg|m-d)/.test(b.dataset.copy)) return;
  const [id, lang] = b.dataset.copy.split(':'), m = allMessages().find(x => x.id === id);
  try { await navigator.clipboard.writeText(m[lang]); toast('Copied ✓ — paste in WhatsApp / ನಕಲಿಸಲಾಗಿದೆ'); }
  catch (err) { toast('Press and hold the text to copy. / ಪಠ್ಯವನ್ನು ಒತ್ತಿ ಹಿಡಿದು ನಕಲಿಸಿ.', 3500); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset?.got; if (!k) return;
  const g = getGot(); g[k] = e.target.value.trim(); Store.set('gotNums', g);
  toast('Saved ✓ / ಉಳಿಸಲಾಗಿದೆ');
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
// Remove the overlay when leaving a screen
window.addEventListener('hashchange', () => document.getElementById('tr-show')?.remove());

function startConfirm() {
  const main = document.getElementById('screen');
  const onInput = e => {
    const k = e.target.dataset.mi; if (!k) return;
    const i = getMsgInfo(); i[k] = e.target.value.trim(); Store.set('msgInfo', i);
    document.getElementById('msg-list').innerHTML = msgSections(DATA.trip?.days || []);
  };
  main.addEventListener('input', onInput);
  return () => main.removeEventListener('input', onInput);
}

// When all three "before the trip" messages are ticked, the Today reminder is done too
document.addEventListener('click', e => {
  const b = e.target.closest('[data-task]');
  if (!b || !MSG_TASKS.includes(b.dataset.task)) return;
  setTimeout(() => setVisited('t-msgs', MSG_TASKS.every(isDone)), 0);
});

ROUTES.confirm = { title: 'Messages', tab: '', back: () => (/^#prep|^#check/.test(prevHash) ? 'prep' : 'today'), render: renderConfirm, after: startConfirm };
