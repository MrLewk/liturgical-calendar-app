// Canonical Bible book metadata used to resolve a human-readable reference
// (e.g. "Isaiah 26:1-9", "1 Corinthians 9:2-12") to a book code we can look
// up in the extracted WEB-edition passage files under /bible/{version}/.
// `code` matches the WEB epub USFM-style file codes. Deuterocanon/Apocrypha
// books are included since two of the three bundled WEB editions carry them.
export const BIBLE_BOOKS = [
  {
    "code": "GEN",
    "name": "Genesis",
    "aliases": [
      "ge",
      "gen",
      "genesis",
      "gn"
    ]
  },
  {
    "code": "EXO",
    "name": "Exodus",
    "aliases": [
      "ex",
      "exo",
      "exod",
      "exodus"
    ]
  },
  {
    "code": "LEV",
    "name": "Leviticus",
    "aliases": [
      "le",
      "lev",
      "leviticus",
      "lv"
    ]
  },
  {
    "code": "NUM",
    "name": "Numbers",
    "aliases": [
      "nb",
      "nm",
      "nu",
      "num",
      "numbers"
    ]
  },
  {
    "code": "DEU",
    "name": "Deuteronomy",
    "aliases": [
      "deut",
      "deuteronomy",
      "dt"
    ]
  },
  {
    "code": "JOS",
    "name": "Joshua",
    "aliases": [
      "josh",
      "joshua",
      "jsh"
    ]
  },
  {
    "code": "JDG",
    "name": "Judges",
    "aliases": [
      "jdgs",
      "jg",
      "judg",
      "judges"
    ]
  },
  {
    "code": "RUT",
    "name": "Ruth",
    "aliases": [
      "rth",
      "ru",
      "ruth"
    ]
  },
  {
    "code": "1SA",
    "name": "1 Samuel",
    "aliases": [
      "1 sa",
      "1 sam",
      "1 samuel",
      "1sa",
      "1sam",
      "1samuel",
      "first sa",
      "first sam",
      "first samuel",
      "firstsa",
      "firstsam",
      "firstsamuel",
      "i sa",
      "i sam",
      "i samuel"
    ]
  },
  {
    "code": "2SA",
    "name": "2 Samuel",
    "aliases": [
      "2 sa",
      "2 sam",
      "2 samuel",
      "2sa",
      "2sam",
      "2samuel",
      "ii sa",
      "ii sam",
      "ii samuel",
      "second sa",
      "second sam",
      "second samuel",
      "secondsa",
      "secondsam",
      "secondsamuel"
    ]
  },
  {
    "code": "1KI",
    "name": "1 Kings",
    "aliases": [
      "1 kgs",
      "1 ki",
      "1 kin",
      "1 kings",
      "1kgs",
      "1ki",
      "1kin",
      "1kings",
      "3 kgs",
      "3 kdms",
      "3kgs",
      "first kgs",
      "first ki",
      "first kin",
      "first kings",
      "firstkgs",
      "firstki",
      "firstkin",
      "firstkings",
      "i kgs",
      "i ki",
      "i kin",
      "i kings"
    ]
  },
  {
    "code": "2KI",
    "name": "2 Kings",
    "aliases": [
      "2 kgs",
      "2 ki",
      "2 kin",
      "2 kings",
      "2kgs",
      "2ki",
      "2kin",
      "2kings",
      "4 kgs",
      "4 kdms",
      "4kgs",
      "ii kgs",
      "ii ki",
      "ii kin",
      "ii kings",
      "second kgs",
      "second ki",
      "second kin",
      "second kings",
      "secondkgs",
      "secondki",
      "secondkin",
      "secondkings"
    ]
  },
  {
    "code": "1CH",
    "name": "1 Chronicles",
    "aliases": [
      "1 ch",
      "1 chr",
      "1 chron",
      "1 chronicles",
      "1ch",
      "1chr",
      "1chron",
      "1chronicles",
      "first ch",
      "first chr",
      "first chron",
      "first chronicles",
      "firstch",
      "firstchr",
      "firstchron",
      "firstchronicles",
      "i ch",
      "i chr",
      "i chron",
      "i chronicles"
    ]
  },
  {
    "code": "2CH",
    "name": "2 Chronicles",
    "aliases": [
      "2 ch",
      "2 chr",
      "2 chron",
      "2 chronicles",
      "2ch",
      "2chr",
      "2chron",
      "2chronicles",
      "ii ch",
      "ii chr",
      "ii chron",
      "ii chronicles",
      "second ch",
      "second chr",
      "second chron",
      "second chronicles",
      "secondch",
      "secondchr",
      "secondchron",
      "secondchronicles"
    ]
  },
  {
    "code": "EZR",
    "name": "Ezra",
    "aliases": [
      "ezr",
      "ezra"
    ]
  },
  {
    "code": "NEH",
    "name": "Nehemiah",
    "aliases": [
      "neh",
      "nehemiah"
    ]
  },
  {
    "code": "TOB",
    "name": "Tobit",
    "aliases": [
      "tb",
      "tob",
      "tobit"
    ]
  },
  {
    "code": "JDT",
    "name": "Judith",
    "aliases": [
      "jdt",
      "jth",
      "judith"
    ]
  },
  {
    "code": "EST",
    "name": "Esther",
    "aliases": [
      "est",
      "esth",
      "esther"
    ]
  },
  {
    "code": "ESG",
    "name": "Esther (Greek)",
    "aliases": [
      "additions to esther",
      "esther (greek)",
      "esther greek"
    ]
  },
  {
    "code": "1MA",
    "name": "1 Maccabees",
    "aliases": [
      "1 ma",
      "1 macc",
      "1 maccabees",
      "1 mc",
      "1ma",
      "1macc",
      "1maccabees",
      "1mc",
      "first ma",
      "first macc",
      "first maccabees",
      "first mc",
      "firstma",
      "firstmacc",
      "firstmaccabees",
      "firstmc",
      "i ma",
      "i macc",
      "i maccabees",
      "i mc"
    ]
  },
  {
    "code": "2MA",
    "name": "2 Maccabees",
    "aliases": [
      "2 ma",
      "2 macc",
      "2 maccabees",
      "2 mc",
      "2ma",
      "2macc",
      "2maccabees",
      "2mc",
      "ii ma",
      "ii macc",
      "ii maccabees",
      "ii mc",
      "second ma",
      "second macc",
      "second maccabees",
      "second mc",
      "secondma",
      "secondmacc",
      "secondmaccabees",
      "secondmc"
    ]
  },
  {
    "code": "3MA",
    "name": "3 Maccabees",
    "aliases": [
      "3 ma",
      "3 macc",
      "3 maccabees",
      "3 mc",
      "3ma",
      "3macc",
      "3maccabees",
      "3mc",
      "iii ma",
      "iii macc",
      "iii maccabees",
      "iii mc",
      "third ma",
      "third macc",
      "third maccabees",
      "third mc",
      "thirdma",
      "thirdmacc",
      "thirdmaccabees",
      "thirdmc"
    ]
  },
  {
    "code": "4MA",
    "name": "4 Maccabees",
    "aliases": [
      "4 ma",
      "4 macc",
      "4 maccabees",
      "4 mc",
      "4ma",
      "4macc",
      "4maccabees",
      "4mc",
      "fourth ma",
      "fourth macc",
      "fourth maccabees",
      "fourth mc",
      "fourthma",
      "fourthmacc",
      "fourthmaccabees",
      "fourthmc",
      "iv ma",
      "iv macc",
      "iv maccabees",
      "iv mc"
    ]
  },
  {
    "code": "1ES",
    "name": "1 Esdras",
    "aliases": [
      "1 esd",
      "1 esdr",
      "1 esdras",
      "1esd",
      "1esdr",
      "1esdras",
      "first esd",
      "first esdr",
      "first esdras",
      "firstesd",
      "firstesdr",
      "firstesdras",
      "i esd",
      "i esdr",
      "i esdras"
    ]
  },
  {
    "code": "2ES",
    "name": "2 Esdras",
    "aliases": [
      "2 esd",
      "2 esdr",
      "2 esdras",
      "2esd",
      "2esdr",
      "2esdras",
      "ii esd",
      "ii esdr",
      "ii esdras",
      "second esd",
      "second esdr",
      "second esdras",
      "secondesd",
      "secondesdr",
      "secondesdras"
    ]
  },
  {
    "code": "JOB",
    "name": "Job",
    "aliases": [
      "jb",
      "job"
    ]
  },
  {
    "code": "PSA",
    "name": "Psalms",
    "aliases": [
      "ps",
      "psalm",
      "psalms",
      "psm",
      "pss"
    ]
  },
  {
    "code": "PS2",
    "name": "Psalm 151",
    "aliases": [
      "psalm 151"
    ]
  },
  {
    "code": "PRO",
    "name": "Proverbs",
    "aliases": [
      "pr",
      "prov",
      "proverbs",
      "prv"
    ]
  },
  {
    "code": "ECC",
    "name": "Ecclesiastes",
    "aliases": [
      "eccl",
      "eccles",
      "ecclesiastes",
      "qoh"
    ]
  },
  {
    "code": "SNG",
    "name": "Song of Solomon",
    "aliases": [
      "cant",
      "canticles",
      "song",
      "song of solomon",
      "song of songs",
      "sos"
    ]
  },
  {
    "code": "WIS",
    "name": "Wisdom of Solomon",
    "aliases": [
      "wis",
      "wisdom",
      "wisdom of solomon",
      "wsd"
    ]
  },
  {
    "code": "SIR",
    "name": "Sirach",
    "aliases": [
      "ecclesiasticus",
      "ecclus",
      "sir",
      "sirach"
    ]
  },
  {
    "code": "ISA",
    "name": "Isaiah",
    "aliases": [
      "isa",
      "isaiah",
      "is"
    ]
  },
  {
    "code": "JER",
    "name": "Jeremiah",
    "aliases": [
      "jer",
      "jeremiah",
      "jr"
    ]
  },
  {
    "code": "LAM",
    "name": "Lamentations",
    "aliases": [
      "la",
      "lam",
      "lamentations"
    ]
  },
  {
    "code": "BAR",
    "name": "Baruch",
    "aliases": [
      "ba",
      "bar",
      "baruch"
    ]
  },
  {
    "code": "EZK",
    "name": "Ezekiel",
    "aliases": [
      "eze",
      "ezek",
      "ezekiel",
      "ezk"
    ]
  },
  {
    "code": "DAN",
    "name": "Daniel",
    "aliases": [
      "dan",
      "daniel",
      "dn"
    ]
  },
  {
    "code": "DAG",
    "name": "Daniel (Greek)",
    "aliases": [
      "additions to daniel",
      "daniel (greek)",
      "daniel greek"
    ]
  },
  {
    "code": "HOS",
    "name": "Hosea",
    "aliases": [
      "ho",
      "hos",
      "hosea"
    ]
  },
  {
    "code": "JOL",
    "name": "Joel",
    "aliases": [
      "jl",
      "joel"
    ]
  },
  {
    "code": "AMO",
    "name": "Amos",
    "aliases": [
      "am",
      "amos"
    ]
  },
  {
    "code": "OBA",
    "name": "Obadiah",
    "aliases": [
      "ob",
      "obad",
      "obadiah"
    ]
  },
  {
    "code": "JON",
    "name": "Jonah",
    "aliases": [
      "jnh",
      "jonah"
    ]
  },
  {
    "code": "MIC",
    "name": "Micah",
    "aliases": [
      "mc",
      "mic",
      "micah"
    ]
  },
  {
    "code": "NAM",
    "name": "Nahum",
    "aliases": [
      "na",
      "nah",
      "nahum"
    ]
  },
  {
    "code": "HAB",
    "name": "Habakkuk",
    "aliases": [
      "hab",
      "habakkuk",
      "hb"
    ]
  },
  {
    "code": "ZEP",
    "name": "Zephaniah",
    "aliases": [
      "zep",
      "zeph",
      "zephaniah",
      "zp"
    ]
  },
  {
    "code": "HAG",
    "name": "Haggai",
    "aliases": [
      "hag",
      "haggai",
      "hg"
    ]
  },
  {
    "code": "ZEC",
    "name": "Zechariah",
    "aliases": [
      "zc",
      "zec",
      "zech",
      "zechariah"
    ]
  },
  {
    "code": "MAL",
    "name": "Malachi",
    "aliases": [
      "mal",
      "malachi",
      "ml"
    ]
  },
  {
    "code": "MAN",
    "name": "Prayer of Manasses",
    "aliases": [
      "man",
      "manasses",
      "prayer of manasseh",
      "prayer of manasses"
    ]
  },
  {
    "code": "MAT",
    "name": "Matthew",
    "aliases": [
      "matt",
      "matthew",
      "mt"
    ]
  },
  {
    "code": "MRK",
    "name": "Mark",
    "aliases": [
      "mark",
      "mk",
      "mr"
    ]
  },
  {
    "code": "LUK",
    "name": "Luke",
    "aliases": [
      "lk",
      "luke"
    ]
  },
  {
    "code": "JHN",
    "name": "John",
    "aliases": [
      "jhn",
      "jn",
      "john"
    ]
  },
  {
    "code": "ACT",
    "name": "Acts",
    "aliases": [
      "ac",
      "acts"
    ]
  },
  {
    "code": "ROM",
    "name": "Romans",
    "aliases": [
      "rm",
      "ro",
      "rom",
      "romans"
    ]
  },
  {
    "code": "1CO",
    "name": "1 Corinthians",
    "aliases": [
      "1 co",
      "1 cor",
      "1 corinthians",
      "1co",
      "1cor",
      "1corinthians",
      "first co",
      "first cor",
      "first corinthians",
      "firstco",
      "firstcor",
      "firstcorinthians",
      "i co",
      "i cor",
      "i corinthians"
    ]
  },
  {
    "code": "2CO",
    "name": "2 Corinthians",
    "aliases": [
      "2 co",
      "2 cor",
      "2 corinthians",
      "2co",
      "2cor",
      "2corinthians",
      "ii co",
      "ii cor",
      "ii corinthians",
      "second co",
      "second cor",
      "second corinthians",
      "secondco",
      "secondcor",
      "secondcorinthians"
    ]
  },
  {
    "code": "GAL",
    "name": "Galatians",
    "aliases": [
      "ga",
      "gal",
      "galatians"
    ]
  },
  {
    "code": "EPH",
    "name": "Ephesians",
    "aliases": [
      "eph",
      "ephes",
      "ephesians"
    ]
  },
  {
    "code": "PHP",
    "name": "Philippians",
    "aliases": [
      "phil",
      "philippians",
      "php",
      "pp"
    ]
  },
  {
    "code": "COL",
    "name": "Colossians",
    "aliases": [
      "co",
      "col",
      "colossians"
    ]
  },
  {
    "code": "1TH",
    "name": "1 Thessalonians",
    "aliases": [
      "1 th",
      "1 thess",
      "1 thessalonians",
      "1th",
      "1thess",
      "1thessalonians",
      "first th",
      "first thess",
      "first thessalonians",
      "firstth",
      "firstthess",
      "firstthessalonians",
      "i th",
      "i thess",
      "i thessalonians"
    ]
  },
  {
    "code": "2TH",
    "name": "2 Thessalonians",
    "aliases": [
      "2 th",
      "2 thess",
      "2 thessalonians",
      "2th",
      "2thess",
      "2thessalonians",
      "ii th",
      "ii thess",
      "ii thessalonians",
      "second th",
      "second thess",
      "second thessalonians",
      "secondth",
      "secondthess",
      "secondthessalonians"
    ]
  },
  {
    "code": "1TI",
    "name": "1 Timothy",
    "aliases": [
      "1 ti",
      "1 tim",
      "1 timothy",
      "1ti",
      "1tim",
      "1timothy",
      "first ti",
      "first tim",
      "first timothy",
      "firstti",
      "firsttim",
      "firsttimothy",
      "i ti",
      "i tim",
      "i timothy"
    ]
  },
  {
    "code": "2TI",
    "name": "2 Timothy",
    "aliases": [
      "2 ti",
      "2 tim",
      "2 timothy",
      "2ti",
      "2tim",
      "2timothy",
      "ii ti",
      "ii tim",
      "ii timothy",
      "second ti",
      "second tim",
      "second timothy",
      "secondti",
      "secondtim",
      "secondtimothy"
    ]
  },
  {
    "code": "TIT",
    "name": "Titus",
    "aliases": [
      "tit",
      "titus"
    ]
  },
  {
    "code": "PHM",
    "name": "Philemon",
    "aliases": [
      "philem",
      "philemon",
      "phm",
      "pm"
    ]
  },
  {
    "code": "HEB",
    "name": "Hebrews",
    "aliases": [
      "heb",
      "hebrews"
    ]
  },
  {
    "code": "JAS",
    "name": "James",
    "aliases": [
      "james",
      "jas",
      "jm"
    ]
  },
  {
    "code": "1PE",
    "name": "1 Peter",
    "aliases": [
      "1 pe",
      "1 pet",
      "1 peter",
      "1 pt",
      "1pe",
      "1pet",
      "1peter",
      "1pt",
      "first pe",
      "first pet",
      "first peter",
      "first pt",
      "firstpe",
      "firstpet",
      "firstpeter",
      "firstpt",
      "i pe",
      "i pet",
      "i peter",
      "i pt"
    ]
  },
  {
    "code": "2PE",
    "name": "2 Peter",
    "aliases": [
      "2 pe",
      "2 pet",
      "2 peter",
      "2 pt",
      "2pe",
      "2pet",
      "2peter",
      "2pt",
      "ii pe",
      "ii pet",
      "ii peter",
      "ii pt",
      "second pe",
      "second pet",
      "second peter",
      "second pt",
      "secondpe",
      "secondpet",
      "secondpeter",
      "secondpt"
    ]
  },
  {
    "code": "1JN",
    "name": "1 John",
    "aliases": [
      "1 jhn",
      "1 jn",
      "1 john",
      "1jhn",
      "1jn",
      "1john",
      "first jhn",
      "first jn",
      "first john",
      "firstjhn",
      "firstjn",
      "firstjohn",
      "i jhn",
      "i jn",
      "i john"
    ]
  },
  {
    "code": "2JN",
    "name": "2 John",
    "aliases": [
      "2 jhn",
      "2 jn",
      "2 john",
      "2jhn",
      "2jn",
      "2john",
      "ii jhn",
      "ii jn",
      "ii john",
      "second jhn",
      "second jn",
      "second john",
      "secondjhn",
      "secondjn",
      "secondjohn"
    ]
  },
  {
    "code": "3JN",
    "name": "3 John",
    "aliases": [
      "3 jhn",
      "3 jn",
      "3 john",
      "3jhn",
      "3jn",
      "3john",
      "iii jhn",
      "iii jn",
      "iii john",
      "third jhn",
      "third jn",
      "third john",
      "thirdjhn",
      "thirdjn",
      "thirdjohn"
    ]
  },
  {
    "code": "JUD",
    "name": "Jude",
    "aliases": [
      "jd",
      "jude"
    ]
  },
  {
    "code": "REV",
    "name": "Revelation",
    "aliases": [
      "apoc",
      "apocalypse",
      "rev",
      "revelation"
    ]
  }
];

// Map of every lowercase alias -> canonical book code, built once at module
// load. The book's own display name and code are always included as aliases.
const ALIAS_MAP = new Map();
for (const book of BIBLE_BOOKS) {
  ALIAS_MAP.set(book.code.toLowerCase(), book.code);
  ALIAS_MAP.set(book.name.toLowerCase(), book.code);
  for (const alias of book.aliases) {
    if (!ALIAS_MAP.has(alias)) ALIAS_MAP.set(alias, book.code);
  }
}

/** Resolves a book name/abbreviation (any case, extra whitespace ok) to a canonical code, or null. */
export function resolveBookCode(rawName) {
  if (!rawName) return null;
  const key = rawName.trim().toLowerCase().replace(/\s+/g, " ").replace(/\.$/, "");
  return ALIAS_MAP.get(key) || null;
}

export function bookDisplayName(code) {
  const b = BIBLE_BOOKS.find((x) => x.code === code);
  return b ? b.name : code;
}
