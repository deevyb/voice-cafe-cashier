# Project Status

> Last Updated: February 14, 2026 (late evening session)

## Current State

| Step | Status | Notes |
|------|--------|-------|
| Step 0: Fork + Setup | complete | Repo/workflow setup done, new Supabase project created, env + OpenAI SDK installed |
| Step 1: Stored Prompt + Tools | complete | Stored prompt created and ID wired locally (`OPENAI_STORED_PROMPT_ID`) |
| Step 2: Database Schema | complete | Orders now use `items` JSONB + statuses (`placed`,`in_progress`,`completed`,`canceled`) |
| Step 3: Text Mode (Responses API) | complete | Added `/api/chat` + new `VoiceCashierClient` text/cart flow with tool-call handling |
| Step 4: Voice Mode (Realtime API) | complete | M1 (WebRTC + voice), M2 (tool calls + cart), M3 (finalize polish, error handling, Place Order button) all complete. |
| Step 5: Rebrand (NYC theme) | pending | |
| Step 6: Kitchen View Update | complete | Kitchen supports Queue/Making/Done, multi-item rendering, and new status flow |
| Step 7: Owner Dashboard | pending | |
| Step 8: Deliverables + Polish | pending | |
| Step 9: Edge Case Testing | pending | |

## What's Next

1. Step 5: Rebrand UI from Delo to NYC cafe visual system
2. Step 7: Upgrade owner dashboard visualizations and metrics depth
3. Step 8: Deliverables + Polish

## Blockers

- None currently

## Completed This Session (Feb 14 late evening — latest)

- **Order confirmation receipt card**: Replaced the simple comma-separated item list on the confirmation overlay with a styled receipt card showing item name, size, milk, quantity, per-item price, and total. Clean white card with dividers inside the existing animated overlay.
- **Manual dismiss instead of auto-redirect**: Removed the 3.5s auto-redirect to `/order`. Added a "Done" button that resets state in-app (no full page reload) and returns to the mode selector. Added 30s auto-dismiss fallback if untouched.
- **Fixed `resetOrderState` initialization order**: Moved `useEffect` that references `resetOrderState` to after the `useCallback` definition to fix `ReferenceError: Cannot access before initialization`.

## Completed Earlier (Feb 14 evening)

- **Full-screen order confirmation**: Replaced inline `ReceiptView` with a full-screen animated confirmation overlay (checkmark icon, "On it!", customer name, item list) using framer-motion spring animation. Auto-redirects to `/order` after 3.5 seconds. Works in both text and voice modes.
- **Kitchen queue bug fix**: Orders were not appearing in `/kitchen` because Next.js 14 was caching the Supabase fetch response. Added `unstable_noStore()` from `next/cache` to the kitchen server component to opt out of fetch caching.

## Completed Earlier (Feb 14)

- **Step 4 M3 complete**: Voice order finalization, error handling, and polish:
  - **Manual "Place Order" button**: Added to `CartPanel` (both text + voice modes) with inline name input. Users can finalize orders without relying on the AI.
  - **Async finalize with AI feedback**: `handleToolCall` now awaits `onFinalize` and sends real `{ success: true/false }` to the AI. On failure, the AI can naturally inform the customer.
  - **Submitting state**: Added `isSubmitting` state — shows "Placing your order..." in both VoiceIndicator and CartPanel during order submission.
  - **Mic denial UX**: Exposed `micDenied` state from hook. VoiceIndicator shows mic-off icon + step-by-step instructions when mic access is denied.
  - **WebRTC disconnect detection**: Added `iceconnectionstatechange` listener + data channel error/close handlers. Distinguishes intentional disconnect from unexpected drops. Auto-reconnects once on connection loss, then shows manual "Reconnect" error.
  - **Mode switch reset**: Cart, receipt, `orderFinalized`, and messages all reset when switching modes.
  - **Empty cart guard**: `finalize_order` on empty cart is rejected in both `cart-utils.ts` and the voice hook.

- **Instrumentation cleanup complete**: Removed temporary debug `fetch(.../ingest/...)` logging from `hooks/useRealtimeSession.ts`, `lib/cart-utils.ts`, and `app/api/chat/route.ts` after user-confirmed fix verification. Kept functional behavior changes intact.
- **Fixed missing prices on cart items**: Created `lib/menu.ts` with deterministic price calculator (`calculatePrice()`) based on menu lookup. Prices are now computed from item properties (name, size, milk, extras) instead of relying on the AI model to supply them. Applied in `lib/cart-utils.ts` for both `add_item` and `modify_item`. Removed `price` from tool schemas.
- **Fixed multi-item voice ordering UX**: Updated `VOICE_INSTRUCTIONS` in `lib/realtime-config.ts` to instruct the model to add items one at a time with brief acknowledgments, instead of batching all items after repeating the full order. This is a voice-specific change — the text mode dashboard prompt keeps "add all of them" behavior which is correct for chat UX.
- **Fixed off-menu items being accepted (e.g. Hot Chocolate)**: Added `enum` constraint to the `name` field in the `add_item` tool schema, restricting it to valid menu item names. Also added client-side validation in `applyToolCall` via `isValidMenuItem()` as a fallback.
- **New file**: `lib/menu.ts` — canonical menu data (item names, base prices, add-on costs) used for validation and pricing.
- **Prompt divergence established**: `VOICE_INSTRUCTIONS` and the stored dashboard prompt now intentionally differ on multi-item handling. Comment added to `lib/realtime-config.ts` documenting this.

## Completed Earlier (Feb 13)

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
- **Voice mode**: Uses inline `VOICE_INSTRUCTIONS` constant via Realtime API — `gpt-realtime` (configurable via env)
- Prompts share the same menu/rules but **intentionally diverge** on UX-sensitive behavior:
  - Multi-item ordering: voice adds one-at-a-time; text batches all at once
- When updating the menu/rules: update the OpenAI dashboard prompt AND `VOICE_INSTRUCTIONS` in `lib/realtime-config.ts`
- Price calculation is handled by `lib/menu.ts` (not by the AI) — update prices there when the menu changes

## Infrastructure

- GitHub: https://github.com/deevyb/voice-cafe-cashier
- Upstream: `deevyb/delo-kiosk` (configured as `upstream` remote)
- Vercel: deployed (`voice-cafe-cashier.vercel.app`)
- Supabase: `voice-cafe-cashier` (`kvlkuoeemroveoodqbtv`) created in `us-west-1`
- OpenAI Stored Prompt ID: `pmpt_698e574a7cfc8194b478c8c014958954084a49f38f0029bb`
