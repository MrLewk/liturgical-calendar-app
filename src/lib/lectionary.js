// ---- Anglican (Common Worship) Weekday Lectionary engine ----
//
// Resolves a real calendar date to the correct Common Worship Weekday
// Lectionary week label + weekday code, then looks up the actual reading
// citations from the transcribed CW Weekday Lectionary tables (2005,
// amended 2010) rather than the placeholder demo text.
//
// Currently wired: Table 6, the Daily Eucharistic Lectionary (DEL).
// Not yet wired: Table 2 (Office OT/NT readings), Tables 3-5 (psalms).
// Those need the same date -> week-label resolver (this file), just a
// different data table to look up into — see TODOs below.

import { addDays, adventSunday, westernEaster, dateOnly, daysBetween, sundayOnOrBefore } from "./dates";
import { lectionaryYearsFor, officeColumnsFor } from "../data/lectionaryYears";
import delTable6 from "../data/del_table6.json";
import rclSundays from "../data/rcl_sundays.json";
import officeTable2 from "../data/office_table2.json";

function nextSunday(date) {
  const d = dateOnly(date);
  const offset = (7 - d.getDay()) % 7 || 7;
  return addDays(d, offset);
}

/** Guards every exported function below against a bad/empty/unparseable
 * `date` (e.g. a date-input the user has cleared) — without this, an
 * invalid Date silently turns into NaN partway through the season math
 * and eventually throws a confusing "not iterable" error out of
 * lectionaryYearsFor. Callers should treat null the same as any other
 * known-gap result: fall back to demo text. */
function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

const WEEKDAY_CODE = ["Sun", "M", "T", "W", "Th", "F", "Sat"];

/**
 * The Church Year's key facts for the year containing `date`: its Advent
 * Sunday, the Gregorian year of the following Easter, and the A/B/C +
 * DEL 1/2 lectionary years that apply throughout it.
 */
function churchYearContext(date) {
  const d = dateOnly(date);
  const thisAdvent = adventSunday(d.getFullYear());
  const adventYear = d >= thisAdvent ? d.getFullYear() : d.getFullYear() - 1;
  const nextYear = adventYear + 1;
  const advent1 = adventSunday(adventYear);
  const advent1Next = adventSunday(nextYear);
  const easter = westernEaster(nextYear);
  const { sundayYear, delYear } = lectionaryYearsFor(adventYear);
  return { advent1, advent1Next, easter, sundayYear, delYear, nextYear };
}

/**
 * Resolves `date` to a { week, day } pair matching the CW Weekday
 * Lectionary's own labels (e.g. { week: "DEL Week 20", day: "Sat" }),
 * covering Advent/Lent/Easter's named weeks and Ordinary Time's DEL-Week
 * 1-34 numbering (mirrors the Roman Ordo Lectionum Missae numbering this
 * table derives from — same forward/backward counting the app's Catholic
 * Ordinary Time already uses in feasts.js).
 *
 * KNOWN GAPS (flagged rather than silently wrong):
 *  - Christmas/Epiphany's date-keyed entries (17-24 Dec, 2-12 Jan) and
 *    their Sunday-shift variants aren't wired yet — falls back to nearest
 *    DEL week, which will be off by a few days right around Christmas.
 *  - The short "Days after Ash Wednesday" bridge (the Thu/Fri/Sat right
 *    before Lent 1) isn't distinguished from the DEL week it interrupts.
 */
export function delWeekLabel(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const day = WEEKDAY_CODE[d.getDay()];
  const { advent1, advent1Next, easter } = churchYearContext(d);

  const ashWednesday = addDays(easter, -46);
  const easterWeekEnd = addDays(easter, 6); // Saturday of Easter week
  const pentecost = addDays(easter, 49);
  const baptismSunday = nextSunday(new Date(easter.getFullYear() - (d >= advent1 ? 0 : 1), 0, 6));
  // ^ Baptism of Christ: Sunday after the Epiphany octave. Uses the same
  // church year as `easter` since both fall in the calendar year after
  // Advent1's year.

  if (d >= advent1 && d < new Date(advent1.getFullYear(), 11, 17)) {
    // Advent 1-3 (Dec 17 onward switches to date-keyed December entries,
    // not yet wired — see KNOWN GAPS).
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    return { week: `Advent ${Math.min(n, 3)}`, day };
  }

  if (d >= addDays(easter, -7) && d < easter) {
    return { week: "HOLY WEEK", day };
  }
  if (d >= easter && d <= easterWeekEnd) {
    return { week: "Easter", day };
  }
  const easterSeasonEnd = pentecost;
  if (d > easterWeekEnd && d <= easterSeasonEnd) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = Math.round(daysBetween(easter, sundayAnchor) / 7) + 1;
    return { week: `Easter ${n}`, day };
  }
  if (d >= addDays(ashWednesday, -3) && d < ashWednesday) {
    return { week: "Days after", day }; // the Thu/Fri/Sat right before Ash Wed
  }
  if (d >= ashWednesday && d < addDays(easter, -7)) {
    const firstSunday = addDays(easter, -42);
    const sundayAnchor = sundayOnOrBefore(d);
    if (d < firstSunday) return { week: "Days after", day }; // Ash Wed itself + the two days after
    const n = 7 - Math.round(daysBetween(sundayAnchor, easter) / 7);
    return { week: `Lent ${n}`, day };
  }

  // ---- Ordinary Time: DEL Week 1-34, forward from Baptism of Christ,
  // backward from the last Sunday before Advent (matches the Roman/CW
  // 34-week numbering; same method as feasts.js's Catholic ordinary2). ----
  if (d < ashWednesday) {
    const delWeek1Monday = addDays(baptismSunday, 1);
    const n = Math.floor(daysBetween(delWeek1Monday, d) / 7) + 1;
    return { week: `DEL Week ${n}`, day };
  }
  const lastSundayBeforeAdvent = addDays(advent1Next, -7);
  const sundayAnchor = sundayOnOrBefore(d);
  const weeksBack = Math.round(daysBetween(sundayAnchor, lastSundayBeforeAdvent) / 7);
  const n = 34 - weeksBack;
  return { week: `DEL Week ${n}`, day };
}

const ORDINAL = [
  null, "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh",
  "Eighth", "Ninth", "Tenth",
];

/**
 * Resolves a Sunday `date` to its Revised Common Lectionary title (e.g.
 * "Fourth Sunday after the Epiphany" or "Proper 16 (21)") for the correct
 * Sunday-Year (A/B/C, from Table 1), then returns the reading citations
 * Vanderbilt Divinity Library publishes for that title in that year-letter.
 *
 * This is the Principal Service Lectionary track the Common Worship
 * Sunday lectionary is itself drawn from (CW makes some of its own small
 * adjustments/alternatives on top of the RCL, not yet reflected here).
 *
 * KNOWN GAPS:
 *  - Christmas/Epiphany/Holy Week's specific fixed-date entries (Nativity,
 *    Presentation, Palm Sunday, Ascension, etc.) aren't wired to their own
 *    date checks yet, only the ordinary Sunday-counting seasons are.
 *  - In years with an unusually long Epiphany season, the ordinal might
 *    exceed what's in the transcribed set for that particular year-letter.
 */
export function sundayReadingFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  if (d.getDay() !== 0) return null; // Sundays only
  const { advent1, advent1Next, easter, sundayYear } = churchYearContext(d);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);

  const years = rclSundays[sundayYear] || [];
  const findByTitle = (re) => years.find((e) => re.test(e.title));

  let title = null;
  if (d < advent1) return null; // shouldn't happen given churchYearContext
  const daysSinceAdvent = daysBetween(advent1, d);
  if (daysSinceAdvent < 28) {
    const n = Math.floor(daysSinceAdvent / 7) + 1;
    title = `${ORDINAL[n]} Sunday of Advent`;
  } else if (d < ashWednesday) {
    // Christmas -> Epiphany season: ordinal Sundays after the Epiphany.
    const epiphanyBaptism = nextSunday(new Date(easter.getFullYear(), 0, 6));
    if (d <= epiphanyBaptism) {
      title = null; // Christmas 1/2, Epiphany, Baptism - fixed dates, not wired
    } else {
      const n = Math.round(daysBetween(epiphanyBaptism, d) / 7) + 1;
      title = `${ORDINAL[n]} Sunday after the Epiphany`;
    }
  } else if (d < easter) {
    const firstSunday = addDays(ashWednesday, 4);
    if (d < firstSunday) title = null; // Transfiguration - fixed, not wired
    else {
      const n = Math.round(daysBetween(firstSunday, d) / 7) + 1;
      title = n <= 5 ? `${ORDINAL[n]} Sunday in Lent` : null; // Palm Sunday - not wired
    }
  } else if (d <= pentecost) {
    if (d.getTime() === easter.getTime()) title = null; // Resurrection of the Lord - not wired
    else {
      const n = Math.round(daysBetween(easter, d) / 7) + 1;
      title = n <= 7 ? `${ORDINAL[n]} Sunday of Easter` : null; // Pentecost - not wired
    }
  } else if (d.getTime() === trinity.getTime()) {
    title = "Trinity Sunday";
  } else if (d > trinity) {
    // Propers: numbered backward from Reign of Christ (Proper 29), the
    // last Sunday before Advent - mirrors the DEL Week 34 backward count.
    const reignOfChrist = addDays(advent1Next, -7);
    const weeksBack = Math.round(daysBetween(d, reignOfChrist) / 7);
    const properN = 29 - weeksBack;
    if (properN === 29) title = findByTitle(/^Reign of Christ/)?.title;
    else title = findByTitle(new RegExp(`^Proper ${properN} \\(`))?.title;
  }

  if (!title) return { sundayYear, title: null, readings: null };
  const entry = years.find((e) => e.title === title);
  return { sundayYear, title, readings: entry ? entry.readings : null };
}


/**
 * Resolves `date` to Table 2's own week-label convention, which differs
 * from DEL's: "Epiphany N" forward from the Baptism of Christ, then a
 * fixed backward count "5 before Lent" .. "1 before Lent" for the final
 * five weeks before Ash Wednesday; "Lent N", "Easter"/"Easter N" as
 * before; then "Trinity" (the week of Trinity Sunday itself) and
 * "Trinity N" forward, switching to a fixed backward count "4 before
 * Advent" .. "1 before Advent" for the final four weeks before Advent.
 *
 * KNOWN GAPS: the Christmas/Epiphany date-keyed block (Dec 17 - Jan 12)
 * isn't wired to specific dates yet, nor is the short "Ascension to
 * Pentecost" alternative 9-day sequence (data is transcribed, just not
 * date-resolved) - both fall back to null, same as delWeekLabel's gaps.
 */
export function officeWeekLabel(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const day = WEEKDAY_CODE[d.getDay()];
  const officeDay = day === "Sat" ? "S" : day; // Table 2 uses bare "S" for Saturday
  const { advent1, advent1Next, easter } = churchYearContext(d);

  const ashWednesday = addDays(easter, -46);
  const easterWeekEnd = addDays(easter, 6);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const baptismSunday = nextSunday(new Date(easter.getFullYear() - (d >= advent1 ? 0 : 1), 0, 6));

  if (d >= advent1 && d < new Date(advent1.getFullYear(), 11, 17)) {
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    return { week: `Advent ${Math.min(n, 4)}`, day: officeDay };
  }
  if (d >= addDays(easter, -7) && d < easter) return { week: "HOLY WEEK", day: officeDay };
  if (d >= easter && d <= easterWeekEnd) return { week: "Easter", day: officeDay };
  if (d > easterWeekEnd && d <= pentecost) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = Math.round(daysBetween(easter, sundayAnchor) / 7) + 1;
    return { week: `Easter ${n}`, day: officeDay };
  }
  if (d >= ashWednesday && d < addDays(easter, -7)) {
    const firstSunday = addDays(easter, -42);
    if (d < firstSunday) return null; // Ash Wed + 2 days - not wired (matches DEL's gap)
    const sundayAnchor = sundayOnOrBefore(d);
    const n = 7 - Math.round(daysBetween(sundayAnchor, easter) / 7);
    return { week: `Lent ${n}`, day: officeDay };
  }

  if (d < ashWednesday) {
    // Epiphany N forward, switching to "N before Lent" for the final 5
    // weeks before Ash Wednesday (a fixed-length backward count, same
    // mechanism as DEL's forward/backward split).
    const epiphany1Monday = addDays(baptismSunday, 1);
    const ashWedMonday = addDays(sundayOnOrBefore(ashWednesday), 1);
    const totalWeeks = Math.round(daysBetween(epiphany1Monday, ashWedMonday) / 7);
    const weeksFromStart = Math.floor(daysBetween(epiphany1Monday, d) / 7);
    const weeksRemaining = totalWeeks - weeksFromStart;
    if (weeksRemaining <= 5) {
      return { week: `${weeksRemaining} before Lent`, day: officeDay };
    }
    return { week: `Epiphany ${weeksFromStart + 1}`, day: officeDay };
  }

  // Trinity through the week before Advent: forward "Trinity N", switching
  // to "N before Advent" for the last 4 weeks.
  const lastSundayBeforeAdvent = addDays(advent1Next, -7);
  const fourBeforeAdventMonday = addDays(lastSundayBeforeAdvent, -3 * 7 + 1);
  if (d.getTime() === trinity.getTime()) return { week: "Trinity", day: officeDay };
  if (d >= fourBeforeAdventMonday) {
    const sundayAnchor = sundayOnOrBefore(d);
    const weeksBack = Math.round(daysBetween(sundayAnchor, lastSundayBeforeAdvent) / 7);
    const n = 4 - weeksBack;
    if (n >= 1 && n <= 4) return { week: `${n} before Advent`, day: officeDay };
  }
  if (d > trinity) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = Math.round(daysBetween(trinity, sundayAnchor) / 7);
    return { week: `Trinity ${n}`, day: officeDay };
  }
  return null;
}

function isOrdinaryTime(date, easter) {
  const d = dateOnly(date);
  const presentation = new Date(easter.getFullYear(), 1, 2); // Feb 2, same calendar year as Easter
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  return (d >= presentation && d < ashWednesday) || d > pentecost;
}

/**
 * The real Office (Morning/Evening Prayer) OT + NT reading for `date` and
 * `service` ("am" or "pm"), using Table 2's transcribed data and the
 * Table-1-assigned column set for the church year and Ordinary/Seasonal
 * split. Returns null on any of the known gaps (see officeWeekLabel) or
 * if the resolved week/day isn't in the transcribed table.
 */
export function officeReadingFor(date, service) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const label = officeWeekLabel(d);
  if (!label) return null;
  const row = officeTable2.main[label.week]?.[label.day];
  if (!row) return null;

  const { advent1, easter } = churchYearContext(d);
  const adventYear = advent1.getFullYear();
  const cols = officeColumnsFor(adventYear);
  if (!cols) return null;
  const ordinary = isOrdinaryTime(d, easter);
  const colSet = service === "am"
    ? (ordinary ? cols.mpOrdinary : cols.mpSeasonal)
    : (ordinary ? cols.epOrdinary : cols.epSeasonal);
  const [otCol, ntCol] = colSet.split("/"); // e.g. "OT2a" / "NT2"
  const ot = row[otCol.toLowerCase()];
  const nt = row[ntCol.toLowerCase()];
  if (!ot && !nt) return null;
  return { week: label.week, day: label.day, ot, nt, colSet };
}

/**
 * The real Daily Eucharistic Lectionary reading citation for `date`,
 * replacing the hardcoded demo entry in App.jsx's READINGS.Catholic.mass.
 * Returns null if the week/day combination isn't in the transcribed table
 * yet (see KNOWN GAPS above) — callers should fall back to demo text in
 * that case rather than show nothing.
 */
export function eucharistReadingFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const result = delWeekLabel(d);
  if (!result) return null;
  const { week, day } = result;
  const { delYear } = churchYearContext(d);
  const row = delTable6[week]?.[day];
  if (!row) return null;
  const citation = delYear === 1 ? row.yr1 : row.yr2;
  return { week, day, delYear, citation };
}
