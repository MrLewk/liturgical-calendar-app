import { addDays, icsDate } from "./dates";

function escapeText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function foldLine(line) {
  // RFC 5545: lines should be folded at 75 octets. Simple char-based fold
  // is fine here since our content is plain ASCII/Latin-1.
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += "\r\n " + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out;
}

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return `ordo-${Date.now()}-${uidCounter}@officium.app`;
}

/**
 * One all-day VEVENT. `start`/`end` are Dates; for multi-day season blocks
 * `end` should be the LAST included day (this function adds the +1 day
 * ICS's exclusive DTEND requires). `color` is a hex string, applied via the
 * RFC 7986 COLOR property (supported by Apple Calendar, Fastmail, etc.) —
 * clients that ignore it just show the event without special color.
 */
function vevent({ summary, description, start, end, color }) {
  const dtStart = icsDate(start);
  const dtEnd = icsDate(addDays(end, 1)); // ICS DTEND is exclusive
  const lines = [
    "BEGIN:VEVENT",
    `UID:${nextUid()}`,
    `DTSTAMP:${icsDate(new Date())}T120000Z`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (color) {
    lines.push(`COLOR:${colorNameFor(color)}`);
    lines.push(`X-APPLE-CALENDAR-COLOR:${color}`);
    lines.push(`CATEGORIES:${escapeText(colorNameFor(color))}`);
  }
  lines.push("TRANSP:TRANSPARENT");
  lines.push("END:VEVENT");
  return lines; // unfolded; caller folds once at the end
}

// RFC 7986 COLOR wants a CSS3 extended color keyword rather than a hex
// value, so map our liturgical palette to the nearest keyword. Apps that
// don't support COLOR fall back gracefully and just show the event plain.
const COLOR_NAMES = {
  "#5B3B8C": "purple",
  "#EDE7DC": "ivory",
  "#C9A227": "gold",
  "#A32638": "firebrick",
  "#3F6B4F": "seagreen",
  "#C97BA0": "palevioletred",
};
function colorNameFor(hex) {
  return COLOR_NAMES[hex] || "gray";
}

/**
 * Builds a full .ics file (VCALENDAR) for one tradition: one multi-day
 * all-day event per liturgical season block, plus one all-day event per
 * feast day.
 */
export function buildIcs({ traditionLabel, seasons, feasts }) {
  const eventLines = [];
  for (const s of seasons) {
    eventLines.push(
      ...vevent({
        summary: `${s.name}${s.latin ? " (" + s.latin + ")" : ""}`,
        description: `${traditionLabel} liturgical season: ${s.name}`,
        start: s.start,
        end: s.end,
        color: s.color,
      })
    );
  }
  for (const f of feasts) {
    eventLines.push(
      ...vevent({
        summary: f.name,
        description: [f.rank, `${traditionLabel} calendar`].filter(Boolean).join(" · "),
        start: f.date,
        end: f.date,
        color: f.color,
      })
    );
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Officium//Liturgical Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(traditionLabel + " Liturgical Calendar")}`,
    ...eventLines,
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Triggers a browser download of the given ICS text. */
export function downloadIcs(filename, icsText) {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
