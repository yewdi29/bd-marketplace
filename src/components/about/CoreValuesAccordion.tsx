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
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div>
      {VALUES.map((value, index) => {
        const isOpen = openIndex === index
        return (
          <div key={value.title} style={{ borderBottom: '1px solid #000' }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: '16px 0',
                cursor: 'pointer',
                color: '#000',
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              <span>{value.title}</span>
              <span aria-hidden="true" style={{ fontWeight: 400 }}>
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <p
                style={{
                  margin: '0 0 16px',
                  color: '#000',
                  fontSize: '16px',
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
