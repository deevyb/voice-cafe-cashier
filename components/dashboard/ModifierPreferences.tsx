'use client'

import { ModifierOption } from '@/lib/supabase'

export default function ModifierPreferences({
  breakdown,
}: {
  breakdown: Record<string, ModifierOption[]>
}) {
  const categories = Object.entries(breakdown)

  return (
    <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
      <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-4">
        Modifier Preferences
      </h3>
      {categories.length === 0 ? (
        <p className="text-description text-sm">No data yet</p>
      ) : (
        <div className="space-y-5">
          {categories.map(([category, options]) => (
            <div key={category}>
              <p className="font-sans text-sm text-cafe-charcoal/70 mb-2 capitalize">{category}</p>
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
                    <span className="font-sans text-sm text-cafe-charcoal/70 w-20 truncate">
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
