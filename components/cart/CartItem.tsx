'use client'

import type { CartItem as CartEntry } from '@/lib/supabase'
import { isFoodItem } from '@/lib/menu'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function isVisible(value: string | undefined): value is string {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== 'n/a' && normalized !== 'na' && normalized !== ''
}

function consolidateExtras(extras: string[]): string[] {
  const counts = new Map<string, number>()
  for (const extra of extras) {
    counts.set(extra, (counts.get(extra) || 0) + 1)
  }
  return Array.from(counts.entries()).map(([name, count]) => {
    if (count <= 1) return name
    // "1 Pump Hazelnut Syrup" x2 → "2 Pumps Hazelnut Syrup"
    const match = name.match(/^1\s+(\w+)(\s+.*)$/)
    if (match) {
      return `${count} ${match[1]}s${match[2]}`
    }
    return `${count}x ${name}`
  })
}

export default function CartItemRow({ item, index }: { item: CartEntry; index: number }) {
  const isFood = isFoodItem(item.name)
  const detailParts = isFood ? [] : [item.size, item.milk, item.temperature].filter(isVisible)
  const extras = item.extras?.length ? consolidateExtras(item.extras) : []

  const lineTotal = item.price ? item.price * item.quantity : undefined

  return (
    <div className="rounded-lg border border-cafe-charcoal/10 bg-white px-3 py-2">
      <p className="font-semibold text-cafe-charcoal">
        {item.quantity > 1 && (
          <span className="mr-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded bg-cafe-charcoal/10 text-cafe-charcoal/70 align-middle">
            {item.quantity}x
          </span>
        )}
        {item.name}
      </p>
      {detailParts.length > 0 && (
        <p className="text-sm text-cafe-charcoal/70">{detailParts.join(' • ')}</p>
      )}
      {extras.length > 0 && (
        <p className="text-sm text-cafe-charcoal/70">{extras.join(', ')}</p>
      )}
      {lineTotal !== undefined && <p className="text-sm text-cafe-charcoal/80">{formatMoney(lineTotal)}</p>}
    </div>
  )
}
