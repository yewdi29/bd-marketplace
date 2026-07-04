'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Settings2 } from 'lucide-react'
import AdminButton from './AdminButton'

export interface ManageMenuItem {
  label: string
  onSelect: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export default function ManageMenu({ items }: { items: ManageMenuItem[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <AdminButton
          variant="secondary"
          onClick={e => e.stopPropagation()}
          style={{ padding: '6px 10px' }}
        >
          <Settings2 size={14} />
          Manage
        </AdminButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[140px] rounded-lg bg-white py-1 outline-none"
          style={{ border: '1px solid #F0F1F3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          sideOffset={4}
          align="end"
        >
          {items.map(item => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className="cursor-pointer px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-[#F8F9FA]"
              style={{ color: item.variant === 'danger' ? '#DC2626' : '#0F1117', fontSize: 13 }}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
