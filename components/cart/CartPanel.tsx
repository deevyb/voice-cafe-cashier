'use client'

import type { CartItem as CartEntry } from '@/lib/supabase'
import CartItemRow from './CartItem'

function getTotal(cart: CartEntry[]) {
  return cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
}

export default function CartPanel({ cart }: { cart: CartEntry[] }) {
  const total = getTotal(cart)

  return (
    <aside className="h-[70vh] rounded-xl border border-delo-navy/10 bg-delo-cream/60 p-4">
      <h2 className="mb-3 border-b border-delo-navy/10 pb-2 font-bricolage text-xl text-delo-navy">
        Your Order
      </h2>
      <div className="space-y-2 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <p className="text-delo-navy/60">Cart is empty.</p>
        ) : (
          cart.map((item, index) => <CartItemRow key={`${item.name}-${index}`} item={item} index={index} />)
        )}
      </div>
      <div className="mt-4 border-t border-delo-navy/10 pt-3 font-semibold text-delo-navy">
        Total: ${total.toFixed(2)}
      </div>
    </aside>
  )
}
