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
async function findPropertyListings(businessIdea: string, postcode: string) {
    // Construct a prompt tailored to finding commercial real estate
    const prompt = `Act as a commercial real estate assistant in the UK.
    I am looking for suitable commercial property listings (retail, office, or industrial depending on the business needs)     
    Please search the web for real, currently listed commercial properties to rent or buy in this specific area.
    Provide a newline-separated list of the top 5 most relevant listings.
    Just list the addresses in plaintext without any additional commentary or formatting.
    Base your search on: "${businessIdea}". 
    The listings should be in the UK postcode: ${postcode}.`;

    try {
        const response = await ai.models.generateContent({
            // Using the flash model as it is fast and supports search grounding
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                // Enable the Google Search tool so Gemini can fetch live listings
                tools: [{ googleSearch: {} }],
                // Optional: Adjust temperature for more factual, less creative responses
                temperature: 0.2 
            }
        });
        console.dir(response, { depth: null, colors: true });
        return parseListings(response);
    } catch (error) {
        console.error("Error fetching property listings from Gemini API:", error);
        throw error;
    }
}


async function main() {
    const businessIdea = "boutique artisanal bakery and cafe";
    const postcode = "NW1 9HS";
    console.log(`Searching live listings for a '${businessIdea}' near ${postcode}...\n`);
    
    try {
        const listings = await findPropertyListings(businessIdea, postcode);
        console.log("=== Recommended Listings ===");
        console.log(listings);
    } catch (error) {
        console.log("Failed to retrieve listings.");
    }
}

main();