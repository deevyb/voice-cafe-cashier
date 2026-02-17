'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' },
})

const fadeOnly = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
})

export default function Home() {
  return (
    <main className="grain-overlay relative min-h-screen flex flex-col items-center justify-center px-8 overflow-hidden bg-[radial-gradient(ellipse_at_center,_#FAF9F6_0%,_#F5F0EA_60%,_#EDE6DC_100%)]">
      {/* Soft top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cafe-latte/60 to-transparent" />

      {/* Coffee cup + steam */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Steam wisps */}
        <div className="absolute -top-6 left-0 right-0 h-10 text-cafe-coffee/30">
          <span className="steam-line" />
          <span className="steam-line" />
          <span className="steam-line" />
        </div>

        <svg
          width="68"
          height="68"
          viewBox="0 0 56 56"
          fill="none"
          className="text-cafe-coffee/80"
        >
          {/* Cup body */}
          <rect x="12" y="22" width="32" height="24" rx="4" fill="currentColor" />
          {/* Cup handle */}
          <path
            d="M44 28h4a4 4 0 010 8h-4"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
          {/* Saucer */}
          <ellipse cx="28" cy="50" rx="20" ry="3" fill="currentColor" opacity="0.2" />
        </svg>
      </motion.div>

      {/* Brand title — oversized serif with colored "ooo" */}
      <motion.h1
        className="font-serif text-cafe-charcoal tracking-[-0.03em] mb-4 text-center"
        style={{ fontSize: 'clamp(3.75rem, 10vw, 8.5rem)', lineHeight: 0.95 }}
        {...fade(0.15)}
      >
        Coffee R
        <span className="text-cafe-latte">ooo</span>
        m
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-xl text-cafe-charcoal/45 font-sans tracking-wide mb-20"
        {...fade(0.3)}
      >
        Craft coffee, made to order
      </motion.p>

      {/* Primary CTA */}
      <motion.div {...fade(0.5)}>
        <Link
          href="/order"
          className="group mb-20 flex flex-col items-center gap-3"
        >
          <span className="btn-shimmer inline-flex items-center gap-3 rounded-2xl bg-cafe-coffee px-14 py-6 text-cafe-cream font-sans font-semibold text-xl shadow-lg shadow-cafe-coffee/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-cafe-coffee/30 group-hover:-translate-y-0.5 active:translate-y-0 active:shadow-md">
            Start Your Order
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638l-3.96-3.96a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06l3.96-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </Link>
      </motion.div>

      {/* Decorative divider */}
      <motion.div
        className="flex items-center gap-2 mb-8"
        {...fadeOnly(0.65)}
      >
        <span className="w-8 h-px bg-cafe-charcoal/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-cafe-latte/40" />
        <span className="w-8 h-px bg-cafe-charcoal/10" />
      </motion.div>

      {/* Secondary links */}
      <motion.div
        className="flex items-center gap-8"
        {...fadeOnly(0.7)}
      >
        <Link
          href="/kitchen"
          className="text-cafe-charcoal/40 font-sans font-medium text-sm hover:text-cafe-charcoal/70 transition-colors"
        >
          Kitchen Display
        </Link>
        <span className="w-1 h-1 rounded-full bg-cafe-charcoal/20" />
        <Link
          href="/admin"
          className="text-cafe-charcoal/40 font-sans font-medium text-sm hover:text-cafe-charcoal/70 transition-colors"
        >
          Admin
        </Link>
      </motion.div>
    </main>
  )
}
