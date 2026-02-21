import "dotenv/config";
import { getIncomeForLatLng } from "../lib/incomeApi";

export type { IncomeObservation, IncomeResult } from "../lib/incomeApi";
export { getIncomeForLatLng } from "../lib/incomeApi";

// ── City presets ──────────────────────────────────────────────────────────────

const CITIES: Record<string, [number, number]> = {
  London:     [-0.1276, 51.5074],
  Manchester: [-2.2446, 53.4808],
  Birmingham: [-1.8998, 52.4814],
  Leeds:      [-1.5479, 53.7965],
  Liverpool:  [-2.9779, 53.4106],
};

async function pickCity(): Promise<{ name: string; lng: number; lat: number }> {
  const entries = Object.entries(CITIES);
  console.log("\nSelect a city:");
  entries.forEach(([name, [lng, lat]], i) => {
    console.log(`  ${i + 1}. ${name.padEnd(12)} [${lng}, ${lat}]`);
  });
  process.stdout.write("\nEnter number: ");

  return new Promise((resolve, reject) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (chunk) => {
      const n = parseInt(String(chunk).trim(), 10);
      if (isNaN(n) || n < 1 || n > entries.length) {
        reject(new Error(`Invalid selection — enter a number between 1 and ${entries.length}`));
        return;
      }
      const [name, [lng, lat]] = entries[n - 1];
      process.stdin.destroy();
      resolve({ name, lng, lat });
    });
  });
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  const { name, lng, lat } = await pickCity();

  console.log(`\nFetching income data for ${name}…`);
  const result = await getIncomeForLatLng({ lat, lng });

  if (!result) {
    console.log("No income data found for this location.");
    return;
  }

  console.log(`\n=== Net Household Income BHC (FY ending) — ${name} ===`);
  console.log(`MSOA: ${result.msoaCode}`);
  for (const obs of result.observations) {
    console.log(`  FY${obs.year}: £${obs.income.toLocaleString()}`);
  }
}

main().catch(console.error);
