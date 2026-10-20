/* RS Vietnam Trip — trip time helpers (shared by Today and Plan) */
'use strict';

const TZ_OFFSET = { IST: '+05:30', ICT: '+07:00' };
const TZ_NAME   = { IST: 'Asia/Kolkata', ICT: 'Asia/Ho_Chi_Minh' };

const STOP_ICON = {
  home: '🏠', airport: '✈️', hotel: '🏨', lake: '🌊', cruise: '🚢', boat: '⛵',
  temple: '🛕', market: '🛍', theatre: '🎭', viewpoint: '⛰', meal: '🍽'
};

// Transit stops (home, airport, hotel) and meals don't count as "places visited"
const isPlace = s => !['home', 'airport', 'hotel', 'meal'].includes(s.type);

const stopTz    = (day, s) => s.tz || day.tz;
const stopStart = (day, s) => new Date(`${s.date || day.date}T${s.time}:00${TZ_OFFSET[stopTz(day, s)]}`);
const stopEnd   = (day, s) => new Date(stopStart(day, s).getTime() + (s.mins || 0) * 60000);

// "6:30 pm"
const fmtTime = (date, tz) =>
  date.toLocaleTimeString('en-IN', { timeZone: TZ_NAME[tz], hour: 'numeric', minute: '2-digit' }).toLowerCase();

// "6:30 pm" for a stop, plus "(India time)" when it differs from the day's zone
function stopTimeLabel(day, s) {
  const tz = stopTz(day, s);
  return fmtTime(stopStart(day, s), tz) + (tz !== day.tz ? ' (India time)' : '');
}

// "Day 3 · Thu 26 Nov"
function dayLabel(day) {
  const d = new Date(day.date + 'T12:00:00Z');
  const txt = d.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  return `Day ${day.day} · ${txt.replace(',', '')}`;
}

// A date "YYYY-MM-DD" in a given zone (IST / ICT)
const dateIn = (tz, now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ_NAME[tz] }).format(now);
const vnDate = (now = new Date()) => dateIn('ICT', now);

/* F14: which day to show. A day matches when today's date IN THAT DAY'S OWN ZONE equals its date
   (Day 0 uses India time). Returns { day, before, after, daysLeft }. */
function currentTripDay(now = new Date()) {
  const days = DATA.trip.days;
  const first = days[0], last = days[days.length - 1];
  const found = days.find(d => dateIn(d.tz, now) === d.date);
  if (found) return { day: found };
  const istToday = dateIn('IST', now);
  if (istToday < first.date) {
    const daysLeft = Math.round((Date.parse(first.date) - Date.parse(istToday)) / 86400000);  // calendar days, IST
    return { day: first, before: true, daysLeft };
  }
  // After the last day: Day 6 until they land in Bengaluru, then "welcome home"
  const lastStop = last.stops[last.stops.length - 1];
  return { day: last, after: now >= stopStart(last, lastStop) };
}

/* F13: Now / Next across the whole trip timeline.
   NOW only while now < end + 30 min. Between two airport stops = in flight. */
function tripTimeline() {
  return DATA.trip.days.flatMap(day => day.stops.map(s => ({ day, s, start: stopStart(day, s), end: stopEnd(day, s) })))
    .sort((a, b) => a.start - b.start);
}
function tripNowNext(now = new Date()) {
  const tl = tripTimeline();
  let prev = null, next = null;
  for (const x of tl) { if (x.start <= now) prev = x; else { next = x; break; } }
  const grace = 30 * 60000;
  const nowItem = prev && now < new Date(prev.end.getTime() + grace) ? prev : null;
  const inFlight = !!(prev && next && prev.s.type === 'airport' && next.s.type === 'airport' && now >= prev.end);
  const base = { now: inFlight ? null : nowItem, next, inFlight };
  // v1.2: Plan ticks win over the clock. If anything is ticked today, the first unticked stop
  // after the last tick is the one to do now (if its time has come) or next.
  const v = getVisited(), cd = currentTripDay(now);
  if (cd.before || cd.after) return base;
  const todays = tl.filter(x => x.day === cd.day);
  const lastT = todays.map(x => !!v[x.s.id]).lastIndexOf(true);
  if (lastT < 0) return base;
  const rest = tl.slice(tl.indexOf(todays[lastT]) + 1).filter(x => !v[x.s.id]);
  const cand = rest[0] || null;
  if (cand && cand.start <= now) return { now: cand, next: rest[1] || null, inFlight: false };
  return { now: null, next: cand, inFlight: base.inFlight };
}

/* v1.2: the stop to glow in Plan. After the last tick of that day → first unticked stop.
   No ticks that day → on the current trip day use the clock (now, else next); other days: none. */
function dayNextStop(day, now = new Date()) {
  const v = getVisited(), st = day.stops;
  const lastT = st.map(s => !!v[s.id]).lastIndexOf(true);
  if (lastT >= 0) return st.slice(lastT + 1).find(s => !v[s.id]) || null;
  const cd = currentTripDay(now);
  if (cd.before || cd.after || cd.day !== day) return null;
  const r = tripNowNext(now), x = r.now || r.next;
  return x && x.day === day ? x.s : null;
}

// Kept for compatibility (Plan uses day-level logic)
function nowNext(day, now = new Date()) {
  const r = tripNowNext(now);
  return { nowStop: r.now && r.now.day === day ? r.now.s : null, nextStop: r.next && r.next.day === day ? r.next.s : null };
}

// Visited ticks (shared with Plan)
const getVisited = () => Store.get('visited', {});
function setVisited(id, on) {
  const v = getVisited();
  if (on) v[id] = true; else delete v[id];
  Store.set('visited', v);
}
