'use client'

import { motion } from 'framer-motion'
import type { ConnectionState } from '@/hooks/useRealtimeSession'

interface VoiceIndicatorProps {
  connectionState: ConnectionState
  isSpeaking: boolean
  isUserSpeaking: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
}

function MicIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

function ErrorIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  )
}

export default function VoiceIndicator({
  connectionState,
  isSpeaking,
  isUserSpeaking,
  error,
  onConnect,
  onDisconnect,
}: VoiceIndicatorProps) {
  // Idle — show start button
  if (connectionState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <motion.button
          onClick={onConnect}
          className="flex h-28 w-28 items-center justify-center rounded-full bg-delo-maroon text-delo-cream shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MicIcon size={48} />
        </motion.button>
        <p className="text-delo-navy/70 text-sm">Tap to start voice ordering</p>
        {error && <p className="max-w-xs text-center text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  // Connecting — pulsing animation
  if (connectionState === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute h-28 w-28 rounded-full bg-delo-maroon/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-delo-maroon/30">
            <MicIcon size={48} className="text-delo-maroon" />
          </div>
        </div>
        <p className="text-delo-navy/70 text-sm">Connecting...</p>
      </div>
    )
  }

  // Error — show message and retry
  if (connectionState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-red-50">
          <ErrorIcon size={48} className="text-red-400" />
        </div>
        <p className="max-w-xs text-center text-sm text-red-600">{error || 'Connection failed'}</p>
        <motion.button
          onClick={onConnect}
          className="rounded-lg bg-delo-maroon px-5 py-2.5 text-sm font-medium text-delo-cream"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      </div>
    )
  }

  // Connected — show listening/speaking state
  const statusText = isSpeaking
    ? 'AI is speaking...'
    : isUserSpeaking
      ? 'Listening...'
      : 'Ready — speak anytime'

  const ringColor = isSpeaking ? 'bg-delo-maroon/15' : 'bg-blue-500/15'
  const circleColor = isSpeaking ? 'bg-delo-maroon' : isUserSpeaking ? 'bg-blue-500' : 'bg-delo-navy/20'
  const isActive = isSpeaking || isUserSpeaking

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16">
      <div className="relative flex items-center justify-center">
        {/* Outer ripple */}
        {isActive && (
          <>
            <motion.div
              className={`absolute h-28 w-28 rounded-full ${ringColor}`}
              animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            />
            <motion.div
              className={`absolute h-28 w-28 rounded-full ${ringColor}`}
              animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: 0.4 }}
            />
          </>
        )}

        {/* Main circle */}
        <motion.div
          className={`flex h-28 w-28 items-center justify-center rounded-full shadow-md transition-colors duration-300 ${circleColor}`}
          animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={isActive ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
        >
          <MicIcon size={48} className={circleColor === 'bg-delo-navy/20' ? 'text-delo-navy/50' : 'text-white'} />
        </motion.div>
      </div>

      <p className="text-sm text-delo-navy/70">{statusText}</p>

      <button
        onClick={onDisconnect}
        className="rounded-lg border border-delo-navy/20 px-4 py-2 text-sm text-delo-navy transition-colors hover:bg-delo-navy/5"
      >
        End Session
      </button>
    </div>
  )
}
