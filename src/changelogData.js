// In-app mirror of changelog.md, rendered by ChangelogSheet in App.jsx.
//
// IMPORTANT: update this file alongside changelog.md whenever a new version
// ships. Keep entries in the same order (newest first) and roughly the same
// wording — this is what people see in-app, changelog.md is the same
// history for GitHub/repo visitors.
export const CHANGELOG = [
  {
    version: "0.13.2",
    title: "Wire up the Christmas/Epiphany date-keyed weekday block",
    changes: [
      { type: "Added", text: "Weekday Eucharist (DEL) and Office readings for 17-24 Dec, 29-31 Dec, 2-5 Jan, and 7-12 Jan now resolve to their real, date-specific citations instead of falling back to demo text or miscalculating entirely." },
      { type: "Added", text: "Extracted the 21 missing Dec/Jan rows for the weekday Eucharist lectionary directly from the source PDF - these had never been captured in the original transcription." },
      { type: "Known gap", text: "Only the common case is modeled (6 January not a Sunday); the Sunday-shift variant isn't. Dec 25-28 and Jan 1/6 are Principal Feasts with their own propers elsewhere - still demo text." },
    ],
  },
  {
    version: "0.13.1",
    title: "Wire up fixed-date Sundays (Christmas, Epiphany, Easter, Pentecost, etc.)",
    changes: [
      { type: "Added", text: "Sundays that fall on fixed dates now resolve to their real RCL reading instead of demo text: First/Second Sunday after Christmas Day, Epiphany of the Lord, Baptism of the Lord, Transfiguration Sunday, Palm/Passion Sunday, Resurrection of the Lord (Easter Day), and Day of Pentecost." },
      { type: "Added", text: "Easter Day's readings were missing from the original RCL transcription entirely (identical across Years A/B/C) - added, so Easter Sunday itself now shows the real reading." },
      { type: "Fixed", text: "Transfiguration Sunday was landing in the wrong season-boundary check during development; caught in testing before shipping." },
    ],
  },
  {
    version: "0.13.0",
    title: "Real Anglican Daily Office lectionary (Morning & Evening Prayer)",
    changes: [
      { type: "Added", text: "Morning and Evening Prayer readings are now computed from the real Common Worship Weekday Lectionary (Table 2), replacing the fixed demo citations, the same way the Eucharist reading was made real earlier." },
      { type: "Added", text: "officeWeekLabel() and officeReadingFor() resolve any date to Table 2's own week-label convention and pick the correct OT/NT column pairing for Morning vs Evening Prayer using Table 1's per-year column assignment and the Ordinary Time / Seasonal Time split." },
      { type: "Added", text: "Transcribed the full Table 2 (332 rows) directly from the PDF's word-position data for reliability, plus the complete Table 1 (2005-2044) including Morning/Evening Prayer column assignments, confirmed against a 12-year repeating cycle." },
      { type: "Known gap", text: "The Christmas/Epiphany date-keyed block and the two days after Ash Wednesday aren't wired to specific dates yet. Psalms (Tables 3-5) haven't been transcribed. Catholic and Orthodox readings are still demo text." },
    ],
  },
  {
    version: "0.12.1",
    title: "Fix outdated scripture reference in Prayer & Readings tab",
    changes: [
      { type: "Fixed", text: "The Prayer & Readings tab's copyright notice incorrectly referred to the King James Version, even though the app now uses the World English Bible (WEB). Updated to accurately reflect that scripture readings use the WEB, while prayers come from the 1662 Book of Common Prayer, Anglican lectionaries, and ancient liturgical sources." },
    ],
  },
  {
    version: "0.12.0",
    title: "Coffee donation section & copyright footer",
    changes: [
      { type: "Added", text: "A new \"Enjoying the app? A coffee keeps development going ☕\" section with a Buy Me A Coffee button and copyright notice in the app footer." },
      { type: "Added", text: "On desktop, the coffee section appears in the sidebar above the Settings button, separated by a divider." },
      { type: "Added", text: "On mobile, the coffee section appears at the bottom of the Today tab below the Sync button, with centered layout." },
      { type: "Added", text: "The copyright year is dynamic and updates annually." },
      { type: "Added", text: "The Buy Me A Coffee button uses the official brand button image, linking to https://buymeacoffee.com/mrlewk." },
    ],
  },
  {
    version: "0.11.1",
    title: "Fix day-detail sheet showing the wrong Anglican reading; make it clickable",
    changes: [
      { type: "Fixed", text: "The day-detail sheet (opened from the Grid/Wheel tabs) and the Today tab's reading teaser always showed the fixed Morning Prayer demo reading regardless of tradition, date, or day of week — including on Sundays, which should show the Sunday Eucharist reading, not a weekday one. Both now use the same real Anglican lectionary engine as the Prayer & Readings tab, correctly switching between the Sunday (RCL) and weekday (DEL) reading for the actual selected date." },
      { type: "Changed", text: "The day-detail sheet now lists every reading for the day (e.g. First Reading, Psalm, Second Reading, Gospel) instead of only the first one." },
      { type: "Added", text: "The reading section on the day-detail sheet is now tappable — it opens the full Prayer & Readings tab scoped to that specific date (today or any other date browsed to via Grid/Wheel), with a \"Showing [date] · Back to today\" banner. Navigating the tab bar/sidebar to Prayer & Readings directly always shows today." },
      { type: "Fixed", text: "The Eucharist segment on the Prayer & Readings tab was still labeled \"Sunday\" even though it now shows the real weekday reading too on non-Sundays; relabeled to \"Eucharist\"." },
    ],
  },
  {
    version: "0.11.0",
    title: "Real Anglican Eucharist lectionary (weekday + Sunday)",
    changes: [
      { type: "Added", text: "The Anglican Eucharist reading on the Prayer & Readings tab is now computed from the real Common Worship lectionary for today's actual date, replacing the fixed demo citation. Weekdays use the Daily Eucharistic Lectionary (Table 6, transcribed from the CofE's 2005 Weekday Lectionary booklet); Sundays use the Principal Service (Revised Common Lectionary) track, sourced from Vanderbilt Divinity Library's RCL citations for Years A, B, and C." },
      { type: "Added", text: "`src/lib/lectionary.js` — resolves any date to its Common Worship week label (Advent 1-3, Lent 1-5, Easter 2-7, DEL Week 1-34, or a Proper number) and looks up the matching reading citation, reusing the same forward/backward 34-week Ordinary Time counting the Catholic calendar already used." },
      { type: "Added", text: "`src/lib/citationNormalize.js` — converts the lectionary's raw citation formats (dotted chapter.verse, semicolon-joined multi-readings, \"or\" alternatives, verse-letter suffixes, \"-end\" markers) into clean references the existing scripture lookup can resolve, so tapping a reading opens the real WEB Bible text exactly as before." },
      { type: "Added", text: "`src/data/del_table6.json`, `src/data/rcl_sundays.json`, `src/data/lectionaryYears.js` — the transcribed reading data and the Sunday-Year (A/B/C) / DEL-Year (1/2) lookup table for 2005-2044." },
      { type: "Known gap", text: "Morning and Evening Prayer readings are still the fixed demo text — the Office lectionary (Table 2) and psalm tables (Tables 3-5) haven't been transcribed yet. Catholic and Orthodox readings are also still demo text." },
      { type: "Known gap", text: "A few narrow date ranges aren't wired up yet: the 3 days immediately after Ash Wednesday, the Christmas/Epiphany date-keyed block (17-24 Dec, 2-12 Jan) for weekdays, and Sundays that fall on fixed dates (Christmas, Epiphany, Transfiguration, Palm Sunday, Ascension, Pentecost) rather than an ordinary Sunday count. These fall back to the demo entry rather than showing something wrong." },
    ],
  },
  {
    version: "0.10.2",
    title: "Fix feast tiles blending into the background",
    changes: [
      { type: "Fixed", text: "Feast-day tiles on the Grid tab used a tinted background that, for light colors (white, gold), nearly matched the page background and made the tile look washed-out. Feast tiles now keep the normal white card background and are marked by the corner dot and a colored ring instead." },
    ],
  },
  {
    version: "0.10.1",
    title: "Fix low-contrast feast dots",
    changes: [
      { type: "Fixed", text: "Feast-day markers in light liturgical colors (white, gold) had a faint border and blended into the app's cream background. The border is now darker and slightly thicker across the Grid tab, Feasts tab, and feast detail sheet." },
    ],
  },
  {
    version: "0.10.0",
    title: "Full-text scripture readings, close buttons on all sheets",
    changes: [
      { type: "Added", text: "Every scripture reading on the Prayer & Readings tab now opens the full passage in a new Scripture sheet — verse-numbered, complete, and readable offline once viewed." },
      { type: "Added", text: "Passage text comes from the World English Bible, which is public domain, so it can be bundled and read offline with no licensing concerns (unlike the KJV outside the US, where it's under Crown copyright in the UK)." },
      { type: "Added", text: "Three WEB editions are bundled to match each tradition's canon: World English Bible (Catholic) with Deuterocanon, World English Bible British Edition with Apocrypha, and World English Bible Updated with Apocrypha. Catholic defaults to the Catholic edition, Anglican to the British edition, Orthodox to the Updated edition — overridable in Settings under a new \"Bible text\" section." },
      { type: "Added", text: "The Scripture sheet also links out to BibleGateway.com for anyone who wants a different translation, with a searchable version picker (233 translations across 68 languages) — defaults to a version set in Settings, changeable per-passage." },
      { type: "Added", text: "Bible text is fetched per-book rather than bundled upfront, and cached by the service worker the first time each book is opened, so it becomes available offline progressively instead of bloating the initial install." },
      { type: "Added", text: "Every bottom sheet / modal (Settings, Privacy Policy, Changelog, Export, Feast bio, Day detail, and the new Scripture sheet) now has an explicit close (X) button, in addition to tapping outside." },
    ],
  },
  {
    version: "0.9.4",
    title: "Anglican season labels, bigger feast dots, nav renames",
    changes: [
      { type: "Changed", text: "Anglican \"Epiphany\" and \"Trinity\" seasons now display as \"Ordinary Time (Epiphany)\" and \"Ordinary Time (Trinity)\" wherever the season name appears." },
      { type: "Changed", text: "Feast-day dots on the Grid tab are bigger on desktop for better visibility." },
      { type: "Changed", text: "Nav renamed: \"Grid\" is now \"Calendar\" and \"Wheel\" is now \"Chart\"." },
    ],
  },
  {
    version: "0.9.3",
    title: "Wordmark logo and Grid tab season subheading",
    changes: [
      { type: "Added", text: "The gold cross app icon now appears next to the \"Officium\" wordmark in the desktop sidebar and mobile header." },
      { type: "Added", text: "The Grid tab shows a small subheading under the month/year title naming the liturgical season(s) in view — e.g. \"Lent – Easter\" for a month that straddles a season boundary." },
    ],
  },
  {
    version: "0.9.2",
    title: "Fix missing feasts on the Grid tab",
    changes: [
      { type: "Fixed", text: "Most fixed-date feasts were computed for the wrong calendar year, so they fell outside the liturgical year actually being viewed — the Grid tab showed no feasts until around Christ the King (~Nov 22), even though the Today tab's \"next feast\" looked correct. Feast dates now land in the right year across Catholic, Anglican, and Orthodox." },
    ],
  },
  {
    version: "0.9.1",
    title: "Fix Today tab crash",
    changes: [
      { type: "Fixed", text: "The Today tab crashed on load — its desktop \"year at a glance\" wheel panel wasn't receiving the live season data it needed." },
    ],
  },
  {
    version: "0.9.0",
    title: "Grid and Wheel tabs wired to live dates",
    changes: [
      { type: "Added", text: "The Grid tab now shows the real current month with correct season colors and feast-day markers, with prev/next navigation to browse other months and a \"Today\" shortcut to jump back." },
      { type: "Added", text: "The Wheel tab (and the Today tab's desktop side panel) now draws the current liturgical year's real season boundaries, with today's position marked live — for any tradition, calendar setting, or year." },
      { type: "Added", text: "Short bio and \"why this color\" text for every feast day in the computed calendar (previously only 4 demo feasts had this)." },
      { type: "Added", text: "Real week/Sunday numbering matching each tradition's own books: Catholic gets the official 1–34 Ordinary Time count (forward from the Baptism of the Lord, backward from the 34th/Christ the King week after Pentecost); Anglican gets BCP-style \"Epiphany N\" / \"Trinity N\"; Orthodox gets the traditional named Sundays (Publican & Pharisee through St. Mary of Egypt, Thomas Sunday through the Holy Fathers of Nicaea, \"N Sunday after Pentecost\"). Advent, Lent, and Holy Week are labeled to match as well." },
      { type: "Added", text: "The Today tab's date, season progress, \"next feast\", and liturgical-color caption are now all live and update automatically (checked once a minute) instead of being pinned to Aug 22, 2026." },
      { type: "Changed", text: "Tapping a day on the Grid now opens its real computed season and feast, for whichever month is being viewed." },
      { type: "Fixed", text: "The mobile app shell now has a proper fixed height per breakpoint, so the header and bottom tab bar stay in place while only the content between them scrolls." },
    ],
  },
  {
    version: "0.8.0",
    title: "Real date-calculation engine and .ics calendar export",
    changes: [
      { type: "Added", text: "A real Easter/Pascha date engine — season dates and feast days are now computed, not hardcoded, for Catholic, Anglican, and Orthodox (Gregorian and Julian)." },
      { type: "Added", text: "A fuller major feast-day calendar for each tradition." },
      { type: "Added", text: "\"Sync to calendar\" now works — pick one or more traditions and download a real .ics file, with season blocks and feast days colored to match." },
    ],
  },
  {
    version: "0.7.0",
    title: "In-app changelog viewer",
    changes: [
      { type: "Added", text: "A \"What's new\" viewer in Settings showing a history of updates to the app." },
      { type: "Added", text: "A link to it next to the Privacy Policy link at the bottom of Settings." },
    ],
  },
  {
    version: "0.6.0",
    title: "Google Analytics with GDPR-compliant cookie consent",
    changes: [
      { type: "Added", text: "A cookie consent banner on first visit — Accept or Reject, no other way to dismiss it." },
      { type: "Added", text: "Google Analytics only loads after you accept. Rejecting stops future collection." },
      { type: "Added", text: "An in-app Privacy Policy covering data storage, Google Analytics, your GDPR rights, and how to change your mind." },
      { type: "Added", text: "A Privacy & Cookies section in Settings showing your current consent status, with a button to change it any time." },
    ],
  },
  {
    version: "0.5.0",
    title: "Rebrand to Officium, app icons, social share preview",
    changes: [
      { type: "Changed", text: "App renamed from \"Ordo\" to \"Officium\" throughout the app." },
      { type: "Changed", text: "Saved settings keys renamed to match — existing saved settings reset once after this update." },
      { type: "Changed", text: "New app icon — a gold cross-in-circle mark on an off-black background." },
      { type: "Added", text: "Social share preview card (Open Graph / Twitter Card) so links shared elsewhere look polished." },
    ],
  },
  {
    version: "0.4.2",
    title: "Persist tradition and calendar settings",
    changes: [
      { type: "Fixed", text: "Tradition and calendar settings weren't being saved — they now persist across visits." },
    ],
  },
  {
    version: "0.4.1",
    title: "Fix Anglican morning/evening cutoff",
    changes: [
      { type: "Fixed", text: "Evening Prayer was showing too early in the afternoon — cutoff moved to 5pm." },
    ],
  },
  {
    version: "0.4.0",
    title: "Update-available toast",
    changes: [
      { type: "Added", text: "A toast now lets you know when a new version of Officium is ready, with a Reload option." },
      { type: "Changed", text: "New versions no longer swap in silently — you're asked first." },
      { type: "Added", text: "Open tabs check for updates hourly, so long-lived tabs discover new versions too." },
    ],
  },
  {
    version: "0.3.0",
    title: "Time-aware Anglican default, desktop polish",
    changes: [
      { type: "Added", text: "Anglican Daily Office now defaults to Morning or Evening Prayer based on your real local clock." },
      { type: "Fixed", text: "Desktop sidebar now stays pinned in place regardless of how far the page scrolls." },
      { type: "Fixed", text: "The year wheel now scales properly on desktop instead of rendering small and empty." },
      { type: "Changed", text: "Grid tab's weekday header text darkened for readability." },
    ],
  },
  {
    version: "0.2.1",
    title: "Prayer order, desktop scale, grid weekday names",
    changes: [
      { type: "Fixed", text: "Prayer & Readings order corrected on desktop." },
      { type: "Fixed", text: "Today tab's two-column desktop layout no longer starved of width." },
      { type: "Changed", text: "Grid tab now shows full weekday abbreviations instead of single letters." },
      { type: "Changed", text: "Desktop typography and spacing scaled up throughout." },
    ],
  },
  {
    version: "0.2.0",
    title: "Light/dark theming and a real desktop layout",
    changes: [
      { type: "Added", text: "Light and dark themes, following your system preference by default with a manual override." },
      { type: "Added", text: "A real desktop layout with persistent sidebar navigation." },
      { type: "Changed", text: "Settings, feast, and day-detail panels now render as proper dialogs on desktop." },
      { type: "Fixed", text: "Contrast issues with gold accent text and the white liturgical color swatch." },
    ],
  },
  {
    version: "0.1.0",
    title: "Initial scaffold",
    changes: [
      { type: "Added", text: "First version of Officium — Today, Grid, Wheel, Prayer & Readings, and Feasts tabs." },
      { type: "Added", text: "Tradition switcher (Catholic / Anglican / Orthodox) and Orthodox Gregorian/Julian calendar switcher." },
      { type: "Added", text: "Installable, offline-capable app with a generated icon set." },
      { type: "Note", text: "Still running on static demo data — the real date-calculation engine comes later." },
    ],
  },
];
