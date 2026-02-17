'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardStats } from '@/lib/supabase'
import StatsCards from './StatsCards'
import SummaryMetrics from './SummaryMetrics'
import OrdersChart from './OrdersChart'
import PopularItems from './PopularItems'
import ModifierPreferences from './ModifierPreferences'
import DatePicker from './DatePicker'
import NavMenu from '../NavMenu'

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  })

  const fetchStats = useCallback(async (date: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const response = await fetch(`/api/admin/stats?timezone=${encodeURIComponent(tz)}&date=${date}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Coffee Rooom Dashboard'
    fetchStats(selectedDate)
  }, [selectedDate, fetchStats])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  return (
    <div className="min-h-screen bg-cafe-cream">
      {/* Header — matches kitchen page */}
      <header className="pt-8 pb-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6">
          <h1 className="font-serif text-4xl text-cafe-coffee">Coffee Rooom Dashboard</h1>
          <NavMenu />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Date picker — right-aligned above metrics */}
        <div className="flex justify-end mb-4">
          <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="bg-white rounded-xl p-8 border border-cafe-charcoal/10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchStats(selectedDate)}
              className="px-6 py-2 rounded-lg font-sans font-semibold text-sm text-cafe-cream bg-cafe-coffee hover:bg-cafe-coffee/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <StatsCards
              targetDate={stats.targetDate}
              isToday={stats.isToday}
              today={stats.today}
              allTime={stats.allTime}
            />
            <SummaryMetrics
              avgOrderValue={stats.avgOrderValue}
              avgFulfillmentTime={stats.avgFulfillmentTime}
            />
            <OrdersChart data={stats.timeSeries} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PopularItems items={stats.popularDrinks} />
              <ModifierPreferences breakdown={stats.modifierBreakdown} />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-32" />
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-32" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-24" />
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-24" />
      </div>
      <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-[250px]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-48" />
        <div className="bg-white rounded-xl p-6 border border-cafe-charcoal/10 h-48" />
      </div>
    </div>
  )
}
