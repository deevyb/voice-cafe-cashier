import type { CartItem } from './supabase'
import { isValidMenuItem, calculatePrice } from './menu'

/**
 * Normalize syrup extras to the correct pump count based on drink size.
 * The AI model often sends the literal add-on name from the prompt
 * (e.g. "1 Pump Caramel Syrup") instead of applying the default pump
 * rules (2 for small, 3 for large). This fixes that.
 */
function normalizeSyrupExtras(extras: string[] | undefined, size: string | undefined): string[] | undefined {
  if (!extras) return extras
  const sizeNorm = (size || '').trim().toLowerCase()
  const isLarge = sizeNorm === 'large' || sizeNorm === '16oz'
  const defaultPumps = isLarge ? 3 : 2

  return extras.map((extra) => {
    // Match syrup patterns like "1 Pump Caramel Syrup" or "Caramel Syrup"
    const syrupMatch = extra.match(/^(\d+)?\s*[Pp]umps?\s+(.*[Ss]yrup)$/i)
    if (syrupMatch) {
      const explicitCount = syrupMatch[1] ? parseInt(syrupMatch[1], 10) : null
      const syrupName = syrupMatch[2]
      // If model sent "1 Pump" (the literal from the add-ons list), apply the default
      const count = explicitCount === 1 ? defaultPumps : (explicitCount || defaultPumps)
      return `${count} Pump${count !== 1 ? 's' : ''} ${syrupName}`
    }
    // Match bare syrup name like "Caramel" or "Hazelnut"
    if (/caramel|hazelnut/i.test(extra) && !/shot|espresso|matcha/i.test(extra)) {
      return `${defaultPumps} Pumps ${extra} Syrup`
    }
    return extra
  })
}

function isDrink(name: string | undefined): boolean {
  if (!name) return false
  const n = name.trim().toLowerCase()
  return [
    'americano',
    'latte',
    'cold brew',
    'mocha',
    'coffee frappuccino',
    'black tea',
    'jasmine tea',
    'lemon green tea',
    'matcha latte',
  ].includes(n)
}

function isMilkBasedDrink(name: string | undefined): boolean {
  if (!name) return false
  const n = name.trim().toLowerCase()
  return ['latte', 'mocha', 'coffee frappuccino', 'matcha latte'].includes(n)
}

function applyDrinkDefaults(item: CartItem): CartItem {
  if (!isDrink(item.name)) return item

  const n = item.name.trim().toLowerCase()
  const withDefaults = { ...item }

  if (!withDefaults.size) withDefaults.size = '12oz'

  if (!withDefaults.temperature) {
    if (n === 'cold brew' || n === 'coffee frappuccino') {
      withDefaults.temperature = 'Iced'
    } else {
      withDefaults.temperature = 'Hot'
    }
  }

  if (!withDefaults.milk && isMilkBasedDrink(withDefaults.name)) {
    withDefaults.milk = 'Whole Milk'
  }

  return withDefaults
}

/**
 * Apply a tool call to the cart and return the updated cart.
 * Shared by both text mode (server-side) and voice mode (client-side).
 *
 * - Validates item names against the menu (rejects off-menu items).
 * - Deterministically calculates prices from the menu lookup (never trusts AI-supplied prices).
 * - Normalizes syrup extras to the correct pump count based on size.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyToolCall(
  cart: CartItem[],
  name: string,
  args: Record<string, any>
): { cart: CartItem[]; finalize?: { customer_name: string } } {
  if (name === 'add_item') {
    // Reject off-menu items (safety net in case schema enum isn't enforced)
    if (!isValidMenuItem(args.name)) {
      return { cart }
    }
    const { price: _aiPrice, ...rest } = args // discard any AI-supplied price
    let item = { ...rest, quantity: args.quantity || 1 } as CartItem
    item = applyDrinkDefaults(item)
    item.extras = normalizeSyrupExtras(item.extras, item.size)
    item.price = calculatePrice(item)
    return { cart: [...cart, item] }
  }
  if (name === 'modify_item') {
    // Prefer args.changes, but fall back to any top-level fields besides cart_index
    // (some models send the changes flat instead of nested under "changes")
    let changes = args.changes
    if (!changes || Object.keys(changes).length === 0) {
      const { cart_index: _, changes: __, ...rest } = args
      if (Object.keys(rest).length > 0) changes = rest
    }
    if (changes) {
      delete changes.price // discard any AI-supplied price
    }
    return {
      cart: cart.map((item, i) => {
        if (i !== args.cart_index) return item
        const updated = applyDrinkDefaults({ ...item, ...(changes || {}) })
        updated.extras = normalizeSyrupExtras(updated.extras, updated.size)
        updated.price = calculatePrice(updated) // recalculate after modification
        return updated
      }),
    }
  }
  if (name === 'remove_item') {
    return { cart: cart.filter((_, i) => i !== args.cart_index) }
  }
  if (name === 'finalize_order') {
    return { cart, finalize: { customer_name: args.customer_name || 'Guest' } }
  }
  return { cart }
}
