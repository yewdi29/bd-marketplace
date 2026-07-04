'use client'

import AdminButton from './AdminButton'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="rigburrito-caption">
        Page <span className="rigburrito-mono">{page}</span> of{' '}
        <span className="rigburrito-mono">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <AdminButton
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </AdminButton>
        <AdminButton
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </AdminButton>
      </div>
    </div>
  )
}
