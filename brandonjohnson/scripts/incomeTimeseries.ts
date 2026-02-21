import "dotenv/config";
import { getIncomeForLatLng } from "../lib/incomeApi";

export type { IncomeObservation, IncomeResult } from "../lib/incomeApi";
export { getIncomeForLatLng } from "../lib/incomeApi";

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  const lat = parseFloat(process.argv[2] ?? "");
  const lng = parseFloat(process.argv[3] ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    console.error("Usage: npx tsx scripts/incomeTimeseries.ts <lat> <lng>");
    console.error("  e.g. npx tsx scripts/incomeTimeseries.ts 51.5074 -0.1276");
    process.exit(1);
  }

  const result = await getIncomeForLatLng({ lat, lng });

  if (!result) {
    console.log("No income data found for this location.");
    return;
  }

  console.log(`MSOA: ${result.msoaCode}`);
  for (const obs of result.observations) {
    console.log(`  FY${obs.year}: £${obs.income.toLocaleString()}`);
  }
}

main().catch(console.error);
