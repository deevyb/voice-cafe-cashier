'use client'

export default function SummaryMetrics({
  avgOrderValue,
  avgFulfillmentTime,
}: {
  avgOrderValue: number | null
  avgFulfillmentTime: number | null
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
        <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-1">
          Avg Order Value
        </h3>
        <p className="font-sans font-bold text-3xl text-cafe-coffee">
          {avgOrderValue != null ? `$${avgOrderValue.toFixed(2)}` : '--'}
        </p>
      </div>
      <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10">
        <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-cafe-charcoal/60 mb-1">
          Avg Fulfillment Time
        </h3>
        <p className="font-sans font-bold text-3xl text-cafe-coffee">
          {avgFulfillmentTime != null ? `${avgFulfillmentTime} min` : '--'}
        </p>
      </div>
    </div>
  )
}
