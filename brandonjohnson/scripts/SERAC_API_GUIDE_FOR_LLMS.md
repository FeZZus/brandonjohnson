# Brief for Claude Code: Ibex Planning API — TypeScript/Node.js Implementation

## What this is

We have access to the **Ibex Enterprise API** — a UK planning application database. The goal is to implement a TypeScript/Node.js module that:

1. Fetches planning applications for a given location (lat/lng + radius, or polygon)
2. Applies two-stage filtering to isolate **genuinely new business sites** (not extensions, signage, outdoor seating, etc.)
3. Detects known **chain/brand names** from proposal text

This is being ported from working bash + Python scripts. Please implement it as clean TypeScript with Node.js.

---

## API Details

**Base URL:** `https://ibex.seractech.co.uk`
**Auth:** `Authorization: Bearer <JWT_TOKEN>` header on all requests
**All requests:** `POST`, `Content-Type: application/json`
**Token:** Store in environment variable `IBEX_API_KEY`

### Endpoint: POST /search

Geographic search. Returns planning applications near a coordinate point.

**Request body:**
```json
{
  "input": {
    "srid": 4326,
    "coordinates": [-0.1276, 51.5074],
    "radius": 500,
    "date_from": "2015-01-01",
    "date_to": "2025-12-31",
    "date_range_type": "any",
    "page": 1,
    "page_size": 5000
  },
  "extensions": {
    "heading": true,
    "project_type": true,
    "num_new_houses": true,
    "appeals": true
  },
  "filters": {
    "normalised_application_type": [
      "full planning application",
      "change of use"
    ]
  }
}
```

**Notes:**
- `srid`: 4326 = [lng, lat], 27700 = [easting, northing]
- `page_size` max is 5000 for /search
- `date_range_type`: `"validated"` | `"decided"` | `"any"`
- Do NOT include `"unlimited_radius": true` — not permitted on this API key
- `filters` and `extensions` are top-level keys, NOT nested inside `input`

**Response:** Array of application objects. Error responses are a plain object `{ error: string, message: string }`.

**Core fields on every result:**
```typescript
{
  planning_reference: string        // e.g. "2025/0970/P"
  council_name: string
  proposal: string | null           // free text description — main field for filtering
  raw_address: string | null
  raw_application_type: string | null
  normalised_application_type: string
  application_date: string | null   // ISO date string
  decided_date: string | null
  normalised_decision: string       // "Approved" | "Refused" | "Withdrawn" | "Validated" | "Other" | "Unknown"
  geometry: string                  // WKT string e.g. "POINT(-0.12 51.5)"
  url: string
  // Extension fields (present but null if not requested or no data):
  heading: string | null
  project_type: string | null       // "small residential" | "home improvement" | "mixed" | etc.
  num_new_houses: number | null
  appeals: Appeal[] | null
}
```

---

## Stage 1 Filter: Remove definite non-buildings (API + client-side)

### API-level (sent in the request body)
Only fetch `normalised_application_type`: `["full planning application", "change of use"]`.
This removes ~70% of noise before any data arrives.

### Client-side: Reference suffix blocklist
Planning references encode the application type in their suffix. Drop any result whose
`planning_reference` (uppercased) ends with or contains these strings:

```typescript
const BLOCKED_SUFFIXES = [
  '/TCH',    // Tables & Chairs on Highway — outdoor seating on pavement
  '/TELCOM', // Telecommunications equipment
  '/ADV',    // Advertisement consent — signage only
  '/TPO',    // Tree Preservation Order
]
```

### Client-side: project_type
Drop if `project_type === "home improvement"` (home extensions, loft conversions).

### Client-side: Exclude keywords in proposal text
Drop if `proposal.toLowerCase()` contains any of:

```typescript
const EXCLUDE_KEYWORDS = [
  // Modifications to existing buildings
  'extension', 'alteration', 'alterations', 'refurb', 'refurbishment',
  'replacement', 'renovation', 'modification', 'rear addition',
  'loft conversion', 'outbuilding',
  // Outdoor seating / street furniture
  'public highway', 'tables and chairs', 'parasol', 'seating area',
  // Equipment installations (not buildings)
  'installation of', 'mechanical plant', 'ductwork', 'shopfront',
  'telecommunications', 'antenna', 'atm',
  // Temporary / minor uses
  'temporary use', 'information pod',
]
```

### Client-side: Require at least one positive signal
Keep only if `proposal.toLowerCase()` contains at least one of:

```typescript
const REQUIRE_ONE_OF = [
  'change of use',
  'erection of',
  'construction of',
  'new build',
  'conversion of',
  'use of',        // e.g. "use of basement as restaurant"
]
```

---

## Stage 2: Chain/brand detection

After stage 1, scan each remaining `proposal` for known brand names.
Match as **case-insensitive substrings** (note trailing spaces on short names like `'next '` to avoid false matches).

```typescript
const CHAINS: Record<string, string[]> = {
  Coffee: [
    'starbucks', 'costa coffee', 'caffe nero', 'pret a manger', 'pret ',
    'caffè nero', 'joe and the juice', 'paul bakery', 'boston tea party', 'coffee#1',
  ],
  FastFood: [
    'mcdonald', 'kfc', 'burger king', 'subway', 'five guys', 'shake shack',
    'wendy', 'popeyes', 'taco bell', 'domino', 'papa john', 'pizza hut',
    'nando', 'leon ', 'itsu', 'wasabi', 'tortilla', 'chipotle',
  ],
  CasualDining: [
    'wagamama', 'yo! sushi', 'yo sushi', 'pizza express', 'bella italia',
    'zizzi', 'ask italian', 'prezzo', 'carluccio', 'frankie and benny',
    'cote brasserie', 'dishoom',
  ],
  Bakery: [
    'greggs', "gail's", 'paul ',
  ],
  Supermarket: [
    'tesco', 'sainsbury', 'asda', 'morrisons', 'waitrose', 'marks and spencer',
    'm&s food', 'lidl', 'aldi', 'co-op', 'spar ', 'budgens', 'iceland foods', 'whole foods',
  ],
  Retail: [
    'primark', 'h&m', 'zara', 'uniqlo', 'next ', 'river island', 'jd sports',
    'sports direct', 'footlocker', 'foot locker', 'boots ', 'superdrug',
    'the body shop', 'lush ', 'waterstones',
  ],
  Gym: [
    'pure gym', 'anytime fitness', 'the gym group', 'david lloyd',
    'nuffield health', 'virgin active', 'fitness first', 'bannatyne',
  ],
  Hotel: [
    'premier inn', 'travelodge', 'holiday inn', 'ibis ', 'hilton ',
    'marriott', 'novotel', 'citizenm', 'yotel', 'hampton by hilton', 'doubletree',
  ],
}
```

Return each match with the application object, the matched category, and the matched brand string.

---

## Expected TypeScript module interface

```typescript
type Application = {
  planning_reference: string
  council_name: string
  proposal: string | null
  raw_address: string | null
  raw_application_type: string | null
  normalised_application_type: string
  application_date: string | null
  decided_date: string | null
  normalised_decision: string
  geometry: string
  url: string
  heading?: string | null
  project_type?: string | null
  num_new_houses?: number | null
  appeals?: Appeal[] | null
}

type Appeal = {
  appeal_ref: string
  appeal_url: string
  case_type: string | null
  decision: string | null
  decision_date: string | null
  start_date: string | null
}

type ChainMatch = {
  application: Application
  category: string
  matchedBrand: string
}

// Main entry point
async function searchNewBusinessSites(params: {
  lng: number
  lat: number
  radius: number           // metres, max 500
  dateFrom: string         // ISO date e.g. "2015-01-01"
  dateTo: string
  dateRangeType?: 'validated' | 'decided' | 'any'
  pageSize?: number        // max 5000
}): Promise<{
  all: Application[]                   // raw API results
  filtered: Application[]              // after stage 1 filter
  chains: ChainMatch[]                 // stage 2 chain detection results
  dropReasons: Record<string, number>  // count of each drop reason
}>
```

---

## Key gotchas

- Always check if the API response is an **array** (success) or **object** (error) before processing
- `proposal` and `raw_address` can be `null` — always null-check before calling `.toLowerCase()`
- `geometry` is a **WKT string** (`"POINT(...)"` or `"POLYGON(...)"`), not GeoJSON
- The API key does **not** have `unlimited_radius` permission — do not request it or the whole request will fail with 403
- `application_date` from `/search` is a plain date string (`"2025-04-01"`); it may come as a full ISO datetime from `/applications`
- `filters` and `extensions` must be **top-level keys** in the request body, not nested inside `input`
