import { parseReference, formatReference } from "./bibleRef";
import { bookDisplayName, BIBLE_BOOKS } from "../data/bibleBooks";

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

// Books are only cached offline (via the service worker's CacheFirst rule)
// the first time they're actually opened while online — see the note in
// vite.config.js. So a book that's never been read before genuinely isn't
// available offline, and on a real connection a request can also just
// stall (e.g. signal dropping mid-fetch) rather than failing outright.
// Without a timeout, a bare fetch() leaves the caller stuck on "Loading
// passage…" forever. Aborting after a few seconds turns that into the
// existing, already-handled error state instead.
const FETCH_TIMEOUT_MS = 8000;

async function fetchBook(version, code) {
  const cacheKey = `${version}/${code}`;
  if (bookCache.has(cacheKey)) return bookCache.get(cacheKey);

  const promise = (async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("You're offline and this passage hasn't been downloaded yet.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`/bible/${version}/${code}.json`, { signal: controller.signal });
      if (!res.ok) {
        // Distinguished from network/offline/timeout failures below — this
        // is the one case getPassage() should react to by trying
        // CODE_FALLBACK, since it means the book genuinely isn't part of
        // this edition rather than that the request failed to complete.
        const err = new Error(`not found: ${cacheKey}`);
        err.notFound = true;
        throw err;
      }
      return await res.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Couldn't load that passage — check your connection and try again.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  })().catch((err) => {
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
  } catch (err) {
    // Only a genuine "this book isn't in this edition" result should try
    // the merged-book fallback. A network/offline/timeout error means the
    // request never really resolved either way — surfacing it as-is is
    // more honest than a misleading "isn't available" message, and lets
    // the person retry once they have signal again.
    if (!err.notFound) throw err;
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

// Every book code that appears in any of the three bundled WEB editions.
// Not every code exists in every edition (deuterocanon differs between
// them) — downloadVersionForOffline() just skips the ones that 404 for a
// given version rather than needing a separate manifest per edition.
const ALL_BOOK_CODES = [...new Set(BIBLE_BOOKS.map((b) => b.code))];

/**
 * Fetches every book of a given WEB edition so the service worker's
 * CacheFirst rule caches all of it up front, rather than one book at a
 * time as someone happens to open readings. Meant for a "download for
 * offline" setting, not called on every app load. Uses a plain fetch
 * (bypassing bookCache) so the ~5MB of parsed text isn't held in memory
 * for the rest of the session — the point here is populating the service
 * worker's cache, not the in-memory one. Skips codes that don't apply to
 * this edition; reports { done, total } after each attempt so callers can
 * show progress.
 */
export async function downloadVersionForOffline(version, onProgress) {
  const total = ALL_BOOK_CODES.length;
  let done = 0;
  let downloaded = 0;
  for (const code of ALL_BOOK_CODES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`/bible/${version}/${code}.json`, { signal: controller.signal });
        if (res.ok) {
          await res.blob(); // drain the body so the SW actually caches a complete response
          downloaded++;
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // Not part of this edition, offline, or a transient failure — move on.
    }
    done++;
    onProgress?.({ done, total, downloaded });
  }
  return { done, total, downloaded };
}

/** Builds a biblegateway.com passage URL for the given reference and version code (e.g. "NRSVA"). */
export function bibleGatewayUrl(refString, bibleGatewayVersion) {
  const query = encodeURIComponent(refString.replace(/[\u2012\u2013\u2014\u2015]/g, "-"));
  return `https://www.biblegateway.com/passage/?search=${query}&version=${encodeURIComponent(bibleGatewayVersion)}`;
}
