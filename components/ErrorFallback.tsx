'use client'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-delo-cream flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">☕</div>

        <h1 className="font-yatra text-3xl text-delo-maroon">Something went wrong</h1>

        <p className="text-delo-navy/70 font-bricolage">
          We hit a small bump. Don&apos;t worry — your order is safe. Let&apos;s try that again.
        </p>

        <button
          onClick={resetErrorBoundary}
          className="bg-delo-maroon text-delo-cream px-8 py-3 rounded-lg font-bricolage font-semibold
                     hover:bg-delo-maroon/90 active:scale-[0.98] transition-all"
        >
          Try Again
        </button>

        <p className="text-sm text-delo-navy/50 font-mono">
          If this keeps happening, please let a barista know.
        </p>
      </div>
    </div>
  )
}
