import { GoogleGenAI } from "@google/genai";
import { SearchProposalsResult } from "./searchProposals";

// Source - https://stackoverflow.com/a/69288824
// Posted by MHebes, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-22, License - CC BY-SA 4.0

// https://colab.research.google.com/github/GoogleCloudPlatform/generative-ai/blob/main/gemini/function-calling/forced_function_calling.ipynb

function makeSquaresString(data: SearchProposalsResult): string {
  return data.cellDataArray.map((cell, index) => {
    const approvalLines = cell.results.approvalRateResult
      .map(p => `${p.name}: ${p.approvalRate.toFixed(2)}%`)
      .join('\n');

    const businessLines = cell.results.businessCategoryChartPoints
      .map(p => `${p.name}: ${p.value}`)
      .join('\n');

    const incomeLines = cell.results.incomeGraphPoints.length > 0
      ? cell.results.incomeGraphPoints.map(p => `${p.name}: £${p.value}`).join('\n')
      : '(no data)';

    return [
      `Square ${index + 1}`,
      `approvalRateResult:\n${approvalLines}`,
      `businessCategoryChartPoints:\n${businessLines}`,
      `newHousesOverPeriod: ${cell.results.newHousesOverPeriod}`,
      `incomeGraphPoints:\n${incomeLines}`,
    ].join('\n\n');
  }).join('\n\n');
}

function buildPrompt(businessInfo: string, squaresString: string): string {
  return `
You are a location analyst helping entrepreneurs find the best area to open a small business in the UK.

Business proposal:
${businessInfo}

You have been given data for grid squares, each covering approximately 500m × 500m.

Task:
Score each square from 0 to 100 as a location for a new small commercial business.
100 = ideal location.

Scoring considerations:
- Higher local income → stronger customer spending power
- Higher planning approval rate → permissive environment
- More commercial variety → footfall (but more competition)
- More pending residential applications → future customers

Explanation of square data:
For each grid square:

approvalRateResult
This is a time series showing the percentage of planning applications that were approved in each year.
Higher values indicate a more permissive planning environment.

businessCategoryChartPoints
This shows the number of existing businesses in each category within the square.
Indicates the level of commercial activity and competition.

newHousesOverPeriod
Total new residential housing units approved over the period.
Higher values indicate population growth and future customer potential.

incomeGraphPoints
Time series of average household income (£).
Higher values indicate stronger local purchasing power.
If empty, income data is unavailable — treat as uncertainty in scoring.

SQUARE DATA:
${squaresString}
`;
}

const rankingSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      squareIndex: { type: "number", description: "1-based index matching the Square number in the data" },
      score: { type: "number", description: "Location score 0–100, where 100 is ideal" },
    },
    required: ["squareIndex", "score"],
  },
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function rankSquares(
  businessInfo: string,
  data: SearchProposalsResult
): Promise<{ squareIndex: number; score: number }[]> {
  const squaresString = makeSquaresString(data);
  const prompt = buildPrompt(businessInfo, squaresString);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: rankingSchema,
    },
  });

  return JSON.parse(response.text!) as { squareIndex: number; score: number }[];
}
