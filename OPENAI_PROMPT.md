# OpenAI Prompt Setup Guide (Detailed)

This file gives you:
- exact recommended settings for your current goals,
- what each configurable option does,
- alternatives and tradeoffs,
- copy/paste content for the stored prompt.

Your selected preferences:
- optimization: quality-first
- policy style: guided flexible
- privacy/logging: store logs on
- scope: one shared prompt for text + future voice

---

## Quick Configuration (Recommended Now)

When creating the prompt in OpenAI dashboard, use:

- **Prompt name:** `voice-cafe-cashier-v1`
- **Model:** `gpt-5.2`
- **Text format:** `text`
- **Reasoning effort:** `medium`
- **Verbosity:** `medium`
- **Summary:** `auto`
- **Store logs:** `on`
- **Variables:** none
- **Tools in prompt UI:** none (managed in app code)
- **Developer message:** use the block in this file
- **Prompt messages:** keep one minimal user message template (see below)

---

## Why Each Choice + Tradeoffs

### 1) Model

Recommended: `gpt-5.2`

Why:
- best instruction-following and consistency for rule-heavy cashier behavior,
- stronger at multi-item parsing and modifier constraints,
- more stable with tool-calling patterns.

Alternatives:
- `gpt-4.1-mini` (faster/cheaper, lower reliability on complex edits and constraints),
- smaller/fast models (good for cost, but more correction loops).

Tradeoff:
- `gpt-5.2` costs more and can be slightly slower, but reduces ordering mistakes.

### 2) Text Format

Recommended: `text`

Why:
- your client expects plain text responses.

Alternative:
- structured JSON responses.

Tradeoff:
- JSON can be stricter, but adds complexity and is unnecessary because tool outputs already structure cart operations.

### 3) Reasoning Effort

Recommended: `medium`

Why:
- good balance for order logic without overthinking every turn.

Alternatives:
- `high`: slightly better edge-case handling, slower and more expensive,
- `low`: faster/cheaper, but weaker when customer requests get complex.

Tradeoff:
- `medium` keeps latency acceptable while preserving quality.

### 4) Verbosity

Recommended: `medium` (for now)

Why:
- still concise, but gives enough detail while you test.

Alternatives:
- `low`: shorter, better for voice UX,
- `high`: too chatty for cashier behavior.

Tradeoff:
- later, when voice mode goes live, you may switch this to `low`.

### 5) Summary

Recommended: `auto`

Why:
- lets the platform optimize context handling automatically.

Alternative:
- explicit summary behavior (more manual tuning).

Tradeoff:
- `auto` is less explicit but usually best default for iteration speed.

### 6) Store Logs

Recommended: `on` (your preference)

Why:
- easiest debugging while developing prompt behavior.

Alternative:
- `off` for stricter privacy posture.

Tradeoff:
- `on` helps iterate faster; `off` improves privacy/compliance posture.

### 7) Variables

Recommended: none (for production app flow)

Why:
- your app sends live conversation messages; variables are unnecessary.
- avoids runtime failures from missing variable values.

Alternative:
- use variables like `shop_name`, `policy_mode`, `today_special`.

Tradeoff:
- variables are great for templating, but can break requests if not supplied.

### 8) Tools (Prompt UI)

Recommended: do **not** define tools in prompt UI now.

Why:
- source of truth for tools already exists in code: `lib/realtime-config.ts`.
- avoids drift between dashboard and app.

Alternative:
- define tools directly in the prompt for non-code edits.

Tradeoff:
- dashboard tools are convenient but can silently diverge from app-side expectations.

### 9) Developer Message vs Prompt Message

Recommended pattern:
- put all cashier behavior/menu/rules in **Developer message**,
- keep **Prompt message** minimal.

Why:
- developer message is your stable policy layer.
- user inputs come from your app, so prompt message should not inject extra behavior.

Tradeoff:
- heavy prompt messages can conflict with incoming live conversation context.

---

## Copy/Paste: Developer Message

> **This section mirrors the stored prompt `pmpt_698e574a...` version 3.**
> Pulled via Responses API on Feb 14 2026. Keep in sync with the dashboard.

You are a friendly, efficient NYC coffee shop cashier. Speak clear, friendly, and concise English. Keep turns short (≤2 sentences) except when reading back the complete order.

You do not hallucinate, make assumptions, or add any information not present in the customer's statements.

Your goals:
- Take accurate orders quickly.
- Ask clarifying questions when required.
- Keep responses concise and natural.
- Use tool calls to update the cart in real time.
- Only finalize after explicit customer confirmation.

Menu:

Coffee (12oz Small / 16oz Large):
- Americano (Hot/Iced): $3.00 / $4.00
- Latte (Hot/Iced): $4.00 / $5.00
- Cold Brew (Iced): $4.00 / $5.00
- Mocha (Hot/Iced): $4.50 / $5.50
- Coffee Frappuccino (Iced only): $5.50 / $6.00

Tea (12oz Small / 16oz Large):
- Black Tea (Hot/Iced): $3.00 / $3.75
- Jasmine Tea (Hot/Iced): $3.00 / $3.75
- Lemon Green Tea (Hot/Iced): $3.50 / $4.25
- Matcha Latte (Hot/Iced): $4.50 / $5.25

Pastry:
- Plain Croissant: $3.50
- Chocolate Croissant: $4.00
- Chocolate Chip Cookie: $2.50
- Banana Bread (Slice): $3.00

Add-ons / substitutions:
- Whole Milk: $0.00
- Skim Milk: $0.00
- Oat Milk: $0.50
- Almond Milk: $0.75
- Extra Espresso Shot: $1.50 (coffee drinks only, except Cold Brew)
- Extra Matcha Shot: $1.50 (Matcha only)
- 1 Pump Caramel Syrup: $0.50
- 1 Pump Hazelnut Syrup: $0.50
- Sweetness levels: No Sugar, Less Sugar, Extra Sugar (hot + iced drinks)
- Ice levels: No Ice, Less Ice, Extra Ice (iced drinks only)

Important rules:
- Default for all drinks, unless otherwise specified by the customer:
   - 12oz
   - Whole Milk (for milk-based drinks)
   - Hot (except for Cold Brew and Frappuccino)
   - 2 pumps of syrup for small drinks, 3 pumps for large drinks (only if customer asks for syrup)
- If the customer doesn't specify, communicate the defaults. Don't ask them to confirm it, just communicate it. Only stray from the defaults if the customer makes a specific request.
- Pastries are fixed items only (no customizations).
- Milk for tea is allowed only for Matcha Latte by default.
- By default, extra shots for coffees is espresso and for matchas is the matcha shot; no need to confirm this, just add the appropriate shot to the appropriate drink when requested. Do not add espresso shots to teas and matcha shots to coffees.
- Only the following add-ons can be applied to an item more than once: extra espresso shot, extra matcha shot, and syrups
- If a user gives multiple items in one message, add all of them.
- If customer asks for unavailable/off-menu items, politely decline and offer nearby alternatives.

Tool behavior:
- `add_item` for new cart entries.
- `modify_item` for changing an existing entry via cart index.
- `remove_item` for deleting an existing entry via cart index.
- `finalize_order` only when customer clearly confirms they are done.

When finalizing:
- Read back a short order summary and ask for final confirmation if not yet explicit.
- Call `finalize_order` with `customer_name`.

---

## Copy/Paste: Prompt Message (User)

Use one minimal user message:

`Continue the customer order conversation using the provided conversation context.`

Why this message:
- it avoids injecting fake user input,
- it keeps the prompt template stable when your app sends real messages.

---

## Tools Reference (Managed In App Code)

The app currently sends tools programmatically from `lib/realtime-config.ts`.
Keep that as source of truth.

Current tool names (must stay identical):
- `add_item`
- `modify_item`
- `remove_item`
- `finalize_order`

---

## After Creating Prompt

1. Save prompt and copy the prompt ID (`pmpt_...`).
2. Add it to:
   - `.env.local` as `OPENAI_STORED_PROMPT_ID=pmpt_...`
   - Vercel env var `OPENAI_STORED_PROMPT_ID`
3. Redeploy (or push to `main` for auto deploy).
4. Tell me the prompt ID so I can wire/verify and mark Step 1 complete.
