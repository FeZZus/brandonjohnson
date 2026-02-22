import { GoogleGenAI } from "@google/genai";
import { SearchProposalsResult } from "./searchProposals";

type SquareResults = SearchProposalsResult["cellDataArray"][number]["results"];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function makeSquareString(results: SquareResults): string {
  const approvals = results.approvalRateResult
    .map(p => `${p.name}:${p.approvalRate.toFixed(1)}`)
    .join('|') || 'na';

  const businesses = results.businessCategoryChartPoints
    .map(p => `${p.name}:${p.value}`)
    .join('|') || 'na';

  const income = results.incomeGraphPoints.length > 0
    ? results.incomeGraphPoints.map(p => `${p.name}:${Math.round(p.value)}`).join('|')
    : 'na';

  return `appr=${approvals};biz=${businesses};homes=${results.newHousesOverPeriod};inc=${income}`;
}

function buildPrompt(businessInfo: string, score: number, squareString: string): string {
  return `
Role: UK small-business location analyst.
Goal: explain why this area received its score.

Business proposal:
${businessInfo}

Scoring considerations (in order of importance):
- Higher local income -> stronger customer spending power
- Higher planning approval rate -> permissive environment
- More commercial variety -> footfall (but more competition)
- More pending residential applications -> future customers

Data format:
- appr=year:approvalPct|... (percent)
- biz=category:count|...
- homes=number
- inc=year:avgIncomeGBP|... OR na

Rules:
- Write exactly 1-2 sentences.
- Do not mention the numeric score.
- Don't be overly optimistic. If the score is low, focus on the weaknesses in the data rather than hypothetical positives.
- Use only provided data; no extra assumptions.
- If inc=na, mention income uncertainty briefly.

Area data:
${squareString}

Score to justify (context only, do not quote): ${score}
`;
}

const justificationSchema = {
  type: "object",
  properties: {
    justification: { type: "string" },
  },
  required: ["justification"],
};

export async function justifySquare(
  businessInfo: string,
  squareData: SquareResults,
  score: number
): Promise<string> {
  const squareString = makeSquareString(squareData);
  const prompt = buildPrompt(businessInfo, score, squareString);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingBudget: 0
      },
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: justificationSchema,
    },
  });

  const parsed = JSON.parse(response.text!) as { justification: string };
  return parsed.justification;
}
