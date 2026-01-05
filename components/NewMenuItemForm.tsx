'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MenuItem } from '@/lib/supabase'

interface NewMenuItemFormProps {
  categories: string[] // modifier categories from database
  existingCategories: string[] // menu item categories (Signature, Classics)
  onSave: (newItem: MenuItem) => void
  onClose: () => void
}

/**
 * NewMenuItemForm - Modal for creating a new menu item
 *
 * Form fields:
 * - Name (required)
 * - Description (optional)
 * - Category dropdown (Signature, Classics)
 * - Modifier config checkboxes
 */
export default function NewMenuItemForm({
  categories,
  existingCategories,
  onSave,
  onClose,
}: NewMenuItemFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(existingCategories[0] || 'Signature')
  const [modifierConfig, setModifierConfig] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat] = false
    })
    return initial
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleModifier = (cat: string) => {
    setModifierConfig((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          modifier_config: modifierConfig,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create')
      }

      const newItem = await response.json()
      onSave(newItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Capitalize first letter for display
  const formatCategoryName = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-delo-navy/40 z-40"
        aria-label="Close modal"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-delo-cream rounded-xl shadow-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
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

          {/* Header */}
          <h2 className="font-bricolage font-bold text-2xl text-delo-maroon pr-12 mb-2">
            Add New Item
          </h2>
          <p className="text-description text-sm mb-6">Create a new drink for the menu</p>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Name field */}
          <div className="mb-4">
            <label className="label-modifier mb-3 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cardamom Latte"
              className="w-full h-16 px-6 text-modifier-option text-delo-navy bg-white rounded-xl border border-delo-navy/10 focus:border-delo-maroon focus:outline-none transition-colors"
            />
          </div>

          {/* Description field */}
          <div className="mb-4">
            <label className="label-modifier mb-3 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description (optional)"
              className="w-full h-16 px-6 text-modifier-option text-delo-navy bg-white rounded-xl border border-delo-navy/10 focus:border-delo-maroon focus:outline-none transition-colors"
            />
          </div>

          {/* Category dropdown */}
          <div className="mb-6">
            <label className="label-modifier mb-3 block">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-16 px-6 pr-12 text-modifier-option text-delo-navy bg-white rounded-xl border border-delo-navy/10 focus:border-delo-maroon focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-delo-navy/40 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Modifier config checkboxes */}
          {categories.length > 0 && (
            <fieldset className="mb-6">
              <legend className="label-modifier mb-4">Modifier Options</legend>
              <p className="text-description text-xs mb-3">
                Which modifiers can customers choose for this drink?
              </p>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={modifierConfig[cat] ?? false}
                      onChange={() => handleToggleModifier(cat)}
                      className="w-[18px] h-[18px] rounded border-2 border-delo-navy/20 text-delo-maroon focus:ring-delo-maroon focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="font-manrope font-semibold text-base text-delo-navy group-hover:text-delo-maroon transition-colors">
                      {formatCategoryName(cat)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-manrope font-semibold text-delo-navy/60 bg-delo-navy/5 hover:bg-delo-navy/10 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              whileTap={{ scale: 0.97 }}
              className="flex-1 h-12 rounded-xl font-manrope font-semibold text-delo-cream bg-delo-maroon hover:bg-delo-maroon/90 disabled:bg-delo-navy/20 disabled:text-delo-navy/40 transition-colors"
            >
              {isSaving ? 'Creating...' : 'Create Item'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
