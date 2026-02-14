'use client'

import { FormEvent, useRef, useState } from 'react'

export default function TextInput({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next = value.trim()
    if (!next || disabled) return
    onSend(next)
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your order..."
        className="flex-1 rounded-lg border border-cafe-charcoal/20 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-cafe-coffee/40"
      />
      <button
        type="submit"
        className="rounded-lg bg-cafe-coffee px-4 py-3 text-cafe-cream disabled:opacity-50"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  )
}
