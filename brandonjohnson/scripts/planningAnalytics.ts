import "dotenv/config";

const BASE_URL = "https://ibex.seractech.co.uk";
const PAGE_SIZE = 5000;

// ── Types ────────────────────────────────────────────────────────────────────

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

type YearStats = {
  total: number;
  approved: number;
  refused: number;
  withdrawn: number;
  pending: number;
  other: number;
};

// ── Business type keywords (same as searchNewBusinessSites) ──────────────────

const USE_TYPES: Record<string, string[]> = {
  Restaurant: [
    "restaurant", "café", "cafe", "brasserie", "eatery",
    "hot food take away", "takeaway", "food and drink",
  ],
  Bar: ["wine bar", "bar ", "pub ", "cocktail", "jazz venue", "ice bar"],
  Hotel: ["hotel", "hostel", "serviced apartment"],
  Casino: ["casino", "gaming centre", "adult gaming"],
  Office: ["office", "class e(g)", "class e (g)"],
  Retail: ["retail", "shop", "class e(a)", "class e (a)"],
  Gym: ["gym", "fitness", "health club"],
  Entertainment: ["cinema", "theatre", "music venue", "visitor attraction", "ice art"],
  Gallery: ["gallery", "display of works of art", "fine art"],
  Residential: ["residential", "dwelling", "flat", "hmo"],
  Embassy: ["embassy"],
  Beauty: ["beauty", "massage", "spa"],
} as const;

// ── API fetch (paginated) ────────────────────────────────────────────────────

async function fetchAllApplications(params: {
  lng: number;
  lat: number;
  radius: number;
  dateFrom: string;
  dateTo: string;
}): Promise<{ applications: Application[]; pages: number }> {
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
      // No filters — fetch all application types
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
      throw new Error(`API error: ${json.error ?? "unknown"} — ${json.message ?? ""}`);
    }

    applications.push(...json);

    if (json.length < PAGE_SIZE) break; // last page
    page++;
  }

  return { applications, pages: page };
}

// ── Analytics ────────────────────────────────────────────────────────────────

function runAnalytics(applications: Application[]) {
  const byYear: Record<string, YearStats> = {};

  for (const app of applications) {
    const year = app.application_date ? app.application_date.slice(0, 4) : "Unknown";

    if (!byYear[year]) {
      byYear[year] = { total: 0, approved: 0, refused: 0, withdrawn: 0, pending: 0, other: 0 };
    }

    const s = byYear[year];
    s.total++;

    const decision = app.normalised_decision;
    const isPending = app.decided_date === null;

    if (isPending) {
      s.pending++;
    } else if (decision === "Approved") {
      s.approved++;
    } else if (decision === "Refused") {
      s.refused++;
    } else if (decision === "Withdrawn") {
      s.withdrawn++;
    } else {
      s.other++;
    }
  }

  return byYear;
}

function filterByType(applications: Application[], keywords: string[]): Application[] {
  return applications.filter((app, _) => { 
    const proposal = app.proposal?.toLowerCase() ?? ""; 
    for (const kw of keywords) {
      if (proposal.includes(kw)){
        return true;
      }
    }
    return false;
  })
}

function countUseTypes(applications: Application[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    const proposal = app.proposal?.toLowerCase() ?? "";
    for (const [useType, keywords] of Object.entries(USE_TYPES)) {
      for (const kw of keywords) {
        if (proposal.includes(kw)) {
          counts[useType] = (counts[useType] ?? 0) + 1;
          break;
        }
      }
    }
  }
  return counts;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const lat = parseFloat(process.argv[2] ?? "");
  const lng = parseFloat(process.argv[3] ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    console.error("Usage: npx tsx scripts/planningAnalytics.ts <lat> <lng>");
    console.error("  e.g. npx tsx scripts/planningAnalytics.ts 51.5074 -0.1276");
    process.exit(1);
  }

  const radius = 500;
  const yearsBack = 5;

  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  const dateFrom = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);

  console.error(`Fetching applications… [${lng}, ${lat}] r=${radius}m | ${dateFrom} → ${dateTo}`);

  const { applications, pages } = await fetchAllApplications({ lng, lat, radius, dateFrom, dateTo });
  console.error(`Fetched: ${applications.length} (${pages} page${pages !== 1 ? "s" : ""})`);

  const byYear = runAnalytics(applications);
  const sortedYears = Object.keys(byYear).filter(y => y !== "Unknown").sort();
  if (byYear["Unknown"]) sortedYears.push("Unknown");

  const grandTotal = Object.values(byYear).reduce((sum, s) => sum + s.total, 0);
  const threshold = grandTotal * 0.05;
  const significantYears = sortedYears.filter(y => byYear[y].total >= threshold);

  const output = {
    meta: {
      coordinates: [lng, lat],
      radius,
      dateFrom,
      dateTo,
      totalFetched: applications.length,
    },
    approvalsRejectionsByYear: significantYears.map(year => {
      const s = byYear[year];
      const denominator = s.approved + s.refused;
      return {
        year,
        total: s.total,
        approved: s.approved,
        refused: s.refused,
        withdrawn: s.withdrawn,
        pending: s.pending,
        other: s.other,
        approvalRate: denominator > 0
          ? parseFloat(((s.approved / denominator) * 100).toFixed(1))
          : null,
      };
    }),
    businessTypeBreakdown: Object.entries(countUseTypes(applications))
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
