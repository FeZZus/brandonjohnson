import { NextResponse } from 'next/server';

// Type for ranked postcode
export type RankedPostcode = {
  postcode: string;
  rank: number; // 1-5
  lat?: number; // Optional: if backend provides coordinates
  lng?: number; // Optional: if backend provides coordinates
  score?: number; // Optional: Gemini-generated suitability score
};

// In-memory store for ranked postcodes (in production, use a database)
let storedPostcodes: RankedPostcode[] = [];

// POST endpoint to receive ranked postcodes from backend
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Expecting array of 5 postcodes in ranking order
    // Can accept: { postcodes: [...] } or just [...]
    const postcodesInput: unknown = body.postcodes || body;
    
    // Validate we have an array
    if (!Array.isArray(postcodesInput)) {
      return NextResponse.json(
        { error: 'Expected array of postcodes' },
        { status: 400 }
      );
    }
    
    // Assign ranks if not provided
    const rankedPostcodes: RankedPostcode[] = postcodesInput.map((pc, index) => ({
      postcode: typeof pc === 'string' ? pc : pc.postcode,
      rank: typeof pc === 'string' ? index + 1 : (pc.rank || index + 1),
      lat: typeof pc === 'object' && pc !== null ? pc.lat : undefined,
      lng: typeof pc === 'object' && pc !== null ? pc.lng : undefined,
    }));
    
    // Store the postcodes
    storedPostcodes = rankedPostcodes;
    
    return NextResponse.json({ 
      success: true,
      postcodes: rankedPostcodes,
      message: `Received ${rankedPostcodes.length} ranked postcodes`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

// Default postcodes around central London for testing
const DEFAULT_POSTCODES: RankedPostcode[] = [
  { postcode: 'SW1A 1AA', rank: 1, lat: 51.4994, lng: -0.1248 }, // Westminster/Buckingham Palace area
  { postcode: 'WC2N 5DU', rank: 2, lat: 51.5074, lng: -0.1278 }, // Trafalgar Square
  { postcode: 'EC1A 1BB', rank: 3, lat: 51.5155, lng: -0.0922 }, // St. Paul's area
  { postcode: 'W1K 6TF', rank: 4, lat: 51.5074, lng: -0.1426 }, // Mayfair
  { postcode: 'SE1 9RT', rank: 5, lat: 51.5045, lng: -0.0865 }, // London Bridge area
];

// GET endpoint to retrieve current ranked postcodes
export async function GET() {
  // Return stored postcodes if available, otherwise return defaults
  const postcodes = storedPostcodes.length > 0 ? storedPostcodes : DEFAULT_POSTCODES;
  return NextResponse.json({ 
    postcodes: postcodes,
    count: postcodes.length 
  });
}
