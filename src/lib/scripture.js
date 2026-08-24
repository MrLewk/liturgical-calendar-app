import { parseReference, formatReference } from "./bibleRef";
import { bookDisplayName } from "../data/bibleBooks";

// Which WEB edition backs each tradition by default (overridable in Settings
// — see officium-bible-version in App.jsx). Matches the folder names under
// /public/bible/.
export const DEFAULT_WEB_VERSION = {
  Catholic: "eng-web-c",
  Anglican: "eng-webbe",
  Orthodox: "engwebu",
};

export const WEB_VERSION_LABELS = {
  "eng-web-c": "World English Bible (Catholic)",
  "eng-webbe": "World English Bible (British, with Apocrypha)",
  "engwebu": "World English Bible (Updated, with Apocrypha)",
};

// A handful of books are split differently in the Catholic edition (Greek
// additions folded into Daniel/Esther rather than kept separate). If the
// resolved code isn't present in a given version, fall back to its merged
// counterpart so a reference still resolves to *something* readable.
const CODE_FALLBACK = {
  DAN: "DAG",
  EST: "ESG",
};

const bookCache = new Map(); // `${version}/${code}` -> parsed JSON (or in-flight promise)

async function fetchBook(version, code) {
  const cacheKey = `${version}/${code}`;
  if (bookCache.has(cacheKey)) return bookCache.get(cacheKey);
  const promise = fetch(`/bible/${version}/${code}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`not found: ${cacheKey}`);
      return res.json();
    })
    .catch((err) => {
      bookCache.delete(cacheKey); // don't cache failures
      throw err;
    });
  bookCache.set(cacheKey, promise);
  return promise;
}

/**
 * Fetches and assembles the full text of a scripture reference from a
 * bundled WEB edition. Returns { reference, bookName, version, verses }
 * where verses is [{ chapter, verse, text }, ...] in reading order, or
 * throws if the reference can't be parsed or the book/version has no data.
 */
export async function getPassage(refString, version) {
  const parsed = parseReference(refString);
  if (!parsed) throw new Error(`Could not understand reference "${refString}"`);

  let book;
  try {
    book = await fetchBook(version, parsed.code);
  } catch {
    const fallbackCode = CODE_FALLBACK[parsed.code];
    if (!fallbackCode) throw new Error(`"${parsed.bookName}" isn't available in this edition.`);
    book = await fetchBook(version, fallbackCode);
  }

  const ranges = parsed.ranges && parsed.ranges.length ? parsed.ranges : [parsed];
  const verses = [];
  const resolvedRanges = [];
  for (const range of ranges) {
    const rangeVerses = [];
    for (let ch = range.startChapter; ch <= range.endChapter; ch++) {
      const chapterVerses = book.chapters[String(ch)];
      if (!chapterVerses) continue;
      const verseNums = Object.keys(chapterVerses)
        .map(Number)
        .sort((a, b) => a - b);
      for (const v of verseNums) {
        const afterStart = ch > range.startChapter || range.startVerse === null || v >= range.startVerse;
        const beforeEnd = ch < range.endChapter || range.endVerse === null || v <= range.endVerse;
        if (afterStart && beforeEnd) {
          rangeVerses.push({ chapter: ch, verse: v, text: chapterVerses[String(v)] });
        }
      }
    }
    // A range that skips ahead of the previous one (a comma-joined
    // selection like "2:1-3, 14-end") gets a gap marker between them so
    // the reader can see verses were intentionally skipped, not lost.
    if (verses.length > 0 && rangeVerses.length > 0) {
      verses.push({ gap: true, chapter: null, verse: null, text: null });
    }
    verses.push(...rangeVerses);

    // Resolve an open-ended "26-end" piece to its real last verse now that
    // the chapter text is actually loaded, so the displayed reference reads
    // "Acts 8:26-39" rather than leaving the literal word "end" in it.
    let resolvedEndVerse = range.endVerse;
    if (resolvedEndVerse === null && range.startVerse !== null && rangeVerses.length > 0) {
      resolvedEndVerse = rangeVerses[rangeVerses.length - 1].verse;
    }
    resolvedRanges.push({ ...range, endVerse: resolvedEndVerse });
  }

  const displayParsed = { ...parsed, ranges: resolvedRanges };

  return {
    reference: formatReference(displayParsed, book.name || bookDisplayName(parsed.code)),
    bookName: book.name || bookDisplayName(parsed.code),
    version,
    verses,
  };
}

/** Builds a biblegateway.com passage URL for the given reference and version code (e.g. "NRSVA"). */
export function bibleGatewayUrl(refString, bibleGatewayVersion) {
  const query = encodeURIComponent(refString.replace(/[\u2012\u2013\u2014\u2015]/g, "-"));
  return `https://www.biblegateway.com/passage/?search=${query}&version=${encodeURIComponent(bibleGatewayVersion)}`;
}
