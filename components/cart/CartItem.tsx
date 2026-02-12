'use client'

import type { CartItem as CartEntry } from '@/lib/supabase'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

export default function CartItemRow({ item, index }: { item: CartEntry; index: number }) {
  const detailParts = [item.size, item.milk, item.temperature]
  if (item.extras?.length) detailParts.push(`extras: ${item.extras.join(', ')}`)

  const lineTotal = item.price ? item.price * item.quantity : undefined

  return (
    <div className="rounded-lg border border-delo-navy/10 bg-white px-3 py-2">
      <p className="font-semibold text-delo-navy">
        {index + 1}. {item.name} x{item.quantity}
      </p>
      {detailParts.filter(Boolean).length > 0 && (
        <p className="text-sm text-delo-navy/70">{detailParts.filter(Boolean).join(' • ')}</p>
      )}
      {lineTotal !== undefined && <p className="text-sm text-delo-navy/80">{formatMoney(lineTotal)}</p>}
    </div>
  )
}
