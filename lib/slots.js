import { SERVICES, OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES, CLOSED_DAYS } from "./config";

const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || "") && !isNaN(new Date(date + "T00:00:00"));
}

export function isClosed(date) {
  return CLOSED_DAYS.includes(new Date(date + "T00:00:00").getDay());
}

// Returns the start times that are free for this service on this date.
export function freeSlots(date, serviceId, bookings) {
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service || !isValidDate(date) || isClosed(date)) return [];

  const busy = bookings
    .filter((b) => b.date === date)
    .map((b) => {
      const dur = SERVICES.find((s) => s.id === b.serviceId)?.minutes ?? SLOT_MINUTES;
      return [toMin(b.time), toMin(b.time) + dur];
    });

  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const out = [];
  for (let s = OPEN_HOUR * 60; s + service.minutes <= CLOSE_HOUR * 60; s += SLOT_MINUTES) {
    const e = s + service.minutes;
    if (date < today || (date === today && s <= nowMin)) continue;
    if (busy.some(([bs, be]) => s < be && e > bs)) continue;
    out.push(toTime(s));
  }
  return out;
}
