'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface ConnectionStatusProps {
  isConnected: boolean
}

export default function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-amber-50 border-b border-amber-200 px-4 py-3"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            {/* Warning icon */}
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>

            {/* Message */}
            <p className="font-manrope text-sm text-amber-700">
              <span className="font-semibold">Offline</span> — reconnecting to live updates...
            </p>

            {/* Loading spinner */}
            <svg
              className="w-4 h-4 text-amber-600 animate-spin ml-auto"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
