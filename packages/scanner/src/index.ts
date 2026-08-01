// Programmatic entry point so other packages (the web app, a future
// notification worker) can run the same scan the CLI does.

import { config, type Location, type Pattern, type ScanConfig } from "./config.js";
import { fetchFacilityAvailability, findOpenings, type Opening } from "./availability.js";
import { addDays, dayOfWeek, fmt, type ISODate } from "./dates.js";

export type { Location, Pattern, ScanConfig, Opening, ISODate };
export { config as defaultScanConfig };

export interface LocationScanResult {
  label: string;
  facilityId: number;
  facilityName: string;
  /** Bookable window reported by the API, clamped to the requested horizon. */
  rangeStart: ISODate | null;
  rangeEnd: ISODate | null;
  siteCount: number;
  openings: Opening[];
  error?: string;
}

export interface ScanResult {
  ranAt: string; // ISO timestamp
  windowStart: ISODate;
  windowEnd: ISODate;
  patternLabels: string[];
  locations: LocationScanResult[];
  totalOpenings: number;
}

function today(): ISODate {
  return fmt(new Date());
}

function clampRange(
  desiredStart: ISODate,
  desiredEnd: ISODate,
  minDate: ISODate | null,
  maxDate: ISODate | null
): [ISODate, ISODate] {
  const start = minDate && minDate > desiredStart ? minDate : desiredStart;
  const end = maxDate && maxDate < desiredEnd ? maxDate : desiredEnd;
  return [start, end];
}

/** Run a full availability scan. Defaults to the hardcoded config in config.ts. */
export async function runScan(cfg: ScanConfig = config): Promise<ScanResult> {
  const start = cfg.earliest && cfg.earliest > today() ? cfg.earliest : today();
  const horizonEnd = addDays(today(), cfg.horizonDays);

  const locations: LocationScanResult[] = [];
  let totalOpenings = 0;

  for (const loc of cfg.locations) {
    try {
      const avail = await fetchFacilityAvailability(loc.facilityId, start, horizonEnd, cfg.requestDelayMs);
      const [rangeStart, rangeEnd] = clampRange(start, horizonEnd, avail.minDate, avail.maxDate);

      const openings: Opening[] = [];
      for (const pattern of cfg.patterns) {
        openings.push(...findOpenings(avail, pattern, rangeStart, rangeEnd, dayOfWeek));
      }
      openings.sort((a, b) => (a.checkin < b.checkin ? -1 : 1));
      totalOpenings += openings.length;

      locations.push({
        label: loc.label,
        facilityId: loc.facilityId,
        facilityName: avail.facilityName,
        rangeStart,
        rangeEnd,
        siteCount: avail.sites.length,
        openings,
      });
    } catch (err) {
      locations.push({
        label: loc.label,
        facilityId: loc.facilityId,
        facilityName: loc.label,
        rangeStart: null,
        rangeEnd: null,
        siteCount: 0,
        openings: [],
        error: (err as Error).message,
      });
    }
  }

  return {
    ranAt: new Date().toISOString(),
    windowStart: start,
    windowEnd: horizonEnd,
    patternLabels: cfg.patterns.map((p) => p.label),
    locations,
    totalOpenings,
  };
}
