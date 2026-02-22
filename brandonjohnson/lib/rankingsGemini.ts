import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {SearchProposalsResult } from "./searchProposals"

// Source - https://stackoverflow.com/a/69288824
// Posted by MHebes, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-22, License - CC BY-SA 4.0

// https://colab.research.google.com/github/GoogleCloudPlatform/generative-ai/blob/main/gemini/function-calling/forced_function_calling.ipynb

//

/*
[
  {
    approvalRateResult: [
      { name: '2021', approvalRate: 85.3146853146853 },
      { name: '2022', approvalRate: 81.46067415730337 },
      { name: '2023', approvalRate: 80.74534161490683 },
      { name: '2024', approvalRate: 76.10062893081762 },
      { name: '2025', approvalRate: 80.13698630136986 },
      { name: '2026', approvalRate: 80 }
    ],
    businessCategoryChartPoints: [
      { name: 'Residential', value: 25 },
      { name: 'Restaurant', value: 17 },
      { name: 'Bar', value: 6 },
      { name: 'Entertainment', value: 8 },
      { name: 'Beauty', value: 9 },
      { name: 'Gym', value: 3 },
      { name: 'Retail', value: 15 },
      { name: 'Gallery', value: 3 },
      { name: 'Office', value: 28 },
      { name: 'Casino', value: 4 },
      { name: 'Hotel', value: 5 },
      { name: 'Embassy', value: 2 }
    ],
    newHousesOverPeriod: 16,
    incomeGraphPoints: [
      { name: '2014', value: 48880 },
      { name: '2016', value: 51300 },
      { name: '2018', value: 46900 },
      { name: '2020', value: 56000 },
      { name: '2023', value: 48724 }
    ]
  },
  {
    approvalRateResult: [
      { name: '2021', approvalRate: 85.34482758620689 },
      { name: '2022', approvalRate: 80.2919708029197 },
      { name: '2023', approvalRate: 83.46456692913385 },
      { name: '2024', approvalRate: 83.87096774193549 },
      { name: '2025', approvalRate: 74.35897435897436 },
      { name: '2026', approvalRate: 80 }
    ],
    businessCategoryChartPoints: [
      { name: 'Restaurant', value: 15 },
      { name: 'Gallery', value: 3 },
      { name: 'Retail', value: 13 },
      { name: 'Office', value: 17 },
      { name: 'Entertainment', value: 5 },
      { name: 'Bar', value: 7 },
      { name: 'Gym', value: 4 },
      { name: 'Residential', value: 18 },
      { name: 'Casino', value: 2 },
      { name: 'Beauty', value: 7 },
      { name: 'Hotel', value: 4 },
      { name: 'Embassy', value: 2 }
    ],
    newHousesOverPeriod: 14,
    incomeGraphPoints: [
      { name: '2014', value: 48880 },
      { name: '2016', value: 51300 },
      { name: '2018', value: 46900 },
      { name: '2020', value: 56000 },
      { name: '2023', value: 48724 }
    ]
  },
  {
    approvalRateResult: [
      { name: '2021', approvalRate: 88.88888888888889 },
      { name: '2022', approvalRate: 83.33333333333334 },
      { name: '2023', approvalRate: 85.71428571428571 },
      { name: '2024', approvalRate: 86.53846153846155 },
      { name: '2025', approvalRate: 93.10344827586206 },
      { name: '2026', approvalRate: 83.33333333333334 }
    ],
    businessCategoryChartPoints: [
      { name: 'Gallery', value: 3 },
      { name: 'Office', value: 3 },
      { name: 'Residential', value: 2 },
      { name: 'Retail', value: 2 },
      { name: 'Beauty', value: 2 },
      { name: 'Restaurant', value: 1 },
      { name: 'Hotel', value: 1 },
      { name: 'Embassy', value: 2 }
    ],
    newHousesOverPeriod: 0,
    incomeGraphPoints: []
  },
  {
    approvalRateResult: [
      { name: '2021', approvalRate: 89.13043478260869 },
      { name: '2022', approvalRate: 73.46938775510205 },
      { name: '2023', approvalRate: 84.31372549019608 },
      { name: '2024', approvalRate: 87.75510204081633 },
      { name: '2025', approvalRate: 82.35294117647058 },
      { name: '2026', approvalRate: 75 }
    ],
    businessCategoryChartPoints: [
      { name: 'Entertainment', value: 2 },
      { name: 'Gallery', value: 1 },
      { name: 'Office', value: 3 },
      { name: 'Restaurant', value: 4 },
      { name: 'Retail', value: 3 },
      { name: 'Residential', value: 3 },
      { name: 'Beauty', value: 3 },
      { name: 'Bar', value: 3 },
      { name: 'Hotel', value: 2 },
      { name: 'Embassy', value: 2 }
    ],
    newHousesOverPeriod: 3,
    incomeGraphPoints: [
      { name: '2014', value: 48880 },
      { name: '2016', value: 51300 },
      { name: '2018', value: 46900 },
      { name: '2020', value: 56000 },
      { name: '2023', value: 48724 }
    ]
  }
]
*/
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

// square, number
const squareRankingSchema = z.object({ squareIndex: z.number().describe("The index that the square is in, in the list of all squares"), score: z.number().describe("The score the square area gets, out of 100.")});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// get all relevant analytics - needs to be written

const prompt = function buildPrompt(businessInfo, squaresString) { // are these params correct?
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

For each square, provide:
- Score (0-100)

Explanation of square data:
For each grid square:

approvalRateResult
This is a time series showing the percentage of planning applications that were approved in each year.

year represents the year.

approvalRate represents the percentage of approved applications in that year.
Higher values indicate a more permissive planning environment.

businessCategoryChartPoints
This shows the number of existing businesses in each category within the square.

businessCategory represents the business category (e.g., Restaurant, Retail, Office).

businessNumbers represents how many businesses of that type currently operate in the area.
This indicates the level of commercial activity and competition.

newHousesOverPeriod
This is the total number of new residential housing units approved or built in the area over the measured period.
Higher values indicate population growth and future customer potential.

incomeGraphPoints
This is a time series of average household income in the area.

year represents the year.

averageIncome represents the average income in pounds for that year.
Higher values indicate stronger local purchasing power.

Missing or Empty Data
If incomeGraphPoints is empty, it means income data is unavailable for that square.
This should be treated as uncertainty and considered in scoring.

SQUARE DATA:
${squaresString}
`;
};

// Call Gemini
// to be passed into justificationGemini later...
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(squareRankingSchema),
  },
});

// Convert to object
const ranking = JSON.parse(response.text);

console.log(ranking);