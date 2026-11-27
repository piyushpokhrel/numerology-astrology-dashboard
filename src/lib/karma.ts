/**
 * PAST LIFE KARMA & TRUE PURPOSE (milestone 8) — indicators only,
 * computed, broadly explained, and honest about the frame.
 *
 * THE FRAME (stated on the page and in the book, never softened):
 * in the Vedic tradition, karma is the accumulated consequence of
 * action across lifetimes — sanchita (the total store), prarabdha
 * (the portion allotted to this life, read from the birth chart),
 * and agami (what this life's choices now create). A chart, in that
 * tradition, shows prarabdha INDICATORS: the node axis, Saturn, the
 * 12th house, karmic-debt compounds. This module computes exactly
 * those indicators from the profile's real chart and numbers, and
 * assembles the TRUE PURPOSE statement only from them.
 *
 * It never invents a past-life story. No "you were a monk in Tibet"
 * fiction — the knowledge inventory's do-not-promise list is a hard
 * rule here. Where a tradition would narrate, we report the indicator
 * and what the tradition says the indicator means.
 *
 * Nodes: MEAN nodes (Meeus) — labelled everywhere. The true node is
 * an ephemeris upgrade.
 */

import { displayNumber, type CoreProfile } from "./numerology.ts";
import { numberKeyword } from "./meanings.ts";
import type { VedicChart } from "./vedic.ts";
import { nodeAxis, type WesternChart } from "./western.ts";

export interface KarmaIndicator {
  title: string;
  label: "TRADITION";
  lines: string[];
  source: string;
}

export interface KarmaReport {
  indicators: KarmaIndicator[];
  /** The structured purpose statement — every clause traceable to an indicator above. */
  purpose: string[];
  framework: string[];
}

const SIGN_FLAVOUR: Record<string, string> = {
  Aries: "initiative, courage and the self's spark",
  Taurus: "embodiment, resources and steady worth",
  Gemini: "curiosity, language and connection",
  Cancer: "belonging, care and emotional roots",
  Leo: "expression, radiance and the heart's stage",
  Virgo: "craft, discernment and useful service",
  Libra: "relationship, balance and aesthetic judgment",
  Scorpio: "depth, transformation and shared intensity",
  Sagittarius: "meaning, teaching and the far horizon",
  Capricorn: "mastery, structure and earned authority",
  Aquarius: "community, principle and the future's design",
  Pisces: "compassion, surrender and the dissolving of boundaries",
};

const HOUSE_DOMAIN: Record<number, string> = {
  1: "identity and embodiment", 2: "resources and values", 3: "skills and siblings",
  4: "home and foundations", 5: "creativity and children", 6: "work and health habits",
  7: "partnership", 8: "shared depth and transformation", 9: "belief and teaching",
  10: "career and public standing", 11: "community and gains", 12: "release, retreat and the unseen",
};

const KARMIC_DEBTS: Record<number, string> = {
  13: "13 (death/rebirth in Cheiro's table): the debt of work done carelessly — the tradition's remedy is diligence and finishing what is started.",
  14: "14 (change/freedom misused): the debt of restlessness — the tradition's remedy is commitment held with flexibility.",
  16: "16 (the struck tower in Cheiro's reading): the debt of pride in knowledge or love — the remedy is humility and rebuilding on truth.",
  19: "19 (power/the prince): the debt of power used for self alone — the remedy is power spent in service.",
};

export function karmaReport(
  core: CoreProfile,
  western: WesternChart,
  vedic: VedicChart,
): KarmaReport {
  const axis = nodeAxis(western);
  const saturnW = western.positions.find((p) => p.body === "Saturn")!;
  const saturnV = vedic.grahas.find((g) => g.body === "Saturn")!;
  const twelfthW = western.positions.filter((p) => p.house === 12);
  const lagnaIdx = Math.floor(vedic.lagna.sidereal / 30);
  const twelfthV = vedic.grahas.filter(
    (g) => ((Math.floor(g.sidereal / 30) - lagnaIdx + 12) % 12) + 1 === 12,
  );

  const indicators: KarmaIndicator[] = [
    {
      title: `The node axis — Ketu in ${axis.ketuSign} (house ${axis.ketuHouse}) → Rahu in ${axis.rahuSign} (house ${axis.rahuHouse}) [Western, mean nodes]`,
      label: "TRADITION",
      lines: [
        `The South Node (Ketu) in ${axis.ketuSign}, house ${axis.ketuHouse} (${HOUSE_DOMAIN[axis.ketuHouse]}): the tradition reads this as the mastered territory — ${SIGN_FLAVOUR[axis.ketuSign]} comes easily, almost by default, and can become a rut precisely because it costs nothing.`,
        `The North Node (Rahu) in ${axis.rahuSign}, house ${axis.rahuHouse} (${HOUSE_DOMAIN[axis.rahuHouse]}): the growth direction — ${SIGN_FLAVOUR[axis.rahuSign]} does not come by default; the tradition says this lifetime leans toward it deliberately.`,
        `These are MEAN nodes (Meeus formula): Rahu at ${axis.rahu.toFixed(2)}° tropical. The true node oscillates around the mean by up to ~1.5° and needs a full ephemeris — the distinction is stated, not hidden.`,
      ],
      source: "Node-axis doctrine of Western karmic astrology (modern tradition built on the classical nodes); mean node per Meeus, Astronomical Algorithms.",
    },
    {
      title: `The same axis in the Vedic reading — Rahu in ${vedic.nodes.rahuSign} (house ${vedic.nodes.rahuHouse} from Lagna), Ketu in ${vedic.nodes.ketuSign} (house ${vedic.nodes.ketuHouse})`,
      label: "TRADITION",
      lines: [
        `Sidereally, Rahu stands in ${vedic.nodes.rahuSign} and Ketu in ${vedic.nodes.ketuSign}. In Parashari reading Rahu is the amplifier — worldly appetite and the drive to experience — placed here in the ${vedic.nodes.rahuHouse}th from your Lagna (${HOUSE_DOMAIN[vedic.nodes.rahuHouse]}); Ketu is the release point, the ${vedic.nodes.ketuHouse}th house (${HOUSE_DOMAIN[vedic.nodes.ketuHouse]}), where the tradition says detachment ripens.`,
        `Both systems read the same axis from two zodiacs; where they agree on the direction of growth, the tradition treats the signal as strong. Where the sidereal and tropical signs differ, both are reported — not averaged.`,
      ],
      source: "Brihat Parashara Hora Shastra — Rahu/Ketu doctrine (classical); mean nodes per Meeus, sidereal by Lahiri ayanamsa.",
    },
    {
      title: `Saturn — the karma karaka: ${saturnV.sign} sidereal (house ${((Math.floor(saturnV.sidereal / 30) - lagnaIdx + 12) % 12) + 1} from Lagna) · ${saturnW.sign} tropical, house ${saturnW.house}`,
      label: "TRADITION",
      lines: [
        `Saturn is the tradition's taskmaster and the graha of karma itself — where Saturn stands, the lesson is earned slowly and kept permanently. Yours stands in ${saturnV.sign} sidereal / ${saturnW.sign} tropical: the lesson's flavour is ${SIGN_FLAVOUR[saturnV.sign]}, worked out through ${HOUSE_DOMAIN[saturnW.house]} (Western house ${saturnW.house}).`,
        `Parashari note: Saturn's period in your dasha sequence runs ${vedic.dashas.find((d) => d.lord === "Saturn") ? `${vedic.dashas.find((d) => d.lord === "Saturn")!.startISO.slice(0, 10)} → ${vedic.dashas.find((d) => d.lord === "Saturn")!.endISO.slice(0, 10)}` : "outside the computed span"} — the years when this lesson is timetabled most strongly.`,
      ],
      source: "BPHS — Saturn as karma karaka (classical); Western Saturn doctrine (traditional).",
    },
    {
      title: "The 12th house — what the tradition calls the house of release",
      label: "TRADITION",
      lines: [
        twelfthW.length
          ? `Western (whole sign): your 12th house holds ${twelfthW.map((p) => `${p.body} in ${p.sign}`).join(", ")}. The tradition reads 12th-house placements as the private, unseen work — what is processed in retreat, dreams and letting go.`
          : "Western (whole sign): your 12th house is empty — no body stands there. The tradition reads an empty 12th plainly: release work is not a headline theme of this chart, and no occupant is invented to fill it.",
        twelfthV.length
          ? `Vedic: the 12th from your Lagna holds ${twelfthV.map((g) => `${g.graha} in ${g.sign}`).join(", ")} — in Parashari reading, the vyaya (expenditure/release) house's tenants show where energy is spent beyond the visible ledger.`
          : "Vedic: the 12th from your Lagna is empty of grahas — reported as found.",
      ],
      source: "12th-house doctrine, Western traditional + Parashari vyaya bhava (classical).",
    },
    {
      title: "Karmic-debt compounds in your numbers (Cheiro)",
      label: "TRADITION",
      lines: (() => {
        const hits: string[] = [];
        const seen = new Set<number>();
        const candidates: Array<[string, number]> = [
          ["Life Path compound", core.lifePathCompound],
          ["Chaldean name compound", core.chaldeanName.compound],
          ["Pythagorean name compound", core.pythagoreanName.compound],
        ];
        for (const [label, c] of candidates) {
          if (KARMIC_DEBTS[c] && !seen.has(c)) {
            seen.add(c);
            hits.push(`Your ${label} is ${c} — ${KARMIC_DEBTS[c]}`);
          }
        }
        return hits.length
          ? hits
          : [
              `None of your core compounds — Life Path ${core.lifePathCompound}, Chaldean name ${core.chaldeanName.compound}, Pythagorean name ${core.pythagoreanName.compound} — is one of Cheiro's four karmic-debt numbers (13, 14, 16, 19). That absence is reported as a finding, not filled with a substitute story.`,
            ];
      })(),
      source: "Cheiro, Book of Numbers (1926) — karmic-debt compounds 13/14/16/19.",
    },
  ];

  const purpose: string[] = [
    `LIFE PATH ${displayNumber(core.lifePath)} — ${numberKeyword(core.lifePath)}: the road this life is organised around (from your birth-date arithmetic, Chapter 1).`,
    `DESTINY ${displayNumber(core.destinyPythagorean)} — ${numberKeyword(core.destinyPythagorean)}: what your name calls you to express (Pythagorean; Chaldean reads ${displayNumber(core.destinyChaldean)}).`,
    `NODE DIRECTION — from Ketu in ${axis.ketuSign} (mastery: ${SIGN_FLAVOUR[axis.ketuSign]}) toward Rahu in ${axis.rahuSign} (growth: ${SIGN_FLAVOUR[axis.rahuSign]}), worked through ${HOUSE_DOMAIN[axis.rahuHouse]}.`,
    `SATURN'S LESSON — ${SIGN_FLAVOUR[saturnV.sign]}, earned slowly in ${saturnV.sign} (sidereal): the discipline that, in the tradition's framing, converts prarabdha into wisdom rather than repetition.`,
    `Assembled, the traditions describe this lifetime's purpose as: walking the ${displayNumber(core.lifePath)} road toward ${SIGN_FLAVOUR[axis.rahuSign]}, expressing ${numberKeyword(core.destinyPythagorean).toLowerCase()}, and paying Saturn's patient tuition in ${saturnV.sign} — with the Ketu gifts of ${axis.ketuSign} as the toolkit you start with, not the destination. Every clause of that sentence traces to a computed indicator above; nothing in it was invented.`,
  ];

  const framework: string[] = [
    "WHAT KARMA MEANS HERE — in the Vedic frame, karma is accumulated consequence: sanchita, the whole store; prarabdha, the portion allotted to this lifetime, which the tradition reads from the birth chart; and agami, the karma this life's choices are creating now. This page reports prarabdha INDICATORS only.",
    "WHAT THE NODES SIGNIFY — the nodes are where the Moon's orbit crosses the ecliptic, the eclipse points. The tradition reads the axis as the spine of a life's direction: Ketu (South) what is already mastered, Rahu (North) what this life reaches for. Astronomically they are geometry; the reading is tradition, and it is labelled as such.",
    "WHY INDICATORS, NEVER STORIES — a past-life narrative ('you were a healer in 1400s Persia') cannot be computed, checked, or sourced; it can only be invented. This product's promise is the opposite: every claim above traces to a number, a position, or a dated period in your own chart, with its source named. That restraint is the product.",
  ];

  return { indicators, purpose, framework };
}
