'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface SlideOverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export default function SlideOver({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = '480px',
}: SlideOverProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        />
        <Dialog.Content
          className="rigburrito-slideover"
          style={{
            width,
            animation: open ? 'slideInRight 0.2s ease-out' : undefined,
          }}
        >
          <div className="rigburrito-slideover-header">
            <Dialog.Title className="rigburrito-slideover-title">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rigburrito-btn-icon" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="rigburrito-slideover-body">{children}</div>
          {footer && <div className="rigburrito-slideover-footer">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
