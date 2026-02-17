# Project Status

> Last Updated: February 16, 2026 (session 5)

## Current State

| Step | Status | Notes |
|------|--------|-------|
| Step 0: Fork + Setup | complete | Repo/workflow setup done, new Supabase project created, env + OpenAI SDK installed |
| Step 1: Stored Prompt + Tools | complete | Stored prompt created and ID wired locally (`OPENAI_STORED_PROMPT_ID`) |
| Step 2: Database Schema | complete | Orders now use `items` JSONB + statuses (`placed`,`in_progress`,`completed`,`canceled`) |
| Step 3: Text Mode (Responses API) | complete | Added `/api/chat` + new `VoiceCashierClient` text/cart flow with tool-call handling |
| Step 4: Voice Mode (Realtime API) | complete | M1 (WebRTC + voice), M2 (tool calls + cart), M3 (finalize polish, error handling, Place Order button) all complete. |
| Step 5: Rebrand (NYC theme) | complete | Full rebrand from Delo to "Coffee Rooom" — new palette, fonts, landing page, all 36 files updated |
| Step 6: Kitchen View Update | complete | Kitchen supports Queue/In Progress/Done, redesigned order cards, overflow menu on in-progress orders |
| Step 7: Owner Dashboard | complete | Analytics dashboard with date picker, recharts line chart, avg order value, avg fulfillment time, add-on breakdown, timezone fix |
| Step 8: Deliverables + Polish | complete | Seed script (86 orders, 8am-4pm ET), orders.csv, README rewrite, TECHNICAL.md update, kitchen/dashboard polish |
| Step 9: Edge Case Testing | pending | |

## What's Next

1. Step 9: Edge Case Testing

## Blockers

- None currently

## Completed This Session (Feb 16, session 5)

### Kitchen Done Tab Polish
- **Fulfillment time badge**: Completed order cards now show clock icon + fulfillment duration (e.g. `🕐 4 min`) in top-right, computed from `created_at → updated_at`. Canceled orders hide the time badge entirely.
- **Overflow menu on Done tab**: Both completed and canceled cards now have three-dot overflow menu:
  - Completed: "Back to Queue" + "Cancel Order"
  - Canceled: "Back to Queue" + "Mark as Completed"
- **Font weight bump**: Time badge and overflow menu text bumped to `font-medium` (500) across both in-progress and done tabs
- **Cancel handler fix**: `handleCancel` in KitchenClient now updates order in local state (was removing it), so canceled orders appear in Done tab immediately
- **Helper function**: Added `getFulfillmentTime()` to compute duration between `created_at` and `updated_at`

## Completed This Session (Feb 16, session 4)

### Step 8 continued: Polish + Bug Fixes
- **Seed script improvements**: Shop hours 8am-4pm (was 7am-8pm), 86 total orders (80 + 6 for today), improved delete logic (batch by IDs), Feb 16 added as a day
- **Dashboard timezone fix**: Hardcoded `America/New_York` (was using browser timezone, showing 3am orders for Pacific users)
- **Dashboard chart**: Fixed to always show 8am-4pm range (was auto-fitting to data range with ±1hr padding)
- **Dashboard Popular Items**: Absolute positioning so Modifier Preferences drives row height, scrollable list
- **Dashboard Add-On order**: Fixed category order to syrups → shots → sweetness → ice
- **Kitchen "Back to Queue" bug**: PATCH endpoint now accepts `placed` status (was rejecting it)
- **Kitchen Done tab**: Now includes canceled orders with red badge + X icon
- **Kitchen card layout**: Flex column with buttons/badges pinned to bottom via `mt-auto`
- **Kitchen sort order**: In-progress orders now sort oldest-first (was newest-first)
- **Supabase DELETE RLS policy**: Added missing policy so seed script can delete orders via anon key

## Completed This Session (Feb 16, session 3)

### Step 8: Deliverables + Polish
- **Seed script** (`scripts/seed-orders.ts`): Standalone Node script inserts 80 realistic orders into Supabase for Feb 9-15, 2026. Weighted random distributions for hourly patterns (weekday vs weekend), item frequency (Latte #1 at 24%), item count per order (51% single-item), modifiers (size, temp, milk, extras), and order statuses (89% completed historical). Loads `.env.local`, prompts before deleting existing orders, batch inserts, and writes CSV.
- **CSV export** (`orders.csv`): 80 rows with order_id, customer_name, status, item_count, total_price, items_summary, created_at. Human-readable items_summary format.
- **README.md rewrite**: Replaced Delo Coffee Kiosk README with Coffee Rooom content — architecture, pages, setup, sample data, project structure.
- **TECHNICAL.md update**: Updated date, replaced "Pending — Step 5" section with Design + Owner Dashboard (Step 7) sections.
- **Verified**: Dashboard shows 80 orders, $7.35 avg order value, 5.4 min avg fulfillment, Latte on top, realistic modifier/add-on breakdowns.

## Completed This Session (Feb 16, session 2)

### Dashboard Polish & Bug Fixes
- **Chart x-axis**: Changed time labels from `14:00` → `2pm` format, bumped font size from 12px → 14px
- **Chart title**: Now includes date context ("Orders by Hour – Today" / "Orders by Hour – Feb 12")
- **Metric scoping fix**: AOV, fulfillment time, popular items, modifiers were all scoped to target date only — fixed so they use `scopedOrders` (cumulative when no date, target date when date selected)
- **All-time default mode**: DatePicker now defaults to `null` (shows "All Time" pill with calendar icon). When no date selected, all metrics show all-time data except "Today" card and hourly chart. Picking a date narrows ALL widgets to that date.
- **StatsCards**: Removed "making" from all-time card, renamed "making" → "in progress" on today/date card
- **DatePicker UX**: Calendar icon always visible (was disappearing when date selected), X button to clear date back to "All Time"

### New Widget: Add-On Breakdown
- **API** (`/api/admin/stats`): Categorizes `item.extras[]` into shots/syrups/sweetness/ice via regex. Normalizes syrup names (strips pump counts). Computes percentage breakdown per category + attach rate (% of orders with each add-on type).
- **New `addOnBreakdown` + `addOnAttachRate`** fields added to `DashboardStats` type
- **`AddOnBreakdown.tsx`** component: Mirrors ModifierPreferences layout (grouped categories, progress bars). Each category header has a pill badge showing attach rate (e.g. "38% of orders").
- Renders full-width below Popular Items / Modifier Preferences row

## Completed Previous Session (Feb 16, session 1)

### Step 7: Owner Dashboard (new)
- **Rewrote `/api/admin/stats`**: Timezone-aware date filtering (`timezone` + `date` query params), `updated_at` selected for fulfillment time, new metrics: `avgOrderValue` (from `calculatePrice()`), `avgFulfillmentTime` (completed orders), `timeSeries` (hourly buckets). Popular items and modifiers scoped to target date.
- **Extended `DashboardStats` type** (`lib/supabase.ts`): Added `TimeSeriesPoint`, `avgOrderValue`, `avgFulfillmentTime`, `timeSeries`, `targetDate`, `isToday`
- **Created 7 dashboard components** (`components/dashboard/`):
  - `OwnerDashboard.tsx` — Main container with header, NavMenu, date picker, fetch logic, loading skeleton, error state
  - `StatsCards.tsx` — Two cards (target date + cumulative) with status breakdown
  - `SummaryMetrics.tsx` — Avg order value + avg fulfillment time
  - `OrdersChart.tsx` — Recharts `LineChart`, orders by hour, `cafe-coffee` color
  - `PopularItems.tsx` — Top items list (renamed from "Drinks" to "Items")
  - `ModifierPreferences.tsx` — Progress bar breakdown by category
  - `DatePicker.tsx` — Calendar dropdown with `react-day-picker`, future dates disabled, reset button
- **Rewrote `app/admin/page.tsx`**: Replaced broken `menu_items`/`modifiers` fetch with `<OwnerDashboard />`
- **Added calendar CSS** (`app/globals.css`): `.cafe-calendar` styles for react-day-picker with brand colors
- **Deleted 16 dead files**: AdminClient, AdminTabs, 4 menu CRUD components, 3 modifier CRUD components, DashboardSection, OrderClient, DrinkCard, DrinkCustomizer, ModifierSelector, 2 dead API routes + empty directories
- **Installed dependencies**: `recharts`, `react-day-picker`

### Kitchen Page Improvements
- **Tab label**: "Making" → "In Progress"
- **Button label**: "Start Making" → "In Progress"
- **Item formatting redesign** (Option C): Single-line with bold name + colon + dot-separated modifiers (e.g. `Latte: 12oz · Whole Milk · Hot`), extras on second line without "extras:" prefix
- **Food item filtering**: Added `isFoodItem()` to `lib/menu.ts` — derives pastry status from `BASE_PRICES` (items where small === large). Used in both `OrderCard` and `CartItem` to skip size/milk/temp for pastries.
- **Quantity badge**: Pill-style `2x` badge before item name (consistent across OrderCard, CartItem, confirmation overlay)
- **In-progress overflow menu**: Three-dot button on in-progress order cards with "Back to Queue" (sets status back to `placed`) and "Cancel Order" options
- **`handleBackToQueue` handler** in KitchenClient: PATCH order status to `placed`
- **Nav bar consistency**: Admin dashboard now uses same `NavMenu` component (nine-dot grid icon) as kitchen page
- **Header alignment fix**: Both `/admin` and `/kitchen` headers now use consistent padding pattern so title/nav align with content below

### Cross-cutting
- **Shared `isFoodItem()` utility** (`lib/menu.ts`): Automatically detects food items from price data (small === large), used in kitchen OrderCard and cart CartItem
- **Consistent quantity badge**: `[2x]` pill badge used in OrderCard, CartItem, and both confirmation overlay sections in VoiceCashierClient

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
