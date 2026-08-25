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
  const christmasYear = advent1.getFullYear();
  const nextYear = christmasYear + 1;

  // Dec 17-24: date-keyed "Advent" readings (the "O Antiphons" run-up to
  // Christmas), replacing the generic Advent-week count for these dates.
  if (d >= new Date(christmasYear, 11, 17) && d <= new Date(christmasYear, 11, 24)) {
    return { week: `Dec ${d.getDate()}`, day: "fixed" };
  }
  if (d >= advent1 && d < new Date(christmasYear, 11, 17)) {
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    return { week: `Advent ${Math.min(n, 3)}`, day };
  }
  // Dec 25-28 (Christmas Day + the days of Stephen/John/Holy Innocents) and
  // Jan 1/6 (Naming and Circumcision, Epiphany) are Principal Feasts with
  // their own propers elsewhere, not in this weekday table - known gap.
  if (d >= new Date(christmasYear, 11, 29) && d <= new Date(christmasYear, 11, 31)) {
    return { week: `Dec ${d.getDate()}`, day: "fixed" };
  }
  if (d >= new Date(christmasYear, 11, 25) && d <= new Date(christmasYear, 11, 28)) {
    return null; // Christmas Day, Stephen, John, Holy Innocents - Principal Feasts, own propers elsewhere
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() === 1) {
    return null; // Naming and Circumcision - a Principal Feast with its own propers elsewhere, not in this table
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() >= 2 && d.getDate() <= 5) {
    return { week: `Jan ${d.getDate()}`, day: "fixed" };
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() === 6) {
    return null; // The Epiphany itself - a Principal Feast with its own propers elsewhere, not in this table
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() >= 7 && d.getDate() <= 12) {
    // Only correct "if 6 January is not a Sunday" and up to the Saturday
    // after; the Sunday-shift variant isn't modeled - a rare, documented
    // approximation for this narrow week.
    return { week: `Jan ${d.getDate()}`, day: "fixed" };
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
    // Christmas -> Epiphany season. Epiphany itself (Jan 6) only replaces a
    // Sunday's principal service if it actually falls on a Sunday - in that
    // case Baptism of Christ shifts to the following Sunday (13 Jan).
    const christmasYear = easter.getFullYear() - 1;
    const jan6 = new Date(easter.getFullYear(), 0, 6);
    const epiphanyIsSunday = jan6.getDay() === 0;
    const firstSundayAfterChristmas = nextSunday(new Date(christmasYear, 11, 25));
    const baptismSunday = epiphanyIsSunday ? addDays(jan6, 7) : nextSunday(jan6);

    if (d.getTime() === firstSundayAfterChristmas.getTime()) {
      title = "First Sunday after Christmas Day";
    } else if (d > firstSundayAfterChristmas && d < jan6) {
      title = findByTitle(/^Second Sunday after Christmas/)?.title;
    } else if (epiphanyIsSunday && d.getTime() === jan6.getTime()) {
      title = "Epiphany of the Lord";
    } else if (d.getTime() === baptismSunday.getTime()) {
      title = "Baptism of the Lord";
    } else if (d.getTime() === sundayOnOrBefore(ashWednesday).getTime()) {
      title = "Transfiguration Sunday"; // the last Sunday before Ash Wed, still chronologically pre-Lent
    } else if (d > baptismSunday) {
      const n = Math.round(daysBetween(baptismSunday, d) / 7) + 1;
      title = findByTitle(new RegExp(`^${ORDINAL[n]} Sunday after the Epiphany$`))?.title;
    }
  } else if (d < easter) {
    const firstSunday = addDays(ashWednesday, 4);
    const palmSunday = addDays(easter, -7);
    if (d.getTime() === palmSunday.getTime()) {
      title = "Liturgy of the Passion"; // the fuller 4-reading set; "Liturgy of the Palms" is just the procession Gospel
    } else if (d >= firstSunday && d < palmSunday) {
      const n = Math.round(daysBetween(firstSunday, d) / 7) + 1;
      title = n <= 5 ? `${ORDINAL[n]} Sunday in Lent` : null;
    }
  } else if (d.getTime() === easter.getTime()) {
    title = "Resurrection of the Lord";
  } else if (d <= pentecost) {
    if (d.getTime() === pentecost.getTime()) {
      title = "Day of Pentecost";
    } else {
      const n = Math.round(daysBetween(easter, d) / 7) + 1;
      title = n <= 7 ? `${ORDINAL[n]} Sunday of Easter` : null;
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
  const christmasYear = advent1.getFullYear();
  const nextYear = christmasYear + 1;

  if (d >= advent1 && d < new Date(christmasYear, 11, 25)) {
    // No separate Dec 17-24 date-keyed block exists in Table 2 (unlike
    // DEL/Table 6) - Advent 4 continues generically all the way to Dec 24.
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    return { week: `Advent ${Math.min(n, 4)}`, day: officeDay };
  }

  // Dec 29-31, Jan 1 (Naming/Circumcision), Jan 2-5, Jan 7-12: date-keyed
  // entries with their own range-style week labels (matching Table 2's own
  // grouping) rather than the usual weekly M-S blocks.
  if (d >= new Date(christmasYear, 11, 29) && d <= new Date(christmasYear, 11, 31)) {
    return { week: "Dec 29–31", day: String(d.getDate()) };
  }
  if (d >= new Date(christmasYear, 11, 25) && d <= new Date(christmasYear, 11, 28)) {
    return null; // Christmas Day, Stephen, John, Holy Innocents - Principal Feasts, own propers elsewhere
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() === 1) {
    return { week: "Naming and Circumcision", day: "1" };
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() >= 2 && d.getDate() <= 5) {
    return { week: "Jan 2–5", day: String(d.getDate()) };
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() === 6) {
    return null; // The Epiphany itself - a Principal Feast with its own propers elsewhere, not in this table
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() >= 7 && d.getDate() <= 12) {
    // Only correct "if 6 January is not a Sunday"; the Sunday-shift variant
    // isn't modeled - same documented approximation as the DEL side.
    return { week: "Jan 7–12", day: String(d.getDate()) };
  }

  if (d >= addDays(easter, -7) && d < easter) return { week: "HOLY WEEK", day: officeDay };
  if (d >= easter && d <= easterWeekEnd) return { week: "Easter", day: officeDay };
  if (d > easterWeekEnd && d < pentecost) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = Math.round(daysBetween(easter, sundayAnchor) / 7) + 1;
    return { week: `Easter ${n}`, day: officeDay };
  }
  const pentecostWeekEnd = addDays(pentecost, 6); // the Saturday after Pentecost Sunday
  if (d >= pentecost && d <= pentecostWeekEnd) {
    return { week: "Pentecost", day: officeDay }; // Pentecost Sunday through Whit Saturday, before Trinity
  }
  if (d >= addDays(easter, -42) && d < addDays(easter, -7)) {
    // Lent 1-5 (starts the Sunday 6 weeks before Easter; the "N before
    // Lent" backward-count zone below owns everything up to that Sunday,
    // including Ash Wednesday itself and the Th/F/Sat right after it,
    // since Table 2 groups those into the same M-Sat "1 before Lent" week
    // rather than splitting them out separately the way DEL does).
    const sundayAnchor = sundayOnOrBefore(d);
    const n = 7 - Math.round(daysBetween(sundayAnchor, easter) / 7);
    return { week: `Lent ${n}`, day: officeDay };
  }

  if (d < addDays(easter, -42)) {
    // Epiphany N forward, switching to "N before Lent" for the final 5
    // weeks before Ash Wednesday (a fixed-length backward count, same
    // mechanism as DEL's forward/backward split). This zone owns all of
    // Ash Wednesday's week (Table 2 has no separate Ash-Wed-onwards block
    // the way DEL/Table 6 does), so it correctly runs right up to Lent 1
    // Sunday rather than stopping at Ash Wednesday itself.
    const epiphany1Monday = addDays(baptismSunday, 1);
    const ashWedMonday = addDays(sundayOnOrBefore(ashWednesday), 1);
    const mondayAnchor = addDays(sundayOnOrBefore(d), 1);
    const weeksBack = Math.round(daysBetween(mondayAnchor, ashWedMonday) / 7);
    if (weeksBack < 5) {
      return { week: `${weeksBack + 1} before Lent`, day: officeDay };
    }
    const weeksFromStart = Math.floor(daysBetween(epiphany1Monday, d) / 7);
    return { week: `Epiphany ${weeksFromStart + 1}`, day: officeDay };
  }

  // Trinity through the week before Advent: forward "Trinity N", switching
  // to "N before Advent" for the last 4 weeks.
  const lastSundayBeforeAdvent = addDays(advent1Next, -7);
  const fourBeforeAdventMonday = addDays(lastSundayBeforeAdvent, -3 * 7 + 1);
  const trinityWeekEnd = addDays(trinity, 6); // the Saturday right after Trinity Sunday
  if (d >= trinity && d <= trinityWeekEnd) return { week: "Trinity", day: officeDay };
  if (d >= fourBeforeAdventMonday) {
    const sundayAnchor = sundayOnOrBefore(d);
    const weeksBack = Math.round(daysBetween(sundayAnchor, lastSundayBeforeAdvent) / 7);
    const n = weeksBack + 1;
    if (n >= 1 && n <= 4) return { week: `${n} before Advent`, day: officeDay };
  }
  if (d > trinityWeekEnd) {
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
import table3Seasonal from "../data/table3_seasonal.json";
import table4Ordinary from "../data/table4_ordinary.json";

const PSALM_DAY = { Sun: "Sun", M: "M", T: "T", W: "W", Th: "Th", F: "F", Sat: "Sat" };

/**
 * Resolves `date` to where its psalm(s) come from: Table 3 (season-
 * specific weeks - Advent, Christmas/Epiphany date-keyed block, Epiphany
 * 1-4, Lent, Easter, the 4 weeks before Advent) or Table 4 (the rolling
 * 7-week "Ordinary Time" cycle used everywhere else, per the source's own
 * Note 3: Week 1 begins the first Monday of Advent, resumes at Week 4 on
 * the Monday between 2-8 January, and begins again at Week 1 the day
 * after the Second Sunday of Easter - independent of which specific
 * calendar dates it's actually consulted on).
 */
export function psalmWeekLabel(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const day = WEEKDAY_CODE[d.getDay()];
  const psalmDay = day === "Sat" ? "Sat" : day;
  const { advent1, advent1Next, easter } = churchYearContext(d);

  const ashWednesday = addDays(easter, -46);
  const easterWeekEnd = addDays(easter, 6);
  const easter2Sunday = addDays(easter, 7);
  const pentecost = addDays(easter, 49);
  const presentation = new Date(easter.getFullYear(), 1, 2);
  const baptismSunday = nextSunday(new Date(easter.getFullYear() - (d >= advent1 ? 0 : 1), 0, 6));
  const christmasYear = advent1.getFullYear();
  const nextYear = christmasYear + 1;

  if (d >= advent1 && d < new Date(christmasYear, 11, 19)) {
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    return { source: "table3", week: `Advent ${Math.min(n, 3)}`, day: psalmDay };
  }
  if (d >= new Date(christmasYear, 11, 19) && d <= new Date(christmasYear, 11, 31)) {
    return { source: "table3", week: "Dec fixed", day: String(d.getDate()) };
  }
  if (d.getFullYear() === nextYear && d.getMonth() === 0 && d.getDate() <= 12) {
    return { source: "table3", week: "Jan fixed", day: String(d.getDate()) };
  }

  if (d >= addDays(easter, -7) && d < easter) return null; // Holy Week - no psalm entry in Table 3
  if (d >= easter && d <= easterWeekEnd) return { source: "table3", week: "Easter", day: psalmDay };
  if (d > easterWeekEnd && d < pentecost) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = Math.round(daysBetween(easter, sundayAnchor) / 7) + 1;
    if (n <= 7) return { source: "table3", week: `Easter ${n}`, day: psalmDay };
  }

  if (d.getTime() === ashWednesday.getTime()) return { source: "table3", week: "Ash Wednesday", day: "W" };
  if (d > ashWednesday && d <= addDays(ashWednesday, 3)) {
    return { source: "table3", week: "Days after", day: psalmDay };
  }
  if (d >= addDays(easter, -42) && d < addDays(easter, -7)) {
    const sundayAnchor = sundayOnOrBefore(d);
    const n = 7 - Math.round(daysBetween(sundayAnchor, easter) / 7);
    return { source: "table3", week: `Lent ${n}`, day: psalmDay };
  }

  if (d.getTime() === presentation.getTime()) {
    return { source: "table3", week: "Presentation", day: "fixed" };
  }

  const epiphany1Monday = addDays(baptismSunday, 1);
  if (d >= epiphany1Monday && d < presentation) {
    const weeksFromStart = Math.floor(daysBetween(epiphany1Monday, d) / 7);
    if (weeksFromStart < 4) {
      return { source: "table3", week: `Epiphany ${weeksFromStart + 1}`, day: psalmDay };
    }
    // else falls through to the Table 4 cycle below - Table 3 only provides
    // 4 explicit Epiphany weeks; a longer Epiphany season (late Easter)
    // continues on whatever week Table 4's independent counter has reached.
  }

  const lastSundayBeforeAdvent = addDays(advent1Next, -7);
  const fourBeforeAdventMonday = addDays(lastSundayBeforeAdvent, -3 * 7 + 1);
  if (d >= fourBeforeAdventMonday && d < advent1Next) {
    const sundayAnchor = sundayOnOrBefore(d);
    const weeksBack = Math.round(daysBetween(sundayAnchor, lastSundayBeforeAdvent) / 7);
    const n = weeksBack + 1;
    if (n >= 1 && n <= 4) return { source: "table3", week: `${n} before Advent`, day: psalmDay };
  }

  // Everything else (Presentation+1 .. Ash Wed eve; Epiphany weeks past the
  // 4 Table 3 provides; Pentecost+1 .. the Saturday before "4 before
  // Advent") uses Table 4's rolling 7-week cycle.
  const janMonday = (() => {
    for (let dom = 2; dom <= 8; dom++) {
      const cand = new Date(nextYear, 0, dom);
      if (cand.getDay() === 1) return cand;
    }
    return new Date(nextYear, 0, 2);
  })();
  const mondayOfD = addDays(sundayOnOrBefore(d), 1);
  let anchor, anchorWeek;
  if (d < easter2Sunday) {
    anchor = janMonday;
    anchorWeek = 4;
  } else {
    anchor = addDays(easter2Sunday, 1);
    anchorWeek = 1;
  }
  const weeksElapsed = Math.round(daysBetween(anchor, mondayOfD) / 7);
  const week = (((anchorWeek - 1 + weeksElapsed) % 7) + 7) % 7 + 1;
  return { source: "table4", week: String(week), day: psalmDay };
}

/**
 * The real psalm citation for `date` and `service` ("am"/"pm"), from
 * whichever of Table 3 or Table 4 applies. Returns null on Holy Week,
 * Ascension Day, and the Ash Wednesday + 2 days gap (all genuine gaps in
 * the source table itself, not transcription gaps), or if the resolved
 * week/day isn't in the transcribed data.
 */
export function psalmFor(date, service) {
  if (!isValidDate(date)) return null;
  const label = psalmWeekLabel(date);
  if (!label) return null;
  const table = label.source === "table3" ? table3Seasonal : table4Ordinary;
  const row = table[label.week]?.[label.day] || table[label.week]?.fixed;
  if (!row) return null;
  const citation = service === "am" ? row.m : row.e;
  if (!citation) return null;
  return { source: label.source, week: label.week, day: label.day, citation };
}

import collects1662 from "../data/collects_1662_raw.json";

const ORDINAL_LOWER = [
  null, "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
  "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth",
  "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth",
];

/**
 * Builds the ordered chain of "collect anchor points" for the 1662 Book of
 * Common Prayer's church year containing `date` - each a { date, label }
 * pair marking a day whose own Collect takes over and governs every day
 * after it until the next anchor, per the BCP's own rule ("the Collect
 * appointed for every Sunday... shall be said at the Evening Service next
 * before" implies, and BCP practice confirms, that a Sunday's - or a
 * named weekday's - Collect is used right through the following week
 * until superseded). Fixed saints'-days are handled separately as
 * single-day overrides, not part of this carry-forward chain.
 */
function buildCollect1662Chain(date) {
  const d = dateOnly(date);
  const { advent1, advent1Next, easter } = churchYearContext(d);
  const christmasYear = advent1.getFullYear();
  const nextYear = christmasYear + 1;
  const ashWednesday = addDays(easter, -46);
  const palmSunday = addDays(easter, -7);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const ascension = addDays(easter, 39);
  const ascensionSunday = nextSunday(ascension);
  const baptismEraSunday = nextSunday(new Date(nextYear, 0, 6));
  // ^ not used for 1662 (no "Baptism of Christ" feast) - Epiphany season
  // Sundays are counted from Epiphany (Jan 6) itself, not a Sunday after.

  const chain = [{ date: advent1, label: "The first Sunday in Advent" }];
  for (let n = 2; n <= 4; n++) {
    chain.push({ date: addDays(advent1, (n - 1) * 7), label: `The ${ORDINAL_LOWER[n]} Sunday in Advent` });
  }
  // Christmas -> Epiphany: fixed-date feasts are handled as overrides
  // elsewhere; the Sunday after Christmas Day (if one exists) and the
  // Epiphany Sundays are this chain's own anchors.
  const firstSundayAfterChristmas = nextSunday(new Date(christmasYear, 11, 25));
  if (firstSundayAfterChristmas <= new Date(nextYear, 0, 5)) {
    chain.push({ date: firstSundayAfterChristmas, label: "The Sunday after Christmas-Day" });
  }
  const epiphany = new Date(nextYear, 0, 6);
  chain.push({ date: epiphany, label: "The Epiphany" });
  const epiphany1 = nextSunday(epiphany);
  const quinquagesima = addDays(ashWednesday, -3); // the Sunday right before Ash Wed
  const sexagesima = addDays(quinquagesima, -7);
  const septuagesima = addDays(quinquagesima, -14);
  let epiN = 1;
  for (let s = epiphany1; s < septuagesima; s = addDays(s, 7)) {
    if (epiN > 6) break; // 1662 only provides 6 Epiphany-season Sundays
    chain.push({ date: s, label: `The ${ORDINAL_LOWER[epiN]} Sunday after the Epiphany` });
    epiN++;
  }
  chain.push({ date: septuagesima, label: "Septuagesima (3rd before Lent)" });
  chain.push({ date: sexagesima, label: "Sexagesima (2nd before Lent)" });
  chain.push({ date: quinquagesima, label: "Quinquagesima (next before Lent)" });
  chain.push({ date: ashWednesday, label: "Ash Wednesday" });
  for (let n = 1; n <= 5; n++) {
    chain.push({ date: addDays(ashWednesday, 4 + (n - 1) * 7), label: `The ${ORDINAL_LOWER[n]} Sunday in Lent` });
  }
  chain.push({ date: palmSunday, label: "The Sunday next before Easter" });
  chain.push({ date: addDays(easter, -2), label: "Good Friday" });
  chain.push({ date: addDays(easter, -1), label: "Easter Even" });
  chain.push({ date: easter, label: "Easter Day" });
  chain.push({ date: addDays(easter, 1), label: "Monday in Easter Week" });
  chain.push({ date: addDays(easter, 2), label: "Tuesday in Easter Week" });
  for (let n = 1; n <= 5; n++) {
    chain.push({ date: addDays(easter, 7 + (n - 1) * 7), label: `The ${ORDINAL_LOWER[n]} Sunday after Easter` });
  }
  chain.push({ date: ascension, label: "The Ascension-day" });
  chain.push({ date: ascensionSunday, label: "Sunday after Ascension-Day" });
  chain.push({ date: pentecost, label: "WHIT-SUNDAY" });
  chain.push({ date: addDays(pentecost, 1), label: "Monday in Whitsun-week" });
  chain.push({ date: addDays(pentecost, 2), label: "Tuesday in Whitsun Week" });
  chain.push({ date: trinity, label: "TRINITY-SUNDAY" });
  for (let n = 1; n <= 25; n++) {
    const sunday = addDays(trinity, n * 7);
    if (sunday >= advent1Next) break; // however many Trinity Sundays actually fit that year
    const label = n === 25 ? "The Twenty-Fifth Sunday after Trinity" : `The ${ORDINAL_LOWER[n]} Sunday after Trinity`;
    chain.push({ date: sunday, label });
  }

  return chain.sort((a, b) => a.date - b.date);
}

const FIXED_FEAST_DATES = [
  // [month (0-based), day, label] - a fixed calendar date, any year.
  [10, 30, "St. Andrew’s Day"],
  [11, 21, "St. Thomas the Apostle"],
  [11, 25, "Christmas Day"],
  [11, 26, "Saint Stephen's Day"],
  [11, 27, "Saint John the Evangelist’s Day"],
  [11, 28, "The Innocents Day"],
  [0, 1, "The Circumcision of Christ"],
  [0, 25, "The Conversion of St. Paul"],
  [1, 2, "The Purification of the Virgin Mary"],
  [1, 24, "St. Matthias’s Day"],
  [2, 25, "The Annunciation of the Virgin Mary"],
  [3, 25, "St. Mark’s Day"],
  [4, 1, "St. Philip and St. James’s Day"],
  [5, 11, "St. Barnabas the Apostle"],
  [5, 24, "St. John Baptist’s Day"],
  [5, 29, "St. Peter’s Day"],
  [6, 25, "St. James the Apostle"],
  [7, 24, "St. Bartholomew the Apostle"],
  [8, 21, "St. Matthew the Apostle"],
  [8, 29, "St. Michael and All Angels"],
  [9, 18, "St. Luke the Evangelist"],
  [9, 28, "St. Simon and St. Jude, Apostles"],
  [10, 1, "All Saints Day"],
];

/**
 * Resolves `date` to the 1662 Book of Common Prayer Collect that governs
 * it - a fixed saint's/feast day if `date` falls exactly on one, else
 * whichever Sunday's (or named weekday's) Collect is currently "in force"
 * per the BCP's carry-forward rule.
 *
 * KNOWN APPROXIMATIONS: fixed feast days are treated as always taking
 * precedence on their exact date (the historical rules for transferring a
 * feast that collides with a Sunday aren't modelled). Movable pre-Lent/
 * Advent-adjacent edge cases in unusually early/late-Easter years aren't
 * exhaustively tested.
 */
export function collect1662Label(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);

  for (const [month, day, label] of FIXED_FEAST_DATES) {
    if (d.getMonth() === month && d.getDate() === day) return label;
  }

  const chain = buildCollect1662Chain(d);
  let governing = null;
  for (const anchor of chain) {
    if (anchor.date <= d) governing = anchor;
    else break;
  }
  return governing ? governing.label : null;
}

/** The 1662 Collect text for `date`, or null if collect1662Label doesn't
 * resolve to a transcribed entry. */
export function collect1662For(date) {
  const label = collect1662Label(date);
  if (!label) return null;
  const text = collects1662[label];
  if (!text) return null;
  return { label, text };
}

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

// ---- Common Worship Collects (contemporary language) ----
//
// Mirrors the 1662 BCP collect resolver above: a table of exact single-day
// fixed feasts checked first, then a Sunday/named-weekday chain that
// governs every day after it (carry-forward) until the next anchor.

import collectsCW from "../data/collects_cw_raw.json";

const ORDINAL_CW = [
  null, "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
  "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth",
  "Nineteenth", "Twentieth", "Twenty-first",
];

const FIXED_FEAST_DATES_CW = [
  // [month (0-based), day, label] - matches collects_cw_raw.json keys.
  [0, 1, "The Naming and Circumcision of Jesus"],
  [0, 25, "The Conversion of Paul"],
  [1, 2, "The Presentation of Christ in the Temple"],
  [2, 19, "Joseph of Nazareth"],
  [2, 25, "The Annunciation of Our Lord"],
  [3, 23, "George"],
  [3, 25, "Mark"],
  [4, 1, "Philip and James"],
  [4, 14, "Matthias"],
  [4, 31, "The Visit of the Blessed Virgin Mary to Elizabeth"],
  [5, 11, "Barnabas"],
  [5, 24, "The Birth of John the Baptist"],
  [5, 29, "Peter and Paul"],
  [6, 3, "Thomas"],
  [6, 22, "Mary Magdalene"],
  [6, 25, "James"],
  [7, 6, "The Transfiguration of Our Lord"],
  [7, 15, "The Blessed Virgin Mary"],
  [7, 24, "Bartholomew"],
  [8, 14, "Holy Cross Day"],
  [8, 21, "Matthew"],
  [8, 29, "Michael and All Angels"],
  [9, 18, "Luke"],
  [9, 28, "Simon and Jude"],
  [10, 1, "All Saints' Day"],
  [10, 30, "Andrew"],
  [11, 24, "Christmas Eve"],
  [11, 25, "Christmas Day"],
  [11, 26, "Stephen"],
  [11, 27, "John"],
  [11, 28, "The Holy Innocents"],
];

/**
 * Builds the ordered chain of Sunday/named-weekday collect anchors for the
 * Common Worship church year containing `date`, following the same
 * carry-forward logic as buildCollect1662Chain: each anchor's Collect
 * governs every day after it until the next anchor takes over.
 *
 * KNOWN APPROXIMATIONS: Mothering Sunday is always used in preference to
 * the plain "Fourth Sunday of Lent" provision (CW permits either). Corpus
 * Christi (Thursday after Trinity) is a local-option observance and isn't
 * modelled as a governing anchor, so that Thursday keeps the ambient
 * Ordinary Time collect. The rare edge case of 23 Sundays after Trinity
 * (which BCP-era rubrics handle with a special substitution) isn't
 * modelled; years with more than 21 falls back to "The Last Sunday after
 * Trinity" for the overflow Sundays.
 */
function buildCollectCWChain(date) {
  const d = dateOnly(date);
  const { advent1, advent1Next, easter } = churchYearContext(d);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const ascension = addDays(easter, 39);
  const presentation = new Date(advent1.getFullYear() + 1, 1, 2);

  const chain = [{ date: advent1, label: "The First Sunday of Advent" }];
  for (let n = 2; n <= 4; n++) {
    chain.push({ date: addDays(advent1, (n - 1) * 7), label: `The ${ORDINAL_CW[n]} Sunday of Advent` });
  }

  const christmasDay = new Date(advent1.getFullYear(), 11, 25);
  const firstSundayOfChristmas = nextSunday(christmasDay);
  const epiphany = new Date(advent1.getFullYear() + 1, 0, 6);
  if (firstSundayOfChristmas < epiphany) {
    chain.push({ date: firstSundayOfChristmas, label: "The First Sunday of Christmas" });
    const secondSundayOfChristmas = addDays(firstSundayOfChristmas, 7);
    if (secondSundayOfChristmas < epiphany) {
      chain.push({ date: secondSundayOfChristmas, label: "The Second Sunday of Christmas" });
    }
  }

  chain.push({ date: epiphany, label: "The Epiphany" });
  const baptismSunday = nextSunday(epiphany);
  chain.push({ date: baptismSunday, label: "The Baptism of Christ" });
  for (let n = 2; n <= 4; n++) {
    chain.push({ date: addDays(baptismSunday, (n - 1) * 7), label: `The ${ORDINAL_CW[n]} Sunday of Epiphany` });
  }
  const fourthEpiphanySunday = addDays(baptismSunday, 3 * 7);

  const sundayNextBeforeLent = addDays(ashWednesday, -3);
  const secondBeforeLent = addDays(ashWednesday, -10);
  const thirdBeforeLent = addDays(ashWednesday, -17);
  const fourthBeforeLent = addDays(ashWednesday, -24);
  const fifthBeforeLentStart = addDays(presentation, 1);
  // None of these "before Lent" anchors are valid before the day after
  // Presentation (2 Feb) or before Epiphany's own 4-Sunday numbering has
  // finished - in early-Easter years the arithmetic above can otherwise
  // compute a date that collides with Epiphany season's own anchors.
  const epiphanyEnd = addDays(fourthEpiphanySunday, 1);
  const earliestBeforeLent = epiphanyEnd > fifthBeforeLentStart ? epiphanyEnd : fifthBeforeLentStart;
  if (fifthBeforeLentStart < fourthBeforeLent && fifthBeforeLentStart >= earliestBeforeLent) {
    chain.push({ date: fifthBeforeLentStart, label: "The Fifth Sunday before Lent" });
  }
  if (fourthBeforeLent >= earliestBeforeLent) {
    chain.push({ date: fourthBeforeLent, label: "The Fourth Sunday before Lent" });
  }
  if (thirdBeforeLent >= earliestBeforeLent) {
    chain.push({ date: thirdBeforeLent, label: "The Third Sunday before Lent" });
  }
  if (secondBeforeLent >= earliestBeforeLent) {
    chain.push({ date: secondBeforeLent, label: "The Second Sunday before Lent" });
  }
  chain.push({ date: sundayNextBeforeLent, label: "The Sunday next before Lent" });

  chain.push({ date: ashWednesday, label: "Ash Wednesday" });
  for (let n = 1; n <= 3; n++) {
    chain.push({ date: addDays(ashWednesday, 4 + (n - 1) * 7), label: `The ${ORDINAL_CW[n]} Sunday of Lent` });
  }
  chain.push({ date: addDays(ashWednesday, 25), label: "Mothering Sunday" }); // 4th Sunday of Lent
  chain.push({ date: addDays(ashWednesday, 32), label: "The Fifth Sunday of Lent" });
  chain.push({ date: addDays(easter, -7), label: "Palm Sunday" });
  chain.push({ date: addDays(easter, -3), label: "Maundy Thursday" });
  chain.push({ date: addDays(easter, -2), label: "Good Friday" });
  chain.push({ date: addDays(easter, -1), label: "Easter Eve" });

  chain.push({ date: easter, label: "Easter Day" });
  for (let n = 2; n <= 7; n++) {
    chain.push({ date: addDays(easter, (n - 1) * 7), label: `The ${ORDINAL_CW[n]} Sunday of Easter` });
  }
  chain.push({ date: ascension, label: "Ascension Day" });
  // The 7th Sunday of Easter anchor above (easter+42) already coincides
  // with the Sunday after Ascension Day, so no separate anchor is needed.

  chain.push({ date: pentecost, label: "Day of Pentecost" });
  chain.push({ date: trinity, label: "Trinity Sunday" });

  const beforeAdventCutoff = addDays(advent1Next, -4 * 7);
  let n = 1;
  for (let sunday = addDays(trinity, 7); sunday < beforeAdventCutoff; sunday = addDays(sunday, 7)) {
    const label = n <= 21 ? `The ${ORDINAL_CW[n]} Sunday after Trinity` : "The Last Sunday after Trinity";
    chain.push({ date: sunday, label });
    n++;
  }
  chain.push({ date: addDays(advent1Next, -28), label: "The Fourth Sunday before Advent" });
  chain.push({ date: addDays(advent1Next, -21), label: "The Third Sunday before Advent" });
  chain.push({ date: addDays(advent1Next, -14), label: "The Second Sunday before Advent" });
  chain.push({ date: addDays(advent1Next, -7), label: "Christ the King" });

  return chain.sort((a, b) => a.date - b.date);
}

/**
 * Resolves `date` to the Common Worship Collect that governs it - an exact
 * fixed feast if `date` falls on one, else whichever Sunday's (or named
 * weekday's) Collect is currently "in force" per the carry-forward chain.
 * Mirrors collect1662Label's approach.
 */
export function collectCWLabel(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);

  for (const [month, day, label] of FIXED_FEAST_DATES_CW) {
    if (d.getMonth() === month && d.getDate() === day) return label;
  }

  const chain = buildCollectCWChain(d);
  let governing = null;
  for (const anchor of chain) {
    if (anchor.date <= d) governing = anchor;
    else break;
  }
  return governing ? governing.label : null;
}

/** The Common Worship Collect text for `date`, or null if collectCWLabel
 * doesn't resolve to a transcribed entry. */
export function collectCWFor(date) {
  const label = collectCWLabel(date);
  if (!label) return null;
  const text = collectsCW[label];
  if (!text) return null;
  return { label, text };
}

// ---- 1662 BCP & Common Worship Canticles ----

import canticles1662 from "../data/canticles_1662_raw.json";
import canticlesCW from "../data/canticles_cw_raw.json";

/** Flattens a canticle's verse list into a single readable string, e.g.
 * "O come, let us sing unto the Lord: let us heartily rejoice ...".
 * `source` is "1662" or "CW" - CW currently only covers the four Gospel
 * Canticles (Benedictus, Magnificat, Nunc Dimittis, Te Deum), not Venite/
 * the Easter Anthems, so callers should treat a null return as "this
 * canticle isn't available in this register yet" rather than an error. */
export function canticleText(key, source = "1662") {
  const canticle = (source === "CW" ? canticlesCW : canticles1662)[key];
  if (!canticle) return null;
  return canticle.verses
    .map((v) => (v.b ? `${v.a} ${v.b}` : v.a))
    .join(" ");
}

/** A short preview of a canticle's opening verse(s), truncated to roughly
 * `maxChars`, for use in the collapsed prayer-sequence card. */
export function canticlePreview(key, source = "1662", maxChars = 220) {
  const full = canticleText(key, source);
  if (!full) return null;
  if (full.length <= maxChars) return full;
  const cut = full.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(": "));
  return lastStop > maxChars * 0.4 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + "…";
}

/** True for the eight days of Easter Week (Easter Day through the following
 * Saturday), when the 1662 rubric replaces Venite with the Easter Anthems
 * at Morning Prayer. */
export function isEasterWeek(date) {
  if (!isValidDate(date)) return false;
  const d = dateOnly(date);
  const { easter } = churchYearContext(d);
  return d >= easter && d <= addDays(easter, 6);
}

/** The canticle key that governs Morning Prayer's first canticle slot
 * (normally Venite, replaced by the Easter Anthems during Easter Week).
 * Same key names in both the 1662 and CW canticle data, so this applies
 * to either register - only the lookup source differs. */
export function morningFirstCanticleKey(date) {
  return isEasterWeek(date) ? "easter_anthems" : "venite";
}

/** The canticle key that governs Evening Prayer's opening canticle slot.
 * Only Common Worship has this - the 1662 BCP office moves straight into
 * the psalms with no opening canticle at Evening Prayer, so this returns
 * null for the "1662" register. */
export function eveningFirstCanticleKey(source = "1662") {
  return source === "CW" ? "phos_hilaron" : null;
}

/**
 * Common Worship's seasonal Old Testament Canticle (Morning Prayer) or New
 * Testament Canticle (Evening Prayer) key for `date` - these are seasonal
 * alternatives that replace the fixed Te Deum/Magnificat slot after the OT
 * reading when the CW register is selected. One canticle per season, with
 * two adjustments the fixed 7-item CW set doesn't map onto directly:
 *   - The Paschal Triduum (Maundy Thursday - Holy Saturday) has no canticle
 *     of its own in this set, so it continues Lent's.
 *   - Common Worship distinguishes a short "Pentecost" season from the long
 *     "Ordinary Time" that follows, but this app's own season model treats
 *     both as one continuous season running to the next Advent. That season
 *     is split here at Trinity Sunday (Pentecost + 7 days) to match.
 * `seasonKey` is the `key` field from westernSeasons() (e.g. "advent",
 * "ordinary2") - the same value already used for liturgical colour/season
 * name elsewhere, so callers don't need to duplicate season computation.
 */
export function seasonalCanticleKey(date, service, seasonKey) {
  const isAM = service === "am";

  let bucket = seasonKey;
  if (bucket === "triduum") bucket = "lent";
  if (bucket === "ordinary2") {
    const d = dateOnly(date);
    const { easter } = churchYearContext(d);
    const trinity = addDays(addDays(easter, 49), 7);
    bucket = d < trinity ? "pentecost" : "ordinary";
  } else if (bucket === "ordinary1") {
    bucket = "epiphany";
  }

  const AM_KEYS = {
    advent: "wilderness_advent",
    christmas: "messiah_christmas",
    epiphany: "new_jerusalem_epiphany",
    lent: "humility_lent",
    easter: "moses_miriam_easter",
    pentecost: "ezekiel_pentecost",
    ordinary: "david_ordinary",
  };
  const PM_KEYS = {
    advent: "spirit_advent",
    christmas: "redemption_christmas",
    epiphany: "praise_epiphany",
    lent: "servant_lent",
    easter: "faith_easter",
    pentecost: "gods_children_pentecost",
    ordinary: "lamb_ordinary",
  };

  return (isAM ? AM_KEYS : PM_KEYS)[bucket] || null;
}
