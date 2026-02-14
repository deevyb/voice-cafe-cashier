/**
 * Menu data — single source of truth for item names, prices, and validation.
 * Prices mirror the menu in VOICE_INSTRUCTIONS (lib/realtime-config.ts) and the
 * stored OpenAI dashboard prompt. Update both when the menu changes.
 */

// ---------------------------------------------------------------------------
// Valid menu item names (used for schema enum + client-side validation)
// ---------------------------------------------------------------------------

export const MENU_ITEM_NAMES = [
  'Americano',
  'Latte',
  'Cold Brew',
  'Mocha',
  'Coffee Frappuccino',
  'Black Tea',
  'Jasmine Tea',
  'Lemon Green Tea',
  'Matcha Latte',
  'Plain Croissant',
  'Chocolate Croissant',
  'Chocolate Chip Cookie',
  'Banana Bread',
] as const

export type MenuItemName = (typeof MENU_ITEM_NAMES)[number]

export function isValidMenuItem(name: string): boolean {
  return MENU_ITEM_NAMES.some(
    (valid) => valid.toLowerCase() === name.trim().toLowerCase()
  )
}

// ---------------------------------------------------------------------------
// Base prices: keyed by lowercase item name → { small, large }
// Pastries have a single flat price (small === large).
// ---------------------------------------------------------------------------

type SizePrices = { small: number; large: number }

const BASE_PRICES: Record<string, SizePrices> = {
  americano:            { small: 3.00, large: 4.00 },
  latte:                { small: 4.00, large: 5.00 },
  'cold brew':          { small: 4.00, large: 5.00 },
  mocha:                { small: 4.50, large: 5.50 },
  'coffee frappuccino': { small: 5.50, large: 6.00 },
  'black tea':          { small: 3.00, large: 3.75 },
  'jasmine tea':        { small: 3.00, large: 3.75 },
  'lemon green tea':    { small: 3.50, large: 4.25 },
  'matcha latte':       { small: 4.50, large: 5.25 },
  'plain croissant':      { small: 3.50, large: 3.50 },
  'chocolate croissant':  { small: 4.00, large: 4.00 },
  'chocolate chip cookie': { small: 2.50, large: 2.50 },
  'banana bread':         { small: 3.00, large: 3.00 },
}

// ---------------------------------------------------------------------------
// Add-on costs
// ---------------------------------------------------------------------------

/** Milk surcharge (only non-default milks cost extra) */
const MILK_SURCHARGE: Record<string, number> = {
  'oat milk':    0.50,
  'almond milk': 0.75,
  // Whole Milk and Skim Milk are free — no entry needed
}

/** Fixed-cost extras — matched case-insensitively */
const FIXED_EXTRA_COSTS: { pattern: RegExp; cost: number }[] = [
  { pattern: /extra espresso shot/i, cost: 1.50 },
  { pattern: /extra matcha shot/i,   cost: 1.50 },
]

/** Syrup pricing — $0.50 per pump. Default: 2 pumps for small, 3 pumps for large. */
const SYRUP_PATTERNS: RegExp[] = [
  /caramel/i,
  /hazelnut/i,
]
const COST_PER_PUMP = 0.50

function parsePumpCount(extra: string, isLarge: boolean): number {
  const match = extra.match(/(\d+)\s*pump/i)
  if (match) return parseInt(match[1], 10)
  // Default: 2 for small, 3 for large (per menu rules)
  return isLarge ? 3 : 2
}

// ---------------------------------------------------------------------------
// Price calculator
// ---------------------------------------------------------------------------

interface PriceableItem {
  name: string
  size?: string
  milk?: string
  extras?: string[]
}

/**
 * Calculate the unit price for a cart item based on the menu.
 * Returns undefined if the item name is not recognized (off-menu).
 */
export function calculatePrice(item: PriceableItem): number | undefined {
  const key = item.name.trim().toLowerCase()
  const prices = BASE_PRICES[key]
  if (!prices) return undefined

  // Determine size — default to "small" when missing
  const sizeNorm = (item.size || '').trim().toLowerCase()
  const isLarge = sizeNorm === 'large' || sizeNorm === '16oz'
  let total = isLarge ? prices.large : prices.small

  // Milk surcharge
  if (item.milk) {
    const milkKey = item.milk.trim().toLowerCase()
    total += MILK_SURCHARGE[milkKey] || 0
  }

  // Extras
  if (item.extras) {
    for (const extra of item.extras) {
      // Check fixed-cost extras first (espresso shots, matcha shots)
      const fixedMatch = FIXED_EXTRA_COSTS.find((e) => e.pattern.test(extra))
      if (fixedMatch) {
        total += fixedMatch.cost
        continue
      }
      // Check syrup extras — price by pump count (size-dependent default)
      const isSyrup = SYRUP_PATTERNS.some((p) => p.test(extra))
      if (isSyrup) {
        total += parsePumpCount(extra, isLarge) * COST_PER_PUMP
      }
    }
  }

  // Round to 2 decimal places to avoid floating-point drift
  return Math.round(total * 100) / 100
}
