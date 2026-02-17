'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TimeSeriesPoint } from '@/lib/supabase'

export default function OrdersChart({ data, dateLabel }: { data: TimeSeriesPoint[]; dateLabel: string }) {
  // Only show hours that have data, plus one hour before/after for context
  // If no data at all, show business hours (7am-7pm)
  const hasAnyOrders = data.some((d) => d.orders > 0)

  let displayData = data
  if (hasAnyOrders) {
    const firstIdx = data.findIndex((d) => d.orders > 0)
    const lastIdx = data.length - 1 - [...data].reverse().findIndex((d) => d.orders > 0)
    const start = Math.max(0, firstIdx - 1)
    const end = Math.min(data.length - 1, lastIdx + 1)
    displayData = data.slice(start, end + 1)
  } else {
    displayData = data.slice(7, 20) // 7am-7pm
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
      <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-4">
        Orders by Hour – {dateLabel}
      </h3>
      {!hasAnyOrders ? (
        <p className="text-description text-sm">No orders yet</p>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 14, fill: '#9B9590' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E5E5' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9B9590' }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E5E5',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                }}
                formatter={(value: number | undefined, name: string | undefined) => {
                  if (name === 'orders') return [value ?? 0, 'Orders']
                  return [value ?? 0, name ?? '']
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#6F4E37"
                strokeWidth={2}
                dot={{ fill: '#6F4E37', r: 3 }}
                activeDot={{ fill: '#6F4E37', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
