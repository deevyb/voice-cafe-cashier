'use client'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-cafe-cream flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">☕</div>

        <h1 className="font-serif text-3xl text-cafe-coffee">Something went wrong</h1>

        <p className="text-cafe-charcoal/70 font-sans">
          We hit a small bump. Don&apos;t worry — your order is safe. Let&apos;s try that again.
        </p>

        <button
          onClick={resetErrorBoundary}
          className="bg-cafe-coffee text-cafe-cream px-8 py-3 rounded-lg font-sans font-semibold
                     hover:bg-cafe-coffee/90 active:scale-[0.98] transition-all"
        >
          Try Again
        </button>

        <p className="text-sm text-cafe-charcoal/50 font-mono">
          If this keeps happening, please let a barista know.
        </p>
      </div>
    </div>
  )
}
