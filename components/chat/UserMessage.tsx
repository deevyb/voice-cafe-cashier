'use client'

export default function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-cafe-coffee text-cafe-cream px-4 py-3">{text}</div>
    </div>
  )
}
