import "dotenv/config";
import { searchProposals } from "../lib/searchProposals";
import { rankSquares } from "../lib/rankingsGemini";
import { justifySquare } from "../lib/justificationGemini";

// ── Main ──────────────────────────────────────────────────────────────────────
// Usage: npx tsx scripts/testFullFlow.ts <lat> <lng>
// e.g.   npx tsx scripts/testFullFlow.ts 51.5074 -0.1276

async function main() {
  const lat = parseFloat(process.argv[2] ?? "");
  const lng = parseFloat(process.argv[3] ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    console.error("Usage: npx tsx scripts/testFullFlow.ts <lat> <lng>");
    console.error("  e.g. npx tsx scripts/testFullFlow.ts 51.5074 -0.1276");
    process.exit(1);
  }

  const businessInfo = "A boutique artisanal coffee shop targeting professionals and local residents.";

  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  const dateFrom = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);

  // Step 1: fetch planning data
  console.error(`\n[1/3] Fetching planning data for ${lat}, ${lng}…`);
  const { cellDataArray } = await searchProposals({ lat, lng, radius: 1, dateFrom, dateTo });
  console.error(`      Got ${cellDataArray.length} cells.`);

  // Step 2: rank squares
  console.error("\n[2/3] Ranking squares with Gemini…");
  const rankings = await rankSquares(businessInfo, { cellDataArray });
  const sorted = [...rankings].sort((a, b) => b.score - a.score);

  console.log("\nRankings (best → worst):");
  for (const r of sorted) {
    console.log(`  Square ${r.squareIndex}: ${r.score}/100`);
  }

  // Step 3: justify the top square
  const top = sorted[0];
  const topSquareData = cellDataArray[top.squareIndex - 1]?.results;

  if (!topSquareData) {
    console.error(`Could not find data for top square index ${top.squareIndex}`);
    process.exit(1);
  }

  console.error(`\n[3/3] Justifying top square (Square ${top.squareIndex}, score ${top.score}) with Gemini…`);
  const justification = await justifySquare(businessInfo, topSquareData, top.score);

  console.log(`\nJustification for Square ${top.squareIndex} (score ${top.score}/100):`);
  console.log(justification);
}

main().catch(console.error);
