import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-cafe-cream px-8">
      {/* Subtle decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cafe-latte via-cafe-coffee to-cafe-latte" />

      {/* Coffee cup icon */}
      <div className="mb-6">
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          className="text-cafe-coffee/80"
        >
          {/* Steam lines */}
          <path
            d="M20 16c0-4 2-6 0-10M28 14c0-4 2-6 0-10M36 16c0-4 2-6 0-10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
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
      </div>

      {/* Brand name */}
      <h1 className="font-serif text-7xl text-cafe-charcoal tracking-tight mb-3">
        Coffee Rooom
      </h1>

      {/* Tagline */}
      <p className="text-lg text-cafe-charcoal/50 font-sans mb-16">
        Craft coffee, made to order
      </p>

      {/* Primary CTA */}
      <Link
        href="/order"
        className="group mb-16 flex flex-col items-center gap-3"
      >
        <span className="inline-flex items-center gap-3 rounded-2xl bg-cafe-coffee px-12 py-5 text-cafe-cream font-sans font-semibold text-xl shadow-lg shadow-cafe-coffee/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-cafe-coffee/30 group-hover:-translate-y-0.5 active:translate-y-0 active:shadow-md">
          Start Your Order
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="transition-transform group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-3.96-3.96a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06l3.96-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </span>
      </Link>

      {/* Secondary links */}
      <div className="flex items-center gap-8">
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
      </div>
    </main>
  )
}
