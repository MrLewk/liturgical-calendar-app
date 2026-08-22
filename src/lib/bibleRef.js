import { resolveBookCode } from "../data/bibleBooks";

// Normalizes the various dash characters lectionaries use (en dash, em dash,
// hyphen) to a plain hyphen so the regexes below only need to handle one.
function normalizeDashes(s) {
  return s.replace(/[\u2012\u2013\u2014\u2015]/g, "-");
}

/**
 * Parses a scripture reference like "Isaiah 26:1-9", "1 Corinthians 9:2-12",
 * "Psalm 71:1-6", or "Luke 1:26-2:7" into a structured range.
 *
 * Returns null if the book name can't be resolved. Chapter-only references
 * ("John 3") resolve to the whole chapter. Verse-less single-chapter books
 * are not specially handled (none of the WEB editions have one).
 *
 * Shape: { code, bookName, startChapter, startVerse, endChapter, endVerse }
 * startVerse/endVerse are null when the reference is a whole chapter (or
 * whole chapter range).
 */
export function parseReference(raw) {
  if (!raw) return null;
  const text = normalizeDashes(raw.trim());

  // Split off the book name from the leading numeral/chapter:verse part.
  // Book names can themselves start with a digit (1 Corinthians), so match
  // the LAST run of "<chapter>[:<verse>][-...]" as the locator.
  const m = text.match(/^(.*?)\s+(\d+(?::\d+)?(?:\s*-\s*\d+(?::\d+)?)?)\s*$/);
  if (!m) return null;
  const [, bookRaw, locator] = m;
  const code = resolveBookCode(bookRaw);
  if (!code) return null;

  const parts = locator.split("-").map((p) => p.trim());
  const [startChapter, startVerse] = splitChapterVerse(parts[0]);
  let endChapter = startChapter;
  let endVerse = startVerse;
  if (parts[1]) {
    const [ec, ev] = splitChapterVerse(parts[1]);
    if (ev !== null) {
      // "1:26-2:7" style — explicit chapter:verse on both ends
      endChapter = ec;
      endVerse = ev;
    } else {
      // "26:1-9" style — second number is just a verse in the same chapter
      endChapter = startChapter;
      endVerse = ec;
    }
  }

  return {
    code,
    bookName: bookRaw.trim(),
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  };
}

function splitChapterVerse(part) {
  const [c, v] = part.split(":");
  return [parseInt(c, 10), v !== undefined ? parseInt(v, 10) : null];
}

/** Formats a parsed reference back into a display string, e.g. for headings. */
export function formatReference(ref, bookName) {
  if (!ref) return "";
  const name = bookName || ref.bookName;
  if (ref.startVerse === null) {
    return ref.startChapter === ref.endChapter
      ? `${name} ${ref.startChapter}`
      : `${name} ${ref.startChapter}-${ref.endChapter}`;
  }
  if (ref.startChapter === ref.endChapter) {
    return ref.startVerse === ref.endVerse
      ? `${name} ${ref.startChapter}:${ref.startVerse}`
      : `${name} ${ref.startChapter}:${ref.startVerse}-${ref.endVerse}`;
  }
  return `${name} ${ref.startChapter}:${ref.startVerse}-${ref.endChapter}:${ref.endVerse}`;
}
