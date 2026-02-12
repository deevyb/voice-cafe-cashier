'use client'

import { motion } from 'framer-motion'

interface KitchenTabsProps {
  activeTab: 'placed' | 'in_progress' | 'completed'
  onTabChange: (tab: 'placed' | 'in_progress' | 'completed') => void
  placedCount: number
  inProgressCount: number
  completedCount: number
}

export default function KitchenTabs({
  activeTab,
  onTabChange,
  placedCount,
  inProgressCount,
  completedCount,
}: KitchenTabsProps) {
  const tabs = [
    { id: 'placed' as const, label: 'Queue', count: placedCount },
    { id: 'in_progress' as const, label: 'Making', count: inProgressCount },
    { id: 'completed' as const, label: 'Done', count: completedCount },
  ]

  return (
    <div className="flex gap-1 bg-delo-navy/5 p-1 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 py-3 px-6 rounded-lg font-manrope font-semibold text-base transition-colors min-h-[52px] ${
            activeTab === tab.id ? 'text-delo-maroon' : 'text-delo-navy/50 hover:text-delo-navy/70'
          }`}
        >
          {/* Active tab background */}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}

          {/* Tab label with count */}
          <span className="relative z-10">
            {tab.label} ({tab.count})
          </span>
        </button>
      ))}
    </div>
  )
}
