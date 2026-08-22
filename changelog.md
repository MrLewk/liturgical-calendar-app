# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioning follows [Semantic Versioning](https://semver.org/).

## [0.9.1] — Fix Today tab crash

- **Fixed:** The Today tab crashed on load (`seasons is not defined`) — its desktop "year at a glance" wheel panel needed the live `seasons` data, which wasn't being passed down from the app root.

## [0.9.0] — Grid and Wheel tabs wired to live dates

- **Added:** `src/lib/feasts.js` gained `seasonAt()`, `feastOnDate()`, `upcomingFeasts()`, `weekLabel()`, and `withDisplay()` — general-purpose lookups (season/feast for an arbitrary date, sorted upcoming feasts merging the current and next liturgical year so the list never runs dry near a year boundary) plus a proper liturgical week/Sunday-numbering engine that the UI now uses everywhere instead of the old hand-picked demo data.
- **Added:** Grid tab now renders the real current month — correct season color per day (bottom border) and a feast-day dot, sourced from the live date engine — with prev/next month navigation and a "Today" shortcut when you've navigated away. Tapping a day opens its real season and feast (if any), for whichever month is showing, not just August.
- **Added:** Wheel tab (and the Today tab's desktop "year at a glance" panel) now draws the current liturgical year's actual season boundaries end-to-end, computed from live data for any tradition, Orthodox calendar setting, or year — not a fixed year-2026 layout. Today's clock-hand position is computed the same way and updates as the date changes.
- **Added:** Every feast in the computed calendar (12–24 per tradition, ~58 total across Catholic, Anglican, and Orthodox) now has a short bio and a "why this color" note in its detail sheet — previously only 4 hand-picked demo feasts had this text.
- **Added:** Real, tradition-specific week/Sunday numbering in place of the old generic "Week N" count, so it can be checked against a missal, ordo, or BCP:
  - **Catholic:** the official 1–34 Ordinary Time numbering — counted forward from the Monday after the Baptism of the Lord to Ash Wednesday, then counted backward from the 34th/last week (the week of Christ the King) once Ordinary Time resumes on the Monday after Pentecost, matching how the actual numbering skips a range in between.
  - **Anglican:** BCP-style "Epiphany N" and "Trinity N", counting Sundays after Epiphany and after Trinity Sunday.
  - **Orthodox:** the traditional named Sundays — Publican & Pharisee, Prodigal Son, Meatfare, and Forgiveness Sunday before Great Lent; the five named Great Lent Sundays (Orthodoxy, St. Gregory Palamas, Veneration of the Cross, St. John Climacus, St. Mary of Egypt); Thomas Sunday through the Holy Fathers of Nicaea in Paschaltide; and "N Sunday after Pentecost" (starting with the Sunday of All Saints) afterward.
  - All three traditions also get matching Advent Sundays (1st–4th), numbered Lent Sundays, and a "Holy Week" / Triduum callout instead of a numbered week where the real calendars use a name.
- **Added:** A `useToday()` hook checks the real device date once a minute, so the Today tab's date, season progress bar, "next feast" teaser, liturgical-color caption, and the Grid/Wheel tabs all update live rather than being pinned to a fixed demo date.
- **Changed:** "Next feast" (Today tab teaser and Feasts tab list) is now the real next upcoming feast from today's date, sorted chronologically, rather than a static 4-item list.
- **Changed:** Prayer & Readings tab's footnote now simply states what's used (KJV, 1662 BCP, ancient liturgical formulas) instead of framing it as mockup/placeholder text needing a future licensing decision.
- **Fixed:** The mobile app shell used `min-height: 100dvh` instead of a fixed `height`, so on longer content the whole page — including the header and bottom tab bar — scrolled together as one unit instead of just the middle content area. The shell is now height-bound per breakpoint (accounting for the card-style margin at tablet widths) so the header and tab bar stay fixed in place and only the content between them scrolls.

## [0.8.0] — Real date-calculation engine and .ics calendar export

- **Added:** `src/lib/dates.js` — real liturgical date-calculation engine. Western Easter via the Meeus/Jones/Butcher algorithm; Orthodox Pascha via the classic Julian-calendar Easter algorithm, converted to a Gregorian date using the current Julian/Gregorian offset. Validated against known dates for 2024–2027 (e.g. 2026: Western Easter Apr 5, Orthodox Pascha Apr 12).
- **Added:** `src/lib/feasts.js` — derives full liturgical-year season boundaries (Advent through the next Advent) for Catholic, Anglican, and Orthodox (both Gregorian "New Calendar" and Julian "Old Calendar" variants) from the date engine, replacing hand-picked demo ranges with computed ones for the current liturgical year. Added a fuller major-feast calendar per tradition — 12–24 feast days each, mixing fixed dates and dates computed relative to Easter/Pascha — up from the 4 hardcoded sample feasts.
- **Added:** `src/lib/ics.js` — RFC 5545 `.ics` file generator. Each liturgical season becomes a multi-day all-day event, each feast day a single-day all-day event; events carry the season/feast's liturgical color via the `COLOR` property (RFC 7986) plus `X-APPLE-CALENDAR-COLOR` for wider client support, and a `CATEGORIES` tag. Output validated for correct line-folding and balanced `BEGIN:VEVENT`/`END:VEVENT` pairs.
- **Added:** "Sync to calendar" on the Today tab now opens an export sheet instead of doing nothing — lets you multi-select which tradition(s) to export (Catholic / Anglican / Orthodox), then downloads one real `.ics` file per selection. Orthodox export respects the current Gregorian/Julian setting from Settings.
- **Note:** The Grid and Wheel tabs still run on static demo data pinned to Aug 22, 2026 — this pass wires the new date engine into the export flow only. Rewiring the rest of the UI to live computed dates is still open.

## [0.7.0] — In-app changelog viewer

- **Added:** `src/changelogData.js` — a structured, in-app mirror of this changelog file, rendered via a new `ChangelogSheet` component matching the existing bottom-sheet/dialog style. Grouped by version with color-coded Added/Changed/Fixed/Removed/Note labels and a "Latest" badge on the newest release. **This file must be updated alongside `changelog.md` for every future release** — see the note at the top of `changelogData.js`.
- **Added:** "What's new (vX.X.X)" link at the bottom of the Settings sheet, next to "Read our Privacy Policy", opening the changelog viewer.

## [0.6.0] — Google Analytics with GDPR-compliant cookie consent

- **Added:** `CookieConsent` banner — shown on first visit (bottom-center above the tab bar on mobile, bottom-right on desktop, matching `UpdateToast`'s positioning). No dismiss/X button by design — Accept or Reject is the only way to close it, and that choice is what's persisted.
- **Added:** `src/analytics.js` — Google Analytics (GA4) is now integrated, but the `gtag.js` script and dataLayer are only injected via `loadGoogleAnalytics()` *after* the person accepts the cookie banner. It is never loaded on app start, and rejecting (or later switching to reject) calls `disableGoogleAnalytics()` (`window['ga-disable-<ID>']`) to stop further collection.
- **Added:** New in-app Privacy Policy sheet (`PrivacyPolicySheet`), matching the existing bottom-sheet/dialog style. Written to cover UK/EU GDPR and PECR essentials: data controller identity and contact (with an easy spot in code to add a dedicated privacy email — `PRIVACY_CONTACT_EMAIL` in `App.jsx`), legal basis for processing, what's stored in `localStorage` vs. what Google Analytics collects, the specific GA cookies and their duration, international transfer disclosure, data retention period, a full list of GDPR rights including the right to complain to the ICO, a children's data statement, and how to withdraw consent. Includes a plain-language disclaimer that it isn't a substitute for legal review. Reachable from the cookie banner ("Read our Privacy Policy") and from Settings.
- **Added:** "Privacy & Cookies" section in the Settings sheet showing the current consent status (Accepted / Rejected / Not yet decided) with a button to change it at any time, plus a link to the Privacy Policy — so consent can be withdrawn as easily as it was given.
- **Added:** `officium-cookie-consent` persisted to `localStorage` (`usePersistedState`) alongside the existing tradition/calendar/theme keys — `null` until a choice is made, then `"accepted"` or `"rejected"` indefinitely.

## [0.5.0] — Rebrand to Officium, app icons, social share preview

- **Changed:** App renamed from "Ordo" to "Officium" throughout — page title, PWA manifest `name`/`short_name`, sidebar and mobile header wordmark, `package.json` name, and README.
- **Changed:** `localStorage` keys renamed to match (`ordo-theme-mode` → `officium-theme-mode`, `ordo-tradition` → `officium-tradition`, `ordo-calendar` → `officium-calendar`). Existing users' saved settings will reset once after this update since the old keys are no longer read.
- **Changed:** Replaced the full icon set (favicon, apple-touch-icon, and all PWA manifest icons including the maskable variant) with the new gold cross-in-circle mark on an off-black background. Removed the old `favicon.svg`.
- **Added:** Open Graph and Twitter Card meta tags in `index.html` — title, description, `og:image`/`twitter:image` pointing to a new 1200×630 social share banner (`/og-banner.jpg`), and site URL, so links shared on social media and messaging apps show a proper preview card.

## [0.4.2] — Persist tradition and calendar settings

- **Fixed:** Tradition (Catholic/Anglican/Orthodox) and calendar (Gregorian/Julian) settings weren't written to `localStorage` at all — only the theme mode was, so both reset to their defaults on every reload. Added a small reusable `usePersistedState` hook and wired both settings through it.

## [0.4.1] — Fix Anglican morning/evening cutoff

- **Fixed:** The automatic Morning/Evening Prayer default (added in 0.4.0) switched to Evening at noon, which is too early for most people's day — 3:40pm was showing Evening Prayer. Cutoff moved to 5pm.

## [0.4.0] — Update-available toast

- **Added:** `UpdateToast` component — when a new service worker version is available, a toast appears (bottom-center on mobile above the tab bar, bottom-right on desktop) offering "Reload" or "Later". Also shows a brief "ready to work offline" confirmation the first time the service worker finishes precaching.
- **Changed:** Switched `vite-plugin-pwa`'s `registerType` from `autoUpdate` to `prompt` — new versions no longer swap in silently on next load; the person is asked first via the toast.
- **Added:** Open tabs now poll for a new service worker once an hour, so a long-lived open tab discovers updates without needing a fresh page load/navigation.

## [0.3.0] — Time-aware Anglican default, desktop polish

- **Added:** Anglican Daily Office now defaults to a sensible segment based on the person's real local clock — Sunday gets the Eucharistic lectionary regardless of time, otherwise Morning Prayer before noon and Evening Prayer after. Still manually switchable via the segmented control; this only decides the initial selection.
- **Fixed:** Desktop sidebar now uses `position: fixed` and its own `100dvh` height, so it stays pinned in place — including the Settings button at the bottom — no matter how far the main content scrolls. Previously the whole page could scroll together on longer views, pushing the bottom of the sidebar out of view.
- **Fixed:** The year wheel (both the standalone Wheel tab and the Today tab's side panel) was rendering at the same fixed pixel size regardless of viewport, so it looked small and empty on desktop. Reworked to a fixed internal SVG coordinate system scaled via responsive CSS width/height, so the whole drawing — including text — scales up properly at the `lg` breakpoint. Standalone tab now renders notably larger than the Today panel, which sizes to fit its column.
- **Changed:** Grid tab's weekday header text darkened (27% → 60% opacity) — it was too faint to read comfortably.

## [0.2.1] — Prayer order, desktop scale, grid weekday names

- **Fixed:** Prayer & Readings tab used a 2-column grid on desktop that broke the sequential order of the Daily Office / Mass / Daily Cycle (Confession → Canticle → Collect → readings). Reverted to single column at all breakpoints.
- **Fixed:** A leftover `max-w-3xl` wrapper around all tab content was starving the Today tab's two-column desktop layout of width, causing "Ordinary Time" to wrap awkwardly onto two lines.
- **Changed:** Grid tab's day-of-week header now shows full abbreviations (Sun/Mon/Tue/Wed/Thu/Fri/Sat) instead of single letters (S/M/T/W/T/F/S), on both mobile and desktop — the single-letter version was ambiguous (T for both Tue/Thu, S for both Sat/Sun).
- **Changed:** Desktop typography and spacing scaled up throughout — sidebar, Today hero card, color/reading/feast teaser cards, Prayer cards, Feasts cards, and the Grid all now use larger text and padding at the `lg` breakpoint instead of reusing mobile sizes stretched into empty space.
- **Changed:** Today tab's desktop "year at a glance" wheel now renders at full size instead of the smaller compact variant, which read too small next to the hero card.

## [0.2.0] — Light/dark theming and a real desktop layout

- **Added:** Light and dark theme palettes (`src/theme.js`) with a shared `alpha()` helper replacing hardcoded hex+opacity color strings throughout the app.
- **Added:** `ThemeContext` — follows the OS/browser color-scheme preference by default, with a manual override toggle. Choice persists across visits via `localStorage`.
- **Added:** Theme toggle (sun / moon / auto icon) always visible in the mobile header and the desktop sidebar.
- **Added:** Real desktop layout at the `lg` breakpoint — persistent sidebar navigation replaces the bottom tab bar; Today tab gets a two-pane layout with a compact year wheel alongside the hero card.
- **Changed:** Sheets/modals (Settings, feast bio, day detail) now render as a bottom sheet on mobile but a centered dialog on desktop, and are positioned relative to the viewport rather than the old mobile "phone frame" mockup container.
- **Fixed:** Gold accent text had insufficient contrast against light backgrounds — added a darker gold variant (`seasonAccent()`) used specifically for light-mode text.
- **Fixed:** The "white" liturgical color swatch (used for certain feast days) was invisible against light/white card backgrounds — added a subtle border ring so it stays visible in both themes.
- **Removed:** Unused Vite template boilerplate (`App.css`, default assets).

## [0.1.0] — Initial scaffold

- **Added:** Vite + React 19 + Tailwind + `vite-plugin-pwa` project scaffold.
- **Added:** Full UI ported from the design mockup — Today, Grid, Wheel, Prayer & Readings, and Feasts tabs; tradition switcher (Catholic / Anglican / Orthodox) and, for Orthodox, a Gregorian/Julian calendar switcher; day-detail and feast-bio sheets.
- **Added:** PWA manifest, generated icon set (candle motif), and offline-capable service worker.
- **Added:** Safe-area-aware layout (notch/home-indicator padding) adapted from the original artifact mockup's fixed "phone frame" to a real full-viewport app shell.
- **Note:** Still running on static demo data pinned to August 22, 2026 — the real Easter/Pascha date-calculation engine is not yet implemented.
