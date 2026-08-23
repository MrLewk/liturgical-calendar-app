// Turns a raw lectionary citation string — which may bundle several
// readings together, use "or" alternatives, dot notation, verse-letter
// suffixes, comma verse-lists, or an "end" placeholder for the last verse
// — into one or more clean reference strings that `parseReference` /
// `getPassage` can actually resolve. Best-effort: prefers showing a
// slightly wider/narrower real passage over failing to resolve at all.

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
  return s.replace(/(\d)\.(\d)/g, "$1:$2");
}

function firstAlternative(s) {
  const idx = s.search(/\s+or\s+/i);
  return idx === -1 ? s : s.slice(0, idx);
}

function stripVerseLetterSuffixes(s) {
  return s.replace(/(\d)[a-z]\b/g, "$1");
}

function dropEndMarker(s) {
  if (/-end\b/i.test(s)) {
    return s.replace(/(\d+):\d+-end\b/i, "$1");
  }
  return s;
}

function dropExtraCommaRanges(s) {
  const m = s.match(/^(.*?\d)(?:,\s*\d+(?:-\d+)?)+$/);
  return m ? m[1] : s;
}

function cleanOne(raw) {
  let s = normalizeDashes(raw.trim());
  s = stripOptionalBrackets(s);
  s = firstAlternative(s);
  s = dotsToColons(s);
  s = stripVerseLetterSuffixes(s);
  s = dropEndMarker(s);
  s = dropExtraCommaRanges(s);
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
