# Project Status

> Last Updated: February 13, 2026

## Current State

| Step | Status | Notes |
|------|--------|-------|
| Step 0: Fork + Setup | complete | Repo/workflow setup done, new Supabase project created, env + OpenAI SDK installed |
| Step 1: Stored Prompt + Tools | complete | Stored prompt created and ID wired locally (`OPENAI_STORED_PROMPT_ID`) |
| Step 2: Database Schema | complete | Orders now use `items` JSONB + statuses (`placed`,`in_progress`,`completed`,`canceled`) |
| Step 3: Text Mode (Responses API) | complete | Added `/api/chat` + new `VoiceCashierClient` text/cart flow with tool-call handling |
| Step 4: Voice Mode (Realtime API) | in-progress | M1 complete (WebRTC connection, voice conversation, auto-greeting). M2 complete (voice tool-call handling, cart updates, model switch to GA). M3 pending. |
| Step 5: Rebrand (NYC theme) | pending | |
| Step 6: Kitchen View Update | complete | Kitchen supports Queue/Making/Done, multi-item rendering, and new status flow |
| Step 7: Owner Dashboard | pending | |
| Step 8: Deliverables + Polish | pending | |
| Step 9: Edge Case Testing | pending | |

## What's Next

1. Step 4 M3: Order finalization via voice, error handling, mic denial UX, disconnect cleanup
2. Step 5: Rebrand UI from Delo to NYC cafe visual system
3. Step 7: Upgrade owner dashboard visualizations and metrics depth

## Blockers

- None currently

## Completed This Session (Feb 13 — latest)

- **Switched voice model from preview to GA**: Changed from `gpt-4o-realtime-preview` to `gpt-realtime-mini` (generally available) in both `app/api/realtime/token/route.ts` and `hooks/useRealtimeSession.ts`
  - Preview models couldn't combine audio output with tool calls; GA model supports both
  - Removed problematic `output_modalities: ['text', 'audio']` from token endpoint that caused session creation failures
- **Fixed GA model event name difference**: Added `response.output_audio.delta` case (GA format) alongside `response.audio.delta` (preview format) for `isSpeaking` state tracking
- **Fixed `modify_item` tool failures**: AI model sent `modify_item` without the `changes` field because the schema was too vague (`{ type: 'object' }` with no properties)
  - Added explicit properties to `changes` schema in `lib/realtime-config.ts`: `name`, `size`, `milk`, `temperature`, `extras`, `quantity`, `price`
  - Added defensive fallback in `lib/cart-utils.ts`: if `changes` is missing, top-level non-`cart_index` fields are treated as the changes
- Added `response.output_audio_transcript.done` case in event handler (no-op, prevents default logging noise)
- Cleaned up all debug instrumentation after verification

## Completed Earlier (Feb 13)

- Implemented Voice Mode Milestone 2 (Step 4 M2):
  - Extracted shared `applyToolCall` utility to `lib/cart-utils.ts` — deduplicates cart mutation logic between text and voice modes
  - Rewrote `handleToolCall` in `hooks/useRealtimeSession.ts`: parses tool-call arguments from JSON, applies cart mutations (`add_item`, `modify_item`, `remove_item`), calls `onCartUpdate` to update UI, sends enriched function output (with cart) back to OpenAI, handles `finalize_order` via `onFinalize` callback
  - Added `cartRef` inside the hook to track cart state across sequential tool calls (e.g., multi-item orders)
  - Updated `app/api/chat/route.ts` to import from shared `lib/cart-utils.ts` instead of local function
  - Cart resets on voice session disconnect
  - No changes needed to `VoiceCashierClient.tsx` — existing wiring (`onCartUpdate: setCart`, `onFinalize: handleVoiceFinalize`) now works end-to-end

- Implemented Voice Mode Milestone 1 (Step 4 M1):
  - New `/api/realtime/token/route.ts`: ephemeral token endpoint for WebRTC auth with OpenAI
  - New `hooks/useRealtimeSession.ts`: WebRTC hook managing peer connection, data channel, mic access, audio playback, session lifecycle
  - New `components/voice/VoiceIndicator.tsx`: animated voice UI with connection states (idle/connecting/listening/AI speaking/error)
  - Integrated voice mode into `VoiceCashierClient.tsx` with two-column layout (voice indicator + cart panel)
  - Refactored component to call hooks unconditionally (React rules compliance)
  - Added mode switching with proper voice session disconnect cleanup
- Debugged and fixed voice session issues:
  - Fixed stale Next.js build cache error (deleted `.next`, restarted dev server)
  - Fixed "Missing required parameter: session.type" error on disconnect (added `type`/`model` to `session.update`, clear error state on disconnect)
  - **Root cause fix**: Stored prompt (`gpt-5.2`) incompatible with Realtime API (`gpt-4o-mini-realtime-preview`) due to model mismatch. Resolved by passing prompt instructions inline via `VOICE_INSTRUCTIONS` constant in `lib/realtime-config.ts`
  - Voice now auto-greets, knows the full menu, and responds in the cafe cashier personality
- Added `VOICE_INSTRUCTIONS` constant to `lib/realtime-config.ts` — identical prompt content to the stored dashboard prompt, delivered inline for voice mode (text mode still uses stored prompt ID)
- Cleaned up all debug instrumentation after verification
- Added dependency: `framer-motion` for voice indicator animations

## Completed Earlier (Feb 13)

- Implemented server-side iterative tool-call loop in `app/api/chat/route.ts`
- Chat UX polish: markdown rendering, autoscroll, input focus, cart display improvements
- Mode selector button renamed from "Text" to "Chat"

## Completed Earlier (Feb 12)

- Deduplicated prompt management, stored prompt as single source of truth
- Synced upstream delo-kiosk kitchen commits
- Created Supabase project, applied migrations, Vercel deployment
- Implemented Steps 2 + 3 (schema + text mode)
- Cross-tool workflow formalized, `OPENAI_PROMPT.md` added
- Removed admin passcode gating

## Architecture Note: Voice vs Text Prompt Delivery

- **Text mode**: Uses stored prompt ID (`OPENAI_STORED_PROMPT_ID`) via Responses API — `gpt-5.2`
- **Voice mode**: Uses inline `VOICE_INSTRUCTIONS` constant via Realtime API — `gpt-realtime-mini` (GA)
- Same prompt content, different delivery mechanisms due to model family incompatibility
- When updating the menu/rules: update the OpenAI dashboard prompt AND `VOICE_INSTRUCTIONS` in `lib/realtime-config.ts`

## Infrastructure

- GitHub: https://github.com/deevyb/voice-cafe-cashier
- Upstream: `deevyb/delo-kiosk` (configured as `upstream` remote)
- Vercel: deployed (`voice-cafe-cashier.vercel.app`)
- Supabase: `voice-cafe-cashier` (`kvlkuoeemroveoodqbtv`) created in `us-west-1`
- OpenAI Stored Prompt ID: `pmpt_698e574a7cfc8194b478c8c014958954084a49f38f0029bb`
