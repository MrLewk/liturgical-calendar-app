// In-app mirror of changelog.md, rendered by ChangelogSheet in App.jsx.
//
// IMPORTANT: update this file alongside changelog.md whenever a new version
// ships. Keep entries in the same order (newest first) and roughly the same
// wording — this is what people see in-app, changelog.md is the same
// history for GitHub/repo visitors.
export const CHANGELOG = [
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
