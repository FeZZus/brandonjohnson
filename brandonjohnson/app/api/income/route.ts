import { NextResponse } from "next/server";
import { getIncomeForLatLng } from "@/lib/incomeApi";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: lat and lng must be numbers" },
        { status: 400 },
      );
    }

    const result = await getIncomeForLatLng({ lat, lng });

    if (!result) {
      return NextResponse.json(
        { error: "No income data found for this location" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch income data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
