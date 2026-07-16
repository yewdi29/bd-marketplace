'use client'

import type { ManagerPermissions } from '@/lib/organizations/managerPermissions'
import { MANAGER_PERMISSION_OPTIONS } from '@/lib/organizations/managerPermissions'

export default function ManagerPermissionsCheckboxes({
  value,
  onChange,
  collapsible = false,
  defaultOpen = false,
}: {
  value: ManagerPermissions
  onChange: (value: ManagerPermissions) => void
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const content = (
    <div className="space-y-3">
      {MANAGER_PERMISSION_OPTIONS.map(option => (
        <label key={option.key} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value[option.key]}
            onChange={e => onChange({ ...value, [option.key]: e.target.checked })}
            className="mt-0.5 shrink-0"
          />
          <span>
            <span className="block text-sm font-medium text-ink">{option.label}</span>
            <span className="block text-xs text-ink-3 mt-0.5">{option.description}</span>
          </span>
        </label>
      ))}
    </div>
  )

  if (!collapsible) return content

  return (
    <details className="rounded-[10px] border border-[#E8E9EA] bg-[#FAFAFA] px-4 py-3" open={defaultOpen}>
      <summary className="text-sm font-semibold text-ink cursor-pointer select-none">
        Additional permissions
      </summary>
      <div className="mt-3 pt-3 border-t border-[#E8E9EA]">
        {content}
      </div>
    </details>
  )
}
