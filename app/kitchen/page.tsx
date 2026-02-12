import { supabase, Order } from '@/lib/supabase'
import KitchenClient from '@/components/KitchenClient'

// Force fresh data on each request
export const dynamic = 'force-dynamic'

async function getOrders() {
  // Fetch active kitchen orders (not canceled)
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
