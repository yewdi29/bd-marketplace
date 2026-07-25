'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import AdminButton from './AdminButton'

export interface ManageMenuItem {
  label: string
  href?: string
  onSelect?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

function menuItemStyle(variant: ManageMenuItem['variant']): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 13,
    color: variant === 'danger' ? '#DC2626' : '#0F1117',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    font: 'inherit',
  }
}

export default function ManageMenu({ items }: { items: ManageMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const menuId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target as Node
      const menu = document.getElementById(menuId)
      if (menu?.contains(target)) return
      if (target instanceof Element && target.closest('[data-manage-menu-trigger]')) return
      setOpen(false)
    }

    function reposition() {
      const trigger = document.querySelector(`[data-manage-menu-trigger="${menuId}"]`)
      if (!(trigger instanceof HTMLElement)) return
      const rect = trigger.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, left: rect.right })
    }

    reposition()
    window.addEventListener('pointerdown', closeOnPointerDown)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      window.removeEventListener('pointerdown', closeOnPointerDown)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, menuId])

  function openFromTrigger(trigger: HTMLElement) {
    const rect = trigger.getBoundingClientRect()
    setCoords({ top: rect.bottom + 4, left: rect.right })
    setOpen(current => !current)
  }

  const menu = open && mounted ? createPortal(
    <div
      id={menuId}
      role="menu"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-100%)',
        zIndex: 9999,
        minWidth: 148,
        background: '#FFFFFF',
        border: '1px solid #F0F1F3',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '4px 0',
      }}
    >
      {items.map(item => {
        const style = menuItemStyle(item.variant)
        const hoverHandlers = {
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.background = '#F8F9FA'
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.background = 'transparent'
          },
        }

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              style={style}
              onClick={() => setOpen(false)}
              {...hoverHandlers}
            >
              {item.label}
            </Link>
          )
        }

        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            style={style}
            onClick={() => {
              item.onSelect?.()
              setOpen(false)
            }}
            {...hoverHandlers}
          >
            {item.label}
          </button>
        )
      })}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <AdminButton
        variant="secondary"
        data-manage-menu-trigger={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={event => openFromTrigger(event.currentTarget)}
        style={{ padding: '6px 10px' }}
      >
        <Settings2 size={14} />
        Manage
      </AdminButton>
      {menu}
    </>
  )
}
