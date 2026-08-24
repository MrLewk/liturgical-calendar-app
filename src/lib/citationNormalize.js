// Turns a raw lectionary citation string — which may bundle several
// readings together, use "or" alternatives, dot notation, verse-letter
// suffixes, comma verse-lists, footnote asterisks, or an "end" placeholder
// for the last verse — into one or more clean reference strings that
// `parseReference` / `getPassage` can actually resolve. Comma verse-lists
// within a single reading (e.g. "2:1-3, 14-end") are passed through intact
// rather than truncated — parseReference itself understands them as
// multiple pieces of one reading. Best-effort: prefers showing a slightly
// wider/narrower real passage over failing to resolve at all.

function normalizeDashes(s) {
  return s.replace(/[\u2012\u2013\u2014\u2015]/g, "-");
}

function stripOptionalBrackets(s) {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/:\s*,/g, ":")
    .replace(/,\s*,/g, ",")
    .replace(/^\s*,\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/,\s*$/, "");
}

function dotsToColons(s) {
  return s.replace(/(\d)\.\s*(\d)/g, "$1:$2");
}

function firstAlternative(s) {
  const idx = s.search(/\s+or\s+/i);
  return idx === -1 ? s : s.slice(0, idx);
}

function stripVerseLetterSuffixes(s) {
  return s.replace(/(\d)[a-z]\b/g, "$1");
}

function normalizeEndMarker(s) {
  // Just tidies spacing/casing around a literal "end" — parseReference
  // (bibleRef.js) now understands "8:26-end" natively and resolves it to
  // the chapter's real last verse once the text is loaded, so this no
  // longer needs to guess or collapse the range down to a bare chapter.
  return s.replace(/-\s*end\b/i, "-end");
}

function stripFootnoteAsterisk(s) {
  // Common Worship marks some psalms with a trailing "*" (may be read in a
  // shortened form) — not part of the reference itself.
  return s.replace(/\*/g, "").trim();
}

function cleanOne(raw) {
  let s = normalizeDashes(raw.trim());
  s = stripOptionalBrackets(s);
  s = firstAlternative(s);
  s = dotsToColons(s);
  s = stripVerseLetterSuffixes(s);
  s = normalizeEndMarker(s);
  s = stripFootnoteAsterisk(s);
  return s.trim();
}

function isBareLocator(s) {
  return !/[a-zA-Z]/.test(s);
}

/**
 * Splits a raw citation into clean, individually-parseable reference
 * strings. Handles DEL's "Ref; Ref; Ref" and RCL's "Ref and Ref" joins.
 * A same-book continuation like "1 Peter 4:12-14; 5:6-11" is treated as
 * two references; the bare "5:6-11" continuation is dropped since it
 * can't resolve without its book name (a known gap for this citation
 * style — rare in the transcribed tables).
 */
export function splitCitation(rawCitation) {
  if (!rawCitation) return [];
  const clauses = rawCitation.split(/;| and /i);
  const out = [];
  for (const clause of clauses) {
    const cleaned = cleanOne(clause);
    if (!cleaned || isBareLocator(cleaned)) continue;
    out.push(cleaned);
  }
  return out;
}
