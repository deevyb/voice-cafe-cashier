'use client'

import { motion } from 'framer-motion'
import type { ConnectionState } from '@/hooks/useRealtimeSession'

interface VoiceIndicatorProps {
  connectionState: ConnectionState
  isSpeaking: boolean
  isUserSpeaking: boolean
  error: string | null
  micDenied?: boolean
  isSubmitting?: boolean
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

function MicOffIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
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
  micDenied,
  isSubmitting,
  onConnect,
  onDisconnect,
}: VoiceIndicatorProps) {
  // Idle — show start button
  if (connectionState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <motion.button
          onClick={onConnect}
          className="flex h-28 w-28 items-center justify-center rounded-full bg-cafe-coffee text-cafe-cream shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MicIcon size={48} />
        </motion.button>
        <p className="text-cafe-charcoal/70 text-sm">Tap to start voice ordering</p>
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
            className="absolute h-28 w-28 rounded-full bg-cafe-coffee/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-cafe-coffee/30">
            <MicIcon size={48} className="text-cafe-coffee" />
          </div>
        </div>
        <p className="text-cafe-charcoal/70 text-sm">Connecting...</p>
      </div>
    )
  }

  // Error — show message and retry, with special mic-denied UX
  if (connectionState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-red-50">
          {micDenied ? (
            <MicOffIcon size={48} className="text-red-400" />
          ) : (
            <ErrorIcon size={48} className="text-red-400" />
          )}
        </div>
        {micDenied ? (
          <div className="max-w-xs space-y-2 text-center">
            <p className="text-sm font-medium text-red-600">Microphone access was denied</p>
            <ol className="space-y-1 text-left text-xs text-cafe-charcoal/70">
              <li>1. Click the lock or camera icon in your browser address bar</li>
              <li>2. Find &quot;Microphone&quot; and change it to &quot;Allow&quot;</li>
              <li>3. Tap &quot;Try Again&quot; below</li>
            </ol>
          </div>
        ) : (
          <p className="max-w-xs text-center text-sm text-red-600">{error || 'Connection failed'}</p>
        )}
        <motion.button
          onClick={onConnect}
          className="rounded-lg bg-cafe-coffee px-5 py-2.5 text-sm font-medium text-cafe-cream"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      </div>
    )
  }

  // Connected — show listening/speaking/submitting state
  const statusText = isSubmitting
    ? 'Placing your order...'
    : isSpeaking
      ? 'AI is speaking...'
      : isUserSpeaking
        ? 'Listening...'
        : 'Ready — speak anytime'

  const ringColor = isSpeaking ? 'bg-cafe-coffee/15' : 'bg-blue-500/15'
  const circleColor = isSubmitting
    ? 'bg-green-500'
    : isSpeaking
      ? 'bg-cafe-coffee'
      : isUserSpeaking
        ? 'bg-blue-500'
        : 'bg-cafe-charcoal/20'
  const isActive = isSpeaking || isUserSpeaking || isSubmitting

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
          <MicIcon size={48} className={circleColor === 'bg-cafe-charcoal/20' ? 'text-cafe-charcoal/50' : 'text-white'} />
        </motion.div>
      </div>

      <p className="text-sm text-cafe-charcoal/70">{statusText}</p>

      <button
        onClick={onDisconnect}
        className="rounded-lg border border-cafe-charcoal/20 px-4 py-2 text-sm text-cafe-charcoal transition-colors hover:bg-cafe-charcoal/5"
      >
        End Session
      </button>
    </div>
  )
}
