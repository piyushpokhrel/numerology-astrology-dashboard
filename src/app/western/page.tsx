"use client";

import { PlannedSystem } from "@/components/PlannedSystem";

export default function WesternPage() {
  return (
    <PlannedSystem
      title="Western astrology"
      blurb="Tropical zodiac chart on the astronomy-engine ephemeris — the same library trusted for the position math, cross-checked against published charts."
      noProfileWhat="The Western chart"
      needsTime
      planned={[
        "Planet signs for Sun through Pluto, from exact ecliptic longitudes",
        "Ascendant and Midheaven from local sidereal time at the birth place",
        "Whole-sign houses (the v1 standard from the knowledge inventory)",
        "Major aspects — conjunction, sextile, square, trine, opposition — with documented orbs",
        "Element and modality balance across the chart",
      ]}
    />
  );
}
