import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: lat and lng must be numbers' },
        { status: 400 }
      );
    }

    const postcode = await reverseGeocode(lat, lng);
    return NextResponse.json({ postcode });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to reverse geocode',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
