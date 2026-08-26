# Officium — Liturgical Calendar

**Officium** is a mobile-first web app for tracking your place in the Christian liturgical year — the cycle of
seasons, feast days, and daily prayer that runs alongside the ordinary calendar. It supports **Catholic, Anglican,
and Orthodox** traditions, each with their own season boundaries, feast days, liturgical colors, and daily office.

🔗 **[Open the app](https://officiumliturgy.com)** — installable as a PWA, works offline.

## What it does

The liturgical year isn't a fixed grid — it moves. Easter (and Orthodox Pascha) falls on a different date every
year, and everything from Ash Wednesday to the start of Advent shifts around it. Officium tracks where you are in
that cycle right now, and lets you look ahead or back.

- **Today** — your current season, its liturgical color, how far through it you are, and what's coming next
- **Calendar** — a familiar month-by-month grid, with each day colored by its liturgical season and feast days marked
- **Chart** — a circular, at-a-glance view of the whole year — Advent, Christmas, Lent, Easter, and Ordinary Time laid out as a wheel instead of a list, so you can see the shape of the year rather than just the next date
- **Prayer** — the Daily Office for your tradition: Morning/Evening/Eucharist prayer (Anglican, Book of Common Prayer), Mass readings and key prayers (Catholic), and the daily cycle and key prayers (Orthodox) — all traditional or public-domain text
- **Feasts** — a browsable list of upcoming feast days with short biographies of the saints and events behind them

Switch tradition at any time (Catholic / Anglican / Orthodox), and Orthodox users can further choose between the
Gregorian ("New Calendar") and Julian ("Old Calendar") reckonings, since these can place fixed feasts weeks apart.

## Why

Most calendar apps only know about the civil year. If you've ever lost track of whether you're in Ordinary Time or
Lent, or wanted a quick reference for which color the vestments should be this Sunday, this app is for that. It's
built to be glanced at daily — light enough to open on your phone each morning, with a proper desktop layout too.

## Privacy

Officium stores your settings (tradition, calendar, theme) only in your browser's local storage — never on a
server, never tied to an account, because there are no accounts. Optional, privacy-conscious analytics (Google
Analytics) are off by default and only switch on if you explicitly accept the cookie prompt; you can change your
mind at any time from Settings. Full details are in the in-app Privacy Policy (Settings → Privacy & Cookies).

## Status

The core app is fully built: real season/feast-date calculations for any year (Western Easter and Orthodox Pascha
algorithms, not lookup tables), full-text scripture readings from the public-domain World English Bible, and a
working Calendar/Chart/Prayer/Feasts UI across all three traditions.

**Lectionary accuracy varies by tradition and reading type right now:**

| | Weekday | Sunday |
|---|---|---|
| Anglican Eucharist | ✅ Real (Common Worship Daily Eucharistic Lectionary) | ✅ Real (Revised Common Lectionary, Years A/B/C) |
| Anglican Morning/Evening Prayer | ✅ Real | ✅ Real |
| Catholic Mass | ✅ Real | ✅ Real |
| Orthodox daily cycle | ✅ Real | ✅ Real |

The Anglican Eucharist reading shown for today's date is the actual citation from the Common Worship lectionary —
tap it to read the real passage. Everything still marked "demo text" above shows a fixed placeholder reading
regardless of the date; see [Roadmap](#roadmap).

## Tech stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — installable PWA manifest, icons, offline service worker
- [lucide-react](https://lucide.dev/) — icons
- Google Analytics (GA4), loaded only after cookie consent

No backend — it's a fully static, client-side app. All user preferences persist via `localStorage`.

## Running it locally

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Roadmap

1. **Anglican Daily Office** — Morning/Evening Prayer Old/New Testament readings (Common Worship Table 2) and the
   psalm tables (Tables 3-5), replacing the current demo text the same way the Eucharist reading was
2. **Catholic Mass readings** — the Roman Lectionary's Sunday (Years A/B/C) and weekday (Years I/II) cycles
3. **Orthodox daily cycle** — the Byzantine lectionary, which follows Pascha rather than the Western calendar and
   needs its own engine (structurally unrelated to the Western tables above)
4. **Calendar export** — `.ics` download and Google Calendar sync, so feast days and season changes show up
   alongside your other events
5. Licensing review for prayer/reading translations (currently public-domain/traditional text only)

## Contributing

This is a solo, early-stage project — issues and suggestions are welcome via the
[GitHub issue tracker](https://github.com/MrLewk/liturgical-calendar-app/issues). Pull requests are welcome too,
though given large parts of the lectionary data are still demo text (see [Status](#status)), it's worth opening an
issue first to check a change fits the roadmap.

## License

See [LICENSE](./LICENSE).
