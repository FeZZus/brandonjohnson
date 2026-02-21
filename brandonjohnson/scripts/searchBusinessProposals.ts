import "dotenv/config";

const BASE_URL = "https://ibex.seractech.co.uk";

type Appeal = {
  appeal_ref: string;
  appeal_url: string;
  case_type: string | null;
  decision: string | null;
  decision_date: string | null;
  start_date: string | null;
};

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
  appeals?: Appeal[] | null;
};

type UseTypeMatch = {
  application: Application;
  useType: string;
  matchedKeyword: string;
};

// --- Stage 1 filter constants ---

const BLOCKED_SUFFIXES = ["/TCH", "/TELCOM", "/ADV", "/TPO"];

const EXCLUDE_KEYWORDS = [
  // Modifications to existing buildings
  "extension", "alteration", "alterations", "refurb", "refurbishment",
  "replacement", "renovation", "modification", "rear addition",
  "loft conversion", "outbuilding",
  // Outdoor seating / street furniture
  "public highway", "tables and chairs", "parasol", "seating area",
  // Equipment installations (not buildings)
  "installation of", "mechanical plant", "ductwork", "shopfront",
  "telecommunications", "antenna", "atm",
  // Temporary / minor uses
  "temporary use", "information pod",
];

const REQUIRE_ONE_OF = [
  "change of use",
  "erection of",
  "construction of",
  "new build",
  "conversion of",
  "use of",
];

// --- Stage 2 use-type constants ---

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
};

type YearStats = {
  total: number;
  approved: number;
  refused: number;
  pending: number;
  approvalRate: number;
};

type RateGraphPoint = {
  name: string;
  approvalRate: number;
};

function genGraphPoints(applications: Application[]) {
  const byYear: Record<string, YearStats> = {};

  for (const app of applications) {
    if (!app.application_date){
      continue;
    }
    
    const year = app.application_date.slice(0, 4);

    if (!byYear[year]) {
      byYear[year] = { total: 0, approved: 0, refused: 0, pending: 0, approvalRate: 0 };
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
    }
  }
  for (const year in byYear) {
    if (byYear[year].total > 0) {
      byYear[year].approvalRate = byYear[year].approved / byYear[year].total * 100;
    }
  }
  const graphPoints: RateGraphPoint[] = Object.entries(byYear).map(([year, stats]) => ({
    name: year,
    approvalRate: stats.approvalRate,
  }));
  return graphPoints;
}

// --- Main function ---

async function searchBusinessProposals(params: {
  lng: number;
  lat: number;
  radius: number;        // metres, max 500
  dateFrom: string;      // ISO date e.g. "2015-01-01"
  dateTo: string;
  dateRangeType?: "validated" | "decided" | "any";
  pageSize?: number;     // max 5000
}): Promise<{
  all: Application[];
  filtered: Application[];
  useTypes: UseTypeMatch[];
  graphPoints: RateGraphPoint[];
}> {
  const token = process.env.IBEX_API_KEY;
  if (!token) throw new Error("IBEX_API_KEY environment variable is not set");

  const body = {
    input: {
      srid: 4326,
      coordinates: [params.lng, params.lat],
      radius: params.radius,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      date_range_type: params.dateRangeType ?? "any",
      page: 1,
      page_size: params.pageSize ?? 5000,
    },
    extensions: {
      heading: true,
      project_type: true,
      num_new_houses: true,
      appeals: true,
    },
    filters: {
      normalised_application_type: ["full planning application", "change of use"],
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
    throw new Error(`API error: ${json.error ?? "unknown"} — ${json.message ?? ""}`);
  }

  const all: Application[] = json;
  const dropReasons: Record<string, number> = {};
  const filtered: Application[] = [];

  for (const app of all) {
    // Stage 1a: blocked reference suffixes
    const ref = app.planning_reference.toUpperCase();
    if (BLOCKED_SUFFIXES.some((s) => ref.includes(s))) {
      dropReasons.blocked_suffix = (dropReasons.blocked_suffix ?? 0) + 1;
      continue;
    }

    // Stage 1b: home improvement project type
    if (app.project_type === "home improvement") {
      dropReasons.home_improvement = (dropReasons.home_improvement ?? 0) + 1;
      continue;
    }

    const proposal = app.proposal?.toLowerCase() ?? "";

    // Stage 1c: exclude keywords
    if (EXCLUDE_KEYWORDS.some((kw) => proposal.includes(kw))) {
      dropReasons.exclude_keyword = (dropReasons.exclude_keyword ?? 0) + 1;
      continue;
    }

    // Stage 1d: require at least one positive signal
    if (!REQUIRE_ONE_OF.some((kw) => proposal.includes(kw))) {
      dropReasons.no_positive_signal = (dropReasons.no_positive_signal ?? 0) + 1;
      continue;
    }

    filtered.push(app);
  }


  // Stage 2: use-type categorisation
  const useTypes: UseTypeMatch[] = [];
  for (const app of filtered) {
    const proposal = app.proposal?.toLowerCase() ?? "";
    for (const [useType, keywords] of Object.entries(USE_TYPES)) {
      for (const kw of keywords) {
        if (proposal.includes(kw)) {
          useTypes.push({ application: app, useType, matchedKeyword: kw });
          break; // one match per use-type per application
        }
      }
    }
  }

  // Stage 3: date categorisation
  const graphPoints = genGraphPoints(all);


  return { all, filtered, useTypes, graphPoints };
}


// --- Runner ---

async function main() {
  const lat = parseFloat(process.argv[2] ?? "");
  const lng = parseFloat(process.argv[3] ?? "");
  if (isNaN(lat) || isNaN(lng)) {
    console.error("Usage: npx tsx scripts/searchNewBusinessSites.ts <lat> <lng>");
    console.error("  e.g. npx tsx scripts/searchNewBusinessSites.ts 51.5074 -0.1276");
    process.exit(1);
  }

  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  const dateFrom = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);

  const result = await searchBusinessProposals({
    lng,
    lat,
    radius: 500,
    dateFrom,
    dateTo,
  });

  console.log(`Total from API:        ${result.all.length}`);
  console.log(`After stage 1 filter:  ${result.filtered.length}`);

  // console.log(`\nAll stage 1 results (${result.filtered.length}):`);
  // for (const app of result.filtered) {
  //   console.log(`  [${app.planning_reference}] ${app.proposal ?? "—"}`);
  // }

  // Group use-type matches by category
  const byUseType: Record<string, UseTypeMatch[]> = {};
  for (const m of result.useTypes) {
    (byUseType[m.useType] ??= []).push(m);
  }
  console.log(`\nBy use type (${result.useTypes.length} categorised):`);
  for (const [useType, matches] of Object.entries(byUseType)) {
    console.log(`  ${useType} (${matches.length}):`);
    // for (const m of matches) {
    //   console.log(`    [${m.application.planning_reference}] ${m.application.proposal ?? "—"}`);
    // }
  }
}

main().catch(console.error);
