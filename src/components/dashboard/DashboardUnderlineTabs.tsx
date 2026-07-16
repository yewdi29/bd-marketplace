export interface DashboardTab {
  value: string
  label: string
}

export function DashboardUnderlineTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
}: {
  tabs: DashboardTab[]
  activeTab: string
  onChange: (value: string) => void
  ariaLabel?: string
}) {
  return (
    <div
      className="flex items-center gap-1 mb-8 border-b border-[#E8E9EA] overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className="px-4 py-2.5 text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0"
            style={{
              color: isActive ? '#1A1D20' : '#9A9DA2',
              borderBottom: isActive ? '2px solid #1A1D20' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
