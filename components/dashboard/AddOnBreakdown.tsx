'use client'

import { ModifierOption } from '@/lib/supabase'

export default function AddOnBreakdown({
  breakdown,
  attachRate,
}: {
  breakdown: Record<string, ModifierOption[]>
  attachRate: Record<string, number>
}) {
  const categoryOrder = ['syrups', 'shots', 'sweetness', 'ice']
  const categories = categoryOrder
    .filter((key) => breakdown[key])
    .map((key) => [key, breakdown[key]] as [string, ModifierOption[]])

  return (
    <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
      <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-4">
        Add-On Preferences
      </h3>
      {categories.length === 0 ? (
        <p className="text-description text-sm">No add-ons yet</p>
      ) : (
        <div className="space-y-5">
          {categories.map(([category, options]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-sans text-sm text-cafe-charcoal/70 capitalize">{category}</p>
                {attachRate[category] != null && (
                  <span className="font-sans text-xs font-medium text-cafe-coffee bg-cafe-coffee/10 rounded-full px-2 py-0.5">
                    {attachRate[category]}% of orders
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.option} className="flex items-center gap-3">
                    <div className="flex-1 bg-cafe-charcoal/10 rounded-full h-3">
                      <div
                        className="bg-cafe-coffee rounded-full h-3 transition-all duration-500"
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                    <span className="font-sans font-semibold text-sm text-cafe-charcoal w-10 text-right">
                      {option.percentage}%
                    </span>
                    <span className="font-sans text-sm text-cafe-charcoal/70 w-28 truncate">
                      {option.option}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
