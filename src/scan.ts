// Entry point: scan configured locations for openings matching the configured
// date patterns, and print them.
//
//   npm run scan
//
// Everything it looks for lives in src/config.ts.

import { config } from "./config.js";
import { fetchFacilityAvailability, findOpenings, type Opening } from "./availability.js";
import { addDays, dayOfWeek, fmt, label, type ISODate } from "./dates.js";

function today(): ISODate {
  return fmt(new Date());
}

/** Clamp our desired scan window to what the API actually allows to book. */
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

async function main(): Promise<void> {
  const start = config.earliest && config.earliest > today() ? config.earliest : today();
  const horizonEnd = addDays(today(), config.horizonDays);

  console.log("ReserveCalifornia campsite scan");
  console.log(`  run at:   ${new Date().toISOString()}`);
  console.log(`  window:   ${start} → ${horizonEnd} (${config.horizonDays} days)`);
  console.log(
    `  patterns: ${config.patterns.map((p) => p.label).join(", ")}`
  );
  console.log("");

  let grandTotal = 0;

  for (const loc of config.locations) {
    process.stdout.write(`Scanning ${loc.label} (facility ${loc.facilityId}) ... `);
    let avail;
    try {
      avail = await fetchFacilityAvailability(
        loc.facilityId,
        start,
        horizonEnd,
        config.requestDelayMs
      );
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
      continue;
    }

    const [rangeStart, rangeEnd] = clampRange(
      start,
      horizonEnd,
      avail.minDate,
      avail.maxDate
    );
    console.log(
      `bookable ${rangeStart}→${rangeEnd}, ${avail.sites.length} web-bookable sites`
    );

    const openings: Opening[] = [];
    for (const pattern of config.patterns) {
      openings.push(
        ...findOpenings(avail, pattern, rangeStart, rangeEnd, dayOfWeek)
      );
    }
    openings.sort((a, b) => (a.checkin < b.checkin ? -1 : 1));

    if (openings.length === 0) {
      console.log("  no matching openings.\n");
      continue;
    }

    for (const o of openings) {
      grandTotal++;
      const names = o.sites.map((s) => s.name).join(", ");
      console.log(
        `  ${label(o.checkin)}  (${o.nights}n, ${o.patternLabel})  ` +
          `${o.sites.length} site${o.sites.length > 1 ? "s" : ""}: ${names}`
      );
    }
    console.log("");
  }

  console.log(
    grandTotal > 0
      ? `Found ${grandTotal} matching check-in date(s). Book at https://www.reservecalifornia.com/`
      : "No matching openings right now. Try again later — cancellations appear constantly."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
