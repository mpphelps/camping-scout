import { runScan, type ScanResult } from "@campingmeow/scanner";
import { logger } from "~/lib/logger.server";

export type { ScanResult };

export async function runAvailabilityScan(): Promise<ScanResult> {
  logger.info({ action: "scan.start" }, "starting availability scan");
  const result = await runScan();
  logger.info(
    { action: "scan.complete", totalOpenings: result.totalOpenings, locations: result.locations.length },
    "availability scan complete",
  );
  return result;
}
