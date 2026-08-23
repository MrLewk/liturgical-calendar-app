// TABLE 1 — THE LECTIONARY YEARS (Common Worship Weekday Lectionary, 2005 +
// Weekday Lectionary Tables, Advent 2020–2045).
//
// Keyed by the calendar year in which each Church Year's Advent Sunday
// falls (e.g. "2025" = the Church Year running Advent 2025 -> Advent 2026,
// which contains today, Aug 2026, since that's still within it... no —
// contains everything from Advent Sunday 2025 up to the eve of Advent
// Sunday 2026).
//
// sundayYear: A / B / C — the Principal Service (RCL-based) Sunday cycle.
// delYear: 1 / 2 — the Daily Eucharistic Lectionary (Table 6) year.
//
// The whole pattern repeats on a 6-year cycle (lcm of the 3-year Sunday
// cycle and the 2-year DEL cycle), confirmed by the source tables agreeing
// exactly across the 2005–2045 span they each cover. Beyond 2045 the same
// 6-year cycle is projected forward.
const EXPLICIT = {
  2005: { sundayYear: "B", delYear: 2 },
  2006: { sundayYear: "C", delYear: 1 },
  2007: { sundayYear: "A", delYear: 2 },
  2008: { sundayYear: "B", delYear: 1 },
  2009: { sundayYear: "C", delYear: 2 },
  2010: { sundayYear: "A", delYear: 1 },
  2011: { sundayYear: "B", delYear: 2 },
  2012: { sundayYear: "C", delYear: 1 },
  2013: { sundayYear: "A", delYear: 2 },
  2014: { sundayYear: "B", delYear: 1 },
  2015: { sundayYear: "C", delYear: 2 },
  2016: { sundayYear: "A", delYear: 1 },
  2017: { sundayYear: "B", delYear: 2 },
  2018: { sundayYear: "C", delYear: 1 },
  2019: { sundayYear: "A", delYear: 2 },
  2020: { sundayYear: "B", delYear: 1 },
  2021: { sundayYear: "C", delYear: 2 },
  2022: { sundayYear: "A", delYear: 1 },
  2023: { sundayYear: "B", delYear: 2 },
  2024: { sundayYear: "C", delYear: 1 },
  2025: { sundayYear: "A", delYear: 2 },
  2026: { sundayYear: "B", delYear: 1 },
  2027: { sundayYear: "C", delYear: 2 },
  2028: { sundayYear: "A", delYear: 1 },
  2029: { sundayYear: "B", delYear: 2 },
  2030: { sundayYear: "C", delYear: 1 },
  2031: { sundayYear: "A", delYear: 2 },
  2032: { sundayYear: "B", delYear: 1 },
  2033: { sundayYear: "C", delYear: 2 },
  2034: { sundayYear: "A", delYear: 1 },
  2035: { sundayYear: "B", delYear: 2 },
  2036: { sundayYear: "C", delYear: 1 },
  2037: { sundayYear: "A", delYear: 2 },
  2038: { sundayYear: "B", delYear: 1 },
  2039: { sundayYear: "C", delYear: 2 },
  2040: { sundayYear: "A", delYear: 1 },
  2041: { sundayYear: "B", delYear: 2 },
  2042: { sundayYear: "C", delYear: 1 },
  2043: { sundayYear: "A", delYear: 2 },
  2044: { sundayYear: "B", delYear: 1 },
};

import table1Full from "./table1_full.json";

/**
 * The Office (Morning/Evening Prayer) column set to use for the Church
 * Year beginning with Advent Sunday of `adventCalendarYear`: which of
 * OT1/OT2a/OT2b (paired with NT1 or NT2) applies for Morning vs Evening
 * Prayer, split further by whether the date falls in "Seasonal Time"
 * (Advent, Christmas, Epiphany's early weeks, Lent, Easter) or "Ordinary
 * Time" (the rest) - Table 1's own split, independent of DEL-week
 * numbering. Follows a 12-year cycle (verified exactly against the
 * source tables for 2005-2044), longer than the 6-year Sunday/DEL cycle
 * because it additionally alternates OT2a vs OT2b in some years.
 */
export function officeColumnsFor(adventCalendarYear) {
  const row = table1Full[String(adventCalendarYear)];
  if (row) return row;
  const CYCLE = 12;
  const years = Object.keys(table1Full).map(Number).sort((a, b) => a - b);
  const anchor = years[0];
  const offset = (((adventCalendarYear - anchor) % CYCLE) + CYCLE) % CYCLE;
  return table1Full[String(anchor + offset)] || null;
}

const CYCLE_YEARS = Object.keys(EXPLICIT).map(Number).sort((a, b) => a - b);
const CYCLE_LENGTH = 6;

/**
 * The Sunday-lectionary year (A/B/C) and DEL year (1/2) for the Church Year
 * that begins with Advent Sunday of `adventCalendarYear` (e.g. pass 2025 for
 * the Church Year Advent 2025 -> Advent 2026).
 */
export function lectionaryYearsFor(adventCalendarYear) {
  if (!Number.isFinite(adventCalendarYear)) return { sundayYear: null, delYear: null };
  if (EXPLICIT[adventCalendarYear]) return EXPLICIT[adventCalendarYear];
  // Project the 6-year cycle forward/backward from the known table.
  const anchor = CYCLE_YEARS[0];
  const offset = (((adventCalendarYear - anchor) % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  const anchorYear = anchor + offset;
  return EXPLICIT[anchorYear];
}
