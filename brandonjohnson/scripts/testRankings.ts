import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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

// ── Format squares into prompt text ──────────────────────────────────────────

function makeSquaresString(cells: typeof SAMPLE_CELLS): string {
  return cells.map((cell, index) => {
    const approvalLines = cell.approvalRateResult
      .map(p => `  ${p.name}: ${p.approvalRate.toFixed(2)}%`)
      .join("\n");

    const businessLines = cell.businessCategoryChartPoints
      .map(p => `  ${p.name}: ${p.value}`)
      .join("\n");

    const incomeLines = cell.incomeGraphPoints.length > 0
      ? cell.incomeGraphPoints.map(p => `  ${p.name}: £${p.value}`).join("\n")
      : "  (no data)";

    return [
      `Square ${index + 1}`,
      `approvalRateResult:\n${approvalLines}`,
      `businessCategoryChartPoints:\n${businessLines}`,
      `newHousesOverPeriod: ${cell.newHousesOverPeriod}`,
      `incomeGraphPoints:\n${incomeLines}`,
    ].join("\n\n");
  }).join("\n\n---\n\n");
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(businessInfo: string, squaresString: string): string {
  return `
You are a location analyst helping entrepreneurs find the best area to open a small business in the UK.

Business proposal:
${businessInfo}

You have been given data for ${SAMPLE_CELLS.length} grid squares, each covering approximately 500m × 500m.

Task:
Score each square from 0 to 100 as a location for a new small commercial business.
100 = ideal location.

Scoring considerations:
- Higher local income → stronger customer spending power
- Higher planning approval rate → permissive environment
- More commercial variety → footfall (but more competition)
- More new residential houses → future customers

Explanation of square data:

approvalRateResult
Time series of % planning applications approved each year. Higher = more permissive.

businessCategoryChartPoints
Count of existing businesses per category. Indicates commercial activity and competition.

newHousesOverPeriod
Total new residential units approved over the period. Higher = more population growth.

incomeGraphPoints
Time series of average household income (£). Higher = stronger purchasing power.
If empty, income data is unavailable — treat as uncertainty in scoring.

SQUARE DATA:
${squaresString}
`;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const rankingSchema = z.array(
  z.object({
    squareIndex: z.number().describe("1-based index matching the Square number in the data"),
    score: z.number().describe("Location score 0–100, where 100 is ideal"),
  })
);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

  const ai = new GoogleGenAI({ apiKey });

  const businessInfo = "A boutique artisanal coffee shop targeting professionals and local residents.";
  const squaresString = makeSquaresString(SAMPLE_CELLS);
  const prompt = buildPrompt(businessInfo, squaresString);

  console.error("Sending to Gemini…");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(rankingSchema),
    },
  });

  const rankings = JSON.parse(response.text!) as { squareIndex: number; score: number }[];

  console.log("\nRankings returned by Gemini:\n");
  console.log(JSON.stringify(rankings, null, 2));

  console.log("\nSorted best → worst:");
  const sorted = [...rankings].sort((a, b) => b.score - a.score);
  for (const r of sorted) {
    console.log(`  Square ${r.squareIndex}: ${r.score}/100`);
  }
}

main().catch(console.error);
