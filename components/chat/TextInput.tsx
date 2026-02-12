'use client'

import { FormEvent, useState } from 'react'

export default function TextInput({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next = value.trim()
    if (!next || disabled) return
    onSend(next)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your order..."
        className="flex-1 rounded-lg border border-delo-navy/20 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-delo-maroon/40"
        disabled={disabled}
      />
      <button
        type="submit"
        className="rounded-lg bg-delo-maroon px-4 py-3 text-delo-cream disabled:opacity-50"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  )
}
