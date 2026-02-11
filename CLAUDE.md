# Voice Cafe Cashier - Project Guide

## What This Is

AI voice cashier for a NYC coffee shop — a PM interview take-home project. Forked from delo-kiosk, rebuilt as an AI-powered ordering experience using OpenAI's Responses API (text) and Realtime API (voice).

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, TypeScript, Tailwind CSS |
| Database | Supabase (Postgres + Realtime) |
| Text AI | OpenAI Responses API with stored prompt |
| Voice AI | OpenAI Realtime API via WebRTC |
| Hosting | Vercel |

## Key Decisions

- **Two modes**: Text chat or voice — customer picks at start, locked for session
- **Stored prompt**: Single prompt ID in OpenAI dashboard, shared by both APIs
- **4 tools**: `add_item`, `modify_item`, `remove_item`, `finalize_order`
- **Menu lives in the prompt** — no DB menu table
- **Cart updates live** as AI processes tool calls

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
  chat/                   # Text mode components
  voice/                  # Voice mode components
  cart/                   # Shared cart components
  Kitchen*.tsx            # Kitchen display
  OwnerDashboard*.tsx     # Analytics dashboard
hooks/
  useRealtimeSession.ts   # WebRTC + Realtime API
lib/
  supabase.ts             # DB client + types
  realtime-config.ts      # OpenAI session config
```

## Multi-Session Workflow

This project is built across multiple sessions in Claude Code and Cursor.

- **Status**: `.claude/rules/status.md` — single source of truth (auto-loaded)
- **Full plan**: `PLAN.md` — all implementation steps
- **Save progress**: Run `/save-status` before ending any session

## Reference Documents

| File | Purpose |
|------|---------|
| `PLAN.md` | Full implementation plan (Steps 0-9) |
| `TECHNICAL.md` | Architecture, schema, API details |
| `.claude/rules/status.md` | Current status and next tasks (auto-loaded) |

## Environment Variables

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ADMIN_PASSCODE=...
```
