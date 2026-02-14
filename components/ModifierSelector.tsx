'use client'

import { motion } from 'framer-motion'
import { Modifier } from '@/lib/supabase'

interface ModifierSelectorProps {
  category: 'milk' | 'temperature'
  options: Modifier[]
  selected: string | null
  onSelect: (option: string) => void
}

/**
 * ModifierSelector - Toggle button group for selecting milk type or temperature
 *
 * Displays a row of buttons where only one can be selected at a time.
 * The selected option gets the maroon background, others are white.
 * Unavailable options are shown faded with "Sold Out" text.
 *
 * Props:
 * - category: 'milk' or 'temperature' (determines the label shown)
 * - options: Array of modifier options from the database (includes inactive)
 * - selected: Currently selected option string (e.g., "Oat" or "Iced")
 * - onSelect: Callback when user taps an option
 */
export default function ModifierSelector({
  category,
  options,
  selected,
  onSelect,
}: ModifierSelectorProps) {
  // Display label for the category
  const categoryLabel = category === 'milk' ? 'Milk' : 'Temperature'

  return (
    <div className="mb-8">
      {/* Category label */}
      <p className="label-modifier mb-3">{categoryLabel}</p>

      {/* Button group */}
      <div className="flex gap-3">
        {options.map((option) => {
          const isSelected = selected === option.option
          const isUnavailable = !option.is_active

          return (
            <div key={option.id} className="flex flex-col items-center">
              <motion.button
                onClick={() => !isUnavailable && onSelect(option.option)}
                whileTap={isUnavailable ? undefined : { scale: 0.97 }}
                disabled={isUnavailable}
                className={`
                  px-8 py-4 rounded-xl text-modifier-option
                  transition-colors duration-200
                  min-w-[120px]
                  ${
                    isUnavailable
                      ? 'bg-white/50 text-cafe-charcoal/30 border border-dashed border-cafe-charcoal/15 cursor-not-allowed'
                      : isSelected
                        ? 'bg-cafe-coffee text-cafe-cream'
                        : 'bg-white text-cafe-charcoal border border-cafe-charcoal/10 hover:border-cafe-coffee/30'
                  }
                `}
              >
                {option.option}
              </motion.button>
              {isUnavailable && (
                <span className="text-sm font-sans font-semibold text-cafe-coffee/60 mt-1.5">
                  Sold Out
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
