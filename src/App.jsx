import React, { useState, useEffect, useMemo } from "react";
import { Flame, CalendarDays, CircleDot, Star, Settings2, ChevronRight, ChevronLeft, Download, BookOpen, Sun, Moon, SunMoon, Monitor, X } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { alpha, seasonAccent } from "./theme";
import UpdateToast from "./UpdateToast";
import InstallToast from "./InstallToast";
import CookieConsent from "./CookieConsent";
import { usePersistedState } from "./usePersistedState";
import { loadGoogleAnalytics, disableGoogleAnalytics } from "./analytics";
import { CHANGELOG } from "./changelogData";
import { liturgicalYearData, seasonAt, feastOnDate, upcomingFeasts, withDisplay } from "./lib/feasts";
import { buildIcs, downloadIcs } from "./lib/ics";
import { dateOnly, daysBetween } from "./lib/dates";
import { getPassage, bibleGatewayUrl, DEFAULT_WEB_VERSION, WEB_VERSION_LABELS } from "./lib/scripture";
import { BIBLEGATEWAY_VERSIONS } from "./data/bibleGatewayVersions";
import { eucharistReadingFor, sundayReadingFor, officeReadingFor, psalmFor, collect1662For, collectCWFor, canticlePreview, morningFirstCanticleKey, eveningFirstCanticleKey, seasonalCanticleKey, secondThirdServiceFor, bcpSundayFirstLessonFor, fixedFeastEucharistFor, postCommunionCWFor, catholicSundayReadingFor, catholicLaudsFor, catholicVespersFor, catholicComplineFor, catholicWeekdayReadingFor, catholicOfficeOfReadingsFor, catholicDaytimePrayerFor, orthodoxSundayReadingFor } from "./lib/lectionary";
import { splitCitation } from "./lib/citationNormalize";
import { parseReference, formatReference } from "./lib/bibleRef";
import { bookDisplayName } from "./data/bibleBooks";
import canticles1662Raw from "./data/canticles_1662_raw.json";
import canticlesCWRaw from "./data/canticles_cw_raw.json";

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
          canticleKey: "venite",
          text: "O come, let us sing unto the Lord: let us heartily rejoice in the strength of our salvation. Let us come before his presence with thanksgiving: and shew ourselves glad in him with psalms. For the Lord is a great God: and a great King above all gods.",
          truncated: true,
        },
        { type: "reading", ref: "Isaiah 26:1–9", text: "In that day shall this song be sung in the land of Judah; We have a strong city; salvation will God appoint for walls and bulwarks. Open ye the gates, that the righteous nation which keepeth the truth may enter in.", truncated: true },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Te Deum Laudamus",
          canticleKey: "te_deum",
          text: "We praise thee, O God; we acknowledge thee to be the Lord. All the earth doth worship thee, the Father everlasting. To thee all angels cry aloud, the heavens and all the powers therein.",
          truncated: true,
        },
        { type: "reading", ref: "Galatians 5:16–25", text: "This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh. For the flesh lusteth against the Spirit, and the Spirit against the flesh: and these are contrary the one to the other.", truncated: true },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Benedictus",
          canticleKey: "benedictus",
          text: "Blessed be the Lord God of Israel: for he hath visited, and redeemed his people; And hath raised up a mighty salvation for us: in the house of his servant David.",
          truncated: true,
        },
        {
          type: "prayer",
          role: "Collect",
          ref: "Collect for Peace",
          text: "O God, who art the author of peace and lover of concord, in knowledge of whom standeth our eternal life, whose service is perfect freedom; Defend us thy humble servants in all assaults of our enemies; that we, surely trusting in thy defence, may not fear the power of any adversaries, through the might of Jesus Christ our Lord. Amen.",
        },
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
        },
        { type: "reading", ref: "Job 1:1–22", text: "There was a man in the land of Uz, whose name was Job; and that man was perfect and upright, and one that feared God, and eschewed evil.", truncated: true },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Magnificat",
          canticleKey: "magnificat",
          text: "My soul doth magnify the Lord: and my spirit hath rejoiced in God my Saviour. For he hath regarded: the lowliness of his handmaiden. For behold, from henceforth: all generations shall call me blessed.",
          truncated: true,
        },
        { type: "reading", ref: "Luke 12:22–31", text: "And he said unto his disciples, Therefore I say unto you, Take no thought for your life, what ye shall eat; neither for the body, what ye shall put on.", truncated: true },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Nunc dimittis",
          canticleKey: "nunc_dimittis",
          text: "Lord, now lettest thou thy servant depart in peace: according to thy word. For mine eyes have seen: thy salvation; Which thou hast prepared: before the face of all people.",
          truncated: true,
        },
        {
          type: "prayer",
          role: "Collect",
          ref: "Collect for Peace",
          text: "O God, from whom all holy desires, all good counsels, and all just works do proceed; Give unto thy servants that peace which the world cannot give; that both our hearts may be set to obey thy commandments, and also that by thee we, being defended from the fear of our enemies, may pass our time in rest and quietness, through the merits of Jesus Christ our Saviour. Amen.",
        },
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
        {
          type: "prayer",
          role: "Confession",
          ref: "The General Confession",
          text: "Almighty God, Father of our Lord Jesus Christ, Maker of all things, Judge of all men: We acknowledge and bewail our manifold sins and wickedness, which we from time to time most grievously have committed, by thought, word, and deed, against thy Divine Majesty, provoking most justly thy wrath and indignation against us. We do earnestly repent, and are heartily sorry for these our misdoings; the remembrance of them is grievous unto us; the burden of them is intolerable. Have mercy upon us, have mercy upon us, most merciful Father; for thy Son our Lord Jesus Christ's sake, forgive us all that is past; and grant that we may ever hereafter serve and please thee in newness of life, to the honour and glory of thy Name; through Jesus Christ our Lord. Amen.",
        },
        { type: "reading", ref: "Jeremiah 1:4–10", text: "Then the word of the Lord came unto me, saying, Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet unto the nations.", truncated: true },
        { type: "reading", ref: "Psalm 71:1–6", text: "In thee, O Lord, do I put my trust: let me never be put to confusion. Deliver me in thy righteousness, and cause me to escape: incline thine ear unto me, and save me." },
        { type: "reading", ref: "Hebrews 12:18–29", text: "For ye are not come unto the mount that might be touched, and that burned with fire, nor unto blackness, and darkness, and tempest.", truncated: true },
        { type: "reading", ref: "Luke 13:10–17", text: "And he was teaching in one of the synagogues on the sabbath. And, behold, there was a woman which had a spirit of infirmity eighteen years, and was bowed together.", truncated: true },
      ],
    },
  },
  Catholic: {
    kind: "catholic",
    mass: {
      label: "Daily Mass",
      icon: "sun",
      sequence: [
        {
          type: "prayer",
          role: "Penitential Act",
          ref: "Confiteor",
          text: "I confess to almighty God and to you, my brothers and sisters, that I have greatly sinned, in my thoughts and in my words, in what I have done and in what I have failed to do, through my fault, through my fault, through my most grievous fault; therefore I ask blessed Mary ever-Virgin, all the Angels and Saints, and you, my brothers and sisters, to pray for me to the Lord our God.",
        },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Gloria in excelsis",
          text: "Glory to God in the highest, and on earth peace to people of good will. We praise you, we bless you, we adore you, we glorify you, we give you thanks for your great glory, Lord God, heavenly King, O God, almighty Father. Lord Jesus Christ, Only Begotten Son, Lord God, Lamb of God, Son of the Father, you take away the sins of the world, have mercy on us; you take away the sins of the world, receive our prayer; you are seated at the right hand of the Father, have mercy on us. For you alone are the Holy One, you alone are the Lord, you alone are the Most High, Jesus Christ, with the Holy Spirit, in the glory of God the Father. Amen.",
        },
        {
          type: "prayer",
          role: "Collect",
          ref: "Opening Prayer",
          text: "O God, from whom all holy desires, all good counsels, and all just works do proceed: give unto thy servants that peace which the world cannot give, that our hearts may be set to obey thy commandments; through the merits of Jesus Christ our Saviour. Amen.",
        },
        { type: "reading", role: "First Reading", ref: "Ezekiel 43:1–7", text: "Afterward he brought me to the gate, even the gate that looketh toward the east: And, behold, the glory of the God of Israel came from the way of the east: and his voice was like a noise of many waters.", truncated: true },
        { type: "reading", role: "Responsorial Psalm", ref: "Psalm 85:9–14", text: "Surely his salvation is nigh them that fear him; that glory may dwell in our land. Mercy and truth are met together; righteousness and peace have kissed each other." },
        { type: "reading", role: "Gospel", ref: "Matthew 23:1–12", text: "Then spake Jesus to the multitude, and to his disciples, Saying, The scribes and the Pharisees sit in Moses' seat: All therefore whatsoever they bid you observe, that observe and do.", truncated: true },
        {
          type: "prayer",
          role: "Eucharistic Prayer II",
          ref: "Preface",
          text: "Father, it is our duty and our salvation, always and everywhere to give you thanks through your beloved Son, our Lord Jesus Christ. He is the Word through whom you made the universe, the Savior you sent to redeem us. By the power of the Holy Spirit he took flesh and was born of the Virgin Mary.",
        },
        {
          type: "prayer",
          role: "Eucharistic Prayer II",
          ref: "Institution Narrative",
          text: "Before he was given up to death, a death he freely accepted, he took bread and gave you thanks. He broke the bread, gave it to his disciples, and said: Take this, all of you, and eat of it, for this is my Body, which will be given up for you. When supper was ended, he took the cup. Again he gave you thanks and praise, gave the cup to his disciples, and said: Take this, all of you, and drink from it, for this is the chalice of my Blood, the Blood of the new and eternal covenant, which will be poured out for you and for many for the forgiveness of sins. Do this in memory of me.",
        },
        {
          type: "prayer",
          role: "Eucharistic Prayer II",
          ref: "Doxology",
          text: "Through him, and with him, and in him, O God, almighty Father, in the unity of the Holy Spirit, all glory and honor is yours, for ever and ever. Amen.",
        },
        {
          type: "prayer",
          role: "Agnus Dei",
          ref: "Lamb of God",
          text: "Lamb of God, you take away the sins of the world, have mercy on us. Lamb of God, you take away the sins of the world, have mercy on us. Lamb of God, you take away the sins of the world, grant us peace.",
        },
        {
          type: "prayer",
          role: "Dismissal",
          ref: "Concluding Rite",
          text: "The Lord be with you. And with your spirit. May almighty God bless you: the Father, and the Son, and the Holy Spirit. Amen. Go forth, the Mass is ended. Thanks be to God.",
        },
      ],
    },
    mass_tlm: {
      label: "Daily Mass (Traditional Latin)",
      icon: "sun",
      sequence: [
        {
          type: "prayer",
          role: "Penitential Act",
          ref: "Confiteor (full traditional form)",
          text: "I confess to almighty God, to blessed Mary ever Virgin, to blessed Michael the Archangel, to blessed John the Baptist, to the holy Apostles Peter and Paul, to all the Saints, and to you, Father, that I have sinned exceedingly in thought, word, and deed, through my fault, through my fault, through my most grievous fault. Therefore I beseech blessed Mary ever Virgin, blessed Michael the Archangel, blessed John the Baptist, the holy Apostles Peter and Paul, all the Saints, and you, Father, to pray for me to the Lord our God.",
        },
        {
          type: "prayer",
          role: "Kyrie",
          ref: "Kyrie eleison",
          text: "Lord, have mercy. Lord, have mercy. Lord, have mercy. Christ, have mercy. Christ, have mercy. Christ, have mercy. Lord, have mercy. Lord, have mercy. Lord, have mercy.",
        },
        {
          type: "prayer",
          role: "Canticle",
          ref: "Gloria in excelsis",
          text: "Glory be to God on high, and in earth peace, good will towards men. We praise thee, we bless thee, we worship thee, we glorify thee, we give thanks to thee, for thy great glory, O Lord God, heavenly King, God the Father Almighty. O Lord, the only-begotten Son Jesus Christ; O Lord God, Lamb of God, Son of the Father, that takest away the sins of the world, have mercy upon us. Thou that takest away the sins of the world, have mercy upon us. Thou that takest away the sins of the world, receive our prayer. Thou that sittest at the right hand of God the Father, have mercy upon us. For thou only art holy; thou only art the Lord; thou only, O Christ, with the Holy Ghost, art most high in the glory of God the Father. Amen.",
        },
        { type: "reading", role: "First Reading", ref: "Ezekiel 43:1–7", text: "Afterward he brought me to the gate, even the gate that looketh toward the east: And, behold, the glory of the God of Israel came from the way of the east: and his voice was like a noise of many waters.", truncated: true },
        { type: "reading", role: "Responsorial Psalm", ref: "Psalm 85:9–14", text: "Surely his salvation is nigh them that fear him; that glory may dwell in our land. Mercy and truth are met together; righteousness and peace have kissed each other." },
        { type: "reading", role: "Gospel", ref: "Matthew 23:1–12", text: "Then spake Jesus to the multitude, and to his disciples, Saying, The scribes and the Pharisees sit in Moses' seat: All therefore whatsoever they bid you observe, that observe and do.", truncated: true },
        {
          type: "prayer",
          role: "Eucharistic Prayer",
          ref: "Te igitur (the Roman Canon)",
          text: "Wherefore, O most merciful Father, we humbly pray and beseech thee, through Jesus Christ thy Son our Lord, that thou wouldst vouchsafe to receive and bless these gifts, these offerings, this holy and unblemished sacrifice, which in the first place we offer thee for thy holy Catholic Church, that it may please thee to grant her peace, as also to protect, unite, and govern her throughout the world, together with thy servant our Pope, our Bishop, and all orthodox believers who keep the catholic and apostolic faith.",
        },
        {
          type: "prayer",
          role: "Eucharistic Prayer",
          ref: "The Words of Consecration",
          text: "Who, the day before he suffered, took bread into his holy and venerable hands, and with his eyes lifted up to heaven, unto thee, God his almighty Father, giving thanks to thee, he blessed, brake, and gave to his disciples, saying: Take and eat ye all of this, for this is my Body. In like manner, after he had supped, taking also this excellent chalice into his holy and adorable hands, and giving thanks to thee, he blessed, and gave it to his disciples, saying: Take, and drink ye all of this, for this is the Chalice of my Blood, of the new and eternal testament, the mystery of faith, which shall be shed for you and for many unto the remission of sins. As often as ye shall do these things, ye shall do them in memory of me.",
        },
        {
          type: "prayer",
          role: "Eucharistic Prayer",
          ref: "Per ipsum (the closing doxology)",
          text: "By him, and with him, and in him, is to thee, God the Father almighty, in the unity of the Holy Ghost, all honour and glory, for ever and ever. Amen.",
        },
        {
          type: "prayer",
          role: "Agnus Dei",
          ref: "Lamb of God",
          text: "Lamb of God, who takest away the sins of the world, have mercy on us. Lamb of God, who takest away the sins of the world, have mercy on us. Lamb of God, who takest away the sins of the world, grant us peace.",
        },
        {
          type: "prayer",
          role: "Dismissal",
          ref: "Ite, missa est",
          text: "The Lord be with you. And with thy spirit. Go, you are dismissed. Thanks be to God.",
        },
      ],
    },
    lauds: {
      label: "Morning Prayer (Lauds)",
      icon: "sun",
      sequence: [
        { type: "reading", role: "Psalm", ref: "Psalm 63:2–9", text: "O God, thou art my God; early will I seek thee: my soul thirsteth for thee, my flesh longeth for thee in a dry and thirsty land, where no water is.", truncated: true },
        { type: "reading", role: "Old Testament Canticle", ref: "Daniel 3:57–88, 56", text: "O all ye works of the Lord, bless ye the Lord: praise him, and magnify him for ever.", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 149", text: "Sing unto the Lord a new song, and his praise in the congregation of saints.", truncated: true },
        { type: "prayer", role: "Gospel Canticle", ref: "Benedictus", canticleKey: "benedictus", canticleSource: "CW-catholic", text: canticlePreview("benedictus", "CW"), truncated: true },
      ],
    },
    vespers: {
      label: "Evening Prayer (Vespers)",
      icon: "moon",
      sequence: [
        { type: "reading", role: "Psalm", ref: "Psalm 141:1–9", text: "Lord, I cry unto thee: make haste unto me; give ear unto my voice, when I cry unto thee.", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 142", text: "I cried unto the Lord with my voice; with my voice unto the Lord did I make my supplication.", truncated: true },
        { type: "reading", role: "New Testament Canticle", ref: "Philippians 2:6–11", text: "Who, being in the form of God, thought it not robbery to be equal with God: but made himself of no reputation.", truncated: true },
        { type: "prayer", role: "Gospel Canticle", ref: "Magnificat", canticleKey: "magnificat", canticleSource: "CW-catholic", text: canticlePreview("magnificat", "CW"), truncated: true },
      ],
    },
    compline: {
      label: "Night Prayer (Compline)",
      icon: "moon",
      sequence: [
        { type: "reading", role: "Psalm", ref: "Psalm 91", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.", truncated: true },
        { type: "reading", role: "Reading", ref: "Revelation 22:4–5", text: "And they shall see his face; and his name shall be in their foreheads.", truncated: true },
        { type: "prayer", role: "Gospel Canticle", ref: "Nunc dimittis", canticleKey: "nunc_dimittis", canticleSource: "CW-catholic", text: canticlePreview("nunc_dimittis", "CW"), truncated: true },
      ],
    },
    office_of_readings: {
      label: "Office of Readings",
      icon: "sun",
      sequence: [
        { type: "reading", role: "Psalm", ref: "Psalm 1", text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 2", text: "Why do the heathen rage, and the people imagine a vain thing?", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 3", text: "Lord, how are they increased that trouble me! Many are they that rise up against me.", truncated: true },
        { type: "reading", role: "Scripture Reading", ref: "Sirach 1:1–18", text: "All wisdom cometh from the Lord, and is with him for ever.", truncated: true },
      ],
    },
    daytime_prayer: {
      label: "Daytime Prayer",
      icon: "sun",
      sequence: [
        { type: "reading", role: "Psalm", ref: "Psalm 118:1–9", text: "O give thanks unto the Lord, for he is good: because his mercy endureth for ever.", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 118:10–18", text: "All nations compassed me about: but in the name of the Lord will I destroy them.", truncated: true },
        { type: "reading", role: "Psalm", ref: "Psalm 118:19–29", text: "Open to me the gates of righteousness: I will go into them, and I will praise the Lord.", truncated: true },
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
        },
        { type: "reading", role: "Epistle", ref: "1 Corinthians 9:2–12", text: "If I be not an apostle unto others, yet doubtless I am to you: for the seal of mine apostleship are ye in the Lord. Mine answer to them that do examine me is this.", truncated: true },
        { type: "reading", role: "Gospel", ref: "Matthew 18:23–35", text: "Therefore is the kingdom of heaven likened unto a certain king, which would take account of his servants. And when he had begun to reckon, one was brought unto him, which owed him ten thousand talents.", truncated: true },
        {
          type: "prayer",
          role: "Hymn to the Theotokos",
          ref: "Axion Estin",
          text: "It is truly meet to bless thee, O Theotokos, ever blessed and most pure, and the Mother of our God. More honorable than the Cherubim, and more glorious beyond compare than the Seraphim, thou who without corruption gavest birth to God the Word, true Theotokos, we magnify thee.",
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
const FEAST_LABELS = {
  christmas_day: "Christmas Day",
  stephen: "Stephen",
  john: "John",
  holy_innocents: "The Holy Innocents",
  naming_circumcision: "The Naming and Circumcision of Jesus",
  epiphany: "The Epiphany",
  monday_holy_week: "Monday of Holy Week",
  tuesday_holy_week: "Tuesday of Holy Week",
  wednesday_holy_week: "Wednesday of Holy Week",
  maundy_thursday: "Maundy Thursday",
  good_friday: "Good Friday",
  easter_eve: "Easter Eve",
  ascension_day: "Ascension Day",
};

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

  const fixedFeast = fixedFeastEucharistFor(date);
  if (fixedFeast) {
    const items = [
      { role: "First Reading", ref: displayRef(fixedFeast.ot) },
      { role: "Psalm", ref: displayRef(`Psalm ${fixedFeast.psalm}`) },
      { role: "Second Reading", ref: displayRef(fixedFeast.nt) },
      { role: "Gospel", ref: displayRef(fixedFeast.gospel) },
    ];
    return { label: FEAST_LABELS[fixedFeast.key] || "Principal Feast", items };
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
 * The real Catholic Sunday Mass reading citations for `date` (First
 * Reading, Psalm, Second Reading, Gospel), or null on a weekday (the
 * Roman weekday lectionary isn't wired yet - a follow-up alongside the
 * Anglican DEL work) or on any of catholicSundayTitleFor's known gaps.
 */
const CATHOLIC_SEASON_LABELS = {
  advent: "Advent Weekday",
  christmas: "Christmas Weekday",
  lent: "Lenten Weekday",
  easter: "Easter Weekday",
  ordinary: "Weekday in Ordinary Time",
};

/**
 * The real Catholic Mass reading citations for `date`: the Sunday
 * Lectionary (First Reading, Psalm, Second Reading, Gospel) on Sundays;
 * the weekday Lectionary (First Reading, Psalm, Gospel - no second
 * reading on ferial weekdays) otherwise; or, on a fixed Solemnity/Feast
 * that happens to fall on a weekday, that feast's own four-reading set.
 * Returns null on any of the underlying resolvers' known gaps.
 */
function catholicReadingItems(date) {
  if (date.getDay() === 0) {
    const result = catholicSundayReadingFor(date);
    if (!result || !result.readings) return null;
    const roles = ["First Reading", "Psalm", "Second Reading", "Gospel"];
    const items = result.readings
      .map((r, i) => ({ role: roles[i] || "Reading", ref: displayRef(splitCitation(r)[0] || r) }))
      .filter((r) => r.ref);
    return { label: result.title, items };
  }
  const result = catholicWeekdayReadingFor(date);
  if (!result || !result.readings) return null;
  const roles = result.readings.length === 4 ? ["First Reading", "Psalm", "Second Reading", "Gospel"] : ["First Reading", "Psalm", "Gospel"];
  const items = result.readings
    .map((r, i) => ({ role: roles[i] || "Reading", ref: displayRef(splitCitation(r)[0] || r) }))
    .filter((r) => r.ref);
  const label = result.title || CATHOLIC_SEASON_LABELS[result.season] || "Daily Mass";
  return { label, items };
}

/**
 * Builds the real Catholic Sunday Mass reading for `date`, keeping the
 * fixed prayer text (Penitential Act, Gloria, opening Collect placeholder)
 * from the demo entry and only replacing the readings themselves. Falls
 * back to the static demo entry on a weekday or any known gap.
 */
function buildCatholicMass(date, massForm) {
  const fallback = massForm === "traditional_latin" ? READINGS.Catholic.mass_tlm : READINGS.Catholic.mass;
  const firstReadingIndex = fallback.sequence.findIndex((i) => i.type === "reading");
  const lastReadingIndex = fallback.sequence.map((i) => i.type).lastIndexOf("reading");
  const openingItems = fallback.sequence.slice(0, firstReadingIndex);
  const closingItems = fallback.sequence.slice(lastReadingIndex + 1);
  const result = catholicReadingItems(date);
  if (!result) {
    const isSunday = date.getDay() === 0;
    const gapNote = isSunday ? "Sunday reading not covered yet" : "weekday reading not covered yet";
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (${gapNote})` };
  }
  return {
    label: `${result.label} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [...openingItems, ...result.items.map((item) => ({ type: "reading", role: item.role, ref: item.ref })), ...closingItems],
  };
}

/**
 * Builds the Orthodox "Daily Cycle" entry for `date`: the real Slavic-
 * tradition Sunday Epistle/Gospel citations swapped into the fixed
 * Trisagion/Troparion/Axion Estin liturgy text, the same way the Catholic
 * Mass builder keeps its opening/closing prayers and only swaps the
 * readings. Falls back to the static demo entry on weekdays and on any
 * Sunday outside the transcribed pdist range (both honest gaps, not
 * guesses -- see orthodoxSundayReadingFor). `calendarStyle` should match
 * whatever New/Old Calendar setting governs the rest of the Orthodox tab.
 */
function buildOrthodoxReadings(date, calendarStyle) {
  const fallback = READINGS.Orthodox.daily;
  const firstReadingIndex = fallback.sequence.findIndex((i) => i.type === "reading");
  const lastReadingIndex = fallback.sequence.map((i) => i.type).lastIndexOf("reading");
  const openingItems = fallback.sequence.slice(0, firstReadingIndex);
  const closingItems = fallback.sequence.slice(lastReadingIndex + 1);
  const result = orthodoxSundayReadingFor(date, calendarStyle);
  if (!result) {
    const isSunday = date.getDay() === 0;
    const gapNote = isSunday ? "Sunday reading not covered yet" : "weekday reading not covered yet";
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (${gapNote})` };
  }
  const readingItems = [
    { type: "reading", role: "Epistle", ref: displayRef(splitCitation(result.epistle)[0] || result.epistle) },
    { type: "reading", role: "Gospel", ref: displayRef(splitCitation(result.gospel)[0] || result.gospel) },
  ];
  return {
    label: `${fallback.label} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [...openingItems, ...readingItems, ...closingItems],
  };
}

/**
 * Builds Morning Prayer (Lauds) for `date` from the real Four-Week
 * Psalter: two Psalms and an Old Testament Canticle, plus the Benedictus
 * (reusing the Common Worship canticle text already built for Anglican,
 * since no public-domain Catholic-specific translation is bundled).
 * Falls back to the static demo entry on any of catholicPsalterWeekFor's
 * known gaps (the Christmas/Easter octaves, Ash Wednesday's short week,
 * Trinity Sunday, and Corpus Christi).
 */
function buildCatholicLauds(date) {
  const fallback = READINGS.Catholic.lauds;
  const result = catholicLaudsFor(date);
  const benedictus = { type: "prayer", role: "Gospel Canticle", ref: "Benedictus", canticleKey: "benedictus", canticleSource: "CW-catholic", text: canticlePreview("benedictus", "CW"), truncated: true };
  if (!result) {
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)` };
  }
  const roles = ["Psalm", "Old Testament Canticle", "Psalm"];
  const items = result.readings.map((ref, i) => ({ type: "reading", role: roles[i], ref: displayRef(splitCitation(ref)[0] || ref) }));
  return {
    label: `${fallback.label} · Week ${result.week}, ${result.weekday} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [...items, benedictus],
  };
}

/**
 * Builds Evening Prayer (Vespers) for `date` the same way as Lauds, using
 * two Psalms and a New Testament Canticle, plus the Magnificat.
 */
function buildCatholicVespers(date) {
  const fallback = READINGS.Catholic.vespers;
  const result = catholicVespersFor(date);
  const magnificat = { type: "prayer", role: "Gospel Canticle", ref: "Magnificat", canticleKey: "magnificat", canticleSource: "CW-catholic", text: canticlePreview("magnificat", "CW"), truncated: true };
  if (!result) {
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)` };
  }
  const roles = ["Psalm", "Psalm", "New Testament Canticle"];
  const items = result.readings.map((ref, i) => ({ type: "reading", role: roles[i], ref: displayRef(splitCitation(ref)[0] || ref) }));
  return {
    label: `${fallback.label} · Week ${result.week}, ${result.weekday.replace("SundayI", "Sunday (I)").replace("SundayII", "Sunday (II)")} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [...items, magnificat],
  };
}

/**
 * Builds Night Prayer (Compline) for `date`: its fixed one-week cycle
 * always resolves (no seasonal gaps), a Psalm (or two) and a brief
 * reading, plus the Nunc Dimittis.
 */
function buildCatholicCompline(date) {
  const fallback = READINGS.Catholic.compline;
  const result = catholicComplineFor(date);
  const nuncDimittis = { type: "prayer", role: "Gospel Canticle", ref: "Nunc dimittis", canticleKey: "nunc_dimittis", canticleSource: "CW-catholic", text: canticlePreview("nunc_dimittis", "CW"), truncated: true };
  if (!result) {
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)` };
  }
  const psalmItems = result.psalms.map((ref, i) => ({ type: "reading", role: i === 0 ? "Psalm" : null, ref: displayRef(splitCitation(ref)[0] || ref) }));
  const readingItem = { type: "reading", role: "Reading", ref: displayRef(splitCitation(result.reading)[0] || result.reading) };
  return {
    label: `${fallback.label} · ${result.weekday} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [...psalmItems, readingItem, nuncDimittis],
  };
}

/**
 * Builds the Office of Readings' Scripture portion for `date`: three
 * Psalms plus the real biblical First Reading citation. The patristic
 * Second Reading isn't included (a documented gap, not guessed at), so
 * this hour is intentionally shorter than a full Office of Readings.
 * Falls back to the static demo entry on any of the underlying
 * resolvers' known gaps.
 */
function buildCatholicOfficeOfReadings(date) {
  const fallback = READINGS.Catholic.office_of_readings;
  const result = catholicOfficeOfReadingsFor(date);
  if (!result) {
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)` };
  }
  const items = [];
  if (result.psalms) {
    result.psalms.forEach((ref, i) => items.push({ type: "reading", role: i === 0 ? "Psalm" : null, ref: displayRef(splitCitation(ref)[0] || ref) }));
  }
  items.push({ type: "reading", role: "Scripture Reading", ref: displayRef(splitCitation(result.reading)[0] || result.reading) });
  const weekLabel = result.week ? `Week ${result.week}, ${result.weekday}` : result.weekday;
  return {
    label: `${fallback.label} · ${weekLabel} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: items,
  };
}

/**
 * Builds Daytime Prayer (Terce/Sext/None) for `date`: three Psalms only
 * - this hour's own very brief reading isn't sourced (the same gap as
 * Lauds/Vespers' Brief Reading). Falls back to the static demo entry on
 * any of catholicPsalterWeekFor's known gaps.
 */
function buildCatholicDaytimePrayer(date) {
  const fallback = READINGS.Catholic.daytime_prayer;
  const result = catholicDaytimePrayerFor(date);
  if (!result) {
    return { ...fallback, label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)` };
  }
  const items = result.psalms.map((ref, i) => ({ type: "reading", role: i === 0 ? "Psalm" : null, ref: displayRef(splitCitation(ref)[0] || ref) }));
  return {
    label: `${fallback.label} · Week ${result.week}, ${result.weekday} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: items,
  };
}

const CW_PRAYER_OF_PREPARATION = {
  type: "prayer",
  role: "Collect",
  ref: "Prayer of Preparation",
  text: "Almighty God, to whom all hearts are open, all desires known, and from whom no secrets are hidden: cleanse the thoughts of our hearts by the inspiration of your Holy Spirit, that we may perfectly love you, and worthily magnify your holy name; through Christ our Lord. Amen.",
};

const CW_PRAYERS_OF_PENITENCE = {
  type: "prayer",
  role: "Confession",
  ref: "Prayers of Penitence",
  text: "Almighty God, our heavenly Father, we have sinned against you and against our neighbour in thought and word and deed, through negligence, through weakness, through our own deliberate fault. We are truly sorry and repent of all our sins. For the sake of your Son Jesus Christ, who died for us, forgive us all that is past and grant that we may serve you in newness of life to the glory of your name. Amen.",
};

/**
 * Builds today's REAL Anglican Eucharist readings — the Sunday Principal
 * Service (RCL) lectionary on Sundays, the Common Worship Daily
 * Eucharistic Lectionary (Table 6) on weekdays — replacing the fixed demo
 * citation. Falls back to the static demo entry when today's date falls
 * in one of the lectionary engine's known gaps (see lib/lectionary.js).
 */
function buildAnglicanEucharist(today, collectSource) {
  const fallback = READINGS.Anglican.eucharist;
  const isCW = collectSource === "CW";
  const collect = isCW ? CW_PRAYER_OF_PREPARATION : fallback.sequence[0]; // Prayer of Preparation (CW) or Collect for Purity (1662)
  const confession = isCW ? CW_PRAYERS_OF_PENITENCE : fallback.sequence[1]; // Prayers of Penitence (CW) or the 1662 Communion Confession
  const isSunday = today.getDay() === 0;

  const collectOfDay = isCW ? collectCWFor(today) : collect1662For(today);
  const collectItems = collectOfDay
    ? [{ type: "prayer", role: `Collect of the Day · ${isCW ? "CW" : "1662"}`, ref: collectOfDay.label, text: collectOfDay.text }]
    : [];

  const result = anglicanReadingItems(today);
  if (!result) {
    const gapNote = isSunday ? "Sunday reading not covered yet" : "weekday reading not covered yet";
    return { ...fallback, label: `${shortDate(today)} · demo text (${gapNote})`, sequence: [collect, confession, ...collectItems, ...fallback.sequence.slice(2)] };
  }
  const postCommunion = collectSource === "CW" ? postCommunionCWFor(today) : null;
  const postCommunionItems = postCommunion
    ? [{ type: "prayer", role: "Post Communion · CW", ref: postCommunion.label, text: postCommunion.text }]
    : [];
  return {
    label: `${result.label} · ${shortDate(today)}`,
    icon: "sun",
    sequence: [collect, confession, ...collectItems, ...result.items.map((item) => ({ type: "reading", role: item.role, ref: item.ref })), ...postCommunionItems],
  };
}

/**
 * Builds the real Anglican Office (Morning/Evening Prayer) reading for
 * `date` from Table 2, keeping the fixed prayer/canticle/collect text as
 * before and only replacing the two demo Scripture readings. Falls back
 * to the static demo entry on any of officeReadingFor's known gaps.
 */
/** Splits a raw Table 3/4 psalm citation into individual "Psalm N[:V-V]"
 * references, each independently tappable via the passage-lookup modal.
 * "50, 54" -> two refs; "119.1-32" -> one ranged ref; "51 or 102" -> only
 * the first alternative (an "or" means pick one, not read both), whether
 * that "or" sits at the top level or inside a bracketed note like
 * "105* (or 103)"; "18.31-end" -> kept as "18:31-end", which
 * parseReference/getPassage now resolve against the real psalm text,
 * reading from verse 31 through whatever its actual last verse turns out
 * to be; a trailing "*" (Common Worship's "may be read in a shortened
 * form" marker) is stripped, as it isn't part of the reference itself;
 * bracketed optional psalms like "(63*)" are still included, just with
 * the brackets and asterisk stripped for display. */
function splitPsalmCitation(raw) {
  if (!raw) return [];
  // Split on commas first — each comma-separated piece is its own psalm
  // reference, and may independently carry a bracketed/bare "or" or an
  // asterisk, so those need handling per piece rather than once up front.
  const segments = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return segments
    .map((seg) => {
      let clean = seg.replace(/\(\s*or\s+[^)]*\)/gi, "").trim(); // "(or 103)"
      clean = clean.split(/\s+or\s+/i)[0]; // bare "51 or 102"
      clean = clean.replace(/[()*]/g, "").trim();
      if (!clean) return null;
      clean = clean.replace(/\./g, ":");
      return `Psalm ${clean}`;
    })
    .filter(Boolean);
}

function buildAnglicanOffice(date, service, collectSource) {
  const fallback = READINGS.Anglican[service];
  const byRole = (role, ref) => fallback.sequence.find((i) => i.role === role && (!ref || i.ref === ref));
  const confession = fallback.sequence[0];
  const peaceCollect = byRole("Collect", "Collect for Peace");
  const finalCollect = fallback.sequence[fallback.sequence.length - 1];

  // AM: Venite (or the Easter Anthems in Easter Week) before the readings,
  // Te Deum after the OT lesson, Benedictus after the NT lesson.
  // PM: (CW only) Phos Hilaron before the readings, Magnificat after the OT
  // lesson, Nunc Dimittis after the NT lesson. The 1662 BCP office has no
  // opening canticle at Evening Prayer.
  // Common Worship replaces the after-OT canticle (Te Deum/Magnificat) with
  // a seasonal alternative - see seasonalCanticleKey for the season mapping.
  const source = collectSource === "CW" ? "CW" : "1662";
  const firstCanticleKey = service === "am" ? morningFirstCanticleKey(date) : eveningFirstCanticleKey(source);
  let secondCanticleKey = service === "am" ? "te_deum" : "magnificat";
  if (source === "CW") {
    const { seasons } = liturgicalYearData("Anglican", "Gregorian", date);
    const seasonKey = seasonAt(seasons, date)?.key;
    secondCanticleKey = seasonalCanticleKey(date, service, seasonKey) || secondCanticleKey;
  }
  const thirdCanticleKey = service === "am" ? "benedictus" : "nunc_dimittis";

  function canticleItem(key, fallbackItem) {
    const preview = canticlePreview(key, source);
    if (!preview) return fallbackItem;
    const label = CANTICLE_DISPLAY_NAMES[source]?.[key] || fallbackItem?.ref || key;
    return { type: "prayer", role: "Canticle", ref: label, canticleKey: key, canticleSource: source, text: preview, truncated: true };
  }

  const collectOfDay = source === "CW" ? collectCWFor(date) : collect1662For(date);
  const collectOfDayItems = collectOfDay
    ? [{ type: "prayer", role: `Collect of the Day · ${source}`, ref: collectOfDay.label, text: collectOfDay.text }]
    : [];
  const peaceCollectItems = peaceCollect ? [peaceCollect] : [];

  // Common Worship Sundays use a completely separate lectionary (Second/
  // Third Service) from the weekday Table 2 data - check that first when
  // it applies, before falling back to the regular weekday resolution.
  const isSunday = date.getDay() === 0;
  const cwSunday = source === "CW" && isSunday ? secondThirdServiceFor(date, service) : null;

  let result = cwSunday || officeReadingFor(date, service);
  const psalmResult = cwSunday ? { citation: cwSunday.psalm, week: cwSunday.title } : psalmFor(date, service);
  // 1662 BCP Sundays have their own First (Old Testament) Lesson, distinct
  // from the weekday table this office otherwise borrows for 1662 - only
  // the First Lesson is Sunday-specific in the BCP system, so this
  // replaces just the OT reading, leaving the NT reading/psalm as-is.
  if (source === "1662" && isSunday) {
    const bcpSunday = bcpSundayFirstLessonFor(date, service);
    if (bcpSunday) result = { ...result, ot: bcpSunday.ot, week: bcpSunday.title };
  }
  const fallbackReadings = fallback.sequence.filter((i) => i.type === "reading");

  if (!result?.ot && !result?.nt && !psalmResult) {
    const opening = firstCanticleKey ? [canticleItem(firstCanticleKey, byRole("Canticle"))] : [];
    const afterOT = [canticleItem(secondCanticleKey, byRole("Canticle", service === "am" ? "Te Deum Laudamus" : "Magnificat"))];
    const afterNT = [canticleItem(thirdCanticleKey, byRole("Canticle", service === "am" ? "Benedictus" : "Nunc dimittis"))];
    return {
      ...fallback,
      label: `${fallback.label} · ${shortDate(date)} · demo text (not covered yet)`,
      sequence: [
        confession,
        ...opening,
        ...(fallbackReadings[0] ? [fallbackReadings[0]] : []),
        ...afterOT,
        ...(fallbackReadings[1] ? [fallbackReadings[1]] : []),
        ...afterNT,
        ...collectOfDayItems,
        ...peaceCollectItems,
        finalCollect,
      ],
    };
  }

  const psalmRefs = psalmResult ? splitPsalmCitation(psalmResult.citation) : [];
  const psalmItems = psalmRefs.map((ref, i) => ({ type: "reading", role: i === 0 ? "Psalm" : null, ref: displayRef(ref) }));
  const otItem = result?.ot ? { type: "reading", role: "Old Testament", ref: displayRef(splitCitation(result.ot)[0] || result.ot) } : null;
  const ntItem = result?.nt ? { type: "reading", role: "New Testament", ref: displayRef(splitCitation(result.nt)[0] || result.nt) } : null;

  const opening = firstCanticleKey ? [canticleItem(firstCanticleKey, byRole("Canticle"))] : [];
  const afterOT = [canticleItem(secondCanticleKey, byRole("Canticle", service === "am" ? "Te Deum Laudamus" : "Magnificat"))];
  const afterNT = [canticleItem(thirdCanticleKey, byRole("Canticle", service === "am" ? "Benedictus" : "Nunc dimittis"))];

  const labelWeek = result?.week || psalmResult?.week || "";
  return {
    label: `${fallback.label} · ${labelWeek}, ${WEEKDAY_NAME[date.getDay()]} · ${shortDate(date)}`,
    icon: fallback.icon,
    sequence: [
      confession,
      ...opening,
      ...psalmItems,
      ...(otItem ? [otItem] : []),
      ...afterOT,
      ...(ntItem ? [ntItem] : []),
      ...afterNT,
      ...collectOfDayItems,
      ...peaceCollectItems,
      finalCollect,
    ],
  };
}

// Returns the first scripture reading (skipping opening prayers) so the
// Today teaser and day-detail sheet show a citation, not a prayer title.
function firstReadingRef(tradition) {
  const data = READINGS[tradition];
  const sequence = data.kind === "office" ? data.am.sequence : data.kind === "catholic" ? data.mass.sequence : data.kind === "mass" ? data.mass.sequence : data.daily.sequence;
  const reading = sequence.find((item) => item.type === "reading");
  return reading ? reading.ref : sequence[0].ref;
}

// Picks Morning Prayer through the afternoon, Evening Prayer once evening
// actually starts (5pm), or the Eucharistic lectionary on Sundays regardless
// of time — the same rule ReadingsView (the Prayer tab) uses to choose its
// default segment, reused here so the Today teaser previews whichever
// reading tapping through will actually land on.
//
// `date` may be a plain calendar date (e.g. the app's `today` state, which
// is midnight-truncated and so carries no real time-of-day) - whenever the
// represented day IS today, the AM/PM cutoff always checks the actual
// current wall-clock time rather than whatever hour happens to be on the
// `date` object passed in, so this gives the same answer regardless of
// which "today" value a caller has on hand.
function autoOfficeSegment(date) {
  const d = date || new Date();
  if (d.getDay() === 0) return "eucharist";
  const isLiveToday = !date || dateOnly(date).getTime() === dateOnly(new Date()).getTime();
  if (!isLiveToday) return "am";
  return new Date().getHours() < 17 ? "am" : "pm";
}

// The real Old/New Testament Office citation for `date` (Old Testament
// preferred, New Testament as a fallback) — the same cleaning
// (splitCitation + displayRef) buildAnglicanOffice applies to its own
// items, factored out so the Today teaser can show a single representative
// reading without needing the whole prayer/canticle/collect sequence.
function anglicanOfficeScriptureRef(date, service) {
  const result = officeReadingFor(date, service);
  if (!result) return null;
  const ot = result.ot ? displayRef(splitCitation(result.ot)[0] || result.ot) : null;
  const nt = result.nt ? displayRef(splitCitation(result.nt)[0] || result.nt) : null;
  return ot || nt || null;
}

/**
 * The real Psalm/Old Testament/New Testament reading list for the Anglican
 * Daily Office (Morning or Evening Prayer) on `date`, as { role, ref }
 * items — the same shape anglicanReadingItems returns for the Eucharist, so
 * dayReadingItems can show whichever service is actually being previewed
 * without the day-detail sheet needing to know the difference. Returns
 * null on any of the Office engine's known gaps (see lib/lectionary.js).
 */
function anglicanOfficeItems(date, service) {
  const result = officeReadingFor(date, service);
  const psalmResult = psalmFor(date, service);
  if (!result && !psalmResult) return null;

  const items = [];
  const psalmRefs = psalmResult ? splitPsalmCitation(psalmResult.citation) : [];
  psalmRefs.forEach((ref, i) => {
    items.push({ role: i === 0 ? "Psalm" : null, ref: displayRef(ref) });
  });
  if (result?.ot) items.push({ role: "Old Testament", ref: displayRef(splitCitation(result.ot)[0] || result.ot) });
  if (result?.nt) items.push({ role: "New Testament", ref: displayRef(splitCitation(result.nt)[0] || result.nt) });
  if (!items.length) return null;

  const labelWeek = result?.week || psalmResult?.week || "";
  const serviceLabel = service === "am" ? "Morning Prayer" : "Evening Prayer";
  return { label: `${serviceLabel} · ${labelWeek}, ${WEEKDAY_NAME[date.getDay()]}`, items };
}

/**
 * The real Catholic Lauds/Vespers/Compline citations for `date`, in the
 * same { label, items } shape anglicanOfficeItems returns, so the Today
 * teaser and day-detail sheet can show any tradition's Office without
 * needing to know the difference. `segment` is "lauds", "vespers", or
 * "compline"; returns null on any of the underlying resolvers' known
 * gaps (Compline itself has none - see catholicComplineFor).
 */
function catholicOfficeItems(date, segment) {
  if (segment === "compline") {
    const result = catholicComplineFor(date);
    if (!result) return null;
    const items = result.psalms.map((ref, i) => ({ role: i === 0 ? "Psalm" : null, ref: displayRef(splitCitation(ref)[0] || ref) }));
    items.push({ role: "Reading", ref: displayRef(splitCitation(result.reading)[0] || result.reading) });
    return { label: `Night Prayer (Compline) · ${result.weekday}`, items };
  }
  const result = segment === "vespers" ? catholicVespersFor(date) : catholicLaudsFor(date);
  if (!result) return null;
  const roles = segment === "vespers" ? ["Psalm", "Psalm", "New Testament Canticle"] : ["Psalm", "Old Testament Canticle", "Psalm"];
  const items = result.readings.map((ref, i) => ({ role: roles[i], ref: displayRef(splitCitation(ref)[0] || ref) }));
  const label = segment === "vespers" ? "Evening Prayer (Vespers)" : "Morning Prayer (Lauds)";
  return { label: `${label} · Week ${result.week}, ${WEEKDAY_NAME[date.getDay()]}`, items };
}

/**
 * The single reading citation to preview on the Today tab: the Sunday
 * Eucharist/Mass reading on Sundays (as before), but the real Morning or
 * Evening Prayer/Lauds/Vespers reading on weekdays — matching whichever
 * segment ReadingsView's own autoOfficeSegment/autoCatholicSegment will
 * actually open to, so the preview never shows a different reading than
 * tapping through reveals.
 * Falls back to the Eucharist/Mass/demo reading on any of the Office
 * engine's known gaps, or for traditions without a real per-date
 * lectionary yet.
 */
function todayReadingRef(tradition, today, calendarStyle) {
  if (tradition === "Anglican") {
    const segment = autoOfficeSegment(today);
    if (segment !== "eucharist") {
      const ref = anglicanOfficeScriptureRef(today, segment);
      if (ref) return ref;
    }
  }
  if (tradition === "Catholic") {
    const segment = autoCatholicSegment(today);
    if (segment !== "mass") {
      const office = catholicOfficeItems(today, segment);
      if (office?.items[0]?.ref) return office.items[0].ref;
    }
  }
  return dayReadingItems(tradition, today, calendarStyle)[0]?.ref;
}

/**
 * The reading list to show for `date` in compact contexts (the day-detail
 * sheet from Grid/Wheel): the real Sunday RCL or weekday DEL Eucharist
 * readings on Sundays, but the real Morning or Evening Prayer Office
 * reading list on weekdays — matching whichever segment ReadingsView's own
 * autoOfficeSegment would open to for that date, so this preview never
 * shows a different service than the Prayer tab would for the same day.
 * Falls back to the Eucharist reading on any of the Office engine's known
 * gaps, and for Orthodox to the real Slavic Sunday Epistle/Gospel where
 * covered (weekdays still fall back to the single fixed demo citation --
 * not wired to a real per-date lectionary yet), and to the single fixed
 * demo citation for any date that falls in a known gap for both services.
 */
function dayReadingItems(tradition, date, calendarStyle) {
  if (tradition === "Anglican") {
    const segment = autoOfficeSegment(date);
    if (segment !== "eucharist") {
      const office = anglicanOfficeItems(date, segment);
      if (office) return office.items;
    }
    const result = anglicanReadingItems(date);
    if (result) return result.items;
  }
  if (tradition === "Catholic") {
    const segment = autoCatholicSegment(date);
    if (segment !== "mass") {
      const office = catholicOfficeItems(date, segment);
      if (office) return office.items;
    }
    const result = catholicReadingItems(date);
    if (result) return result.items;
  }
  if (tradition === "Orthodox") {
    const result = orthodoxSundayReadingFor(date, calendarStyle);
    if (result) {
      return [
        { role: "Epistle", ref: displayRef(splitCitation(result.epistle)[0] || result.epistle) },
        { role: "Gospel", ref: displayRef(splitCitation(result.gospel)[0] || result.gospel) },
      ];
    }
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
  const [collectSource, setCollectSource] = usePersistedState("officium-collect-source", "1662");
  const [massForm, setMassForm] = usePersistedState("officium-mass-form", "novus_ordo");
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
  // One-time first-run tradition prompt. Shown once consent is resolved (so
  // it never stacks with the consent banner in the same overlay layer), then
  // never again regardless of what's picked — including "skip".
  const [onboardingSeen, setOnboardingSeen] = usePersistedState("officium-onboarding-seen", false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  // "auto" follows the tradition -> WEB edition mapping in DEFAULT_WEB_VERSION;
  // otherwise pinned to one of the three bundled editions regardless of tradition.
  const [webBibleVersion, setWebBibleVersion] = usePersistedState("officium-bible-version", "auto");
  // BibleGateway.com version code preselected on the "Open on BibleGateway" link.
  const [bibleGatewayVersion, setBibleGatewayVersion] = usePersistedState("officium-biblegateway-version", "NRSVA");
  const [scriptureRef, setScriptureRef] = useState(null); // reference string, or null when the modal is closed
  const [openCanticle, setOpenCanticle] = useState(null); // {key, source} or null when the modal is closed
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
          onOpenCanticle={setOpenCanticle}
          collectSource={collectSource}
          massForm={massForm}
          orthodoxCalendar={calendar}
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
      <div className="flex-1 flex items-center justify-center lg:items-stretch lg:justify-stretch lg:ml-[280px] min-w-0">
        <div
          className="relative w-full min-w-0 max-w-[480px] lg:max-w-none flex flex-col h-[100dvh] sm:h-[calc(100dvh-3rem)] lg:h-[100dvh] sm:my-6 sm:rounded-[2rem] sm:shadow-2xl lg:my-0 lg:rounded-none lg:shadow-none overflow-hidden lg:overflow-visible"
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
              the header and tab bar along with it). overflow-x-hidden + min-w-0
              stop a wide child (e.g. a horizontally-scrolling tab row) from
              expanding this flex item and dragging the whole page sideways -
              overflow-x-auto on that child then scrolls just itself, contained. */}
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-5 pb-4 lg:px-12 lg:py-10 no-scrollbar">
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
              collectSource={collectSource}
              onChangeCollectSource={setCollectSource}
              massForm={massForm}
              onChangeMassForm={setMassForm}
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

          {/* 1662/CW canticle sheet — reachable from any canticle in the Anglican office */}
          {openCanticle && (
            <CanticleModal
              key={`${openCanticle.source}:${openCanticle.key}`}
              canticleKey={openCanticle.key}
              source={openCanticle.source}
              season={season}
              onClose={() => setOpenCanticle(null)}
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

      {/* First-run tradition prompt — only after consent is resolved, only once ever. */}
      {cookieConsent !== null && !onboardingSeen && (
        <TraditionWelcome
          season={season}
          onPick={(t) => {
            setTradition(t);
            setOnboardingSeen(true);
          }}
          onSkip={() => setOnboardingSeen(true)}
        />
      )}

      <InstallToast active={cookieConsent !== null && onboardingSeen} />
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

// One-time first-run prompt: just the tradition choice, nothing else from
// Settings. Deliberately lighter than SettingsSheet — someone's very first
// screen shouldn't be the full options panel. "Skip" (or tapping outside,
// or the X) leaves the Catholic default in place but still marks it seen,
// since re-showing this on every visit would be worse than a wrong default.
function TraditionWelcome({ season, onPick, onSkip }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  return (
    <SheetOverlay onClose={onSkip}>
      <p className="text-[17px] font-serif mb-1 text-center" style={{ color: theme.text }}>
        Welcome to Officium
      </p>
      <p className="text-[13px] mb-5 text-center" style={{ color: alpha(theme.text, 0.6) }}>
        Which tradition would you like to follow? You can change this anytime in Settings.
      </p>
      <div className="space-y-2">
        {TRADITIONS.map((t) => (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px]"
            style={{
              backgroundColor: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
            }}
          >
            {t}
            <span style={{ color: accent }}>→</span>
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="w-full text-center text-[12.5px] mt-4"
        style={{ color: alpha(theme.text, 0.45) }}
      >
        I'll choose later
      </button>
    </SheetOverlay>
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
  collectSource,
  onChangeCollectSource,
  massForm,
  onChangeMassForm,
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

      {draft === "Anglican" && (
        <>
          <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
            Daily Prayer Text
          </p>
          <div className="space-y-2 mb-2">
            {[
              { key: "1662", label: "1662 Book of Common Prayer", sub: "Traditional language" },
              { key: "CW", label: "Common Worship", sub: "Contemporary language" },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => onChangeCollectSource(o.key)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                style={{
                  backgroundColor: collectSource === o.key ? alpha(season.color, 0.2) : theme.bg,
                  border: collectSource === o.key ? `1px solid ${accent}` : "1px solid transparent",
                }}
              >
                <div>
                  <p className="text-[13.5px]" style={{ color: theme.text }}>
                    {o.label}
                  </p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: alpha(theme.text, 0.4) }}>
                    {o.sub}
                  </p>
                </div>
                {collectSource === o.key && <span style={{ color: accent }}>●</span>}
              </button>
            ))}
          </div>
          <p className="text-[11px] mb-5" style={{ color: alpha(theme.text, 0.33) }}>
            Common Worship text © The Archbishops' Council 2000, published by Church House Publishing.
          </p>
        </>
      )}

      {draft === "Catholic" && (
        <>
          <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
            Mass Text
          </p>
          <div className="space-y-2 mb-2">
            {[
              { key: "novus_ordo", label: "Novus Ordo", sub: "Current Order of Mass" },
              { key: "traditional_latin", label: "Traditional Latin (1962)", sub: "Tridentine Mass, pre-Vatican II" },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => onChangeMassForm(o.key)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                style={{
                  backgroundColor: massForm === o.key ? alpha(season.color, 0.2) : theme.bg,
                  border: massForm === o.key ? `1px solid ${accent}` : "1px solid transparent",
                }}
              >
                <div>
                  <p className="text-[13.5px]" style={{ color: theme.text }}>
                    {o.label}
                  </p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: alpha(theme.text, 0.4) }}>
                    {o.sub}
                  </p>
                </div>
                {massForm === o.key && <span style={{ color: accent }}>●</span>}
              </button>
            ))}
          </div>
          <p className="text-[11px] mb-5" style={{ color: alpha(theme.text, 0.33) }}>
            Scripture readings are the same either way, from the current Lectionary. Traditional Latin text
            adapted from a 1921 Missal (public domain) and rendered in period English elsewhere.
          </p>
        </>
      )}

      <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: alpha(theme.text, 0.4) }}>
        Appearance
      </p>
      <div className="flex gap-2 mb-5">
        {[
          { key: "system", label: "System", icon: Monitor },
          { key: "light", label: "Light", icon: Sun },
          { key: "dark", label: "Dark", icon: Moon },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => theme.setMode(o.key)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-[12px]"
            style={{
              backgroundColor: theme.mode === o.key ? alpha(season.color, 0.2) : theme.bg,
              color: theme.text,
              border: theme.mode === o.key ? `1px solid ${accent}` : "1px solid transparent",
            }}
          >
            <o.icon size={16} color={theme.mode === o.key ? accent : alpha(theme.text, 0.6)} />
            {o.label}
          </button>
        ))}
      </div>

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
      <span className="text-[11px] mx-2" style={{ color: alpha(theme.text, 0.25) }}>
        ·
      </span>
      <a
        href="https://github.com/MrLewk/liturgical-calendar-app/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] underline decoration-dotted"
        style={{ color: alpha(theme.text, 0.4) }}
      >
        Report a bug
      </a>
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
            {state.passage.verses.map((v, i) =>
              v.gap ? (
                <span key={`gap-${i}`} className="mx-1.5" style={{ color: alpha(theme.text, 0.33) }}>
                  · · ·
                </span>
              ) : (
                <span key={`${v.chapter}-${v.verse}`}>
                  <sup className="mr-0.5" style={{ color: alpha(theme.text, 0.4) }}>
                    {v.verse}
                  </sup>
                  {v.text}{" "}
                </span>
              )
            )}
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

const CANTICLE_DISPLAY_NAMES = {
  "1662": {
    venite: "Venite, exultemus Domino",
    easter_anthems: "The Easter Anthems",
    te_deum: "Te Deum Laudamus",
    benedicite: "Benedicite, omnia opera",
    benedictus: "Benedictus",
    jubilate: "Jubilate Deo",
    magnificat: "Magnificat",
    cantate_domino: "Cantate Domino",
    nunc_dimittis: "Nunc dimittis",
    deus_misereatur: "Deus misereatur",
  },
  CW: {
    benedictus: "Benedictus (The Song of Zechariah)",
    magnificat: "Magnificat (The Song of Mary)",
    nunc_dimittis: "Nunc dimittis (The Song of Simeon)",
    te_deum: "Te Deum Laudamus",
    song_of_christs_glory: "The Song of Christ's Glory",
    great_and_wonderful: "Great and Wonderful",
    bless_the_lord: "Bless the Lord",
    saviour_of_the_world: "Saviour of the World",
    venite: "Venite - a Song of Triumph",
    easter_anthems: "The Easter Anthems",
    jubilate: "Jubilate - a Song of Joy",
    phos_hilaron: "Phos hilaron - a Song of the Light",
    psalm_141_verses: "Verses from Psalm 141",
    psalm_104_verses: "Verses from Psalm 104",
    wilderness_advent: "A Song of the Wilderness",
    messiah_christmas: "A Song of the Messiah",
    new_jerusalem_epiphany: "A Song of the New Jerusalem",
    humility_lent: "A Song of Humility",
    moses_miriam_easter: "The Song of Moses and Miriam",
    ezekiel_pentecost: "A Song of Ezekiel",
    david_ordinary: "A Song of David",
    spirit_advent: "A Song of the Spirit",
    redemption_christmas: "A Song of Redemption",
    praise_epiphany: "A Song of Praise",
    servant_lent: "A Song of Christ the Servant",
    faith_easter: "A Song of Faith",
    gods_children_pentecost: "A Song of God's Children",
    lamb_ordinary: "A Song of the Lamb",
  },
};

function CanticleModal({ canticleKey, source = "1662", season, onClose }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const isCatholic = source === "CW-catholic";
  const isCW = source === "CW" || isCatholic;
  const canticle = (isCW ? canticlesCWRaw : canticles1662Raw)[canticleKey];
  const sourceLabel = isCatholic ? "Liturgy of the Hours" : isCW ? "Common Worship" : "1662 Book of Common Prayer";
  const attribution = isCatholic
    ? "Contemporary-English translation text (source: Common Worship, © The Archbishops' Council 2000), used here in the absence of a bundled public-domain Catholic translation."
    : isCW
      ? "Common Worship, © The Archbishops' Council 2000."
      : "Book of Common Prayer (1662), public domain.";

  return (
    <SheetOverlay onClose={onClose}>
      <p className="text-[11px] uppercase tracking-[0.2em] mb-1.5" style={{ color: alpha(theme.text, 0.4) }}>
        Canticle · {sourceLabel}
      </p>
      <h2 className="text-[19px] lg:text-[24px] mb-4" style={{ fontFamily: "'Fraunces', serif", color: theme.text }}>
        {CANTICLE_DISPLAY_NAMES[isCW ? "CW" : "1662"][canticleKey] || canticleKey}
      </h2>

      {!canticle && (
        <p className="text-[13px] mb-4" style={{ color: alpha(theme.text, 0.5) }}>
          That canticle's full text isn't available yet.
        </p>
      )}
      {canticle && (
        <>
          <div className="text-[14px] lg:text-[16.5px] leading-relaxed mb-1.5" style={{ color: alpha(theme.text, 0.85) }}>
            {canticle.verses.map((v, i) => (
              <p key={i} className="mb-2.5">
                {v.number && (
                  <sup className="mr-1" style={{ color: accent }}>
                    {v.number}
                  </sup>
                )}
                {v.a}
                {v.b ? <> {v.b}</> : null}
              </p>
            ))}
          </div>
          <p className="text-[10.5px] mb-5" style={{ color: alpha(theme.text, 0.33) }}>
            {canticle.citation ? `${canticle.citation} · ` : ""}
            {attribution}
          </p>
        </>
      )}

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
  const readingItems = dayReadingItems(tradition, date, calendar);

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
  const readingRef = todayReadingRef(tradition, today, calendar);
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
          // Deliberately avoid mixing the `border` shorthand with a
          // `borderBottom` longhand override in the same style object:
          // React diffs style props individually on rerender, and that
          // combination can silently drop the longhand's value when a grid
          // cell's DOM node is reused for a different date (e.g. navigating
          // between months) — see React's own dev-mode warning about this.
          // Using only longhand properties for every side avoids the bug.
          const sideColor = isToday
            ? seasonAccent(withDisplay(daySeason, date, tradition, seasons), theme.mode)
            : feast
            ? alpha(feast.color, 0.5)
            : "transparent";
          const bottomColor = isToday
            ? seasonAccent(withDisplay(daySeason, date, tradition, seasons), theme.mode)
            : dayColor;
          const bottomWidth = isToday ? "1px" : "3px";
          return (
            <button
              key={d}
              onClick={() => onSelectDay(date)}
              className="aspect-square rounded-lg lg:rounded-xl flex items-center justify-center text-[12px] lg:text-[16px] relative"
              style={{
                backgroundColor: isToday ? daySeason.color : theme.surface,
                color: isToday ? "#FFFFFF" : alpha(theme.text, 0.8),
                borderTopWidth: "1px",
                borderTopStyle: "solid",
                borderTopColor: sideColor,
                borderRightWidth: "1px",
                borderRightStyle: "solid",
                borderRightColor: sideColor,
                borderLeftWidth: "1px",
                borderLeftStyle: "solid",
                borderLeftColor: sideColor,
                borderBottomWidth: bottomWidth,
                borderBottomStyle: "solid",
                borderBottomColor: bottomColor,
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

function autoCatholicSegment(date) {
  const d = date || new Date();
  if (d.getDay() === 0) return "mass";
  const isLiveToday = !date || dateOnly(date).getTime() === dateOnly(new Date()).getTime();
  if (!isLiveToday) return "lauds";
  const hour = new Date().getHours();
  if (hour < 17) return "lauds";
  if (hour < 21) return "vespers";
  return "compline";
}

function ReadingsView({ tradition, season, today, viewDate, onBackToToday, onOpenPassage, onOpenCanticle, collectSource, massForm, orthodoxCalendar }) {
  const theme = useTheme();
  const accent = seasonAccent(season, theme.mode);
  const effectiveDate = viewDate || today;
  const isViewingOtherDay = !!viewDate;
  const anglicanEucharist = useMemo(() => (tradition === "Anglican" ? buildAnglicanEucharist(effectiveDate, collectSource) : null), [tradition, effectiveDate, collectSource]);
  const anglicanAm = useMemo(() => (tradition === "Anglican" ? buildAnglicanOffice(effectiveDate, "am", collectSource) : null), [tradition, effectiveDate, collectSource]);
  const anglicanPm = useMemo(() => (tradition === "Anglican" ? buildAnglicanOffice(effectiveDate, "pm", collectSource) : null), [tradition, effectiveDate, collectSource]);
  const catholicMass = useMemo(() => (tradition === "Catholic" ? buildCatholicMass(effectiveDate, massForm) : null), [tradition, effectiveDate, massForm]);
  const catholicLauds = useMemo(() => (tradition === "Catholic" ? buildCatholicLauds(effectiveDate) : null), [tradition, effectiveDate]);
  const catholicVespers = useMemo(() => (tradition === "Catholic" ? buildCatholicVespers(effectiveDate) : null), [tradition, effectiveDate]);
  const catholicCompline = useMemo(() => (tradition === "Catholic" ? buildCatholicCompline(effectiveDate) : null), [tradition, effectiveDate]);
  const catholicOfficeOfReadings = useMemo(() => (tradition === "Catholic" ? buildCatholicOfficeOfReadings(effectiveDate) : null), [tradition, effectiveDate]);
  const catholicDaytimePrayer = useMemo(() => (tradition === "Catholic" ? buildCatholicDaytimePrayer(effectiveDate) : null), [tradition, effectiveDate]);
  const orthodoxDaily = useMemo(
    () => (tradition === "Orthodox" ? buildOrthodoxReadings(effectiveDate, orthodoxCalendar) : null),
    [tradition, effectiveDate, orthodoxCalendar]
  );
  const data = useMemo(() => {
    if (tradition === "Anglican") return { ...READINGS.Anglican, am: anglicanAm, pm: anglicanPm, eucharist: anglicanEucharist };
    if (tradition === "Catholic")
      return {
        ...READINGS.Catholic,
        mass: catholicMass,
        lauds: catholicLauds,
        vespers: catholicVespers,
        compline: catholicCompline,
        office_of_readings: catholicOfficeOfReadings,
        daytime_prayer: catholicDaytimePrayer,
      };
    if (tradition === "Orthodox") return { ...READINGS.Orthodox, daily: orthodoxDaily };
    return READINGS[tradition];
  }, [
    tradition,
    anglicanAm,
    anglicanPm,
    anglicanEucharist,
    catholicMass,
    catholicLauds,
    catholicVespers,
    catholicCompline,
    catholicOfficeOfReadings,
    catholicDaytimePrayer,
    orthodoxDaily,
  ]);
  const defaultSegment = data.kind === "office" ? autoOfficeSegment(viewDate) : data.kind === "catholic" ? autoCatholicSegment(viewDate) : data.kind === "mass" ? "mass" : "daily";
  const [segment, setSegment] = useState(defaultSegment);

  useEffect(() => {
    setSegment(defaultSegment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition, viewDate]);

  // Guard against a stale segment from the previous tradition being used
  // on the render that happens before the effect above has run.
  const validSegment =
    data.kind === "office" && ["am", "pm", "eucharist"].includes(segment)
      ? segment
      : data.kind === "catholic" && ["mass", "lauds", "vespers", "compline", "office_of_readings", "daytime_prayer"].includes(segment)
        ? segment
        : defaultSegment;

  // Reset to a valid segment when tradition changes underneath us
  const segments =
    data.kind === "office"
      ? [
          { key: "am", label: "Morning", icon: Sun },
          { key: "pm", label: "Evening", icon: Moon },
          { key: "eucharist", label: "Eucharist", icon: BookOpen },
        ]
      : data.kind === "catholic"
        ? [
            { key: "office_of_readings", label: "Office", icon: BookOpen },
            { key: "lauds", label: "Lauds", icon: Sun },
            { key: "daytime_prayer", label: "Daytime", icon: Sun },
            { key: "mass", label: "Mass", icon: BookOpen },
            { key: "vespers", label: "Vespers", icon: Moon },
            { key: "compline", label: "Compline", icon: Moon },
          ]
        : null;
  const activeData = data.kind === "office" ? data[validSegment] : data.kind === "catholic" ? data[validSegment] : data.kind === "mass" ? data.mass : data.daily;

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
        <div className={`flex gap-1.5 lg:gap-2.5 mb-4 lg:mb-6 mt-3 lg:mt-5 ${segments.length > 4 ? "overflow-x-auto" : ""}`}>
          {segments.map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className={`${segments.length > 4 ? "flex-shrink-0" : "flex-1"} rounded-xl py-2 lg:py-3 px-3 lg:px-4 flex items-center justify-center gap-1.5 lg:gap-2 text-[12px] lg:text-[15px] whitespace-nowrap`}
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
            {item.type === "prayer" && item.truncated && item.scriptureRef && (
              <button
                onClick={() => onOpenPassage(item.scriptureRef)}
                className="text-[11px] lg:text-[14px] mt-2 lg:mt-3 underline decoration-dotted"
                style={{ color: accent }}
              >
                Read full text
              </button>
            )}
            {item.type === "prayer" && item.truncated && item.canticleKey && (
              <button
                onClick={() => onOpenCanticle({ key: item.canticleKey, source: item.canticleSource || "1662" })}
                className="text-[11px] lg:text-[14px] mt-2 lg:mt-3 underline decoration-dotted"
                style={{ color: accent }}
              >
                Read full text
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] lg:text-[13px] mt-4 lg:mt-6 leading-relaxed" style={{ color: alpha(theme.text, 0.27) }}>
        {readingsFooterText(tradition, validSegment, massForm)}
      </p>
    </div>
  );
}

function readingsFooterText(tradition, segment, massForm) {
  const base = "Scripture readings use the World English Bible (public domain).";
  if (tradition === "Catholic" && segment === "mass" && massForm !== "traditional_latin") {
    return `${base} The English translation of the Order of Mass (Penitential Act, Gloria, Eucharistic Prayer II, Agnus Dei, Concluding Rite) © 2010, International Committee on English in the Liturgy, Inc. All rights reserved, reproduced under ICEL's published policy for free non-commercial internet use.`;
  }
  if (tradition === "Catholic" && segment === "mass") {
    return `${base} Traditional Latin Mass text adapted from a 1921 Missal (public domain); the Confiteor and Kyrie are rendered in matching period English.`;
  }
  if (tradition === "Catholic") {
    return `${base} Psalm and canticle citations are from the Four-Week Psalter and Lectionary for Mass tables at catholic-resources.org (Fr. Felix Just, S.J.), used with attribution under the site's non-commercial policy.`;
  }
  if (tradition === "Orthodox") {
    return `${base} Prayers and traditions are from ancient liturgical sources.`;
  }
  return `${base} Prayers and traditions are from the 1662 Book of Common Prayer, Anglican lectionaries, and ancient liturgical sources.`;
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
