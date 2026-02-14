import { unstable_noStore as noStore } from 'next/cache'
import { supabase, Order } from '@/lib/supabase'
import KitchenClient from '@/components/KitchenClient'

// Force fresh data on each request
export const dynamic = 'force-dynamic'

async function getOrders() {
  // Opt out of Next.js fetch caching so Supabase queries always hit the DB
  noStore()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['placed', 'in_progress', 'completed'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching orders:', error)
    throw new Error('Failed to load orders')
  }

  return (orders || []) as Order[]
}

export default async function KitchenPage() {
  const orders = await getOrders()

  return <KitchenClient initialOrders={orders} />
}
