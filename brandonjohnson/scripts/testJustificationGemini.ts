import "dotenv/config";
import { justifySquare } from "../lib/justificationGemini";
import { SearchProposalsResult } from "../lib/searchProposals";

// ── Sample square (first of the 4 real London squares) ────────────────────────

const SAMPLE_SQUARE: SearchProposalsResult["cellDataArray"][number]["results"] = {
  all: [],
  filtered: [],
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
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const businessInfo = "A boutique artisanal coffee shop targeting professionals and local residents.";
  const score = process.argv[2] !== undefined ? parseInt(process.argv[2], 10) : 75;

  console.error(`Sending to Gemini… (score = ${score})`);

  const justification = await justifySquare(businessInfo, SAMPLE_SQUARE, score);

  console.log("\nJustification from Gemini:\n");
  console.log(justification);
}

main().catch(console.error);
