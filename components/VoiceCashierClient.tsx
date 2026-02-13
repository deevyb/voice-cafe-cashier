'use client'

import { useState } from 'react'
import type { CartItem } from '@/lib/supabase'
import ChatPanel, { type ChatMessage } from '@/components/chat/ChatPanel'
import CartPanel from '@/components/cart/CartPanel'
import ReceiptView from '@/components/cart/ReceiptView'

type AppMode = 'voice' | 'text' | null

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function VoiceCashierClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: createId(), role: 'assistant', content: 'Welcome! What can I get started for you today?' },
  ])
  const [cart, setCart] = useState<CartItem[]>([])
  const [mode, setMode] = useState<AppMode>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderFinalized, setOrderFinalized] = useState(false)
  const [receipt, setReceipt] = useState<{ customerName: string; orderId: string } | null>(null)

  const submitOrder = async (customerName: string, cartItems: CartItem[]) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName, items: cartItems }),
    })

    if (!response.ok) throw new Error('Failed to submit order')
    const order = await response.json()
    setOrderFinalized(true)
    setReceipt({ customerName, orderId: order.id })
  }

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

  if (mode === null) {
    return (
      <main className="min-h-screen bg-delo-cream p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 font-bricolage text-4xl text-delo-maroon">Voice Cafe Cashier</h1>
          <p className="mb-8 text-delo-navy/70">Choose your ordering mode</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              className="rounded-xl border border-delo-navy/20 bg-white p-6 text-left hover:border-delo-maroon/40"
              onClick={() => setMode('text')}
            >
              <p className="font-semibold text-delo-navy">Chat</p>
              <p className="text-sm text-delo-navy/70">Chat with the cashier and see live cart updates.</p>
            </button>
            <button
              className="rounded-xl border border-delo-navy/20 bg-white p-6 text-left hover:border-delo-maroon/40"
              onClick={() => setMode('voice')}
            >
              <p className="font-semibold text-delo-navy">Voice</p>
              <p className="text-sm text-delo-navy/70">Voice mode is coming next. Use text mode for now.</p>
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (mode === 'voice') {
    return (
      <main className="min-h-screen bg-delo-cream p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-delo-navy/10 bg-white p-6">
          <h2 className="mb-2 font-bricolage text-2xl text-delo-navy">Voice Mode</h2>
          <p className="text-delo-navy/70">Voice mode will be added after text mode is fully validated.</p>
          <button className="mt-4 rounded-lg bg-delo-maroon px-4 py-2 text-delo-cream" onClick={() => setMode('text')}>
            Switch to Text Mode
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-delo-cream p-8">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
        <h1 className="font-bricolage text-3xl text-delo-maroon">Voice Cafe Cashier</h1>
        <button className="rounded-lg border border-delo-navy/20 px-3 py-2 text-sm" onClick={() => setMode(null)}>
          Change Mode
        </button>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="space-y-3">
          {orderFinalized && receipt ? (
            <ReceiptView customerName={receipt.customerName} cart={cart} orderId={receipt.orderId} />
          ) : null}
          <CartPanel cart={cart} />
        </div>
        <ChatPanel messages={messages} isProcessing={isProcessing} onSend={handleSend} />
      </div>
    </main>
  )
}
