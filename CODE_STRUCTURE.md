# Code structure guide

This document explains where the important logic lives in the Lean Portfolio Game Scoring app. It is written for someone new to the project who needs to change **card values**, **scoring rules**, **charts**, or **Supabase** behavior.

---

## High-level flow

```
Landing page (Leaderboard, Start, Load Graph Data)
        │
        ▼
   App.tsx  ── navigation between Round 1, Round 2, Compare
        │
   ┌────┴────┬────────────┐
   ▼         ▼            ▼
Round1App  Round2App   ComparisonResults
   │         │            │
   │         │            ├── Charts (live graphs)
   │         │            └── SubmitTeamScore → Supabase scores + graph data
   │         │
   │    load cards-round2.xlsx
   │    calculateRound2Scoring()
   │
load cards.xlsx
calculateScoring()
```

1. **Spreadsheets** define card values (effort, completion points, recurring value, deadlines, penalties).
2. **User input** (effort per quarter, completions) is collected in the game UI.
3. **Scoring engines** turn cards + input into per-turn results and a final score.
4. **Chart helpers** derive graph series from those results.
5. **Supabase** optionally stores leaderboard scores and saved graph datasets.

---

## Main scoring logic

### Round 1 — `src/lib/scoringEngine.ts`

This is the **primary Round 1 scoring engine**. It takes:

- `CardDefinition[]` — card values from the spreadsheet
- `Record<string, CardSchedule>` — when each card started and finished (from user effort)

It returns a `ScoringResult`: `finalScore` and `turnResults[]` (points per turn, card counts, completion/recurring/penalty breakdown).

**What it calculates each turn:**

- **Completion points** when a card’s `finishTurn` equals the current turn
- **Recurring points** after a card is completed, if `recurringValue > 0`
- **Penalty points** on a card’s deadline turn if the card was not completed in time
- **Flow metrics** — counts of not started / in progress / completed cards

Round 1 does **not** read spreadsheets directly. It only sees parsed `CardDefinition` objects and schedules built from player input.

**Related Round 1 files (input → schedules → score):**

| File | Role |
|------|------|
| `src/lib/round1Effort.ts` | Round 1 player input types, effort caps, completion recalculation, `effortToSchedules()` |
| `src/lib/quarterFlow.ts` | Shared quarter/step constants (`MAX_QUARTER_EFFORT = 16`, per-card cap for Round 2) |
| `src/components/QuarterGame.tsx` | Round 1 game UI (effort entry, quarter navigation) |
| `src/components/Round1App.tsx` | Loads cards, wires scoring, results tab, comparison data |

**Round 1 effort rules (not in scoringEngine.ts):**

- Total effort per quarter capped at **16** (`isRound1QuarterEffortWithinCap` in `round1Effort.ts`)
- No per-card effort cap in Round 1 (Round 2 uses `isQuarterEffortWithinCap` in `quarterFlow.ts`)
- Card completion is **derived** from cumulative effort vs `card.effort` (`getFirstCompletionQuarter`)

---

### Round 2 — `src/round2/round2Scoring.ts`

This is the **Round 2 scoring engine**. It takes:

- `Round2CardDefinition[]` — cards with effort thresholds (parsed from Round 2 spreadsheet)
- `Round2Inputs` — per-card effort by quarter and completion round

It also returns `ScoringResult` with the same shape as Round 1, so charts and comparison reuse the same types.

**Round 2-specific behavior:**

- Completion uses **effort thresholds** (`getMatchingThreshold`) — different point values at different effort levels
- Recurring value can come from threshold metadata (`recurringPerTurn`)
- Penalties apply on `deadlineRound` if required effort was not met

**Related Round 2 files:**

| File | Role |
|------|------|
| `src/round2/types.ts` | Round 2 card/input types, threshold matching, completion checks |
| `src/round2/loadRound2Cards.ts` | Parses Round 2 spreadsheet into `Round2CardDefinition[]` |
| `src/round2/chartAdapter.ts` | Converts Round 2 cards/inputs into Round 1-shaped data for shared charts |
| `src/components/round2/Round2Game.tsx` | Round 2 game UI |
| `src/components/round2/Round2App.tsx` | Loads cards, runs `calculateRound2Scoring()`, results tab |

---

## Card values — where they come from

Card values are **not hard-coded in scoring logic**. They are loaded from Excel files in `public/`.

### Round 1 spreadsheet — `public/cards.xlsx`

Loaded at startup by `Round1App.tsx`:

```typescript
await loadCardsFromUrl('/cards.xlsx');
```

**Parsing pipeline:**

| Step | File | What it does |
|------|------|--------------|
| Fetch & read workbook | `src/lib/spreadsheetLoader.ts` | Uses `xlsx` to read the first sheet |
| Map columns | `src/lib/columnMapping.ts` | Matches header names (flexible aliases) to fields |
| Build card objects | `src/lib/columnMapping.ts` → `mapRowsToCards()` | Produces `CardDefinition[]` |

**Expected Round 1 columns** (aliases are flexible — see `COLUMN_ALIASES` in `columnMapping.ts`):

| Field | Example column names |
|-------|-------------------|
| Card ID | Card ID, Card, ID |
| Effort | Effort, Turns Required |
| Completion Value | Completion Value, Value, Points |
| Recurring Value / Turn | Recurring Value, Recurring |
| Deadline Turn | Deadline Turn, Deadline |
| Penalty Value | Penalty Value, Penalty |
| Card Type | Card Type (optional — inferred if missing) |

**Type definition:** `src/types/card.ts` → `CardDefinition`

**Parsing notes:**

- Negative completion values with a deadline are treated as penalties
- `cardType` is inferred from recurring/deadline/penalty fields if not provided

Users can also upload a custom `.xlsx` from the Round 1 UI; that uses the same `parseWorkbook()` path.

---

### Round 2 spreadsheet — `public/cards-round2.xlsx`

Loaded at startup by `Round2App.tsx`:

```typescript
await loadRound2CardsFromUrl('/cards-round2.xlsx');
```

**Source file:** `public/cards-round2-source.csv`  
**Build script:** `scripts/build-round2-xlsx.mjs` — converts CSV → xlsx

**Parsing:** `src/round2/loadRound2Cards.ts`

Round 2 supports a different row format (threshold rows per card, penalty-only rows, etc.). See that file’s `mapRound2Row()` and `groupRound2Rows()` for column matching.

**Type definition:** `src/round2/types.ts` → `Round2CardDefinition`

---

## Graph / chart calculations

Charts are rendered in the UI by `src/components/Charts.tsx`. The same underlying math is used when **saving** graph data to Supabase.

### Live charts (in-app)

| Chart | Data source |
|-------|-------------|
| Delay Cost for Repeatable Value | `src/lib/possibleValue.ts` |
| Cumulative Value | `turnResults[].cumulativePoints` from scoring |
| Cumulative Flow Diagram | `turnResults[]` notStarted / inProgress / completed |
| Lead Time Histogram | `src/lib/leadTime.ts` |
| Delivery Risk Profile | `src/lib/deliveryRisk.ts` |
| Score breakdown (cumulative) | Derived in `Charts.tsx` from `turnResults` |

`Charts.tsx` receives `cards`, `schedules`, and `turnResults` from the results/comparison views.

**Round 2 charts:** `round2/chartAdapter.ts` converts Round 2 data into Round 1-shaped `CardDefinition` + `CardSchedule` so `Charts.tsx` can be reused.

### Saved graph data (Supabase)

When a team submits on the Compare page:

1. `SubmitTeamScore.tsx` saves scores to the `scores` table
2. `graphDataStorage.ts` → `saveGraphDataForSubmission()` creates a `graph_submissions` row and bulk-inserts `graph_data_points`
3. `graphDataBuilder.ts` → `buildGraphDataPoints()` serializes the six chart datasets (mirrors `Charts.tsx` logic without changing it)

**Reloading saved graphs:**

| File | Role |
|------|------|
| `src/components/LoadGraphDataPage.tsx` | Team picker, round selector, load button |
| `src/components/TeamNameCombobox.tsx` | Searchable team dropdown |
| `src/lib/graphDataStorage.ts` | `fetchSavedTeamNames()`, `loadSavedGraphData()` |
| `src/components/SavedCharts.tsx` | Renders charts from saved JSON (same layout as `Charts.tsx`) |
| `src/types/savedGraphData.ts` | Types for graph rows and chart bundles |
| `supabase/graph_data_tables.sql` | SQL for `graph_submissions` and `graph_data_points` |

---

## Supabase integration

| Feature | File | Table(s) |
|---------|------|----------|
| Client setup | `src/lib/supabase.ts` | — (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| Score submission | `src/components/SubmitTeamScore.tsx` | `scores` |
| Home leaderboard | `src/components/Leaderboard.tsx` | `scores` |
| Graph save | `src/lib/graphDataStorage.ts` | `graph_submissions`, `graph_data_points` |
| Graph load | `src/lib/graphDataStorage.ts` + `LoadGraphDataPage.tsx` | `graph_data_points`, `scores` (team name list) |

**Compare page wiring:** `ComparisonResults.tsx` passes round data and final scores to `SubmitTeamScore.tsx`.  
**Comparison data shape:** `src/types/comparison.ts` → `ComparisonRoundData`

---

## How to change card values safely

1. **Prefer editing spreadsheets**, not TypeScript, when you only need different points, effort, or deadlines.
2. **Round 1:** Edit `public/cards.xlsx` (or upload via the app). Confirm columns match aliases in `columnMapping.ts`.
3. **Round 2:** Edit `public/cards-round2-source.csv`, then run:
   ```bash
   node scripts/build-round2-xlsx.mjs
   ```
4. **Verify parsing:** Use the in-app column mapping display (Round 1) or `node scripts/verify-round2.mjs` for Round 2.
5. **Do not change** `CardDefinition` field names in `types/card.ts` unless you also update parsers and scoring — the scoring engines depend on those fields.

If a column is not recognized, add an alias in `columnMapping.ts` (Round 1) or `loadRound2Cards.ts` (Round 2) rather than changing scoring logic.

---

## How to change scoring rules safely

1. **Identify the round:** Round 1 → `scoringEngine.ts`; Round 2 → `round2Scoring.ts`.
2. **Change one rule at a time** and test with known inputs in the Results tab.
3. **Effort limits and completion timing** are mostly in `round1Effort.ts`, `quarterFlow.ts`, and Round 2 `types.ts` — not in the scoring engines themselves.
4. **After scoring changes**, check:
   - Final score on Results tab
   - Turn-by-turn table (`TurnResultsTable.tsx`)
   - All six charts on Compare page
5. **Graph save/load** uses `graphDataBuilder.ts`, which duplicates chart prep logic. If you change how a chart is calculated in `Charts.tsx`, update `graphDataBuilder.ts` in parallel so saved graphs stay consistent.

**Game length:** Default is 8 turns (`TOTAL_TURNS` in `src/types/card.ts`). Changing it affects scoring loops, UI steps, and charts.

---

## Files to avoid editing unless necessary

These files are mostly **UI, navigation, or wiring**. Changing them rarely affects scoring math, but unnecessary edits can break layout or flow.

| Area | Files | Why leave alone |
|------|-------|-----------------|
| App shell / routing | `src/App.tsx`, `src/main.tsx` | View switching only |
| Landing / leaderboard UI | `LandingPage.tsx`, `Leaderboard.tsx` | Display + Supabase read |
| Scroll / polish | `scrollToTop.ts`, most of `App.css` | No scoring impact |
| Results layout | `ResultsDashboard.tsx`, `ResultsAccordion.tsx`, `ScoreSummary.tsx`, `ResultsMetricCards.tsx` | Presentation of existing data |
| Round 2 card views | `Round2CardViews.tsx`, `CardIdSearch.tsx` | UI helpers |
| Saved chart display | `SavedCharts.tsx` | Should mirror `Charts.tsx` — edit only for display bugs |
| Build / verify scripts | `scripts/*.mjs` | Only when changing spreadsheet build process |
| Env / Vite config | `.env`, `vite.config.ts`, `tsconfig*.json` | Infrastructure |

**Core logic — edit with care:**

| File | Edit when… |
|------|------------|
| `scoringEngine.ts` | Round 1 point rules change |
| `round2Scoring.ts` | Round 2 point rules change |
| `columnMapping.ts` / `loadRound2Cards.ts` | Spreadsheet format changes |
| `possibleValue.ts`, `deliveryRisk.ts`, `leadTime.ts` | Chart metric formulas change |
| `Charts.tsx` + `graphDataBuilder.ts` | Chart definitions change (keep in sync) |
| `graphDataStorage.ts` | Supabase schema or save/load behavior changes |

---

## Directory reference

```
src/
├── App.tsx                 # Top-level views: landing, game, load-graphs
├── components/
│   ├── Round1App.tsx       # Round 1 entry: load cards, scoring, tabs
│   ├── QuarterGame.tsx     # Round 1 quarter-by-quarter gameplay
│   ├── Charts.tsx          # All six performance charts (live data)
│   ├── ComparisonResults.tsx
│   ├── SubmitTeamScore.tsx # Supabase score + graph save
│   ├── LoadGraphDataPage.tsx
│   ├── SavedCharts.tsx     # Charts from Supabase saved data
│   ├── Leaderboard.tsx
│   └── round2/
│       ├── Round2App.tsx
│       └── Round2Game.tsx
├── lib/
│   ├── scoringEngine.ts    # ★ Round 1 scoring
│   ├── round1Effort.ts     # Round 1 input, schedules, effort caps
│   ├── quarterFlow.ts      # Quarter constants and shared effort caps
│   ├── spreadsheetLoader.ts
│   ├── columnMapping.ts    # ★ Round 1 spreadsheet → CardDefinition
│   ├── possibleValue.ts    # Chart: achievable vs possible recurring
│   ├── deliveryRisk.ts     # Chart: delivery risk profile
│   ├── leadTime.ts         # Chart: lead time histogram
│   ├── graphDataBuilder.ts # Serialize chart data for Supabase
│   ├── graphDataStorage.ts # Supabase graph save/load
│   └── supabase.ts
├── round2/
│   ├── round2Scoring.ts    # ★ Round 2 scoring
│   ├── loadRound2Cards.ts  # ★ Round 2 spreadsheet parsing
│   ├── chartAdapter.ts     # Round 2 → chart-compatible shapes
│   └── types.ts            # Round 2 card/input types
└── types/
    ├── card.ts             # Shared card and scoring types
    ├── comparison.ts       # Data passed to Compare page
    └── savedGraphData.ts   # Supabase graph row types

public/
├── cards.xlsx              # Round 1 card data (add locally if missing)
├── cards-round2.xlsx       # Round 2 card data (built from CSV)
└── cards-round2-source.csv # Round 2 source spreadsheet

supabase/
└── graph_data_tables.sql   # Graph data table definitions

scripts/
├── build-round2-xlsx.mjs
└── verify-round2.mjs
```

---

## Common tasks (cheat sheet)

| Task | What to do |
|------|------------|
| Add a new card (Round 1) | Add a row to `public/cards.xlsx` |
| Add a new card (Round 2) | Add rows to `cards-round2-source.csv`, rebuild xlsx |
| Change completion points | Edit spreadsheet column; no code change if column maps correctly |
| Change recurring points per turn | Edit `recurringValue` in spreadsheet |
| Change deadline penalty | Edit deadline + penalty columns |
| Change max effort per quarter (Round 1) | `MAX_QUARTER_EFFORT` in `quarterFlow.ts` |
| Change max effort per card (Round 2) | `MAX_CARD_QUARTER_EFFORT` in `quarterFlow.ts` |
| Add a new chart | Update `Charts.tsx`, `graphDataBuilder.ts`, `SavedCharts.tsx`, and SQL graph_type check if persisting |
| Fix leaderboard not showing | Check `.env`, Supabase `scores` table, RLS policies |
| Fix graph load empty | Run `graph_data_tables.sql`; submit from Compare page first |

---

## Types worth knowing

```typescript
// src/types/card.ts
CardDefinition    // One card’s static values from spreadsheet
CardSchedule      // startTurn, finishTurn derived from player input
TurnResult        // One turn’s scoring breakdown
ScoringResult     // { finalScore, turnResults[] }

// src/types/comparison.ts
ComparisonRoundData  // { scoring, cards, schedules, useEffortBasedDeliveryRisk? }
```

Round 1 and Round 2 both produce `ScoringResult`, which keeps the Results dashboard, Compare page, and charts consistent across rounds.
