'use client'

import { DrinkCount } from '@/lib/supabase'

export default function PopularItems({ items }: { items: DrinkCount[] }) {
  return (
    <div className="absolute inset-0 bg-white rounded-xl p-6 border border-cafe-charcoal/10 flex flex-col">
      <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-4">
        Popular Items
      </h3>
      {items.length === 0 ? (
        <p className="text-description text-sm">No orders yet</p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {items.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="font-sans text-cafe-charcoal">
                <span className="text-cafe-charcoal/40 w-6 inline-block">{index + 1}.</span>
                {item.name}
              </span>
              <span className="font-sans font-semibold text-cafe-coffee">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
