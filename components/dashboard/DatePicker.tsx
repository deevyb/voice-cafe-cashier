'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

export default function DatePicker({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string | null // YYYY-MM-DD or null for "all time"
  onDateChange: (date: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = new Date()

  // Parse selected date for DayPicker (create in local time to avoid off-by-one)
  const selected = selectedDate
    ? (() => {
        const [y, m, d] = selectedDate.split('-').map(Number)
        return new Date(y, m - 1, d)
      })()
    : undefined

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = (day: Date | undefined) => {
    if (!day) return
    onDateChange(formatYMD(day))
    setOpen(false)
  }

  const displayLabel = selectedDate
    ? selected!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'All Time'

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={`px-4 py-2 rounded-lg font-sans text-sm font-semibold border transition-colors ${
            selectedDate
              ? 'bg-white border-cafe-charcoal/15 hover:border-cafe-coffee/40 text-cafe-charcoal'
              : 'bg-cafe-coffee/8 border-cafe-coffee/20 hover:border-cafe-coffee/40 text-cafe-coffee'
          }`}
        >
          <svg className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {displayLabel}
          {selectedDate ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDateChange(null)
              }}
              className="ml-2 text-cafe-charcoal/40 hover:text-cafe-charcoal/70 transition-colors"
              aria-label="Clear date filter"
            >
              &#x2715;
            </button>
          ) : (
            <span className="ml-2 text-cafe-coffee/50">&#9662;</span>
          )}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl border border-cafe-charcoal/10 shadow-lg p-3 cafe-calendar">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ after: today }}
            defaultMonth={selected || today}
          />
        </div>
      )}
    </div>
  )
}

function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
