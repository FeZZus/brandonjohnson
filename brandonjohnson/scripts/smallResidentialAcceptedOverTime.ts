/**
 * Small residential accepted planning applications over time
 *
 * Given a location (lat/lng or UK postcode), fetches planning applications from the
 * Ibex SERAC API with:
 *   - normalised_application_type: "full planning application"
 *   - project_type: "small residential" (filtered client-side if not supported in API)
 *   - normalised_decision: "Approved"
 * and outputs counts by year for graphing.
 *
 * Usage:
 *   npx tsx scripts/smallResidentialAcceptedOverTime.ts <lat> <lng> [radius_m] [years_back]
 *   npx tsx scripts/smallResidentialAcceptedOverTime.ts <postcode> [radius_m] [years_back]
 *
 * Example:
 *   npx tsx scripts/smallResidentialAcceptedOverTime.ts 51.5074 -0.1276 500 10
 *   npx tsx scripts/smallResidentialAcceptedOverTime.ts "SW1A 1AA" 500 10
 *
 * Requires: IBEX_API_KEY in environment (or .env)
 */

import "dotenv/config";

const BASE_URL = "https://ibex.seractech.co.uk";
const PAGE_SIZE = 5000;

// ── Types (from SERAC API guide) ─────────────────────────────────────────────

type Application = {
  planning_reference: string;
  council_name: string;
  proposal: string | null;
  raw_address: string | null;
  raw_application_type: string | null;
  normalised_application_type: string;
  application_date: string | null;
  decided_date: string | null;
  normalised_decision: string;
  geometry: string;
  url: string;
  heading?: string | null;
  project_type?: string | null;
  num_new_houses?: number | null;
};

type YearCount = {
  year: string;
  acceptedCount: number;
};

// ── Geocode postcode (optional, for "location" as postcode) ───────────────────

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const q = postcode.trim().replace(/\s+/g, " ") + ", UK";
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
    { headers: { "User-Agent": "BrandonJohnson/1.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// ── API: fetch with filters ──────────────────────────────────────────────────

async function fetchApplications(params: {
  lng: number;
  lat: number;
  radius: number;
  dateFrom: string;
  dateTo: string;
}): Promise<Application[]> {
  const token = process.env.IBEX_API_KEY;
  if (!token) throw new Error("IBEX_API_KEY environment variable is not set");

  const applications: Application[] = [];
  let page = 1;

  while (true) {
    // Filters at top level (not inside input). Request project_type in extensions.
    const body: Record<string, unknown> = {
      input: {
        srid: 4326,
        coordinates: [params.lng, params.lat],
        radius: params.radius,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        date_range_type: "any",
        page,
        page_size: PAGE_SIZE,
      },
      extensions: {
        heading: true,
        project_type: true,
        num_new_houses: true,
        appeals: true,
      },
      // Normal shape: only normalised_application_type in filters; project_type is an extension field.
      // If your API allows project_type in filters, it looks like: project_type: ["small residential"]
      filters: {
        normalised_application_type: ["full planning application"],
        project_type: ["small residential"],
      } as Record<string, string[]>,
    };

    const res = await fetch(`${BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!Array.isArray(json)) {
      const err = json as { error?: string; message?: string };
      if (res.status === 400 || res.status === 403) {
        if (String(err.message ?? err.error ?? "").toLowerCase().includes("filter") || String(err.message ?? err.error ?? "").includes("project_type")) {
          throw new Error(
            "API may not support project_type in filters. Use client-side filtering only (see script comment)."
          );
        }
      }
      throw new Error(`API error: ${err.error ?? "unknown"} — ${err.message ?? ""}`);
    }

    applications.push(...(json as Application[]));
    if (json.length < PAGE_SIZE) break;
    page++;
  }

  return applications;
}

/** Fetch without project_type in filters (fallback); filter client-side. */
async function fetchApplicationsNoProjectTypeFilter(params: {
  lng: number;
  lat: number;
  radius: number;
  dateFrom: string;
  dateTo: string;
}): Promise<Application[]> {
  const token = process.env.IBEX_API_KEY;
  if (!token) throw new Error("IBEX_API_KEY environment variable is not set");

  const applications: Application[] = [];
  let page = 1;

  while (true) {
    const body = {
      input: {
        srid: 4326,
        coordinates: [params.lng, params.lat],
        radius: params.radius,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        date_range_type: "any",
        page,
        page_size: PAGE_SIZE,
      },
      extensions: {
        heading: true,
        project_type: true,
        num_new_houses: true,
        appeals: true,
      },
      filters: {
        normalised_application_type: ["full planning application"],
      },
    };

    const res = await fetch(`${BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error(`API error: ${(json as { error?: string; message?: string }).error ?? "unknown"}`);
    }
    applications.push(...(json as Application[]));
    if (json.length < PAGE_SIZE) break;
    page++;
  }

  return applications;
}

// ── Filter & aggregate ──────────────────────────────────────────────────────

function filterAcceptedSmallResidential(apps: Application[]): Application[] {
  return apps.filter(
    (app) =>
      app.normalised_decision === "Approved" &&
      (app.project_type === "small residential" || app.project_type === "Small residential")
  );
}

function groupByDecidedYear(apps: Application[]): YearCount[] {
  const byYear: Record<string, number> = {};
  for (const app of apps) {
    const year = app.decided_date ? app.decided_date.slice(0, 4) : "Unknown";
    byYear[year] = (byYear[year] ?? 0) + 1;
  }
  const years = Object.keys(byYear).filter((y) => y !== "Unknown").sort();
  if (byYear["Unknown"]) years.push("Unknown");
  return years.map((year) => ({ year, acceptedCount: byYear[year] }));
}

// ── Simple ASCII bar chart ───────────────────────────────────────────────────

function barChart(data: YearCount[], width: number = 40): string {
  const max = Math.max(1, ...data.map((d) => d.acceptedCount));
  const lines = data.map(({ year, acceptedCount }) => {
    const barLen = Math.round((acceptedCount / max) * width);
    const bar = "█".repeat(barLen);
    return `  ${year}  ${bar} ${acceptedCount}`;
  });
  return ["Accepted small residential by year (decided_date):", "", ...lines].join("\n");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage:");
    console.error("  npx tsx scripts/smallResidentialAcceptedOverTime.ts <lat> <lng> [radius_m] [years_back]");
    console.error("  npx tsx scripts/smallResidentialAcceptedOverTime.ts <postcode> [radius_m] [years_back]");
    console.error("Example: npx tsx scripts/smallResidentialAcceptedOverTime.ts 51.5074 -0.1276 500 10");
    process.exit(1);
  }

  let lat: number;
  let lng: number;
  let radius = 500;
  let yearsBack = 10;

  const first = args[0];
  const second = args[1];

  if (second !== undefined && !Number.isNaN(parseFloat(first)) && !Number.isNaN(parseFloat(second))) {
    lat = parseFloat(first);
    lng = parseFloat(second);
    radius = parseInt(args[2] ?? "500", 10) || 500;
    yearsBack = parseInt(args[3] ?? "10", 10) || 10;
  } else {
    const coords = await geocodePostcode(first);
    if (!coords) {
      console.error("Could not geocode postcode:", first);
      process.exit(1);
    }
    lat = coords.lat;
    lng = coords.lng;
    radius = parseInt(args[1] ?? "500", 10) || 500;
    yearsBack = parseInt(args[2] ?? "10", 10) || 10;
  }

  const dateTo = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(new Date().getFullYear() - yearsBack, 0, 1).toISOString().slice(0, 10);

  console.error(`Location: ${lat}, ${lng} | radius: ${radius}m | ${dateFrom} → ${dateTo}`);

  let applications: Application[];
  try {
    applications = await fetchApplications({ lng, lat, radius, dateFrom, dateTo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("project_type") && msg.includes("filter")) {
      console.error("Fetching without project_type filter, filtering client-side...");
      applications = await fetchApplicationsNoProjectTypeFilter({ lng, lat, radius, dateFrom, dateTo });
    } else {
      throw e;
    }
  }

  const accepted = filterAcceptedSmallResidential(applications);
  const byYear = groupByDecidedYear(accepted);

  const result = {
    meta: {
      location: { lat, lng },
      radius,
      dateFrom,
      dateTo,
      totalFetched: applications.length,
      acceptedSmallResidential: accepted.length,
    },
    acceptedByYear: byYear,
  };

  console.log(JSON.stringify(result, null, 2));
  console.error("\n" + barChart(byYear));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
