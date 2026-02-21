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
  radiusMeters: number;    // half-side of the bounding square
  targetCellSize?: number; // defaults to 500
}): GridResult {
  const { lat, lng, radiusMeters } = params;
  const targetCellSize = params.targetCellSize ?? 500;

  // Number of cells per side: round to nearest int so cells fill the square exactly (Option A)
  const n = Math.max(1, Math.round((2 * radiusMeters) / targetCellSize));
  const cellSizeMeters = (2 * radiusMeters) / n;

  // Degrees per metre, corrected for latitude on the longitude axis
  const latDegPerM = 1 / 111_000;
  const lngDegPerM = 1 / (111_000 * Math.cos((lat * Math.PI) / 180));

  const cellLatDeg = cellSizeMeters * latDegPerM;
  const cellLngDeg = cellSizeMeters * lngDegPerM;

  // NW corner of the bounding square
  const topLeftLat = lat + radiusMeters * latDegPerM;
  const topLeftLng = lng - radiusMeters * lngDegPerM;

  const cells: GridCell[] = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      cells.push({
        row,
        col,
        lat: parseFloat((topLeftLat - (row + 0.5) * cellLatDeg).toFixed(6)),
        lng: parseFloat((topLeftLng + (col + 0.5) * cellLngDeg).toFixed(6)),
      });
    }
  }

  return { cells, numRows: n, numCols: n, cellSizeMeters };
}
