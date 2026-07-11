'use client'

import type { ReactNode } from 'react'
import HoldToConfirmButton from './HoldToConfirmButton'

export interface ExpandableTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export interface ExpandableTableDetailField<T> {
  label: string
  render: (row: T) => ReactNode
}

export interface ExpandableTableDetailSection<T> {
  render: (row: T) => ReactNode
}

export interface ExpandableTableAction<T> {
  label: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' | 'orange'
  holdToConfirm?: boolean
  holdMs?: number
  onClick: (row: T) => void | Promise<void>
}

interface ExpandableDataTableProps<T> {
  rows: T[]
  columns: ExpandableTableColumn<T>[]
  detailFields: ExpandableTableDetailField<T>[]
  detailSections?: ExpandableTableDetailSection<T>[]
  actions: ExpandableTableAction<T>[]
  getRowId: (row: T) => string
  expandedId: string | null
  onToggle: (id: string) => void
  emptyState?: ReactNode
}

export default function ExpandableDataTable<T>({
  rows,
  columns,
  detailFields,
  detailSections = [],
  actions,
  getRowId,
  expandedId,
  onToggle,
  emptyState,
}: ExpandableDataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="rigburrito-table-wrap rigburrito-table-wrap--scroll-y">
      <div className="rigburrito-table-scroll-inner">
        <table className="rigburrito-table rigburrito-table--data rigburrito-expandable-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.className}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const id = getRowId(row)
              const expanded = expandedId === id
              return (
                <ExpandableRow
                  key={id}
                  row={row}
                  columns={columns}
                  detailFields={detailFields}
                  detailSections={detailSections}
                  actions={actions}
                  expanded={expanded}
                  onToggle={() => onToggle(id)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpandableRow<T>({
  row,
  columns,
  detailFields,
  detailSections,
  actions,
  expanded,
  onToggle,
}: {
  row: T
  columns: ExpandableTableColumn<T>[]
  detailFields: ExpandableTableDetailField<T>[]
  detailSections: ExpandableTableDetailSection<T>[]
  actions: ExpandableTableAction<T>[]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className={`rigburrito-table-row--clickable ${expanded ? 'rigburrito-expandable-row--open' : ''}`}
        onClick={onToggle}
      >
        {columns.map(col => (
          <td key={col.key} className={col.className}>{col.render(row)}</td>
        ))}
      </tr>
      {expanded && (
        <tr className="rigburrito-expandable-detail-row">
          <td colSpan={columns.length}>
            <div className="rigburrito-expandable-detail">
              <div className="rigburrito-expandable-detail-fields">
                {detailFields.map(field => (
                  <div key={field.label} className="rigburrito-expandable-detail-field">
                    <span className="rigburrito-card-label">{field.label}</span>
                    <div className="rigburrito-body">{field.render(row)}</div>
                  </div>
                ))}
              </div>
              {detailSections.map((section, index) => {
                const content = section.render(row)
                if (!content) return null
                return (
                  <div key={index} className="rigburrito-expandable-detail-section">
                    {content}
                  </div>
                )
              })}
              {actions.length > 0 && (
              <div className="rigburrito-expandable-detail-actions">
                {actions.map(action => {
                  if (action.holdToConfirm) {
                    return (
                      <div key={action.label} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                        <HoldToConfirmButton
                          label={action.label}
                          variant={action.variant === 'warning' ? 'warning' : 'danger'}
                          holdMs={action.holdMs}
                          holdLabel={`Hold to ${action.label.toLowerCase()}...`}
                          onConfirm={() => void action.onClick(row)}
                        />
                      </div>
                    )
                  }

                  const variantClass =
                    action.variant === 'orange'
                      ? 'rigburrito-btn-accent'
                      : `rigburrito-btn-${action.variant ?? 'secondary'}`
                  return (
                  <button
                    key={action.label}
                    type="button"
                    className={`rigburrito-btn ${variantClass}`}
                    onClick={e => {
                      e.stopPropagation()
                      void action.onClick(row)
                    }}
                  >
                    {action.label}
                  </button>
                  )
                })}
              </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
