'use client'

export default function AIMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-white border border-delo-navy/10 px-4 py-3 text-delo-navy">
        {text}
      </div>
    </div>
  )
}
