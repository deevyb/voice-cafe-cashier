'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TimeSeriesPoint } from '@/lib/supabase'

export default function OrdersChart({ data, dateLabel }: { data: TimeSeriesPoint[]; dateLabel: string }) {
  // Always show shop hours: 8am (index 8) through 4pm (index 16)
  const hasAnyOrders = data.some((d) => d.orders > 0)
  const displayData = data.slice(8, 17) // 8am–4pm

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
