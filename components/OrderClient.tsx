'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MenuItem, Modifier } from '@/lib/supabase'
import DrinkCard from './DrinkCard'
import DrinkCustomizer from './DrinkCustomizer'

interface OrderClientProps {
  menuItems: MenuItem[]
  modifiers: Modifier[]
}

type Screen = 'menu' | 'customize' | 'confirmed'

/**
 * OrderClient - Main controller for the ordering flow
 *
 * Manages which screen is shown (menu, customize, or confirmed)
 * and handles all state for the order in progress.
 *
 * Screen flow:
 * 1. Menu grid (select a drink)
 * 2. Customization modal overlays the menu (choose modifiers)
 * 3. Confirmation screen (after submit) - Phase 6
 *
 * When a drink is tapped, a modal slides up with a blur backdrop.
 */
export default function OrderClient({ menuItems, modifiers }: OrderClientProps) {
  // Current screen in the flow
  const [screen, setScreen] = useState<Screen>('menu')

  // Selected drink and its customization
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<{
    milk?: string
    temperature?: string
  }>({})

  /**
   * When a drink is tapped, select it and initialize modifiers with defaults
   */
  const handleSelectDrink = (drink: MenuItem) => {
    setSelectedDrink(drink)

    // Initialize modifiers with the drink's defaults
    setSelectedModifiers({
      milk: drink.default_modifiers?.milk ?? undefined,
      temperature: drink.default_modifiers?.temperature ?? undefined,
    })

    // Show the customization modal
    setScreen('customize')
  }

  /**
   * Update a modifier selection
   */
  const handleModifierChange = (
    category: 'milk' | 'temperature',
    value: string
  ) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  /**
   * Close the customization modal
   */
  const handleCloseModal = () => {
    setScreen('menu')
    // Keep the drink selected briefly for visual continuity during close animation
    setTimeout(() => setSelectedDrink(null), 300)
  }

  // Whether the modal is open (for dimming effect)
  const isModalOpen = screen === 'customize' && selectedDrink !== null

  return (
    <>
      {/* Menu grid - always visible behind modal */}
      <div className="min-h-screen bg-delo-cream p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="font-yatra text-4xl text-delo-maroon">
            What are you having?
          </h1>
        </header>

        {/* Menu Grid */}
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {menuItems.map((drink, index) => (
            <DrinkCard
              key={drink.id}
              drink={drink}
              index={index}
              isSelected={selectedDrink?.id === drink.id}
              onSelect={handleSelectDrink}
            />
          ))}
        </div>
      </div>

      {/* Customization modal - slides up with blur backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <DrinkCustomizer
            drink={selectedDrink}
            modifiers={modifiers}
            selectedModifiers={selectedModifiers}
            onModifierChange={handleModifierChange}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      {/* Phase 6 will add the confirmation screen here */}
    </>
  )
}
