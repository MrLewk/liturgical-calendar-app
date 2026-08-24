import { resolveBookCode } from "../data/bibleBooks";

// Normalizes the various dash characters lectionaries use (en dash, em dash,
// hyphen) to a plain hyphen so the regexes below only need to handle one.
function normalizeDashes(s) {
  return s.replace(/[\u2012\u2013\u2014\u2015]/g, "-");
}

/**
 * Parses a scripture reference like "Isaiah 26:1-9", "1 Corinthians 9:2-12",
 * "Psalm 71:1-6", "Luke 1:26-2:7", or a comma-joined selection like
 * "2 Thessalonians 2:1-3, 14-end" into a structured range.
 *
 * Returns null if the book name can't be resolved. Chapter-only references
 * ("John 3") resolve to the whole chapter. Verse-less single-chapter books
 * are not specially handled (none of the WEB editions have one).
 *
 * Shape: { code, bookName, startChapter, startVerse, endChapter, endVerse,
 * ranges }. startChapter/startVerse/endChapter/endVerse describe the overall
 * span (first range's start to last range's end) for callers that only need
 * a quick bound; `ranges` is the full list of one or more individual
 * {startChapter, startVerse, endChapter, endVerse} pieces to actually
 * collect verses from — most references have exactly one. A bare verse
 * number after a comma (e.g. the "14" in "2:1-3, 14-end") is read as a verse
 * within the chapter the previous piece ended in, the normal lectionary
 * shorthand. endVerse is null when that piece runs to the end of its
 * chapter (either a whole-chapter reference, or a literal "end" marker like
 * "8:26-end") — the caller resolves that against real chapter data (see
 * getPassage in scripture.js) rather than the parser guessing a verse count.
 */
export function parseReference(raw) {
  if (!raw) return null;
  const text = normalizeDashes(raw.trim());

  // Split off the book name from the leading numeral/chapter:verse part.
  // Book names can themselves start with a digit (1 Corinthians), so match
  // the LAST run of "<piece>[, <piece>]*" as the locator, where each piece
  // is a chapter[:verse], optionally ranged to another chapter[:verse] or
  // the literal word "end".
  const piece = "\\d+(?::\\d+)?(?:\\s*-\\s*(?:\\d+(?::\\d+)?|end))?";
  const m = text.match(new RegExp(`^(.*?)\\s+(${piece}(?:\\s*,\\s*${piece})*)\\s*$`, "i"));
  if (!m) return null;
  const [, bookRaw, locator] = m;
  const code = resolveBookCode(bookRaw);
  if (!code) return null;

  const ranges = [];
  let contextChapter = null;
  for (const part of locator.split(",").map((p) => p.trim())) {
    const range = parseLocatorPiece(part, contextChapter);
    ranges.push(range);
    contextChapter = range.endChapter;
  }

  const first = ranges[0];
  const last = ranges[ranges.length - 1];

  return {
    code,
    bookName: bookRaw.trim(),
    startChapter: first.startChapter,
    startVerse: first.startVerse,
    endChapter: last.endChapter,
    endVerse: last.endVerse,
    ranges,
  };
}

/**
 * Parses one comma-separated piece of a locator (e.g. "2:1-3", "14-end", or
 * a bare "18"). `contextChapter` is the chapter the previous piece ended
 * in, used when this piece has no chapter of its own — the standard
 * shorthand for "same chapter, different verses" after a comma.
 */
function parseLocatorPiece(part, contextChapter) {
  const [startRaw, endRaw] = part.split("-").map((p) => p.trim());

  let startChapter;
  let startVerse;
  if (startRaw.includes(":")) {
    [startChapter, startVerse] = splitChapterVerse(startRaw);
  } else if (contextChapter !== null) {
    // Bare number continuing a previous piece — a verse in that chapter.
    startChapter = contextChapter;
    startVerse = parseInt(startRaw, 10);
  } else {
    // Bare number with nothing before it — a whole-chapter reference.
    startChapter = parseInt(startRaw, 10);
    startVerse = null;
  }

  let endChapter = startChapter;
  let endVerse = startVerse;
  if (endRaw !== undefined) {
    if (/^end$/i.test(endRaw)) {
      endChapter = startChapter;
      endVerse = null;
    } else if (endRaw.includes(":")) {
      // "1:26-2:7" style — explicit chapter:verse on both ends
      [endChapter, endVerse] = splitChapterVerse(endRaw);
    } else {
      // "26:1-9" style — second number is just a verse in the same chapter
      endChapter = startChapter;
      endVerse = parseInt(endRaw, 10);
    }
  }

  return { startChapter, startVerse, endChapter, endVerse };
}

function splitChapterVerse(part) {
  const [c, v] = part.split(":");
  return [parseInt(c, 10), v !== undefined ? parseInt(v, 10) : null];
}

/** Formats a parsed reference back into a display string, e.g. for headings.
 * Multiple ranges (from a comma-joined citation) are joined with ", ",
 * omitting the repeated chapter number when a later piece shares the
 * previous piece's chapter — "2:1-3, 14-end" rather than "2:1-3, 2:14-end".
 * When a piece's endVerse is null but its startVerse isn't (the "26-end"
 * case), displays the literal "-end" rather than a guessed number —
 * getPassage resolves it to the real last verse once the chapter text is
 * actually loaded. */
export function formatReference(ref, bookName) {
  if (!ref) return "";
  const name = bookName || ref.bookName;
  const ranges = ref.ranges && ref.ranges.length ? ref.ranges : [ref];

  let prevChapter = null;
  const parts = ranges.map((r) => {
    const piece = formatPiece(r, prevChapter);
    prevChapter = r.endChapter;
    return piece;
  });
  return `${name} ${parts.join(", ")}`;
}

function formatPiece(r, prevChapter) {
  const sameChapterAsPrev = prevChapter !== null && r.startChapter === prevChapter;
  if (r.startVerse === null) {
    // Whole-chapter piece.
    if (r.startChapter === r.endChapter) return sameChapterAsPrev ? "" : `${r.startChapter}`;
    return `${r.startChapter}-${r.endChapter}`;
  }
  const startStr = sameChapterAsPrev ? `${r.startVerse}` : `${r.startChapter}:${r.startVerse}`;
  if (r.startChapter === r.endChapter && r.startVerse === r.endVerse) return startStr;
  const endStr = r.endVerse === null ? "end" : r.endChapter === r.startChapter ? r.endVerse : `${r.endChapter}:${r.endVerse}`;
  return `${startStr}-${endStr}`;
}
