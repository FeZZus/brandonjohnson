# Gemini Square Ranking Prompt

**Model**: `gemini-2.5-flash`
**SDK**: `@google/genai` (already in use in `scripts/searchPropertyListings.ts`)

---

## Prompt template

Replace each `{{...}}` placeholder with real data before sending.
Repeat the `Square [row=..., col=...]` block once for every grid cell.

---

```
You are a location analyst helping entrepreneurs find the best area to open a small business in the UK.

Here is the user's business proposal - keep this in mind mainly: {{BUSINESS_INFO}}

You have been given data for {{NUM_SQUARES}} grid squares, each covering approximately 500m × 500m.

Score each square from 0 to 100 as a location for a new small commercial business (café, restaurant, retail shop, or service business). 100 = ideal location.

Scoring considerations:
- Higher local income → stronger customer spending power
- Higher planning approval rate → permissive environment for new commercial uses
- More existing commercial variety → established footfall (but also competition)
- More pending residential applications → growing local population, future customers

Return ONLY a JSON array sorted by score descending. No markdown, no explanation outside the JSON.

[
  { "row": 0, "col": 0, "score": 87, },
  ...
]

---

SQUARE DATA:

Square [row={{ROW}}, col={{COL}}]
   ----- PASS IN THE DATA WE NEED TO DO THIS ICECREAMSOCIETY ---------

[repeat block for each square]
```

---

## Notes

- If income data is unavailable for a square (point outside England & Wales MSOA coverage), write `Income: unavailable` for that square.
- Omit any business type line where the count is 0 — keeps the prompt compact.
- The `reason` field should be one sentence maximum.
- Keep blocks in row-major order: row 0 col 0, row 0 col 1, ..., row 1 col 0, etc.

---

## Data sources per square

| Field | Script | What to extract |
|---|---|---|
| `INCOME` | `incomeTimeseries.ts` | Latest available year only (FY2023 if present) |
| `APPROVAL_RATE` | `planningAnalytics.ts` | Overall 5yr rate: total approved / (approved + refused) × 100 |
| Business type counts | `searchBusinessProposals.ts` | `useTypes` array — count entries per `useType` |
| `PENDING_RESIDENTIAL` | `pendingResidential.ts` | Total count of results returned |
