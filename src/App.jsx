import React, { useState, useEffect, useMemo } from "react";
import { Flame, CalendarDays, CircleDot, Star, Settings2, ChevronRight, ChevronLeft, Download, BookOpen, Sun, Moon, SunMoon, X } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { alpha, seasonAccent } from "./theme";
import UpdateToast from "./UpdateToast";
import CookieConsent from "./CookieConsent";
import { usePersistedState } from "./usePersistedState";
import { loadGoogleAnalytics, disableGoogleAnalytics } from "./analytics";
import { CHANGELOG } from "./changelogData";
import { liturgicalYearData, seasonAt, feastOnDate, upcomingFeasts, withDisplay } from "./lib/feasts";
import { buildIcs, downloadIcs } from "./lib/ics";
import { dateOnly, daysBetween } from "./lib/dates";
import { getPassage, bibleGatewayUrl, DEFAULT_WEB_VERSION, WEB_VERSION_LABELS } from "./lib/scripture";
import { BIBLEGATEWAY_VERSIONS } from "./data/bibleGatewayVersions";
import { eucharistReadingFor, sundayReadingFor } from "./lib/lectionary";
import { splitCitation } from "./lib/citationNormalize";
import { parseReference, formatReference } from "./lib/bibleRef";
import { bookDisplayName } from "./data/bibleBooks";

const TRADITIONS = ["Catholic", "Anglican", "Orthodox"];

/** "Aug 24" style short date, used throughout for feast/day labels. */
function shortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Refreshes once a minute so the app notices a real day/date rollover
 * without needing a full page reload — cheap, since it's just a Date
 * comparison, and everything derived from it (season, feasts, wheel, grid)
 * is memoized off this single value.
 */
function useToday() {
  const [today, setToday] = useState(() => dateOnly(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const now = dateOnly(new Date());
      setToday((prev) => (prev.getTime() === now.getTime() ? prev : now));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

// Demo readings and prayers, text in the public-domain King James Version /
// 1662 Book of Common Prayer / ancient liturgical formulas, so the mockup can
// show full text without a licensing question. Modern official translations
// (current ICEL Roman Missal, RCL, many Orthodox service books) are usually
// copyrighted — a real build would need to license those or fall back to a
// public-domain/traditional rendering as done here.
const READINGS = {
  Anglican: {
    kind: "office",
    am: {
      label: "Morning Prayer",
      icon: "sun",
      sequence: [
        {
          type: "prayer",
          role: "Confession",
          ref: "General Confession",
          text: "Almighty and most merciful Father, we have erred and strayed from thy ways like lost sheep. We have followed too much the devices and desires of our own hearts. We have offended against thy holy laws. But thou, O Lord, have mercy upon us, miserable offenders.",
        },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Venite, Psalm 95",
          text: "O come, let us sing unto the Lord: let us heartily rejoice in the strength of our salvation. Let us come before his presence with thanksgiving: and shew ourselves glad in him with psalms. For the Lord is a great God: and a great King above all gods.",
          truncated: true,
        },
        { type: "reading", ref: "Isaiah 26:1–9", text: "In that day shall this song be sung in the land of Judah; We have a strong city; salvation will God appoint for walls and bulwarks. Open ye the gates, that the righteous nation which keepeth the truth may enter in.", truncated: true },
        { type: "reading", ref: "Galatians 5:16–25", text: "This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh. For the flesh lusteth against the Spirit, and the Spirit against the flesh: and these are contrary the one to the other.", truncated: true },
        {
          type: "prayer",
          role: "Collect",
          ref: "Collect for Grace",
          text: "O Lord, our heavenly Father, Almighty and everlasting God, who hast safely brought us to the beginning of this day: Defend us in the same with thy mighty power, and grant that this day we fall into no sin, neither run into any kind of danger; through Jesus Christ our Lord. Amen.",
        },
      ],
    },
    pm: {
      label: "Evening Prayer",
      icon: "moon",
      sequence: [
        {
          type: "prayer",
          role: "Confession",
          ref: "General Confession",
          text: "Almighty and most merciful Father, we have erred and strayed from thy ways like lost sheep. We have followed too much the devices and desires of our own hearts. But thou, O Lord, have mercy upon us, miserable offenders.",
          truncated: true,
        },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Magnificat, Luke 1",
          text: "My soul doth magnify the Lord: and my spirit hath rejoiced in God my Saviour. For he hath regarded: the lowliness of his handmaiden. For behold, from henceforth: all generations shall call me blessed.",
          truncated: true,
        },
        { type: "reading", ref: "Job 1:1–22", text: "There was a man in the land of Uz, whose name was Job; and that man was perfect and upright, and one that feared God, and eschewed evil.", truncated: true },
        { type: "reading", ref: "Luke 12:22–31", text: "And he said unto his disciples, Therefore I say unto you, Take no thought for your life, what ye shall eat; neither for the body, what ye shall put on.", truncated: true },
        {
          type: "prayer",
          role: "Collect",
          ref: "Collect for Aid against All Perils",
          text: "Lighten our darkness, we beseech thee, O Lord, and by thy great mercy defend us from all perils and dangers of this night, for the love of thy only Son, our Saviour Jesus Christ. Amen.",
        },
      ],
    },
    eucharist: {
      label: "Sunday, Aug 23",
      icon: "sun",
      sequence: [
        {
          type: "prayer",
          role: "Collect",
          ref: "Collect for Purity",
          text: "Almighty God, unto whom all hearts be open, all desires known, and from whom no secrets are hid: Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. Amen.",
        },
        { type: "reading", ref: "Jeremiah 1:4–10", text: "Then the word of the Lord came unto me, saying, Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet unto the nations.", truncated: true },
        { type: "reading", ref: "Psalm 71:1–6", text: "In thee, O Lord, do I put my trust: let me never be put to confusion. Deliver me in thy righteousness, and cause me to escape: incline thine ear unto me, and save me." },
        { type: "reading", ref: "Hebrews 12:18–29", text: "For ye are not come unto the mount that might be touched, and that burned with fire, nor unto blackness, and darkness, and tempest.", truncated: true },
        { type: "reading", ref: "Luke 13:10–17", text: "And he was teaching in one of the synagogues on the sabbath. And, behold, there was a woman which had a spirit of infirmity eighteen years, and was bowed together.", truncated: true },
      ],
    },
  },
  Catholic: {
    kind: "mass",
    mass: {
      label: "Daily Mass",
      sequence: [
        {
          type: "prayer",
          role: "Penitential Act",
          ref: "Confiteor (traditional form)",
          text: "I confess to Almighty God, to blessed Mary ever Virgin, to blessed Michael the Archangel, to the holy Apostles Peter and Paul, to all the Saints, and to you, that I have sinned exceedingly, in thought, word, and deed: through my fault, through my fault, through my most grievous fault.",
        },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Gloria in excelsis",
          text: "Glory be to God on high, and in earth peace, good will towards men. We praise thee, we bless thee, we worship thee, we glorify thee, we give thanks to thee for thy great glory, O Lord God, heavenly King, God the Father Almighty.",
          truncated: true,
        },
        {
          type: "prayer",
          role: "Collect",
          ref: "Opening Prayer",
          text: "O God, from whom all holy desires, all good counsels, and all just works do proceed: give unto thy servants that peace which the world cannot give, that our hearts may be set to obey thy commandments; through the merits of Jesus Christ our Saviour. Amen.",
          truncated: true,
        },
        { type: "reading", role: "First Reading", ref: "Ezekiel 43:1–7", text: "Afterward he brought me to the gate, even the gate that looketh toward the east: And, behold, the glory of the God of Israel came from the way of the east: and his voice was like a noise of many waters.", truncated: true },
        { type: "reading", role: "Responsorial Psalm", ref: "Psalm 85:9–14", text: "Surely his salvation is nigh them that fear him; that glory may dwell in our land. Mercy and truth are met together; righteousness and peace have kissed each other." },
        { type: "reading", role: "Gospel", ref: "Matthew 23:1–12", text: "Then spake Jesus to the multitude, and to his disciples, Saying, The scribes and the Pharisees sit in Moses' seat: All therefore whatsoever they bid you observe, that observe and do.", truncated: true },
      ],
    },
  },
  Orthodox: {
    kind: "epistle-gospel",
    daily: {
      label: "Daily Cycle",
      sequence: [
        {
          type: "prayer",
          role: "Opening Prayers",
          ref: "Trisagion",
          text: "Holy God, Holy Mighty, Holy Immortal, have mercy on us. (Thrice.) Glory to the Father, and to the Son, and to the Holy Spirit, both now and ever, and unto ages of ages. Amen.",
        },
        {
          type: "prayer",
          role: "Troparion",
          ref: "Resurrectional Troparion, Tone 1",
          text: "While the stone was sealed by the Jews, and the soldiers were guarding thy most pure body, thou didst rise on the third day, O Saviour, granting life to the world. Wherefore the powers of heaven cried out to thee, O Giver of Life: Glory to thy resurrection, O Christ.",
          truncated: true,
        },
        { type: "reading", role: "Epistle", ref: "1 Corinthians 9:2–12", text: "If I be not an apostle unto others, yet doubtless I am to you: for the seal of mine apostleship are ye in the Lord. Mine answer to them that do examine me is this.", truncated: true },
        { type: "reading", role: "Gospel", ref: "Matthew 18:23–35", text: "Therefore is the kingdom of heaven likened unto a certain king, which would take account of his servants. And when he had begun to reckon, one was brought unto him, which owed him ten thousand talents.", truncated: true },
        {
          type: "prayer",
          role: "Hymn to the Theotokos",
          ref: "Axion Estin",
          text: "It is truly meet to bless thee, O Theotokos, ever blessed and most pure, and the Mother of our God. More honorable than the Cherubim, and more glorious beyond compare than the Seraphim, thou who without corruption gavest birth to God the Word, true Theotokos, we magnify thee.",
          truncated: true,
        },
      ],
    },
  },
};

const WEEKDAY_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A cleaner "Book Chapter:Verse" display string for a citation ref,
 * falling back to the raw ref if it doesn't parse (still safe to hand to
 * the passage modal either way — this is display-only). */
function displayRef(ref) {
  const parsed = parseReference(ref);
  if (!parsed) return ref;
  return formatReference(parsed, bookDisplayName(parsed.code));
}

/**
 * The real Anglican reading list for `date` — Sunday Principal Service
 * (RCL) on Sundays, Common Worship Daily Eucharistic Lectionary on
 * weekdays — as an array of { role, ref } items, or null if `date` falls
 * in one of the lectionary engine's known gaps (see lib/lectionary.js).
 * Shared by the full Readings tab, the Today teaser, and the day-detail
 * sheet so all three agree on the same real citations for a given day.
 */
function anglicanReadingItems(date) {
  const isSunday = date.getDay() === 0;

  if (isSunday) {
    const result = sundayReadingFor(date);
    if (!result || !result.readings) return null;
    const { title, readings } = result;
    const isProper = readings.length === 4 && (readings[0].includes(" and ") || readings[1].includes(" and "));
    let refs;
    if (isProper) {
      const track1 = splitCitation(readings[0]);
      refs = [
        { role: "First Reading", ref: track1[0] },
        { role: "Psalm", ref: track1[1] },
        { role: "Second Reading", ref: readings[2] },
        { role: "Gospel", ref: readings[3] },
      ];
    } else {
      const roles = ["First Reading", "Psalm", "Second Reading", "Gospel"];
      refs = readings.map((r, i) => ({ role: roles[i] || "Reading", ref: splitCitation(r)[0] || r }));
    }
    const items = refs.filter((r) => r.ref).map((r) => ({ role: r.role, ref: displayRef(r.ref) }));
    return { label: title, items };
  }

  const result = eucharistReadingFor(date);
  if (!result || !result.citation) return null;
  const parts = splitCitation(result.citation);
  const roles = parts.map((p) => (/^Ps(alm)?\b/i.test(p) ? "Psalm" : null));
  roles[0] = roles[0] || "First Reading";
  roles[roles.length - 1] = roles[roles.length - 1] === "Psalm" ? "Gospel" : roles[roles.length - 1] || "Gospel";
  const items = parts.map((p, i) => ({ role: roles[i], ref: displayRef(p) }));
  return { label: `${result.week}, ${WEEKDAY_NAME[date.getDay()]}`, items };
}

/**
 * Builds today's REAL Anglican Eucharist readings — the Sunday Principal
 * Service (RCL) lectionary on Sundays, the Common Worship Daily
 * Eucharistic Lectionary (Table 6) on weekdays — replacing the fixed demo
 * citation. Falls back to the static demo entry when today's date falls
 * in one of the lectionary engine's known gaps (see lib/lectionary.js).
 */
function buildAnglicanEucharist(today) {
  const fallback = READINGS.Anglican.eucharist;
  const collect = fallback.sequence[0]; // keep the Collect for Purity as-is
  const isSunday = today.getDay() === 0;

  const result = anglicanReadingItems(today);
  if (!result) {
    const gapNote = isSunday ? "Sunday reading not covered yet" : "weekday reading not covered yet";
    return { ...fallback, label: `${shortDate(today)} · demo text (${gapNote})` };
  }
  return {
    label: `${result.label} · ${shortDate(today)}`,
    icon: "sun",
    sequence: [collect, ...result.items.map((item) => ({ type: "reading", role: item.role, ref: item.ref }))],
  };
}

// Returns the first scripture reading (skipping opening prayers) so the
// Today teaser and day-detail sheet show a citation, not a prayer title.
function firstReadingRef(tradition) {
  const data = READINGS[tradition];
  const sequence = data.kind === "office" ? data.am.sequence : data.kind === "mass" ? data.mass.sequence : data.daily.sequence;
  const reading = sequence.find((item) => item.type === "reading");
  return reading ? reading.ref : sequence[0].ref;
}

/**
 * The reading citation(s) to show for `date` in compact contexts (the
 * Today teaser, the day-detail sheet from Grid/Wheel): real Sunday RCL or
 * weekday DEL readings for Anglican (all of them, correctly split by
 * day-of-week), falling back to the single fixed demo citation for
 * Catholic/Orthodox (not wired to a real per-date lectionary yet) or for
 * any Anglican date that falls in a known gap.
 */
function dayReadingItems(tradition, date) {
  if (tradition === "Anglican") {
    const result = anglicanReadingItems(date);
    if (result) return result.items;
  }
  return [{ role: null, ref: firstReadingRef(tradition) }];
}

function polarToXY(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polarToXY(cx, cy, r, startDeg);
  const [x2, y2] = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export default function App() {
  const theme = useTheme();
  const [tab, setTab] = useState("today");
  const [tradition, setTradition] = usePersistedState("officium-tradition", "Catholic");
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedFeast, setSelectedFeast] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  // The date the Prayer & Readings tab is showing. null = today (the live
  // clock); set to a specific date when opened from a day-detail sheet so
  // that day's actual readings show, not today's.
  const [readingsViewDate, setReadingsViewDate] = useState(null);
  const [calendar, setCalendar] = usePersistedState("officium-calendar", "Gregorian"); // "Gregorian" (New Calendar) | "Julian" (Old Calendar) — only meaningful for Orthodox
  const [cookieConsent, setCookieConsent] = usePersistedState("officium-cookie-consent", null); // null (undecided) | "accepted" | "rejected"
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  // "auto" follows the tradition -> WEB edition mapping in DEFAULT_WEB_VERSION;
  // otherwise pinned to one of the three bundled editions regardless of tradition.
  const [webBibleVersion, setWebBibleVersion] = usePersistedState("officium-bible-version", "auto");
  // BibleGateway.com version code preselected on the "Open on BibleGateway" link.
  const [bibleGatewayVersion, setBibleGatewayVersion] = usePersistedState("officium-biblegateway-version", "NRSVA");
  const [scriptureRef, setScriptureRef] = useState(null); // reference string, or null when the modal is closed
  const resolvedWebVersion = webBibleVersion === "auto" ? DEFAULT_WEB_VERSION[tradition] || "engwebu" : webBibleVersion;

  const today = useToday();
  const { seasons, feasts } = useMemo(() => liturgicalYearData(tradition, calendar, today), [tradition, calendar, today]);
  const season = useMemo(() => withDisplay(seasonAt(seasons, today), today, tradition, seasons), [seasons, today, tradition]);
  const nextFeast = useMemo(() => upcomingFeasts(tradition, calendar, today, 1)[0] || null, [tradition, calendar, today]);

  // Google Analytics is only ever loaded here, gated on consent — never on
  // app start regardless of consent state. Covers both the initial decision
  // and someone changing their mind later via Settings.
  useEffect(() => {
    if (cookieConsent === "accepted") {
      loadGoogleAnalytics();
    } else if (cookieConsent === "rejected") {
      disableGoogleAnalytics();
    }
  }, [cookieConsent]);
  const accent = seasonAccent(season, theme.mode);
  const progressPct = Math.round((season.dayInSeason / season.seasonLength) * 100);

  const navItems = [
    { key: "today", icon: Flame, label: "Today" },
    { key: "grid", icon: CalendarDays, label: "Calendar" },
    { key: "wheel", icon: CircleDot, label: "Chart" },
    { key: "readings", icon: BookOpen, label: "Prayer" },
    { key: "feasts", icon: Star, label: "Feasts" },
  ];

  const content = (
    <>
      {tab === "today" && (
        <TodayView
          season={season}
          seasons={seasons}
          today={today}
          nextFeast={nextFeast}
          progressPct={progressPct}
          onSelectFeast={setSelectedFeast}
          onOpenReadings={() => {
            setReadingsViewDate(null);
            setTab("readings");
          }}
          onOpenExport={() => setShowExport(true)}
          tradition={tradition}
          calendar={calendar}
        />
      )}
      {tab === "grid" && (
        <GridView today={today} tradition={tradition} calendar={calendar} onSelectDay={setSelectedDay} />
      )}
      {tab === "wheel" && <WheelView season={season} seasons={seasons} today={today} tradition={tradition} calendar={calendar} />}
      {tab === "readings" && (
        <ReadingsView
          tradition={tradition}
          season={season}
          today={today}
          viewDate={readingsViewDate}
          onBackToToday={() => setReadingsViewDate(null)}
          onOpenPassage={setScriptureRef}
        />
      )}
      {tab === "feasts" && (
        <FeastsView tradition={tradition} calendar={calendar} today={today} onSelectFeast={setSelectedFeast} />
      )}
    </>
  );

  return (
    <div className="w-full flex" style={{ minHeight: "100dvh", backgroundColor: theme.bgOuter }}>
      {/* Desktop sidebar — replaces the mobile header + bottom tab bar at the lg breakpoint */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-[100dvh] lg:overflow-y-auto w-[280px] flex-shrink-0 border-r px-5 py-8"
        style={{ borderColor: theme.border, backgroundColor: theme.surfaceRaised }}
      >
        <div className="px-2 mb-10">
          <p className="text-[12px] uppercase tracking-[0.25em] mb-1.5" style={{ color: accent }}>
            {tradition}
          </p>
          <h1 className="flex items-center gap-2 text-[26px] tracking-wide" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
            <img src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-full flex-shrink-0" />
            Officium
          </h1>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <SidebarNavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={tab === item.key}
              color={accent}
              onClick={() => { setTab(item.key); if (item.key === "readings") setReadingsViewDate(null); }}
            />
          ))}
        </nav>

        <div className="flex-1" />

        {/* Coffee donation section */}
        <div className="px-2 mb-5 pb-5 border-t" style={{ borderColor: theme.border }}>
          <CoffeeSection />
        </div>

        <div className="flex items-center gap-2 px-2">
          <ThemeToggleButton />
          <button
            onClick={() => setShowSettings(true)}
            className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px]"
            style={{ backgroundColor: theme.bg, color: alpha(theme.text, 0.8) }}
          >
            <Settings2 size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main column — offset by the sidebar's fixed width on desktop, since a
          position:fixed element is removed from normal document flow. */}
      <div className="flex-1 flex items-center justify-center lg:items-stretch lg:justify-stretch lg:ml-[280px]">
        <div
          className="relative w-full max-w-[480px] lg:max-w-none flex flex-col h-[100dvh] sm:h-[calc(100dvh-3rem)] lg:h-[100dvh] sm:my-6 sm:rounded-[2rem] sm:shadow-2xl lg:my-0 lg:rounded-none lg:shadow-none overflow-hidden lg:overflow-visible"
          style={{ backgroundColor: theme.bg }}
        >
          {/* Mobile header — hidden on desktop, where the sidebar covers this role.
              Padded for the device status bar / notch via safe-area-inset. */}
          <div
            className="lg:hidden flex-shrink-0 flex items-center justify-between px-5 pb-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: accent }}>
                {tradition}
              </p>
              <h1 className="flex items-center gap-1.5 text-[15px] tracking-wide" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
                <img src="/icons/icon-192.png" alt="" width={18} height={18} className="rounded-full flex-shrink-0" />
                Officium
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <button
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.surface }}
              >
                <Settings2 size={16} color={alpha(theme.text, 0.6)} />
              </button>
            </div>
          </div>

          {/* Scrollable content — min-h-0 is required here so this area scrolls
              internally instead of stretching the flex column (which would drag
              the header and tab bar along with it) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 lg:px-12 lg:py-10 no-scrollbar">
            {content}
          </div>

          {/* Bottom tab bar — hidden on desktop. Padded for the home indicator via safe-area-inset */}
          <div
            className="lg:hidden flex-shrink-0 flex items-center justify-around border-t px-1 pt-2"
            style={{
              borderColor: theme.surface,
              backgroundColor: theme.surfaceRaised,
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
            }}
          >
            {navItems.map((item) => (
              <TabButton
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={tab === item.key}
                color={accent}
                onClick={() => { setTab(item.key); if (item.key === "readings") setReadingsViewDate(null); }}
              />
            ))}
          </div>

          {/* Settings sheet */}
          {showSettings && (
            <SettingsSheet
              tradition={tradition}
              calendar={calendar}
              onApply={(t, c) => {
                setTradition(t);
                setCalendar(c);
              }}
              onClose={() => setShowSettings(false)}
              season={season}
              cookieConsent={cookieConsent}
              onChangeCookieConsent={setCookieConsent}
              onOpenPrivacy={() => setShowPrivacy(true)}
              onOpenChangelog={() => setShowChangelog(true)}
              webBibleVersion={webBibleVersion}
              onChangeWebBibleVersion={setWebBibleVersion}
              bibleGatewayVersion={bibleGatewayVersion}
              onChangeBibleGatewayVersion={setBibleGatewayVersion}
            />
          )}

          {/* Privacy Policy sheet — reachable from the cookie banner and from Settings */}
          {showPrivacy && <PrivacyPolicySheet onClose={() => setShowPrivacy(false)} />}

          {/* Changelog sheet — reachable from Settings */}
          {showChangelog && <ChangelogSheet onClose={() => setShowChangelog(false)} />}

          {/* Scripture passage sheet — reachable from any reading citation on the Readings tab */}
          {scriptureRef && (
            <ScripturePassageModal
              key={scriptureRef}
              reference={scriptureRef}
              webVersion={resolvedWebVersion}
              bibleGatewayVersion={bibleGatewayVersion}
              season={season}
              onClose={() => setScriptureRef(null)}
            />
          )}

          {/* Export / sync-to-calendar sheet */}
          {showExport && (
            <ExportSheet
              tradition={tradition}
              calendar={calendar}
              onClose={() => setShowExport(false)}
              season={season}
            />
          )}

          {/* Feast bio sheet — reachable from Today's "Next feast", the Feasts tab, and a day's detail sheet */}
          {selectedFeast && <FeastModal feast={selectedFeast} onClose={() => setSelectedFeast(null)} />}

          {/* Day detail sheet — reachable by tapping any day on the Grid tab */}
          {selectedDay && !selectedFeast && (
            <DayDetailSheet
              date={selectedDay}
              tradition={tradition}
              calendar={calendar}
              onClose={() => setSelectedDay(null)}
              onOpenFeast={(f) => {
                setSelectedDay(null);
                setSelectedFeast(f);
              }}
              onOpenReadingsForDay={(d) => {
                setReadingsViewDate(d);
                setTab("readings");
                setSelectedDay(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Cookie consent banner — shown until the person accepts or rejects.
          No dismiss button; the choice itself is what closes it. */}
      {cookieConsent === null && (
        <CookieConsent
          onAccept={() => setCookieConsent("accepted")}
          onReject={() => setCookieConsent("rejected")}
          onOpenPrivacy={() => setShowPrivacy(true)}
        />
      )}

      <UpdateToast />
    </div>
  );
}

function SidebarNavButton({ icon: Icon, label, active, color, onClick }) {
  const theme = useTheme();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-[16px] text-left"
      style={{
        backgroundColor: active ? alpha(color, 0.14) : "transparent",
        color: active ? color : alpha(theme.text, 0.65),
      }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
      {label}
    </button>
  );
}

function ThemeToggleButton() {
  const theme = useTheme();
  const Icon = theme.mode === "system" ? SunMoon : theme.effectiveMode === "dark" ? Moon : Sun;
  return (
    <button
      onClick={theme.toggle}
      title={theme.mode === "system" ? "Following system — tap to override" : `Switch to ${theme.effectiveMode === "dark" ? "light" : "dark"}`}
      className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center"
      style={{ backgroundColor: theme.surface }}
    >
      <Icon size={16} color={alpha(theme.text, 0.6)} />
    </button>
  );
}

function SheetOverlay({ onClose, children }) {
  const theme = useTheme();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }} />
      <div
        className="relative w-full lg:w-auto lg:min-w-[480px] lg:max-w-[560px] rounded-t-3xl lg:rounded-2xl p-6 lg:p-8 pb-10 lg:pb-8 max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{ backgroundColor: theme.surfaceRaised }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Own row (not absolutely overlaid) so a long heading in any sheet
            below can never render underneath the close button. */}
        <div className="relative flex items-center justify-center mb-5" style={{ minHeight: 32 }}>
          <div className="w-10 h-1 rounded-full lg:hidden" style={{ backgroundColor: theme.border }} />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.bg }}
          >
            <X size={15} color={alpha(theme.text, 0.6)} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Groups the flat BIBLEGATEWAY_VERSIONS list into [language, versions][]
// pairs (in first-seen order) so it can back a native <select> with
// <optgroup> sections — much more scannable than 233 flat options.
function groupVersionsByLanguage(versions) {
  const order = [];
  const groups = new Map();
  for (const v of versions) {
    const key = v.language || "Other";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(v);
  }
  return order.map((language) => [language, groups.get(language)]);
}

function SettingsSheet({
  tradition,
  calendar,
  onApply,
  onClose,
  season,
  cookieConsent,
  onChangeCookieConsent,
  onOpenPrivacy,
  onOpenChangelog,
  webBibleVersion,
  onChangeWebBibleVersion,
  bibleGatewayVersion,
  onChangeBibleGatewayVersion,
}) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  // Local draft so picking an option doesn't change the app until confirmed —
  // gives the user a clear moment where the change actually takes effect.
  const [draft, setDraft] = useState(tradition);
  const [draftCalendar, setDraftCalendar] = useState(calendar);
  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
        Tradition
      </p>
      <div className="space-y-2">
        {TRADITIONS.map((t) => (
          <button
            key={t}
            onClick={() => setDraft(t)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px]"
            style={{
              backgroundColor: draft === t ? alpha(season.color, 0.2) : theme.bg,
              color: theme.text,
              border: draft === t ? `1px solid ${accent}` : "1px solid transparent",
            }}
          >
            {t}
            {draft === t && <span style={{ color: accent }}>●</span>}
          </button>
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] mb-3 mt-5" style={{ color: alpha(theme.text, 0.4) }}>
        Calendar
      </p>
      {draft === "Orthodox" ? (
        <>
          <div className="space-y-2">
            {[
              { key: "Gregorian", label: "Gregorian", sub: "New Calendar — most Greek, Antiochian, Romanian, OCA parishes" },
              { key: "Julian", label: "Julian", sub: "Old Calendar — Russian, Serbian, Georgian, Jerusalem Patriarchates" },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setDraftCalendar(c.key)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                style={{
                  backgroundColor: draftCalendar === c.key ? alpha(season.color, 0.2) : theme.bg,
                  border: draftCalendar === c.key ? `1px solid ${accent}` : "1px solid transparent",
                }}
              >
                <div>
                  <p className="text-[14px]" style={{ color: theme.text }}>
                    {c.label}
                  </p>
                  <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: alpha(theme.text, 0.4) }}>
                    {c.sub}
                  </p>
                </div>
                {draftCalendar === c.key && <span style={{ color: accent }}>●</span>}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] mt-3" style={{ color: alpha(theme.text, 0.33) }}>
            Pascha and Great Lent are calculated the same way either way — this only shifts fixed feasts like
            the Nativity Fast and Christmas.
          </p>
        </>
      ) : (
        <div
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ backgroundColor: theme.bg, border: "1px solid transparent" }}
        >
          <p className="text-[14px]" style={{ color: alpha(theme.text, 0.53) }}>
            Gregorian
          </p>
          <span style={{ color: alpha(theme.text, 0.27) }}>●</span>
        </div>
      )}

      <p className="text-[11px] mt-4 mb-5" style={{ color: alpha(theme.text, 0.33) }}>
        Calendar dates and feast days adjust to match.
      </p>

      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
        Bible text
      </p>
      <div className="space-y-2 mb-2">
        {[
          { key: "auto", label: "Match my tradition", sub: `Currently ${WEB_VERSION_LABELS[DEFAULT_WEB_VERSION[tradition]]}` },
          { key: "eng-web-c", label: WEB_VERSION_LABELS["eng-web-c"] },
          { key: "eng-webbe", label: WEB_VERSION_LABELS["eng-webbe"] },
          { key: "engwebu", label: WEB_VERSION_LABELS["engwebu"] },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => onChangeWebBibleVersion(o.key)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
            style={{
              backgroundColor: webBibleVersion === o.key ? alpha(season.color, 0.2) : theme.bg,
              border: webBibleVersion === o.key ? `1px solid ${seasonAccent(season, theme.mode)}` : "1px solid transparent",
            }}
          >
            <div>
              <p className="text-[13.5px]" style={{ color: theme.text }}>
                {o.label}
              </p>
              {o.sub && (
                <p className="text-[10.5px] mt-0.5" style={{ color: alpha(theme.text, 0.4) }}>
                  {o.sub}
                </p>
              )}
            </div>
            {webBibleVersion === o.key && <span style={{ color: seasonAccent(season, theme.mode) }}>●</span>}
          </button>
        ))}
      </div>
      <p className="text-[11px] mb-4" style={{ color: alpha(theme.text, 0.33) }}>
        Used for the full passage text shown when you tap a scripture reading. All three are the public-domain
        World English Bible, so they can be read offline.
      </p>

      <label className="text-[11px] uppercase tracking-[0.2em] mb-2 block" style={{ color: alpha(theme.text, 0.4) }}>
        BibleGateway link version
      </label>
      <select
        value={bibleGatewayVersion}
        onChange={(e) => onChangeBibleGatewayVersion(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-[13.5px] mb-1"
        style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        {groupVersionsByLanguage(BIBLEGATEWAY_VERSIONS).map(([language, versions]) => (
          <optgroup key={language} label={language}>
            {versions.map((v) => (
              <option key={v.code} value={v.code}>
                {v.label} ({v.code})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-[11px] mb-5" style={{ color: alpha(theme.text, 0.33) }}>
        Preselected when you tap "Open on BibleGateway" for a different translation than the WEB — you can still
        change it per-passage.
      </p>

      {theme.mode !== "system" && (
        <button
          onClick={theme.useSystem}
          className="text-[11px] underline decoration-dotted mb-3 block"
          style={{ color: alpha(theme.text, 0.4) }}
        >
          Reset appearance to match system
        </button>
      )}

      <button
        onClick={() => {
          onApply(draft, draftCalendar);
          onClose();
        }}
        className="w-full rounded-2xl py-3 text-[14px]"
        style={{ backgroundColor: season.color, color: "#EDE7DC" }}
      >
        Apply
      </button>

      <p className="text-[11px] uppercase tracking-[0.2em] mb-3 mt-6" style={{ color: alpha(theme.text, 0.4) }}>
        Privacy & Cookies
      </p>
      <div
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2"
        style={{ backgroundColor: theme.bg, border: "1px solid transparent" }}
      >
        <div>
          <p className="text-[13px]" style={{ color: theme.text }}>
            Analytics cookies
          </p>
          <p className="text-[10.5px] mt-0.5" style={{ color: alpha(theme.text, 0.4) }}>
            {cookieConsent === "accepted" ? "Currently accepted" : cookieConsent === "rejected" ? "Currently rejected" : "Not yet decided"}
          </p>
        </div>
        <button
          onClick={() => onChangeCookieConsent(cookieConsent === "accepted" ? "rejected" : "accepted")}
          className="text-[12px] px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: alpha(accent, 0.14), color: accent }}
        >
          {cookieConsent === "accepted" ? "Reject" : "Accept"}
        </button>
      </div>
      <button onClick={onOpenPrivacy} className="text-[11px] underline decoration-dotted" style={{ color: alpha(theme.text, 0.4) }}>
        Read our Privacy Policy
      </button>
      <span className="text-[11px] mx-2" style={{ color: alpha(theme.text, 0.25) }}>
        ·
      </span>
      <button onClick={onOpenChangelog} className="text-[11px] underline decoration-dotted" style={{ color: alpha(theme.text, 0.4) }}>
        What's new (v{CHANGELOG[0].version})
      </button>
    </SheetOverlay>
  );
}

// NOTE for the developer: GDPR expects a direct way to reach the data
// controller, not just a public issue tracker. If you have (or set up) a
// contact email for this project, add it below alongside the GitHub link.
const PRIVACY_CONTACT_EMAIL = null; // e.g. "privacy@yourdomain.com"

function PrivacyPolicySheet({ onClose }) {
  const theme = useTheme();
  const sectionTitle = "text-[12px] uppercase tracking-[0.18em] mt-5 mb-2";
  const body = "text-[13px] leading-relaxed";
  const bodyMuted = { color: alpha(theme.text, 0.75) };
  const label = { color: alpha(theme.text, 0.4) };
  return (
    <SheetOverlay onClose={onClose}>
      <h2 className="text-[19px] mb-1" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        Privacy Policy
      </h2>
      <p className="text-[11px] mb-4" style={label}>
        Last updated August 2026
      </p>

      <p className={body} style={bodyMuted}>
        Officium is a liturgical calendar app. This policy explains what data is collected, why, and the choices
        and rights you have over it.
      </p>

      <p className={sectionTitle} style={label}>
        Who is responsible for your data
      </p>
      <p className={body} style={bodyMuted}>
        Officium is an independent, open-source project maintained by a single developer (not a company). For any
        privacy question, correction, deletion request, or complaint, please{" "}
        {PRIVACY_CONTACT_EMAIL ? (
          <>
            email{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="underline decoration-dotted" style={{ color: theme.text }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>{" "}
            or open an issue on the{" "}
          </>
        ) : (
          "open an issue on the "
        )}
        <a
          href="https://github.com/MrLewk/liturgical-calendar-app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted"
          style={{ color: theme.text }}
        >
          GitHub repository
        </a>
        .
      </p>

      <p className={sectionTitle} style={label}>
        Data stored on your device
      </p>
      <p className={body} style={bodyMuted}>
        Your chosen tradition, calendar, theme, and cookie preference are saved in your browser's local storage.
        This data never leaves your device, isn't sent to us, and isn't shared with anyone. It's kept until you
        clear your browser data or uninstall the app. This storage is strictly necessary for the app to function
        and doesn't require consent under GDPR/PECR.
      </p>

      <p className={sectionTitle} style={label}>
        Analytics cookies (Google Analytics)
      </p>
      <p className={body} style={bodyMuted}>
        If you accept, we use Google Analytics 4 to understand how Officium is used — for example which tabs are
        popular and roughly how many people visit. This is not switched on by default; it only loads after you
        actively accept, and you can withdraw consent at any time (see below).
      </p>
      <p className={body} style={{ ...bodyMuted, marginTop: 6 }}>
        <strong style={{ color: theme.text }}>Legal basis:</strong> your consent (UK GDPR Art. 6(1)(a) / EU GDPR
        Art. 6(1)(a), and PECR/ePrivacy for the cookie itself). You may withdraw consent at any time without
        affecting the lawfulness of processing before withdrawal.
      </p>
      <p className={body} style={{ ...bodyMuted, marginTop: 6 }}>
        <strong style={{ color: theme.text }}>What's collected:</strong> approximate location (derived from IP
        address, which Google truncates/anonymises before storage), device and browser type, pages/tabs viewed,
        session duration, and referral source. We do not collect your name, email, or any other information that
        directly identifies you, and analytics data is never used for advertising or combined with other data to
        build a profile of you.
      </p>
      <p className={body} style={{ ...bodyMuted, marginTop: 6 }}>
        <strong style={{ color: theme.text }}>Cookies used:</strong> Google Analytics sets first-party cookies
        (typically <code>_ga</code> and <code>_ga_*</code>) to distinguish visitors. These normally expire after
        13 months, per Google's default retention settings.
      </p>
      <p className={body} style={{ ...bodyMuted, marginTop: 6 }}>
        <strong style={{ color: theme.text }}>International transfer:</strong> Google Analytics is operated by
        Google, which may process and store data on servers outside your country, including in the United States.
        Where this involves a transfer out of the UK/EEA, Google relies on the EU-US Data Privacy Framework and/or
        Standard Contractual Clauses as its transfer safeguard.
      </p>
      <p className={body} style={{ ...bodyMuted, marginTop: 6 }}>
        <strong style={{ color: theme.text }}>Retention:</strong> analytics event data is retained by Google for
        14 months before automatic deletion, per this app's Google Analytics configuration.
      </p>

      <p className={sectionTitle} style={label}>
        Your rights
      </p>
      <p className={body} style={bodyMuted}>
        Under UK/EU GDPR, you have the right to: access the data held about you; request correction or deletion;
        restrict or object to processing; request a portable copy of your data; and withdraw consent at any time.
        Because analytics data isn't linked to your name or account, some of these rights (like providing you a
        personal copy) may be limited in practice — but you can always stop future collection instantly by
        rejecting analytics in Settings. You also have the right to lodge a complaint with your local data
        protection authority (in the UK, the{" "}
        <a
          href="https://ico.org.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted"
          style={{ color: theme.text }}
        >
          ICO
        </a>
        ).
      </p>

      <p className={sectionTitle} style={label}>
        Children's data
      </p>
      <p className={body} style={bodyMuted}>
        Officium isn't directed at children and doesn't knowingly collect data from children. Analytics, where
        accepted, collects only the general, non-identifying information described above.
      </p>

      <p className={sectionTitle} style={label}>
        Changing your mind
      </p>
      <p className={body} style={bodyMuted}>
        You can accept or reject analytics cookies at any time from Settings → Privacy & Cookies. Rejecting stops
        further data collection immediately, though it can't retroactively delete data Google has already
        processed under a prior consent.
      </p>

      <p className={sectionTitle} style={label}>
        Changes to this policy
      </p>
      <p className={body} style={bodyMuted}>
        If this policy changes materially, the "Last updated" date above will change accordingly. Since Officium
        has no accounts or email addresses, we can't notify you directly — please check back occasionally.
      </p>

      <p className="text-[10.5px] mt-5 leading-relaxed" style={{ color: alpha(theme.text, 0.35) }}>
        This policy is provided to help you understand and comply with GDPR/UK GDPR and PECR, but it isn't legal
        advice. If you have a large user base or specific regulatory exposure, consider having it reviewed by a
        lawyer.
      </p>

      <button
        onClick={onClose}
        className="w-full rounded-2xl py-3 text-[14px] mt-6"
        style={{ backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        Close
      </button>
    </SheetOverlay>
  );
}

const CHANGE_TYPE_COLOR = {
  Added: "#3F6B4F",
  Changed: "#7C5BA8",
  Fixed: "#C9A227",
  Removed: "#A32638",
  Note: "#8A8578",
};

function ChangelogSheet({ onClose }) {
  const theme = useTheme();
  return (
    <SheetOverlay onClose={onClose}>
      <h2 className="text-[19px] mb-1" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        What's new
      </h2>
      <p className="text-[11px] mb-5" style={{ color: alpha(theme.text, 0.4) }}>
        A history of updates to Officium.
      </p>

      <div className="space-y-6">
        {CHANGELOG.map((entry, i) => (
          <div key={entry.version}>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-[14px]" style={{ color: theme.text, fontFamily: "'Fraunces', serif" }}>
                v{entry.version}
              </p>
              {i === 0 && (
                <span
                  className="text-[9.5px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: alpha("#C9A227", 0.18), color: "#C9A227" }}
                >
                  Latest
                </span>
              )}
              <p className="text-[12px]" style={{ color: alpha(theme.text, 0.5) }}>
                {entry.title}
              </p>
            </div>
            <ul className="space-y-1.5">
              {entry.changes.map((c, j) => (
                <li key={j} className="text-[12.5px] leading-snug flex gap-2" style={{ color: alpha(theme.text, 0.72) }}>
                  <span
                    className="text-[9.5px] uppercase tracking-[0.08em] flex-shrink-0 mt-[1px]"
                    style={{ color: CHANGE_TYPE_COLOR[c.type] || alpha(theme.text, 0.4) }}
                  >
                    {c.type}
                  </span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-2xl py-3 text-[14px] mt-6"
        style={{ backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        Close
      </button>
    </SheetOverlay>
  );
}

// Full text of a scripture reading, fetched on open from the bundled WEB
// edition JSON under /bible/{version}/. Offers a link out to BibleGateway
// for anyone who wants a different translation.
function ScripturePassageModal({ reference, webVersion, bibleGatewayVersion, season, onClose }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const [state, setState] = useState({ status: "loading" });
  const [gwVersion, setGwVersion] = useState(bibleGatewayVersion);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getPassage(reference, webVersion)
      .then((passage) => {
        if (!cancelled) setState({ status: "ready", passage });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", message: err.message || "Couldn't load that passage." });
      });
    return () => {
      cancelled = true;
    };
  }, [reference, webVersion]);

  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-1.5" style={{ color: alpha(theme.text, 0.4) }}>
        Scripture
      </p>
      <h2 className="text-[19px] lg:text-[24px] mb-4" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        {state.status === "ready" ? state.passage.reference : reference}
      </h2>

      {state.status === "loading" && (
        <p className="text-[13px] mb-4" style={{ color: alpha(theme.text, 0.4) }}>
          Loading passage…
        </p>
      )}
      {state.status === "error" && (
        <p className="text-[13px] mb-4" style={{ color: alpha(theme.text, 0.5) }}>
          {state.message}
        </p>
      )}
      {state.status === "ready" && (
        <>
          <div className="text-[14px] lg:text-[16.5px] leading-relaxed mb-1.5" style={{ color: alpha(theme.text, 0.85) }}>
            {state.passage.verses.map((v) => (
              <span key={`${v.chapter}-${v.verse}`}>
                <sup className="mr-0.5" style={{ color: alpha(theme.text, 0.4) }}>
                  {v.verse}
                </sup>
                {v.text}{" "}
              </span>
            ))}
          </div>
          <p className="text-[10.5px] mb-5" style={{ color: alpha(theme.text, 0.33) }}>
            World English Bible — {WEB_VERSION_LABELS[webVersion]}. Public domain.
          </p>
        </>
      )}

      <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: alpha(theme.text, 0.4) }}>
        Read in another translation
      </p>
      <div className="flex items-center gap-2 mb-5">
        <select
          value={gwVersion}
          onChange={(e) => setGwVersion(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-[12.5px]"
          style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
        >
          {groupVersionsByLanguage(BIBLEGATEWAY_VERSIONS).map(([language, versions]) => (
            <optgroup key={language} label={language}>
              {versions.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.label} ({v.code})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <a
          href={bibleGatewayUrl(reference, gwVersion)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-4 py-2.5 rounded-xl text-[12.5px] text-center"
          style={{ backgroundColor: accent, color: "#FFFFFF" }}
        >
          Open
        </a>
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-2xl py-3 text-[14px]"
        style={{ backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        Close
      </button>
    </SheetOverlay>
  );
}

// Builds real season + feast data for a tradition and triggers an .ics
// download for it — a separate file per selected tradition, since a single
// combined calendar can't cleanly represent three different season
// structures without a tradition label on every event title.
function exportTradition(t, orthodoxCalendar) {
  const { seasons, feasts } = liturgicalYearData(t, orthodoxCalendar);
  const label = t === "Orthodox" ? `Orthodox (${orthodoxCalendar})` : t;
  const ics = buildIcs({ traditionLabel: label, seasons, feasts });
  const filename = `officium-${t.toLowerCase()}${t === "Orthodox" ? "-" + orthodoxCalendar.toLowerCase() : ""}.ics`;
  downloadIcs(filename, ics);
}

// Coffee donation section
function CoffeeSection() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-[12px] lg:text-[13px]" style={{ color: alpha(theme.text, 0.7) }}>
        Enjoying the app? A coffee keeps development going ☕
      </p>
      <a
        href="https://buymeacoffee.com/mrlewk"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex justify-center"
      >
        <img
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          height={40}
          className="h-10"
        />
      </a>
      <p className="text-center text-[11px] lg:text-[12px]" style={{ color: alpha(theme.text, 0.5) }}>
        © {currentYear} Luke Wilson. Designed by Luke Wilson.
      </p>
    </div>
  );
}

function ExportSheet({ tradition, calendar, onClose, season }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const [selected, setSelected] = useState(new Set([tradition]));
  const [done, setDone] = useState(false);

  const toggle = (t) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const handleDownload = () => {
    selected.forEach((t) => exportTradition(t, calendar));
    setDone(true);
  };

  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: alpha(theme.text, 0.4) }}>
        Sync to calendar
      </p>
      <h2 className="text-[20px] leading-tight mb-3" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        Choose which calendars to export
      </h2>
      <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: alpha(theme.text, 0.6) }}>
        Downloads a .ics file per tradition — season blocks as multi-day all-day events, feast days as single-day
        events, each colored to match its liturgical color. Import the file into your phone or Google Calendar.
        {calendar && selected.has("Orthodox") ? ` Orthodox uses your ${calendar} calendar setting.` : ""}
      </p>
      <div className="space-y-2 mb-5">
        {TRADITIONS.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px]"
            style={{
              backgroundColor: selected.has(t) ? alpha(season.color, 0.2) : theme.bg,
              color: theme.text,
              border: selected.has(t) ? `1px solid ${accent}` : "1px solid transparent",
            }}
          >
            {t}
            {selected.has(t) && <span style={{ color: accent }}>●</span>}
          </button>
        ))}
      </div>
      <button
        onClick={handleDownload}
        disabled={selected.size === 0}
        className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-[14px]"
        style={{
          backgroundColor: selected.size === 0 ? alpha(theme.text, 0.15) : season.color,
          color: "#EDE7DC",
          opacity: selected.size === 0 ? 0.6 : 1,
        }}
      >
        <Download size={15} />
        Download {selected.size > 1 ? `${selected.size} calendars` : "calendar"}
      </button>
      {done && (
        <p className="text-[11.5px] mt-3 text-center" style={{ color: alpha(theme.text, 0.5) }}>
          Downloaded. Open the .ics file(s) to import — most phones add them straight to Calendar.
        </p>
      )}
    </SheetOverlay>
  );
}

function FeastModal({ feast, onClose }) {
  const theme = useTheme();
  return (
    <SheetOverlay onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: feast.color, border: `1.5px solid ${alpha(theme.text, 0.4)}` }}
        />
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: alpha(theme.text, 0.4) }}>
          {shortDate(feast.date)} · {feast.rank}
        </p>
      </div>
      <h2 className="text-[24px] leading-tight mb-4" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        {feast.name}
      </h2>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: alpha(theme.text, 0.8) }}>
        {feast.bio}
      </p>
      <div className="rounded-xl p-3.5" style={{ backgroundColor: theme.bg }}>
        <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: alpha(theme.text, 0.33) }}>
          Why this color
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: alpha(theme.text, 0.67) }}>
          {feast.why}
        </p>
      </div>
    </SheetOverlay>
  );
}

function DayDetailSheet({ date, tradition, calendar, onClose, onOpenFeast, onOpenReadingsForDay }) {
  const theme = useTheme();
  const { seasons, feasts } = useMemo(() => liturgicalYearData(tradition, calendar, date), [tradition, calendar, date]);
  const season = useMemo(() => withDisplay(seasonAt(seasons, date), date, tradition, seasons), [seasons, date, tradition]);
  const accent = seasonAccent(season, theme.mode);
  const feast = feastOnDate(feasts, date);
  const readingItems = dayReadingItems(tradition, date);

  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
        {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>

      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: alpha(season.color, 0.13), border: `1px solid ${alpha(season.color, 0.33)}` }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: accent }}>
          {season.latin}
        </p>
        <h2 className="text-[24px] leading-tight" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
          {season.name}
        </h2>
      </div>

      <button
        onClick={() => onOpenReadingsForDay(date)}
        className="w-full text-left rounded-2xl p-4 mb-3"
        style={{ backgroundColor: theme.surface }}
      >
        <div className="flex items-center gap-3 mb-1">
          <BookOpen size={18} color={accent} />
          <p className="text-[10px] uppercase tracking-[0.2em] flex-1" style={{ color: alpha(theme.text, 0.4) }}>
            {readingItems.length > 1 ? "Readings" : "Reading"}
          </p>
          <ChevronRight size={16} color={alpha(theme.text, 0.33)} />
        </div>
        <div className={readingItems.length > 1 ? "pl-8 space-y-1.5 mt-1.5" : "pl-8"}>
          {readingItems.map((item, i) => (
            <div key={i}>
              {item.role && (
                <span className="text-[9.5px] uppercase tracking-[0.15em] mr-1.5" style={{ color: alpha(theme.text, 0.4) }}>
                  {item.role}
                </span>
              )}
              <span className="text-[13px]" style={{ color: theme.text }}>
                {item.ref}
              </span>
            </div>
          ))}
        </div>
      </button>

      {feast ? (
        <button
          onClick={() => onOpenFeast(feast)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{ backgroundColor: theme.surface }}
        >
          <Star size={18} color={accent} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: alpha(theme.text, 0.4) }}>
              Feast
            </p>
            <p className="text-[13px]" style={{ color: theme.text }}>
              {feast.name}
            </p>
          </div>
          <ChevronRight size={16} color={alpha(theme.text, 0.33)} />
        </button>
      ) : (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.surface }}>
          <Star size={18} color={alpha(theme.text, 0.27)} />
          <p className="text-[13px]" style={{ color: alpha(theme.text, 0.4) }}>
            No major feast today
          </p>
        </div>
      )}
    </SheetOverlay>
  );
}

function TabButton({ icon: Icon, label, active, color, onClick }) {
  const theme = useTheme();
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-1.5 py-1 flex-1">
      <Icon size={18} color={active ? color : alpha(theme.text, 0.33)} strokeWidth={active ? 2.4 : 1.8} />
      <span className="text-[9px] tracking-wide" style={{ color: active ? color : alpha(theme.text, 0.33) }}>
        {label}
      </span>
    </button>
  );
}

// Short description of what each liturgical color signifies, shown under
// the color swatch on the Today tab.
const COLOR_MEANING = {
  "#3F6B4F": "Green — growth, ordinary discipleship",
  "#5B3B8C": "Purple — penance and preparation",
  "#A32638": "Red — the Passion, and the Holy Spirit's fire",
  "#C9A227": "Gold — joy and celebration",
  "#EDE7DC": "White — purity and joy",
  "#C97BA0": "Rose — a brief turn toward joy amid a penitential season",
};

function TodayView({ season, seasons, today, nextFeast, progressPct, onSelectFeast, onOpenReadings, onOpenExport, tradition, calendar }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const readingRef = dayReadingItems(tradition, today)[0]?.ref;
  return (
    <div className="pt-2 lg:pt-0 lg:grid lg:grid-cols-[1fr_420px] lg:gap-10 lg:items-start">
      <div>
        {/* Hero card */}
        <div
          className="rounded-3xl p-6 lg:p-9 mb-4 lg:mb-6 relative overflow-hidden"
          style={{ backgroundColor: alpha(season.color, 0.13), border: `1px solid ${alpha(season.color, 0.33)}` }}
        >
          <p className="text-[10px] lg:text-[13px] uppercase tracking-[0.3em] mb-1 lg:mb-2" style={{ color: accent }}>
            {season.latin}
          </p>
          <h2
            className="text-[32px] lg:text-[48px] leading-tight mb-1 lg:mb-2"
            style={{ fontFamily: "'Fraunces', serif", color: theme.text }}
          >
            {season.name}
          </h2>
          <p className="text-[13px] lg:text-[16px] mb-5 lg:mb-7" style={{ color: alpha(theme.text, 0.6) }}>
            {season.weekLabel} · {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          {/* Candle progress bar */}
          <div className="flex items-center gap-2 lg:gap-3">
            <Flame size={14} className="lg:hidden" color={accent} />
            <Flame size={18} className="hidden lg:block" color={accent} />
            <div className="flex-1 h-[6px] lg:h-[8px] rounded-full overflow-hidden" style={{ backgroundColor: alpha(theme.text, 0.12) }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${progressPct}%`, backgroundColor: accent }}
              />
            </div>
            <span className="text-[11px] lg:text-[14px]" style={{ color: alpha(theme.text, 0.5) }}>
              {season.dayInSeason}/{season.seasonLength}d
            </span>
          </div>
        </div>

        {/* Color swatch card */}
        <div className="rounded-2xl p-4 lg:p-5 mb-4 lg:mb-5 flex items-center gap-3 lg:gap-4" style={{ backgroundColor: theme.surface }}>
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full border-2 flex-shrink-0" style={{ backgroundColor: season.color, borderColor: alpha(theme.text, 0.2) }} />
          <div>
            <p className="text-[13px] lg:text-[16px]" style={{ color: theme.text }}>
              Liturgical color
            </p>
            <p className="text-[11px] lg:text-[14px]" style={{ color: alpha(theme.text, 0.4) }}>
              {COLOR_MEANING[season.color] || ""}
            </p>
          </div>
        </div>

        {/* Reading teaser — clicks through to the full Readings tab */}
        <button
          onClick={onOpenReadings}
          className="w-full rounded-2xl p-4 lg:p-5 mb-4 lg:mb-5 flex items-center justify-between text-left"
          style={{ backgroundColor: theme.surface }}
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <BookOpen size={18} className="lg:hidden" color={accent} />
            <BookOpen size={22} className="hidden lg:block" color={accent} />
            <div>
              <p className="text-[10px] lg:text-[12px] uppercase tracking-[0.2em] mb-1" style={{ color: alpha(theme.text, 0.4) }}>
                Today's reading
              </p>
              <p className="text-[14px] lg:text-[17px]" style={{ color: theme.text }}>
                {readingRef}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="lg:hidden" color={alpha(theme.text, 0.33)} />
          <ChevronRight size={22} className="hidden lg:block" color={alpha(theme.text, 0.33)} />
        </button>

        {/* Next feast teaser — clicks through to the same bio sheet as the Feasts tab */}
        {nextFeast && (
          <button
            onClick={() => onSelectFeast(nextFeast)}
            className="w-full rounded-2xl p-4 lg:p-5 flex items-center justify-between text-left"
            style={{ backgroundColor: theme.surface }}
          >
            <div>
              <p className="text-[10px] lg:text-[12px] uppercase tracking-[0.2em] mb-1" style={{ color: alpha(theme.text, 0.4) }}>
                Next feast
              </p>
              <p className="text-[14px] lg:text-[17px]" style={{ color: theme.text }}>
                {nextFeast.name}
              </p>
              <p className="text-[11px] lg:text-[14px]" style={{ color: alpha(theme.text, 0.4) }}>
                {shortDate(nextFeast.date)} · {nextFeast.rank}
              </p>
            </div>
            <ChevronRight size={18} className="lg:hidden" color={alpha(theme.text, 0.33)} />
            <ChevronRight size={22} className="hidden lg:block" color={alpha(theme.text, 0.33)} />
          </button>
        )}

        {/* Sync button */}
        <button
          onClick={onOpenExport}
          className="w-full mt-4 lg:mt-6 rounded-2xl py-3 lg:py-4 flex items-center justify-center gap-2 text-[13px] lg:text-[16px]"
          style={{ backgroundColor: season.color, color: "#EDE7DC" }}
        >
          <Download size={15} />
          Sync to calendar
        </button>

        {/* Coffee donation section — mobile only */}
        <div className="lg:hidden mt-6 pt-6 border-t" style={{ borderColor: theme.border }}>
          <CoffeeSection />
        </div>
      </div>

      {/* Desktop-only: year-at-a-glance wheel alongside Today, so the two most
          "visual" views sit together rather than requiring a tab switch. */}
      <div className="hidden lg:block rounded-3xl p-8" style={{ backgroundColor: theme.surface }}>
        <p className="text-[13px] uppercase tracking-[0.2em] mb-2" style={{ color: alpha(theme.text, 0.4) }}>
          Year at a glance
        </p>
        <WheelView season={season} seasons={seasons} today={today} tradition={tradition} calendar={calendar} variant="panel" />
      </div>
    </div>
  );
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function GridView({ today, tradition, calendar, onSelectDay }) {
  const theme = useTheme();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));

  // A month can straddle two different liturgical years' worth of computed
  // data (e.g. December spans Advent/Christmas of one liturgical year), so
  // compute seasons/feasts from a date inside the displayed month rather
  // than from `today`.
  const refDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 15);
  const { seasons, feasts } = useMemo(() => liturgicalYearData(tradition, calendar, refDate), [tradition, calendar, viewMonth]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Distinct seasons touched by this month, in the order they occur, so a
  // month straddling a season boundary (e.g. Lent into Easter) can show both.
  const monthSeasons = useMemo(() => {
    const seen = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const s = seasonAt(seasons, new Date(year, month, d));
      if (!seen.some((x) => x.name === s.name)) seen.push(s);
    }
    return seen;
  }, [seasons, year, month, daysInMonth]);

  return (
    <div className="pt-2 lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <div>
          <h3 className="text-[18px] lg:text-[26px]" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
            {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <p className="text-[11px] lg:text-[14px] mt-0.5" style={{ color: alpha(theme.text, 0.5) }}>
            {monthSeasons.map((s) => s.name).join(" – ")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2.5">
          {!isCurrentMonth && (
            <button
              onClick={() => setViewMonth(startOfMonth(today))}
              className="text-[10px] lg:text-[13px] uppercase tracking-[0.15em] mr-1 lg:mr-2"
              style={{ color: alpha(theme.text, 0.4) }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.surface }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} color={alpha(theme.text, 0.6)} />
          </button>
          <button
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.surface }}
            aria-label="Next month"
          >
            <ChevronRight size={16} color={alpha(theme.text, 0.6)} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 lg:gap-2.5 mb-2">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-[10px] lg:text-[13px] pb-1 lg:pb-2 font-medium" style={{ color: alpha(theme.text, 0.6) }}>
            {d}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const date = new Date(year, month, d);
          const isToday = isCurrentMonth && d === today.getDate();
          const daySeason = seasonAt(seasons, date);
          const feast = feastOnDate(feasts, date);
          const dayColor = daySeason.color;
          return (
            <button
              key={d}
              onClick={() => onSelectDay(date)}
              className="aspect-square rounded-lg lg:rounded-xl flex items-center justify-center text-[12px] lg:text-[16px] relative"
              style={{
                backgroundColor: isToday ? daySeason.color : theme.surface,
                color: isToday ? "#FFFFFF" : alpha(theme.text, 0.8),
                border: isToday
                  ? `1px solid ${seasonAccent(withDisplay(daySeason, date, tradition, seasons), theme.mode)}`
                  : feast
                  ? `1px solid ${alpha(feast.color, 0.5)}`
                  : "1px solid transparent",
                borderBottom: isToday ? `1px solid ${seasonAccent(withDisplay(daySeason, date, tradition, seasons), theme.mode)}` : `3px solid ${dayColor}`,
                boxSizing: "border-box",
              }}
            >
              {d}
              {feast && (
                <span
                  className="absolute top-1.5 right-1.5 lg:top-2.5 lg:right-2.5 w-1.5 h-1.5 lg:w-3 lg:h-3 rounded-full"
                  style={{ backgroundColor: feast.color, border: `1.5px solid ${alpha(theme.text, 0.4)}` }}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] lg:text-[14px] mt-3 lg:mt-4" style={{ color: alpha(theme.text, 0.33) }}>
        Tap a day for its details · bottom border shows its season · dot marks a feast day.
      </p>
    </div>
  );
}

function WheelView({ season, seasons, today, tradition, calendar, variant = "standalone" }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  // Internal coordinate system stays fixed — the rendered pixel size scales
  // via the svg's CSS width/height (below), which scales the whole drawing,
  // text included, without needing separate markup per size.
  const cx = 130, cy = 130, r = 100;
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const activeIdx = hovered ?? pinned;

  // The wheel plots the current liturgical year's own timeline end to end
  // (its first season's start = angle 0, its last season's end = 360°),
  // rather than a fixed Jan–Dec calendar year — this is what lets it be
  // computed directly from live season data for any tradition/calendar,
  // any year, with today's position always falling somewhere on the ring.
  const yearStart = seasons[0].start;
  const totalDays = daysBetween(yearStart, seasons[seasons.length - 1].end) + 1;
  const wheel = seasons.map((s) => ({
    key: s.key,
    label: s.name,
    color: s.color,
    start: s.start,
    end: s.end,
    startAngle: (daysBetween(yearStart, s.start) / totalDays) * 360,
    endAngle: ((daysBetween(yearStart, s.end) + 1) / totalDays) * 360,
  }));
  const currentIdx = seasons.findIndex((s) => s.key === season.key);
  const activeSeg = activeIdx !== null ? wheel[activeIdx] : null;
  const currentSeg = currentIdx !== -1 ? wheel[currentIdx] : null;
  const todayAngle = (daysBetween(yearStart, today) / totalDays) * 360;

  // Reset any pinned/hovered wedge when the tradition or calendar changes
  // underneath us, since the wedge index may no longer correspond to the same season.
  useEffect(() => {
    setPinned(null);
    setHovered(null);
  }, [tradition, calendar]);

  const svgSizeClass = variant === "panel" ? "w-[260px] h-[260px] lg:w-[340px] lg:h-[340px]" : "w-[260px] h-[260px] lg:w-[460px] lg:h-[460px]";

  return (
    <div className="flex flex-col items-center pt-4 lg:pt-2">
      <svg viewBox="0 0 260 260" className={svgSizeClass}>
        {wheel.map((seg, i) => {
          const color = seg.color || "#3F6B4F";
          const isCurrent = i === currentIdx;
          const segRadius = isCurrent ? r + 10 : r;
          return (
            <path
              key={i}
              d={arcPath(cx, cy, segRadius, seg.startAngle, seg.endAngle)}
              fill={color}
              opacity={isCurrent ? 1 : activeIdx === i ? 0.85 : 0.55}
              stroke={theme.bg}
              strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned((prev) => (prev === i ? null : i))}
            >
              <title>
                {seg.label} · {shortDate(seg.start)} – {shortDate(seg.end)}
              </title>
            </path>
          );
        })}
        {/* Clock hand: today's position within the liturgical year */}
        {(() => {
          const [hx, hy] = polarToXY(cx, cy, r + 14, todayAngle);
          return (
            <g>
              <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={theme.text} strokeWidth="2" strokeLinecap="round" />
              <circle cx={hx} cy={hy} r="4.5" fill={theme.text} stroke={accent} strokeWidth="2" />
            </g>
          );
        })()}
        <circle cx={cx} cy={cy} r={48} fill={theme.bg} stroke={theme.surface} strokeWidth="1" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={theme.text} fontSize="12" fontFamily="'Fraunces', serif">
          {shortDate(today)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={alpha(theme.text, 0.6)} fontSize="8">
          {currentSeg?.label}
        </text>
      </svg>

      {tradition === "Orthodox" && (
        <p className="text-[10px] lg:text-[13px] uppercase tracking-[0.15em] -mt-1 mb-1" style={{ color: alpha(theme.text, 0.27) }}>
          {calendar === "Julian" ? "Julian (Old Calendar)" : "Gregorian (New Calendar)"}
        </p>
      )}

      {/* Tap (or hover, on desktop) a wedge to see its date range */}
      <div className="h-9 lg:h-12 flex items-center justify-center text-center px-2">
        {activeSeg ? (
          <p className="text-[12px] lg:text-[16px]" style={{ color: alpha(theme.text, 0.8) }}>
            <span style={{ fontFamily: "'Fraunces', serif" }}>{activeSeg.label}</span>
            <span style={{ color: alpha(theme.text, 0.4) }}>
              {" "}
              · {shortDate(activeSeg.start)} – {shortDate(activeSeg.end)}
            </span>
          </p>
        ) : (
          <p className="text-[11px] lg:text-[14px]" style={{ color: alpha(theme.text, 0.27) }}>
            Tap a wedge for its date range
          </p>
        )}
      </div>

      {variant !== "panel" && (
        <div className="grid grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-1.5 lg:gap-y-2.5 mt-1 lg:mt-3 w-full px-2 lg:max-w-md">
          {wheel.map((s, i) => (
            <div key={i} className="flex items-center gap-2 lg:gap-2.5">
              <span className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10.5px] lg:text-[14px] leading-tight" style={{ color: alpha(theme.text, 0.67) }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Picks a sensible default Daily Office segment from the person's real
// local clock: Sunday gets the Eucharistic lectionary regardless of time,
// otherwise Morning Prayer before noon and Evening Prayer after. The person
// can still switch manually — this only decides the initial selection.
// Picks a sensible default Daily Office segment from the person's real
// local clock: Sunday gets the Eucharistic lectionary regardless of time,
// otherwise Morning Prayer through the afternoon and Evening Prayer once
// evening actually starts (5pm) — not at noon, which is too early for most
// people's day. The person can still switch manually.
function autoOfficeSegment(date) {
  const d = date || new Date();
  if (d.getDay() === 0) return "eucharist";
  // Only use the live clock's hour when actually looking at today —
  // there's no meaningful "time of day" for a date picked from the past.
  const isLiveToday = !date || dateOnly(date).getTime() === dateOnly(new Date()).getTime();
  if (!isLiveToday) return "am";
  return d.getHours() < 17 ? "am" : "pm";
}

function ReadingsView({ tradition, season, today, viewDate, onBackToToday, onOpenPassage }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const effectiveDate = viewDate || today;
  const isViewingOtherDay = !!viewDate;
  const anglicanEucharist = useMemo(() => (tradition === "Anglican" ? buildAnglicanEucharist(effectiveDate) : null), [tradition, effectiveDate]);
  const data = useMemo(() => {
    if (tradition !== "Anglican") return READINGS[tradition];
    return { ...READINGS.Anglican, eucharist: anglicanEucharist };
  }, [tradition, anglicanEucharist]);
  const defaultSegment = data.kind === "office" ? autoOfficeSegment(viewDate) : data.kind === "mass" ? "mass" : "daily";
  const [segment, setSegment] = useState(defaultSegment);

  useEffect(() => {
    setSegment(defaultSegment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition, viewDate]);

  // Guard against a stale segment from the previous tradition being used
  // on the render that happens before the effect above has run.
  const validSegment = data.kind === "office" && ["am", "pm", "eucharist"].includes(segment) ? segment : defaultSegment;

  // Reset to a valid segment when tradition changes underneath us
  const segments =
    data.kind === "office"
      ? [
          { key: "am", label: "Morning", icon: Sun },
          { key: "pm", label: "Evening", icon: Moon },
          { key: "eucharist", label: "Eucharist", icon: BookOpen },
        ]
      : null;
  const activeData = data.kind === "office" ? data[validSegment] : data.kind === "mass" ? data.mass : data.daily;

  return (
    <div className="pt-2 lg:pt-0 lg:max-w-3xl">
      <div className="flex items-center justify-between mb-1 lg:mb-2">
        <h3 className="text-[18px] lg:text-[28px]" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
          Prayer &amp; Readings
        </h3>
        <span className="text-[10px] lg:text-[13px] uppercase tracking-[0.2em]" style={{ color: alpha(theme.text, 0.33) }}>
          {tradition}
        </span>
      </div>

      {isViewingOtherDay && (
        <button
          onClick={onBackToToday}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-2 mt-3 mb-1 text-left"
          style={{ backgroundColor: alpha(accent, 0.13) }}
        >
          <span className="text-[11.5px] lg:text-[13px]" style={{ color: theme.text }}>
            Showing {effectiveDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span className="text-[11px] lg:text-[12.5px] underline decoration-dotted" style={{ color: accent }}>
            Back to today
          </span>
        </button>
      )}

      {segments && (
        <div className="flex gap-1.5 lg:gap-2.5 mb-4 lg:mb-6 mt-3 lg:mt-5">
          {segments.map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className="flex-1 rounded-xl py-2 lg:py-3 flex items-center justify-center gap-1.5 lg:gap-2 text-[12px] lg:text-[15px]"
              style={{
                backgroundColor: validSegment === s.key ? season.color : theme.surface,
                color: validSegment === s.key ? "#FFFFFF" : alpha(theme.text, 0.53),
              }}
            >
              <s.icon size={13} className="lg:hidden" />
              <s.icon size={17} className="hidden lg:block" />
              {s.label}
            </button>
          ))}
        </div>
      )}
      {!segments && (
        <p className="text-[12px] lg:text-[15px] mb-4 lg:mb-6 mt-2 lg:mt-4" style={{ color: alpha(theme.text, 0.4) }}>
          {activeData.label}
        </p>
      )}

      <div className="flex items-center gap-4 lg:gap-6 mb-3 lg:mb-5">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <span className="w-2.5 lg:w-3.5 h-0.5 rounded-full" style={{ backgroundColor: season.color }} />
          <span className="text-[10px] lg:text-[13px]" style={{ color: alpha(theme.text, 0.4) }}>
            Prayer
          </span>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2">
          <span className="w-2.5 lg:w-3.5 h-0.5 rounded-full" style={{ backgroundColor: "#C9A227" }} />
          <span className="text-[10px] lg:text-[13px]" style={{ color: alpha(theme.text, 0.4) }}>
            Scripture
          </span>
        </div>
      </div>

      <div className="space-y-3 lg:space-y-5">
        {activeData.sequence.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 lg:p-6"
            style={{
              backgroundColor: theme.surface,
              borderLeft: item.type === "prayer" ? `4px solid ${season.color}` : "4px solid #C9A227",
            }}
          >
            {item.role && (
              <p className="text-[10px] lg:text-[13px] uppercase tracking-[0.2em] mb-1 lg:mb-1.5" style={{ color: accent }}>
                {item.role}
              </p>
            )}
            <p className="text-[13px] lg:text-[19px] mb-2 lg:mb-3" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
              {item.ref}
            </p>
            <p className="text-[12.5px] lg:text-[16px] leading-relaxed" style={{ color: alpha(theme.text, 0.73) }}>
              {item.text}
              {item.truncated && <span style={{ color: alpha(theme.text, 0.33) }}> …</span>}
            </p>
            {item.type === "reading" && (
              <button
                onClick={() => onOpenPassage(item.ref)}
                className="text-[11px] lg:text-[14px] mt-2 lg:mt-3 underline decoration-dotted"
                style={{ color: accent }}
              >
                Read full passage
              </button>
            )}
            {item.type === "prayer" && item.truncated && (
              <button className="text-[11px] lg:text-[14px] mt-2 lg:mt-3 underline decoration-dotted" style={{ color: accent }}>
                Read full text
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] lg:text-[13px] mt-4 lg:mt-6 leading-relaxed" style={{ color: alpha(theme.text, 0.27) }}>
        Prayers and readings shown here use the King James Version, the 1662 Book of Common Prayer, and ancient
        liturgical formulas.
      </p>
    </div>
  );
}

function FeastsView({ tradition, calendar, today, onSelectFeast }) {
  const theme = useTheme();
  const feasts = useMemo(() => upcomingFeasts(tradition, calendar, today, 20), [tradition, calendar, today]);
  return (
    <div className="pt-2 lg:pt-0 lg:max-w-3xl">
      <h3 className="text-[18px] lg:text-[28px] mb-3 lg:mb-6" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        Upcoming feasts
      </h3>
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {feasts.map((f, i) => (
          <button
            key={i}
            onClick={() => onSelectFeast(f)}
            className="w-full rounded-2xl p-3.5 lg:p-5 flex items-center gap-3 lg:gap-4 text-left"
            style={{ backgroundColor: theme.surface }}
          >
            <div
              className="w-1.5 lg:w-2 h-10 lg:h-14 rounded-full flex-shrink-0"
              style={{ backgroundColor: f.color, border: `1.5px solid ${alpha(theme.text, 0.35)}` }}
            />
            <div className="flex-1">
              <p className="text-[13px] lg:text-[17px]" style={{ color: theme.text }}>
                {f.name}
              </p>
              <p className="text-[11px] lg:text-[14px]" style={{ color: alpha(theme.text, 0.4) }}>
                {shortDate(f.date)} · {f.rank}
              </p>
            </div>
            <ChevronRight size={16} className="lg:hidden" color={alpha(theme.text, 0.33)} />
            <ChevronRight size={20} className="hidden lg:block" color={alpha(theme.text, 0.33)} />
          </button>
        ))}
      </div>
    </div>
  );
}
