'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function RigburritoTooltipProvider({ children }: { children: ReactNode }) {
  return <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>
}

interface IconActionButtonProps {
  label: string
  icon: LucideIcon
  color: string
  onClick?: () => void
  href?: string
  disabled?: boolean
}

export default function IconActionButton({
  label,
  icon: Icon,
  color,
  onClick,
  href,
  disabled,
}: IconActionButtonProps) {
  const hoverBg = `${color}14`

  const buttonStyle = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  } as const

  const trigger = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rigburrito-icon-action"
      style={buttonStyle}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      onClick={e => e.stopPropagation()}
    >
      <Icon size={14} strokeWidth={2} />
    </a>
  ) : (
    <button
      type="button"
      aria-label={label}
      className="rigburrito-icon-action"
      style={buttonStyle}
      onClick={e => {
        e.stopPropagation()
        onClick?.()
      }}
      disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  )

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{trigger}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="rigburrito-tooltip" sideOffset={4}>
          {label}
          <Tooltip.Arrow className="rigburrito-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
