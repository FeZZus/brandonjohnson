import { NextResponse } from "next/server";
import { getSmallResidentialAcceptedOverTime } from "@/lib/smallResidentialOverTime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, radius, yearsBack } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: lat and lng must be numbers" },
        { status: 400 }
      );
    }

    const result = await getSmallResidentialAcceptedOverTime({
      lat,
      lng,
      radius: typeof radius === "number" ? radius : 500,
      yearsBack: typeof yearsBack === "number" ? yearsBack : 10,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch small residential planning data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
