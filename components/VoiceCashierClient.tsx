'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CartItem } from '@/lib/supabase'
import ChatPanel, { type ChatMessage } from '@/components/chat/ChatPanel'
import CartPanel from '@/components/cart/CartPanel'
import VoiceIndicator from '@/components/voice/VoiceIndicator'
import { useRealtimeSession } from '@/hooks/useRealtimeSession'

type AppMode = 'voice' | 'text' | null

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
  const [mode, setMode] = useState<AppMode>(null)
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

  // Dismiss confirmation overlay and return to mode selector
  const handleDismissConfirmation = useCallback(() => {
    resetOrderState()
    setMode(null)
  }, [resetOrderState])

  // Auto-dismiss confirmation and return to mode selector if untouched
  useEffect(() => {
    if (!confirmedOrder) return
    const timer = setTimeout(() => {
      resetOrderState()
      setMode(null)
    }, CONFIRMATION_AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [confirmedOrder, resetOrderState])

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
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

  // Mode selector
  if (mode === null) {
    return (
      <main className="min-h-screen bg-delo-cream p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 font-bricolage text-4xl text-delo-maroon">Voice Cafe Cashier</h1>
          <p className="mb-8 text-delo-navy/70">Choose your ordering mode</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              className="rounded-xl border border-delo-navy/20 bg-white p-6 text-left hover:border-delo-maroon/40"
              onClick={() => handleModeChange('text')}
            >
              <p className="font-semibold text-delo-navy">Chat</p>
              <p className="text-sm text-delo-navy/70">Chat with the cashier and see live cart updates.</p>
            </button>
            <button
              className="rounded-xl border border-delo-navy/20 bg-white p-6 text-left hover:border-delo-maroon/40"
              onClick={() => handleModeChange('voice')}
            >
              <p className="font-semibold text-delo-navy">Voice</p>
              <p className="text-sm text-delo-navy/70">Speak your order and hear the cashier respond.</p>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Voice mode
  if (mode === 'voice') {
    return (
      <>
        <main className="min-h-screen bg-delo-cream p-8">
          <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
            <h1 className="font-bricolage text-3xl text-delo-maroon">Voice Cafe Cashier</h1>
            <button
              className="rounded-lg border border-delo-navy/20 px-3 py-2 text-sm"
              onClick={() => handleModeChange(null)}
            >
              Change Mode
            </button>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-delo-navy/10 bg-white p-6">
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-delo-cream"
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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-delo-maroon/10">
                  <svg className="h-8 w-8 text-delo-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mb-6 text-delo-navy/60">On it!</p>

                {/* Receipt card */}
                <div className="mb-6 rounded-xl border border-delo-navy/10 bg-white p-5 text-left shadow-sm">
                  <h2 className="mb-3 text-center font-bricolage text-lg font-semibold text-delo-navy">
                    Order for {confirmedOrder.customerName}
                  </h2>
                  <div className="border-t border-delo-navy/10" />
                  <ul className="mt-3 space-y-3">
                    {confirmedOrder.items.map((item, i) => {
                      const details = [item.size, item.milk]
                        .filter((v) => v && v.trim().toLowerCase() !== 'n/a')
                        .join(' · ')
                      const lineTotal = item.price ? item.price * item.quantity : undefined
                      return (
                        <li key={i}>
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-delo-navy">
                              {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                            </span>
                            {lineTotal !== undefined && (
                              <span className="ml-2 whitespace-nowrap text-sm text-delo-navy/80">
                                ${lineTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {details && (
                            <p className="text-sm text-delo-navy/60">{details}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-3 border-t border-delo-navy/10 pt-3">
                    <div className="flex justify-between font-semibold text-delo-navy">
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
                  className="w-full rounded-lg bg-delo-maroon px-6 py-3 font-medium text-delo-cream transition-colors hover:bg-delo-maroon/90"
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
      <main className="min-h-screen bg-delo-cream p-8">
        <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
          <h1 className="font-bricolage text-3xl text-delo-maroon">Voice Cafe Cashier</h1>
          <button className="rounded-lg border border-delo-navy/20 px-3 py-2 text-sm" onClick={() => handleModeChange(null)}>
            Change Mode
          </button>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="space-y-3">
            <CartPanel
              cart={cart}
              onPlaceOrder={handleManualPlaceOrder}
              orderFinalized={orderFinalized}
              isSubmitting={isSubmitting}
            />
          </div>
          <ChatPanel messages={messages} isProcessing={isProcessing} onSend={handleSend} />
        </div>
      </main>

      {/* Full-screen confirmation overlay */}
      <AnimatePresence>
        {confirmedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-delo-cream"
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-delo-maroon/10">
                <svg className="h-8 w-8 text-delo-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-6 text-delo-navy/60">On it!</p>

              {/* Receipt card */}
              <div className="mb-6 rounded-xl border border-delo-navy/10 bg-white p-5 text-left shadow-sm">
                <h2 className="mb-3 text-center font-bricolage text-lg font-semibold text-delo-navy">
                  Order for {confirmedOrder.customerName}
                </h2>
                <div className="border-t border-delo-navy/10" />
                <ul className="mt-3 space-y-3">
                  {confirmedOrder.items.map((item, i) => {
                    const details = [item.size, item.milk]
                      .filter((v) => v && v.trim().toLowerCase() !== 'n/a')
                      .join(' · ')
                    const lineTotal = item.price ? item.price * item.quantity : undefined
                    return (
                      <li key={i}>
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-delo-navy">
                            {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          </span>
                          {lineTotal !== undefined && (
                            <span className="ml-2 whitespace-nowrap text-sm text-delo-navy/80">
                              ${lineTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {details && (
                          <p className="text-sm text-delo-navy/60">{details}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-3 border-t border-delo-navy/10 pt-3">
                  <div className="flex justify-between font-semibold text-delo-navy">
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
                className="w-full rounded-lg bg-delo-maroon px-6 py-3 font-medium text-delo-cream transition-colors hover:bg-delo-maroon/90"
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
