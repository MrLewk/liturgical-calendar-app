import { addDays, adventSunday, julianFixedDateInGregorian, westernEaster, orthodoxPascha, dateOnly, daysBetween, sundayOnOrBefore } from "./dates";

// Liturgical colors, matching the palette already used elsewhere in the app.
export const COLOR = {
  purple: "#5B3B8C",
  white: "#EDE7DC",
  gold: "#C9A227",
  red: "#A32638",
  green: "#3F6B4F",
  rose: "#C97BA0",
};

// A readable accent tint per base liturgical color, used for headings/labels
// that sit against a themed background (see theme.js's seasonAccent()).
export const ACCENT = {
  [COLOR.purple]: "#7C5BA8",
  [COLOR.white]: "#F7F1E4",
  [COLOR.gold]: "#E0BE4E",
  [COLOR.red]: "#C13B4F",
  [COLOR.green]: "#5C8C6C",
  [COLOR.rose]: "#DDA0C0",
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
      name: labelSet === "Anglican" ? "Ordinary Time (Epiphany)" : "Ordinary Time",
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
      name: labelSet === "Anglican" ? "Ordinary Time (Trinity)" : "Ordinary Time",
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
    { date: new Date(nextYear, 0, 1), name: "Mary, Mother of God", color: COLOR.white, rank: "Solemnity",
      bio: "Celebrates Mary's divine motherhood, affirmed at the Council of Ephesus in 431, and opens the civil year with one of the Church's oldest Marian feasts.",
      why: "White marks joyful feasts of Mary, honoring her as she is, not as a martyr." },
    { date: new Date(nextYear, 0, 6), name: "Epiphany", color: COLOR.white, rank: "Solemnity",
      bio: "Commemorates the manifestation of Christ to the Gentiles, traditionally recalled through the visit of the Magi bearing gifts to the infant Jesus in Bethlehem.",
      why: "White marks the revealing of Christ's glory to the world." },
    { date: new Date(nextYear, 1, 2), name: "Presentation of the Lord", color: COLOR.white, rank: "Feast",
      bio: "Recalls Mary and Joseph presenting the infant Jesus in the Temple forty days after his birth, where the elderly Simeon recognized him as the promised Messiah.",
      why: "White marks the feast's joyful revelation of Christ as \"a light for revelation.\"" },
    { date: new Date(nextYear, 2, 19), name: "St. Joseph", color: COLOR.white, rank: "Solemnity",
      bio: "Honors Joseph, husband of Mary and foster father of Jesus, revered as a model of quiet obedience and the patron of the universal Church.",
      why: "White marks his feast as a confessor, one who lived the faith faithfully without martyrdom." },
    { date: new Date(nextYear, 2, 25), name: "Annunciation of the Lord", color: COLOR.white, rank: "Solemnity",
      bio: "Marks the angel Gabriel's announcement to Mary that she would conceive Jesus by the Holy Spirit, and her consent — the moment understood as the Incarnation.",
      why: "White marks this solemnity of the Lord's conception as an event of pure joy." },
    { date: new Date(nextYear, 5, 24), name: "Nativity of St. John the Baptist", color: COLOR.white, rank: "Solemnity",
      bio: "Celebrates the birth of John the Baptist, the forerunner who prepared the way for Christ, set six months before Christmas per Luke's Gospel.",
      why: "White marks the joy of his birth rather than the manner of his death." },
    { date: new Date(nextYear, 5, 29), name: "Sts. Peter and Paul", color: COLOR.red, rank: "Solemnity",
      bio: "Honors the two great apostles traditionally believed to have been martyred in Rome under Nero — Peter by crucifixion, Paul by beheading.",
      why: "Red marks their martyrdom, witness borne in blood." },
    { date: new Date(nextYear, 7, 6), name: "Transfiguration of the Lord", color: COLOR.white, rank: "Feast",
      bio: "Commemorates Jesus revealing his divine glory to Peter, James, and John on the mountain, appearing radiant alongside Moses and Elijah.",
      why: "White marks the dazzling, glorious light of the event." },
    { date: new Date(nextYear, 7, 15), name: "Assumption of Mary", color: COLOR.white, rank: "Solemnity",
      bio: "Celebrates the Catholic dogma, defined in 1950, that Mary was taken body and soul into heaven at the end of her earthly life.",
      why: "White marks Mary's triumphant, joyful entry into glory." },
    { date: new Date(nextYear, 8, 14), name: "Exaltation of the Holy Cross", color: COLOR.red, rank: "Feast",
      bio: "Commemorates the finding of the True Cross by St. Helena in Jerusalem in 326, and its recovery from Persian capture in 629.",
      why: "Red marks the Passion — the cross itself, and the suffering it represents." },
    { date: new Date(nextYear, 10, 1), name: "All Saints", color: COLOR.white, rank: "Solemnity",
      bio: "Honors every saint in heaven, known and unknown, celebrating the whole communion of the redeemed rather than any one figure.",
      why: "White marks the joy and glory of the saints in heaven." },
    { date: new Date(nextYear, 10, 2), name: "All Souls", color: COLOR.purple, rank: "Commemoration",
      bio: "A day of prayer for all the faithful departed, especially souls believed to still be undergoing purification, rooted in the ancient practice of praying for the dead.",
      why: "Purple, worn in penitential seasons, reflects the day's tone of intercession and mourning." },
    { date: new Date(startYear, 11, 8), name: "Immaculate Conception", color: COLOR.white, rank: "Solemnity",
      bio: "Celebrates the Catholic dogma that Mary was conceived without original sin, preparing her from the first moment of her existence to be the mother of Christ.",
      why: "White marks Mary's sinless purity." },
    { date: new Date(startYear, 11, 25), name: "Nativity of the Lord (Christmas)", color: COLOR.gold, rank: "Solemnity",
      bio: "Celebrates the birth of Jesus Christ in Bethlehem, one of the two greatest solemnities of the Christian year.",
      why: "Gold marks the highest joy — the Incarnation of God as man." },
  ];
  const moveable = [
    { date: addDays(easter, -46), name: "Ash Wednesday", color: COLOR.purple, rank: "Day of Fast",
      bio: "Opens Lent with the marking of ashes on the forehead, a sign of mortality and repentance drawn from Scripture's \"you are dust, and to dust you shall return.\"",
      why: "Purple marks the penitential discipline of the day." },
    { date: addDays(easter, -7), name: "Palm Sunday", color: COLOR.red, rank: "Sunday",
      bio: "Commemorates Jesus's triumphant entry into Jerusalem on a donkey, greeted by crowds waving palm branches, days before his crucifixion.",
      why: "Red marks both the crowd's acclaim and the Passion narrative read on this day." },
    { date: addDays(easter, -3), name: "Holy Thursday", color: COLOR.white, rank: "Solemnity",
      bio: "Recalls the Last Supper, where Jesus instituted the Eucharist and washed his disciples' feet, and his agony in the Garden of Gethsemane that followed.",
      why: "White marks the institution of the Eucharist, though the day opens the somber Triduum." },
    { date: addDays(easter, -2), name: "Good Friday", color: COLOR.red, rank: "Solemnity",
      bio: "Commemorates the crucifixion and death of Jesus Christ at Calvary, observed with fasting, veneration of the cross, and no celebration of Mass.",
      why: "Red marks the Passion and the blood of the cross." },
    { date: easter, name: "Easter Sunday", color: COLOR.gold, rank: "Solemnity",
      bio: "Celebrates the resurrection of Jesus Christ from the dead, the central event of the Christian faith and the oldest, greatest feast of the liturgical year.",
      why: "Gold marks the supreme joy of the Resurrection." },
    { date: addDays(easter, 39), name: "Ascension of the Lord", color: COLOR.white, rank: "Solemnity",
      bio: "Commemorates Jesus's bodily ascension into heaven forty days after his resurrection, witnessed by his apostles on the Mount of Olives.",
      why: "White marks the glory of Christ's return to the Father." },
    { date: addDays(easter, 49), name: "Pentecost", color: COLOR.red, rank: "Solemnity",
      bio: "Celebrates the descent of the Holy Spirit upon the apostles fifty days after Easter, traditionally regarded as the birth of the Church.",
      why: "Red marks the tongues of fire and the Spirit's fiery descent." },
    { date: addDays(easter, 56), name: "Trinity Sunday", color: COLOR.white, rank: "Solemnity",
      bio: "Honors the central Christian mystery of one God in three persons — Father, Son, and Holy Spirit — celebrated the Sunday after Pentecost.",
      why: "White marks the purity and glory of the Godhead." },
    { date: addDays(easter, 60), name: "Corpus Christi", color: COLOR.white, rank: "Solemnity",
      bio: "Celebrates the Real Presence of Christ's body and blood in the Eucharist, often marked with processions carrying the consecrated host through the streets.",
      why: "White marks the sacred, joyful mystery of the Eucharist." },
    { date: addDays(adventSunday(nextYear), -7), name: "Christ the King", color: COLOR.white, rank: "Solemnity",
      bio: "Closes the liturgical year proclaiming Christ's kingship over all creation, instituted in 1925 by Pope Pius XI partly in response to rising secularism and nationalism.",
      why: "White marks the glory and majesty of Christ's reign." },
  ];
  return [...fixed, ...moveable];
}

function anglicanFeasts(startYear) {
  const nextYear = startYear + 1;
  const easter = westernEaster(nextYear);
  const fixed = [
    { date: new Date(nextYear, 0, 6), name: "Epiphany", color: COLOR.white, rank: "Principal Feast",
      bio: "Marks the manifestation of Christ to the Gentiles, traditionally recalled through the visit of the Magi to the infant Jesus in Bethlehem.",
      why: "White marks the revealing of Christ's glory to the world." },
    { date: new Date(nextYear, 1, 2), name: "Candlemas (Presentation of Christ)", color: COLOR.white, rank: "Feast",
      bio: "Recalls Mary and Joseph presenting the infant Jesus in the Temple, where the aged Simeon proclaimed him \"a light to lighten the Gentiles\" — the origin of the day's candlelit processions.",
      why: "White marks the feast's central image of Christ as light." },
    { date: new Date(nextYear, 2, 19), name: "St. Joseph", color: COLOR.white, rank: "Feast",
      bio: "Honors Joseph, husband of Mary and guardian of the infant Jesus, remembered for his quiet faithfulness and obedience.",
      why: "White marks a feast of a confessor rather than a martyr." },
    { date: new Date(nextYear, 2, 25), name: "Annunciation", color: COLOR.white, rank: "Principal Feast",
      bio: "Commemorates the angel Gabriel's announcement to Mary that she would bear the Son of God, and her willing acceptance — nine months before Christmas.",
      why: "White marks the joy of the Incarnation's beginning." },
    { date: new Date(nextYear, 5, 24), name: "Nativity of St. John the Baptist", color: COLOR.white, rank: "Feast",
      bio: "Celebrates the birth of John the Baptist, the last of the prophets and forerunner of Christ, set six months before Christmas per Luke's Gospel.",
      why: "White marks the joy of a birth, not a martyrdom." },
    { date: new Date(nextYear, 5, 29), name: "St. Peter and St. Paul", color: COLOR.red, rank: "Feast",
      bio: "Honors the two apostles traditionally martyred in Rome, Peter by crucifixion and Paul by the sword, foundational witnesses of the early Church.",
      why: "Red marks their deaths as martyrs." },
    { date: new Date(nextYear, 7, 6), name: "Transfiguration", color: COLOR.white, rank: "Feast",
      bio: "Recalls Jesus revealing his divine glory to Peter, James, and John on the mountain, appearing in radiant light alongside Moses and Elijah.",
      why: "White marks the dazzling glory of the event." },
    { date: new Date(nextYear, 7, 15), name: "St. Mary the Virgin", color: COLOR.white, rank: "Feast",
      bio: "The Church of England's principal feast honoring Mary, mother of Jesus, marking her unique place in the story of the Incarnation.",
      why: "White marks a feast of joyful honor rather than martyrdom." },
    { date: new Date(nextYear, 8, 29), name: "Michaelmas (St. Michael and All Angels)", color: COLOR.white, rank: "Feast",
      bio: "Honors the archangel Michael and all the angels, traditionally associated with the triumph of good over evil and, in English custom, the start of autumn reckonings.",
      why: "White marks the purity and glory of the heavenly hosts." },
    { date: new Date(nextYear, 9, 31), name: "All Hallows' Eve", color: COLOR.purple, rank: "Vigil",
      bio: "The vigil before All Saints' Day, historically a night of prayer and preparation before the feast honoring the departed faithful.",
      why: "Purple reflects the penitential, watchful character of a vigil." },
    { date: new Date(nextYear, 10, 1), name: "All Saints", color: COLOR.white, rank: "Principal Feast",
      bio: "Honors all the saints of God, known and unknown, celebrating the whole company of the faithful departed rather than any single figure.",
      why: "White marks the joy and glory of the saints in heaven." },
    { date: new Date(startYear, 11, 25), name: "Christmas Day", color: COLOR.gold, rank: "Principal Feast",
      bio: "Celebrates the birth of Jesus Christ, one of the Church of England's principal feasts and the heart of the Christmas season.",
      why: "Gold marks the greatest joy — God's Incarnation." },
  ];
  const moveable = [
    { date: addDays(easter, -46), name: "Ash Wednesday", color: COLOR.purple, rank: "Day of Discipline",
      bio: "Opens Lent with ashes placed on the forehead as a sign of repentance and mortality, echoing Scripture's reminder that \"you are dust, and to dust you shall return.\"",
      why: "Purple marks the day's penitential discipline." },
    { date: addDays(easter, -7), name: "Palm Sunday", color: COLOR.red, rank: "Sunday",
      bio: "Recalls Jesus's entry into Jerusalem on a donkey, welcomed by crowds waving palm branches, days before his arrest and crucifixion.",
      why: "Red marks both the crowd's welcome and the Passion narrative proclaimed this day." },
    { date: addDays(easter, -3), name: "Maundy Thursday", color: COLOR.white, rank: "Principal Feast",
      bio: "Commemorates the Last Supper, at which Jesus instituted the Eucharist and washed his disciples' feet, and his agony in Gethsemane that followed.",
      why: "White marks the institution of the Eucharist at the meal." },
    { date: addDays(easter, -2), name: "Good Friday", color: COLOR.red, rank: "Principal Holy Day",
      bio: "Marks the crucifixion and death of Jesus Christ, kept with fasting and solemn liturgy and, in many parishes, the Three Hours' Devotion.",
      why: "Red marks the Passion and the cross." },
    { date: easter, name: "Easter Day", color: COLOR.gold, rank: "Principal Feast",
      bio: "Celebrates the resurrection of Jesus Christ from the dead, the greatest and oldest feast of the Christian year.",
      why: "Gold marks the supreme joy of the Resurrection." },
    { date: addDays(easter, 39), name: "Ascension Day", color: COLOR.white, rank: "Principal Feast",
      bio: "Commemorates Christ's bodily ascension into heaven forty days after Easter, witnessed by the apostles on the Mount of Olives.",
      why: "White marks the glory of Christ's return to the Father." },
    { date: addDays(easter, 49), name: "Day of Pentecost (Whitsunday)", color: COLOR.red, rank: "Principal Feast",
      bio: "Celebrates the descent of the Holy Spirit on the apostles fifty days after Easter, traditionally marked in England by the wearing of white — the origin of the name \"Whitsunday.\"",
      why: "Red marks the Spirit's fiery descent at Pentecost." },
    { date: addDays(easter, 56), name: "Trinity Sunday", color: COLOR.white, rank: "Principal Feast",
      bio: "Honors the mystery of one God in three persons — Father, Son, and Holy Spirit — kept the Sunday after Pentecost.",
      why: "White marks the purity and glory of the Godhead." },
    { date: addDays(adventSunday(nextYear), -7), name: "Christ the King", color: COLOR.white, rank: "Feast",
      bio: "Closes the liturgical year proclaiming Christ's sovereignty over all creation, adopted into Anglican calendars in the twentieth century.",
      why: "White marks the glory and majesty of Christ's reign." },
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
    { date: fixed(nextYear, 9, 8), name: "Nativity of the Theotokos", color: COLOR.gold, rank: "Great Feast",
      bio: "Celebrates the birth of the Virgin Mary to Sts. Joachim and Anna, opening the Orthodox liturgical year with the first of the Twelve Great Feasts.",
      why: "Gold marks the joy of a Great Feast of the Theotokos." },
    { date: fixed(nextYear, 9, 14), name: "Elevation of the Holy Cross", color: COLOR.red, rank: "Great Feast",
      bio: "Commemorates the finding of the True Cross by St. Helena in the fourth century and its recovery after Persian capture, marked with a strict fast and veneration of the cross.",
      why: "Red marks the cross and the suffering of the Passion it represents." },
    { date: fixed(startYear, 11, 21), name: "Presentation of the Theotokos", color: COLOR.gold, rank: "Great Feast",
      bio: "Recalls the tradition that Mary, as a young child, was brought by her parents to live and be raised in the Jerusalem Temple.",
      why: "Gold marks the joy of this Great Feast honoring the Theotokos." },
    { date: fixed(startYear, 12, 25), name: "Nativity of Christ", color: COLOR.gold, rank: "Great Feast",
      bio: "Celebrates the birth of Jesus Christ, kept after a forty-day Nativity Fast and ranked among the most important of the Twelve Great Feasts.",
      why: "Gold marks the supreme joy of Christ's Incarnation." },
    { date: fixed(nextYear, 1, 6), name: "Theophany", color: COLOR.gold, rank: "Great Feast",
      bio: "Commemorates the baptism of Jesus in the Jordan by John the Baptist, understood as the revelation of the Holy Trinity, marked by the Great Blessing of Water.",
      why: "Gold marks the glory of God's revelation at the Jordan." },
    { date: fixed(nextYear, 2, 2), name: "Presentation of Christ (Meeting of the Lord)", color: COLOR.gold, rank: "Great Feast",
      bio: "Recalls the infant Jesus being brought to the Temple forty days after his birth, where the elder Simeon and the prophetess Anna recognized him as the Messiah.",
      why: "Gold marks the joyful \"meeting\" between the Old and New Covenants." },
    { date: fixed(nextYear, 3, 25), name: "Annunciation", color: COLOR.gold, rank: "Great Feast",
      bio: "Celebrates the archangel Gabriel's announcement to the Virgin Mary that she would conceive Christ, regarded as the beginning of humanity's salvation.",
      why: "Gold marks the joy of the Incarnation's beginning." },
    { date: fixed(nextYear, 8, 6), name: "Transfiguration", color: COLOR.gold, rank: "Great Feast",
      bio: "Commemorates Christ revealing his divine glory to Peter, James, and John on Mount Tabor, a foretaste of the glorified state promised to believers.",
      why: "Gold marks the radiant, uncreated light revealed on Tabor." },
    { date: fixed(nextYear, 8, 15), name: "Dormition of the Theotokos", color: COLOR.gold, rank: "Great Feast",
      bio: "Commemorates the \"falling asleep\" of the Virgin Mary and her bodily passage into heaven, kept after a two-week fast as one of the most beloved Orthodox feasts.",
      why: "Gold marks the joy of Mary's passage into glory." },
  ];
  const moveableFeasts = [
    { date: addDays(pascha, -7), name: "Palm Sunday (Entry into Jerusalem)", color: COLOR.gold, rank: "Great Feast",
      bio: "Recalls Christ's triumphant entry into Jerusalem on a donkey, welcomed by crowds with palm branches, on the eve of Holy Week.",
      why: "Gold marks the joy of Christ's royal welcome before the Passion begins." },
    { date: pascha, name: "Pascha (Holy Easter)", color: COLOR.gold, rank: "Feast of Feasts",
      bio: "The \"Feast of Feasts,\" celebrating Christ's resurrection from the dead with the midnight Paschal liturgy — the center of the entire Orthodox liturgical year.",
      why: "Gold marks the surpassing joy of the Resurrection, greater than any other feast." },
    { date: addDays(pascha, 39), name: "Ascension", color: COLOR.gold, rank: "Great Feast",
      bio: "Commemorates Christ's ascension into heaven forty days after Pascha, witnessed by the apostles on the Mount of Olives.",
      why: "Gold marks the glory of Christ's return to the Father." },
    { date: addDays(pascha, 49), name: "Pentecost", color: COLOR.red, rank: "Great Feast",
      bio: "Celebrates the descent of the Holy Spirit upon the apostles fifty days after Pascha, traditionally kept with Kneeling Vespers and greenery decorating the church.",
      why: "Red marks the fiery descent of the Holy Spirit." },
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

/** The season from `seasons` (as returned above) that contains `date`. */
export function seasonAt(seasons, date) {
  const d = dateOnly(date);
  return seasons.find((s) => dateOnly(s.start) <= d && d <= dateOnly(s.end)) || seasons[seasons.length - 1];
}

/** The feast (if any) from `feasts` that falls exactly on `date`. */
export function feastOnDate(feasts, date) {
  const d = dateOnly(date);
  return feasts.find((f) => dateOnly(f.date).getTime() === d.getTime()) || null;
}

/**
 * Feasts from `today` onward, sorted chronologically, merging the current
 * liturgical year with the next one so the list never runs dry even close
 * to the end of a liturgical year (e.g. late November for Western traditions).
 */
export function upcomingFeasts(tradition, calendarStyle, referenceDate = new Date(), limit = 20) {
  const today = dateOnly(referenceDate);
  const current = liturgicalYearData(tradition, calendarStyle, today);
  const lastSeason = current.seasons[current.seasons.length - 1];
  const next = liturgicalYearData(tradition, calendarStyle, addDays(lastSeason.end, 2));

  const seen = new Set();
  const all = [...current.feasts, ...next.feasts].filter((f) => {
    const key = `${f.name}|${dateOnly(f.date).getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return all
    .filter((f) => dateOnly(f.date).getTime() >= today.getTime())
    .sort((a, b) => dateOnly(a.date) - dateOnly(b.date))
    .slice(0, limit);
}

/** The first Sunday strictly AFTER `date` (if `date` is itself a Sunday, this is 7 days later). */
function nextSunday(date) {
  const d = dateOnly(date);
  const diff = (7 - d.getDay()) % 7;
  return addDays(d, diff === 0 ? 7 : diff);
}

// Orthodox Great Lent's five Sundays each carry a traditional name instead
// of a plain number in service books — index 0 = 1st Sunday of Lent.
const LENT_SUNDAY_NAMES_ORTHODOX = [
  "Sunday of Orthodoxy",
  "St. Gregory Palamas",
  "Veneration of the Cross",
  "St. John Climacus",
  "St. Mary of Egypt",
];

// Likewise the Sundays of Paschaltide (index 0 = Pascha itself, handled
// separately below; index 1 = the Sunday after Pascha, etc.).
const PASCHA_SUNDAY_NAMES_ORTHODOX = [
  null,
  "Thomas Sunday (Antipascha)",
  "Myrrhbearing Women",
  "Paralytic",
  "Samaritan Woman",
  "Blind Man",
  "Holy Fathers of Nicaea",
];

/**
 * A precise liturgical week/Sunday label for `date`, matching the
 * numbering conventions of the tradition's own books as closely as this
 * app's season model allows:
 *  - Catholic: the official 1–34 Ordinary Time numbering (forward from the
 *    Monday after the Baptism of the Lord to Ash Wednesday, then counted
 *    backward from the 34th/last week — the week of Christ the King —
 *    after Ordinary Time resumes on the Monday after Pentecost). Advent
 *    and Lent Sundays are numbered directly; Holy Week and the Easter
 *    Octave/Pentecost are called out by name rather than a number.
 *  - Anglican (BCP-style): "Epiphany N" / "Trinity N", counting Sundays
 *    after Epiphany and after Trinity Sunday, plus named Advent/Lent
 *    Sundays and Holy Week.
 *  - Orthodox: the traditional named pre-Lenten and Great Lent Sundays
 *    (Publican & Pharisee through St. Mary of Egypt), the named Sundays of
 *    Paschaltide (Thomas Sunday through the Holy Fathers of Nicaea), and
 *    "N Sunday after Pentecost" (with the first named "All Saints").
 * Falls back to a season name for anything not covered (short day-counted
 * stretches use `withDisplay`'s own "Day N" instead — see below).
 */
export function weekLabel(seasons, tradition, date) {
  const d = dateOnly(date);
  const season = seasonAt(seasons, d);
  const byKey = Object.fromEntries(seasons.map((s) => [s.key, s]));
  const sundayAnchor = sundayOnOrBefore(d);

  switch (season.key) {
    // ---- Advent (Catholic + Anglican share the same four Sundays) ----
    case "advent": {
      const advent1 = byKey.advent.start;
      const n = Math.round(daysBetween(advent1, sundayAnchor) / 7) + 1;
      return `Advent ${Math.min(Math.max(n, 1), 4)}`;
    }

    // ---- Catholic Ordinary Time / Anglican Epiphany season ----
    case "ordinary1": {
      if (tradition === "Anglican") {
        const epiphany = byKey.ordinary1.start; // Jan 6
        const firstSunday = epiphany.getDay() === 0 ? addDays(epiphany, 7) : nextSunday(epiphany);
        if (sundayAnchor.getTime() < firstSunday.getTime()) return "Epiphany";
        const n = Math.round(daysBetween(firstSunday, sundayAnchor) / 7) + 1;
        return `Epiphany ${n}`;
      }
      const jan6 = byKey.ordinary1.start;
      const baptism = jan6.getDay() === 0 ? addDays(jan6, 1) : nextSunday(jan6);
      const ordinaryStart = addDays(baptism, 1);
      const secondSunday = nextSunday(ordinaryStart);
      if (d.getTime() < secondSunday.getTime()) return "Week 1";
      const n = 2 + Math.round(daysBetween(secondSunday, sundayAnchor) / 7);
      return `Week ${n}`;
    }

    // ---- Lent (Catholic + Anglican; Palm Sunday breaks the numbered run) ----
    case "lent": {
      const easter = byKey.easter.start;
      const firstSunday = addDays(easter, -42); // 1st Sunday of Lent
      const palmSunday = addDays(easter, -7);
      if (d.getTime() < firstSunday.getTime()) return "Lent"; // Ash Wednesday through the following Saturday
      if (sundayAnchor.getTime() === palmSunday.getTime()) return "Holy Week";
      const n = 7 - Math.round(daysBetween(sundayAnchor, easter) / 7);
      return `Lent ${n}`;
    }

    case "triduum":
      return `Day ${daysBetween(byKey.triduum.start, d) + 1} of the Triduum`;

    // ---- Eastertide (Catholic + Anglican) ----
    case "easter": {
      const easter = byKey.easter.start;
      const pentecost = byKey.easter.end;
      if (d.getTime() === pentecost.getTime()) return "Pentecost";
      if (sundayAnchor.getTime() === easter.getTime()) return "Easter Octave";
      const n = Math.round(daysBetween(easter, sundayAnchor) / 7) + 1;
      return `Easter ${n}`;
    }

    // ---- Catholic Ordinary Time (resumed) / Anglican Trinity season ----
    case "ordinary2": {
      if (tradition === "Anglican") {
        const trinity = addDays(byKey.easter.start, 56);
        if (sundayAnchor.getTime() < trinity.getTime()) return "Whitsun Week";
        if (sundayAnchor.getTime() === trinity.getTime()) return "Trinity Sunday";
        const n = Math.round(daysBetween(trinity, sundayAnchor) / 7);
        return `Trinity ${n}`;
      }
      const advent1Next = addDays(byKey.ordinary2.end, 1);
      const christKingSunday = addDays(advent1Next, -7);
      const weeksBack = Math.round(daysBetween(sundayAnchor, christKingSunday) / 7);
      return `Week ${34 - weeksBack}`;
    }

    // ---- Orthodox ----
    case "nativity-fast":
      return `Day ${daysBetween(byKey["nativity-fast"].start, d) + 1} of the Nativity Fast`;

    case "nativity":
      return `Day ${daysBetween(byKey.nativity.start, d) + 1} of Nativity & Theophany`;

    case "after-theophany": {
      const cleanMonday = byKey["great-lent"].start;
      const forgiveness = addDays(cleanMonday, -1);
      const meatfare = addDays(forgiveness, -7);
      const prodigal = addDays(meatfare, -7);
      const publican = addDays(prodigal, -7);
      if (sundayAnchor.getTime() === forgiveness.getTime()) return "Forgiveness Sunday";
      if (sundayAnchor.getTime() === meatfare.getTime()) return "Meatfare Sunday";
      if (sundayAnchor.getTime() === prodigal.getTime()) return "Sunday of the Prodigal Son";
      if (sundayAnchor.getTime() === publican.getTime()) return "Sunday of the Publican & Pharisee";
      const firstSunday = nextSunday(byKey["after-theophany"].start);
      const n = Math.max(1, Math.round(daysBetween(firstSunday, sundayAnchor) / 7) + 1);
      return `Week ${n} after Theophany`;
    }

    case "great-lent": {
      const cleanMonday = byKey["great-lent"].start;
      const sundayOfOrthodoxy = addDays(cleanMonday, 6);
      const idx = Math.max(0, Math.min(4, Math.round(daysBetween(sundayOfOrthodoxy, sundayAnchor) / 7)));
      return `Week of ${LENT_SUNDAY_NAMES_ORTHODOX[idx]}`;
    }

    case "holy-week":
      return `Day ${daysBetween(byKey["holy-week"].start, d) + 1} of Holy Week`;

    case "paschaltide": {
      const pascha = byKey.paschaltide.start;
      const pentecost = byKey.paschaltide.end;
      if (d.getTime() === pentecost.getTime()) return "Pentecost";
      if (sundayAnchor.getTime() === pascha.getTime()) return "Bright Week (Pascha)";
      const n = Math.min(6, Math.round(daysBetween(pascha, sundayAnchor) / 7) + 1);
      return `Week of ${PASCHA_SUNDAY_NAMES_ORTHODOX[n]}`;
    }

    case "after-pentecost": {
      const pentecostDate = addDays(byKey["after-pentecost"].start, -1);
      const n = Math.round(daysBetween(pentecostDate, sundayAnchor) / 7);
      return n <= 1 ? "Sunday of All Saints" : `Week ${n} after Pentecost`;
    }

    default:
      return season.name;
  }
}

/**
 * Adds display-only fields to a raw season object from `seasons`: a
 * readable accent tint, a precise week/Sunday label (see `weekLabel()`
 * above) when `tradition`/`seasons` are supplied, and a simple "Day N"
 * fallback otherwise (or for short day-counted stretches where a week
 * number isn't meaningful — Triduum, Christmastide, Holy Week, etc. — see
 * `weekLabel()`, which already returns a "Day N" style string for those).
 */
export function withDisplay(season, today, tradition, seasons) {
  const dayInSeason = daysBetween(season.start, dateOnly(today)) + 1;
  const seasonLength = daysBetween(season.start, season.end) + 1;
  const label =
    tradition && seasons
      ? weekLabel(seasons, tradition, today)
      : seasonLength <= 14
      ? `Day ${dayInSeason}`
      : `Week ${Math.ceil(dayInSeason / 7)}`;
  return {
    ...season,
    accent: ACCENT[season.color] || season.color,
    dayInSeason,
    seasonLength,
    weekLabel: label,
  };
}
