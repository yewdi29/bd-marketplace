'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import Pagination from '@/components/rigburrito/Pagination'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import { formatDate, formatUserLocation, getInitials } from '@/lib/rigburrito/utils'
import { formatActiveListingDisplayForAccount } from '@/lib/planLimits'
import type { AdminUserRow } from '@/lib/rigburrito/types'

function orgRoleLabel(u: AdminUserRow): string | null {
  if (!u.is_enterprise) return null
  if (u.is_primary_owner) return 'Primary owner'
  if (u.org_role === 'owner') return 'Owner'
  if (u.org_role === 'manager') return 'Manager'
  return null
}

export default function UsersPage() {
  const router = useRouter()
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
          <option value="enterprise">Enterprise</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="max">Max</option>
        </select>
      </div>

      {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchUsers} /> : (
        <div className="rigburrito-table-wrap rigburrito-table-wrap--scroll">
          <table className="rigburrito-table rigburrito-table--data">
            <thead>
              <tr>
                {['', 'Name', 'Email', 'Phone', 'Location', 'Company / Org', 'Plan', 'Listings', 'Joined', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => {
                const prev = users[index - 1]
                const showOrgHeader = Boolean(
                  u.organization_id
                  && u.organization_name
                  && u.organization_id !== prev?.organization_id,
                )
                const roleLabel = orgRoleLabel(u)

                return (
                  <Fragment key={u.id}>
                    {showOrgHeader && (
                      <tr className="rigburrito-table-row--group">
                        <td
                          colSpan={10}
                          style={{
                            background: '#F8F9FA',
                            color: '#004499',
                            fontWeight: 600,
                            fontSize: 11,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Enterprise · {u.organization_name}
                        </td>
                      </tr>
                    )}
                    <tr
                      className="rigburrito-table-row--clickable"
                      onClick={() => router.push(`/rigburrito/users/${u.id}`)}
                    >
                      <td>
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} alt="" width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white" style={{ background: '#6B7280' }}>
                            {getInitials(u.full_name ?? u.email)}
                          </div>
                        )}
                      </td>
                      <td className="font-medium">
                        <div>{u.full_name ?? '—'}</div>
                        {roleLabel && (
                          <div className="rigburrito-caption" style={{ color: '#6B7280', marginTop: 2 }}>
                            {roleLabel}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#6B7280' }}>{u.email}</td>
                      <td>{u.phone ?? ''}</td>
                      <td style={{ color: '#6B7280' }}>{formatUserLocation(u)}</td>
                      <td>
                        {u.organization_name ?? u.company_name ?? '—'}
                      </td>
                      <td><PlanBadge plan={u.plan} isEnterprise={Boolean(u.is_enterprise)} /></td>
                      <td>{formatActiveListingDisplayForAccount(u.plan, u.listing_count, Boolean(u.is_enterprise))}</td>
                      <td style={{ color: '#6B7280' }}>{formatDate(u.created_at)}</td>
                      <td>{u.suspended ? <span className="text-xs text-red-500">Suspended</span> : ''}</td>
                    </tr>
                  </Fragment>
                )
              })}
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
