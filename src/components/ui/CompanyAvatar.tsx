'use client'

import { useState } from 'react'

interface CompanyAvatarProps {
  logoUrl: string | null
  companyName: string | null
  size?: number // px — defaults to 48
  className?: string
}

/**
 * Rounded-rectangle company logo with initials fallback.
 * Client component so it can handle image load errors gracefully.
 */
export default function CompanyAvatar({
  logoUrl,
  companyName,
  size = 48,
  className = '',
}: CompanyAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const showLogo = !!logoUrl && !imgError

  const initials = companyName
    ? companyName
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?'

  const fontSize = size <= 40 ? '13px' : size <= 60 ? '16px' : '22px'

  if (showLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl!}
        alt={companyName ?? 'Company logo'}
        className={`block shrink-0 ${className}`}
        style={{ maxHeight: size, width: 'auto', height: 'auto' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: '#1A1D20',
      }}
    >
      <span
        className="font-sans font-bold text-white select-none leading-none"
        style={{ fontSize }}
      >
        {initials}
      </span>
    </div>
  )
}
