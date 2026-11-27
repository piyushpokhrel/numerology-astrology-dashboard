/**
 * JAIMINI KARAKAS + ISHTA DEVTA + RESONATING BEINGS (milestone 10).
 *
 * SCHEME, stated explicitly (in code, in the UI, in the book):
 *  - Navamsa (D9): the standard Parashari division — each sign's nine
 *    padas counted from the sign itself for movable signs, from the
 *    9th sign for fixed, from the 5th for dual. (This is exactly the
 *    continuous pada count from 0° Aries used by navamsaSign().)
 *  - Chara Karakas: the SEVEN-karaka scheme — the seven classical
 *    grahas ranked by degree-in-sign, highest first: Atmakaraka,
 *    Amatyakaraka, Bhratrikaraka, Matrikaraka, Putrakaraka,
 *    Gnatikaraka, Darakaraka. Rahu is EXCLUDED in the 7-karaka scheme
 *    (the 8-karaka scheme that admits Rahu, counted in reverse, is a
 *    different school and is not used here — stated, not hidden).
 *  - Karakamsa: the navamsa sign occupied by the Atmakaraka.
 *  - ISHTA DEVTA rule (BPHS/Jaimini tradition): look at the 12th sign
 *    from the Karakamsa (in the navamsa). If a graha occupies it, that
 *    graha indicates the Ishta Devta; if it is empty, its lord does.
 *  - Deity forms per planet: the standard published mapping (Sun →
 *    Shiva, Moon → Gauri, Mars → Hanuman/Skanda, Mercury → Vishnu,
 *    Jupiter → Indra, Venus → Lakshmi, Saturn → Shani/Kali in the
 *    tradition's lists) — labelled TRADITIONAL.
 *
 * RESONANCE table: COMPARATIVE MYTHOLOGY (modern compilation). The
 * beings named are archetype parallels of the same planetary
 * principle across old civilizations — presented for study. They are
 * parallels, not identities, and not claims. Where a civilization
 * has no clean parallel, the table says "no direct parallel" rather
 * than forcing one.
 */

import { navamsaSign, SIGN_RULERS, type VedicChart } from "./vedic.ts";
import { ZODIAC_SIGNS, type ZodiacSign } from "./western.ts";

export interface NavamsaPlacement {
  body: string;
  rashiSign: ZodiacSign;
  degreeInSign: number;
  navamsaSign: ZodiacSign;
}

export interface Karaka {
  rank: number;
  name: string;
  short: string;
  body: string;
  degreeInSign: number;
  signifies: string;
}

const KARAKA_NAMES: ReadonlyArray<{ name: string; short: string; signifies: string }> = [
  { name: "Atmakaraka", short: "AK", signifies: "the soul's own direction — the planet the chart is ultimately about" },
  { name: "Amatyakaraka", short: "AmK", signifies: "the guide/minister — the faculty that advises the soul; read as the supporting guide karaka" },
  { name: "Bhratrikaraka", short: "BK", signifies: "siblings, courage and one's own efforts" },
  { name: "Matrikaraka", short: "MK", signifies: "mother, home and emotional foundation" },
  { name: "Putrakaraka", short: "PuK", signifies: "children, creativity and merit carried forward" },
  { name: "Gnatikaraka", short: "GK", signifies: "obstacles, rivals and the friction that teaches" },
  { name: "Darakaraka", short: "DK", signifies: "the partner — what one meets in the other" },
];

export interface JaiminiResult {
  navamsa: NavamsaPlacement[];
  lagnaNavamsa: ZodiacSign;
  karakas: Karaka[];
  atmakaraka: Karaka;
  amatyakaraka: Karaka;
  karakamsa: ZodiacSign;
  /** The 12th sign from the Karakamsa. */
  ishtaSign: ZodiacSign;
  /** Graha occupying the ishta sign in navamsa, if any. */
  ishtaOccupant: string | null;
  /** The planet that indicates the Ishta Devta (occupant, else the sign's lord). */
  ishtaPlanet: string;
  ishtaRule: string;
  ishtaDeity: string;
}

export const ISHTA_DEITIES: Readonly<Record<string, string>> = {
  Sun: "Shiva",
  Moon: "Gauri",
  Mars: "Hanuman / Skanda",
  Mercury: "Vishnu",
  Jupiter: "Indra",
  Venus: "Lakshmi",
  Saturn: "Shani / Kali (in the tradition's lists)",
};

export function jaimini(chart: VedicChart): JaiminiResult {
  const navamsa: NavamsaPlacement[] = chart.grahas.map((g) => ({
    body: g.body,
    rashiSign: g.sign,
    degreeInSign: g.degreeInSign,
    navamsaSign: navamsaSign(g.sidereal),
  }));
  const lagnaNavamsa = navamsaSign(chart.lagna.sidereal);

  const ranked = [...chart.grahas].sort((a, b) => b.degreeInSign - a.degreeInSign);
  const karakas: Karaka[] = ranked.map((g, i) => ({
    rank: i + 1,
    name: KARAKA_NAMES[i].name,
    short: KARAKA_NAMES[i].short,
    body: g.body,
    degreeInSign: g.degreeInSign,
    signifies: KARAKA_NAMES[i].signifies,
  }));

  const atmakaraka = karakas[0];
  const akNav = navamsa.find((n) => n.body === atmakaraka.body)!;
  const karakamsa = akNav.navamsaSign;
  const ishtaSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(karakamsa) + 11) % 12];
  const occupant = navamsa.find((n) => n.navamsaSign === ishtaSign);
  const ishtaPlanet = occupant ? occupant.body : SIGN_RULERS[ishtaSign];

  return {
    navamsa,
    lagnaNavamsa,
    karakas,
    atmakaraka,
    amatyakaraka: karakas[1],
    karakamsa,
    ishtaSign,
    ishtaOccupant: occupant ? occupant.body : null,
    ishtaPlanet,
    ishtaRule: occupant
      ? `The 12th sign from your Karakamsa (${karakamsa}) is ${ishtaSign}, and ${occupant.body} occupies it in your navamsa — so ${occupant.body} indicates your Ishta Devta.`
      : `The 12th sign from your Karakamsa (${karakamsa}) is ${ishtaSign}, which is empty in your navamsa — so its lord, ${SIGN_RULERS[ishtaSign]} (lord of ${ishtaSign}), indicates your Ishta Devta.`,
    ishtaDeity: ISHTA_DEITIES[ishtaPlanet] ?? "—",
  };
}

/* ---------------- Resonating beings (comparative mythology) ---------------- */

export interface ResonanceRow {
  civilization: string;
  being: string | null; // null = no direct parallel, stated honestly
  note: string;
}

export const RESONANCE: Readonly<Record<string, ResonanceRow[]>> = {
  Sun: [
    { civilization: "Greek", being: "Apollo / Helios", note: "light, prophecy and measure — the sun as the ordering eye of the world" },
    { civilization: "Roman", being: "Apollo / Sol", note: "the same figures carried into Rome's pantheon" },
    { civilization: "Egyptian", being: "Ra", note: "the sun as creator-king, crossing the sky by boat" },
    { civilization: "Norse", being: "Sól", note: "the sun personified — a goddess driving the sun's chariot" },
    { civilization: "Babylonian", being: "Shamash", note: "sun of justice and law, who sees all deeds" },
    { civilization: "Celtic", being: "Lugh", note: "the bright, many-skilled one — a light-and-craft parallel, drawn by modern comparativists" },
  ],
  Moon: [
    { civilization: "Greek", being: "Artemis / Selene", note: "the moon as huntress and as the moon herself, keeper of cycles and wild places" },
    { civilization: "Roman", being: "Diana / Luna", note: "Rome's counterparts of the same lunar figures" },
    { civilization: "Egyptian", being: "Khonsu", note: "the moon god, 'traveller' of the night sky, measurer of time" },
    { civilization: "Norse", being: "Máni", note: "the moon personified, driving its chariot across the sky" },
    { civilization: "Babylonian", being: "Sin (Nanna)", note: "the moon of Ur, father of the sun in the older telling, lord of the calendar" },
    { civilization: "Celtic", being: null, note: "no direct parallel — Arianrhod is proposed in modern writing, but she is not attested as a moon deity in the early sources" },
  ],
  Mars: [
    { civilization: "Greek", being: "Ares", note: "war's fury and bloodshed — the planet's heat at its rawest" },
    { civilization: "Roman", being: "Mars", note: "war joined to agriculture and fatherhood — a broader, more honoured figure than Ares" },
    { civilization: "Egyptian", being: "Montu", note: "the falcon-headed war god of Thebes" },
    { civilization: "Norse", being: "Tyr", note: "war as courage and lawful sacrifice — the god who bound the wolf at the cost of his hand" },
    { civilization: "Babylonian", being: "Nergal", note: "lord of war, plague and the scorching midday sun" },
    { civilization: "Celtic", being: "Camulus", note: "a war god the Romans themselves identified with Mars (interpretatio romana)" },
  ],
  Mercury: [
    { civilization: "Greek", being: "Hermes", note: "messenger, traveller, trickster and psychopomp — language and roads" },
    { civilization: "Roman", being: "Mercury", note: "the same messenger, patron of trade and travellers" },
    { civilization: "Egyptian", being: "Thoth", note: "scribe of the gods — writing, reckoning and magic" },
    { civilization: "Norse", being: "Odin", note: "the wandering seeker of wisdom, master of language, poetry and the runes" },
    { civilization: "Babylonian", being: "Nabu", note: "scribe and herald of Marduk, keeper of the tablet of destinies" },
    { civilization: "Celtic", being: "Ogma", note: "eloquence personified, credited with the invention of the Ogham script" },
  ],
  Jupiter: [
    { civilization: "Greek", being: "Zeus", note: "sky-father and thunderer, king of Olympus, guarantor of order" },
    { civilization: "Roman", being: "Jupiter", note: "Zeus carried into Rome as the state's supreme god" },
    { civilization: "Egyptian", being: "Amun (Amun-Ra)", note: "king of the gods, the hidden one joined with the sun" },
    { civilization: "Norse", being: "Thor", note: "the thunderer and defender of the world — the storm-and-law side of the Jupiter principle" },
    { civilization: "Babylonian", being: "Marduk", note: "king of the gods who ordered the cosmos from chaos" },
    { civilization: "Celtic", being: "Taranis", note: "the thunderer, attested in inscriptions and Roman commentary" },
  ],
  Venus: [
    { civilization: "Greek", being: "Aphrodite", note: "love, beauty and desire as a cosmic binding force" },
    { civilization: "Roman", being: "Venus", note: "the same goddess, ancestress of Rome in the national myth" },
    { civilization: "Egyptian", being: "Hathor", note: "love, music, joy and the golden calf of the heavens" },
    { civilization: "Norse", being: "Freya", note: "love, beauty and seiðr magic, lady of the Vanir" },
    { civilization: "Babylonian", being: "Ishtar", note: "love and war in one figure — Venus at her most sovereign" },
    { civilization: "Celtic", being: null, note: "no direct parallel — Branwen is a love-associated heroine of Welsh tale, not a love goddess in the early sources" },
  ],
  Saturn: [
    { civilization: "Greek", being: "Cronos", note: "time the devourer, the old king deposed by his children" },
    { civilization: "Roman", being: "Saturn", note: "Cronos softened into a god of sowing, harvest and the golden age" },
    { civilization: "Egyptian", being: null, note: "no direct parallel — Geb is earth and lineage, not a Cronos figure; the table does not force one" },
    { civilization: "Norse", being: null, note: "no direct parallel — no Norse figure carries Saturn's time-and-limit principle in one person" },
    { civilization: "Babylonian", being: "Ninurta", note: "the planet Saturn's Babylonian identification — a farmer-warrior god of the plough and the field" },
    { civilization: "Celtic", being: null, note: "no direct parallel attested" },
  ],
};

export const RESONANCE_FRAMING =
  "These are parallels of archetype across cultures, presented for study — not identities, not claims. Different civilizations carved the same planetary principles into different persons; the resonance is in the principle, and where no clean parallel exists the table says so.";

export const ISHTA_EXPLANATION = [
  "WHAT 'ISHTA DEVTA' MEANS — in the Jaimini tradition (the sister system of Parashari astrology, from the Jaimini Sutras and BPHS), the Ishta Devta is the deity form one's own chart points to for spiritual practice — read from the soul's sign (the Karakamsa) and the sign of release that follows it. It is a pointer the tradition computes, not a command: this page explains what the tradition says and how the figure is derived. It does not instruct anyone to worship, and it promises nothing.",
  "WHY THE NAVAMSA — the D9 is the tradition's chart of the inner life and the fruit of things; the Atmakaraka's place there (the Karakamsa) is read as the soul's seat. The 12th sign from it is the house of moksha (release) counted from that seat — hence the rule.",
];
