import React, { useState, useEffect } from "react";
import { Flame, CalendarDays, CircleDot, Star, Settings2, ChevronRight, Download, BookOpen, Sun, Moon } from "lucide-react";

// ---- Static demo data (real logic comes later) ----
const SEASONS = {
  ordinary1: { name: "Ordinary Time", latin: "Tempus per Annum", color: "#3F6B4F", accent: "#5C8C6C", weekLabel: "Week 21", dayInSeason: 55, seasonLength: 88 },
  advent: { name: "Advent", latin: "Adventus", color: "#5B3B8C", accent: "#7C5BA8", weekLabel: "Week 2", dayInSeason: 9, seasonLength: 28 },
  christmas: { name: "Christmastide", latin: "Tempus Nativitatis", color: "#C9A227", accent: "#E0BE4E", weekLabel: "Day 4", dayInSeason: 4, seasonLength: 14 },
  lent: { name: "Lent", latin: "Quadragesima", color: "#5B3B8C", accent: "#7C5BA8", weekLabel: "Week 3", dayInSeason: 19, seasonLength: 46 },
  triduum: { name: "Paschal Triduum", latin: "Triduum Sacrum", color: "#A32638", accent: "#C13B4F", weekLabel: "Day 2", dayInSeason: 2, seasonLength: 3 },
  easter: { name: "Eastertide", latin: "Tempus Paschale", color: "#C9A227", accent: "#E0BE4E", weekLabel: "Week 5", dayInSeason: 33, seasonLength: 50 },
};

const CURRENT = SEASONS.ordinary1; // demo: today's season

const FEASTS = [
  {
    date: "Aug 24",
    name: "St. Bartholomew, Apostle",
    color: "#A32638",
    rank: "Feast",
    bio: "One of the Twelve chosen by Jesus, often identified with Nathanael, whom Philip brought to meet him under the fig tree. Tradition holds he carried the Gospel as far as Armenia, where he was martyred by flaying.",
    why: "Red marks the feasts of martyrs — those who bore witness to Christ with their own blood.",
  },
  {
    date: "Aug 28",
    name: "St. Augustine of Hippo",
    color: "#EDE7DC",
    rank: "Memorial",
    bio: "A restless philosopher turned bishop, Augustine's Confessions trace his conversion from a life he later called wasted. His writing on grace and the will shaped Western Christian thought for over a thousand years.",
    why: "White marks teachers and confessors of the faith — those who lived and taught it without dying for it.",
  },
  {
    date: "Sep 8",
    name: "Nativity of the Blessed Virgin Mary",
    color: "#EDE7DC",
    rank: "Feast",
    bio: "Marks the birth of Mary, mother of Jesus, nine months after the Feast of the Immaculate Conception. One of the oldest Marian feasts, dating to at least the 6th century in the Eastern Church.",
    why: "White marks joyful feasts of Mary and the saints who are not martyrs.",
  },
  {
    date: "Sep 14",
    name: "Exaltation of the Holy Cross",
    color: "#A32638",
    rank: "Feast",
    bio: "Commemorates the finding of the True Cross by St. Helena in Jerusalem in 326, and its recovery from Persian capture in 629. The cross, an instrument of execution, is lifted up here as a sign of victory.",
    why: "Red marks the Passion — the cross itself, and the suffering it represents.",
  },
];

// Two wheels: Western (Catholic + Anglican share the Gregorian Paschalion)
// and Orthodox (Julian-based Paschalion, so Pascha, Great Lent, Holy Week,
// and Pentecost all land on different dates — sometimes weeks apart). Spans
// are day-of-year for the 2026 demo date, computed from the real Easter/
// Pascha dates that year (Western Apr 5, Orthodox Apr 12).
const WHEEL_WESTERN = [
  { key: "advent", label: "Advent", span: [335, 360], color: "#5B3B8C" },
  { key: "christmas", label: "Christmas", span: [360, 378], color: "#C9A227" },
  { key: "ordinary1", label: "Ordinary Time", span: [13, 49], color: "#3F6B4F" },
  { key: "lent", label: "Lent", span: [49, 91], color: "#5B3B8C" },
  { key: "triduum", label: "Triduum", span: [91, 95], color: "#A32638" },
  { key: "easter", label: "Eastertide", span: [95, 144], color: "#C9A227" },
  { key: "ordinary2", label: "Ordinary Time", span: [144, 335], color: "#3F6B4F" },
];

// Most Orthodox jurisdictions (Greek, Antiochian, Romanian, OCA...) use the
// Gregorian calendar for fixed feasts but the Julian Paschalion for Pascha —
// this is "WHEEL_ORTHODOX_NEW" below. Others (Russian, Serbian, Georgian,
// Jerusalem) use the Julian calendar throughout, so fixed feasts run 13 days
// later — this shifts Nativity Fast, Nativity, and Theophany, but leaves
// Pascha and everything calculated from it (Great Lent, Holy Week, Pentecost)
// unchanged, since those already use the Julian Paschalion either way.
const WHEEL_ORTHODOX_NEW = [
  { key: "nativity-fast", label: "Nativity Fast", span: [319, 358], color: "#5B3B8C" },
  { key: "nativity", label: "Nativity & Theophany", span: [358, 378], color: "#C9A227" },
  { key: "after-theophany", label: "Season after Theophany", span: [14, 54], color: "#3F6B4F" },
  { key: "great-lent", label: "Great Lent", span: [54, 95], color: "#5B3B8C" },
  { key: "holy-week", label: "Holy Week", span: [95, 102], color: "#A32638" },
  { key: "paschaltide", label: "Paschaltide", span: [102, 151], color: "#C9A227" },
  { key: "after-pentecost", label: "Season after Pentecost", span: [151, 319], color: "#3F6B4F" },
];

const WHEEL_ORTHODOX_OLD = [
  { key: "nativity-fast", label: "Nativity Fast", span: [332, 372], color: "#5B3B8C" },
  { key: "nativity", label: "Nativity & Theophany", span: [372, 384], color: "#C9A227" },
  { key: "after-theophany", label: "Season after Theophany", span: [20, 54], color: "#3F6B4F" },
  { key: "great-lent", label: "Great Lent", span: [54, 95], color: "#5B3B8C" },
  { key: "holy-week", label: "Holy Week", span: [95, 102], color: "#A32638" },
  { key: "paschaltide", label: "Paschaltide", span: [102, 151], color: "#C9A227" },
  { key: "after-pentecost", label: "Season after Pentecost", span: [151, 332], color: "#3F6B4F" },
];

function wheelForTradition(tradition, calendar) {
  if (tradition !== "Orthodox") return WHEEL_WESTERN;
  return calendar === "Julian" ? WHEEL_ORTHODOX_OLD : WHEEL_ORTHODOX_NEW;
}

const TRADITIONS = ["Catholic", "Anglican", "Orthodox"];

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

// Returns the first scripture reading (skipping opening prayers) so the
// Today teaser and day-detail sheet show a citation, not a prayer title.
function firstReadingRef(tradition) {
  const data = READINGS[tradition];
  const sequence = data.kind === "office" ? data.am.sequence : data.kind === "mass" ? data.mass.sequence : data.daily.sequence;
  const reading = sequence.find((item) => item.type === "reading");
  return reading ? reading.ref : sequence[0].ref;
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
  const [tab, setTab] = useState("today");
  const [tradition, setTradition] = useState("Catholic");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFeast, setSelectedFeast] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendar, setCalendar] = useState("Gregorian"); // "Gregorian" (New Calendar) | "Julian" (Old Calendar) — only meaningful for Orthodox
  const season = CURRENT;
  const progressPct = Math.round((season.dayInSeason / season.seasonLength) * 100);

  return (
    <div className="w-full flex items-center justify-center bg-[#0f0e0d]" style={{ minHeight: "100dvh" }}>
      {/* App shell — full-bleed on phones, a centered column on wider screens
          so this also works as a desktop-browser fallback for the PWA. */}
      <div
        className="relative w-full max-w-[480px] flex flex-col sm:my-6 sm:rounded-[2rem] sm:shadow-2xl overflow-hidden"
        style={{ minHeight: "100dvh", backgroundColor: "#211F1D" }}
      >
        {/* Header — padded for the device status bar / notch via safe-area-inset */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 pb-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: season.accent }}>
              {tradition}
            </p>
            <h1
              className="text-[15px] tracking-wide"
              style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}
            >
              Ordo
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#2A2825" }}
          >
            <Settings2 size={16} color="#EDE7DC99" />
          </button>
        </div>

        {/* Scrollable content — min-h-0 is required here so this area scrolls
            internally instead of stretching the flex column (which would drag
            the header and tab bar along with it) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 no-scrollbar">
          {tab === "today" && (
            <TodayView
              season={season}
              progressPct={progressPct}
              onSelectFeast={setSelectedFeast}
              onOpenReadings={() => setTab("readings")}
              tradition={tradition}
            />
          )}
          {tab === "grid" && <GridView season={season} onSelectDay={setSelectedDay} />}
          {tab === "wheel" && <WheelView season={season} tradition={tradition} calendar={calendar} />}
          {tab === "readings" && <ReadingsView tradition={tradition} season={season} />}
          {tab === "feasts" && <FeastsView onSelectFeast={setSelectedFeast} />}
        </div>

        {/* Bottom tab bar — padded for the home indicator via safe-area-inset */}
        <div
          className="flex-shrink-0 flex items-center justify-around border-t px-1 pt-2"
          style={{
            borderColor: "#2A2825",
            backgroundColor: "#1A1918",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          }}
        >
          <TabButton icon={Flame} label="Today" active={tab === "today"} color={season.accent} onClick={() => setTab("today")} />
          <TabButton icon={CalendarDays} label="Grid" active={tab === "grid"} color={season.accent} onClick={() => setTab("grid")} />
          <TabButton icon={CircleDot} label="Wheel" active={tab === "wheel"} color={season.accent} onClick={() => setTab("wheel")} />
          <TabButton icon={BookOpen} label="Prayer" active={tab === "readings"} color={season.accent} onClick={() => setTab("readings")} />
          <TabButton icon={Star} label="Feasts" active={tab === "feasts"} color={season.accent} onClick={() => setTab("feasts")} />
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
          />
        )}

        {/* Feast bio sheet — reachable from Today's "Next feast", the Feasts tab, and a day's detail sheet */}
        {selectedFeast && <FeastModal feast={selectedFeast} onClose={() => setSelectedFeast(null)} />}

        {/* Day detail sheet — reachable by tapping any day on the Grid tab */}
        {selectedDay && !selectedFeast && (
          <DayDetailSheet
            day={selectedDay}
            tradition={tradition}
            onClose={() => setSelectedDay(null)}
            onOpenFeast={(f) => {
              setSelectedDay(null);
              setSelectedFeast(f);
            }}
          />
        )}
      </div>
    </div>
  );
}

function SheetOverlay({ onClose, children }) {
  return (
    <div className="absolute inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-6 pb-10 max-h-[85%] overflow-y-auto"
        style={{ backgroundColor: "#1A1918" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "#3a3835" }} />
        {children}
      </div>
    </div>
  );
}

function SettingsSheet({ tradition, calendar, onApply, onClose, season }) {
  // Local draft so picking an option doesn't change the app until confirmed —
  // gives the user a clear moment where the change actually takes effect.
  const [draft, setDraft] = useState(tradition);
  const [draftCalendar, setDraftCalendar] = useState(calendar);
  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "#EDE7DC66" }}>
        Tradition
      </p>
      <div className="space-y-2">
        {TRADITIONS.map((t) => (
          <button
            key={t}
            onClick={() => setDraft(t)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px]"
            style={{
              backgroundColor: draft === t ? `${season.color}33` : "#211F1D",
              color: "#EDE7DC",
              border: draft === t ? `1px solid ${season.accent}` : "1px solid transparent",
            }}
          >
            {t}
            {draft === t && <span style={{ color: season.accent }}>●</span>}
          </button>
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] mb-3 mt-5" style={{ color: "#EDE7DC66" }}>
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
                  backgroundColor: draftCalendar === c.key ? `${season.color}33` : "#211F1D",
                  border: draftCalendar === c.key ? `1px solid ${season.accent}` : "1px solid transparent",
                }}
              >
                <div>
                  <p className="text-[14px]" style={{ color: "#EDE7DC" }}>
                    {c.label}
                  </p>
                  <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: "#EDE7DC66" }}>
                    {c.sub}
                  </p>
                </div>
                {draftCalendar === c.key && <span style={{ color: season.accent }}>●</span>}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] mt-3" style={{ color: "#EDE7DC55" }}>
            Pascha and Great Lent are calculated the same way either way — this only shifts fixed feasts like
            the Nativity Fast and Christmas.
          </p>
        </>
      ) : (
        <div
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#211F1D", border: "1px solid transparent" }}
        >
          <p className="text-[14px]" style={{ color: "#EDE7DC88" }}>
            Gregorian
          </p>
          <span style={{ color: "#EDE7DC44" }}>●</span>
        </div>
      )}

      <p className="text-[11px] mt-4 mb-5" style={{ color: "#EDE7DC55" }}>
        Calendar dates and feast days adjust to match.
      </p>
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
    </SheetOverlay>
  );
}

function FeastModal({ feast, onClose }) {
  return (
    <SheetOverlay onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: feast.color }} />
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "#EDE7DC66" }}>
          {feast.date} · {feast.rank}
        </p>
      </div>
      <h2 className="text-[24px] leading-tight mb-4" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
        {feast.name}
      </h2>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#EDE7DCcc" }}>
        {feast.bio}
      </p>
      <div className="rounded-xl p-3.5" style={{ backgroundColor: "#211F1D" }}>
        <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "#EDE7DC55" }}>
          Why this color
        </p>
        <p className="text-[12px] leading-relaxed" style={{ color: "#EDE7DCaa" }}>
          {feast.why}
        </p>
      </div>
    </SheetOverlay>
  );
}

// Illustrative only: maps a demo day to a season and, if one exists, a feast —
// the real build derives this from the computed calendar, not a lookup like this.
function demoDaySeason(day) {
  return day < 21 ? SEASONS.ordinary1 : SEASONS.advent;
}
function demoDayFeast(day) {
  return FEASTS.find((f) => f.date === `Aug ${day}`) || null;
}

function DayDetailSheet({ day, tradition, onClose, onOpenFeast }) {
  const season = demoDaySeason(day);
  const feast = demoDayFeast(day);
  const readingRef = firstReadingRef(tradition);

  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: "#EDE7DC66" }}>
        August {day}
      </p>

      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: `${season.color}22`, border: `1px solid ${season.color}55` }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: season.accent }}>
          {season.latin}
        </p>
        <h2 className="text-[24px] leading-tight" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
          {season.name}
        </h2>
      </div>

      <div className="rounded-2xl p-4 mb-3 flex items-center gap-3" style={{ backgroundColor: "#2A2825" }}>
        <BookOpen size={18} color={season.accent} />
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "#EDE7DC66" }}>
            Reading
          </p>
          <p className="text-[13px]" style={{ color: "#EDE7DC" }}>
            {readingRef}
          </p>
        </div>
      </div>

      {feast ? (
        <button
          onClick={() => onOpenFeast(feast)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{ backgroundColor: "#2A2825" }}
        >
          <Star size={18} color={season.accent} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "#EDE7DC66" }}>
              Feast
            </p>
            <p className="text-[13px]" style={{ color: "#EDE7DC" }}>
              {feast.name}
            </p>
          </div>
          <ChevronRight size={16} color="#EDE7DC55" />
        </button>
      ) : (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "#2A2825" }}>
          <Star size={18} color="#EDE7DC44" />
          <p className="text-[13px]" style={{ color: "#EDE7DC66" }}>
            No major feast today
          </p>
        </div>
      )}
    </SheetOverlay>
  );
}

function TabButton({ icon: Icon, label, active, color, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 px-1.5 py-1 flex-1">
      <Icon size={18} color={active ? color : "#EDE7DC55"} strokeWidth={active ? 2.4 : 1.8} />
      <span className="text-[9px] tracking-wide" style={{ color: active ? color : "#EDE7DC55" }}>
        {label}
      </span>
    </button>
  );
}

function TodayView({ season, progressPct, onSelectFeast, onOpenReadings, tradition }) {
  const nextFeast = FEASTS[0];
  const readingRef = firstReadingRef(tradition);
  return (
    <div className="pt-2">
      {/* Hero card */}
      <div
        className="rounded-3xl p-6 mb-4 relative overflow-hidden"
        style={{ backgroundColor: `${season.color}22`, border: `1px solid ${season.color}55` }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: season.accent }}>
          {season.latin}
        </p>
        <h2
          className="text-[32px] leading-tight mb-1"
          style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}
        >
          {season.name}
        </h2>
        <p className="text-[13px] mb-5" style={{ color: "#EDE7DC99" }}>
          {season.weekLabel} · Saturday, August 22
        </p>

        {/* Candle progress bar */}
        <div className="flex items-center gap-2">
          <Flame size={14} color={season.accent} />
          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "#00000040" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPct}%`, backgroundColor: season.accent }}
            />
          </div>
          <span className="text-[11px]" style={{ color: "#EDE7DC80" }}>
            {season.dayInSeason}/{season.seasonLength}d
          </span>
        </div>
      </div>

      {/* Color swatch card */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ backgroundColor: "#2A2825" }}>
        <div className="w-10 h-10 rounded-full border-2" style={{ backgroundColor: season.color, borderColor: "#EDE7DC33" }} />
        <div>
          <p className="text-[13px]" style={{ color: "#EDE7DC" }}>
            Liturgical color
          </p>
          <p className="text-[11px]" style={{ color: "#EDE7DC66" }}>
            Green — growth, ordinary discipleship
          </p>
        </div>
      </div>

      {/* Reading teaser — clicks through to the full Readings tab */}
      <button
        onClick={onOpenReadings}
        className="w-full rounded-2xl p-4 mb-4 flex items-center justify-between text-left"
        style={{ backgroundColor: "#2A2825" }}
      >
        <div className="flex items-center gap-3">
          <BookOpen size={18} color={season.accent} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "#EDE7DC66" }}>
              Today's reading
            </p>
            <p className="text-[14px]" style={{ color: "#EDE7DC" }}>
              {readingRef}
            </p>
          </div>
        </div>
        <ChevronRight size={18} color="#EDE7DC55" />
      </button>

      {/* Next feast teaser — clicks through to the same bio sheet as the Feasts tab */}
      <button
        onClick={() => onSelectFeast(nextFeast)}
        className="w-full rounded-2xl p-4 flex items-center justify-between text-left"
        style={{ backgroundColor: "#2A2825" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: "#EDE7DC66" }}>
            Next feast
          </p>
          <p className="text-[14px]" style={{ color: "#EDE7DC" }}>
            {nextFeast.name}
          </p>
          <p className="text-[11px]" style={{ color: "#EDE7DC66" }}>
            {nextFeast.date} · {nextFeast.rank}
          </p>
        </div>
        <ChevronRight size={18} color="#EDE7DC55" />
      </button>

      {/* Sync button */}
      <button
        className="w-full mt-4 rounded-2xl py-3 flex items-center justify-center gap-2 text-[13px]"
        style={{ backgroundColor: season.color, color: "#EDE7DC" }}
      >
        <Download size={15} />
        Sync to calendar
      </button>
    </div>
  );
}

// Illustrative only: shows Ordinary Time running into an early Advent
// so the per-day season border is visible in a single demo month.
// Real build derives this from the computed season ranges, not a fixed map.
function demoDaySeasonColor(d) {
  if (d < 21) return SEASONS.ordinary1.color;
  return SEASONS.advent.color;
}

function GridView({ season, onSelectDay }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const highlightDays = { 24: "#A32638", 28: "#EDE7DC" };
  return (
    <div className="pt-2">
      <h3 className="text-[18px] mb-3" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
        August
      </h3>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] pb-1" style={{ color: "#EDE7DC55" }}>
            {d}
          </div>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const isToday = d === 22;
          const highlight = highlightDays[d];
          const dayColor = demoDaySeasonColor(d);
          return (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              className="aspect-square rounded-lg flex items-center justify-center text-[12px] relative"
              style={{
                backgroundColor: isToday ? season.color : highlight ? `${highlight}22` : "#2A2825",
                color: isToday ? "#EDE7DC" : "#EDE7DCcc",
                border: isToday ? `1px solid ${season.accent}` : "1px solid transparent",
                borderBottom: isToday ? `1px solid ${season.accent}` : `3px solid ${dayColor}`,
                boxSizing: "border-box",
              }}
            >
              {d}
              {highlight && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: highlight }}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: "#EDE7DC55" }}>
        Tap a day for its details · bottom border shows its season · dot marks a feast day.
      </p>
    </div>
  );
}

const TODAY_DAY_OF_YEAR = 234; // Aug 22 demo

// Formats a day-of-year (1–365, may overflow into the next year) as "Mon D".
function doyLabel(doy) {
  const d = new Date(2026, 0, doy);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function WheelView({ season, tradition, calendar }) {
  const cx = 130, cy = 130, r = 100;
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const activeIdx = hovered ?? pinned;

  const wheel = wheelForTradition(tradition, calendar);
  const currentIdx = wheel.findIndex((seg) => TODAY_DAY_OF_YEAR >= seg.span[0] && TODAY_DAY_OF_YEAR <= seg.span[1]);
  const activeSeg = activeIdx !== null ? wheel[activeIdx] : null;
  const currentSeg = currentIdx !== -1 ? wheel[currentIdx] : null;

  // Reset any pinned/hovered wedge when the tradition or calendar changes
  // underneath us, since the wedge index may no longer correspond to the same season.
  useEffect(() => {
    setPinned(null);
    setHovered(null);
  }, [tradition, calendar]);

  return (
    <div className="pt-4 flex flex-col items-center">
      <svg width="260" height="260" viewBox="0 0 260 260">
        {wheel.map((seg, i) => {
          const startAngle = (seg.span[0] / 365) * 360;
          const endAngle = (seg.span[1] / 365) * 360;
          const color = seg.color || "#3F6B4F";
          const isCurrent = i === currentIdx;
          const segRadius = isCurrent ? r + 10 : r;
          return (
            <path
              key={i}
              d={arcPath(cx, cy, segRadius, startAngle, endAngle)}
              fill={color}
              opacity={isCurrent ? 1 : activeIdx === i ? 0.85 : 0.55}
              stroke="#211F1D"
              strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned((prev) => (prev === i ? null : i))}
            >
              <title>
                {seg.label} · {doyLabel(seg.span[0])} – {doyLabel(seg.span[1])}
              </title>
            </path>
          );
        })}
        {/* Clock hand: today's position within the year */}
        {(() => {
          const todayAngle = (TODAY_DAY_OF_YEAR / 365) * 360;
          const [hx, hy] = polarToXY(cx, cy, r + 14, todayAngle);
          return (
            <g>
              <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#EDE7DC" strokeWidth="2" strokeLinecap="round" />
              <circle cx={hx} cy={hy} r="4.5" fill="#EDE7DC" stroke={season.accent} strokeWidth="2" />
            </g>
          );
        })()}
        <circle cx={cx} cy={cy} r={48} fill="#211F1D" stroke="#2A2825" strokeWidth="1" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#EDE7DC" fontSize="12" fontFamily="'Fraunces', serif">
          Aug 22
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#EDE7DC99" fontSize="8">
          {currentSeg?.label}
        </text>
      </svg>

      {tradition === "Orthodox" && (
        <p className="text-[10px] uppercase tracking-[0.15em] -mt-1 mb-1" style={{ color: "#EDE7DC44" }}>
          {calendar === "Julian" ? "Julian (Old Calendar)" : "Gregorian (New Calendar)"}
        </p>
      )}

      {/* Tap (or hover, on desktop) a wedge to see its date range */}
      <div className="h-9 flex items-center justify-center">
        {activeSeg ? (
          <p className="text-[12px]" style={{ color: "#EDE7DCcc" }}>
            <span style={{ fontFamily: "'Fraunces', serif" }}>{activeSeg.label}</span>
            <span style={{ color: "#EDE7DC66" }}>
              {" "}
              · {doyLabel(activeSeg.span[0])} – {doyLabel(activeSeg.span[1])}
            </span>
          </p>
        ) : (
          <p className="text-[11px]" style={{ color: "#EDE7DC44" }}>
            Tap a wedge for its date range
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1 w-full px-2">
        {wheel.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[10.5px] leading-tight" style={{ color: "#EDE7DCaa" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingsView({ tradition, season }) {
  const data = READINGS[tradition];
  const defaultSegment = data.kind === "office" ? "am" : data.kind === "mass" ? "mass" : "daily";
  const [segment, setSegment] = useState(defaultSegment);

  useEffect(() => {
    setSegment(defaultSegment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition]);

  // Guard against a stale segment from the previous tradition being used
  // on the render that happens before the effect above has run.
  const validSegment = data.kind === "office" && ["am", "pm", "eucharist"].includes(segment) ? segment : defaultSegment;

  // Reset to a valid segment when tradition changes underneath us
  const segments =
    data.kind === "office"
      ? [
          { key: "am", label: "Morning", icon: Sun },
          { key: "pm", label: "Evening", icon: Moon },
          { key: "eucharist", label: "Sunday", icon: BookOpen },
        ]
      : null;
  const activeData = data.kind === "office" ? data[validSegment] : data.kind === "mass" ? data.mass : data.daily;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[18px]" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
          Prayer &amp; Readings
        </h3>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#EDE7DC55" }}>
          {tradition}
        </span>
      </div>

      {segments && (
        <div className="flex gap-1.5 mb-4 mt-3">
          {segments.map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className="flex-1 rounded-xl py-2 flex items-center justify-center gap-1.5 text-[12px]"
              style={{
                backgroundColor: validSegment === s.key ? season.color : "#2A2825",
                color: validSegment === s.key ? "#EDE7DC" : "#EDE7DC88",
              }}
            >
              <s.icon size={13} />
              {s.label}
            </button>
          ))}
        </div>
      )}
      {!segments && (
        <p className="text-[12px] mb-4 mt-2" style={{ color: "#EDE7DC66" }}>
          {activeData.label}
        </p>
      )}

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: season.color }} />
          <span className="text-[10px]" style={{ color: "#EDE7DC66" }}>
            Prayer
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: "#C9A227" }} />
          <span className="text-[10px]" style={{ color: "#EDE7DC66" }}>
            Scripture
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {activeData.sequence.map((item, i) => (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "#2A2825",
              borderLeft: item.type === "prayer" ? `3px solid ${season.color}` : "3px solid #C9A227",
            }}
          >
            {item.role && (
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: season.accent }}>
                {item.role}
              </p>
            )}
            <p className="text-[13px] mb-2" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
              {item.ref}
            </p>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "#EDE7DCbb" }}>
              {item.text}
              {item.truncated && <span style={{ color: "#EDE7DC55" }}> …</span>}
            </p>
            {item.truncated && (
              <button className="text-[11px] mt-2 underline decoration-dotted" style={{ color: season.accent }}>
                {item.type === "prayer" ? "Read full text" : "Read full passage"}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] mt-4 leading-relaxed" style={{ color: "#EDE7DC44" }}>
        Prayers and readings shown here use public-domain or traditional wording (KJV, 1662 BCP,
        ancient liturgical formulas) for mockup purposes. A shipped app would need to license each
        tradition's current official translation, or fall back to a public-domain edition.
      </p>
    </div>
  );
}

function FeastsView({ onSelectFeast }) {
  return (
    <div className="pt-2">
      <h3 className="text-[18px] mb-3" style={{ fontFamily: "'Fraunces', serif", color: "#EDE7DC" }}>
        Upcoming feasts
      </h3>
      <div className="space-y-2">
        {FEASTS.map((f, i) => (
          <button
            key={i}
            onClick={() => onSelectFeast(f)}
            className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left"
            style={{ backgroundColor: "#2A2825" }}
          >
            <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
            <div className="flex-1">
              <p className="text-[13px]" style={{ color: "#EDE7DC" }}>
                {f.name}
              </p>
              <p className="text-[11px]" style={{ color: "#EDE7DC66" }}>
                {f.date} · {f.rank}
              </p>
            </div>
            <ChevronRight size={16} color="#EDE7DC55" />
          </button>
        ))}
      </div>
    </div>
  );
}
