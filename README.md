# Officium — Liturgical Calendar

A mobile-first PWA for tracking the liturgical year — seasons, feast days, prayers, and scripture readings — across Catholic, Anglican, and Orthodox traditions.

## Status

🚧 Early scaffold. The UI is fully built but still running on static demo data (pinned to Aug 22, 2026). The real date-calculation engine (Western Easter + Orthodox Pascha via the Julian Paschalion, and everything derived from them) is the next phase.

## Features (current)

- **Today** — current season, liturgical color, position within the season, next feast and reading teasers
- **Grid** — month view with per-day season borders and feast markers; tap a day for its detail sheet
- **Wheel** — circular year view with a "today" hand and tappable wedges showing date ranges; separate Western and Orthodox wheels (Orthodox further splits by Gregorian/Julian calendar)
- **Prayer** — BCP Daily Office (Morning/Evening/Sunday), Catholic Mass readings + key prayers, Orthodox daily cycle + key prayers — all in public-domain/traditional text
- **Feasts** — browsable feast days with short bios
- Tradition switcher (Catholic / Anglican / Orthodox) and, for Orthodox, a Gregorian/Julian calendar switcher

## Stack

- [Vite](https://vite.dev/) + React 19
- [Tailwind CSS](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the manifest, icons, and offline service worker
- [lucide-react](https://lucide.dev/) for icons

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Roadmap

1. Real date-calculation engine (Western Easter algorithm, Orthodox Paschalion, derived season boundaries) replacing the static demo data
2. Actual feast/reading/prayer data per tradition and date, not just the demo entries
3. `.ics` export and Google Calendar sync
4. Licensing decision for prayer/reading translations (currently public-domain/traditional text only)
