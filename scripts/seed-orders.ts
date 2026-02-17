/**
 * Seed script — inserts 86 realistic orders into Supabase for Feb 9-16, 2026.
 * Also writes orders.csv to the repo root.
 *
 * Usage: npx tsx scripts/seed-orders.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import * as readline from 'readline'
import { calculatePrice, isFoodItem } from '../lib/menu'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------

const envPath = resolve(process.cwd(), '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch {
  console.error('Could not read .env.local — make sure it exists at repo root.')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Orders per day: Mon Feb 9 – Mon Feb 16, 2026 */
const DAILY_ORDERS: { date: string; count: number; isWeekend: boolean }[] = [
  { date: '2026-02-09', count: 9, isWeekend: false },  // Mon
  { date: '2026-02-10', count: 10, isWeekend: false }, // Tue
  { date: '2026-02-11', count: 11, isWeekend: false }, // Wed
  { date: '2026-02-12', count: 12, isWeekend: false }, // Thu
  { date: '2026-02-13', count: 13, isWeekend: false }, // Fri
  { date: '2026-02-14', count: 14, isWeekend: true },  // Sat (Valentine's)
  { date: '2026-02-15', count: 11, isWeekend: true },  // Sun
  { date: '2026-02-16', count: 6, isWeekend: false },  // Mon (today)
]

/**
 * Hourly weights — shop hours 8am–4pm (9 hours).
 * Index 0 = 8am, index 8 = 4pm.
 * Weekday: sharp morning rush 8–9am, lunch bump at noon, tapers by 3–4pm.
 * Weekend: later peak around 10–11am, flatter afternoon.
 */
const WEEKDAY_HOUR_WEIGHTS = [22, 18, 11, 8, 14, 9, 8, 6, 4]
//                             8am 9am 10  11  12p 1pm 2pm 3pm 4pm
const WEEKEND_HOUR_WEIGHTS = [8, 14, 18, 15, 14, 12, 9, 6, 4]
//                            8am 9am 10  11  12p 1pm 2pm 3pm 4pm
const HOUR_OFFSET = 8 // index 0 = 8:00 AM

/** Item frequency weights */
const ITEM_WEIGHTS: { name: string; weight: number }[] = [
  { name: 'Latte', weight: 24 },
  { name: 'Americano', weight: 13 },
  { name: 'Cold Brew', weight: 11 },
  { name: 'Matcha Latte', weight: 9 },
  { name: 'Plain Croissant', weight: 8 },
  { name: 'Mocha', weight: 7 },
  { name: 'Chocolate Croissant', weight: 6 },
  { name: 'Banana Bread', weight: 5 },
  { name: 'Chocolate Chip Cookie', weight: 4 },
  { name: 'Black Tea', weight: 4 },
  { name: 'Jasmine Tea', weight: 3 },
  { name: 'Coffee Frappuccino', weight: 3 },
  { name: 'Lemon Green Tea', weight: 3 },
]

/** Items per order distribution */
const ITEM_COUNT_WEIGHTS = [
  { count: 1, weight: 51 },
  { count: 2, weight: 34 },
  { count: 3, weight: 12 },
  { count: 4, weight: 3 },
]

/** Temperature bias per item (hot %) — Feb in NYC */
const TEMP_BIAS: Record<string, number> = {
  'Mocha': 74,
  'Americano': 68,
  'Latte': 61,
  'Matcha Latte': 54,
  'Black Tea': 79,
  'Jasmine Tea': 79,
  'Lemon Green Tea': 79,
}

/** Milk-based drinks (get milk modifier) */
const MILK_DRINKS = new Set(['Latte', 'Mocha', 'Matcha Latte', 'Coffee Frappuccino'])

/** Espresso-based drinks (can get extra shot) */
const ESPRESSO_DRINKS = new Set(['Americano', 'Latte', 'Mocha', 'Cold Brew', 'Coffee Frappuccino'])

/** Always-cold drinks (no temperature choice) */
const ALWAYS_COLD = new Set(['Cold Brew', 'Coffee Frappuccino'])

/** Milk weights */
const MILK_WEIGHTS = [
  { milk: 'Whole Milk', weight: 43 },
  { milk: 'Oat Milk', weight: 31 },
  { milk: 'Skim Milk', weight: 14 },
  { milk: 'Almond Milk', weight: 12 },
]

/** NYC-diverse first names (~50) */
const NAMES = [
  'Alex', 'Anya', 'Ben', 'Camila', 'Carlos', 'Charlotte', 'Chris',
  'Daniel', 'Devi', 'Diego', 'Elena', 'Emily', 'Ethan', 'Fatima',
  'Grace', 'Hana', 'Hiroshi', 'Isaac', 'Jade', 'James', 'Jenny',
  'Jordan', 'Julia', 'Kai', 'Karen', 'Kevin', 'Layla', 'Leo',
  'Lily', 'Lucas', 'Luna', 'Marcus', 'Maya', 'Michael', 'Mina',
  'Nadia', 'Nate', 'Noah', 'Olivia', 'Omar', 'Priya', 'Rachel',
  'Ravi', 'Sam', 'Sarah', 'Sofia', 'Suki', 'Tanya', 'Wei', 'Zara',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weightedRandom<T>(items: { weight: number }[] & T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function pickFromWeights(weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

function chance(pct: number): boolean {
  return Math.random() * 100 < pct
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Generate a timestamp for a given date string using hourly weights.
 * Returns a Date in UTC that corresponds to the given hour in America/New_York.
 */
function generateTimestamp(dateStr: string, isWeekend: boolean): Date {
  const weights = isWeekend ? WEEKEND_HOUR_WEIGHTS : WEEKDAY_HOUR_WEIGHTS
  const hourIndex = pickFromWeights(weights)
  const hour = HOUR_OFFSET + hourIndex
  const minute = randInt(0, 59)
  const second = randInt(0, 59)

  // Build the date in New York time, then convert to UTC.
  // Feb 2026 is EST (UTC-5) — no DST yet.
  const [y, m, d] = dateStr.split('-').map(Number)
  const nyDate = new Date(Date.UTC(y, m - 1, d, hour + 5, minute, second))
  return nyDate
}

interface SeedCartItem {
  name: string
  size?: string
  milk?: string
  temperature?: string
  extras?: string[]
  quantity: number
  price?: number
}

function generateItem(): SeedCartItem {
  const { name } = weightedRandom(ITEM_WEIGHTS)
  const food = isFoodItem(name)

  const item: SeedCartItem = { name, quantity: 1 }

  if (food) {
    item.price = calculatePrice({ name })
    return item
  }

  // Size
  const isLarge = chance(43)
  item.size = isLarge ? 'Large' : 'Small'

  // Temperature
  if (ALWAYS_COLD.has(name)) {
    item.temperature = 'Iced'
  } else {
    const hotPct = TEMP_BIAS[name] ?? 63
    item.temperature = chance(hotPct) ? 'Hot' : 'Iced'
  }

  // Milk
  if (MILK_DRINKS.has(name)) {
    item.milk = weightedRandom(MILK_WEIGHTS).milk
  }

  // Extras
  const extras: string[] = []

  // Extra shot
  if (ESPRESSO_DRINKS.has(name) && chance(17)) {
    extras.push('Extra Espresso Shot')
  }
  if (name === 'Matcha Latte' && chance(14)) {
    extras.push('Extra Matcha Shot')
  }

  // Syrup
  if (chance(21)) {
    const isCaramel = chance(62)
    const syrupName = isCaramel ? 'Caramel Syrup' : 'Hazelnut Syrup'
    if (chance(22)) {
      // Explicit pump count
      extras.push(isCaramel ? '2 Pumps Caramel Syrup' : '3 Pumps Hazelnut Syrup')
    } else {
      extras.push(syrupName)
    }
  }

  // Sweetness
  if (chance(13)) {
    const r = Math.random() * 100
    if (r < 48) extras.push('Less Sugar')
    else if (r < 79) extras.push('Extra Sugar')
    else extras.push('No Sugar')
  }

  // Ice level (only for iced drinks)
  if (item.temperature === 'Iced' && chance(19)) {
    const r = Math.random() * 100
    if (r < 46) extras.push('Less Ice')
    else if (r < 79) extras.push('Extra Ice')
    else extras.push('No Ice')
  }

  if (extras.length > 0) item.extras = extras

  item.price = calculatePrice({
    name,
    size: item.size,
    milk: item.milk,
    extras: item.extras,
  })

  return item
}

/** Fulfillment time in ms — simple drinks 3-5 min, complex 5-8 min */
const SIMPLE_DRINKS = new Set(['Americano', 'Black Tea', 'Jasmine Tea', 'Lemon Green Tea', 'Cold Brew'])

function fulfillmentMs(items: SeedCartItem[]): number {
  const hasComplex = items.some((i) => !SIMPLE_DRINKS.has(i.name) && !isFoodItem(i.name))
  const minMin = hasComplex ? 5 : 3
  const maxMin = hasComplex ? 8 : 5
  return randInt(minMin * 60 * 1000, maxMin * 60 * 1000)
}

interface SeedOrder {
  customer_name: string
  items: SeedCartItem[]
  status: 'placed' | 'completed' | 'canceled'
  created_at: string
  updated_at: string
}

function generateOrder(dateStr: string, isWeekend: boolean, isSunday: boolean): SeedOrder {
  const createdAt = generateTimestamp(dateStr, isWeekend)
  const customerName = pickRandom(NAMES)

  // Item count
  const { count: itemCount } = weightedRandom(ITEM_COUNT_WEIGHTS)
  const items: SeedCartItem[] = []
  for (let i = 0; i < itemCount; i++) {
    items.push(generateItem())
  }

  // Status
  let status: 'placed' | 'completed' | 'canceled'
  const isToday = dateStr === '2026-02-16'
  if (isToday) {
    // Today: mostly completed, a couple still placed
    const r = Math.random() * 100
    if (r < 70) status = 'completed'
    else status = 'placed'
  } else if (isSunday) {
    // Sunday Feb 15: 82% completed, 9% canceled, 9% placed
    const r = Math.random() * 100
    if (r < 82) status = 'completed'
    else if (r < 91) status = 'canceled'
    else status = 'placed'
  } else {
    // Historical: 89% completed, 11% canceled
    status = chance(89) ? 'completed' : 'canceled'
  }

  // Updated at
  let updatedAt: Date
  if (status === 'completed') {
    updatedAt = new Date(createdAt.getTime() + fulfillmentMs(items))
  } else {
    // Canceled or placed — updated_at near created_at
    updatedAt = new Date(createdAt.getTime() + randInt(0, 60_000))
  }

  return {
    customer_name: customerName,
    items,
    status,
    created_at: createdAt.toISOString(),
    updated_at: updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function itemSummary(item: SeedCartItem): string {
  const parts: string[] = []
  if (item.size) parts.push(item.size)
  if (item.milk) parts.push(item.milk)
  if (item.temperature) parts.push(item.temperature)
  if (item.extras) parts.push(...item.extras)
  const mods = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  const qty = item.quantity > 1 ? ` x${item.quantity}` : ''
  return `${item.name}${mods}${qty}`
}

function orderTotalPrice(items: SeedCartItem[]): number {
  return items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
}

function toCsvRow(order: SeedOrder & { id?: string }): string {
  const id = order.id ?? ''
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const total = orderTotalPrice(order.items).toFixed(2)
  const summary = order.items.map(itemSummary).join('; ')
  // Escape fields with commas or quotes
  const escapeCsv = (s: string) =>
    s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  return [
    id,
    escapeCsv(order.customer_name),
    order.status,
    itemCount,
    total,
    escapeCsv(summary),
    order.created_at,
  ].join(',')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

async function main() {
  console.log('Coffee Rooom — Seed Script')
  console.log('==========================\n')

  // Safety check
  const shouldDelete = await confirm('Delete existing orders before seeding?')
  if (shouldDelete) {
    // Delete in batches by date to avoid RLS/size issues
    const { data: existing, error: countErr } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
    if (countErr) {
      console.error('Failed to count existing orders:', countErr.message)
      process.exit(1)
    }
    console.log(`Found ${existing?.length ?? 0} existing orders.`)

    if (existing && existing.length > 0) {
      // Delete in chunks of 50 IDs
      for (let i = 0; i < existing.length; i += 50) {
        const ids = existing.slice(i, i + 50).map((r) => r.id)
        const { error } = await supabase.from('orders').delete().in('id', ids)
        if (error) {
          console.error('Failed to delete orders:', error.message)
          process.exit(1)
        }
      }
    }
    console.log('Existing orders deleted.\n')
  }

  // Generate orders
  const allOrders: SeedOrder[] = []
  for (const day of DAILY_ORDERS) {
    const isSunday = day.date === '2026-02-15'
    for (let i = 0; i < day.count; i++) {
      allOrders.push(generateOrder(day.date, day.isWeekend, isSunday))
    }
  }

  // Sort by created_at for realistic insertion order
  allOrders.sort((a, b) => a.created_at.localeCompare(b.created_at))

  console.log(`Generated ${allOrders.length} orders.\n`)

  // Print summary
  const statusCounts = { completed: 0, canceled: 0, placed: 0 }
  for (const o of allOrders) statusCounts[o.status]++
  console.log(`  Completed: ${statusCounts.completed}`)
  console.log(`  Canceled:  ${statusCounts.canceled}`)
  console.log(`  Placed:    ${statusCounts.placed}\n`)

  // Insert into Supabase
  console.log('Inserting into Supabase...')
  const { data, error } = await supabase
    .from('orders')
    .insert(allOrders)
    .select('id, customer_name, items, status, created_at, updated_at')

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`Inserted ${data.length} orders.\n`)

  // Write CSV
  const csvHeader = 'order_id,customer_name,status,item_count,total_price,items_summary,created_at'
  const csvRows = data.map((row: any) => {
    const order: SeedOrder & { id: string } = {
      id: row.id,
      customer_name: row.customer_name,
      items: row.items,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
    return toCsvRow(order)
  })
  const csv = [csvHeader, ...csvRows].join('\n') + '\n'
  const csvPath = resolve(process.cwd(), 'orders.csv')
  writeFileSync(csvPath, csv)
  console.log(`Wrote ${csvPath} (${data.length} rows)`)

  // Quick stats
  const totalRevenue = data.reduce((sum: number, row: any) => {
    return sum + row.items.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.quantity ?? 1), 0)
  }, 0)
  const avgOrder = totalRevenue / data.length
  console.log(`\nAvg order value: $${avgOrder.toFixed(2)}`)
  console.log(`Total revenue:   $${totalRevenue.toFixed(2)}`)
  console.log('\nDone!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
