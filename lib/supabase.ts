import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type OrderStatus = 'placed' | 'in_progress' | 'completed' | 'canceled'

export interface CartItem {
  name: string
  size?: string
  milk?: string
  temperature?: string
  extras?: string[]
  quantity: number
  price?: number
}

export interface Order {
  id: string
  customer_name: string
  items: CartItem[]
  status: OrderStatus
  created_at: string
  updated_at: string
}

// Dashboard stats types
export interface OrderCounts {
  total: number
  placed: number
  in_progress: number
  completed: number
  canceled: number
}

export interface DrinkCount {
  name: string
  count: number
}

export interface ModifierOption {
  option: string
  count: number
  percentage: number
}

export interface TimeSeriesPoint {
  label: string
  orders: number
  revenue: number
}

export interface DashboardStats {
  today: OrderCounts
  allTime: OrderCounts
  popularDrinks: DrinkCount[]
  modifierBreakdown: Record<string, ModifierOption[]>
  addOnBreakdown: Record<string, ModifierOption[]>
  addOnAttachRate: Record<string, number>
  avgOrderValue: number | null
  avgFulfillmentTime: number | null
  timeSeries: TimeSeriesPoint[]
  targetDate: string
  isToday: boolean
}
