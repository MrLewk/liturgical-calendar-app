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

// Same cache name as the CacheFirst runtime rule in vite.config.js. Writing
// to it directly (rather than relying on the service worker to intercept
// fetch() and populate it) matters because a page isn't actually controlled
// by the service worker until its first reload after install — any fetch
// made before that reload (e.g. tapping "Download for offline" in the very
// first session) would otherwise go straight to the network and cache
// nothing, silently. Reading from it directly first also means a
// previously-downloaded book works offline even if the service worker
// somehow isn't in control at that moment.
const BIBLE_CACHE_NAME = "bible-text";

async function readFromCache(url) {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(BIBLE_CACHE_NAME);
    const match = await cache.match(url);
    return match ? await match.clone().json() : null;
  } catch {
    return null; // Cache Storage unavailable or corrupt entry — fall through to network
  }
}

async function writeToCache(url, response) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(BIBLE_CACHE_NAME);
    await cache.put(url, response.clone());
  } catch {
    // Non-fatal — the read still succeeds this time, it just won't be
    // available offline next time.
  }
}

// Books are only cached offline the first time they're actually opened
// while online — see the note on BIBLE_CACHE_NAME above. So a book that's
// never been read before genuinely isn't available offline, and on a real
// connection a request can also just stall (e.g. signal dropping mid-fetch)
// rather than failing outright. Without a timeout, a bare fetch() leaves
// the caller stuck on "Loading passage…" forever. Aborting after a few
// seconds turns that into the existing, already-handled error state instead.
const FETCH_TIMEOUT_MS = 8000;

async function fetchBook(version, code) {
  const cacheKey = `${version}/${code}`;
  if (bookCache.has(cacheKey)) return bookCache.get(cacheKey);

  const promise = (async () => {
    const url = `/bible/${version}/${code}.json`;

    const cached = await readFromCache(url);
    if (cached) return cached;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("You're offline and this passage hasn't been downloaded yet.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        // Distinguished from network/offline/timeout failures below — this
        // is the one case getPassage() should react to by trying
        // CODE_FALLBACK, since it means the book genuinely isn't part of
        // this edition rather than that the request failed to complete.
        const err = new Error(`not found: ${cacheKey}`);
        err.notFound = true;
        throw err;
      }
      await writeToCache(url, res.clone());
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
 * Fetches every book of a given WEB edition and writes it straight into
 * Cache Storage (see BIBLE_CACHE_NAME above) so it's available offline
 * immediately — not dependent on the service worker being in control of
 * the page yet. Meant for a "download for offline" setting, not called on
 * every app load. Uses a plain fetch (bypassing bookCache) so the ~5MB of
 * parsed text isn't held in memory for the rest of the session. Skips
 * codes that don't apply to this edition; reports { done, total } after
 * each attempt so callers can show progress.
 *
 * Refuses to start while offline rather than "succeeding" on whatever
 * happens to already be cached from previous sessions — a person tapping
 * this specifically wants a real download, and a false "done" would leave
 * them stranded on exactly the readings they haven't opened before.
 */
export async function downloadVersionForOffline(version, onProgress) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("You're offline — connect to the internet and try again.");
  }
  if (typeof caches === "undefined") {
    throw new Error("Offline storage isn't available in this browser.");
  }

  const cache = await caches.open(BIBLE_CACHE_NAME);
  const total = ALL_BOOK_CODES.length;
  let done = 0;
  let downloaded = 0;
  for (const code of ALL_BOOK_CODES) {
    const url = `/bible/${version}/${code}.json`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          await cache.put(url, res.clone());
          downloaded++;
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // Not part of this edition, connection dropped mid-book, or a
      // transient failure — move on rather than aborting the whole run.
    }
    done++;
    onProgress?.({ done, total, downloaded });
  }
  if (downloaded === 0) throw new Error("Nothing downloaded — check your connection and try again.");
  return { done, total, downloaded };
}

/** Builds a biblegateway.com passage URL for the given reference and version code (e.g. "NRSVA"). */
export function bibleGatewayUrl(refString, bibleGatewayVersion) {
  const query = encodeURIComponent(refString.replace(/[\u2012\u2013\u2014\u2015]/g, "-"));
  return `https://www.biblegateway.com/passage/?search=${query}&version=${encodeURIComponent(bibleGatewayVersion)}`;
}
