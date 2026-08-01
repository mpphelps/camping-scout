// What to scan for. Edit this file to change locations or date patterns.

import type { DayName } from "./dates.js";

export interface Location {
  label: string; // for display
  facilityId: number; // from search/place -> Facilities (see API.md / `npm run find`)
}

export interface Pattern {
  label: string;
  checkinDay: DayName; // night(s) start on this day of week
  nights: number; // consecutive nights, all must be free
}

export interface ScanConfig {
  locations: Location[];
  patterns: Pattern[];
  /** How far out to scan, in days from today. The API only allows ~180 (6 months). */
  horizonDays: number;
  /** Optional: only consider check-ins on/after this date (yyyy-MM-dd). */
  earliest?: string;
  /** Politeness delay between grid calls, ms. */
  requestDelayMs: number;
}

export const config: ScanConfig = {
  locations: [
    { label: "Crystal Cove — Moro Campground (tent/RV)", facilityId: 447 },
    // Add more facilities here, e.g. other SoCal state parks:
    // { label: "San Onofre — San Mateo", facilityId: XXX },
  ],
  patterns: [
    // "any 1-night Sat->Sun weekend"
    { label: "Sat→Sun (1 night)", checkinDay: "Sat", nights: 1 },
    // Uncomment to also catch full weekends:
    // { label: "Fri→Sun (2 nights)", checkinDay: "Fri", nights: 2 },
  ],
  horizonDays: 180,
  requestDelayMs: 500,
};
