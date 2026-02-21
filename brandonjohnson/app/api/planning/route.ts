import { NextResponse } from "next/server";
import { analyseLocation } from "@/lib/planningApi";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lng, lat, radius, yearsBack } = body;

    if (typeof lng !== "number" || typeof lat !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: lng and lat must be numbers" },
        { status: 400 },
      );
    }

    const result = await analyseLocation({ lng, lat, radius, yearsBack });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch planning data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
