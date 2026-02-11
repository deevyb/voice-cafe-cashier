# Plan: Fork delo-kiosk → AI Voice Cashier

## Context

Fork **delo-kiosk** as-is (no changes to original) into an **AI voice cashier for a NYC coffee shop** for a PM interview take-home. Deliverables: public GitHub repo, deployed URL, orders.csv. 60-min live demo after submission.

## Multi-Session Workflow Setup

This project is designed to be worked on across multiple Claude Code and Cursor sessions. After forking (Step 0), create these files in the new project:

### `.claude/rules/status.md` — Single source of truth (auto-loaded)

### `.claude/commands/save-status.md` — Claude Code slash command

### `.cursor/rules/status.mdc` — Cursor auto-loaded rule

### `.cursor/rules/save-status.mdc` — Cursor save status rule

### `PLAN.md` — This file

---

## Architecture Decisions

| Decision | Choice |
|----------|--------|
| **Voice backend** | OpenAI Realtime API via WebRTC (low-latency, full-duplex, browser-direct) |
| **Text backend** | OpenAI Responses API (newer successor to Chat Completions) |
| **Mode switching** | Customer picks voice or text at start — locked for the session |
| **Prompt management** | Stored prompts via OpenAI dashboard (one prompt ID, shared by both APIs) |
| **Tool calling** | 4 granular tools: `add_item`, `modify_item`, `remove_item`, `finalize_order` |
| **Cart UX** | Live cart panel updates in real-time as AI processes orders |
| **Voice mode UI** | Voice indicator (left) + live cart (right) — NO text transcript |
| **Text mode UI** | Chat conversation (left) + live cart (right) |
| **Menu storage** | In the stored prompt only (no DB menu table) |
| **Build order** | Text mode first → voice mode second |
| **Hosting** | Vercel (keep existing setup) |

---

## Step 0: Fork + Setup

### Step 0A: TODAY — Fork, clone, workflow setup (~15 min)

- Fork `deevyb/delo-kiosk` on GitHub → `voice-cafe-cashier` (public repo)
- Clone to `~/Desktop/voice-cafe-cashier`
- Copy this plan into the project as `PLAN.md`
- Create all workflow management files (listed in "Multi-Session Workflow Setup" above)
- Create `CLAUDE.md` for the new project
- Initial commit + push

### Step 0B: LATER — Supabase + env vars + dependencies

- Create NEW Supabase project (separate from Delo)
- Set up `.env.local`: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSCODE`
- `npm install openai`
- Verify `npm run dev` works

---

## Step 1: Stored Prompt + Tools in OpenAI Dashboard (~30 min)

Create a stored prompt in the OpenAI dashboard with:

**System instructions:**
- Personality: friendly, efficient NYC coffee shop cashier — concise, not chatty
- Full menu with items, sizes, prices, modifier options
- Hidden rules: no hot frappuccinos, max 6 espresso shots, "latte no espresso = milk", etc.
- Behavior: ask clarifying questions when needed, read back order when finalizing
- Mode-specific notes (voice: keep responses brief; text: use line breaks)

**4 tools defined in the prompt:**

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `add_item` | Add item to cart | name, size, milk, temperature, extras, quantity |
| `modify_item` | Change existing cart item | cart_index, changes |
| `remove_item` | Remove item from cart | cart_index |
| `finalize_order` | Customer confirms order | customer_name |

This prompt ID will be referenced by both the Responses API (text) and Realtime API (voice), and can be iterated on in the dashboard without redeploying.

---

## Step 2: Database Schema (~20 min)

### Orders table (multi-item, new statuses)

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

Enable Realtime on the orders table.

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

### Update API routes

- `app/api/orders/route.ts` — accept `{ customer_name, items }` (items is CartItem[])
- `app/api/orders/[id]/route.ts` — accept `in_progress` and `completed` statuses

---

## Step 3: Text Mode — Responses API (~1.5 hours)

Build text mode first as the working MVP.

### 3A. API Route — `app/api/chat/route.ts` (NEW)

```
POST /api/chat
Body: { messages: [...conversation history...], cart: CartItem[] }
Returns: streamed response with text + tool calls
```

- Uses Responses API with stored prompt ID
- Streams response back to client
- When AI calls a tool (add_item, modify_item, etc.), the response includes the function_call
- Client handles tool execution locally (update cart state)
- Client sends function_call_output back in next request for context

### 3B. Chat UI Components

**`components/VoiceCashierClient.tsx`** (NEW — replaces OrderClient.tsx)

Main container with mode selector + two-panel layout:

**Text mode layout:**
```
+-------------------------------+--------------------+
|         CHAT PANEL            |     CART PANEL     |
|                               |                    |
|  [AI]: Welcome! What can I    |  Your Order        |
|  get you today?               |                    |
|                               |  Iced Oat Latte    |
|  [You]: Large iced oat latte  |  Large, +extra     |
|  with an extra shot           |  shot        $5.50 |
|                               |                    |
|  [AI]: Got it! Anything else? |  Cappuccino  x2    |
|                               |  Medium      $9.00 |
|                               |                    |
|  [Type here...        ] [Send]|  Total      $14.50 |
+-------------------------------+--------------------+
```

**New component files:**

| File | Purpose |
|------|---------|
| `components/VoiceCashierClient.tsx` | Main container: mode selector + panels + state |
| `components/chat/ChatPanel.tsx` | Left panel: message list + text input |
| `components/chat/AIMessage.tsx` | AI message bubble (streams text) |
| `components/chat/UserMessage.tsx` | Customer message bubble |
| `components/chat/TextInput.tsx` | Text input bar + send button |
| `components/cart/CartPanel.tsx` | Right panel: live-updating cart |
| `components/cart/CartItem.tsx` | Individual item row (highlights on add/modify) |
| `components/cart/ReceiptView.tsx` | Final receipt after order confirmed |

**State:**
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([])
const [cart, setCart] = useState<CartItem[]>([])
const [mode, setMode] = useState<'voice' | 'text' | null>(null)  // null = selector screen
const [isProcessing, setIsProcessing] = useState(false)
const [orderFinalized, setOrderFinalized] = useState(false)
```

### 3C. Tool Execution on Client

When the Responses API returns a tool call:
```typescript
function handleToolCall(name: string, args: any) {
  switch (name) {
    case 'add_item':
      setCart(prev => [...prev, { ...args, quantity: args.quantity || 1 }])
      break
    case 'modify_item':
      setCart(prev => prev.map((item, i) =>
        i === args.cart_index ? { ...item, ...args.changes } : item
      ))
      break
    case 'remove_item':
      setCart(prev => prev.filter((_, i) => i !== args.cart_index))
      break
    case 'finalize_order':
      submitOrder(args.customer_name, cart)
      break
  }
}
```

---

## Step 4: Voice Mode — Realtime API via WebRTC (~1.5 hours)

Layer voice mode on top of the working text MVP.

### 4A. Ephemeral Token Route — `app/api/realtime/token/route.ts` (NEW)

```typescript
export async function POST() {
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-realtime-preview',
      voice: 'alloy',
    }),
  })
  return NextResponse.json(await response.json())
}
```

### 4B. WebRTC Hook — `hooks/useRealtimeSession.ts` (NEW)

Manages the full Realtime API lifecycle:

```
1. Fetch ephemeral token from /api/realtime/token
2. Create RTCPeerConnection
3. Get user microphone, add audio track
4. Create data channel ("oai-events")
5. Create SDP offer → POST to OpenAI Realtime API endpoint
6. Set remote SDP answer
7. On data channel open: send session.update with stored prompt ID + tools
8. On data channel message: handle tool calls → update cart
9. Connect remote audio stream to <audio> element (AI speaks)
```

**Key data channel events:**

| Event | Action |
|-------|--------|
| `response.function_call_arguments.done` | Parse tool call → update cart state |
| `input_audio_buffer.speech_started` | Show "listening" animation |
| `response.audio.delta` | AI audio playing (show "speaking" animation) |
| `error` | Show error, attempt reconnection |

(No transcript events needed — we're NOT showing text in voice mode)

### 4C. Voice Mode UI

**Voice mode layout** — simpler than text mode, no chat panel:
```
+-------------------------------+--------------------+
|       VOICE INDICATOR         |     CART PANEL     |
|                               |                    |
|                               |  Your Order        |
|           mic icon            |                    |
|                               |  Iced Oat Latte    |
|     [pulsing animation        |  Large, +extra     |
|      when listening]          |  shot        $5.50 |
|                               |                    |
|     "Listening..."            |  Cappuccino  x2    |
|        or                     |  Medium      $9.00 |
|     "Speaking..."             |                    |
|                               |  Total      $14.50 |
|                               |                    |
+-------------------------------+--------------------+
```

New component: `components/voice/VoiceIndicator.tsx` — animated mic/waveform that shows listening vs speaking vs idle states.

### 4D. Shared Cart Logic

Both voice and text modes use the exact same:
- `CartPanel` component (right side)
- `handleToolCall()` function
- `submitOrder()` for finalization
- Cart state management

The only difference is the left panel: `ChatPanel` (text) vs `VoiceIndicator` (voice).

---

## Step 5: Rebrand — NYC Coffee Shop (~30 min)

| File | Change |
|------|--------|
| `tailwind.config.ts` | New palette: charcoal, off-white, warm caramel, espresso brown. Remove `delo-*` |
| `app/layout.tsx` | Swap to Inter font. Remove Yatra One, Bricolage, Cooper, etc. |
| `app/globals.css` | Update shared CSS classes to new colors |
| All components | Find-replace `delo-*` color classes |
| `app/page.tsx` | New landing page: mode selector (Voice / Text) |

---

## Step 6: Update Kitchen View (~45 min)

### Status: placed → in_progress → completed (+ canceled)

**`components/KitchenClient.tsx`:**
- 3 tabs: **Queue** (placed), **Making** (in_progress), **Done** (completed)
- Realtime subscription unchanged (just handle new statuses)

**`components/OrderCard.tsx`:**
- Render `items` array (multi-item):
  ```
  Sarah                    3 min ago
  ---
  1. Large Iced Oat Latte + extra shot
  2. Medium Cappuccino x2
  ---
  [Start Making] [Cancel]
  ```
- Placed: **Start Making** → in_progress
- In-progress: **Done** → completed

---

## Step 7: Owner Dashboard (~1 hour)

`npm install recharts`

**`app/owner/page.tsx`** (reuse `/admin` route) with `PasscodeGate.tsx` (existing).

**`components/OwnerDashboardClient.tsx`** (NEW — replaces `AdminClient.tsx`)

Metrics:
1. Summary cards: total orders, avg items/order, completion rate
2. Orders over time (line chart — hourly/daily)
3. Popular items (horizontal bar chart)
4. Peak hours (bar chart)
5. Modifier trends (milk types, sizes, temperatures)
6. Status breakdown (completed vs canceled)

Keep CSV export from existing `DashboardSection.tsx`.

---

## Step 8: Deliverables + Polish (~30 min)

1. **orders.csv** — Seed 50-100 sample orders, export CSV, include in repo root
2. **Public GitHub repo**
3. **Deploy to Vercel** — set all env vars
4. **Update README.md** — setup, env vars, architecture overview
5. **Rewrite CLAUDE.md + TECHNICAL.md** for new project context

---

## Step 9: Edge Case Testing (~20 min)

- "Hot frappuccino" → rejected
- "Latte no espresso" → redirected
- "20 espresso shots" → capped at 6
- "Make the latte iced" → correct item modified
- "Remove the second item" → correct cart_index
- "Start over" → cart cleared
- Multi-item: "latte, cappuccino, and drip coffee" → all 3 added
- Off-menu: "Can I get pizza?" → politely declined
- Voice: speaking too softly or cutting out → graceful handling

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `app/api/chat/route.ts` | Responses API for text mode |
| `app/api/realtime/token/route.ts` | Ephemeral token for Realtime API |
| `hooks/useRealtimeSession.ts` | WebRTC + Realtime API lifecycle |
| `lib/realtime-config.ts` | Prompt ID reference + session config helper |
| `components/VoiceCashierClient.tsx` | Main ordering UI (mode selector + panels) |
| `components/chat/ChatPanel.tsx` | Text mode: conversation display |
| `components/chat/AIMessage.tsx` | AI message bubble |
| `components/chat/UserMessage.tsx` | Customer message bubble |
| `components/chat/TextInput.tsx` | Text input + send button |
| `components/voice/VoiceIndicator.tsx` | Voice mode: mic animation + status |
| `components/cart/CartPanel.tsx` | Shared: live cart display |
| `components/cart/CartItem.tsx` | Shared: cart item row |
| `components/cart/ReceiptView.tsx` | Shared: final receipt |
| `components/OwnerDashboardClient.tsx` | Owner analytics dashboard |
| `app/owner/page.tsx` | Dashboard route |

### Modified Files
| File | Change |
|------|--------|
| `lib/supabase.ts` | CartItem type, Order.items array, new OrderStatus |
| `app/api/orders/route.ts` | Accept items array |
| `app/api/orders/[id]/route.ts` | Accept in_progress + completed |
| `app/api/admin/stats/route.ts` | Enhanced metrics from items JSONB |
| `app/order/page.tsx` | Render VoiceCashierClient |
| `components/KitchenClient.tsx` | Multi-item, in_progress + completed |
| `components/OrderCard.tsx` | Render items array, new buttons |
| `components/KitchenTabs.tsx` | 3 tabs (Queue/Making/Done) |
| `tailwind.config.ts` | NYC palette + Inter font |
| `app/globals.css` | New brand styles |
| `app/layout.tsx` | New fonts + metadata |
| `package.json` | Add openai, recharts |

### Files to Delete
OrderClient, DrinkCard, DrinkCustomizer, ModifierSelector, AdminClient, AdminTabs, MenuItemsSection, ModifiersSection, NewMenuItemForm, MenuItemEditor, ModifierForm, ModifierRow, Delo brand docs.

---

## Verification

1. **Text mode**: Select text → type order → items appear in cart → finalize → order in Supabase
2. **Voice mode**: Select voice → speak order → cart updates live → AI speaks back → finalize
3. **Kitchen realtime**: Place order → appears on kitchen → Start Making → Done
4. **Dashboard**: Charts populate from order data
5. **Edge cases**: Run through Step 9 tests
6. **Deploy**: All views functional on Vercel

---

## Prerequisite

Share the coffee shop menu image from the instructions so we can configure the stored prompt with the right items, sizes, prices, and rules.
