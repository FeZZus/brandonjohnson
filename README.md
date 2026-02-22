# Zonary

### Deployed here:
https://brandonjohnson-amber.vercel.app/

A UK property and location insights tool. Search by location and radius to explore planning data, income trends, and ranked postcodes on an interactive map with heatmaps—useful for deciding where to invest or open a business.

## Features

- **Landing page** — Minimal intro with a single CTA to the insight flow
- **Interactive map** — Leaflet-based map with search circle and grid overlay
- **Heatmaps** — Recommended score, residential activity, and median income
- **Planning insights** — Business categories, approval rates, and planning/income trends
- **Ranked postcodes** — Postcodes ranked by suitability with justifications and address listings

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Fonts:** Geist (sans) and Geist Mono via `next/font/google`
- **Map:** Leaflet + react-leaflet
- **Charts:** Recharts
- **APIs:** IBEX (planning/search), Google Gemini (AI), OpenStreetMap Nominatim (geocoding)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Setup

1. **Clone and install**

   ```bash
   cd brandonjohnson
   npm install
   ```

2. **Environment variables**

   Create a `.env` (or `.env.local`) in this directory with:

   ```env
   IBEX_API_KEY=your_ibex_jwt_token
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

   - **IBEX_API_KEY** — JWT for the IBEX planning/search API (required for search and insights).
   - **GEMINI_API_KEY** — Google AI (Gemini) API key used for AI-generated justifications.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The landing page is at `/`, and the main insight experience is at `/insight`.

### Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build        |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Project Structure

- `app/(landing)/` — Landing page and components (Hero, Features, CTA, etc.)
- `app/insight/` — Main insight page: map, search, heatmaps, charts, postcode list
- `app/api/` — API routes (e.g. postcodes; see `app/api/postcodes/README.md`)
- `lib/` — Geocoding, search/proposals, and shared utilities

## API: Ranked Postcodes

See [app/api/postcodes/README.md](app/api/postcodes/README.md) for the ranked postcodes API (POST/GET `/api/postcodes`) and request/response formats.

## Deploy

You can deploy to [Vercel](https://vercel.com) or any Node-compatible host. Set `IBEX_API_KEY` and `GEMINI_API_KEY` in the environment.

---

Built with [Next.js](https://nextjs.org).
