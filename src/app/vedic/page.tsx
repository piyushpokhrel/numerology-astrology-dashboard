"use client";

import { PlannedSystem } from "@/components/PlannedSystem";

export default function VedicPage() {
  return (
    <PlannedSystem
      title="Vedic astrology"
      blurb="Sidereal Jyotisha in the Parashari tradition — the same planetary positions as the Western chart, shifted by the Lahiri ayanamsa."
      noProfileWhat="The Vedic chart"
      needsTime
      planned={[
        "Sidereal (Lahiri) positions for all grahas, plus the sidereal ascendant",
        "Moon nakshatra and pada — the anchor of the whole Vedic reading",
        "Rashi (D1) chart placements by sign",
        "Vimshottari dasha timeline — 120-year cycle from the Moon's nakshatra, with the current period highlighted",
        "Cross-checks against published sample charts before anything ships",
      ]}
    />
  );
}
