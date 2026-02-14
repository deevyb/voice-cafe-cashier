'use client'

import { motion } from 'framer-motion'
import { Modifier } from '@/lib/supabase'

interface ModifierRowProps {
  modifier: Modifier
  onToggle: () => void
  onEdit: () => void
}

/**
 * ModifierRow - Compact row for a single modifier option
 *
 * Shows: Option name | active status | toggle | edit button
 */
export default function ModifierRow({ modifier, onToggle, onEdit }: ModifierRowProps) {
  return (
    <motion.div
      layout
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        modifier.is_active
          ? 'bg-cafe-cream/50 border-cafe-charcoal/10'
          : 'bg-cafe-charcoal/5 border-cafe-charcoal/5'
      }`}
    >
      {/* Left: Name and status */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-sans font-semibold text-lg truncate ${
            modifier.is_active ? 'text-cafe-charcoal' : 'text-cafe-charcoal/40'
          }`}
        >
          {modifier.option}
        </h4>
        <p className={`text-sm ${modifier.is_active ? 'text-cafe-charcoal/50' : 'text-cafe-charcoal/30'}`}>
          {modifier.is_active ? 'Active' : 'Inactive'}
        </p>
      </div>

      {/* Right: Edit and Toggle */}
      <div className="flex items-center gap-4 ml-4">
        {/* Edit button */}
        <button
          onClick={onEdit}
          className="px-4 py-2 min-h-[44px] text-sm font-sans font-semibold text-cafe-charcoal/70 border border-cafe-charcoal/20 hover:bg-cafe-charcoal/5 hover:border-cafe-coffee hover:text-cafe-coffee rounded-lg transition-all duration-150"
        >
          Edit
        </button>

        {/* Toggle switch */}
        <button
          onClick={onToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            modifier.is_active ? 'bg-cafe-coffee' : 'bg-cafe-charcoal/20'
          }`}
          aria-label={modifier.is_active ? 'Turn off' : 'Turn on'}
        >
          <motion.div
            layout
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            animate={{ left: modifier.is_active ? '1.375rem' : '0.25rem' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </button>
      </div>
    </motion.div>
  )
}
