'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminTabs, { AdminTab } from './AdminTabs'
import MenuItemsSection from './MenuItemsSection'
import ModifiersSection from './ModifiersSection'
import DashboardSection from './DashboardSection'
import NavMenu from './NavMenu'
import { MenuItem, Modifier } from '@/lib/supabase'

interface AdminClientProps {
  initialMenuItems: MenuItem[]
  initialModifiers: Modifier[]
}

/**
 * AdminClient - Main admin panel with tabbed navigation
 *
 * Manages state for menu items and modifiers
 */
export default function AdminClient({
  initialMenuItems,
  initialModifiers,
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu')
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [modifiers, setModifiers] = useState(initialModifiers)

  // Update a menu item in local state (called after API success)
  const handleMenuItemUpdate = (updatedItem: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
  }

  // Update a modifier in local state (called after API success)
  const handleModifierUpdate = (updatedModifier: Modifier) => {
    setModifiers((prev) =>
      prev.map((mod) => (mod.id === updatedModifier.id ? updatedModifier : mod))
    )
  }

  // Add a new modifier to local state (called after API success)
  const handleModifierAdd = (newModifier: Modifier) => {
    setModifiers((prev) => [...prev, newModifier])
  }

  // Add a new menu item to local state (called after API success)
  const handleMenuItemAdd = (newItem: MenuItem) => {
    setMenuItems((prev) => [...prev, newItem])
  }

  return (
    <main className="min-h-screen p-8 bg-cafe-cream">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-serif text-4xl text-cafe-coffee mb-1">Coffee Rooom Admin</h1>
            <p className="text-description">Manage your menu and view orders</p>
          </div>
          <NavMenu />
        </div>

        {/* Tabs */}
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'menu' && (
                <MenuItemsSection
                  menuItems={menuItems}
                  modifiers={modifiers}
                  onUpdate={handleMenuItemUpdate}
                  onAdd={handleMenuItemAdd}
                />
              )}

              {activeTab === 'modifiers' && (
                <ModifiersSection
                  modifiers={modifiers}
                  onUpdate={handleModifierUpdate}
                  onAdd={handleModifierAdd}
                />
              )}

              {activeTab === 'dashboard' && <DashboardSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
