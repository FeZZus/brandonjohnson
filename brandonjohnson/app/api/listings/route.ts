import { NextResponse } from "next/server";
import { searchPropertyListings } from "@/lib/searchPropertyListings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_idea, postcode } = body;

    const res = await Promise.all([
      searchPropertyListings(business_idea, postcode),
    ]);
    return NextResponse.json({
      listings: res,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to search for property listings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
