// ── Types ─────────────────────────────────────────────────────────────────────

export type GridCell = {
  row: number;
  col: number;
  lat: number;
  lng: number;
};

export type GridResult = {
  cells: GridCell[];
  numRows: number;
  numCols: number;
  cellSizeMeters: number;
};

// ── Main exported function ────────────────────────────────────────────────────

export function buildGrid(params: {
  lat: number;
  lng: number;
  radiusMeters: number;    // e.g., 500 -> 1 cell, 1000 -> 4 cells
  targetDiameter?: number; // defaults to 500
}): GridResult {
  const { lat, lng, radiusMeters } = params;
  const targetDiameter = params.targetDiameter ?? 500;

  // The math for your mapping:
  // 500 / 500 = 1 row/col (1 cell total)
  // 1000 / 500 = 2 rows/cols (4 cells total)
  const n = Math.max(1, Math.round(radiusMeters / targetDiameter));
  
  // This maintains your original logic of stretching/shrinking the cells 
  // slightly if radiusMeters isn't a perfect multiple of 500.
  const actualDiameterMeters = radiusMeters / n;

  // Degrees per metre, corrected for latitude on the longitude axis
  const latDegPerM = 1 / 111_000;
  const lngDegPerM = 1 / (111_000 * Math.cos((lat * Math.PI) / 180));

  const stepLatDeg = actualDiameterMeters * latDegPerM;
  const stepLngDeg = actualDiameterMeters * lngDegPerM;

  // NW corner of the bounding square.
  // Because 'radiusMeters' represents the total width/height of your grid now,
  // we move half that distance from the center to find the top-left corner.
  const topLeftLat = lat + (radiusMeters / 2) * latDegPerM;
  const topLeftLng = lng - (radiusMeters / 2) * lngDegPerM;

  const cells: GridCell[] = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      cells.push({
        row,
        col,
        lat: Math.round((topLeftLat - (row + 0.5) * stepLatDeg) * 1e6) / 1e6,
        lng: Math.round((topLeftLng + (col + 0.5) * stepLngDeg) * 1e6) / 1e6,
      });
    }
  }

  return { cells, numRows: n, numCols: n, cellSizeMeters: actualDiameterMeters };
}

// function main()
// {
//   const lat = parseFloat(process.argv[2] ?? "");
//   const lng = parseFloat(process.argv[3] ?? "");
//   const radius = parseFloat(process.argv[4] ?? "500");
//   if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
//     console.error("Usage: npx tsx scripts/buildGrid.ts <lat> <lng> <radiusMeters>");
//     console.error("  e.g. npx tsx scripts/buildGrid.ts 51.5074 -0.1276 500");
//     process.exit(1);
//   }
//   const result = buildGrid({ lat, lng, radiusMeters: radius });
//   console.dir(result, { depth: null, colors: true });
// }

// main()