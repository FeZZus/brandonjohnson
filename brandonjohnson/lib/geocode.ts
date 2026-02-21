// Utility to geocode UK postcodes
// Uses Nominatim OpenStreetMap geocoding API (free, no key required)

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

export async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  try {
    // Clean postcode (remove spaces, uppercase)
    const cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, '');
    
    // UK postcode format: typically "SW1A 1AA" or "SW1A1AA"
    if (!/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(cleanPostcode)) {
      console.warn(`Invalid UK postcode format: ${postcode}`);
      return null;
    }
    // Use Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanPostcode)},+UK&limit=1`,
      {
        headers: {
          'User-Agent': 'BrandonJohnson/1.0', // Required by Nominatim
        },
      }
    );
    if (!response.ok) {
      console.error(`Geocoding failed: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No results for postcode: ${postcode}`);
      return null;
    }
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name || cleanPostcode,
    };
  } catch (error) {
    console.error(`Error geocoding postcode ${postcode}:`, error);
    return null;
  }
}

// Batch geocode multiple postcodes
export async function geocodePostcodes(
  postcodes: string[]
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();
  // Rate limit: Nominatim allows 1 request per second
  for (let i = 0; i < postcodes.length; i++) {
    const postcode = postcodes[i];
    const result = await geocodePostcode(postcode);
    if (result) {
      results.set(postcode, result);
    }
    // Wait 1.1 seconds between requests to respect rate limit
    if (i < postcodes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }
  return results;
}
