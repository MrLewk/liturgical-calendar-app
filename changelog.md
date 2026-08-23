# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioning follows [Semantic Versioning](https://semver.org/).

## [0.13.3] — Fix five Office week-numbering bugs found during Ash Wednesday gap-filling

While filling the Ash Wednesday +2 days gap, a full 2-year sweep of every possible date turned up several real bugs in the Office (Morning/Evening Prayer) week-label resolver — these affected real, populated weeks, not just edge cases:

- **Fixed:** The Ash Wednesday + 2 days gap now shows the real reading instead of falling back to demo text (both DEL and Office).
- **Fixed:** The "N before Advent" backward count was completely reversed — the week right before Advent was labeled "4 before Advent" instead of "1 before Advent", and vice versa for the earliest of the four weeks. Affected all four pre-Advent weeks, every year.
- **Fixed:** The entire "Pentecost" week (the week between Pentecost Sunday and Trinity Sunday) was returning nothing at all despite having real transcribed data - a whole week, every year, silently falling back to demo text.
- **Fixed:** "Trinity" (the week immediately after Trinity Sunday) only matched Trinity Sunday itself; the six days following it were mislabeled "Trinity 0" instead of being grouped into the same week.
- **Fixed:** Office's Dec 17-24 window wasn't extending "Advent 4" correctly (Table 2, unlike DEL, has no separate date-keyed block for these dates) - was incorrectly falling into a nonsensical negative "Epiphany" week number.
- **Fixed:** Jan 1 (Naming and Circumcision) and Jan 6 (the Epiphany itself), on both DEL and Office, were producing nonsensical negative week labels instead of a clean, intentional gap signal - functionally harmless (both already fell back to demo text either way) but cleaned up for clarity.

## [0.13.2] — Wire up the Christmas/Epiphany date-keyed weekday block

- **Added:** Weekday Eucharist (DEL) and Office readings for 17-24 Dec, 29-31 Dec, 2-5 Jan, and 7-12 Jan now resolve to their real, date-specific citations instead of falling back to demo text or (in DEL's case) miscalculating into a nonsensical negative week number.
- **Added:** Extracted the 21 missing Dec 17-24 / Dec 29-31 / Jan 2-5 / Jan 7-12 rows for the weekday Eucharist lectionary (Table 6) directly from the source PDF - these had never been captured in the original transcription.
- **Known limitation:** Both the weekday Eucharist and Office versions of this block only model the common case ("if 6 January is not a Sunday"); the alternate reading sequence used in years when Epiphany is pastorally moved to a Sunday isn't modeled. Dec 25-28 (Christmas Day itself, Stephen, John, Holy Innocents) and Jan 1/6 (Naming and Circumcision, the Epiphany) are Principal Feasts with their own propers in a different table, not this weekday one - still a gap.

## [0.13.1] — Wire up fixed-date Sundays (Christmas, Epiphany, Easter, Pentecost, etc.)

- **Added:** Sundays that fall on fixed dates now resolve to their real RCL reading instead of falling back to demo text: First/Second Sunday after Christmas Day, Epiphany of the Lord (in years it lands on a Sunday, with Baptism of Christ correctly shifting to the following Sunday), Baptism of the Lord, Transfiguration Sunday, the Sunday of the Passion/Palm Sunday, **Resurrection of the Lord (Easter Day)**, and Day of Pentecost.
- **Added:** Easter Day's readings (Acts 10:34-43 or Jeremiah 31:1-6; Psalm 118; Colossians 3:1-4 or Acts 10:34-43; John 20:1-18 or Matthew 28:1-10) to the transcribed RCL data — these are identical across Years A/B/C and had been missed in the original transcription, meaning Easter Sunday itself was falling back to demo text until now.
- **Fixed:** Transfiguration Sunday was being evaluated against the wrong season boundary (it falls chronologically before Ash Wednesday, so needed to be checked in the Epiphany-season branch, not the Lent one) — caught and fixed during testing before this shipped.

## [0.13.0] — Real Anglican Daily Office lectionary (Morning & Evening Prayer)

- **Added:** Morning and Evening Prayer readings on the Prayer & Readings tab are now computed from the real Common Worship Weekday Lectionary (Table 2 — Old/New Testament readings for the Office), replacing the fixed demo citations, the same way the Eucharist reading was made real in v0.11.0.
- **Added:** `officeWeekLabel()` and `officeReadingFor()` in `src/lib/lectionary.js` — resolves any date to Table 2's own week-label convention (`Epiphany N` forward from the Baptism of Christ, a fixed backward count `5 before Lent` .. `1 before Lent`, `Lent N`, `Easter`/`Easter N`, `Trinity`/`Trinity N` forward, then a fixed backward count `4 before Advent` .. `1 before Advent`), then picks the correct OT/NT column pairing for Morning vs Evening Prayer using Table 1's per-year column assignment and the Ordinary Time / Seasonal Time split.
- **Added:** `src/data/office_table2.json` — the transcribed Table 2 data (332 main rows covering OT1/OT2a/OT2b/NT1/NT2, plus the separate 8-row "Ascension to Pentecost" alternative sequence appendix), extracted directly from the PDF's word-position data rather than approximated text layout, for reliability across the table's two-column, facing-page structure.
- **Added:** `src/data/table1_full.json` — the full Table 1 (2005-2044), including the Morning/Evening Prayer column assignments (Ordinary Time vs Seasonal Time) that the 2005 booklet's short-form table only partially specified; confirmed against a 12-year repeating cycle with zero mismatches.
- **Known gap:** the Christmas/Epiphany date-keyed block (17 Dec - 12 Jan) and the two days immediately after Ash Wednesday aren't wired to specific dates yet — falls back to the demo entry rather than showing something wrong. Psalms (Tables 3-5) haven't been transcribed yet. Catholic and Orthodox readings are still demo text.

## [0.12.1] — Fix outdated scripture reference in Prayer & Readings tab

- **Fixed:** The Prayer & Readings tab's copyright notice incorrectly referred to the King James Version, even though the app now uses the World English Bible (WEB). Updated to: "Scripture readings use the World English Bible (public domain). Prayers and traditions are from the 1662 Book of Common Prayer, Anglican lectionaries, and ancient liturgical sources."

## [0.12.0] — Coffee donation section & copyright footer

- **Added:** A new "Enjoying the app? A coffee keeps development going ☕" section with a Buy Me A Coffee button and copyright notice in the app footer.
- **Added:** On desktop, the coffee section appears in the sidebar above the Settings button, separated by a divider.
- **Added:** On mobile, the coffee section appears at the bottom of the Today tab below the Sync button, with centered layout.
- **Added:** The copyright year is dynamic and updates annually (© [year] Luke Wilson. Designed by Luke Wilson.).
- **Added:** The Buy Me A Coffee button uses the official brand button image from https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png, linking to https://buymeacoffee.com/mrlewk.

## [0.11.1] — Fix day-detail sheet showing the wrong Anglican reading; make it clickable

- **Fixed:** The day-detail sheet (opened from the Grid/Wheel tabs) and the Today tab's reading teaser always showed the fixed Morning Prayer demo reading regardless of tradition, date, or day of week — including on Sundays, which should show the Sunday Eucharist reading, not a weekday one. Both now use the same real Anglican lectionary engine as the Prayer & Readings tab (`src/lib/lectionary.js`), correctly switching between the Sunday (RCL) and weekday (DEL) reading for the actual selected date.
- **Changed:** The day-detail sheet now lists every reading for the day (First Reading, Psalm, Second Reading, Gospel as applicable) instead of only the first one.
- **Added:** The reading section on the day-detail sheet is now tappable — it opens the full Prayer & Readings tab scoped to that specific date (today or any other date browsed to via Grid/Wheel), with a "Showing [date] · Back to today" banner so it's clear you're not looking at today. Navigating the tab bar/sidebar to Prayer & Readings directly always shows today, as before.
- **Fixed:** The Eucharist segment on the Prayer & Readings tab was still labeled "Sunday" even though it now shows the real weekday reading too on non-Sundays; relabeled to "Eucharist".

## [0.11.0] — Real Anglican Eucharist lectionary (weekday + Sunday)

- **Added:** The Anglican Eucharist reading on the Prayer & Readings tab is now computed from the real Common Worship lectionary for today's actual date, replacing the fixed demo citation. Weekdays use the Daily Eucharistic Lectionary (Table 6, transcribed from the CofE's 2005 Weekday Lectionary booklet, amended 2010); Sundays use the Principal Service (Revised Common Lectionary) track, sourced from Vanderbilt Divinity Library's published RCL citations for Years A, B, and C.
- **Added:** `src/lib/lectionary.js` — resolves any date to its Common Worship week label (Advent 1-3, Lent 1-5, Easter 2-7, DEL Week 1-34, or a Proper number) and looks up the matching reading citation. The DEL Week 1-34 / Proper-number counting reuses the same forward/backward 34-week Ordinary Time logic already used for the Catholic calendar.
- **Added:** `src/lib/citationNormalize.js` — converts the lectionary's raw citation formats (dotted chapter.verse, semicolon-joined multi-readings, "or" alternatives, verse-letter suffixes like "9a", "-end" markers) into clean references the existing scripture lookup (`getPassage`) can resolve, so tapping a reading still opens the real WEB Bible text exactly as before.
- **Added:** `src/data/del_table6.json`, `src/data/rcl_sundays.json`, `src/data/lectionaryYears.js` — the transcribed reading data and the Sunday-Year (A/B/C) / DEL-Year (1/2) lookup table for 2005-2044 (projected on a 6-year cycle beyond that).
- **Known gap:** Morning and Evening Prayer readings are still the fixed demo text — the Office lectionary (Table 2, Old/New Testament readings) and psalm tables (Tables 3-5) haven't been transcribed yet. Catholic and Orthodox readings are also still demo text.
- **Known gap:** A few narrow date ranges aren't wired up yet and fall back to the demo entry rather than showing something wrong: the 3 days immediately after Ash Wednesday, the Christmas/Epiphany date-keyed block (17-24 Dec, 2-12 Jan) for weekdays, and Sundays that fall on fixed dates (Christmas, Epiphany, Transfiguration, Palm Sunday, Ascension, Pentecost) rather than an ordinary Sunday count.

## [0.10.2] — Fix feast tiles blending into the background

- **Fixed:** Feast-day tiles on the Grid tab used a tinted background (feast color at low opacity) to stand out, but for light liturgical colors (white, gold) this tint landed almost exactly on the page's cream background, making the whole tile look washed-out and blend in rather than stand out. Feast tiles now keep the same white card background as every other day, with the feast indicated by the corner dot and a colored ring around the tile instead.

## [0.10.1] — Fix low-contrast feast dots

- **Fixed:** Feast-day markers using light liturgical colors (white, gold) had a faint border and blended into the app's cream background, making them hard to spot. The border around feast markers is now darker and slightly thicker across the Grid tab dots, the Feasts tab list bars, and the feast detail sheet icon.

## [0.10.0] — Full-text scripture readings, close buttons on all sheets

- **Added:** Every scripture reading on the Prayer & Readings tab is now tappable, opening the full passage — verse-numbered, complete text — in a new `ScripturePassageModal` sheet.
- **Added:** Passage text is drawn from the World English Bible (WEB), which is public domain worldwide, avoiding the copyright issue with the KJV outside the US (it's under Crown copyright in the UK). Three WEB editions are bundled to match each tradition's canon:
  - `eng-web-c` — World English Bible (Catholic), Old Testament + Deuterocanon — default for Catholic
  - `eng-webbe` — World English Bible British Edition with Apocrypha — default for Anglican
  - `engwebu` — World English Bible Updated, with Apocrypha — default for Orthodox
  - Extracted from the source epubs into per-book JSON (`public/bible/{edition}/{BOOK}.json`), footnote markers stripped, one JSON file per book (~16MB total across all three editions).
- **Added:** `src/lib/bibleRef.js` — parses reference strings like "Isaiah 26:1–9" or "Luke 1:26–2:7" (including cross-chapter ranges) into a structured range.
- **Added:** `src/data/bibleBooks.js` — canonical book list with collision-checked aliases/abbreviations (numerals, roman numerals, "First/Second", common short forms) so references resolve reliably.
- **Added:** `src/lib/scripture.js` — fetches and assembles passage text from the bundled JSON, with a fallback for the Catholic edition's merged Daniel/Esther (Greek additions folded into the base book rather than kept as separate files), and builds BibleGateway.com passage links.
- **Added:** `src/data/bibleGatewayVersions.js` — the full BibleGateway version list (233 translations, 68 languages), used to power a "read in another translation" picker in the Scripture sheet and a new default-version setting.
- **Added:** New "Bible text" section in Settings — pick which WEB edition to read (or leave it following your tradition automatically), and set a default BibleGateway version for the "Open on BibleGateway" link.
- **Added:** `vite.config.js` now registers a runtime-caching rule (`CacheFirst`, 1yr expiry) for `/bible/**/*.json` — each book is cached the first time it's actually opened rather than being precached upfront, so offline availability builds up progressively without bloating the initial install (~16MB of text would otherwise be downloaded on first load).
- **Added:** Every bottom sheet / modal (`SettingsSheet`, `PrivacyPolicySheet`, `ChangelogSheet`, `ExportSheet`, `FeastModal`, `DayDetailSheet`, and the new Scripture sheet) now has an explicit close (X) button in `SheetOverlay`, in its own reserved row so it can never sit under a long heading. Tap-outside-to-close still works as before.

## [0.9.4] — Anglican season labels, bigger feast dots, nav renames

- **Changed:** Anglican "Epiphany" and "Trinity" season names now read "Ordinary Time (Epiphany)" and "Ordinary Time (Trinity)" everywhere a season name is shown (Today tab, Grid subheading, day detail sheet, Wheel legend/tooltips), making the Ordinary Time connection clear alongside the Anglican-specific label. Catholic and Orthodox season names are unaffected.
- **Changed:** Feast-day dots on the Grid tab are bigger on desktop (8px → 12px) for better visibility; mobile size is unchanged.
- **Changed:** Nav labels renamed for clarity — "Grid" is now "Calendar" and "Wheel" is now "Chart". Internal tab keys and behavior are unchanged.

## [0.9.3] — Wordmark logo and Grid tab season subheading

- **Added:** The gold cross app icon now sits to the left of the "Officium" wordmark in both the desktop sidebar header and the mobile header, matching the app icon used elsewhere (favicon, PWA icons, social share image).
- **Added:** The Grid tab now shows a small subheading under the month/year title naming the liturgical season(s) touched by the month being viewed — e.g. "Lent" for a month entirely within one season, or "Lent – Easter" for a month that straddles a season boundary (computed per-day across the month rather than just checking the 1st).

## [0.9.2] — Fix missing feasts on the Grid tab

- **Fixed:** Most fixed-date feasts (Catholic, Anglican, and Orthodox) were computed for the wrong calendar year, landing them a year too early and outside the liturgical year actually being displayed. A liturgical year spans two calendar years (e.g. Advent 2025 through November 2026), and feasts falling in the second half — Nativity of St. John the Baptist, Sts. Peter and Paul, Transfiguration, Assumption/Dormition, Exaltation/Elevation of the Holy Cross, All Saints/All Souls, Michaelmas, All Hallows' Eve, Nativity of the Theotokos, and (Catholic) Mary, Mother of God — were pinned to the year Advent began instead of the following year. Since the Grid tab computes each viewed month's feast list from scratch, this made feasts vanish from the grid for most of the year, only reappearing correctly from Christ the King (~Nov 22) onward, whose date is computed by relative offset rather than a literal year. The Today tab's "next feast" masked the bug because its lookup merges two consecutive liturgical-year computations, which happened to self-correct. Orthodox fixed feasts occurring within the Nativity Fast window itself (Presentation of the Theotokos, Nov 21; Nativity of Christ, Dec 25) were already correct and left unchanged.

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
