/* RS Vietnam Trip — trip time helpers (shared by Today and Plan) */
'use strict';

const TZ_OFFSET = { IST: '+05:30', ICT: '+07:00' };
const TZ_NAME   = { IST: 'Asia/Kolkata', ICT: 'Asia/Ho_Chi_Minh' };

const STOP_ICON = {
  home: '🏠', airport: '✈️', hotel: '🏨', lake: '🌊', cruise: '🚢', boat: '⛵',
  temple: '🛕', market: '🛍', theatre: '🎭', viewpoint: '⛰'
};

// Transit stops (home, airport, hotel) don't count as "places visited"
const isPlace = s => !['home', 'airport', 'hotel'].includes(s.type);

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

// Today's date in Vietnam, "YYYY-MM-DD"
const vnDate = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ_NAME.ICT }).format(now);

/* Which day to show.
   Returns { day, before, after, daysLeft } — before the trip shows Day 0 with a countdown. */
function currentTripDay(now = new Date()) {
  const days = DATA.trip.days;
  const first = days[0], last = days[days.length - 1];
  const today = vnDate(now);
  const found = days.find(d => d.date === today);
  if (found) return { day: found };
  if (today < first.date) {
    const start = stopStart(first, first.stops[0]);
    return { day: first, before: true, daysLeft: Math.max(1, Math.ceil((start - now) / 86400000)) };
  }
  // After the last day: still show Day 6 until they land in Bengaluru, then "welcome home"
  const lastStop = last.stops[last.stops.length - 1];
  return { day: last, after: now >= stopStart(last, lastStop) };
}

/* Now / Next for a day. now = stop in progress (or last started), next = first not started. */
function nowNext(day, now = new Date()) {
  const stops = day.stops;
  let nowStop = null, nextStop = null;
  for (const s of stops) {
    if (stopStart(day, s) <= now) nowStop = s;
    else { nextStop = s; break; }
  }
  return { nowStop, nextStop };
}

// Visited ticks (shared with Plan)
const getVisited = () => Store.get('visited', {});
function setVisited(id, on) {
  const v = getVisited();
  if (on) v[id] = true; else delete v[id];
  Store.set('visited', v);
}
