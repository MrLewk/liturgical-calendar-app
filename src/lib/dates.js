// ---- Liturgical date-calculation engine ----
//
// Everything the app needs to derive season boundaries and feast dates for
// any given calendar year, computed rather than hardcoded. Two moveable
// anchors matter: Western Easter (Gregorian Paschalion) and Orthodox Pascha
// (Julian Paschalion, expressed as a Gregorian calendar date). Every season
// boundary and moveable feast is offset from one of these two anchors, or
// from a small number of fixed calendar dates.

/** Add `n` days to a Date, returning a new Date. Handles negative n. */
export function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

/** True calendar-day difference between two Dates (ignores time-of-day). */
export function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

/** Strip time-of-day so comparisons/formatting are stable. */
export function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Western Easter Sunday (Gregorian calendar), via the Meeus/Jones/Butcher
 * algorithm. Valid for any Gregorian year; used directly by Catholic and
 * Anglican calendars.
 */
export function westernEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Number of days the Julian calendar trails the Gregorian calendar in a
 * given (Gregorian) year. 13 days for 1900–2099, 14 for 2100–2199, etc.
 */
export function julianOffset(gregorianYear) {
  return Math.floor(gregorianYear / 100) - Math.floor(gregorianYear / 400) - 2;
}

/**
 * Orthodox Pascha, returned as a Gregorian-calendar Date. Computed via the
 * classic Julian-calendar Easter algorithm (Meeus), then shifted into the
 * Gregorian calendar by the current Julian/Gregorian offset. This is the
 * date used by ALL Orthodox jurisdictions for Pascha and everything derived
 * from it (Great Lent, Holy Week, Pentecost) — including those that
 * otherwise use the Gregorian "New Calendar" for fixed feasts.
 */
export function orthodoxPascha(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // Julian-calendar month
  const day = ((d + e + 114) % 31) + 1; // Julian-calendar day

  // `month`/`day` are a date *in the Julian calendar*. Interpreting them as
  // a same-numbered Gregorian date and adding the offset gives the correct
  // Gregorian date.
  const julianAsGregorian = new Date(year, month - 1, day);
  return addDays(julianAsGregorian, julianOffset(year));
}

/**
 * A fixed Julian-calendar date (month/day, e.g. Nativity = Dec 25 Julian),
 * expressed as a Gregorian Date for the given Gregorian year. Used for
 * "Old Calendar" Orthodox fixed feasts, which run ~13 days after their New
 * Calendar counterparts.
 */
export function julianFixedDateInGregorian(gregorianYear, month, day) {
  const julianAsGregorian = new Date(gregorianYear, month - 1, day);
  return addDays(julianAsGregorian, julianOffset(gregorianYear));
}

/** The Sunday on or before `date`. */
export function sundayOnOrBefore(date) {
  return addDays(date, -date.getDay());
}

/**
 * Western Advent Sunday for a given Gregorian year: the Sunday closest to
 * Nov 30, i.e. the Sunday on/before Dec 24 minus three weeks.
 */
export function adventSunday(year) {
  const dec24 = new Date(year, 11, 24);
  return addDays(sundayOnOrBefore(dec24), -21);
}

export function ymd(date) {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

/** "YYYYMMDD", the all-day date form ICS uses. */
export function icsDate(date) {
  const { y, m, d } = ymd(date);
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
}

export function formatLong(date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
