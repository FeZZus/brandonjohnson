import { NextResponse } from "next/server";
import { justifySquare } from "@/lib/justificationGemini";
import { SearchProposalsResult } from "@/lib/searchProposals";

type SquareResults = SearchProposalsResult["cellDataArray"][number]["results"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessInfo, squareData, score } = body;

    if (
      typeof businessInfo !== "string" ||
      typeof score !== "number" ||
      !squareData
    ) {
      return NextResponse.json(
        { error: "Missing required fields: businessInfo (string), squareData (object), score (number)" },
        { status: 400 },
      );
    }

    const justification = await justifySquare(businessInfo, squareData as SquareResults, score);

    return NextResponse.json({ justification });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate justification",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
