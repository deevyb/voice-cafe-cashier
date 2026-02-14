'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from '@/lib/supabase'
import Modal from './Modal'

interface MenuItemEditorProps {
  item: MenuItem
  categories: string[]
  onSave: (modifierConfig: Record<string, boolean>) => void
  onRemove: () => void
  onClose: () => void
  isOpen: boolean
}

/**
 * MenuItemEditor - Modal for editing which modifiers apply to a drink
 *
 * Uses shared Modal component and shared CSS classes for consistency.
 *
 * Dynamically renders checkboxes based on available modifier categories
 * (e.g., "milk", "temperature" — or whatever categories exist in the database)
 */
export default function MenuItemEditor({
  item,
  categories,
  onSave,
  onRemove,
  onClose,
  isOpen,
}: MenuItemEditorProps) {
  // Initialize state from the item's current config, defaulting to false for each category
  const [config, setConfig] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat] = item.modifier_config?.[cat] ?? false
    })
    return initial
  })
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const handleToggle = (category: string) => {
    setConfig((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    await onSave(config)
    setIsSaving(false)
  }

  const formatCategoryName = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Header */}
      <h2 className="modal-title">{item.name}</h2>
      <p className="modal-description">Choose which modifier options customers can select</p>

      {/* Dynamic checkboxes */}
      <fieldset>
        <legend className="label-modifier mb-4">Available Options</legend>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category} className="checkbox-label group">
              <input
                type="checkbox"
                checked={config[category] ?? false}
                onChange={() => handleToggle(category)}
                className="checkbox-form"
              />
              <span>{formatCategoryName(category)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {categories.length === 0 && (
        <p className="text-cafe-charcoal/40 text-sm">No modifier categories have been created yet.</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className="btn-modal-action flex-1"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </motion.button>
      </div>

      {/* Remove from Menu */}
      <div className="mt-6 pt-6 border-t border-cafe-charcoal/10">
        <AnimatePresence mode="wait">
          {!confirmingRemove ? (
            <motion.button
              key="remove-btn"
              onClick={() => setConfirmingRemove(true)}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-10 rounded-lg font-sans font-semibold text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Archive from Menu
            </motion.button>
          ) : (
            <motion.div
              key="remove-confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="font-sans text-sm text-cafe-charcoal/70 mb-3">
                Archive <span className="font-semibold">{item.name}</span> from the menu?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingRemove(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={onRemove}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 h-12 rounded-xl font-sans font-semibold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Yes, Archive
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
