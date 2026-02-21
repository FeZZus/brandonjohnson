/**
 * One-time build script: downloads ONS small area income estimates Excel files
 * and writes a static JSON lookup to data/incomeByMsoa.json.
 *
 * Run once: npx tsx scripts/buildIncomeData.ts
 * Output:   data/incomeByMsoa.json  (MSOA code → { "2014": £, "2016": £, ... })
 */

import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const OUT_PATH = path.join(process.cwd(), "data", "incomeByMsoa.json");

const ONS_BASE =
  "https://www.ons.gov.uk/file?uri=/employmentandlabourmarket/peopleinwork" +
  "/earningsandworkinghours/datasets/smallareaincomeestimatesformiddlelayer" +
  "superoutputareasenglandandwales";

const RELEASES = [
  { year: 2023, url: `${ONS_BASE}/financialyearending2023/datasetfinal.xlsx` },
  { year: 2020, url: `${ONS_BASE}/financialyearending2020/saiefy1920finalqaddownload280923.xlsx` },
  { year: 2018, url: `${ONS_BASE}/financialyearending2018/incomeestimatesforsmallareasdatasetfinancialyearending20181.xls` },
  { year: 2016, url: `${ONS_BASE}/financialyearending2016/1smallareaincomeestimatesdata.xls` },
  { year: 2014, url: `${ONS_BASE}/financialyearending2014/1smallareaincomeestimatesdataupdate.xls` },
] as const;

// ── Parse one Excel file into a MSOA → income map ─────────────────────────────

async function parseRelease(year: number, url: string): Promise<Map<string, number>> {
  console.log(`[FY${year}] Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for FY${year}`);

  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  let msoaCol = -1;
  let incomeCol = -1;
  let dataStartRow = -1;
  let sheetRows: unknown[][] = [];

  // Prefer the "Net income before housing costs" sheet; fall back to any sheet with MSOA codes
  const preferredSheet =
    wb.SheetNames.find(n => /before.?housing/i.test(n)) ??
    wb.SheetNames.find(n => /net.*(annual|income)/i.test(n));

  const sheetsToTry = preferredSheet
    ? [preferredSheet, ...wb.SheetNames.filter(n => n !== preferredSheet)]
    : wb.SheetNames;

  for (const sheetName of sheetsToTry) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < Math.min(rows[r].length, 5); c++) {
        if (/^E0[1-9]\d{6}$/.test(String(rows[r][c] ?? ""))) {
          msoaCol = c;
          dataStartRow = r;
          sheetRows = rows;
          break;
        }
      }
      if (msoaCol >= 0) break;
    }
    if (msoaCol >= 0) {
      console.log(`[FY${year}] Using sheet "${sheetName}", MSOA col ${msoaCol}, data from row ${dataStartRow}`);
      break;
    }
  }

  if (msoaCol < 0) throw new Error(`[FY${year}] No MSOA code column found`);

  // Header row sits immediately above the first data row
  const headerRow: unknown[] = dataStartRow > 0 ? sheetRows[dataStartRow - 1] : [];

  // Detect BHC income column
  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] ?? "").toLowerCase();
    if ((h.includes("bhc") || h.includes("before housing")) &&
        (h.includes("mean") || h.includes("equivalised") || h.includes("net"))) {
      incomeCol = c;
      break;
    }
  }
  if (incomeCol < 0) {
    for (let c = 0; c < headerRow.length; c++) {
      if (String(headerRow[c] ?? "").toLowerCase().includes("bhc")) {
        incomeCol = c;
        break;
      }
    }
  }
  if (incomeCol < 0) {
    console.warn(`[FY${year}] Could not detect BHC column. All headers:`);
    headerRow.forEach((h, i) => { if (h != null && h !== "") console.warn(`  [${i}] ${h}`); });
    throw new Error(`[FY${year}] Cannot find BHC income column`);
  } else {
    console.log(`[FY${year}] BHC income column ${incomeCol}: "${headerRow[incomeCol]}"`);
  }

  // Detect weekly values (FY2014 uses weekly £ not annual £)
  const colHeader = String(headerRow[incomeCol] ?? "").toLowerCase();
  const isWeekly = colHeader.includes("week") || !colHeader.includes("annual");
  if (isWeekly) console.log(`[FY${year}] Values appear weekly — will multiply by 52`);

  // Build map
  const map = new Map<string, number>();
  for (let r = dataStartRow; r < sheetRows.length; r++) {
    const row = sheetRows[r] as unknown[];
    const code = String(row[msoaCol] ?? "").trim();
    if (!/^E0[1-9]\d{6}$/.test(code)) continue;
    const raw = row[incomeCol];
    const rawIncome = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    if (!isNaN(rawIncome) && rawIncome > 0) {
      map.set(code, isWeekly ? Math.round(rawIncome * 52) : rawIncome);
    }
  }

  console.log(`[FY${year}] Parsed ${map.size} MSOAs`);
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const result: Record<string, Record<string, number>> = {};

  // Download sequentially to avoid hammering ONS servers
  for (const { year, url } of RELEASES) {
    const map = await parseRelease(year, url);
    for (const [msoaCode, income] of map) {
      if (!result[msoaCode]) result[msoaCode] = {};
      result[msoaCode][String(year)] = income;
    }
  }

  const msoas = Object.keys(result).length;
  const years = RELEASES.map(r => r.year);
  console.log(`\nTotal MSOAs: ${msoas}`);
  console.log(`Years: ${years.join(", ")}`);
  console.log(`Writing ${OUT_PATH}…`);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result));

  console.log(`Done. File size: ${(fs.statSync(OUT_PATH).size / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
