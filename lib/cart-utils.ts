import type { CartItem } from './supabase'

/**
 * Apply a tool call to the cart and return the updated cart.
 * Shared by both text mode (server-side) and voice mode (client-side).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyToolCall(
  cart: CartItem[],
  name: string,
  args: Record<string, any>
): { cart: CartItem[]; finalize?: { customer_name: string } } {
  if (name === 'add_item') {
    return { cart: [...cart, { ...args, quantity: args.quantity || 1 } as CartItem] }
  }
  if (name === 'modify_item') {
    // Prefer args.changes, but fall back to any top-level fields besides cart_index
    // (some models send the changes flat instead of nested under "changes")
    let changes = args.changes
    if (!changes || Object.keys(changes).length === 0) {
      const { cart_index: _, changes: __, ...rest } = args
      if (Object.keys(rest).length > 0) changes = rest
    }
    return {
      cart: cart.map((item, i) =>
        i === args.cart_index ? { ...item, ...(changes || {}) } : item
      ),
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
