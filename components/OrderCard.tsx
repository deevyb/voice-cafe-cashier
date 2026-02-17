'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order } from '@/lib/supabase'
import { isFoodItem } from '@/lib/menu'

interface OrderCardProps {
  order: Order
  onStartMaking: (orderId: string) => void
  onDone: (orderId: string) => void
  onBackToQueue: (orderId: string) => void
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
 * Format fulfillment duration (placed → completed)
 */
function getFulfillmentTime(createdAt: string, updatedAt: string): string {
  const diff = new Date(updatedAt).getTime() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '<1 min'
  if (minutes === 1) return '1 min'
  return `${minutes} min`
}

function isVisible(value: string | undefined): value is string {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== 'n/a' && normalized !== 'na' && normalized !== ''
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
  onBackToQueue,
  onCancelClick,
  isUpdating,
}: OrderCardProps) {
  // Track current time for relative time display (updates every minute)
  const [now, setNow] = useState(Date.now())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const isPlaced = order.status === 'placed'
  const isInProgress = order.status === 'in_progress'
  const isCompleted = order.status === 'completed'
  const isCanceled = order.status === 'canceled'
  const isDone = isCompleted || isCanceled
  const timeAgo = getRelativeTime(order.created_at, now)
  const fulfillmentTime = isCompleted ? getFulfillmentTime(order.created_at, order.updated_at) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } }}
      transition={{ type: 'spring', ...springConfig }}
      className="bg-white rounded-xl p-6 shadow-sm border border-cafe-charcoal/5 flex flex-col"
    >
      {/* Top row: Customer and time */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-sans font-bold text-2xl text-cafe-charcoal">{order.customer_name}</h3>
        {/* Completed: clock icon + fulfillment duration. Canceled: hidden. Others: relative time. */}
        {isCompleted ? (
          <span className="font-sans text-sm font-medium text-cafe-charcoal/50 bg-cafe-charcoal/5 px-2 py-1 rounded flex-shrink-0 ml-2 inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" />
            </svg>
            {fulfillmentTime}
          </span>
        ) : !isCanceled ? (
          <span className="font-sans text-sm font-medium text-cafe-charcoal/50 bg-cafe-charcoal/5 px-2 py-1 rounded flex-shrink-0 ml-2">
            {timeAgo}
          </span>
        ) : null}
      </div>

      {/* Items */}
      <div className="mt-3 space-y-1">
        {order.items?.map((item, index) => {
          const isFood = isFoodItem(item.name)
          const detailParts = isFood ? [] : [item.size, item.milk, item.temperature].filter(isVisible)
          const extras = item.extras?.length ? item.extras : []
          return (
            <div key={`${item.name}-${index}`}>
              <p className="font-sans text-base text-cafe-charcoal">
                {item.quantity > 1 && (
                  <span className="mr-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded bg-cafe-charcoal/10 text-cafe-charcoal/70 align-middle">
                    {item.quantity}x
                  </span>
                )}
                <span className="font-semibold">{item.name}</span>
                {detailParts.length > 0 && (
                  <>
                    <span className="font-semibold">:</span>
                    <span className="text-cafe-charcoal/60"> {detailParts.join(' · ')}</span>
                  </>
                )}
              </p>
              {extras.length > 0 && (
                <p className="font-sans text-base text-cafe-charcoal/60 pl-2">
                  {extras.join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions for placed orders */}
      {isPlaced && (
        <div className="flex gap-3 mt-auto pt-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onStartMaking(order.id)}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 rounded-lg bg-cafe-coffee text-cafe-cream font-sans font-semibold transition-colors hover:bg-cafe-coffee/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {isUpdating ? 'Updating...' : 'In Progress'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancelClick}
            disabled={isUpdating}
            className="py-3 px-4 rounded-lg bg-cafe-charcoal/10 text-cafe-charcoal font-sans font-semibold transition-colors hover:bg-cafe-charcoal/15 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            Cancel
          </motion.button>
        </div>
      )}

      {/* Actions for in-progress orders */}
      {isInProgress && (
        <div className="flex gap-3 mt-auto pt-5 items-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onDone(order.id)}
            disabled={isUpdating}
            className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-sans font-semibold transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {isUpdating ? 'Updating...' : 'Done'}
          </motion.button>

          {/* Overflow menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-3 rounded-lg bg-cafe-charcoal/10 hover:bg-cafe-charcoal/15 transition-colors min-h-[52px]"
              aria-label="More actions"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-cafe-charcoal/70">
                <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                <circle cx="10" cy="16" r="1.5" fill="currentColor" />
              </svg>
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-cafe-charcoal/10 overflow-hidden min-w-[180px] z-50"
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onBackToQueue(order.id)
                    }}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-3 font-sans text-sm font-medium text-cafe-charcoal/70 hover:bg-cafe-charcoal/5 hover:text-cafe-charcoal transition-colors disabled:opacity-50"
                  >
                    Back to Queue
                  </button>
                  <div className="border-t border-cafe-charcoal/10" />
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onCancelClick()
                    }}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-3 font-sans text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Completed/Canceled: status badge + overflow menu */}
      {isDone && (
        <div className="flex items-center gap-3 mt-auto pt-5">
          {/* Status badge */}
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-sans font-semibold text-sm">Completed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-sans font-semibold text-sm">Canceled</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Overflow menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-lg bg-cafe-charcoal/10 hover:bg-cafe-charcoal/15 transition-colors"
              aria-label="More actions"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-cafe-charcoal/70">
                <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                <circle cx="10" cy="16" r="1.5" fill="currentColor" />
              </svg>
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-cafe-charcoal/10 overflow-hidden min-w-[180px] z-50"
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onBackToQueue(order.id)
                    }}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-3 font-sans text-sm font-medium text-cafe-charcoal/70 hover:bg-cafe-charcoal/5 hover:text-cafe-charcoal transition-colors disabled:opacity-50"
                  >
                    Back to Queue
                  </button>
                  <div className="border-t border-cafe-charcoal/10" />
                  {isCompleted ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        onCancelClick()
                      }}
                      disabled={isUpdating}
                      className="w-full text-left px-4 py-3 font-sans text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        onDone(order.id)
                      }}
                      disabled={isUpdating}
                      className="w-full text-left px-4 py-3 font-sans text-sm font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                      Mark as Completed
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
