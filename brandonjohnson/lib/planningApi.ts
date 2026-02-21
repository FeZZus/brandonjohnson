const BASE_URL = "https://ibex.seractech.co.uk";
const PAGE_SIZE = 5000;

// ── Types ─────────────────────────────────────────────────────────────────────

export type Appeal = {
  appeal_ref: string;
  appeal_url: string;
  case_type: string | null;
  decision: string | null;
  decision_date: string | null;
  start_date: string | null;
};

export type Application = {
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

export type ChainMatch = {
  application: Application;
  category: string;
  matchedBrand: string;
};

export type UseTypeMatch = {
  application: Application;
  useType: string;
  matchedKeyword: string;
};

export type YearStat = {
  year: string;
  total: number;
  approved: number;
  refused: number;
  withdrawn: number;
  pending: number;
  other: number;
  approvalRate: number | null;
};

export type AnalyseLocationResult = {
  analytics: {
    meta: {
      lng: number;
      lat: number;
      radius: number;
      dateFrom: string;
      dateTo: string;
      totalFetched: number;
    };
    approvalsRejectionsByYear: YearStat[];
    businessTypeBreakdown: { type: string; count: number }[];
  };
  newBusinessSites: {
    filtered: Application[];
    useTypes: UseTypeMatch[];
    chains: ChainMatch[];
    dropReasons: Record<string, number>;
  };
};

// ── Constants ─────────────────────────────────────────────────────────────────

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

const CHAINS: Record<string, string[]> = {
  Coffee: [
    "starbucks", "costa coffee", "caffe nero", "pret a manger", "pret ",
    "caffè nero", "joe and the juice", "paul bakery", "boston tea party", "coffee#1",
  ],
  FastFood: [
    "mcdonald", "kfc", "burger king", "subway", "five guys", "shake shack",
    "wendy", "popeyes", "taco bell", "domino", "papa john", "pizza hut",
    "nando", "leon ", "itsu", "wasabi", "tortilla", "chipotle",
  ],
  CasualDining: [
    "wagamama", "yo! sushi", "yo sushi", "pizza express", "bella italia",
    "zizzi", "ask italian", "prezzo", "carluccio", "frankie and benny",
    "cote brasserie", "dishoom",
  ],
  Bakery: ["greggs", "gail's", "paul "],
  Supermarket: [
    "tesco", "sainsbury", "asda", "morrisons", "waitrose", "marks and spencer",
    "m&s food", "lidl", "aldi", "co-op", "spar ", "budgens", "iceland foods", "whole foods",
  ],
  Retail: [
    "primark", "h&m", "zara", "uniqlo", "next ", "river island", "jd sports",
    "sports direct", "footlocker", "foot locker", "boots ", "superdrug",
    "the body shop", "lush ", "waterstones",
  ],
  Gym: [
    "pure gym", "anytime fitness", "the gym group", "david lloyd",
    "nuffield health", "virgin active", "fitness first", "bannatyne",
  ],
  Hotel: [
    "premier inn", "travelodge", "holiday inn", "ibis ", "hilton ",
    "marriott", "novotel", "citizenm", "yotel", "hampton by hilton", "doubletree",
  ],
};

const BLOCKED_SUFFIXES = ["/TCH", "/TELCOM", "/ADV", "/TPO"];

const EXCLUDE_KEYWORDS = [
  "extension", "alteration", "alterations", "refurb", "refurbishment",
  "replacement", "renovation", "modification", "rear addition",
  "loft conversion", "outbuilding",
  "public highway", "tables and chairs", "parasol", "seating area",
  "installation of", "mechanical plant", "ductwork", "shopfront",
  "telecommunications", "antenna", "atm",
  "temporary use", "information pod",
];

const REQUIRE_ONE_OF = [
  "change of use", "erection of", "construction of",
  "new build", "conversion of", "use of",
];

// ── Shared fetch (paginated) ──────────────────────────────────────────────────

async function fetchFromIbex(
  params: { lng: number; lat: number; radius: number; dateFrom: string; dateTo: string },
  typeFilter?: string[],
): Promise<Application[]> {
  const token = process.env.IBEX_API_KEY;
  if (!token) throw new Error("IBEX_API_KEY environment variable is not set");

  const applications: Application[] = [];
  let page = 1;

  while (true) {
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
    };

    if (typeFilter) {
      body.filters = { normalised_application_type: typeFilter };
    }

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
    if (json.length < PAGE_SIZE) break;
    page++;
  }

  return applications;
}

// ── Analytics pipeline ────────────────────────────────────────────────────────

function runAnalytics(applications: Application[]): YearStat[] {
  const byYear: Record<string, {
    total: number; approved: number; refused: number;
    withdrawn: number; pending: number; other: number;
  }> = {};

  for (const app of applications) {
    const year = app.application_date ? app.application_date.slice(0, 4) : "Unknown";
    if (!byYear[year]) {
      byYear[year] = { total: 0, approved: 0, refused: 0, withdrawn: 0, pending: 0, other: 0 };
    }
    const s = byYear[year];
    s.total++;
    if (app.decided_date === null) {
      s.pending++;
    } else if (app.normalised_decision === "Approved") {
      s.approved++;
    } else if (app.normalised_decision === "Refused") {
      s.refused++;
    } else if (app.normalised_decision === "Withdrawn") {
      s.withdrawn++;
    } else {
      s.other++;
    }
  }

  const sortedYears = Object.keys(byYear).filter(y => y !== "Unknown").sort();
  if (byYear["Unknown"]) sortedYears.push("Unknown");

  const grandTotal = Object.values(byYear).reduce((sum, s) => sum + s.total, 0);
  const threshold = grandTotal * 0.05;

  return sortedYears
    .filter(year => byYear[year].total >= threshold)
    .map(year => {
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
    });
}

function countUseTypes(applications: Application[]): { type: string; count: number }[] {
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
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

// ── New business sites pipeline ───────────────────────────────────────────────

function stageOneFilter(applications: Application[]): {
  filtered: Application[];
  dropReasons: Record<string, number>;
} {
  const dropReasons: Record<string, number> = {};
  const filtered: Application[] = [];

  for (const app of applications) {
    const ref = app.planning_reference.toUpperCase();
    if (BLOCKED_SUFFIXES.some(s => ref.includes(s))) {
      dropReasons.blocked_suffix = (dropReasons.blocked_suffix ?? 0) + 1;
      continue;
    }
    if (app.project_type === "home improvement") {
      dropReasons.home_improvement = (dropReasons.home_improvement ?? 0) + 1;
      continue;
    }
    const proposal = app.proposal?.toLowerCase() ?? "";
    if (EXCLUDE_KEYWORDS.some(kw => proposal.includes(kw))) {
      dropReasons.exclude_keyword = (dropReasons.exclude_keyword ?? 0) + 1;
      continue;
    }
    if (!REQUIRE_ONE_OF.some(kw => proposal.includes(kw))) {
      dropReasons.no_positive_signal = (dropReasons.no_positive_signal ?? 0) + 1;
      continue;
    }
    filtered.push(app);
  }

  return { filtered, dropReasons };
}

function stageTwoDetect(filtered: Application[]): {
  useTypes: UseTypeMatch[];
  chains: ChainMatch[];
} {
  const useTypes: UseTypeMatch[] = [];
  const chains: ChainMatch[] = [];

  for (const app of filtered) {
    const proposal = app.proposal?.toLowerCase() ?? "";

    for (const [useType, keywords] of Object.entries(USE_TYPES)) {
      for (const kw of keywords) {
        if (proposal.includes(kw)) {
          useTypes.push({ application: app, useType, matchedKeyword: kw });
          break;
        }
      }
    }

    for (const [category, brands] of Object.entries(CHAINS)) {
      for (const brand of brands) {
        if (proposal.includes(brand)) {
          chains.push({ application: app, category, matchedBrand: brand });
          break;
        }
      }
    }
  }

  return { useTypes, chains };
}

// ── Main exported function ────────────────────────────────────────────────────

export async function analyseLocation(params: {
  lng: number;
  lat: number;
  radius?: number;
  yearsBack?: number;
}): Promise<AnalyseLocationResult> {
  const radius = params.radius ?? 500;
  const yearsBack = params.yearsBack ?? 5;

  const now = new Date();
  const dateTo = now.toISOString().slice(0, 10);
  const dateFrom = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);

  const fetchParams = { lng: params.lng, lat: params.lat, radius, dateFrom, dateTo };

  // Fire both API calls in parallel
  const [allApps, siteApps] = await Promise.all([
    fetchFromIbex(fetchParams),
    fetchFromIbex(fetchParams, ["full planning application", "change of use"]),
  ]);

  const { filtered, dropReasons } = stageOneFilter(siteApps);
  const { useTypes, chains } = stageTwoDetect(filtered);

  return {
    analytics: {
      meta: {
        lng: params.lng,
        lat: params.lat,
        radius,
        dateFrom,
        dateTo,
        totalFetched: allApps.length,
      },
      approvalsRejectionsByYear: runAnalytics(allApps),
      businessTypeBreakdown: countUseTypes(allApps),
    },
    newBusinessSites: {
      filtered,
      useTypes,
      chains,
      dropReasons,
    },
  };
}
