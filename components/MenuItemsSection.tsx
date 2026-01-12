'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem, Modifier } from '@/lib/supabase'
import MenuItemCard from './MenuItemCard'
import MenuItemEditor from './MenuItemEditor'
import NewMenuItemForm from './NewMenuItemForm'

interface MenuItemsSectionProps {
  menuItems: MenuItem[]
  modifiers: Modifier[]
  onUpdate: (updatedItem: MenuItem) => void
  onAdd: (newItem: MenuItem) => void
}

/**
 * MenuItemsSection - List of menu items with toggle and edit
 *
 * Grouped by category (Signature, Classics)
 */
export default function MenuItemsSection({
  menuItems,
  modifiers,
  onUpdate,
  onAdd,
}: MenuItemsSectionProps) {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get unique modifier categories from the database
  const modifierCategories = Array.from(new Set(modifiers.map((m) => m.category)))

  // Group items by category
  const signatureItems = menuItems.filter((item) => item.category === 'Signature')
  const classicItems = menuItems.filter((item) => item.category === 'Classics')

  const handleToggle = async (item: MenuItem) => {
    setError(null)

    // Optimistic update
    const newActiveState = !item.is_active
    onUpdate({ ...item, is_active: newActiveState })

    try {
      const response = await fetch('/api/admin/menu-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: newActiveState }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      const updatedItem = await response.json()
      onUpdate(updatedItem)
    } catch {
      // Revert on error
      onUpdate(item)
      setError('Failed to update. Please try again.')
      setTimeout(() => setError(null), 4000)
    }
  }

  const handleSaveModifiers = async (item: MenuItem, modifierConfig: Record<string, boolean>) => {
    setError(null)

    try {
      const response = await fetch('/api/admin/menu-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, modifier_config: modifierConfig }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      const updatedItem = await response.json()
      onUpdate(updatedItem)
      setEditingItem(null)
    } catch {
      setError('Failed to save. Please try again.')
      setTimeout(() => setError(null), 4000)
    }
  }

  const renderCategory = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null

    return (
      <div className="mb-8 last:mb-0">
        <h3 className="font-bricolage font-semibold text-base text-delo-navy/60 uppercase tracking-wide mb-3">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item)}
              onEdit={() => setEditingItem(item)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-delo-navy/10">
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Add button */}
      <div className="flex justify-between items-start mb-6">
        <p className="text-description text-sm">
          Toggle drinks on or off. Tap Edit to change which modifiers apply.
        </p>
        <motion.button
          onClick={() => setShowNewForm(true)}
          whileTap={{ scale: 0.97 }}
          className="btn-admin-add ml-4"
        >
          + Add Item
        </motion.button>
      </div>

      {/* Categories */}
      {renderCategory('Signature', signatureItems)}
      {renderCategory('Classics', classicItems)}

      {/* Edit modal - uses shared Modal component */}
      {editingItem && (
        <MenuItemEditor
          item={editingItem}
          categories={modifierCategories}
          onSave={(config) => handleSaveModifiers(editingItem, config)}
          onClose={() => setEditingItem(null)}
          isOpen={!!editingItem}
        />
      )}

      {/* New item modal - uses shared Modal component */}
      <NewMenuItemForm
        categories={modifierCategories}
        existingCategories={['Signature', 'Classics']}
        onSave={(newItem) => {
          onAdd(newItem)
          setShowNewForm(false)
        }}
        onClose={() => setShowNewForm(false)}
        isOpen={showNewForm}
      />
    </div>
  )
}
