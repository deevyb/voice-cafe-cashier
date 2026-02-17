# Technical Documentation

> Last updated: February 16, 2026

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14 (App Router) | Server Components, built-in API routes, Vercel deployment |
| **Styling** | Tailwind CSS | Rapid iteration, custom palette, no CSS overhead |
| **Animations** | Framer Motion | Smooth transitions, declarative API |
| **Database** | Supabase (PostgreSQL) | Realtime subscriptions for kitchen display, reliable, free tier |
| **Text AI** | OpenAI Responses API | Streaming, tool calling, stored prompt support |
| **Voice AI** | OpenAI Realtime API (WebRTC) | Low-latency, full-duplex, browser-direct audio |
| **Hosting** | Vercel | Zero-config Next.js, auto-deploy on push |

---

## Architecture

```
app/
  page.tsx                        # Landing — mode selector (Voice / Text)
  order/page.tsx                  # AI ordering experience
  kitchen/page.tsx                # Barista display (realtime)
  admin/page.tsx                  # Owner dashboard
  api/
    chat/route.ts                 # Responses API — text mode
    realtime/token/route.ts       # Ephemeral token — voice mode
    orders/route.ts               # POST: create order (multi-item)
    orders/[id]/route.ts          # PATCH: update order status
    admin/
      stats/route.ts              # GET: dashboard analytics
      orders/route.ts             # GET: CSV export
components/
  VoiceCashierClient.tsx          # Main ordering container
  chat/                           # Text mode UI
    ChatPanel.tsx                 #   Conversation display
    AIMessage.tsx                 #   AI message bubble
    UserMessage.tsx               #   Customer message bubble
    TextInput.tsx                 #   Input bar + send
  voice/                          # Voice mode UI
    VoiceIndicator.tsx            #   Mic animation + status
  cart/                           # Shared cart UI
    CartPanel.tsx                 #   Live cart display
    CartItem.tsx                  #   Individual item row
    ReceiptView.tsx               #   Post-order receipt
  KitchenClient.tsx               # Kitchen display logic
  KitchenTabs.tsx                 # 3 tabs: Queue/In Progress/Done
  OrderCard.tsx                   # Render items array
  dashboard/                      # Owner dashboard
    OwnerDashboard.tsx            #   Main container + fetch logic
    StatsCards.tsx                #   Order count cards
    SummaryMetrics.tsx            #   AOV + fulfillment time
    OrdersChart.tsx               #   Orders by hour (Recharts)
    PopularItems.tsx              #   Top items list
    ModifierPreferences.tsx       #   Modifier breakdowns
    AddOnBreakdown.tsx            #   Add-on categories + attach rates
    DatePicker.tsx                #   Date selection
  NavMenu.tsx                     # Navigation menu
  ErrorBoundary.tsx               # Error boundary
hooks/
  useRealtimeSession.ts           # WebRTC + Realtime API lifecycle
lib/
  supabase.ts                     # DB client + types
  menu.ts                         # Price calculation + menu data
  realtime-config.ts              # Voice mode session config
scripts/
  seed-orders.ts                  # Seed realistic order data
  test-edge-cases.ts              # Automated edge case tests
```

### Data Flow

1. **Text mode**: Customer types → `/api/chat` → Responses API → server-side agentic loop (execute tool calls, feed `function_call_output` back via `previous_response_id`, repeat until text reply; max 6 iterations) → returns final text + authoritative cart to client
2. **Voice mode**: Customer speaks → WebRTC → Realtime API → tool calls via data channel → client updates cart
3. **Finalize order**: `finalize_order` tool → client POSTs to `/api/orders` → Supabase INSERT
4. **Kitchen**: Supabase Realtime → pushes new/updated orders via WebSocket
5. **Status updates**: Barista taps button → PATCH `/api/orders/[id]` → Supabase UPDATE → Realtime broadcast

---

## Database Schema (Planned)

The new project uses a single `orders` table. Menu items and modifiers are **not** stored in the database — they live in the OpenAI stored prompt.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed', 'in_progress', 'completed', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

Realtime must be enabled on the `orders` table.

### Schema Notes

- `items` is a JSONB array of `CartItem` objects (see Types below)
- Status flow: `placed` → `in_progress` → `completed` (or `canceled` from any state)
- No `menu_items` or `modifiers` tables — the AI prompt is the menu source of truth
- This is a NEW Supabase project (not the Delo one)

### Types — `lib/supabase.ts`

```typescript
export type OrderStatus = 'placed' | 'in_progress' | 'completed' | 'canceled'

export interface CartItem {
  name: string
  size?: string
  milk?: string
  temperature?: string
  extras?: string[]
  quantity: number
  price?: number
}

export interface Order {
  id: string
  customer_name: string
  items: CartItem[]
  status: OrderStatus
  created_at: string
  updated_at: string
}
```

---

## API Endpoints

### POST /api/chat (NEW)

Text mode AI conversation via OpenAI Responses API.

```
Request:  { messages: ChatMessage[], cart: CartItem[] }
Response: Streamed — text chunks + tool calls
```

- References stored prompt ID for system instructions + tool definitions
- Client handles tool execution locally (cart state updates)
- Client sends `function_call_output` back in next request for context

### POST /api/realtime/token (NEW)

Returns ephemeral token for Realtime API WebRTC connection.

```
Response: { client_secret: { value: string }, ... }
```

- Server-side only (protects OPENAI_API_KEY)
- Token is short-lived, single-use

### POST /api/orders

Creates a finalized order.

```
Request:  { customer_name: string, items: CartItem[] }
Response: Order object
```

Changed from Delo: accepts `items` array instead of single `item` + `modifiers`.

### PATCH /api/orders/[id]

Updates order status.

```
Request:  { status: 'in_progress' | 'completed' | 'canceled' }
```

Changed from Delo: added `in_progress` and `completed` (was `ready`).

### GET /api/admin/stats

Returns dashboard analytics. Will be enhanced to extract metrics from `items` JSONB (popular items, modifier trends, etc.).

### GET /api/admin/orders

CSV export of orders. Unchanged pattern, updated for new schema.

## OpenAI Integration

### Stored Prompt

A single stored prompt in the OpenAI dashboard contains:
- System instructions (personality, behavior rules)
- Full coffee shop menu (items, sizes, prices, modifiers)
- Hidden rules (no hot frappuccinos, max 6 shots, etc.)
- 4 tool definitions

**Prompt ID** will be stored in `lib/realtime-config.ts` and referenced by both APIs.

### Tool Definitions

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `add_item` | Add item to cart | name, size, milk, temperature, extras, quantity |
| `modify_item` | Change existing cart item | cart_index, changes object |
| `remove_item` | Remove item from cart | cart_index |
| `finalize_order` | Customer confirms order | customer_name |

### Text Mode (Responses API)

- Server-side API route streams response
- Tool calls returned inline with text
- Client executes tools locally → updates cart state
- Conversation history maintained on client

### Voice Mode (Realtime API via WebRTC)

1. Client fetches ephemeral token from `/api/realtime/token`
2. Creates `RTCPeerConnection` + gets microphone
3. Opens data channel (`oai-events`) for tool calls
4. SDP offer/answer handshake with OpenAI
5. `session.update` sent with stored prompt ID + tools
6. Tool calls arrive via data channel → cart updates
7. AI audio plays through `<audio>` element

No transcript displayed in voice mode — just voice indicator + cart.

---

## Realtime Strategy

### Kitchen Display (Supabase Realtime)

```typescript
supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleOrderChange)
  .subscribe()
```

### Fallback

- Disconnection: show "Reconnecting..." banner
- Fall back to polling every 5 seconds
- Auto-reconnect when restored
- Orders persist in DB regardless

---

## Authentication

Admin dashboard is intentionally open for this project (no passcode gate).

---

## Error Handling

### Customer-Facing (Ordering)

- Never show technical errors
- Friendly messages: "Something went wrong. Please try again."
- Voice mode: graceful handling of mic issues, connection drops

### Kitchen Display

- "Offline — reconnecting..." banner (non-blocking)
- Orders persist locally until reconnected

### Dashboard

- More detailed errors acceptable (export failed, data load issues)

---

## Environment Variables

```env
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# Supabase (Required) — NEW project, not the Delo one
NEXT_PUBLIC_SUPABASE_URL=https://[new-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Prompt (Required)
OPENAI_STORED_PROMPT_ID=pmpt_...
```

---

## Deployment

### Infrastructure (Current)

- **GitHub:** https://github.com/deevyb/voice-cafe-cashier
- **Vercel:** `coffee-rooom.vercel.app` (production connected)
- **Supabase:** `voice-cafe-cashier` (`kvlkuoeemroveoodqbtv`, `us-west-1`)

### Setup Checklist

- [x] Create new Supabase project
- [x] Run schema migration (orders table)
- [x] Enable Realtime on orders table
- [x] Connect Vercel to voice-cafe-cashier repo
- [x] Set env vars in Vercel (OPENAI_API_KEY, OPENAI_STORED_PROMPT_ID, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [x] Verify deploy

---

## Animation Guidelines

Using Framer Motion:

- Button press: scale(0.98) + background shift
- Card appear: fade in + slide up (200-300ms)
- Card remove: fade out + slide (200ms)
- Modal: backdrop fade + content scale from 0.95
- Voice indicator: pulsing animation synced to speech state
- Cart item add: highlight flash on new/modified items
- Use `transform` and `opacity` primarily for performance

---

## Design

Rebranded from Delo to **Coffee Rooom** (Step 5):

- **Palette:** charcoal (`#2C2C2C`), off-white (`#FAF9F6`), warm caramel (`#C8956C`), espresso brown
- **Font:** Inter (clean, modern)
- **CSS classes:** All `.delo-*` references replaced with `cafe-*` Tailwind tokens

## Owner Dashboard (Step 7)

Analytics at `/admin` with:

- **Stats cards**: Today/all-time order counts by status
- **Summary metrics**: Average order value, average fulfillment time
- **Orders chart**: Recharts line chart — orders by hour with `2pm` format labels
- **Popular items**: Top items list ranked by order count
- **Modifier preferences**: Size, milk, temperature breakdowns with progress bars
- **Add-on breakdown**: Shots, syrups, sweetness, ice categories with attach rates
- **Date picker**: `react-day-picker` — defaults to "All Time", pick any date to narrow all widgets

All metrics are timezone-aware (`America/New_York`) and scoped to the selected date or all-time.

## Edge Case Testing (Step 9)

Automated test suite at `scripts/test-edge-cases.ts` — 49 test cases across 11 categories:

```bash
npx tsx scripts/test-edge-cases.ts
```

Categories: menu defaults, iced-only drinks, extra shots, milk/tea constraints, pastry constraints, multi-item orders, cart modifications, off-menu guardrails, menu inquiry, adversarial prompts, ordering flow/finalization.

Results: 90% pass, 0 true failures. Full analysis in [`EDGE_CASE_TESTS.md`](./EDGE_CASE_TESTS.md).
