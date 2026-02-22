import { GoogleGenAI } from "@google/genai";
import { SearchProposalsResult } from "./searchProposals";
import pLimit from "p-limit";

type SquareResults = SearchProposalsResult["cellDataArray"][number]["results"];
type RankingResult = { squareIndex: number; score: number };
type IndexedCell = {
  originalIndex: number;
  results: SquareResults;
};

const DEFAULT_BATCH_COUNT = 2;
const MAX_BATCH_CONCURRENCY = 4;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function makeSquareString(results: SquareResults, squareIndex: number): string {
  const approvals = results.approvalRateResult
    .map(p => `${p.name}:${p.approvalRate.toFixed(1)}`)
    .join('|') || 'na';

  const businesses = results.businessCategoryChartPoints
    .map(p => `${p.name}:${p.value}`)
    .join('|') || 'na';

  const income = results.incomeGraphPoints.length > 0
    ? results.incomeGraphPoints.map(p => `${p.name}:${Math.round(p.value)}`).join('|')
    : 'na';

  return `sq=${squareIndex};appr=${approvals};biz=${businesses};homes=${results.newHousesOverPeriod};inc=${income}`;
}

function makeSquaresString(data: SearchProposalsResult): string {
  return data.cellDataArray
    .map((cell, index) => makeSquareString(cell.results, index + 1))
    .join('\n');
}

function makeSquaresStringFromIndexedCells(cells: IndexedCell[]): string {
  return cells
    .map((cell) => makeSquareString(cell.results, cell.originalIndex + 1))
    .join("\n");
}

function toBatchCount(batchCount?: number): number {
  if (!Number.isFinite(batchCount)) {
    return DEFAULT_BATCH_COUNT;
  }
  return Math.max(1, Math.floor(batchCount!));
}

function buildInterleavedBatches(data: SearchProposalsResult, batchCount: number): IndexedCell[][] {
  const safeBatchCount = toBatchCount(batchCount);
  const batches: IndexedCell[][] = Array.from({ length: safeBatchCount }, () => []);

  data.cellDataArray.forEach((cell, index) => {
    batches[index % safeBatchCount].push({
      originalIndex: index,
      results: cell.results,
    });
  });

  return batches.filter((batch) => batch.length > 0);
}

function buildPrompt(businessInfo: string, squaresString: string): string {
  return `
Role: UK small-business location analyst.
Goal: rank each area for a new small commercial business.

Output:
- Return JSON array only.
- Include all areas exactly once.
- Score must be a number from 0 to 100.

Scoring considerations (in order of importance):
- Higher local income -> stronger customer spending power
- Higher planning approval rate -> permissive environment
- More commercial variety -> footfall (but more competition)
- More pending residential applications -> future customers

Data format per line:
- sq=index (1-based)
- appr=year:approvalPct|... OR na
- biz=category:count|... OR na
- homes=number
- inc=year:avgIncomeGBP|... OR na

Rules:
- Use only provided data; no external assumptions.
- If inc=na, apply a modest uncertainty penalty (do not set score to 0 just for missing income).
- Prefer relative differences across area over absolute optimism.

Business proposal:
${businessInfo}

Area data:
${squaresString}
`;
}

const rankingSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      squareIndex: { type: "number", description: "1-based index matching the Square number in the data" },
      score: { type: "number", description: "Location score 0-100, where 100 is ideal" },
    },
    required: ["squareIndex", "score"],
  },
};

export async function rankSquares(
  businessInfo: string,
  data: SearchProposalsResult,
  options?: { batchCount?: number }
): Promise<RankingResult[]> {
  const safeBatchCount = toBatchCount(options?.batchCount);

  if (safeBatchCount === 1) {
    const squaresString = makeSquaresString(data);
    const prompt = buildPrompt(businessInfo, squaresString);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: rankingSchema,
      },
    });

    return JSON.parse(response.text!) as RankingResult[];
  }

  const batches = buildInterleavedBatches(data, safeBatchCount);
  const limit = pLimit(Math.min(MAX_BATCH_CONCURRENCY, batches.length));

  const batchResponses = await Promise.all(
    batches.map((batch) =>
      limit(async () => {
        const batchSquaresString = makeSquaresStringFromIndexedCells(batch);
        const prompt = buildPrompt(businessInfo, batchSquaresString);

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: rankingSchema,
          },
        });

        return JSON.parse(response.text!) as RankingResult[];
      })
    )
  );

  const maxSquareIndex = data.cellDataArray.length;
  const bySquare = new Map<number, number>();

  for (const batchResults of batchResponses) {
    for (const item of batchResults) {
      if (!Number.isFinite(item.squareIndex) || !Number.isFinite(item.score)) {
        continue;
      }
      if (item.squareIndex < 1 || item.squareIndex > maxSquareIndex) {
        continue;
      }
      bySquare.set(item.squareIndex, item.score);
    }
  }

  if (bySquare.size !== maxSquareIndex) {
    throw new Error(
      `Ranking response incomplete. Expected ${maxSquareIndex} squares, received ${bySquare.size}.`
    );
  }

  return Array.from(bySquare.entries())
    .map(([squareIndex, score]) => ({ squareIndex, score }))
    .sort((a, b) => a.squareIndex - b.squareIndex);
}
