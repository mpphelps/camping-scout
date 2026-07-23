// Pure availability logic — no network — so it's easy to reason about and test.

import { getGrid } from "./api.js";
import { addDays, eachDay, sliceKey, type ISODate } from "./dates.js";
import type { Pattern } from "./config.js";
import type { GridResponse } from "./types.js";

/** One bookable site with the set of nights it is free. */
export interface SiteAvailability {
  unitId: number;
  name: string;
  freeNights: Set<ISODate>;
}

export interface FacilityAvailability {
  facilityName: string;
  minDate: ISODate | null;
  maxDate: ISODate | null;
  sites: SiteAvailability[];
}

/** Merge one grid response's slices into a site map. */
export function mergeGrid(
  grid: GridResponse,
  into: Map<number, SiteAvailability>
): void {
  const units = grid.Facility?.Units;
  if (!units) return;
  for (const unit of Object.values(units)) {
    // Only sites a normal person can actually book online.
    if (!unit.AllowWebBooking || !unit.IsWebViewable) continue;
    let site = into.get(unit.UnitId);
    if (!site) {
      site = { unitId: unit.UnitId, name: unit.Name, freeNights: new Set() };
      into.set(unit.UnitId, site);
    }
    for (const slice of Object.values(unit.Slices ?? {})) {
      if (slice.IsFree) site.freeNights.add(slice.Date);
    }
  }
}

/**
 * Pull the full grid for a facility across [startDate, endDate] by paging in
 * ~2-week chunks (each grid call returns ~3 weeks of slices; we step 14 days so
 * chunks overlap and nothing is missed).
 */
export async function fetchFacilityAvailability(
  facilityId: number,
  startDate: ISODate,
  endDate: ISODate,
  delayMs: number
): Promise<FacilityAvailability> {
  const sites = new Map<number, SiteAvailability>();
  let facilityName = `Facility ${facilityId}`;
  let minDate: ISODate | null = null;
  let maxDate: ISODate | null = null;

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 14)) {
    const grid = await getGrid(facilityId, cursor, 1);
    if (grid.Facility?.Name) facilityName = grid.Facility.Name;
    if (grid.MinDate) minDate = grid.MinDate;
    if (grid.MaxDate) maxDate = grid.MaxDate;
    mergeGrid(grid, sites);
    if (cursor <= endDate) await sleep(delayMs);
  }

  return {
    facilityName,
    minDate,
    maxDate,
    sites: [...sites.values()],
  };
}

/** Does a site have all `nights` consecutive nights free starting at `checkin`? */
export function isStayFree(
  site: SiteAvailability,
  checkin: ISODate,
  nights: number
): boolean {
  for (let i = 0; i < nights; i++) {
    if (!site.freeNights.has(addDays(checkin, i))) return false;
  }
  return true;
}

export interface Opening {
  checkin: ISODate;
  nights: number;
  patternLabel: string;
  sites: { unitId: number; name: string }[];
}

/**
 * Find all openings in a facility that match a pattern (a check-in day-of-week
 * plus a night count), within [rangeStart, rangeEnd].
 */
export function findOpenings(
  avail: FacilityAvailability,
  pattern: Pattern,
  rangeStart: ISODate,
  rangeEnd: ISODate,
  dayOfWeek: (d: ISODate) => string
): Opening[] {
  const openings: Opening[] = [];
  for (const checkin of eachDay(rangeStart, rangeEnd)) {
    if (dayOfWeek(checkin) !== pattern.checkinDay) continue;
    const lastNight = addDays(checkin, pattern.nights - 1);
    if (lastNight > rangeEnd) continue;
    const matches = avail.sites
      .filter((s) => isStayFree(s, checkin, pattern.nights))
      .map((s) => ({ unitId: s.unitId, name: s.name }));
    if (matches.length > 0) {
      openings.push({
        checkin,
        nights: pattern.nights,
        patternLabel: pattern.label,
        sites: matches,
      });
    }
  }
  return openings;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Re-export so scan.ts can build slice keys if needed.
export { sliceKey };
