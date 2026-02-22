import { buildGrid } from "./grid";
import { getIncomeForLatLng, IncomeGraphPoint } from "./incomeApi"
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

// const REQUIRE_ONE_OF = [
//   "change of use",
//   "erection of",
//   "construction of",
//   "new build",
//   "conversion of",
//   "use of",
// ];

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


function genApprovalRate(applications: Application[]) : RateGraphPoint[] {
  const byYear: Record<string, YearStats> = {};
  // const totalApproved = applications.filter((app) => app.normalised_decision === "Approved").length;
  // const avgApprovalRate = applications.length ? totalApproved / applications.length * 100 : 0;

  for (const app of applications) {
    if (!app.decided_date){
      continue;
    }
    
    const year = app.decided_date.slice(0, 4);

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
    approvalRate: Math.trunc(stats.approvalRate),
  }));
  return graphPoints;
}


type BusinessCategoryChartPoint = {
  name: string;
  value: number;
}

// --- Main function ---

async function searchProposalsGridCell(params: {
  lng: number;
  lat: number;
  radius_meters: number;
  dateFrom: string;      // ISO date e.g. "2015-01-01"
  dateTo: string;
  dateRangeType?: "validated" | "decided" | "any";
  pageSize?: number;     // max 5000
}): Promise<{
  all: Application[];
  filtered: Application[];
  businessCategoryChartPoints: BusinessCategoryChartPoint[];
  approvalRateResult: RateGraphPoint[];
  newHousesOverPeriod: number;
  incomeGraphPoints: IncomeGraphPoint[];
}> {
  const token = process.env.IBEX_API_KEY;
  if (!token) throw new Error("IBEX_API_KEY environment variable is not set");
  const body = {
    input: {
      srid: 4326,
      coordinates: [params.lng, params.lat],
      radius: params.radius_meters,
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
  const filtered: Application[] = [];

  for (const app of all) {
    // Stage 1a: blocked reference suffixes
    const ref = app.planning_reference.toUpperCase();
    // exclude blocked suffixes (e.g. telecom, advertisement) which are often noise and not new business sites
    if (BLOCKED_SUFFIXES.some((s) => ref.includes(s))) {
      continue;
    }

    // Stage 1b: home improvement project type
    if (app.project_type === "home improvement") {
      continue;
    }

    const proposal = app.proposal?.toLowerCase() ?? "";

    // Stage 1c: exclude keywords
    if (EXCLUDE_KEYWORDS.some((kw) => proposal.includes(kw))) {
      continue;
    }

    // // Stage 1d: require at least one positive signal
    // if (!REQUIRE_ONE_OF.some((kw) => proposal.includes(kw))) {
    //   continue;
    // }

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

  const byUseType: Record<string, UseTypeMatch[]> = {};
  for (const m of useTypes) {
    (byUseType[m.useType] ??= []).push(m);
  }


  const businessCategoryChartPoints: BusinessCategoryChartPoint[] = [];
  for (const [useType, matches] of Object.entries(byUseType)) {
    businessCategoryChartPoints.push({ name: useType, value: matches.length });
  }

  // Stage 3: date categorisation
  const approvalRateResult = genApprovalRate(all);

  const newHousesOverPeriod = all.reduce((sum, app) => sum + (app.num_new_houses ?? 0), 0);

  const incomeGraphPoints = await getIncomeForLatLng({ lat: params.lat, lng: params.lng });

  return { all, filtered, businessCategoryChartPoints, approvalRateResult, newHousesOverPeriod, incomeGraphPoints };
}


type CellData = {
  lat: number;
  lng: number;
  size_meters: number;
  results: Awaited<ReturnType<typeof searchProposalsGridCell>>;
}

export async function searchProposals(params: {
  lng: number;
  lat: number;
  radius: number;     // kilometres
  dateFrom: string;      // ISO date e.g. "2015-01-01"
  dateTo: string;
  dateRangeType?: "validated" | "decided" | "any";
  pageSize?: number;     // max 5000
}): Promise<{ cellDataArray: CellData[] }> {
  const gridResult = buildGrid({
    lat: params.lat,
    lng: params.lng,
    radiusMeters: params.radius * 1000,
  });

  // const cellDataArray: CellData[] = await Promise.all(
  //   gridResult.cells.map(async (cell) => {
  //     const cellResults = await searchProposals500m({
  //       lng: cell.lng,
  //       lat: cell.lat,
  //       dateFrom: params.dateFrom,
  //       dateTo: params.dateTo,
  //       dateRangeType: params.dateRangeType,
  //       pageSize: params.pageSize,
  //     });
  //     return {
  //       lat: cell.lat,
  //       lng: cell.lng,
  //       size_meters: gridResult.cellSizeMeters,
  //       results: cellResults,
  //     };
  //   })
  // );
  let cellDataArray: CellData[] = [];
  for (const cell of gridResult.cells) {
    const cellResults = await searchProposalsGridCell({
      lng: cell.lng,
      lat: cell.lat,
      radius_meters: gridResult.cellSizeMeters,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      dateRangeType: params.dateRangeType,
      pageSize: params.pageSize,
    }).catch((error) => {
      console.error(`Error fetching data for cell at lat ${cell.lat}, lng ${cell.lng}:`, error);
    });
    if (cellResults) {
      cellDataArray.push({
        lat: cell.lat,
        lng: cell.lng,
        size_meters: gridResult.cellSizeMeters,
        results: cellResults,
      });
    }
    else{
      console.log(`failed to fetch all ${gridResult.cells.length} cells, stopping early to avoid hitting API rate limits`);
      break;
    }
  }
  
  return { cellDataArray };
}


// --- Runner ---

// async function main() {
//   const lat = parseFloat(process.argv[2] ?? "");
//   const lng = parseFloat(process.argv[3] ?? "");
//   if (isNaN(lat) || isNaN(lng)) {
//     console.error("Usage: npx tsx scripts/searchNewBusinessSites.ts <lat> <lng>");
//     console.error("  e.g. npx tsx scripts/searchNewBusinessSites.ts 51.5074 -0.1276");
//     process.exit(1);
//   }

//   const now = new Date();
//   const dateTo = now.toISOString().slice(0, 10);
//   const dateFrom = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
//     .toISOString()
//     .slice(0, 10);

//   const cellresults = await searchProposals({
//     lng,
//     lat,
//     radius: 1,
//     dateFrom,
//     dateTo,
//   });

//   // console.log(JSON.stringify(cellresults, null, 2).length);

//   // for (const cellData of cellresults.cellDataArray) {
//   //   console.log(`lat: ${cellData.lat}, lng: ${cellData.lng}, cell size: ${cellData.size_meters}m`);
//   //   console.log(`Total from API:        ${cellData.results.all.length}`);
//   //   console.log(`After stage 1 filter:  ${cellData.results.filtered.length}`);
//   //   console.log("business category counts:");
//   //   console.dir(cellData.results.businessCategoryChartPoints);
//   //   console.log("approval rate by year:");
//   //   console.dir(cellData.results.approvalRateResult);
//   //   console.log(`new houses in period: ${cellData.results.newHousesOverPeriod}`);
//   //   console.log("income graph points:");
//   //   console.dir(cellData.results.incomeGraphPoints);
//   // }

//   type Omitted = Omit<Omit<Omit<CellData, "size_meters">, "lat">, "lng">;
//   const t = cellresults.cellDataArray as Omitted[];
//   // type Omitted2 = 
//   const tt = t.map((cell) => {
//     return {
//       approvalRateResult: cell.results.approvalRateResult,
//       businessCategoryChartPoints: cell.results.businessCategoryChartPoints,
//       newHousesOverPeriod: cell.results.newHousesOverPeriod,
//       incomeGraphPoints: cell.results.incomeGraphPoints,
//     }
//   });
  
//   console.dir(tt, { depth: null, colors: true });


// }

// main().catch(console.error);
