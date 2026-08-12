'use client'

import { useState } from 'react'

const VALUES = [
  {
    title: 'Human Care',
    description:
      'Even with AI running underneath everything we build, we believe the fastest way to get things done in this industry is still through real human connection. Every interaction on our platform is human-first, AI-supported — never the other way around.',
  },
  {
    title: 'Trust & Verification',
    description:
      "Every listing is reviewed by our AI verification system before it goes live, and every high-value deal gets a human eye on it too. Trust isn't a feature we bolted on — it's the foundation everything else is built on.",
  },
  {
    title: 'Industry Expertise',
    description:
      "We didn't build a generic classifieds site and hope it fit heavy equipment. We built this specifically for oil and gas, construction, mining, agriculture, and forestry — industries we understand from the inside.",
  },
  {
    title: 'Security',
    description:
      "Your information is yours. We hold ourselves to a high standard of protecting our members' data, transactions, and personal details — because trust in this industry starts with knowing your information is safe with us.",
  },
] as const

export default function CoreValuesAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="text-left w-full">
      {VALUES.map((value, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={value.title}
            className="border-b border-[#E8E9EA]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 text-left bg-transparent border-0 cursor-pointer py-5 px-0"
            >
              <h1
                className="font-sans text-ink m-0"
                style={{
                  fontSize: 'clamp(36px, 6vw, 44px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                }}
              >
                {value.title}
              </h1>
              <span
                aria-hidden
                className="font-sans text-ink-3 shrink-0 text-2xl leading-none"
                style={{ fontWeight: 400 }}
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <p
                className="font-sans text-ink-2 m-0 pb-5"
                style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: 1.7,
                }}
              >
                {value.description}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
