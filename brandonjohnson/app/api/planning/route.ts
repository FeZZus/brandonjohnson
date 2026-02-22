import { NextResponse } from "next/server";
import { searchProposals } from "@/lib/searchProposals";
import { getIncomeForLatLng } from "@/lib/incomeApi";

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

    const now = new Date();
    const dateTo = now.toISOString().slice(0, 10);
    const dateFrom = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10);
    const [planningResult, incomeResult] = await Promise.all([
      searchProposals({ lng, lat, radius, dateFrom, dateTo }),
      getIncomeForLatLng({ lat, lng }),
    ]);
    return NextResponse.json({
      ...planningResult,
      income: incomeResult,
    });
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
