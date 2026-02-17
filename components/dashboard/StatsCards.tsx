'use client'

import { OrderCounts } from '@/lib/supabase'

export default function StatsCards({
  targetDate,
  isToday,
  today,
  allTime,
}: {
  targetDate: string
  isToday: boolean
  today: OrderCounts
  allTime: OrderCounts
}) {
  const dateLabel = isToday ? 'Today' : formatDateLabel(targetDate)
  const cumulativeLabel = isToday ? 'All Time' : `Up to ${formatDateLabel(targetDate)}`

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatsCard title={dateLabel} counts={today} showInProgress />
      <StatsCard title={cumulativeLabel} counts={allTime} />
    </div>
  )
}

function StatsCard({ title, counts, showInProgress }: { title: string; counts: OrderCounts; showInProgress?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
      <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-1">
        {title}
      </h3>
      <p className="font-sans font-bold text-4xl text-cafe-coffee mb-3">
        {counts.total}
        <span className="text-lg font-semibold text-cafe-charcoal/40 ml-2">orders</span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-sans">
        <span className="text-cafe-charcoal/70">
          <span className="font-semibold text-[#C85A2E]">{counts.placed}</span> placed
        </span>
        {showInProgress && (
          <span className="text-cafe-charcoal/70">
            <span className="font-semibold text-amber-600">{counts.in_progress}</span> in progress
          </span>
        )}
        <span className="text-cafe-charcoal/70">
          <span className="font-semibold text-green-600">{counts.completed}</span> done
        </span>
        <span className="text-cafe-charcoal/70">
          <span className="font-semibold text-red-500">{counts.canceled}</span> canceled
        </span>
      </div>
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
