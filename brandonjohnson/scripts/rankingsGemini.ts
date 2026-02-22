import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// get all relevant analytics - needs to be written

const prompt = function buildPrompt(businessInfo, squares) { // are these params correct?
  return `
You are a location analyst helping entrepreneurs find the best area to open a small business in the UK.

Business proposal:
${businessInfo}

You have been given data for ${squares.length} grid squares, each covering approximately 500m × 500m.

Task:
Score each square from 0 to 100 as a location for a new small commercial business.
100 = ideal location.

Scoring considerations:
- Higher local income → stronger customer spending power
- Higher planning approval rate → permissive environment
- More commercial variety → footfall (but more competition)
- More pending residential applications → future customers

For each square, provide:
- Score (0–100)

SQUARE DATA:
${squares}

`;
};

// Call Gemini
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
  },
});

// Convert to object
const ranking = JSON.parse(response.text);

console.log(ranking);