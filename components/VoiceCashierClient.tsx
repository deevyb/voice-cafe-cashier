'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CartItem } from '@/lib/supabase'
import ChatPanel, { type ChatMessage } from '@/components/chat/ChatPanel'
import CartPanel from '@/components/cart/CartPanel'
import VoiceIndicator from '@/components/voice/VoiceIndicator'
import { useRealtimeSession } from '@/hooks/useRealtimeSession'

type AppMode = 'voice' | 'text'

const INITIAL_GREETING: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content: 'Welcome! What can I get started for you today?',
}

/** Auto-dismiss confirmation if customer doesn't interact (ms) */
const CONFIRMATION_AUTO_DISMISS_MS = 30_000

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function VoiceCashierClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING])
  const [cart, setCart] = useState<CartItem[]>([])
  const [mode, setMode] = useState<AppMode>('voice')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderFinalized, setOrderFinalized] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<{
    customerName: string
    items: CartItem[]
  } | null>(null)

  // Shared order submission — used by AI-driven finalize (both modes) and manual Place Order button
  const submitOrder = async (customerName: string, cartItems: CartItem[]) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, items: cartItems }),
      })

      if (!response.ok) throw new Error('Failed to submit order')
      await response.json()
      setOrderFinalized(true)
      // Disconnect voice session before showing confirmation
      if (mode === 'voice' && voice.isConnected) {
        voice.disconnect()
      }
      setConfirmedOrder({ customerName, items: cartItems })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manual "Place Order" button handler — used by CartPanel in both modes
  const handleManualPlaceOrder = useCallback(
    async (customerName: string) => {
      try {
        await submitOrder(customerName, cart)
      } catch (err) {
        console.error('Manual order submit error:', err)
        if (mode === 'text') {
          setMessages((prev) => [
            ...prev,
            { id: createId(), role: 'assistant', content: 'Sorry, there was a problem placing your order. Please try again.' },
          ])
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, mode]
  )

  // --- Voice mode hooks (called unconditionally per React rules) ---
  const handleVoiceFinalize = useCallback(
    async (customerName: string) => {
      await submitOrder(customerName, cart)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart]
  )

  const voice = useRealtimeSession({
    onCartUpdate: setCart,
    onFinalize: handleVoiceFinalize,
  })

  // Reset all ordering state (used by mode switch)
  const resetOrderState = useCallback(() => {
    setCart([])
    setOrderFinalized(false)
    setConfirmedOrder(null)
    setIsSubmitting(false)
    setMessages([{ ...INITIAL_GREETING, id: createId() }])
  }, [])

  // Dismiss confirmation overlay and start new order in same mode
  const handleDismissConfirmation = useCallback(() => {
    resetOrderState()
  }, [resetOrderState])

  // Auto-dismiss confirmation if untouched (stays in same mode)
  useEffect(() => {
    if (!confirmedOrder) return
    const timer = setTimeout(() => {
      resetOrderState()
    }, CONFIRMATION_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [confirmedOrder, resetOrderState])

  const handleModeChange = useCallback(
    (newMode: 'voice' | 'text') => {
      if (mode === 'voice' && voice.isConnected) {
        voice.disconnect()
      }
      resetOrderState()
      setMode(newMode)
    },
    [mode, voice, resetOrderState]
  )

  // --- Text mode handlers ---
  const handleSend = async (text: string) => {
    if (isProcessing || orderFinalized) return

    const userMessage: ChatMessage = { id: createId(), role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map((m) => ({ role: m.role, content: m.content })), cart }),
      })

      if (!response.ok) {
        throw new Error('Chat request failed')
      }

      const result = await response.json()

      // Server is authoritative: set cart directly from response
      if (result.cart) {
        setCart(result.cart)
      }

      // Handle finalize if server detected it
      if (result.finalize) {
        await submitOrder(result.finalize.customer_name, result.cart || cart)
      }

      const assistantText =
        result.text || (result.cart ? 'Got it. I updated your order.' : 'Could you say that another way?')
      setMessages((prev) => [...prev, { id: createId(), role: 'assistant', content: assistantText }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: 'assistant', content: 'Sorry, I hit an issue. Please try that again.' },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Render ---

  // Voice mode
  if (mode === 'voice') {
    return (
      <>
        <main className="min-h-screen bg-cafe-cream p-4 sm:p-8 overflow-x-hidden">
          <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
            <h1 className="font-serif text-3xl text-cafe-coffee shrink-0">Coffee Rooom</h1>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-cafe-charcoal/20 px-3 py-2 text-sm font-medium shrink-0"
              onClick={() => handleModeChange('text')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Switch to Chat
            </button>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-cafe-charcoal/10 bg-white p-6">
              <VoiceIndicator
                connectionState={voice.connectionState}
                isSpeaking={voice.isSpeaking}
                isUserSpeaking={voice.isUserSpeaking}
                error={voice.error}
                micDenied={voice.micDenied}
                isSubmitting={isSubmitting}
                onConnect={voice.connect}
                onDisconnect={voice.disconnect}
              />
            </div>
            <div className="space-y-3">
              <CartPanel
                cart={cart}
                onPlaceOrder={handleManualPlaceOrder}
                orderFinalized={orderFinalized}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </main>

        {/* Full-screen confirmation overlay */}
        <AnimatePresence>
          {confirmedOrder && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-cafe-cream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm px-4 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cafe-coffee/10">
                  <svg className="h-8 w-8 text-cafe-coffee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mb-6 text-cafe-charcoal/60">On it!</p>

                {/* Receipt card */}
                <div className="mb-6 rounded-xl border border-cafe-charcoal/10 bg-white p-5 text-left shadow-sm">
                  <h2 className="mb-3 text-center font-sans text-lg font-semibold text-cafe-charcoal">
                    Order for {confirmedOrder.customerName}
                  </h2>
                  <div className="border-t border-cafe-charcoal/10" />
                  <ul className="mt-3 space-y-3">
                    {confirmedOrder.items.map((item, i) => {
                      const details = [item.size, item.milk]
                        .filter((v) => v && v.trim().toLowerCase() !== 'n/a')
                        .join(' · ')
                      const lineTotal = item.price ? item.price * item.quantity : undefined
                      return (
                        <li key={i}>
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-cafe-charcoal">
                              {item.quantity > 1 && (
                                <span className="mr-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded bg-cafe-charcoal/10 text-cafe-charcoal/70 align-middle">
                                  {item.quantity}x
                                </span>
                              )}
                              {item.name}
                            </span>
                            {lineTotal !== undefined && (
                              <span className="ml-2 whitespace-nowrap text-sm text-cafe-charcoal/80">
                                ${lineTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {details && (
                            <p className="text-sm text-cafe-charcoal/60">{details}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-3 border-t border-cafe-charcoal/10 pt-3">
                    <div className="flex justify-between font-semibold text-cafe-charcoal">
                      <span>Total</span>
                      <span>
                        ${confirmedOrder.items
                          .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDismissConfirmation}
                  className="w-full rounded-lg bg-cafe-coffee px-6 py-3 font-medium text-cafe-cream transition-colors hover:bg-cafe-coffee/90"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Text mode
  return (
    <>
      <main className="min-h-screen bg-cafe-cream p-4 sm:p-8 overflow-x-hidden">
        <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
          <h1 className="font-serif text-3xl text-cafe-coffee shrink-0">Coffee Rooom</h1>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-cafe-charcoal/20 px-3 py-2 text-sm font-medium shrink-0" onClick={() => handleModeChange('voice')}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" />
            </svg>
            Switch to Voice
          </button>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
          <ChatPanel messages={messages} isProcessing={isProcessing} onSend={handleSend} />
          <div className="space-y-3">
            <CartPanel
              cart={cart}
              onPlaceOrder={handleManualPlaceOrder}
              orderFinalized={orderFinalized}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </main>

      {/* Full-screen confirmation overlay */}
      <AnimatePresence>
        {confirmedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-cafe-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm px-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cafe-coffee/10">
                <svg className="h-8 w-8 text-cafe-coffee" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-6 text-cafe-charcoal/60">On it!</p>

              {/* Receipt card */}
              <div className="mb-6 rounded-xl border border-cafe-charcoal/10 bg-white p-5 text-left shadow-sm">
                <h2 className="mb-3 text-center font-sans text-lg font-semibold text-cafe-charcoal">
                  Order for {confirmedOrder.customerName}
                </h2>
                <div className="border-t border-cafe-charcoal/10" />
                <ul className="mt-3 space-y-3">
                  {confirmedOrder.items.map((item, i) => {
                    const details = [item.size, item.milk]
                      .filter((v) => v && v.trim().toLowerCase() !== 'n/a')
                      .join(' · ')
                    const lineTotal = item.price ? item.price * item.quantity : undefined
                    return (
                      <li key={i}>
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-cafe-charcoal">
                            {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          </span>
                          {lineTotal !== undefined && (
                            <span className="ml-2 whitespace-nowrap text-sm text-cafe-charcoal/80">
                              ${lineTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {details && (
                          <p className="text-sm text-cafe-charcoal/60">{details}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-3 border-t border-cafe-charcoal/10 pt-3">
                  <div className="flex justify-between font-semibold text-cafe-charcoal">
                    <span>Total</span>
                    <span>
                      ${confirmedOrder.items
                        .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismissConfirmation}
                className="w-full rounded-lg bg-cafe-coffee px-6 py-3 font-medium text-cafe-cream transition-colors hover:bg-cafe-coffee/90"
              >
                New Order
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
