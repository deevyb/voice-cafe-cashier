export const OPENAI_STORED_PROMPT_ID =
  process.env.OPENAI_STORED_PROMPT_ID || process.env.OPENAI_PROMPT_ID || ''

export const ORDER_TOOLS = [
  {
    type: 'function',
    name: 'add_item',
    description: 'Add an item to the cart',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        size: { type: 'string' },
        milk: { type: 'string' },
        temperature: { type: 'string' },
        extras: { type: 'array', items: { type: 'string' } },
        quantity: { type: 'number' },
        price: { type: 'number' },
      },
      required: ['name'],
    },
  },
  {
    type: 'function',
    name: 'modify_item',
    description: 'Modify an existing cart item by index',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cart_index: { type: 'number' },
        changes: { type: 'object' },
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
