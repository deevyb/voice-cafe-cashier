'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

export default function DatePicker({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string // YYYY-MM-DD
  onDateChange: (date: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayStr = formatYMD(today)
  const isToday = selectedDate === todayStr

  // Parse selected date for DayPicker (create in local time to avoid off-by-one)
  const [y, m, d] = selectedDate.split('-').map(Number)
  const selected = new Date(y, m - 1, d)

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

  const displayLabel = isToday
    ? 'Today'
    : selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 rounded-lg font-sans text-sm font-semibold bg-white border border-cafe-charcoal/15 hover:border-cafe-coffee/40 transition-colors text-cafe-charcoal"
        >
          {displayLabel}
          <span className="ml-2 text-cafe-charcoal/40">&#9662;</span>
        </button>
        {!isToday && (
          <button
            onClick={() => onDateChange(todayStr)}
            className="px-3 py-2 rounded-lg font-sans text-xs font-semibold text-cafe-coffee hover:bg-cafe-coffee/10 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl border border-cafe-charcoal/10 shadow-lg p-3 cafe-calendar">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ after: today }}
            defaultMonth={selected}
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
