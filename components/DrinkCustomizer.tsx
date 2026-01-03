'use client'

import { motion } from 'framer-motion'
import { MenuItem, Modifier } from '@/lib/supabase'
import ModifierSelector from './ModifierSelector'

interface DrinkCustomizerProps {
  drink: MenuItem
  modifiers: Modifier[]
  selectedModifiers: { milk?: string; temperature?: string }
  onModifierChange: (category: 'milk' | 'temperature', value: string) => void
  onClose: () => void
}

/**
 * DrinkCustomizer - Floating modal for customizing a selected drink
 *
 * Animation: Slides up ~30px while fading in (iOS/Square style)
 *
 * Close behavior:
 * - X button in top-right corner
 * - Tap anywhere on the blurred backdrop
 */
export default function DrinkCustomizer({
  drink,
  modifiers,
  selectedModifiers,
  onModifierChange,
  onClose,
}: DrinkCustomizerProps) {
  const milkOptions = modifiers.filter((m) => m.category === 'milk')
  const temperatureOptions = modifiers.filter((m) => m.category === 'temperature')

  const showMilk = drink.modifier_config?.milk ?? false
  const showTemperature = drink.modifier_config?.temperature ?? false
  const hasAnyModifiers = showMilk || showTemperature

  return (
    <>
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-delo-navy/30 backdrop-blur-md z-40"
        aria-label="Close modal"
      />

      {/* Modal - slides up + fades in */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-delo-cream rounded-3xl shadow-2xl p-8 w-full max-w-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-delo-navy/5 hover:bg-delo-navy/10 transition-colors"
            aria-label="Close"
          >
            <span className="text-delo-navy/60 text-xl leading-none">×</span>
          </motion.button>

          {/* Drink name */}
          <h1 className="font-yatra text-4xl text-delo-maroon mb-8 pr-12">
            {drink.name}
          </h1>

          {/* Modifier selectors */}
          {hasAnyModifiers ? (
            <div className="space-y-2">
              {showMilk && milkOptions.length > 0 && (
                <ModifierSelector
                  category="milk"
                  options={milkOptions}
                  selected={selectedModifiers.milk ?? null}
                  onSelect={(value) => onModifierChange('milk', value)}
                />
              )}

              {showTemperature && temperatureOptions.length > 0 && (
                <ModifierSelector
                  category="temperature"
                  options={temperatureOptions}
                  selected={selectedModifiers.temperature ?? null}
                  onSelect={(value) => onModifierChange('temperature', value)}
                />
              )}
            </div>
          ) : (
            <p className="font-roboto-mono text-delo-navy/60">
              No customization options for this drink.
            </p>
          )}
        </div>
      </motion.div>
    </>
  )
}
