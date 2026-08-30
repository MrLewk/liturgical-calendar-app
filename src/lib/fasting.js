import { addDays, adventSunday, julianFixedDateInGregorian, westernEaster, orthodoxPascha, dateOnly, sundayOnOrBefore } from "./dates";

// ---------------------------------------------------------------------
// Simple daily fasting/abstinence indicator for all three traditions.
// Each returns { level, label } or null for an ordinary day with no
// fasting observance. `level` is one of "strict" | "fast" | "abstinence"
// | "fast-free" (Orthodox only, for a day that would ordinarily be a
// fast day but is explicitly lifted) — display styling can key off this.
//
// This is deliberately a *simple* indicator, not a full fasting rule
// engine: known simplifications are called out in each function's own
// comment rather than silently guessed at. In particular, none of the
// three traditions here account for a Great Feast landing on what would
// otherwise be a fasting day (which in real practice can lift or modify
// the fast) — that's a real gap, not an oversight.
// ---------------------------------------------------------------------

/**
 * Catholic fasting/abstinence per the universal Latin-Rite norm (1983
 * Code of Canon Law cc. 1250–1253) plus the UK bishops' 2011
 * reintroduction of Friday abstinence year-round, which is what this
 * app's Catholic content otherwise follows. Doesn't attempt the fuller,
 * more demanding fasting calendar the TLM historically observed (all of
 * Lent as fast days, Ember days, vigils) — a real simplification, not
 * wired to the massForm toggle.
 */
export function catholicFastingFor(date) {
  const d = dateOnly(date);
  const easter = westernEaster(d.getFullYear());
  const ashWednesday = addDays(easter, -46);
  const goodFriday = addDays(easter, -2);

  if (d.getTime() === dateOnly(ashWednesday).getTime()) return { level: "strict", label: "Ash Wednesday — fast & abstinence" };
  if (d.getTime() === dateOnly(goodFriday).getTime()) return { level: "strict", label: "Good Friday — fast & abstinence" };
  if (d.getDay() === 5) {
    const inLent = d.getTime() >= dateOnly(ashWednesday).getTime() && d.getTime() < dateOnly(easter).getTime();
    return inLent ? { level: "abstinence", label: "Friday of Lent — abstinence" } : { level: "abstinence", label: "Friday abstinence" };
  }
  return null;
}

/**
 * Anglican fasting/abstinence per the 1662 Book of Common Prayer's
 * "Table of Fasts": all Fridays (except Christmas Day), the Forty Days
 * of Lent, the four sets of Ember Days, and the three Rogation Days.
 * Deliberately doesn't include the BCP's further list of feast Vigils
 * (a long enumeration with its own Sunday-transfer rule) — a real gap
 * for a later pass, not an oversight.
 */
export function anglicanFastingFor(date) {
  const d = dateOnly(date);
  const easter = westernEaster(d.getFullYear());
  const ashWednesday = addDays(easter, -46);
  const goodFriday = addDays(easter, -2);
  const inLent = d.getTime() >= dateOnly(ashWednesday).getTime() && d.getTime() < dateOnly(easter).getTime();

  if (d.getTime() === dateOnly(ashWednesday).getTime()) return { level: "strict", label: "Ash Wednesday" };
  if (d.getTime() === dateOnly(goodFriday).getTime()) return { level: "strict", label: "Good Friday" };
  if (inLent) return { level: "fast", label: "A Lenten fast day" };

  // Ember Days: Wed/Fri/Sat after the 1st Sunday of Advent, the 1st
  // Sunday in Lent, Whitsunday (Pentecost), and Holy Cross Day (Sep 14).
  const advent1 = adventSunday(d.getFullYear());
  const lent1 = addDays(ashWednesday, 4); // 1st Sunday in Lent = Ash Wed + 4 days
  const whitsunday = addDays(easter, 49);
  const holyCross = new Date(d.getFullYear(), 8, 14);
  const emberAnchors = [advent1, lent1, whitsunday, sundayOnOrBefore(holyCross)];
  for (const anchor of emberAnchors) {
    for (const offset of [3, 5, 6]) {
      // Wed(+3)/Fri(+5)/Sat(+6) after the Sunday anchor.
      if (d.getTime() === dateOnly(addDays(anchor, offset)).getTime()) return { level: "fast", label: "Ember Day" };
    }
  }

  // Rogation Days: the Monday, Tuesday and Wednesday before Ascension Day.
  const ascension = addDays(easter, 39);
  for (const offset of [-3, -2, -1]) {
    if (d.getTime() === dateOnly(addDays(ascension, offset)).getTime()) return { level: "fast", label: "Rogation Day" };
  }

  if (d.getDay() === 5) {
    const isChristmasDay = d.getMonth() === 11 && d.getDate() === 25;
    if (!isChristmasDay) return { level: "abstinence", label: "Friday abstinence" };
  }
  return null;
}

/**
 * Orthodox (Slavic tradition) fasting per the standard Byzantine fasting
 * calendar: the four fasting seasons (Great Lent, Apostles' Fast,
 * Dormition Fast, Nativity Fast), weekly Wednesday/Friday fasting, the
 * fast-free weeks/periods that lift it, and Cheesefare week. A real,
 * deliberate simplification: doesn't distinguish the finer traditional
 * grades within each season (e.g. wine-and-oil-allowed weekends within
 * Great Lent, fish-allowed days within the Nativity or Apostles' Fasts,
 * the stricter final week of the Nativity Fast) — those are folded into
 * a single "fast" or "strict" level rather than a full multi-grade
 * system. Doesn't account for a Great Feast lifting an otherwise-fasting
 * Wednesday/Friday (e.g. Nativity of the Theotokos, the Transfiguration)
 * — a known gap, not an oversight.
 */
export function orthodoxFastingFor(date, calendarStyle = "Gregorian") {
  const d = dateOnly(date);
  const fixed = (year, month, day) => (calendarStyle === "Julian" ? julianFixedDateInGregorian(year, month, day) : new Date(year, month - 1, day));

  const nativityFastThisYear = fixed(d.getFullYear(), 11, 15);
  const startYear = d.getTime() >= dateOnly(nativityFastThisYear).getTime() ? d.getFullYear() : d.getFullYear() - 1;
  const nextYear = startYear + 1;

  const nativityFastStart = fixed(startYear, 11, 15);
  const nativity = fixed(startYear, 12, 25);
  const theophany = fixed(nextYear, 1, 6);
  const pascha = orthodoxPascha(nextYear);
  const cleanMonday = addDays(pascha, -48);
  const palmSunday = addDays(pascha, -7);
  const pentecost = addDays(pascha, 49);
  const allSaintsSunday = addDays(pascha, 56);
  const apostlesFastStart = addDays(allSaintsSunday, 1);
  const apostlesFastEnd = fixed(nextYear, 6, 28);
  const dormitionFastStart = fixed(nextYear, 8, 1);
  const dormitionFastEnd = fixed(nextYear, 8, 14);
  const publicanPhariseeSunday = addDays(pascha, -70);
  const prodigalSonSunday = addDays(pascha, -63);
  const meatfareSunday = addDays(pascha, -14);
  const cheesefareSunday = addDays(pascha, -8);

  const between = (start, end) => d.getTime() >= dateOnly(start).getTime() && d.getTime() <= dateOnly(end).getTime();
  const isSame = (x) => d.getTime() === dateOnly(x).getTime();

  // Fast-free weeks/periods, checked first since they override everything else.
  if (between(nativity, addDays(theophany, -2))) return { level: "fast-free", label: "Fast-free (Nativity to Theophany Eve)" };
  if (between(addDays(publicanPhariseeSunday, 1), addDays(prodigalSonSunday, -1))) return { level: "fast-free", label: "Fast-free (week after Publican & Pharisee Sunday)" };
  if (between(pascha, addDays(pascha, 6))) return { level: "fast-free", label: "Fast-free (Bright Week)" };
  if (between(pentecost, addDays(pentecost, 6))) return { level: "fast-free", label: "Fast-free (week after Pentecost)" };

  if (between(meatfareSunday, cheesefareSunday)) return { level: "fast", label: "Cheesefare Week — meat-free, dairy permitted" };

  if (isSame(addDays(nativity, -1))) return { level: "strict", label: "Nativity Eve — strict fast" };
  if (isSame(addDays(theophany, -1))) return { level: "strict", label: "Theophany Eve — strict fast" };

  if (between(cleanMonday, addDays(palmSunday, -1))) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return isWeekend ? { level: "fast", label: "Great Lent — wine & oil permitted" } : { level: "strict", label: "Great Lent — strict fast" };
  }
  if (between(palmSunday, addDays(pascha, -1))) return { level: "strict", label: "Holy Week — strict fast" };

  if (between(nativityFastStart, addDays(nativity, -1))) return { level: "fast", label: "Nativity Fast" };
  if (between(apostlesFastStart, apostlesFastEnd)) return { level: "fast", label: "Apostles' Fast" };
  if (between(dormitionFastStart, dormitionFastEnd)) return { level: "strict", label: "Dormition Fast" };

  if (d.getDay() === 3) return { level: "fast", label: "Wednesday fast" };
  if (d.getDay() === 5) return { level: "fast", label: "Friday fast" };

  return null;
}

/** Dispatches to the right tradition's fasting resolver. */
export function fastingFor(tradition, date, calendarStyle) {
  if (tradition === "Catholic") return catholicFastingFor(date);
  if (tradition === "Anglican") return anglicanFastingFor(date);
  if (tradition === "Orthodox") return orthodoxFastingFor(date, calendarStyle);
  return null;
}

// ---------------------------------------------------------------------
// Static "what does this mean" reference content for each tradition's
// fasting levels, shown from an info link on the Fasting card rather
// than computed per-date. Order matters — displayed strictest-first.
// Each entry's `level` matches the `level` values returned above, so the
// UI can highlight whichever row corresponds to today's observance.
// ---------------------------------------------------------------------
export const FASTING_LEVEL_INFO = {
  Catholic: {
    intro:
      "The Latin Rite's fasting and abstinence discipline, per the 1983 Code of Canon Law plus the UK bishops' 2011 restoration of year-round Friday abstinence.",
    levels: [
      {
        level: "strict",
        title: "Fast & abstinence",
        description:
          "One full meal, with two smaller meals that together don't add up to a full meal — and no meat. Kept on Ash Wednesday and Good Friday.",
      },
      {
        level: "abstinence",
        title: "Abstinence",
        description: "No meat, with no limit on the amount eaten. Kept on Fridays, especially through Lent.",
      },
    ],
    note: "This reflects the modern Novus Ordo norm, not the fuller fasting calendar historically kept in the Traditional Latin Mass (all of Lent as fast days, Ember days, vigils).",
  },
  Anglican: {
    intro:
      "The 1662 Book of Common Prayer's \"Table of Fasts\" — days of fasting and self-denial rather than a fixed food code.",
    levels: [
      {
        level: "strict",
        title: "The two great fasts",
        description: "Ash Wednesday and Good Friday, the most solemn fasts of the year.",
      },
      {
        level: "fast",
        title: "Lent, Ember & Rogation days",
        description:
          "The Forty Days of Lent, the four sets of Ember Days through the year, and the three Rogation Days before Ascension — traditionally kept with simpler meals and a measure of self-denial.",
      },
      {
        level: "abstinence",
        title: "Friday abstinence",
        description: "No meat, kept every Friday of the year except Christmas Day.",
      },
    ],
    note: "The BCP itself doesn't prescribe specific food rules for these days beyond \"fasting and abstinence\" — the practical detail has always been left to conscience and custom.",
  },
  Orthodox: {
    intro:
      "Orthodox fasting centres on abstaining from animal products — and, on the strictest days, wine and oil too — across the rhythm of the whole church year, not just single days.",
    levels: [
      {
        level: "strict",
        title: "Strict fast",
        description:
          "No meat, dairy, eggs, wine, or oil. The most ascetic days — weekdays of Great Lent, Holy Week, the Dormition Fast, and the eves of Nativity and Theophany.",
      },
      {
        level: "fast",
        title: "Fast — wine & oil permitted",
        description:
          "No meat, dairy, or eggs, but wine and oil are allowed. The everyday rhythm of the four fasting seasons and the weekly Wednesday/Friday fast.",
      },
      {
        level: "fast-free",
        title: "Fast-free",
        description:
          "No fasting restrictions at all. The weeks that lift the fast entirely — Bright Week, the week after Pentecost, and Nativity to Theophany Eve.",
      },
    ],
    note: "This app uses a simplified two-level fasting/strict system. Real practice has finer traditional grades (e.g. fish permitted on certain feast days) that aren't reflected here.",
  },
};
