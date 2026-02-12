'use client'

import { useState, useEffect } from 'react'
import AdminClient from '@/components/AdminClient'
import { supabase, MenuItem, Modifier } from '@/lib/supabase'

export default function AdminPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set page title and fetch data on mount
  useEffect(() => {
    document.title = 'Delo Coffee Admin Panel'
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all menu items (including inactive, for admin)
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order')

      if (menuError) throw menuError

      // Fetch all modifiers (including inactive)
      const { data: modifierData, error: modifierError } = await supabase
        .from('modifiers')
        .select('*')
        .order('display_order')

      if (modifierError) throw modifierError

      setMenuItems(menuData || [])
      setModifiers(modifierData || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError('Failed to load data. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-delo-cream">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-delo-maroon border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-description">Loading admin data...</p>
        </div>
      </div>
    )
  }

  // Show error if data fetch failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-delo-cream p-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary px-8">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show admin panel
  return <AdminClient initialMenuItems={menuItems} initialModifiers={modifiers} />
}
