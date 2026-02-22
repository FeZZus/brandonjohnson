import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Need to make this print using an index!
function makeSquaresString(testval: SearchProposalsResult): string {
  return testval.cellDataArray.map((cell, index) => {
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

const prompt = function buildPrompt(businessInfo, squareRanking, squaresString) { // squareRanking is one entry in the json returned by the LLM in rankingsGemini
  return `
You are a location analyst helping justify the score out of 100 given to this area (for opening a small business in the UK).

User's business proposal:
${businessInfo}

You have been given data for a square with a score of ${squareRanking.score} .

Task:
Justify why this square has gotten the score it did.

Scoring considerations:
- Higher local income → stronger customer spending power
- Higher planning approval rate → permissive environment
- More commercial variety → footfall (but more competition)
- More pending residential applications → future customers

Explanation of square data:
For each grid square:

approvalRateResult
This is a time series showing the percentage of planning applications that were approved in each year.

name represents the year.

approvalRate represents the percentage of approved applications in that year.
Higher values indicate a more permissive planning environment.

businessCategoryChartPoints
This shows the number of existing businesses in each category within the square.

name represents the business category (e.g., Restaurant, Retail, Office).

value represents how many businesses of that type currently operate in the area.
This indicates the level of commercial activity and competition.

newHousesOverPeriod
This is the total number of new residential housing units approved or built in the area over the measured period.
Higher values indicate population growth and future customer potential.

incomeGraphPoints
This is a time series of average household income in the area.

name represents the year.

value represents the average income in pounds for that year.
Higher values indicate stronger local purchasing power.

Missing or Empty Data
If incomeGraphPoints is empty, it means income data is unavailable for that square.
This should be treated as uncertainty and considered in scoring.

For this square, provide:
- 1-2 sentence explanation

SQUARE DATA:
${squaresString}
`;
};

// Call Gemini
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json", // needs to return string !!
  },
});

// Convert to object
const justification = JSON.parse(response.text);

console.log(justification);