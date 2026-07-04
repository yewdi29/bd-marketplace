'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import Pagination from '@/components/rigburrito/Pagination'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import { formatDate, formatUserLocation, getInitials } from '@/lib/rigburrito/utils'
import { formatActiveListingDisplay } from '@/lib/planLimits'
import type { AdminUserRow } from '@/lib/rigburrito/types'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    try {
      const res = await fetch(`/api/rigburrito/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(data.users)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, plan])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <div>
      <h1 className="rigburrito-page-title">User Management</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="rigburrito-input"
          style={{ minWidth: 240 }}
        />
        <select
          value={plan}
          onChange={e => { setPlan(e.target.value); setPage(1) }}
          className="rigburrito-select"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="max">Max</option>
        </select>
      </div>

      {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchUsers} /> : (
        <div className="rigburrito-table-wrap">
          <table className="rigburrito-table">
            <thead>
              <tr>
                {['', 'Name', 'Email', 'Phone', 'Location', 'Company', 'Plan', 'Listings', 'Joined', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/rigburrito/users/${u.id}`} className="no-underline">
                      {u.avatar_url ? (
                        <Image src={u.avatar_url} alt="" width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: '#6B7280' }}>
                          {getInitials(u.full_name ?? u.email)}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="font-medium">
                    <Link href={`/rigburrito/users/${u.id}`} className="rigburrito-text-link hover:text-[#FF6B35]" style={{ color: '#0F1117' }}>
                      {u.full_name ?? '—'}
                    </Link>
                  </td>
                  <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{u.email}</td>
                  <td className="rigburrito-mono">{u.phone ?? ''}</td>
                  <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{formatUserLocation(u)}</td>
                  <td>{u.company_name ?? '—'}</td>
                  <td><PlanBadge plan={u.plan} /></td>
                  <td className="rigburrito-mono">
                    {formatActiveListingDisplay(u.plan, u.listing_count)}
                  </td>
                  <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{formatDate(u.created_at)}</td>
                  <td>
                    {u.suspended && <span className="text-xs text-red-500">Suspended</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
