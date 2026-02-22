import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { location } = body;

        if (typeof location !== 'string' || location.trim().length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: location' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=gb`,
            {
                headers: {
                    'User-Agent': 'BrandonJohnson/1.0',
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Geocoding failed', statusText: response.statusText },
                { status: response.status }
            );
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ result: null });
        }

        const result = data[0];
        return NextResponse.json({
            result: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name || location,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to geocode location',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}