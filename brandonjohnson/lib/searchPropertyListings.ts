import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Initialize the Google Gen AI SDK
// It will automatically pick up the GEMINI_API_KEY from process.env

const ai = new GoogleGenAI({});

type PropertyListing = {
    address: string;
    link: string | undefined;
}

function parseListings(response: GenerateContentResponse): PropertyListing[] {
    // Split the response by newlines and trim whitespace
    let out: PropertyListing[] = [];
    if (response.candidates){
        response.candidates.forEach((candidate, index) => {
            // console.dir(candidate.groundingMetadata, { depth: null, colors: true });
            if (candidate.groundingMetadata) {
                const meta = candidate.groundingMetadata;
                meta.groundingSupports?.forEach((support) => {
                    if (support.groundingChunkIndices){
                        const idx = support.groundingChunkIndices[0];
                        if (support.segment) {
                            const start = support.segment.startIndex ? support.segment.startIndex : 0;
                            const end = support.segment.endIndex ? support.segment.endIndex : 0;
                            const address = response.text?.slice(start, end);
                            if (address) {
                                out.push({
                                    address: address,
                                    link: meta.groundingChunks?.at(idx)?.web?.uri
                                });
                            }
                        }
                    }
                });
            }
        });
    }
    return out;
}

/**
 * Searches for commercial property listings based on a business idea and UK postcode.
 *
 * @param {string} businessIdea - The type of business (e.g., "specialty coffee shop", "yoga studio")
 * @param {string} postcode - The UK postcode to search around (e.g., "E1 6AN")
 * @returns {Promise<PropertyListing[]>} - The parsed property listings
 */
export async function searchPropertyListings(businessIdea: string, postcode: string) {
    // Construct a prompt tailored to finding commercial real estate
    const prompt = 
`You are an expert UK commercial real estate assistant.

Your task is to find 3 real, currently active commercial property listings (to rent or buy) that are highly suitable for the provided business idea and located within the target postcode.

Search & Selection Guidelines:
1. First, analyze the provided business idea to determine the exact property classification required (retail, office, or industrial).
2. Search the web for verifiable, active listings strictly within the provided UK postcode.
3. You must rely on live web search data. Do not hallucinate, invent, or guess addresses.

Output Constraints:
- Output exactly 3 addresses, separated by a newline.
- Use absolute plaintext. 
- STRICTLY NO markdown, bullet points, numbers, introductory filler, or commentary. Output ONLY the addresses.

Example Output:
14 High Street, London, SW1A 1AA
Unit 3, Riverside Industrial Estate, London, SW1A 2BB
Floor 2, The Apex Building, London, SW1A 3CC

Business Idea: "${businessIdea}"; 

Target Postcode: ${postcode}`;

    try {
        const response = await ai.models.generateContent({
            // Using the flash model as it is fast and supports search grounding
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                // Enable the Google Search tool so Gemini can fetch live listings
                tools: [{ googleSearch: {} }],
                // // Optional: Adjust temperature for more factual, less creative responses
                // temperature: 0.2
            }
        });
        // console.dir(response, { depth: null, colors: true });
        return parseListings(response);
    } catch (error) {
        console.error("Error fetching property listings from Gemini API:", error);
        return [];
    }
}


// async function main() {
//     const businessIdea = "boutique artisanal bakery and cafe";
//     const postcode = "NW1 9HS";
//     console.log(`Searching live listings for a '${businessIdea}' near ${postcode}...\n`);
    
//     try {
//         const listings = await searchPropertyListings(businessIdea, postcode);
//         console.log("=== Recommended Listings ===");
//         console.log(listings);
//     } catch (error) {
//         console.log("Failed to retrieve listings.");
//     }
// }

// main();