import { addDays, adventSunday, julianFixedDateInGregorian, westernEaster, orthodoxPascha, dateOnly } from "./dates";

// Liturgical colors, matching the palette already used elsewhere in the app.
export const COLOR = {
  purple: "#5B3B8C",
  white: "#EDE7DC",
  gold: "#C9A227",
  red: "#A32638",
  green: "#3F6B4F",
  rose: "#C97BA0",
};

// ---------------------------------------------------------------------
// WESTERN (Catholic + Anglican share the Gregorian Paschalion; naming and
// a handful of feast choices differ, so each has its own feast list, but
// both are built from the same season anchors).
// ---------------------------------------------------------------------

/**
 * Season blocks for the Western liturgical year that CONTAINS `today`.
 * Returns an ordered array of { key, name, color, start, end } — `end` is
 * inclusive. `labelSet` is "Catholic" or "Anglican" (affects season names
 * only, not the underlying dates).
 */
export function westernSeasons(today, labelSet = "Catholic") {
  const thisYearAdvent = adventSunday(today.getFullYear());
  // If today is on/after this calendar year's Advent Sunday, the current
  // liturgical year began THIS year and runs into next year. Otherwise it
  // began last calendar year.
  const startYear = dateOnly(today) >= dateOnly(thisYearAdvent) ? today.getFullYear() : today.getFullYear() - 1;

  const advent1 = adventSunday(startYear);
  const advent1Next = adventSunday(startYear + 1);
  const christmas = new Date(startYear, 11, 25);
  const nextYear = startYear + 1;
  const epiphanySeasonStart = new Date(nextYear, 0, 6); // Jan 6
  const easter = westernEaster(nextYear);
  const ashWednesday = addDays(easter, -46);
  const holyThursday = addDays(easter, -3);
  const pentecost = addDays(easter, 49);

  const seasons = [
    { key: "advent", name: "Advent", latin: "Adventus", color: COLOR.purple, start: advent1, end: addDays(christmas, -1) },
    { key: "christmas", name: "Christmastide", latin: "Tempus Nativitatis", color: COLOR.gold, start: christmas, end: addDays(epiphanySeasonStart, -1) },
    {
      key: "ordinary1",
      name: labelSet === "Anglican" ? "Epiphany" : "Ordinary Time",
      latin: "Tempus per Annum",
      color: COLOR.green,
      start: epiphanySeasonStart,
      end: addDays(ashWednesday, -1),
    },
    { key: "lent", name: "Lent", latin: "Quadragesima", color: COLOR.purple, start: ashWednesday, end: addDays(holyThursday, -1) },
    { key: "triduum", name: "Paschal Triduum", latin: "Triduum Sacrum", color: COLOR.red, start: holyThursday, end: addDays(easter, -1) },
    { key: "easter", name: "Eastertide", latin: "Tempus Paschale", color: COLOR.gold, start: easter, end: pentecost },
    {
      key: "ordinary2",
      name: labelSet === "Anglican" ? "Trinity" : "Ordinary Time",
      latin: "Tempus per Annum",
      color: COLOR.green,
      start: addDays(pentecost, 1),
      end: addDays(advent1Next, -1),
    },
  ];
  return seasons;
}

function catholicFeasts(startYear) {
  const nextYear = startYear + 1;
  const easter = westernEaster(nextYear);
  const fixed = [
    { date: new Date(startYear, 0, 1), name: "Mary, Mother of God", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(nextYear, 0, 6), name: "Epiphany", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(nextYear, 1, 2), name: "Presentation of the Lord", color: COLOR.white, rank: "Feast" },
    { date: new Date(nextYear, 2, 19), name: "St. Joseph", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(nextYear, 2, 25), name: "Annunciation of the Lord", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(startYear, 5, 24), name: "Nativity of St. John the Baptist", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(startYear, 5, 29), name: "Sts. Peter and Paul", color: COLOR.red, rank: "Solemnity" },
    { date: new Date(startYear, 7, 6), name: "Transfiguration of the Lord", color: COLOR.white, rank: "Feast" },
    { date: new Date(startYear, 7, 15), name: "Assumption of Mary", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(startYear, 8, 14), name: "Exaltation of the Holy Cross", color: COLOR.red, rank: "Feast" },
    { date: new Date(startYear, 10, 1), name: "All Saints", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(startYear, 10, 2), name: "All Souls", color: COLOR.purple, rank: "Commemoration" },
    { date: new Date(startYear, 11, 8), name: "Immaculate Conception", color: COLOR.white, rank: "Solemnity" },
    { date: new Date(startYear, 11, 25), name: "Nativity of the Lord (Christmas)", color: COLOR.gold, rank: "Solemnity" },
  ];
  const moveable = [
    { date: addDays(easter, -46), name: "Ash Wednesday", color: COLOR.purple, rank: "Day of Fast" },
    { date: addDays(easter, -7), name: "Palm Sunday", color: COLOR.red, rank: "Sunday" },
    { date: addDays(easter, -3), name: "Holy Thursday", color: COLOR.white, rank: "Solemnity" },
    { date: addDays(easter, -2), name: "Good Friday", color: COLOR.red, rank: "Solemnity" },
    { date: easter, name: "Easter Sunday", color: COLOR.gold, rank: "Solemnity" },
    { date: addDays(easter, 39), name: "Ascension of the Lord", color: COLOR.white, rank: "Solemnity" },
    { date: addDays(easter, 49), name: "Pentecost", color: COLOR.red, rank: "Solemnity" },
    { date: addDays(easter, 56), name: "Trinity Sunday", color: COLOR.white, rank: "Solemnity" },
    { date: addDays(easter, 60), name: "Corpus Christi", color: COLOR.white, rank: "Solemnity" },
    { date: addDays(adventSunday(nextYear), -7), name: "Christ the King", color: COLOR.white, rank: "Solemnity" },
  ];
  return [...fixed, ...moveable];
}

function anglicanFeasts(startYear) {
  const nextYear = startYear + 1;
  const easter = westernEaster(nextYear);
  const fixed = [
    { date: new Date(nextYear, 0, 6), name: "Epiphany", color: COLOR.white, rank: "Principal Feast" },
    { date: new Date(nextYear, 1, 2), name: "Candlemas (Presentation of Christ)", color: COLOR.white, rank: "Feast" },
    { date: new Date(nextYear, 2, 19), name: "St. Joseph", color: COLOR.white, rank: "Feast" },
    { date: new Date(nextYear, 2, 25), name: "Annunciation", color: COLOR.white, rank: "Principal Feast" },
    { date: new Date(startYear, 5, 24), name: "Nativity of St. John the Baptist", color: COLOR.white, rank: "Feast" },
    { date: new Date(startYear, 5, 29), name: "St. Peter and St. Paul", color: COLOR.red, rank: "Feast" },
    { date: new Date(startYear, 7, 6), name: "Transfiguration", color: COLOR.white, rank: "Feast" },
    { date: new Date(startYear, 7, 15), name: "St. Mary the Virgin", color: COLOR.white, rank: "Feast" },
    { date: new Date(startYear, 8, 29), name: "Michaelmas (St. Michael and All Angels)", color: COLOR.white, rank: "Feast" },
    { date: new Date(startYear, 9, 31), name: "All Hallows' Eve", color: COLOR.purple, rank: "Vigil" },
    { date: new Date(startYear, 10, 1), name: "All Saints", color: COLOR.white, rank: "Principal Feast" },
    { date: new Date(startYear, 11, 25), name: "Christmas Day", color: COLOR.gold, rank: "Principal Feast" },
  ];
  const moveable = [
    { date: addDays(easter, -46), name: "Ash Wednesday", color: COLOR.purple, rank: "Day of Discipline" },
    { date: addDays(easter, -7), name: "Palm Sunday", color: COLOR.red, rank: "Sunday" },
    { date: addDays(easter, -3), name: "Maundy Thursday", color: COLOR.white, rank: "Principal Feast" },
    { date: addDays(easter, -2), name: "Good Friday", color: COLOR.red, rank: "Principal Holy Day" },
    { date: easter, name: "Easter Day", color: COLOR.gold, rank: "Principal Feast" },
    { date: addDays(easter, 39), name: "Ascension Day", color: COLOR.white, rank: "Principal Feast" },
    { date: addDays(easter, 49), name: "Day of Pentecost (Whitsunday)", color: COLOR.red, rank: "Principal Feast" },
    { date: addDays(easter, 56), name: "Trinity Sunday", color: COLOR.white, rank: "Principal Feast" },
    { date: addDays(adventSunday(nextYear), -7), name: "Christ the King", color: COLOR.white, rank: "Feast" },
  ];
  return [...fixed, ...moveable];
}

// ---------------------------------------------------------------------
// ORTHODOX. New Calendar = Gregorian fixed feasts + Julian Paschalion.
// Old Calendar = Julian fixed feasts too (so they land ~13 days later in
// Gregorian terms); Pascha and everything derived from it is unchanged,
// since both already use the Julian Paschalion.
// ---------------------------------------------------------------------

export function orthodoxSeasons(today, calendarStyle = "Gregorian") {
  const fixed = (year, month, day) =>
    calendarStyle === "Julian" ? julianFixedDateInGregorian(year, month, day) : new Date(year, month - 1, day);

  // Find the liturgical cycle (Nativity Fast -> next Nativity Fast) containing today.
  const nativityFastThisYear = fixed(today.getFullYear(), 11, 15);
  const startYear = dateOnly(today) >= dateOnly(nativityFastThisYear) ? today.getFullYear() : today.getFullYear() - 1;
  const nextYear = startYear + 1;

  const nativityFastStart = fixed(startYear, 11, 15);
  const nativity = fixed(startYear, 12, 25);
  const theophany = fixed(nextYear, 1, 6);
  const pascha = orthodoxPascha(nextYear);
  const cleanMonday = addDays(pascha, -48);
  const palmSunday = addDays(pascha, -7);
  const pentecost = addDays(pascha, 49);
  const nextNativityFastStart = fixed(nextYear, 11, 15);

  return [
    { key: "nativity-fast", name: "Nativity Fast", latin: "", color: COLOR.purple, start: nativityFastStart, end: addDays(nativity, -1) },
    { key: "nativity", name: "Nativity & Theophany", latin: "", color: COLOR.gold, start: nativity, end: addDays(theophany, -1) },
    { key: "after-theophany", name: "Season after Theophany", latin: "", color: COLOR.green, start: theophany, end: addDays(cleanMonday, -1) },
    { key: "great-lent", name: "Great Lent", latin: "", color: COLOR.purple, start: cleanMonday, end: addDays(palmSunday, -1) },
    { key: "holy-week", name: "Holy Week", latin: "", color: COLOR.red, start: palmSunday, end: addDays(pascha, -1) },
    { key: "paschaltide", name: "Paschaltide", latin: "", color: COLOR.gold, start: pascha, end: pentecost },
    { key: "after-pentecost", name: "Season after Pentecost", latin: "", color: COLOR.green, start: addDays(pentecost, 1), end: addDays(nextNativityFastStart, -1) },
  ];
}

export function orthodoxFeasts(today, calendarStyle = "Gregorian") {
  const fixed = (year, month, day) =>
    calendarStyle === "Julian" ? julianFixedDateInGregorian(year, month, day) : new Date(year, month - 1, day);

  const nativityFastThisYear = fixed(today.getFullYear(), 11, 15);
  const startYear = dateOnly(today) >= dateOnly(nativityFastThisYear) ? today.getFullYear() : today.getFullYear() - 1;
  const nextYear = startYear + 1;
  const pascha = orthodoxPascha(nextYear);

  const fixedFeasts = [
    { date: fixed(startYear, 9, 8), name: "Nativity of the Theotokos", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(startYear, 9, 14), name: "Elevation of the Holy Cross", color: COLOR.red, rank: "Great Feast" },
    { date: fixed(startYear, 11, 21), name: "Presentation of the Theotokos", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(startYear, 12, 25), name: "Nativity of Christ", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(nextYear, 1, 6), name: "Theophany", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(nextYear, 2, 2), name: "Presentation of Christ (Meeting of the Lord)", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(nextYear, 3, 25), name: "Annunciation", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(startYear, 8, 6), name: "Transfiguration", color: COLOR.gold, rank: "Great Feast" },
    { date: fixed(startYear, 8, 15), name: "Dormition of the Theotokos", color: COLOR.gold, rank: "Great Feast" },
  ];
  const moveableFeasts = [
    { date: addDays(pascha, -7), name: "Palm Sunday (Entry into Jerusalem)", color: COLOR.gold, rank: "Great Feast" },
    { date: pascha, name: "Pascha (Holy Easter)", color: COLOR.gold, rank: "Feast of Feasts" },
    { date: addDays(pascha, 39), name: "Ascension", color: COLOR.gold, rank: "Great Feast" },
    { date: addDays(pascha, 49), name: "Pentecost", color: COLOR.red, rank: "Great Feast" },
  ];
  return [...fixedFeasts, ...moveableFeasts];
}

/**
 * Unified entry point: given a tradition ("Catholic" | "Anglican" |
 * "Orthodox"), an Orthodox calendar style, and a reference date (defaults
 * to today), returns { seasons, feasts } for the current liturgical year.
 */
export function liturgicalYearData(tradition, calendarStyle, referenceDate = new Date()) {
  const today = dateOnly(referenceDate);
  if (tradition === "Orthodox") {
    return {
      seasons: orthodoxSeasons(today, calendarStyle),
      feasts: orthodoxFeasts(today, calendarStyle),
    };
  }
  const startYear =
    dateOnly(today) >= dateOnly(adventSunday(today.getFullYear())) ? today.getFullYear() : today.getFullYear() - 1;
  return {
    seasons: westernSeasons(today, tradition),
    feasts: tradition === "Anglican" ? anglicanFeasts(startYear) : catholicFeasts(startYear),
  };
}
