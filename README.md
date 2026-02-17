# Coffee Rooom — AI Voice Cashier

> AI-powered ordering experience for a NYC coffee shop.
> PM interview take-home project.

## What It Does

- **Two ordering modes**: voice (OpenAI Realtime API) or text chat (Responses API)
- **Live cart updates** as the AI processes orders
- **Kitchen display** with real-time order queue
- **Owner dashboard** with analytics

## Live Demo

[voice-cafe-cashier.vercel.app](https://voice-cafe-cashier.vercel.app)

---

## Architecture

| Layer | Tech |
|-------|------|
| Framework | Next.js 14, TypeScript, Tailwind CSS |
| Database | Supabase (Postgres + Realtime) |
| Text AI | OpenAI Responses API (gpt-5.2) |
| Voice AI | OpenAI Realtime API via WebRTC |
| Hosting | Vercel |

## Key Design Decisions

- **Stored prompt**: single prompt ID in OpenAI, shared by both APIs
- **4 tools**: `add_item`, `modify_item`, `remove_item`, `finalize_order`
- **Menu lives in the prompt** — no DB menu table
- **Price calculation** on client (`lib/menu.ts`), not by the AI

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — pick voice or text mode |
| `/order` | AI ordering experience |
| `/kitchen` | Kitchen display (realtime queue) |
| `/admin` | Owner dashboard (analytics) |

---

## Setup

### Prerequisites

- Node.js 18+
- npm
- A Supabase project
- OpenAI API key + stored prompt

### Install

```bash
git clone https://github.com/deevyb/voice-cafe-cashier.git
cd voice-cafe-cashier
npm install
```

### Environment Variables

Create `.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_STORED_PROMPT_ID=pmpt_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Sample Data

`orders.csv` contains 80 sample orders (Feb 9–15, 2026) with realistic item distributions, modifiers, and hourly patterns.

To re-seed:

```bash
npx tsx scripts/seed-orders.ts
```

---

## Project Structure

```
app/
  page.tsx              # Landing — mode selector
  order/page.tsx        # AI ordering (text or voice)
  kitchen/page.tsx      # Kitchen display (realtime)
  admin/page.tsx        # Owner dashboard
  api/
    chat/route.ts       # Responses API (text mode)
    realtime/token/     # Ephemeral token (voice mode)
    orders/             # CRUD
    admin/              # Stats + admin APIs
components/
  VoiceCashierClient.tsx  # Main ordering container
  chat/                   # Text mode UI
  voice/                  # Voice mode UI
  cart/                   # Shared cart components
  Kitchen*.tsx            # Kitchen display
  dashboard/              # Owner dashboard
hooks/
  useRealtimeSession.ts   # WebRTC + Realtime API
lib/
  supabase.ts             # DB client + types
  menu.ts                 # Price calculation + menu data
  realtime-config.ts      # Voice mode session config
scripts/
  seed-orders.ts          # Seed realistic order data
```

---

## Documentation

| File | Purpose |
|------|---------|
| `TECHNICAL.md` | Architecture, schema, API details |
| `PLAN.md` | Implementation plan (Steps 0–9) |
| `CLAUDE.md` | Project guide for AI assistants |
