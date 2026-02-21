/**
 * Fetches planning applications for a location and returns accepted small residential
 * counts by year (by decided_date). For use by API route and script.
 */

const BASE_URL = "https://ibex.seractech.co.uk";
const PAGE_SIZE = 5000;

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

export type YearCount = {
  year: string;
  acceptedCount: number;
};

export type SmallResidentialResult = {
  meta: {
    lat: number;
    lng: number;
    radius: number;
    dateFrom: string;
    dateTo: string;
    totalFetched: number;
    acceptedSmallResidential: number;
  };
  acceptedByYear: YearCount[];
};

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
      const err = json as { error?: string; message?: string };
      throw new Error(`API error: ${err.error ?? "unknown"} — ${err.message ?? ""}`);
    }
    applications.push(...(json as Application[]));
    if (json.length < PAGE_SIZE) break;
    page++;
  }

  return applications;
}

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

export async function getSmallResidentialAcceptedOverTime(params: {
  lat: number;
  lng: number;
  radius?: number;
  yearsBack?: number;
}): Promise<SmallResidentialResult> {
  const radius = params.radius ?? 500;
  const yearsBack = params.yearsBack ?? 10;
  const dateTo = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(new Date().getFullYear() - yearsBack, 0, 1).toISOString().slice(0, 10);

  const applications = await fetchApplications({
    lng: params.lng,
    lat: params.lat,
    radius,
    dateFrom,
    dateTo,
  });

  const accepted = filterAcceptedSmallResidential(applications);
  const acceptedByYear = groupByDecidedYear(accepted);

  return {
    meta: {
      lat: params.lat,
      lng: params.lng,
      radius,
      dateFrom,
      dateTo,
      totalFetched: applications.length,
      acceptedSmallResidential: accepted.length,
    },
    acceptedByYear,
  };
}
