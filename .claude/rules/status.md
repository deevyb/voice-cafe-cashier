# Project Status

> Last Updated: February 12, 2026

## Current State

| Step | Status | Notes |
|------|--------|-------|
| Step 0: Fork + Setup | complete | Repo/workflow setup done, new Supabase project created, env + OpenAI SDK installed |
| Step 1: Stored Prompt + Tools | complete | Stored prompt created and ID wired locally (`OPENAI_STORED_PROMPT_ID`) |
| Step 2: Database Schema | complete | Orders now use `items` JSONB + statuses (`placed`,`in_progress`,`completed`,`canceled`) |
| Step 3: Text Mode (Responses API) | complete | Added `/api/chat` + new `VoiceCashierClient` text/cart flow with tool-call handling |
| Step 4: Voice Mode (Realtime API) | pending | |
| Step 5: Rebrand (NYC theme) | pending | |
| Step 6: Kitchen View Update | complete | Kitchen supports Queue/Making/Done, multi-item rendering, and new status flow |
| Step 7: Owner Dashboard | pending | |
| Step 8: Deliverables + Polish | pending | |
| Step 9: Edge Case Testing | pending | |

## What's Next

1. Step 4: Implement voice mode (Realtime API via WebRTC)
2. Step 5: Rebrand UI from Delo to NYC cafe visual system
3. Step 7: Upgrade owner dashboard visualizations and metrics depth

## Blockers

- None currently

## Completed This Session (Feb 12 — latest)

- Deduplicated prompt management in `app/api/chat/route.ts`:
  - Removed 40-line `FALLBACK_SYSTEM_INSTRUCTIONS` inline block
  - Stored prompt (`OPENAI_STORED_PROMPT_ID`) is now the single source of truth for personality/menu/rules
  - Added early guard: returns 500 if `OPENAI_STORED_PROMPT_ID` is missing
  - Only dynamic cart context (`Current cart JSON: ...`) is still injected as a system message
  - File reduced from 123 → 81 lines
- Prompt iteration workflow decided: iterate on content in OpenAI dashboard, keep tools in code

## Completed Earlier (Feb 12)

- Synced 2 upstream `delo-kiosk` kitchen commits via cherry-pick (PR #1)
  - `a3c1aa5`: Kitchen Mark Ready/Cancel buttons now update local state immediately
  - `ad28772`: Kitchen tab switch animation fix + card transition polish
- Cleaned up dead `isNew` prop and `newOrderIds` state (flagged by bugbot)
- `upstream` remote configured for `deevyb/delo-kiosk` for future syncs
- Created new Supabase project: `voice-cafe-cashier` (`kvlkuoeemroveoodqbtv`, `us-west-1`)
- Applied migrations:
  - `create_orders_table_for_ai_cashier`
  - `enable_realtime_for_orders`
  - `orders_rls_policies_for_demo_app`
- Added `.env.local` with new Supabase URL + anon key scaffold
- Installed `openai` package dependency
- Verified local app responds (`GET /` returns 200 after env reload)
- Created Vercel project `voice-cafe-cashier` and initial production deployment
- Implemented Step 2 + Step 3 code updates:
  - New `CartItem` + multi-item `Order` typing in `lib/supabase.ts`
  - Updated orders API to accept `{ customer_name, items }` and new statuses
  - Added `app/api/chat/route.ts` (Responses API) + `lib/realtime-config.ts`
  - Added new text-order UI: `components/VoiceCashierClient.tsx`, `components/chat/*`, `components/cart/*`
  - Switched `/order` page to `VoiceCashierClient`
  - Updated kitchen workflow to Queue/Making/Done + multi-item cards
  - Updated admin stats aggregation for `items` JSONB
- Formalized Cursor + Claude Code cross-tool workflow
- Finalized menu rule decisions for prompt behavior
- Added `OPENAI_PROMPT.md` with full configuration guide
- Stored prompt created in OpenAI dashboard (`pmpt_698e574a7cfc8194b478c8c014958954084a49f38f0029bb`)
- Removed admin passcode gating and related code paths
- Verified Vercel setup and production redeploy

## Infrastructure

- GitHub: https://github.com/deevyb/voice-cafe-cashier
- Upstream: `deevyb/delo-kiosk` (configured as `upstream` remote)
- Vercel: deployed (`voice-cafe-cashier.vercel.app`)
- Supabase: `voice-cafe-cashier` (`kvlkuoeemroveoodqbtv`) created in `us-west-1`
- OpenAI Stored Prompt ID: `pmpt_698e574a7cfc8194b478c8c014958954084a49f38f0029bb`
