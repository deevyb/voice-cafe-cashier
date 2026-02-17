import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculatePrice } from '@/lib/menu'

// Disable caching for fresh stats on every request
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats?timezone=America/New_York&date=2026-02-14
 *
 * Returns dashboard statistics:
 * - Order counts (target date + cumulative up-to-date) with status breakdown
 * - Popular items (target date)
 * - Modifier preferences (target date)
 * - Avg order value ($)
 * - Avg fulfillment time (minutes)
 * - Time series (orders per hour for target date)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timezone = searchParams.get('timezone') || 'America/New_York'

    // Compute "today" in the owner's local timezone
    const localToday = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
    const targetDate = searchParams.get('date') || localToday

    // Fetch all orders (we need both target-date and cumulative)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items, status, created_at, updated_at')

    if (error) throw error

    const allOrders = orders || []

    // Parse target date boundaries in local timezone
    const dayStart = localDateToUTC(targetDate, timezone, 0, 0, 0)
    const dayEnd = localDateToUTC(targetDate, timezone, 23, 59, 59)

    // Filter: target-date orders and cumulative (up to end of target date)
    const targetOrders = allOrders.filter((o) => {
      const t = new Date(o.created_at).getTime()
      return t >= dayStart.getTime() && t <= dayEnd.getTime()
    })

    const cumulativeOrders = allOrders.filter((o) => {
      return new Date(o.created_at).getTime() <= dayEnd.getTime()
    })

    // When a specific date is requested, scope all metrics to that date.
    // When no date (all-time mode), use cumulative orders.
    const hasDateFilter = searchParams.has('date')
    const scopedOrders = hasDateFilter ? targetOrders : cumulativeOrders

    // Count orders by status
    const countByStatus = (orderList: typeof allOrders) => {
      return orderList.reduce(
        (acc, order) => {
          acc.total++
          if (order.status === 'placed') acc.placed++
          else if (order.status === 'in_progress') acc.in_progress++
          else if (order.status === 'completed') acc.completed++
          else if (order.status === 'canceled') acc.canceled++
          return acc
        },
        { total: 0, placed: 0, in_progress: 0, completed: 0, canceled: 0 }
      )
    }

    // Popular items — scoped to date filter or all time
    const itemCounts: Record<string, number> = {}
    for (const order of scopedOrders) {
      const orderItems = Array.isArray(order.items) ? order.items : []
      for (const item of orderItems) {
        if (!item?.name) continue
        const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
        itemCounts[item.name] = (itemCounts[item.name] || 0) + quantity
      }
    }

    const popularDrinks = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    // Modifier breakdown
    const modifierCounts: Record<string, Record<string, number>> = {}
    for (const order of scopedOrders) {
      const orderItems = Array.isArray(order.items) ? order.items : []
      for (const item of orderItems) {
        const pairs: Array<[string, string | undefined]> = [
          ['size', item.size],
          ['milk', item.milk],
          ['temperature', item.temperature],
        ]
        for (const [category, option] of pairs) {
          if (!option) continue
          if (!modifierCounts[category]) modifierCounts[category] = {}
          modifierCounts[category][option] = (modifierCounts[category][option] || 0) + 1
        }
      }
    }

    const modifierBreakdown: Record<
      string,
      { option: string; count: number; percentage: number }[]
    > = {}

    for (const [category, options] of Object.entries(modifierCounts)) {
      const total = Object.values(options).reduce((a, b) => a + b, 0)
      modifierBreakdown[category] = Object.entries(options)
        .map(([option, count]) => ({
          option,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count)
    }

    // Add-on breakdown — categorize extras from item.extras[]
    const ADDON_CATEGORIES: { name: string; pattern: RegExp }[] = [
      { name: 'shots', pattern: /espresso shot|matcha shot/i },
      { name: 'syrups', pattern: /syrup|caramel|hazelnut/i },
      { name: 'sweetness', pattern: /sugar/i },
      { name: 'ice', pattern: /ice/i },
    ]

    const categorizeExtra = (extra: string): string | null => {
      for (const cat of ADDON_CATEGORIES) {
        if (cat.pattern.test(extra)) return cat.name
      }
      return null
    }

    // Normalize syrup names: strip pump counts ("2 Pumps Caramel Syrup" → "Caramel Syrup")
    const normalizeExtra = (extra: string, category: string): string => {
      if (category === 'syrups') {
        return extra.replace(/^\d+\s*pumps?\s*/i, '').trim()
      }
      return extra.trim()
    }

    const addOnCounts: Record<string, Record<string, number>> = {}
    const addOnOrderSets: Record<string, Set<number>> = {} // track which orders have each category

    let orderIdx = 0
    for (const order of scopedOrders) {
      const orderItems = Array.isArray(order.items) ? order.items : []
      for (const item of orderItems) {
        if (!Array.isArray(item.extras)) continue
        for (const extra of item.extras) {
          const category = categorizeExtra(extra)
          if (!category) continue
          const normalized = normalizeExtra(extra, category)
          if (!addOnCounts[category]) addOnCounts[category] = {}
          addOnCounts[category][normalized] = (addOnCounts[category][normalized] || 0) + 1
          if (!addOnOrderSets[category]) addOnOrderSets[category] = new Set()
          addOnOrderSets[category].add(orderIdx)
        }
      }
      orderIdx++
    }

    const addOnBreakdown: Record<string, { option: string; count: number; percentage: number }[]> = {}
    for (const [category, options] of Object.entries(addOnCounts)) {
      const total = Object.values(options).reduce((a, b) => a + b, 0)
      addOnBreakdown[category] = Object.entries(options)
        .map(([option, count]) => ({
          option,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count)
    }

    const totalScopedOrders = scopedOrders.length
    const addOnAttachRate: Record<string, number> = {}
    for (const [category, orderSet] of Object.entries(addOnOrderSets)) {
      addOnAttachRate[category] = totalScopedOrders > 0
        ? Math.round((orderSet.size / totalScopedOrders) * 100)
        : 0
    }

    // Avg order value
    const completedTarget = scopedOrders.filter((o) => o.status === 'completed')
    let avgOrderValue: number | null = null
    if (completedTarget.length > 0) {
      let totalRevenue = 0
      for (const order of completedTarget) {
        const orderItems = Array.isArray(order.items) ? order.items : []
        for (const item of orderItems) {
          const unitPrice = calculatePrice(item) ?? 0
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
          totalRevenue += unitPrice * qty
        }
      }
      avgOrderValue = Math.round((totalRevenue / completedTarget.length) * 100) / 100
    }

    // Avg fulfillment time
    let avgFulfillmentTime: number | null = null
    const withFulfillment = completedTarget.filter((o) => o.updated_at && o.created_at)
    if (withFulfillment.length > 0) {
      let totalMinutes = 0
      for (const order of withFulfillment) {
        const created = new Date(order.created_at).getTime()
        const updated = new Date(order.updated_at).getTime()
        totalMinutes += (updated - created) / 60000
      }
      avgFulfillmentTime = Math.round((totalMinutes / withFulfillment.length) * 10) / 10
    }

    // Time series — hourly buckets for target date
    const hourBuckets: { label: string; orders: number; revenue: number }[] = []
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      const hourOrders = targetOrders.filter((o) => {
        const d = new Date(o.created_at)
        // Convert to local hour in owner's timezone
        const localHour = parseInt(
          new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(d)
        )
        return localHour === h
      })

      let revenue = 0
      for (const order of hourOrders) {
        const orderItems = Array.isArray(order.items) ? order.items : []
        for (const item of orderItems) {
          const unitPrice = calculatePrice(item) ?? 0
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
          revenue += unitPrice * qty
        }
      }

      hourBuckets.push({
        label,
        orders: hourOrders.length,
        revenue: Math.round(revenue * 100) / 100,
      })
    }

    return NextResponse.json({
      today: countByStatus(targetOrders),
      allTime: countByStatus(cumulativeOrders),
      popularDrinks,
      modifierBreakdown,
      addOnBreakdown,
      addOnAttachRate,
      avgOrderValue,
      avgFulfillmentTime,
      timeSeries: hourBuckets,
      targetDate,
      isToday: targetDate === localToday,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

/**
 * Convert a local date + time to a UTC Date object.
 * Uses Intl to figure out the UTC offset for the given timezone.
 */
function localDateToUTC(
  dateStr: string,
  timezone: string,
  hours: number,
  minutes: number,
  seconds: number
): Date {
  // Create a date in UTC first, then adjust for timezone offset
  const [year, month, day] = dateStr.split('-').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))

  // Get the offset by formatting in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Parse the formatted parts to compute the actual offset
  const parts = formatter.formatToParts(utcGuess)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0')

  const localInTZ = new Date(
    Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  )
  const offsetMs = localInTZ.getTime() - utcGuess.getTime()

  // The actual UTC time for the desired local time
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds) - offsetMs)
}
