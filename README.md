# Officium — Liturgical Calendar

**Officium** is a mobile-first web app for tracking your place in the Christian liturgical year — the cycle of
seasons, feast days, and daily prayer that runs alongside the ordinary calendar. It supports **Catholic, Anglican,
and Orthodox** traditions, each with their own season boundaries, feast days, liturgical colors, and daily office.

🔗 **[Open the app](https://officiumliturgy.com)** — installable as a PWA, works offline.

## What it does

The liturgical year isn't a fixed grid — it moves. Easter (and Orthodox Pascha, calculated separately) falls on a
different date every year, and everything from Ash Wednesday to the start of Advent shifts around it. Officium
tracks where you are in that cycle right now, and lets you look ahead or back.

- **Today** — your current season, its liturgical color, a fasting/abstinence indicator on days it applies, how far through the season you are, and what's coming next
- **Calendar** — a familiar month-by-month grid, with each day colored by its liturgical season and feast days marked
- **Chart** — a circular, at-a-glance view of the whole year — Advent, Christmas, Lent, Easter, and Ordinary Time laid out as a wheel instead of a list, so you can see the shape of the year rather than just the next date
- **Prayer** — the Daily Office for your tradition, with real, date-driven scripture readings throughout (see [Status](#status)):
  - **Anglican** — Morning/Evening Prayer (1662 Book of Common Prayer or Common Worship) and the Eucharistic lectionary
  - **Catholic** — all five hours of the Liturgy of the Hours (Office of Readings, Lauds, Daytime Prayer, Vespers, Compline) plus Mass, with a Novus Ordo/Traditional Latin Mass toggle
  - **Orthodox** — Matins, the Daily Cycle (Epistle/Gospel), and Vespers, including the Sunday Resurrection Gospel cycle and Vesperal Old Testament readings on major feasts
- **Feasts** — a browsable list of upcoming feast days with short biographies of the saints and events behind them

Switch tradition at any time (Catholic / Anglican / Orthodox), and Orthodox users can further choose between the
Gregorian ("New Calendar") and Julian ("Old Calendar") reckonings, since these can place fixed feasts weeks apart.

## Why

Most calendar apps only know about the civil year. If you've ever lost track of whether you're in Ordinary Time or
Lent, wanted a quick reference for which color the vestments should be this Sunday, or needed to check whether
today's a fasting day, this app is for that. It's built to be glanced at daily — light enough to open on your
phone each morning, with a proper desktop layout too.

## Privacy

Officium stores your settings (tradition, calendar, theme) only in your browser's local storage — never on a
server, never tied to an account, because there are no accounts. Optional, privacy-conscious analytics (Google
Analytics) are off by default and only switch on if you explicitly accept the cookie prompt; you can change your
mind at any time from Settings. Full details are in the in-app Privacy Policy (Settings → Privacy & Cookies).

## Status

The core app is fully built: real season/feast-date calculations for any year (Western Easter and Orthodox Pascha
algorithms, not lookup tables), full-text scripture readings from the public-domain World English Bible, and a
working Calendar/Chart/Prayer/Feasts UI across all three traditions. Every tradition now has real, date-driven
lectionary content — see the table below for exactly what's real versus a documented gap.

| | Sunday | Weekday | Fixed feasts |
|---|---|---|---|
| Anglican Eucharist | ✅ Real (Revised Common Lectionary, Years A/B/C) | ✅ Real (Common Worship Daily Eucharistic Lectionary) | ✅ Real |
| Anglican Morning/Evening Prayer | ✅ Real (1662 & Common Worship) | ✅ Real | ✅ Real |
| Catholic Mass | ✅ Real (Years A/B/C) | ✅ Real (Years I/II) | ✅ Real |
| Catholic Office (all 5 hours) | ✅ Real | ✅ Real | ✅ Real major feasts |
| Orthodox Daily Cycle (Epistle/Gospel) | ✅ Real (Slavic tradition) | ✅ Real (Slavic tradition) | ✅ Real (Slavic tradition) |
| Orthodox Matins/Vespers | ✅ Real fixed framework + Sunday Gospel cycle & feast-day OT readings | | |

**Known, documented gaps** (shown honestly as a fallback rather than guessed at):

- **Orthodox** — Great Lent weekday readings (there genuinely is no Divine Liturgy, and so no Epistle/Gospel, on
  an ordinary Lenten weekday in Byzantine practice), the Annunciation's Epistle/Gospel (its readings vary by which
  Holy Week/Lent day it falls on each year rather than being a simple fixed citation), tone-based hymnography
  (troparia, stichera, the 8-tone Octoechos cycle — would need an entirely different data source), saints/
  commemorations of the day, and a Greek-tradition toggle (the data exists but the underlying Sunday-numbering
  algorithm is meaningfully more complex and still labeled "beta" even by its upstream source)
- **Catholic** — the Office of Readings' patristic/magisterial Second Reading (a separate, more complex copyright
  question than a plain citation), and the fuller fasting calendar the Traditional Latin Mass historically observed
- **Anglican** — the 1662 Book of Common Prayer's list of feast Vigils, and Common Worship's seasonal Old/New
  Testament canticle rotation (currently a fixed set rather than date-driven)
- **All three traditions** — fasting/abstinence indications are a simple daily indicator (fast/no-fast plus a
  strictness level), not a full multi-grade rule engine, and don't yet account for a feast day lifting an
  otherwise-fasting day

Full version-by-version detail is in [changelog.md](./changelog.md).

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

Roughly in priority order:

1. **Orthodox saints/commemorations of the day** and **Greek-tradition toggle** — both flagged above as open gaps;
   the Greek one in particular needs a genuinely separate Sunday-numbering algorithm, not just a data swap
2. **Common Worship seasonal canticle rotation** — replacing the current fixed Old/New Testament canticles with
   the proper date-driven rotation
3. **2019 ACNA Book of Common Prayer** — the next full prayer-book edition to add, after 1662 and Common Worship
4. **Calendar export** — `.ics` download and Google Calendar sync, so feast days and season changes show up
   alongside your other events
5. Further-out prayer-book editions under consideration: 1979 TEC, 1928 USA
6. Licensing review for prayer/reading translations (currently public-domain/traditional text only)

## Contributing

This is a solo, early-stage project — issues and suggestions are welcome via the
[GitHub issue tracker](https://github.com/MrLewk/liturgical-calendar-app/issues). Pull requests are welcome too,
though given some lectionary data is still a documented gap (see [Status](#status)), it's worth opening an issue
first to check a change fits the roadmap.

## License

See [LICENSE](./LICENSE).

