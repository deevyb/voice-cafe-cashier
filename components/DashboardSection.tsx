'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order } from '@/lib/supabase'

/**
 * DashboardSection - Export orders as CSV
 *
 * CSV format optimized for Google Sheets/Excel pivot tables:
 * - ISO date format (YYYY-MM-DD) for proper date recognition
 * - Separate Date and Time columns for flexible grouping
 *
 * Future: Will include orders table and analytics
 */
export default function DashboardSection() {
  // Use refs to read values directly from DOM at download time
  // This avoids state sync issues with controlled date inputs
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format date for spreadsheet (ISO format recognized by Google Sheets/Excel)
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  }

  // Format time for spreadsheet (24-hour format for sorting)
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) // HH:MM
  }

  const generateCSV = (orders: Order[]): string => {
    // Separate Date and Time columns for better pivot table grouping
    const headers = ['Customer Name', 'Drink', 'Milk', 'Temperature', 'Status', 'Date', 'Time']

    const rows = orders.map((order) => [
      // Quote text fields to handle commas/special chars
      `"${order.customer_name.replace(/"/g, '""')}"`,
      `"${order.item.replace(/"/g, '""')}"`,
      order.modifiers.milk || '',
      order.modifiers.temperature || '',
      order.status,
      formatDate(order.created_at), // YYYY-MM-DD (recognized as date by spreadsheets)
      formatTime(order.created_at), // HH:MM (sortable)
    ])

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  }

  // Build filename based on current date range state
  const buildFilename = (start: string, end: string): string => {
    if (start && end) {
      return `orders-${start}-to-${end}`
    } else if (start) {
      return `orders-from-${start}`
    } else if (end) {
      return `orders-until-${end}`
    } else {
      return `orders-all-${new Date().toISOString().split('T')[0]}`
    }
  }

  const handleDownload = async () => {
    setError(null)
    setIsLoading(true)

    // Read values directly from DOM inputs (more reliable than state)
    const currentStartDate = startDateRef.current?.value || ''
    const currentEndDate = endDateRef.current?.value || ''

    try {
      // Build query params
      const params = new URLSearchParams()
      if (currentStartDate) params.set('startDate', currentStartDate)
      if (currentEndDate) params.set('endDate', currentEndDate)

      const url = `/api/admin/orders${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const orders: Order[] = await response.json()

      if (orders.length === 0) {
        setError('No orders found for the selected date range.')
        setIsLoading(false)
        return
      }

      // Generate CSV
      const csv = generateCSV(orders)

      // Build filename using captured values
      const filename = buildFilename(currentStartDate, currentEndDate)

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${filename}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      setError('Failed to download orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-delo-navy/10">
      <h2 className="font-bricolage font-semibold text-xl text-delo-navy mb-2">Export Orders</h2>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro text */}
      <p className="text-description text-sm mb-6">
        Download order data as CSV for your records. Leave dates blank to export all orders.
      </p>

      {/* Date range inputs */}
      <div className="mb-6">
        <label className="block text-sm font-manrope font-semibold text-delo-navy/70 mb-2">
          Date Range (optional)
        </label>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              ref={startDateRef}
              type="date"
              className="w-full px-4 py-3 border border-delo-navy/20 rounded-lg font-manrope text-base focus:outline-none focus:ring-2 focus:ring-delo-maroon/30 focus:border-delo-maroon date-input"
              aria-label="Start date"
            />
          </div>
          <span className="text-delo-navy/40 font-manrope">to</span>
          <div className="flex-1">
            <input
              ref={endDateRef}
              type="date"
              className="w-full px-4 py-3 border border-delo-navy/20 rounded-lg font-manrope text-base focus:outline-none focus:ring-2 focus:ring-delo-maroon/30 focus:border-delo-maroon date-input"
              aria-label="End date"
            />
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="px-6 py-3 min-h-[44px] font-manrope font-semibold text-delo-cream bg-delo-maroon hover:bg-delo-maroon/90 disabled:bg-delo-maroon/50 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        {isLoading ? 'Downloading...' : 'Download CSV'}
      </button>
    </div>
  )
}
