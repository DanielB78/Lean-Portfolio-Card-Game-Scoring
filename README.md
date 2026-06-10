# Lean Portfolio Game Scoring

A web app for scoring the **Lean Portfolio Game**. Teams enter effort each quarter across two rounds, review scores and charts, compare Round 1 vs Round 2, and optionally submit results to Supabase.

**Stack:** React + TypeScript (Vite), Recharts, xlsx, Supabase

---

## Quick start

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

### Supabase (optional)

Copy `.env.example` to `.env` and add your project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Without Supabase configured, the app still runs; score submission, leaderboard, and graph save/load are disabled gracefully.

Run `supabase/graph_data_tables.sql` in the Supabase SQL editor to create tables for saved graph data.

---

## Card data files

| File | Used by | Purpose |
|------|---------|---------|
| `public/cards.xlsx` | Round 1 | Default card spreadsheet (not always in repo — add locally if missing) |
| `public/cards-round2.xlsx` | Round 2 | Generated from CSV via build script |
| `public/cards-round2-source.csv` | Build script | Source data for Round 2 cards |

Rebuild Round 2 spreadsheet after editing the CSV:

```bash
node scripts/build-round2-xlsx.mjs
```

---

## Where to look (short guide)

| If you want to… | Start here |
|-----------------|------------|
| Change **card values** (points, effort, deadlines) | Edit the spreadsheets above — see [CODE_STRUCTURE.md](./CODE_STRUCTURE.md#changing-card-values-safely) |
| Change **Round 1 scoring rules** | `src/lib/scoringEngine.ts` |
| Change **Round 2 scoring rules** | `src/round2/round2Scoring.ts` |
| Change **effort limits / quarter flow** | `src/lib/quarterFlow.ts`, `src/lib/round1Effort.ts` |
| Change **charts / graph math** | `src/lib/possibleValue.ts`, `deliveryRisk.ts`, `leadTime.ts`, `src/components/Charts.tsx` |
| Change **Supabase score saving** | `src/components/SubmitTeamScore.tsx` |
| Change **Supabase graph save/load** | `src/lib/graphDataStorage.ts`, `src/lib/graphDataBuilder.ts` |

For a full map of the codebase, see **[CODE_STRUCTURE.md](./CODE_STRUCTURE.md)**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |
| `node scripts/build-round2-xlsx.mjs` | Build `public/cards-round2.xlsx` from CSV |
| `node scripts/verify-round2.mjs` | Verify Round 2 spreadsheet loads correctly |

---

## Repository

https://github.com/DanielB78/Lean-Portfolio-Card-Game-Scoring
