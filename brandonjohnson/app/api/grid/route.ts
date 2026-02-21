import { NextResponse } from "next/server";
import { buildGrid } from "@/lib/grid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, radiusMeters, targetCellSize } = body;

    if (typeof lat !== "number" || typeof lng !== "number" || typeof radiusMeters !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: lat, lng and radiusMeters must be numbers" },
        { status: 400 },
      );
    }

    if (radiusMeters <= 0) {
      return NextResponse.json(
        { error: "radiusMeters must be greater than 0" },
        { status: 400 },
      );
    }

    const result = buildGrid({ lat, lng, radiusMeters, targetCellSize });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build grid",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
