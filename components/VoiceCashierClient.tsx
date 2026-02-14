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

/** Auto-redirect delay after confirmation screen (ms) */
const CONFIRMATION_REDIRECT_MS = 3500

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

  // Auto-redirect to /order after confirmation screen
  useEffect(() => {
    if (!confirmedOrder) return
    const timer = setTimeout(() => {
      window.location.href = '/order'
    }, CONFIRMATION_REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [confirmedOrder])

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
                className="text-center"
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
                <h1 className="mb-4 font-bricolage text-4xl font-bold text-delo-navy">
                  {confirmedOrder.customerName}
                </h1>
                <p className="font-bricolage text-2xl font-semibold text-delo-navy">
                  {confirmedOrder.items
                    .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
                    .join(', ')}
                </p>
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
              className="text-center"
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
              <h1 className="mb-4 font-bricolage text-4xl font-bold text-delo-navy">
                {confirmedOrder.customerName}
              </h1>
              <p className="font-bricolage text-2xl font-semibold text-delo-navy">
                {confirmedOrder.items
                  .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
                  .join(', ')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
