import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// get all relevant analytics - needs to be written. Say it returns squareRanking

const prompt = function buildPrompt(businessInfo, squareRanking) { // are these params correct?
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

For this square, provide:
- 3-4 sentence explanation

SQUARE DATA:
${squares /* however it is */}
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
const justification = JSON.parse(response.text);

console.log(justification);