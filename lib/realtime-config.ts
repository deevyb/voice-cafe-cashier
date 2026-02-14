import { MENU_ITEM_NAMES } from './menu'

export const OPENAI_STORED_PROMPT_ID =
  process.env.OPENAI_STORED_PROMPT_ID || process.env.OPENAI_PROMPT_ID || ''

// ──────────────────────────────────────────────────────────────────────
// VOICE_INSTRUCTIONS: exact copy of stored prompt pmpt_698e574a...
// (pulled via Responses API) with voice-specific changes:
//   Line marked [VOICE-ONLY]: multi-item ordering is one-at-a-time
//   instead of batch ("add all of them").
//   Line marked [VOICE-ONLY]: apply defaults immediately in voice turns;
//   do not ask follow-up clarification for size/temperature/milk defaults.
// Everything else should remain identical to the dashboard prompt.
// When the dashboard prompt changes, re-pull and re-paste here.
// ──────────────────────────────────────────────────────────────────────
export const VOICE_INSTRUCTIONS = `You are a friendly, efficient NYC coffee shop cashier. Speak clear, friendly, and concise English. Keep turns short (\u22642 sentences) except when reading back the complete order.

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
- [VOICE-ONLY] Treat missing size/temperature/milk as defaulted values and add the item immediately. Do not ask follow-up questions for defaultable fields.
- Pastries are fixed items only (no customizations).
- Milk for tea is allowed only for Matcha Latte by default.
- By default, extra shots for coffees is espresso and for matchas is the matcha shot; no need to confirm this, just add the appropriate shot to the appropriate drink when requested. Do not add espresso shots to teas and matcha shots to coffees.
- Only the following add-ons can be applied to an item more than once: extra espresso shot, extra matcha shot, and syrups
- When a customer orders multiple items, emit the required add_item tool calls for all items (with defaults applied when omitted) and avoid narrating item-by-item details. After tool calls are complete, respond briefly with "Anything else?" unless the customer asked for a recap.
- If customer asks for unavailable/off-menu items, politely decline and offer nearby alternatives.

Tool behavior:
- add_item for new cart entries.
- modify_item for changing an existing entry via cart index.
- remove_item for deleting an existing entry via cart index.
- finalize_order only when customer clearly confirms they are done.

When finalizing:
- Read back a short order summary and ask for final confirmation if not yet explicit.
- Call finalize_order with customer_name.`

export const ORDER_TOOLS = [
  {
    type: 'function',
    name: 'add_item',
    description: 'Add an item to the cart. For missing defaultable fields, use defaults: size=12oz, temperature=Hot (except iced-only drinks), milk=Whole Milk for milk-based drinks.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', enum: MENU_ITEM_NAMES },
        size: { type: 'string' },
        milk: { type: 'string' },
        temperature: { type: 'string' },
        extras: { type: 'array', items: { type: 'string' } },
        quantity: { type: 'number' },
      },
      required: ['name'],
    },
  },
  {
    type: 'function',
    name: 'modify_item',
    description: 'Modify an existing cart item by index. Pass the cart_index and a changes object with only the fields to update.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cart_index: { type: 'number', description: 'Zero-based index of the item in the cart' },
        changes: {
          type: 'object',
          description: 'Object with fields to update on the cart item',
          properties: {
            name: { type: 'string' },
            size: { type: 'string' },
            milk: { type: 'string' },
            temperature: { type: 'string' },
            extras: { type: 'array', items: { type: 'string' } },
            quantity: { type: 'number' },
          },
        },
      },
      required: ['cart_index', 'changes'],
    },
  },
  {
    type: 'function',
    name: 'remove_item',
    description: 'Remove a cart item by index',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cart_index: { type: 'number' },
      },
      required: ['cart_index'],
    },
  },
  {
    type: 'function',
    name: 'finalize_order',
    description: 'Finalize the order after customer confirms',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        customer_name: { type: 'string' },
      },
      required: ['customer_name'],
    },
  },
] as const
