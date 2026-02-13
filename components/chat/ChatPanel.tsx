'use client'

import { useEffect, useRef } from 'react'
import AIMessage from './AIMessage'
import UserMessage from './UserMessage'
import TextInput from './TextInput'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPanel({
  messages,
  isProcessing,
  onSend,
}: {
  messages: ChatMessage[]
  isProcessing: boolean
  onSend: (value: string) => void
}) {
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isProcessing])

  return (
    <section className="flex h-[70vh] flex-col rounded-xl border border-delo-navy/10 bg-delo-cream/60 p-4">
      <div className="mb-3 border-b border-delo-navy/10 pb-2">
        <h2 className="font-bricolage text-xl text-delo-navy">Chat</h2>
      </div>

      <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) =>
          message.role === 'assistant' ? (
            <AIMessage key={message.id} text={message.content} />
          ) : (
            <UserMessage key={message.id} text={message.content} />
          )
        )}
        {isProcessing && (
          <div className="text-sm text-delo-navy/60" role="status">
            Cashier is thinking...
          </div>
        )}
      </div>

      <div className="mt-3">
        <TextInput onSend={onSend} disabled={isProcessing} />
      </div>
    </section>
  )
}
