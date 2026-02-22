import { NextResponse } from "next/server";
import { rankSquares } from "@/lib/rankingsGemini";
import { SearchProposalsResult } from "@/lib/searchProposals";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessInfo, cellDataArray } = body;

    if (typeof businessInfo !== "string" || !Array.isArray(cellDataArray)) {
      return NextResponse.json(
        { error: "Missing required fields: businessInfo must be a string and cellDataArray must be an array" },
        { status: 400 },
      );
    }

    const data: SearchProposalsResult = { cellDataArray };
    const rankings = await rankSquares(businessInfo, data);

    return NextResponse.json({ rankings });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to rank squares",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
