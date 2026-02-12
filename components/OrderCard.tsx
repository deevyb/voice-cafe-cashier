'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Order } from '@/lib/supabase'

interface OrderCardProps {
  order: Order
  onStartMaking: (orderId: string) => void
  onDone: (orderId: string) => void
  onCancelClick: () => void
  isUpdating: boolean
}

/**
 * Format time difference as relative string
 */
function getRelativeTime(timestamp: string, now: number): string {
  const diff = now - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes === 1) return '1 min'
  return `${minutes} min`
}

/**
 * ANIMATION CONFIGURATION
 * Spring physics for snappy, responsive feel
 */
const springConfig = { stiffness: 400, damping: 30 }

export default function OrderCard({
  order,
  onStartMaking,
  onDone,
  onCancelClick,
  isUpdating,
}: OrderCardProps) {
  // Track current time for relative time display (updates every minute)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const isPlaced = order.status === 'placed'
  const isInProgress = order.status === 'in_progress'
  const timeAgo = getRelativeTime(order.created_at, now)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } }}
      transition={{ type: 'spring', ...springConfig }}
      className="bg-white rounded-xl p-6 shadow-sm border border-delo-navy/5"
    >
      {/* Top row: Customer and time */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bricolage font-bold text-2xl text-delo-navy">{order.customer_name}</h3>
        <span className="font-roboto-mono text-sm text-delo-navy/50 bg-delo-navy/5 px-2 py-1 rounded flex-shrink-0 ml-2">
          {timeAgo}
        </span>
      </div>

      {/* Items */}
      <div className="mt-3 space-y-1">
        {order.items?.map((item, index) => {
          const details = [item.size, item.milk, item.temperature]
          if (item.extras?.length) details.push(`extras: ${item.extras.join(', ')}`)
          return (
            <p key={`${item.name}-${index}`} className="font-manrope text-base text-delo-navy/80">
              {index + 1}. {item.name}
              {item.quantity > 1 ? ` x${item.quantity}` : ''}
              {details.filter(Boolean).length ? ` — ${details.filter(Boolean).join(', ')}` : ''}
            </p>
          )
        })}
      </div>

      {/* Actions for placed orders */}
      {isPlaced && (
        <div className="flex gap-3 mt-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onStartMaking(order.id)}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 rounded-lg bg-delo-maroon text-delo-cream font-manrope font-semibold transition-colors hover:bg-delo-maroon/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {isUpdating ? 'Updating...' : 'Start Making'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancelClick}
            disabled={isUpdating}
            className="py-3 px-4 rounded-lg bg-delo-navy/10 text-delo-navy font-manrope font-semibold transition-colors hover:bg-delo-navy/15 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            Cancel
          </motion.button>
        </div>
      )}

      {/* Actions for in-progress orders */}
      {isInProgress && (
        <div className="flex gap-3 mt-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onDone(order.id)}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-manrope font-semibold transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {isUpdating ? 'Updating...' : 'Done'}
          </motion.button>
        </div>
      )}

      {/* Completed badge */}
      {order.status === 'completed' && (
        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-manrope font-semibold text-sm">Completed</span>
        </div>
      )}
    </motion.div>
  )
}
