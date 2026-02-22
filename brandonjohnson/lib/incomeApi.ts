import * as fs from "fs";
import { get } from "http";
import * as path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncomeGraphPoint = {
  name: string;    // Financial year ending, e.g. 2023 = FY 2022/23
  value: number;  // Net annual household income before housing costs (BHC), nominal £
};

// ── Data ──────────────────────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), "data", "incomeByMsoa.json");

let incomeData: Record<string, Record<string, number>> | null = null;

function getIncomeData(): Record<string, Record<string, number>> {
  if (!incomeData) {
    incomeData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  }
  return incomeData!;
}

// ── Postcodes.io: lat/lng → MSOA code ────────────────────────────────────────

async function getMsoaForLatLng(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}`);
  if (!res.ok) throw new Error(`Postcodes.io returned ${res.status}`);
  const json = await res.json();
  if (json.status !== 200 || !Array.isArray(json.result) || json.result.length === 0) return null;
  const msoa = json.result[0]?.codes?.msoa;
  return typeof msoa === "string" ? msoa : null;
}

// ── Main exported function ────────────────────────────────────────────────────

export async function getIncomeForLatLng(params: {
  lat: number;
  lng: number;
}): Promise< IncomeGraphPoint[] > {
  const msoaCode = await getMsoaForLatLng(params.lat, params.lng);
  if (!msoaCode) return [];

  const data = getIncomeData();
  const byYear = data[msoaCode];
  if (!byYear) return [];
  const incomeGraphPoints: IncomeGraphPoint[] = Object.entries(byYear)
    .map(([yr, income]) => ({ year: parseInt(yr, 10), income }))
    .sort((a, b) => a.year - b.year)
    .map(({ year, income }) => ({name: year.toString(), value: income}));

  return incomeGraphPoints;
}

// export async function main() {
//     console.log(await getIncomeForLatLng({ lat: 51.5074, lng: -0.1278 })); // London
// }

// main().catch(console.error);
