# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioning follows [Semantic Versioning](https://semver.org/).

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
