import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncomeObservation = {
  year: number;     // Financial year ending, e.g. 2023 = FY 2022/23
  income: number;   // Net annual household income before housing costs (BHC), nominal £
  msoaCode: string;
};

// ── Data ──────────────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "incomeByMsoa.json");

// Loaded once and cached in memory
let incomeData: Record<string, Record<string, number>> | null = null;

function getIncomeData(): Record<string, Record<string, number>> {
  if (!incomeData) {
    incomeData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  }
  return incomeData!;
}

// ── Step 1: lat/lng → MSOA code via Postcodes.io ─────────────────────────────

const POSTCODES_IO_BASE = "https://api.postcodes.io";

async function getMsoaForLatLng(lat: number, lng: number): Promise<string | null> {
  const url = `${POSTCODES_IO_BASE}/postcodes?lon=${lng}&lat=${lat}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Postcodes.io returned ${res.status} for [${lng}, ${lat}]`);
  const json = await res.json();
  if (json.status !== 200 || !Array.isArray(json.result) || json.result.length === 0) return null;
  const msoa = json.result[0]?.codes?.msoa;
  return typeof msoa === "string" ? msoa : null;
}

// ── Main exported function ────────────────────────────────────────────────────

export async function getIncomeTimeseriesForLatLng(params: {
  lat: number;
  lng: number;
}): Promise<IncomeObservation[] | null> {
  const msoaCode = await getMsoaForLatLng(params.lat, params.lng);
  if (!msoaCode) return null;

  const data = getIncomeData();
  const byYear = data[msoaCode];
  if (!byYear) return null;

  const observations: IncomeObservation[] = Object.entries(byYear).map(([yr, income]) => ({
    year: parseInt(yr, 10),
    income,
    msoaCode,
  }));

  return observations.sort((a, b) => a.year - b.year);
}

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
  const result = await getIncomeTimeseriesForLatLng({ lat, lng });

  if (!result) {
    console.log("No income data found for this location.");
    return;
  }

  console.log(`\n=== Net Household Income BHC (FY ending) — ${name} ===`);
  console.log(`MSOA: ${result[0].msoaCode}`);
  for (const obs of result) {
    console.log(`  FY${obs.year}: £${obs.income.toLocaleString()}`);
  }
}

main().catch(console.error);
