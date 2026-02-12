'use client'

import type { CartItem as CartEntry } from '@/lib/supabase'

export default function ReceiptView({
  customerName,
  cart,
  orderId,
}: {
  customerName: string
  cart: CartEntry[]
  orderId: string
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
      <p className="font-semibold">Order confirmed</p>
      <p className="text-sm">Order ID: {orderId}</p>
      <p className="text-sm">Customer: {customerName}</p>
      <p className="mt-2 text-sm">Items: {cart.length}</p>
    </div>
  )
}
