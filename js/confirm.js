/* RS Vietnam Trip — 📲 Confirmation messages (v2.5)
   One message each to the hotel, the cruise and the express-immigration (Klook) operator, in English and
   Vietnamese, ready to copy or open in WhatsApp. Names / booking numbers are typed once and kept on this phone only. */
'use strict';

const MSG_TASKS = ['t-msg-hotel', 't-msg-cruise', 't-msg-ft'];
const getMsgInfo = () => { const i = Object.assign({ names: '', hotelRef: '', cruiseRef: '', ftRef: '' }, Store.get('msgInfo', {})); if (!i.names) i.names = getSettings().travellers || ''; return i; };
const refEn = r => r ? ` (booking ${r})` : '', refVi = r => r ? ` (mã đặt chỗ ${r})` : '';

function confirmMessages() {
  const i = getMsgInfo(), s = getSettings(), n = i.names || '[your names]';
  return [
    { id: 't-msg-hotel', icon: '🏨', title: 'Hanoi Chic Boutique Hotel', phone: s.hotelPhone,
      en: `Hello Hanoi Chic Boutique Hotel. This is ${n}, staying with you from 24 to 29 November${refEn(i.hotelRef)}. This is my WhatsApp number.
We land at Noi Bai Airport, Terminal 2, at 10:00 am on 24 November (IndiGo 6E-1637). We have express immigration.
1. Please confirm the airport car: driver at the arrivals exit at 10:45–11:00 am, with a sign showing our name. Please send the driver's name, phone number and car number plate.
2. We reach the hotel around 12 noon — early check-in if possible, or a place to rest.
3. Please confirm the Ninh Binh tour pickup time on 28 November.
4. On 28 November we move to a standard room for the last night — please move our packed bags while we are in Ninh Binh.
5. Please book the car to the airport on 29 November at 3:30 pm, and send the driver's details for the Ninh Binh day too.
6. Please tell us the balance to pay in đồng — we will pay in đồng.
Thank you very much!`,
      vi: `Xin chào khách sạn Hanoi Chic Boutique. Tôi là ${n}, ở khách sạn từ ngày 24 đến 29 tháng 11${refVi(i.hotelRef)}. Đây là số WhatsApp của tôi.
Chúng tôi hạ cánh tại sân bay Nội Bài, nhà ga T2, lúc 10:00 sáng ngày 24/11 (chuyến bay IndiGo 6E-1637). Chúng tôi có dịch vụ nhập cảnh nhanh.
1. Xin vui lòng xác nhận xe đón sân bay: tài xế chờ ở cửa ra khu đến lúc 10:45–11:00 sáng, cầm biển ghi tên chúng tôi. Xin gửi tên, số điện thoại và biển số xe của tài xế.
2. Chúng tôi đến khách sạn khoảng 12 giờ trưa — xin cho nhận phòng sớm nếu được, hoặc một chỗ để nghỉ.
3. Xin xác nhận giờ đón đi Ninh Bình ngày 28/11.
4. Ngày 28/11 chúng tôi chuyển sang phòng tiêu chuẩn cho đêm cuối — xin chuyển giúp hành lý đã đóng gói khi chúng tôi đi Ninh Bình.
5. Xin đặt xe ra sân bay ngày 29/11 lúc 3:30 chiều, và gửi thông tin tài xế cho ngày đi Ninh Bình.
6. Xin cho biết số tiền còn lại phải trả bằng tiền đồng — chúng tôi sẽ trả bằng tiền đồng.
Cảm ơn rất nhiều!` },
    { id: 't-msg-cruise', icon: '🚢', title: 'Ambassador Cruise', phone: s.cruisePhone,
      en: `Hello Ambassador Cruise. This is ${n}, booked on the cruise on 25–26 November${refEn(i.cruiseRef)}. This is my WhatsApp number.
1. Please send the shuttle pickup time at Hanoi Chic Boutique Hotel, 51-53 Bat Su, Hoan Kiem, Hanoi.
2. Please confirm pure vegetarian Indian meals for both of us, as booked: no meat, no fish, no fish sauce. Eggs are OK.
Thank you very much!`,
      vi: `Xin chào Ambassador Cruise. Tôi là ${n}, đã đặt du thuyền ngày 25–26 tháng 11${refVi(i.cruiseRef)}. Đây là số WhatsApp của tôi.
1. Xin vui lòng gửi giờ xe đón tại khách sạn Hanoi Chic Boutique, 51-53 Bát Sứ, Hoàn Kiếm, Hà Nội.
2. Xin xác nhận bữa ăn chay kiểu Ấn Độ cho cả hai người như đã đặt: không thịt, không cá, không nước mắm. Trứng thì được.
Cảm ơn rất nhiều!` },
    { id: 't-msg-ft', icon: '⚡', title: 'Express immigration (Klook)', phone: s.fasttrackPhone,
      en: `Hello. This is ${n}. We booked the Fast Track / priority immigration service on Klook${refEn(i.ftRef)}. This is my WhatsApp number.
We arrive at Noi Bai Airport, Terminal 2, on 24 November, IndiGo 6E-1637 from Mumbai, landing at 10:00 am.
Please confirm where your staff will meet us. Thank you very much!`,
      vi: `Xin chào. Tôi là ${n}. Chúng tôi đã đặt dịch vụ nhập cảnh nhanh (Fast Track) qua Klook${refVi(i.ftRef)}. Đây là số WhatsApp của tôi.
Chúng tôi đến sân bay Nội Bài, nhà ga T2, ngày 24 tháng 11, chuyến bay IndiGo 6E-1637 từ Mumbai, hạ cánh lúc 10:00 sáng.
Xin vui lòng xác nhận nhân viên sẽ đón chúng tôi ở đâu. Cảm ơn rất nhiều!` }
  ];
}

function renderConfirm() {
  const i = getMsgInfo();
  const inp = (id, label, ph) => `<label for="mi-${id}">${label}</label><input id="mi-${id}" data-mi="${id}" type="text" value="${esc(i[id])}" placeholder="${esc(ph)}" autocomplete="off">`;
  return `<section class="card accent"><h2>📲 Send 3 short messages, once</h2>
      <p>So the hotel, cruise and airport staff know this is your number and when you arrive. Copy a message and paste it in WhatsApp — or tap "Open WhatsApp".</p>
      <p class="kn">ಹೋಟೆಲ್, ಹಡಗು, ವಿಮಾನ ನಿಲ್ದಾಣದ ಸಿಬ್ಬಂದಿಗೆ ಒಮ್ಮೆ ಸಂದೇಶ ಕಳುಹಿಸಿ — ಇದು ನಿಮ್ಮ ನಂಬರ್, ನೀವು ಯಾವಾಗ ಬರುತ್ತೀರಿ ಎಂದು ತಿಳಿಯಲು.</p></section>
    <details class="card fold"><summary>✏️ Names and booking numbers</summary>
      ${inp('names', 'Your names (as on the booking)', 'e.g. Mr & Mrs Rao')}
      ${inp('hotelRef', 'Hotel booking number (optional)', '')}
      ${inp('cruiseRef', 'Cruise booking number (optional)', '')}
      ${inp('ftRef', 'Klook booking number (optional)', '')}
      <p class="muted small">Saved on this phone only. The messages update as you type.</p>
    </details>
    <div id="msg-list">${msgCards()}</div>`;
}

function msgCards() {
  return confirmMessages().map(m => {
    const done = isDone(m.id), tel = digits(m.phone);
    const box = (lang, text) => `<div class="msgbox"><p class="flabel">${lang === 'en' ? 'English' : 'Tiếng Việt (Vietnamese)'}</p>
      <pre class="msgtext" lang="${lang}">${esc(text)}</pre>
      <div class="actions">
        <button type="button" class="btn secondary" data-copy="${m.id}:${lang}">📋 Copy</button>
        ${tel ? `<a class="btn green" href="https://wa.me/${tel}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">💬 Open WhatsApp</a>`
          : '<a class="btn secondary" href="#settings">Add number in Settings</a>'}
      </div></div>`;
    return `<section class="card msgcard${done ? ' done' : ''}">
      <h3>${m.icon} ${esc(m.title)}</h3>
      <p class="muted small">${tel ? `WhatsApp ${esc(m.phone)}` : 'Number not saved yet'}</p>
      ${done || !tel ? '' : `<a class="btn sendboth" href="https://wa.me/${tel}?text=${encodeURIComponent(m.en + '\n\n— Tiếng Việt —\n' + m.vi)}" target="_blank" rel="noopener">💬 Send on WhatsApp (English + Vietnamese)</a>
        <p class="muted small">Opens WhatsApp with the message ready — just tap ➤ Send. <span class="kn">WhatsApp ತೆರೆದು ➤ ಒತ್ತಿ.</span></p>`}
      ${done ? '' : box('en', m.en) + box('vi', m.vi)}
      ${doneBtn(m.id)}
    </section>`;
  }).join('');
}

function startConfirm() {
  const main = document.getElementById('screen');
  const onInput = e => {
    const k = e.target.dataset.mi; if (!k) return;
    const i = getMsgInfo(); i[k] = e.target.value.trim(); Store.set('msgInfo', i);
    document.getElementById('msg-list').innerHTML = msgCards();
  };
  const onClick = async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const [id, lang] = b.dataset.copy.split(':'), m = confirmMessages().find(x => x.id === id);
    try { await navigator.clipboard.writeText(m[lang]); toast('Copied ✓ — paste in WhatsApp / ನಕಲಿಸಲಾಗಿದೆ'); }
    catch (err) { toast('Press and hold the text to copy. / ಪಠ್ಯವನ್ನು ಒತ್ತಿ ಹಿಡಿದು ನಕಲಿಸಿ.', 3500); }
  };
  main.addEventListener('input', onInput); main.addEventListener('click', onClick);
  return () => { main.removeEventListener('input', onInput); main.removeEventListener('click', onClick); };
}

// When all three are ticked, the Today reminder is done too
document.addEventListener('click', e => {
  const b = e.target.closest('[data-task]');
  if (!b || !MSG_TASKS.includes(b.dataset.task)) return;
  setTimeout(() => setVisited('t-msgs', MSG_TASKS.every(isDone)), 0);
});

ROUTES.confirm = { title: 'Messages', tab: '', back: () => (/^#prep|^#check/.test(prevHash) ? 'prep' : 'today'), render: renderConfirm, after: startConfirm };
