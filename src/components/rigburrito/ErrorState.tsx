'use client'

import AdminButton from './AdminButton'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rigburrito-error">
      <p>{message}</p>
      {onRetry && (
        <AdminButton variant="accent" onClick={onRetry} className="mt-4">
          Retry
        </AdminButton>
      )}
    </div>
  )
}
