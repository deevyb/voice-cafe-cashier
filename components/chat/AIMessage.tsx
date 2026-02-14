'use client'

import ReactMarkdown from 'react-markdown'

export default function AIMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-white border border-cafe-charcoal/10 px-4 py-3 text-cafe-charcoal">
        <div className="prose prose-sm max-w-none text-cafe-charcoal">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
