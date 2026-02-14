'use client'

import { useState } from 'react'
import type { CartItem as CartEntry } from '@/lib/supabase'
import CartItemRow from './CartItem'

function getTotal(cart: CartEntry[]) {
  return cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
}

interface CartPanelProps {
  cart: CartEntry[]
  onPlaceOrder?: (customerName: string) => void
  orderFinalized?: boolean
  isSubmitting?: boolean
}

export default function CartPanel({ cart, onPlaceOrder, orderFinalized, isSubmitting }: CartPanelProps) {
  const total = getTotal(cart)
  const [showNameInput, setShowNameInput] = useState(false)
  const [customerName, setCustomerName] = useState('')

  const handlePlaceOrder = () => {
    const name = customerName.trim() || 'Guest'
    onPlaceOrder?.(name)
    setShowNameInput(false)
    setCustomerName('')
  }

  const showButton = cart.length > 0 && !orderFinalized && onPlaceOrder && !isSubmitting

  return (
    <aside className="rounded-xl border border-cafe-charcoal/10 bg-cafe-cream/60 p-4">
      <h2 className="mb-3 border-b border-cafe-charcoal/10 pb-2 font-sans text-xl text-cafe-charcoal">
        Your Order
      </h2>
      <div className="space-y-2 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <p className="text-cafe-charcoal/60">Cart is empty.</p>
        ) : (
          cart.map((item, index) => <CartItemRow key={`${item.name}-${index}`} item={item} index={index} />)
        )}
      </div>
      <div className="mt-4 border-t border-cafe-charcoal/10 pt-3 font-semibold text-cafe-charcoal">
        Total: ${total.toFixed(2)}
      </div>

      {/* Submitting indicator */}
      {isSubmitting && (
        <div className="mt-3 text-center text-sm text-cafe-charcoal/60">Placing your order...</div>
      )}

      {/* Place Order button + inline name input */}
      {showButton && !showNameInput && (
        <button
          onClick={() => setShowNameInput(true)}
          className="mt-3 w-full rounded-lg bg-cafe-coffee px-4 py-2.5 text-sm font-medium text-cafe-cream transition-colors hover:bg-cafe-coffee/90"
        >
          Place Order
        </button>
      )}

      {showButton && showNameInput && (
        <div className="mt-3 space-y-2">
          <label className="block text-sm text-cafe-charcoal/70">Name for the order</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlaceOrder()}
            placeholder="Guest"
            autoFocus
            className="w-full rounded-lg border border-cafe-charcoal/20 px-3 py-2 text-sm text-cafe-charcoal placeholder:text-cafe-charcoal/40 focus:border-cafe-coffee/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePlaceOrder}
              className="flex-1 rounded-lg bg-cafe-coffee px-4 py-2 text-sm font-medium text-cafe-cream transition-colors hover:bg-cafe-coffee/90"
            >
              Confirm
            </button>
            <button
              onClick={() => { setShowNameInput(false); setCustomerName('') }}
              className="rounded-lg border border-cafe-charcoal/20 px-4 py-2 text-sm text-cafe-charcoal transition-colors hover:bg-cafe-charcoal/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
