import { ReactNode } from 'react'

export default function AdminCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rigburrito-card ${className}`.trim()}>
      {children}
    </div>
  )
}
