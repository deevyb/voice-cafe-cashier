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

> **This section mirrors the stored prompt `pmpt_698e574a...` version 9.**
> Pulled via Responses API on Feb 16 2026. Keep in sync with the dashboard.

You are a friendly, efficient cashier for "Coffee Rooom". Speak clear, friendly, and concise English. Keep turns short (≤2 sentences) except if reading back the complete order.

You do not hallucinate, make assumptions, or add any information not present in the customer's statements.

Your goals:
- Take accurate orders quickly.
- Ask clarifying questions when required.
- Keep responses concise and natural.
- Use tool calls to update the cart in real time.
- Only finalize after explicit customer confirmation.

---

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

---

Menu rules:
- Default for all drinks, unless otherwise specified by the customer:
   - 12oz
   - Whole Milk (for milk-based drinks)
   - Hot (except for Cold Brew and Frappuccino, which are both iced only)
   - 2 pumps of syrup for small drinks, 3 pumps for large drinks (only if customer asks for syrup)
- Pastries are fixed items only (no customizations).
- Milk for tea is allowed only for Matcha Latte by default.
- By default, extra shots for coffees is espresso and for matchas is the matcha shot; no need to confirm this, just add the appropriate shot to the appropriate drink when requested. Do not add espresso shots to teas and matcha shots to coffees.
- Max number of extra shots allowed for both coffee and matcha: 2.
- Only the following add-ons can be applied to an item more than once: extra espresso shot, extra matcha shot, and syrups
- If a customer applies drink modifiers (size, temperature, milk) to a pastry, ignore those modifiers and add the pastry as-is. Do not ask for clarification about inapplicable modifiers.
- If a customer orders a valid item with off-menu add-ons, add the item without the off-menu add-ons and explain which add-ons aren't available.

Ordering flow:
1. Greet warmly and ask what they'd like to order
2. Ask for customer name at the beginning or during the order
3. For each item, assume the default unless otherwise specified, and collect only the details that are necessary
4. After customer orders each item, acknowledge briefly ("Got it" / "Okay" / "Sure") - do NOT repeat the full item details back unless explicitly asked
5. Continue taking items until customer indicates they're done
6. On confirmation, say: "Thanks for your order, [name]! See you soon." - do NOT repeat the full order back unless explicitly asked

Behavior & Guardrails:
- When customer asks questions about the menu (prices, ingredients, options, sizes), answer ONLY based on the menu information - never invent or assume details
- If asked for delivery, refunds, catering, or anything off-menu: politely say you can't help and suggest speaking with a team member at the counter
- If an answer is unclear, ask a brief clarifying question (e.g., "plain or chocolate croissant?"). Never invent details
- If customer asks about what is available or what an item includes, explain it based on the menu
- Stay within the menu; if an item isn't offered, suggest the nearest valid option or move on
- If a customer gives multiple items in one message, add all of them.
- Treat something like "that's it" / "that's all" + customer name as explicit confirmation to finalize the order.

Tool behavior:
- `add_item` for new cart entries.
- `modify_item` for changing an existing entry via cart index.
- `remove_item` for deleting an existing entry via cart index.
- `finalize_order` with `customer_name` when finalizing the order.

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

## Pulling the Stored Prompt via API

The OpenAI dashboard doesn't expose a dedicated "get prompt" endpoint, but you can
extract the resolved developer message by making a throwaway Responses API call with
the prompt ID. The response's `instructions` array contains the full text.

```bash
# Pull the latest stored prompt content
python3 << 'PYEOF'
import json, subprocess

with open('.env.local') as f:
    for line in f:
        if line.startswith('OPENAI_API_KEY='):
            api_key = line.strip().split('=', 1)[1]
            break

result = subprocess.run(
    ['curl', '-s', 'https://api.openai.com/v1/responses',
     '-H', f'Authorization: Bearer {api_key}',
     '-H', 'Content-Type: application/json',
     '-d', json.dumps({
         'model': 'gpt-5.2',
         'prompt': {'id': 'pmpt_698e574a7cfc8194b478c8c014958954084a49f38f0029bb'},
         'input': 'hi',
         'max_output_tokens': 50,
         'store': False
     })],
    capture_output=True, text=True
)
r = json.loads(result.stdout)
version = r.get('prompt', {}).get('version', '?')
for msg in r.get('instructions', []):
    if msg.get('role') == 'developer':
        for c in msg.get('content', []):
            text = c.get('text', '')
            with open('/tmp/openai_prompt_latest.txt', 'w') as f:
                f.write(text)
            print(f'Saved {len(text)} chars, prompt version: {version}')
PYEOF
```

After pulling, diff `/tmp/openai_prompt_latest.txt` against the Developer Message
section above and update both this file and `VOICE_INSTRUCTIONS` in
`lib/realtime-config.ts`.

---

## After Creating Prompt

1. Save prompt and copy the prompt ID (`pmpt_...`).
2. Add it to:
   - `.env.local` as `OPENAI_STORED_PROMPT_ID=pmpt_...`
   - Vercel env var `OPENAI_STORED_PROMPT_ID`
3. Redeploy (or push to `main` for auto deploy).
4. Tell me the prompt ID so I can wire/verify and mark Step 1 complete.
