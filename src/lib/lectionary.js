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

import { addDays, adventSunday, westernEaster, orthodoxPascha, julianFixedDateInGregorian, dateOnly, daysBetween, sundayOnOrBefore } from "./dates";
import { lectionaryYearsFor, officeColumnsFor } from "../data/lectionaryYears";
import delTable6 from "../data/del_table6.json";
import rclSundays from "../data/rcl_sundays.json";
import officeTable2 from "../data/office_table2.json";
import catholicSundays from "../data/catholic_sundays.json";
import catholicOfficePsalter from "../data/catholic_office_psalter.json";
import catholicWeekdays from "../data/catholic_weekdays.json";
import catholicFixedFeastDates from "../data/catholic_fixed_feast_dates.json";
import catholicOfficeReadingsBiblical from "../data/catholic_office_readings_biblical.json";
import orthodoxSundayReadings from "../data/orthodox_sunday_readings.json";

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
/**
 * Resolves `date` (must be a Sunday) to its RCL/CW title string - e.g.
 * "First Sunday of Advent", "Proper 12 (17)", "Trinity Sunday" - using the
 * same title vocabulary as rcl_sundays.json. Returns { sundayYear, title }
 * with title null if date isn't a Sunday or falls outside computable range.
 * Pure date arithmetic, no data lookup - shared by sundayReadingFor (the
 * Principal Service / Eucharist) and secondThirdServiceFor (the CW Second/
 * Third Service Sunday Office readings) so both always agree on which
 * calendar Sunday is "which" Sunday, regardless of how any one data source
 * happens to label its own pages.
 */
export function sundayTitleFor(date) {
  if (!isValidDate(date)) return { sundayYear: null, title: null };
  const d = dateOnly(date);
  if (d.getDay() !== 0) return { sundayYear: null, title: null };
  const { advent1, advent1Next, easter, sundayYear } = churchYearContext(d);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);

  const years = rclSundays[sundayYear] || [];
  const findByTitle = (re) => years.find((e) => re.test(e.title));

  let title = null;
  if (d < advent1) return { sundayYear, title: null }; // shouldn't happen given churchYearContext
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

  return { sundayYear, title };
}

export function sundayReadingFor(date) {
  const { sundayYear, title } = sundayTitleFor(date);
  if (!title) return { sundayYear, title: null, readings: null };
  const years = rclSundays[sundayYear] || [];
  const entry = years.find((e) => e.title === title);
  return { sundayYear, title, readings: entry ? entry.readings : null };
}

// ---- Catholic (Roman Rite) Sunday Mass Lectionary ----
//
// Citations transcribed from the Lectionary for Mass (1998/2002 USA
// Edition) tables at catholic-resources.org, compiled by Fr. Felix Just,
// S.J. (non-commercial use permitted with attribution - see the site's
// Copyright Notice). Only citations were taken, not any translated
// reading text; the actual passage text is drawn from the WEB Catholic
// edition already bundled in the app, same as the Anglican lectionaries.
//
// Reuses the same A/B/C Sunday-cycle table Anglican's Common Worship
// engine already carries (lectionaryYears.js) - the Roman Lectionary and
// the RCL it inspired share the same three-year cycle, keyed the same way
// (by the calendar year Advent begins). Only the Sunday cycle is shared;
// the Roman Weekday Year I/II cycle (not yet wired) follows a simpler
// odd/even *calendar* year rule unrelated to Common Worship's own table.
//
// SIMPLIFICATION: the Ascension of the Lord is resolved to the 7th Sunday
// of Easter (the majority global/USA practice where it's transferred from
// the preceding Thursday) rather than as a fixed Thursday - dioceses that
// keep the Thursday observance would need a settings toggle, matching the
// 1662/CW toggle pattern, as a future follow-up.
//
// KNOWN GAP: fixed-date Solemnities and Feasts of the Lord/saints that
// occasionally displace an Ordinary Time Sunday (Presentation, St
// Joseph, Annunciation, Nativity of John the Baptist, Sts Peter & Paul,
// Transfiguration, Assumption, Exaltation of the Cross, All Saints, All
// Souls, Dedication of the Lateran Basilica, Immaculate Conception) are
// not yet resolved - the Ordinary Time Sunday number is always shown
// instead on those rare dates, a deliberate simplification for this
// first pass rather than the wrong feast's readings.
function sundayOnOrAfter(date) {
  const d = dateOnly(date);
  const offset = (7 - d.getDay()) % 7;
  return addDays(d, offset);
}

/**
 * The USA-transferred Epiphany Sunday and its knock-on Baptism-of-the-Lord
 * date for the Christmas season following `christmasDay`, shared by the
 * Mass Sunday resolver and the Divine Office psalter-week resolver below
 * so both always agree on where Ordinary Time actually begins.
 */
function christmasSeasonAnchors(christmasDay) {
  const epiphanyYear = christmasDay.getFullYear() + 1;
  const epiphanySunday = sundayOnOrAfter(new Date(epiphanyYear, 0, 2));
  // If Epiphany itself falls on Jan 7 or 8, the Baptism of the Lord is
  // celebrated the following Monday (not a Sunday) - Ordinary Time's
  // first full week then starts that Monday, and the next Sunday is
  // already the 2nd Sunday in Ordinary Time.
  const baptismOnMonday = epiphanySunday.getDate() >= 7;
  const baptismSunday = baptismOnMonday ? null : addDays(epiphanySunday, 7);
  const baptismDate = baptismOnMonday ? addDays(epiphanySunday, 1) : baptismSunday;
  const firstOrdinarySunday = addDays(epiphanySunday, baptismOnMonday ? 7 : 14);
  return { epiphanySunday, baptismOnMonday, baptismSunday, baptismDate, firstOrdinarySunday };
}

/**
 * Resolves `date` to a Catholic Sunday Mass Lectionary key (e.g.
 * "advent1", "ordinary23", "christ_the_king") plus the A/B/C Sunday
 * cycle, with title null if `date` isn't a Sunday or falls in one of the
 * known gaps above.
 */
function fixedFeastKeyForDate(d) {
  for (const [key, { month, day }] of Object.entries(catholicFixedFeastDates)) {
    if (d.getMonth() + 1 === month && d.getDate() === day) return key;
  }
  return null;
}

export function catholicSundayTitleFor(date) {
  if (!isValidDate(date)) return { sundayYear: null, key: null };
  const d = dateOnly(date);
  if (d.getDay() !== 0) return { sundayYear: null, key: null };
  const { advent1, advent1Next, easter, sundayYear } = churchYearContext(d);
  const christmasYear = advent1.getFullYear();
  const christmasDay = new Date(christmasYear, 11, 25);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const corpusChristi = addDays(trinity, 7);

  let key = null;
  let ordinaryNumber = null; // the underlying 1-34 week number even on a
  // Sunday whose Mass reading is displaced by a fixed Solemnity/Feast -
  // per the Lectionary's own rule, that week's weekdays still use this
  // number's readings even though the Sunday itself doesn't.

  if (d >= advent1 && d < christmasDay) {
    const n = Math.floor(daysBetween(advent1, d) / 7) + 1;
    key = `advent${Math.min(Math.max(n, 1), 4)}`;
  } else if (d.getTime() === christmasDay.getTime()) {
    key = "christmas_day";
  } else if (d < ashWednesday) {
    // Christmas -> Epiphany -> Baptism -> Ordinary Time resumes, all
    // reckoned against the USA's transferred Epiphany (Sunday between
    // Jan 2-8) and its knock-on effect on the Baptism of the Lord.
    const { epiphanySunday, baptismSunday, firstOrdinarySunday } = christmasSeasonAnchors(christmasDay);
    const holyFamilySunday = christmasDay.getDay() === 0 ? null : nextSunday(christmasDay);

    if (holyFamilySunday && d.getTime() === holyFamilySunday.getTime()) {
      key = "holy_family";
    } else if (d.getTime() === epiphanySunday.getTime()) {
      key = "epiphany";
    } else if (baptismSunday && d.getTime() === baptismSunday.getTime()) {
      key = "baptism_of_the_lord";
      ordinaryNumber = 1;
    } else if (d >= firstOrdinarySunday) {
      ordinaryNumber = 2 + Math.round(daysBetween(firstOrdinarySunday, d) / 7);
      key = fixedFeastKeyForDate(d) || `ordinary${ordinaryNumber}`;
    }
  } else if (d < easter) {
    const firstSunday = addDays(ashWednesday, 4);
    const palmSunday = addDays(easter, -7);
    if (d.getTime() === palmSunday.getTime()) {
      key = "palm_sunday";
    } else if (d >= firstSunday && d < palmSunday) {
      const n = Math.round(daysBetween(firstSunday, d) / 7) + 1;
      key = n <= 5 ? `lent${n}` : null;
    }
  } else if (d.getTime() === easter.getTime()) {
    key = "easter_sunday";
  } else if (d <= pentecost) {
    if (d.getTime() === pentecost.getTime()) {
      key = "pentecost";
    } else {
      const n = Math.round(daysBetween(easter, d) / 7) + 1;
      key = n === 7 ? "ascension" : n <= 6 ? `easter${n}` : null;
    }
  } else if (d.getTime() === trinity.getTime()) {
    key = "trinity_sunday";
    ordinaryNumber = 34 - Math.round(daysBetween(d, addDays(advent1Next, -7)) / 7);
  } else if (d.getTime() === corpusChristi.getTime()) {
    key = "corpus_christi";
    ordinaryNumber = 34 - Math.round(daysBetween(d, addDays(advent1Next, -7)) / 7);
  } else if (d > corpusChristi) {
    const christKingSunday = addDays(advent1Next, -7);
    const weeksBack = Math.round(daysBetween(d, christKingSunday) / 7);
    const properN = 34 - weeksBack;
    if (properN === 34) {
      key = "christ_the_king";
      ordinaryNumber = 34;
    } else if (properN >= 2 && properN <= 33) {
      ordinaryNumber = properN;
      key = fixedFeastKeyForDate(d) || `ordinary${properN}`;
    }
  }

  return { sundayYear, key, ordinaryNumber };
}

export function catholicSundayReadingFor(date) {
  const { sundayYear, key } = catholicSundayTitleFor(date);
  if (!key) return { sundayYear, key: null, title: null, readings: null };
  const entry = catholicSundays[key];
  if (!entry) return { sundayYear, key, title: null, readings: null };
  const readings = entry[sundayYear] || entry.ABC || null;
  return { sundayYear, key, title: entry.title, readings };
}

const WEEKDAY_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Resolves a non-Sunday `date` to its Roman Missal weekday Mass Lectionary
 * citations (First Reading, Psalm, Gospel), or null on a Sunday (use
 * catholicSundayReadingFor instead), on a fixed Solemnity/Feast (use
 * catholicSundayTitleFor's fixedFeastKeyForDate result via the Sunday
 * resolver's own data, since those days carry the same three-reading
 * Sunday-style Mass regardless of weekday), or on a handful of known
 * gaps: the Easter Triduum (Holy Thursday - Holy Saturday), the day
 * itself Jan 6 in the rare years Epiphany falls on Jan 7 or 8 (a single
 * extra day the Ordo provides for but this transcription doesn't cover),
 * and Solemnities/Feasts/Memorials of saints that carry their own proper
 * readings in place of the ferial weekday reading (not sourced here -
 * the app always falls back to the plain weekday reading on those days,
 * which is liturgically imprecise but never wrong-for-a-different-day).
 */
export function catholicWeekdayReadingFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  if (d.getDay() === 0) return null;
  const wd = WEEKDAY_SHORT[d.getDay()];

  // Solemnities/Feasts with their own fixed-date proper readings always
  // take precedence over the ferial weekday reading below, regardless of
  // which day of the week they fall on.
  const fixedKey = fixedFeastKeyForDate(d);
  if (fixedKey) {
    const { sundayYear } = churchYearContext(d);
    const entry = catholicSundays[fixedKey];
    const readings = entry && (entry[sundayYear] || entry.ABC);
    if (readings) return { season: "fixed", key: fixedKey, title: entry.title, readings };
  }

  const { advent1, easter } = churchYearContext(d);
  const christmasYear = advent1.getFullYear();
  const christmasDay = new Date(christmasYear, 11, 25);
  const ashWednesday = addDays(easter, -46);
  const lent1Sunday = addDays(ashWednesday, 4);
  const palmSunday = addDays(easter, -7);
  const easterOctaveEnd = addDays(easter, 7);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);

  let season = null;
  let key = null;

  if (d >= advent1 && d < christmasDay) {
    season = "advent";
    if (d.getMonth() === 11 && d.getDate() >= 17 && d.getDate() <= 24) {
      key = `dec${d.getDate()}`;
    } else {
      const n = Math.min(Math.floor(daysBetween(advent1, d) / 7) + 1, 3);
      key = `w${n}_${wd}`;
    }
  } else if (d > christmasDay && d <= addDays(christmasDay, 6)) {
    season = "christmas";
    key = `dec${d.getDate()}`;
  } else if (d.getTime() !== christmasDay.getTime() && d < ashWednesday) {
    const { epiphanySunday, baptismDate } = christmasSeasonAnchors(christmasDay);
    if (d.getMonth() === 0 && d.getDate() <= 5) {
      season = "christmas";
      key = `jan${d.getDate()}`;
    } else if (d > epiphanySunday && d < baptismDate) {
      season = "christmas";
      key = `epiphany_${wd}`;
    } else if (d >= baptismDate) {
      season = "ordinary";
      const { firstOrdinarySunday } = christmasSeasonAnchors(christmasDay);
      // Before the first real Sunday of Ordinary Time, this stretch is
      // always week 1 (matching the Baptism of the Lord itself) - using
      // sundayOnOrBefore() here would break in the rare years the
      // Baptism falls on a Monday, since the preceding Sunday is still
      // Epiphany, not an Ordinary Time Sunday.
      const n = d < firstOrdinarySunday ? 1 : officialOrdinaryWeekNumber(sundayOnOrBefore(d));
      if (n) key = `w${n}_${wd}`;
    }
  } else if (d >= ashWednesday && d < lent1Sunday) {
    season = "lent";
    const LABELS = { 3: "ashwed", 4: "thu_after_ashwed", 5: "fri_after_ashwed", 6: "sat_after_ashwed" };
    key = LABELS[d.getDay()] || null;
  } else if (d >= lent1Sunday && d < palmSunday) {
    season = "lent";
    const n = Math.floor(daysBetween(lent1Sunday, d) / 7) + 1;
    key = n >= 1 && n <= 5 ? `w${n}_${wd}` : null;
  } else if (d >= palmSunday && d < easter) {
    season = "lent";
    const LABELS = { 1: "holyweek_mon", 2: "holyweek_tue", 3: "holyweek_wed" };
    key = LABELS[d.getDay()] || null; // Thu/Fri/Sat of Holy Week are the Triduum - known gap
  } else if (d > easter && d <= easterOctaveEnd) {
    season = "easter";
    const LABELS = { 1: "octave_mon", 2: "octave_tue", 3: "octave_wed", 4: "octave_thu", 5: "octave_fri", 6: "octave_sat" };
    key = LABELS[d.getDay()] || null;
  } else if (d > easterOctaveEnd && d <= pentecost) {
    season = "easter";
    const n = Math.floor(daysBetween(easter, d) / 7) + 1;
    key = n >= 2 && n <= 7 ? `w${n}_${wd}` : null;
  } else if (d > pentecost && d < trinity) {
    // Ordinary Time resumes the Monday after Pentecost, a week ahead of
    // Trinity Sunday itself; these days use Trinity's own official week
    // number rather than the week of whichever Sunday precedes them
    // (there isn't one - Pentecost isn't an Ordinary Time Sunday).
    season = "ordinary";
    const n = officialOrdinaryWeekNumber(trinity);
    if (n) key = `w${n}_${wd}`;
  } else if (d > trinity) {
    season = "ordinary";
    const n = officialOrdinaryWeekNumber(sundayOnOrBefore(d));
    if (n) key = `w${n}_${wd}`;
  }

  if (!season || !key) return null;

  if (season === "ordinary") {
    // The Roman weekday cycle is odd/even by *calendar* year (unlike the
    // Sunday A/B/C cycle, which is anchored to Advent) - e.g. 2023 was
    // Sunday Cycle A and Weekday Year I, 2024 was Cycle B and Weekday
    // Year II, 2025 was Cycle C and Weekday Year I again: the two cycles
    // drift relative to each other rather than corresponding 1:1.
    const yearData = d.getFullYear() % 2 === 1 ? catholicWeekdays.ordinary1 : catholicWeekdays.ordinary2;
    const reading = yearData[key];
    const gospel = catholicWeekdays.ordinary_gospel[key];
    if (!reading || !gospel) return null;
    return { season, key, readings: [...reading, gospel] };
  }

  const entry = catholicWeekdays[season]?.[key];
  return entry ? { season, key, readings: entry } : null;
}

// ---- Office of Readings & Daytime Prayer season/day resolver ----
//
// Shares the same season-boundary dates as catholicWeekdayReadingFor
// above, but (unlike the Mass Lectionary) both these hours are prayed
// every day including Sunday, so this resolves Sundays too, with its
// own key scheme matching catholic_office_readings_biblical.json - most
// notably the Christmas season, which splits into two separate
// weekday-named blocks (the days from Jan 2 up to Epiphany Sunday, and
// the days from Epiphany Sunday up to the Baptism of the Lord) since
// unlike the Mass Lectionary's Christmas octave, this citation table
// keys those two stretches by weekday name rather than calendar date.
function catholicOfficeSeasonKeyFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const wd = WEEKDAY_SHORT[d.getDay()];

  const { advent1, easter } = churchYearContext(d);
  const christmasYear = advent1.getFullYear();
  const christmasDay = new Date(christmasYear, 11, 25);
  const ashWednesday = addDays(easter, -46);
  const lent1Sunday = addDays(ashWednesday, 4);
  const palmSunday = addDays(easter, -7);
  const easterOctaveEnd = addDays(easter, 7);
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const corpusChristi = addDays(trinity, 7);

  const fixedKey = fixedFeastKeyForDate(d);
  if (fixedKey && catholicOfficeReadingsBiblical.fixed_feasts[fixedKey]) {
    return { season: "fixed_feasts", key: fixedKey };
  }
  if (d.getTime() === trinity.getTime()) return { season: "movable_feasts", key: "trinity_sunday" };
  if (d.getTime() === corpusChristi.getTime()) return { season: "movable_feasts", key: "corpus_christi" };

  if (d >= advent1 && d < christmasDay) {
    if (d.getMonth() === 11 && d.getDate() >= 17 && d.getDate() <= 24) {
      return { season: "advent", key: `dec${d.getDate()}` };
    }
    const n = Math.min(Math.floor(daysBetween(advent1, d) / 7) + 1, 3);
    return { season: "advent", key: `w${n}_${wd}` };
  }
  if (d.getTime() === christmasDay.getTime()) return { season: "christmas", key: "dec25" };
  if (d > christmasDay && d <= addDays(christmasDay, 6)) {
    const holyFamilySunday = christmasDay.getDay() === 0 ? null : nextSunday(christmasDay);
    if (holyFamilySunday && d.getTime() === holyFamilySunday.getTime()) return { season: "christmas", key: "holy_family" };
    return { season: "christmas", key: `dec${d.getDate()}` };
  }
  if (d < ashWednesday) {
    const { epiphanySunday, baptismDate } = christmasSeasonAnchors(christmasDay);
    if (d.getTime() === new Date(christmasYear + 1, 0, 1).getTime()) return { season: "christmas", key: "jan1" };
    if (d < epiphanySunday) return { season: "christmas", key: `jan2_${wd}` };
    if (d.getTime() === epiphanySunday.getTime()) return { season: "christmas", key: "epiphany" };
    if (d < baptismDate) return { season: "christmas", key: `post_epiphany_${wd}` };
    if (d.getTime() === baptismDate.getTime() && d.getDay() === 0) return { season: "christmas", key: "baptism_of_the_lord" };
    const { firstOrdinarySunday } = christmasSeasonAnchors(christmasDay);
    const n = d < firstOrdinarySunday ? 1 : officialOrdinaryWeekNumber(sundayOnOrBefore(d));
    return n ? { season: "ordinary", key: `w${n}_${wd}` } : null;
  }
  if (d >= ashWednesday && d < lent1Sunday) {
    const LABELS = { 3: "ashwed", 4: "thu_after_ashwed", 5: "fri_after_ashwed", 6: "sat_after_ashwed" };
    const key = LABELS[d.getDay()];
    return key ? { season: "lent", key } : null;
  }
  if (d >= lent1Sunday && d < palmSunday) {
    const n = Math.floor(daysBetween(lent1Sunday, d) / 7) + 1;
    return n >= 1 && n <= 5 ? { season: "lent", key: `w${n}_${wd}` } : null;
  }
  if (d.getTime() === palmSunday.getTime()) return { season: "lent", key: "palm_sunday" };
  if (d > palmSunday && d < easter) {
    const LABELS = { 1: "holyweek_mon", 2: "holyweek_tue", 3: "holyweek_wed" };
    const key = LABELS[d.getDay()];
    return key ? { season: "lent", key } : null; // Triduum - known gap
  }
  if (d.getTime() === easter.getTime()) return { season: "easter", key: "easter_sunday" };
  if (d.getTime() === easterOctaveEnd.getTime()) return { season: "easter", key: "w2_sun" };
  if (d > easter && d < easterOctaveEnd) {
    const LABELS = { 1: "octave_mon", 2: "octave_tue", 3: "octave_wed", 4: "octave_thu", 5: "octave_fri", 6: "octave_sat" };
    const key = LABELS[d.getDay()];
    return key ? { season: "easter", key } : null;
  }
  if (d.getTime() === pentecost.getTime()) return { season: "easter", key: "pentecost" };
  if (d > easterOctaveEnd && d < pentecost) {
    const n = Math.floor(daysBetween(easter, d) / 7) + 1;
    if (n === 7) return { season: "easter", key: "ascension" };
    return n >= 2 && n <= 6 ? { season: "easter", key: `w${n}_${wd}` } : null;
  }
  if (d > pentecost && d < trinity) {
    const n = officialOrdinaryWeekNumber(trinity);
    return n ? { season: "ordinary", key: `w${n}_${wd}` } : null;
  }
  if (d > trinity && d < corpusChristi) {
    const n = officialOrdinaryWeekNumber(corpusChristi);
    return n ? { season: "ordinary", key: `w${n}_${wd}` } : null;
  }
  if (d > corpusChristi) {
    const n = officialOrdinaryWeekNumber(sundayOnOrBefore(d));
    return n ? { season: "ordinary", key: `w${n}_${wd}` } : null;
  }
  return null;
}

/**
 * The Office of Readings' Scripture portion for `date`: three Psalms
 * (from the 4-week Psalter) plus the real biblical First Reading
 * citation, every day of the year including Sundays. Does not include
 * the patristic/magisterial Second Reading, which is ICEL's own
 * specific translated excerpting - a separate, more complex copyright
 * question left as an honest gap rather than guessed at.
 */
export function catholicOfficeOfReadingsFor(date) {
  const psalterInfo = catholicPsalterWeekFor(date);
  const seasonKey = catholicOfficeSeasonKeyFor(date);
  if (!seasonKey) return null;
  const reading = catholicOfficeReadingsBiblical[seasonKey.season]?.[seasonKey.key];
  if (!reading) return null;
  const d = dateOnly(date);
  const wd = WEEKDAY_FULL[d.getDay()];
  let psalms = null;
  if (psalterInfo && !psalterInfo.gap) {
    psalms = catholicOfficePsalter.office_of_readings[String(psalterInfo.week)]?.[wd] || null;
  }
  return { reading, psalms, week: psalterInfo?.gap ? null : psalterInfo?.week, weekday: wd };
}

/**
 * Daytime Prayer's three Psalms for `date` (from the 4-week Psalter),
 * every day of the year including Sundays. The very brief reading this
 * hour also carries isn't sourced (same gap as Lauds/Vespers' Brief
 * Reading), so only the psalmody is real here.
 */
export function catholicDaytimePrayerFor(date) {
  const psalterInfo = catholicPsalterWeekFor(date);
  if (!psalterInfo || psalterInfo.gap) return null;
  const psalms = catholicOfficePsalter.daytime_prayer[String(psalterInfo.week)]?.[psalterInfo.weekday];
  return psalms ? { week: psalterInfo.week, weekday: psalterInfo.weekday, psalms } : null;
}

// ---- Catholic Divine Office (Liturgy of the Hours): Morning Prayer
// (Lauds), Evening Prayer (Vespers), Night Prayer (Compline) ----
//
// Psalm/canticle citations transcribed from catholic-resources.org's
// Four-Week Psalter tables, compiled by Fr. Felix Just, S.J. (same
// non-commercial-with-attribution source and license already used for
// the Sunday Mass Lectionary above). The actual Psalm text is drawn from
// the WEB Catholic edition already bundled in the app; the Benedictus,
// Magnificat, and Nunc Dimittis reuse the canticle text already built
// for the Anglican Daily Office.
//
// KNOWN GAP: this does not yet include the "Brief Reading" each hour
// carries after its psalmody (a separate citation set not yet sourced),
// or the Office of Readings/Daytime Prayer hours - only Morning, Evening,
// and Night Prayer are covered.
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The official 1-34 Ordinary Time week number for `sundayDate` (which
 * must actually be a Sunday), reusing the Mass Sunday resolver above so
 * the two stay in sync; null if that Sunday isn't an Ordinary Time one
 * (e.g. it's Christmas, Lent, or Easter, or itself a known Mass gap). */
function officialOrdinaryWeekNumber(sundayDate) {
  const { key, ordinaryNumber } = catholicSundayTitleFor(sundayDate);
  if (ordinaryNumber) return ordinaryNumber; // covers ordinaryN and any Sunday displaced by a fixed feast
  if (key === "christ_the_king") return 34;
  return null;
}

/**
 * Resolves `date` to a Divine Office psalter week (1-4) and weekday
 * label, following GILH 133: the four-week cycle restarts at Week 1 on
 * the First Sunday of Advent, the First Sunday of Ordinary Time (the
 * Baptism of the Lord), the First Sunday of Lent, and Easter Sunday;
 * when Ordinary Time resumes after Pentecost it continues the same
 * numbering it had reached before Lent interrupted it, reusing the
 * official 1-34 Ordinary Time week number already computed for the Mass
 * Lectionary (((n-1) % 4) + 1) rather than counting afresh.
 *
 * KNOWN GAPS (`gap: true`, `week: null`): the Christmas Octave (Dec 25 -
 * Jan 1) and Easter Octave (Easter Sunday - the following Saturday) use
 * their own proper psalms rather than this rotating table, which isn't
 * transcribed here; Ash Wednesday through the following Saturday
 * similarly has its own proper texts before the rotation resumes on the
 * First Sunday of Lent.
 *
 * SIMPLIFICATION: Christmastide after the Octave (Jan 2 through the eve
 * of the Baptism of the Lord) is assumed to resume at Week 2 and count
 * onward day by day - a common convention among parish guides, but not
 * verified against an official published Ordo for every possible
 * calendar alignment.
 */
export function catholicPsalterWeekFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const { advent1, easter } = churchYearContext(d);
  const christmasYear = advent1.getFullYear();
  const christmasDay = new Date(christmasYear, 11, 25);
  const christmasOctaveEnd = addDays(christmasDay, 7); // Jan 1
  const ashWednesday = addDays(easter, -46);
  const lent1Sunday = addDays(ashWednesday, 4);
  const easterOctaveEnd = addDays(easter, 7); // Divine Mercy Sunday
  const pentecost = addDays(easter, 49);
  const trinity = addDays(pentecost, 7);
  const weekday = WEEKDAY_FULL[d.getDay()];

  function weekFrom(anchor) {
    const n = 1 + Math.floor(daysBetween(anchor, d) / 7);
    return ((n - 1) % 4) + 1;
  }

  if (d >= advent1 && d < christmasDay) return { week: weekFrom(advent1), weekday, gap: false };
  if (d >= christmasDay && d <= christmasOctaveEnd) return { week: null, weekday, gap: true };

  if (d < ashWednesday) {
    const { baptismDate, firstOrdinarySunday } = christmasSeasonAnchors(christmasDay);
    if (d < baptismDate) {
      const anchor = addDays(christmasOctaveEnd, 1);
      const n = 2 + Math.floor(daysBetween(anchor, d) / 7);
      return { week: ((n - 1) % 4) + 1, weekday, gap: false };
    }
    // Ordinary Time's first block. Before the first real Sunday, this
    // stretch is always week 1 (matching the Baptism of the Lord itself)
    // - using sundayOnOrBefore() here would break in the rare years the
    // Baptism falls on a Monday, since the preceding Sunday is still
    // Epiphany, not an Ordinary Time Sunday.
    const n = d < firstOrdinarySunday ? 1 : officialOrdinaryWeekNumber(sundayOnOrBefore(d));
    return n ? { week: ((n - 1) % 4) + 1, weekday, gap: false } : { week: null, weekday, gap: true };
  }

  if (d < lent1Sunday) return { week: null, weekday, gap: true }; // Ash Wednesday's own short week
  if (d < easter) return { week: weekFrom(lent1Sunday), weekday, gap: false };
  if (d <= easterOctaveEnd) return { week: null, weekday, gap: true };
  if (d < trinity) return { week: weekFrom(easter), weekday, gap: false };

  // Ordinary Time resumed after Pentecost - reuse the official 1-34 week
  // number from the Mass Sunday Lectionary above.
  const n = officialOrdinaryWeekNumber(sundayOnOrBefore(d));
  return n ? { week: ((n - 1) % 4) + 1, weekday, gap: false } : { week: null, weekday, gap: true };
}

/** Morning Prayer (Lauds) citations for `date`: [Psalm, OT Canticle,
 * Psalm], or null on a known psalter gap. */
export function catholicLaudsFor(date) {
  const info = catholicPsalterWeekFor(date);
  if (!info || info.gap) return null;
  const entry = catholicOfficePsalter.lauds[String(info.week)]?.[info.weekday];
  return entry ? { week: info.week, weekday: info.weekday, readings: entry } : null;
}

/** Evening Prayer (Vespers) citations for `date`: [Psalm, Psalm, NT
 * Canticle], or null on a known psalter gap. Saturday evening is always
 * Evening Prayer I of the *following* Sunday (which may fall in the next
 * psalter week), never a Saturday entry of its own. */
export function catholicVespersFor(date) {
  const d = dateOnly(date);
  if (d.getDay() === 6) {
    const info = catholicPsalterWeekFor(addDays(d, 1));
    if (!info || info.gap) return null;
    const entry = catholicOfficePsalter.vespers[String(info.week)]?.SundayI;
    return entry ? { week: info.week, weekday: "SundayI", readings: entry } : null;
  }
  const info = catholicPsalterWeekFor(d);
  if (!info || info.gap) return null;
  const label = info.weekday === "Sunday" ? "SundayII" : info.weekday;
  const entry = catholicOfficePsalter.vespers[String(info.week)]?.[label];
  return entry ? { week: info.week, weekday: label, readings: entry } : null;
}

/** Night Prayer (Compline) psalm(s) and brief reading for `date` - a
 * fixed one-week cycle, unlike Lauds/Vespers, so it has no seasonal gaps
 * of its own. Saturday's entry (used after Evening Prayer I) and
 * Sunday's (after Evening Prayer II) are both always available. */
export function catholicComplineFor(date) {
  const d = dateOnly(date);
  const weekday = WEEKDAY_FULL[d.getDay()];
  const entry = catholicOfficePsalter.compline[weekday];
  return entry ? { weekday, psalms: entry.psalms, reading: entry.reading } : null;
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

// ---- Common Worship Sunday Office (Second/Third Service) readings ----

import cwSundayOffice from "../data/cw_sunday_office.json";

/**
 * Common Worship's Second Service (Evening Prayer) or Third Service
 * (Morning Prayer) readings for `date`, if it's a Sunday CW has data for.
 * Unlike Table 2 (the weekday Daily Office lectionary), Sunday Morning/
 * Evening Prayer uses a completely separate CW lectionary keyed by the
 * same Sunday titles as the Principal Service (see sundayTitleFor) -
 * Second Service = Evening Prayer, Third Service = Morning Prayer, per
 * CW's Lectionary Rule 8. Returns null if `date` isn't a Sunday, or if
 * that Sunday's title isn't in the transcribed data.
 */
export function secondThirdServiceFor(date, service) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  if (d.getDay() !== 0) return null;
  const { sundayYear, title } = sundayTitleFor(d);
  if (!title) return null;
  const yearData = cwSundayOffice[sundayYear];
  if (!yearData || !yearData[title]) return null;
  const entry = yearData[title][service === "am" ? "third" : "second"];
  if (!entry) return null;
  return { title, ot: entry.ot, nt: entry.nt, psalm: entry.psalm };
}

// ---- 1662 BCP Sunday First Lessons ----

import bcpSundayFirstLessons from "../data/bcp_sunday_first_lessons.json";

/**
 * The 1662 BCP's Sunday First Lesson (Old Testament) for `date`, from the
 * 1922 Revised Table of Lessons - the table actually used in living BCP
 * practice for the last century, rather than the original 1561/1662
 * table (long superseded, and only available today via a copyrighted
 * modern reprint). Only the First Lesson is Sunday-specific in the BCP
 * system; the Second (New Testament) Lesson on Sundays is just whatever
 * the ordinary continuous weekday reading happens to be that day, so
 * this deliberately doesn't attempt to replace that - see KNOWN GAPS.
 *
 * Reuses collect1662Label so this always agrees with the Collect of the
 * Day on which Sunday governs `date`, including its fixed-feast-first
 * priority (this returns null on a Sunday that coincides with a fixed
 * feast day, since those aren't covered by this table).
 */
export function bcpSundayFirstLessonFor(date, service) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  if (d.getDay() !== 0) return null;
  const label = collect1662Label(d);
  if (!label) return null;
  const entry = bcpSundayFirstLessons[label];
  if (!entry) return null;
  const ot = service === "am" ? entry.am : entry.pm;
  if (!ot) return null;
  return { title: label, ot };
}

// ---- Common Worship Eucharist: fixed Principal Feasts/Holy Days ----

import eucharistFixedFeasts from "../data/eucharist_fixed_feasts.json";

/**
 * The Principal Service Eucharist readings for `date` if it's one of the
 * fixed Principal Feasts/Holy Days that fall outside the ordinary weekday
 * cycle (Christmas Day and the three days after it, Naming and
 * Circumcision, the Epiphany, the weekdays of Holy Week, Ascension Day) -
 * eucharistReadingFor's underlying weekday table (Table 6/DEL) has no
 * entries for these dates at all, by design, since they're covered by
 * their own separate propers. Same readings across all three lectionary
 * years for every date here. Checked by month/day for fixed-calendar
 * dates, by offset from Easter for movable ones.
 */
export function fixedFeastEucharistFor(date) {
  if (!isValidDate(date)) return null;
  const d = dateOnly(date);
  const { easter } = churchYearContext(d);
  const month = d.getMonth();
  const day = d.getDate();

  let key = null;
  if (month === 11 && day === 25) key = "christmas_day";
  else if (month === 11 && day === 26) key = "stephen";
  else if (month === 11 && day === 27) key = "john";
  else if (month === 11 && day === 28) key = "holy_innocents";
  else if (month === 0 && day === 1) key = "naming_circumcision";
  else if (month === 0 && day === 6) key = "epiphany";
  else if (Math.round(daysBetween(easter, d)) === -46) key = "ash_wednesday";
  else {
    const offset = Math.round(daysBetween(easter, d));
    const HOLY_WEEK_OFFSETS = { "-6": "monday_holy_week", "-5": "tuesday_holy_week", "-4": "wednesday_holy_week", "-3": "maundy_thursday", "-2": "good_friday", "-1": "easter_eve" };
    if (offset === 39) key = "ascension_day";
    else if (String(offset) in HOLY_WEEK_OFFSETS) key = HOLY_WEEK_OFFSETS[String(offset)];
  }

  if (!key) return null;
  const entry = eucharistFixedFeasts[key];
  if (!entry) return null;
  return { key, ot: entry.ot, psalm: entry.psalm, nt: entry.nt, gospel: entry.gospel };
}

// ---- Common Worship Post Communion prayers ----

import postCommunionsCW from "../data/post_communions_cw_raw.json";

/**
 * The Common Worship Post Communion prayer for `date`, reusing
 * collectCWLabel so this always agrees with whichever Collect of the Day
 * governs `date`. Returns null on Good Friday and Easter Eve, which
 * genuinely have no Post Communion in Common Worship (no Communion is
 * celebrated those two days), and on any date collectCWLabel doesn't
 * resolve to a transcribed entry.
 */
export function postCommunionCWFor(date) {
  const label = collectCWLabel(date);
  if (!label) return null;
  const text = postCommunionsCW[label];
  if (!text) return null;
  return { label, text };
}

// ---- Orthodox (Byzantine) Sunday Epistle/Gospel Lectionary ----
//
// Resolves a Sunday to its Epistle/Gospel citations via the Byzantine
// Paschal-distance (pdist) system: every reading is keyed to a fixed
// offset in days from Pascha (Julian Paschalion), except for a run of
// weeks each autumn where the continuous read-through of Luke's Gospel
// gets interrupted by the fixed Nativity/Theophany feasts (the "Lukan
// jump") and has to either skip ahead or, in Slavic practice, resume from
// Sunday Gospels saved earlier in the year ("reserves", replayed on the
// Sundays between Theophany and the Triodion -- Greek practice has no
// equivalent mechanism and simply continues the numbered sequence).
//
// Citation data (transcribed facts, not the reading text itself) and this
// pdist algorithm are adapted from orthocal-python (Brian Glass, building
// on Paul Kachur's original algorithm), MIT licensed:
// https://github.com/brianglass/orthocal-python -- its Reading/Pericope
// fixture data is tagged "common" (shared Byzantine base) and "slavic"
// (OCA/ROCOR-specific overrides); only the Slavic-tradition path is wired
// here for now. Passage text itself comes from our own bundled WEB data,
// same as every other tradition in the app.

function mod7(n) {
  return ((n % 7) + 7) % 7;
}

/** Given a Pascha-distance, the Pascha-distances of the Saturday/Sunday
 * immediately before and after it (itself included if it's already that
 * weekday). Mirrors orthocal's datetools.surrounding_weekends exactly. */
function surroundingWeekends(distance) {
  const weekday = mod7(distance);
  return {
    satBefore: distance - weekday - 1,
    sunBefore: distance - 7 + mod7(7 - weekday),
    satAfter: distance + 7 - mod7(weekday + 1),
    sunAfter: distance + 7 - weekday,
  };
}

function orthodoxFixedDate(calendarStyle, year, month, day) {
  return calendarStyle === "Julian" ? julianFixedDateInGregorian(year, month, day) : new Date(year, month - 1, day);
}

/**
 * Computes the shared Byzantine-year context (Pascha anchor, Lukan jump,
 * Nativity/Theophany-adjacent pdists, Slavic reserve Sundays) that both
 * the Sunday and weekday reading resolvers need. See
 * orthodoxSundayReadingFor's docstring for the year-anchoring logic.
 */
function orthodoxYearContext(date, calendarStyle) {
  const d = dateOnly(date);
  let year = d.getFullYear();
  let pascha = orthodoxPascha(year);
  let pdist = daysBetween(pascha, d);
  if (pdist < -77) {
    year -= 1;
    pascha = orthodoxPascha(year);
    pdist = daysBetween(pascha, d);
  }
  const nextPascha = orthodoxPascha(year + 1);

  const elevationPdist = daysBetween(pascha, orthodoxFixedDate(calendarStyle, year, 9, 14));
  const { sunAfter: sunAfterElevation } = surroundingWeekends(elevationPdist);

  const theophanyPdist = daysBetween(pascha, orthodoxFixedDate(calendarStyle, year + 1, 1, 6));
  const {
    satBefore: satBeforeTheophany,
    sunBefore: sunBeforeTheophany,
    satAfter: satAfterTheophany,
    sunAfter: sunAfterTheophany,
  } = surroundingWeekends(theophanyPdist);

  const nativityPdist = daysBetween(pascha, orthodoxFixedDate(calendarStyle, year, 12, 25));
  const nativityWeekday = mod7(nativityPdist);
  const forefathers = nativityPdist - 14 + mod7(7 - nativityWeekday);
  const { sunBefore: sunBeforeNativity, sunAfter: sunAfterNativity } = surroundingWeekends(nativityPdist);

  const annunciationPdist = daysBetween(pascha, orthodoxFixedDate(calendarStyle, year, 3, 25));

  const lukanJump = 49 + 1 + 7 * 17 - (sunAfterElevation + 1);
  const firstSunLuke = sunAfterElevation + 7;
  const lukanJumpThreshold = sunAfterElevation;

  const nextPaschaPdist = daysBetween(pascha, nextPascha);
  const sunBeforeZaccheus = nextPaschaPdist - 12 * 7;
  const extraSundays = Math.floor((sunBeforeZaccheus - sunAfterTheophany) / 7);

  // Slavic "reserves": Sunday Gospels displaced by the Lukan jump and by
  // the Nativity/Theophany festal cycle, saved and re-read on the Sundays
  // between Theophany and the Triodion.
  const reserves = [];
  const firstLuke18 = 49 + 7 * 18;
  const thirteenthLuke = firstLuke18 + 7 * 13;
  if (extraSundays) {
    const forefathersJump = forefathers + lukanJump + 7;
    for (let p = forefathersJump; p <= thirteenthLuke; p += 7) reserves.push(p);
    const remainder = extraSundays - reserves.length;
    if (remainder > 0) {
      const start = firstLuke18 - remainder * 7;
      const end = firstLuke18 - 6;
      for (let p = start; p < end; p += 7) reserves.push(p);
    }
  }

  // Days on which even the ordinary daily-cycle readings are suppressed
  // entirely, in favor of a Great Feast's own readings taking over. Doesn't
  // include the Sunday entries (sunBeforeTheophany etc.) since those never
  // collide with weekday resolution in the first place.
  const noDaily = new Set([
    theophanyPdist - 5,
    theophanyPdist - 1,
    theophanyPdist,
    nativityPdist - 1,
    nativityPdist,
    nativityPdist + 1,
  ]);
  if (satAfterTheophany === theophanyPdist + 1) noDaily.add(satAfterTheophany);
  if (mod7(annunciationPdist) === 6) noDaily.add(annunciationPdist); // Saturday

  return {
    d,
    pascha,
    nextPascha,
    pdist,
    sunAfterElevation,
    satBeforeTheophany,
    sunBeforeTheophany,
    sunAfterTheophany,
    forefathers,
    sunBeforeNativity,
    sunAfterNativity,
    lukanJump,
    firstSunLuke,
    lukanJumpThreshold,
    extraSundays,
    reserves,
    noDaily,
  };
}

function lookupReading(gospelPdist, epistlePdist) {
  const gospelEntry = orthodoxSundayReadings[String(gospelPdist)]?.Gospel;
  const epistleEntry = orthodoxSundayReadings[String(epistlePdist)]?.Epistle;
  const gospel = gospelEntry?.slavic || gospelEntry?.common;
  const epistle = epistleEntry?.slavic || epistleEntry?.common;
  if (!gospel || !epistle) return null;
  return { epistle, gospel };
}

/**
 * The Slavic-tradition Sunday Epistle/Gospel citations for `date`, or
 * null if `date` isn't a Sunday or falls outside the transcribed range
 * (the underlying table only covers the Sunday cycle; fixed-feast
 * readings aren't wired yet -- an honest gap, not a guess).
 * `calendarStyle` is "Gregorian" (New Calendar) or "Julian" (Old
 * Calendar) -- it only affects which real-world date each Sunday lands
 * on, not the pdist math itself (Pascha and everything measured from it
 * already uses the same Julian Paschalion either way).
 */
export function orthodoxSundayReadingFor(date, calendarStyle = "Gregorian") {
  const ctx = orthodoxYearContext(date, calendarStyle);
  if (ctx.d.getDay() !== 0) return null;
  const { pdist, nextPascha, d } = ctx;

  let gospelPdist;
  const reserveIndex = Math.floor((pdist - ctx.sunAfterTheophany) / 7) - 1;
  if (pdist === ctx.firstSunLuke + 10 * 7) {
    gospelPdist = ctx.forefathers + ctx.lukanJump;
  } else if (pdist > ctx.sunAfterTheophany && ctx.extraSundays > 1 && reserveIndex >= 0 && reserveIndex < ctx.reserves.length) {
    gospelPdist = ctx.reserves[reserveIndex];
  } else if (pdist > ctx.satBeforeTheophany) {
    gospelPdist = daysBetween(nextPascha, d);
  } else if (pdist > ctx.lukanJumpThreshold) {
    gospelPdist = pdist + ctx.lukanJump;
  } else {
    gospelPdist = pdist;
  }

  let epistlePdist;
  if (pdist === 49 + 29 * 7) {
    epistlePdist = ctx.forefathers;
  } else if (pdist >= 49 + 32 * 7) {
    epistlePdist = daysBetween(nextPascha, d);
  } else {
    epistlePdist = pdist;
  }

  const result = lookupReading(gospelPdist, epistlePdist);
  return result ? { ...result, pdist } : null;
}

/**
 * The Slavic-tradition weekday Epistle/Gospel citations for `date`, or
 * null if `date` is a Sunday, falls on a day where the daily-cycle
 * readings are suppressed by a Great Feast (Theophany/Nativity eve and
 * feast day, a Saturday Annunciation, etc. -- see orthodoxYearContext's
 * noDaily set), or falls outside the transcribed range. Great Lent
 * weekdays are also an honest gap here: there's no Epistle/Gospel at
 * Divine Liturgy on an ordinary Lenten weekday in Byzantine practice (the
 * Presanctified Liturgy uses Old Testament readings instead, not wired
 * up yet), so the underlying table has no entries there by design.
 */
export function orthodoxWeekdayReadingFor(date, calendarStyle = "Gregorian") {
  const ctx = orthodoxYearContext(date, calendarStyle);
  if (ctx.d.getDay() === 0) return null;
  const { pdist, nextPascha, d } = ctx;
  if (ctx.noDaily.has(pdist)) return null;

  const gospelPdist = pdist > ctx.satBeforeTheophany ? daysBetween(nextPascha, d) : pdist > ctx.lukanJumpThreshold ? pdist + ctx.lukanJump : pdist;
  const epistlePdist = pdist >= 49 + 32 * 7 ? daysBetween(nextPascha, d) : pdist;

  const result = lookupReading(gospelPdist, epistlePdist);
  return result ? { ...result, pdist } : null;
}
