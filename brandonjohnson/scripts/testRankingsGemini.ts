import "dotenv/config";
import { rankSquares } from "../lib/rankingsGemini";
import { SearchProposalsResult } from "../lib/searchProposals";

// ── Sample data (real output from searchProposals for a central London grid) ──

const SAMPLE_CELLS = [
  {
    approvalRateResult: [
      { name: "2021", approvalRate: 85.31 },
      { name: "2022", approvalRate: 81.46 },
      { name: "2023", approvalRate: 80.74 },
      { name: "2024", approvalRate: 76.10 },
      { name: "2025", approvalRate: 80.13 },
      { name: "2026", approvalRate: 80.00 },
    ],
    businessCategoryChartPoints: [
      { name: "Residential", value: 25 },
      { name: "Restaurant", value: 17 },
      { name: "Bar", value: 6 },
      { name: "Entertainment", value: 8 },
      { name: "Beauty", value: 9 },
      { name: "Gym", value: 3 },
      { name: "Retail", value: 15 },
      { name: "Gallery", value: 3 },
      { name: "Office", value: 28 },
      { name: "Casino", value: 4 },
      { name: "Hotel", value: 5 },
      { name: "Embassy", value: 2 },
    ],
    newHousesOverPeriod: 16,
    incomeGraphPoints: [
      { name: "2014", value: 48880 },
      { name: "2016", value: 51300 },
      { name: "2018", value: 46900 },
      { name: "2020", value: 56000 },
      { name: "2023", value: 48724 },
    ],
  },
  {
    approvalRateResult: [
      { name: "2021", approvalRate: 85.34 },
      { name: "2022", approvalRate: 80.29 },
      { name: "2023", approvalRate: 83.46 },
      { name: "2024", approvalRate: 83.87 },
      { name: "2025", approvalRate: 74.35 },
      { name: "2026", approvalRate: 80.00 },
    ],
    businessCategoryChartPoints: [
      { name: "Restaurant", value: 15 },
      { name: "Gallery", value: 3 },
      { name: "Retail", value: 13 },
      { name: "Office", value: 17 },
      { name: "Entertainment", value: 5 },
      { name: "Bar", value: 7 },
      { name: "Gym", value: 4 },
      { name: "Residential", value: 18 },
      { name: "Casino", value: 2 },
      { name: "Beauty", value: 7 },
      { name: "Hotel", value: 4 },
      { name: "Embassy", value: 2 },
    ],
    newHousesOverPeriod: 14,
    incomeGraphPoints: [
      { name: "2014", value: 48880 },
      { name: "2016", value: 51300 },
      { name: "2018", value: 46900 },
      { name: "2020", value: 56000 },
      { name: "2023", value: 48724 },
    ],
  },
  {
    approvalRateResult: [
      { name: "2021", approvalRate: 88.88 },
      { name: "2022", approvalRate: 83.33 },
      { name: "2023", approvalRate: 85.71 },
      { name: "2024", approvalRate: 86.53 },
      { name: "2025", approvalRate: 93.10 },
      { name: "2026", approvalRate: 83.33 },
    ],
    businessCategoryChartPoints: [
      { name: "Gallery", value: 3 },
      { name: "Office", value: 3 },
      { name: "Residential", value: 2 },
      { name: "Retail", value: 2 },
      { name: "Beauty", value: 2 },
      { name: "Restaurant", value: 1 },
      { name: "Hotel", value: 1 },
      { name: "Embassy", value: 2 },
    ],
    newHousesOverPeriod: 0,
    incomeGraphPoints: [], // no MSOA data for this square
  },
  {
    approvalRateResult: [
      { name: "2021", approvalRate: 89.13 },
      { name: "2022", approvalRate: 73.46 },
      { name: "2023", approvalRate: 84.31 },
      { name: "2024", approvalRate: 87.75 },
      { name: "2025", approvalRate: 82.35 },
      { name: "2026", approvalRate: 75.00 },
    ],
    businessCategoryChartPoints: [
      { name: "Entertainment", value: 2 },
      { name: "Gallery", value: 1 },
      { name: "Office", value: 3 },
      { name: "Restaurant", value: 4 },
      { name: "Retail", value: 3 },
      { name: "Residential", value: 3 },
      { name: "Beauty", value: 3 },
      { name: "Bar", value: 3 },
      { name: "Hotel", value: 2 },
      { name: "Embassy", value: 2 },
    ],
    newHousesOverPeriod: 3,
    incomeGraphPoints: [
      { name: "2014", value: 48880 },
      { name: "2016", value: 51300 },
      { name: "2018", value: 46900 },
      { name: "2020", value: 56000 },
      { name: "2023", value: 48724 },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const businessInfo = "A boutique artisanal coffee shop targeting professionals and local residents.";

  const data: SearchProposalsResult = {
    cellDataArray: SAMPLE_CELLS.map(cell => ({
      lat: 0,
      lng: 0,
      size_meters: 500,
      results: { all: [], filtered: [], ...cell },
    })),
  };

  console.error("Sending to Gemini…");

  const rankings = await rankSquares(businessInfo, data);

  console.log("\nRaw rankings from Gemini:\n");
  console.log(JSON.stringify(rankings, null, 2));

  console.log("\nSorted best → worst:");
  const sorted = [...rankings].sort((a, b) => b.score - a.score);
  for (const r of sorted) {
    console.log(`  Square ${r.squareIndex}: ${r.score}/100`);
  }
}

main().catch(console.error);
