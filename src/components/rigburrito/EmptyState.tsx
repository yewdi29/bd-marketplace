import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import AdminButton from './AdminButton'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  children?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="rigburrito-empty">
      <Icon size={40} color="#D1D5DB" strokeWidth={1.5} />
      <p className="rigburrito-empty-title">{title}</p>
      {description && <p className="rigburrito-empty-desc">{description}</p>}
      {action && (
        <AdminButton variant="primary" onClick={action.onClick}>
          {action.label}
        </AdminButton>
      )}
      {children}
    </div>
  )
}
