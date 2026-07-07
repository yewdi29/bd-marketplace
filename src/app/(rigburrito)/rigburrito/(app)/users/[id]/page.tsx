'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import UserAdminActions from '@/components/rigburrito/UserAdminActions'
import AdminCard from '@/components/rigburrito/AdminCard'
import EmptyState from '@/components/rigburrito/EmptyState'
import ErrorState from '@/components/rigburrito/ErrorState'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import { formatActiveListingDisplay } from '@/lib/planLimits'
import { formatCurrency, formatDate, formatUserLocation, getInitials } from '@/lib/rigburrito/utils'
import type { AdminUserRow } from '@/lib/rigburrito/types'
import type { ListingStatus } from '@/lib/types/database'

interface UserListing {
  id: string
  title: string
  slug: string | null
  status: ListingStatus
  price: number
  created_at: string
  updated_at: string
  location_city: string | null
  location_state: string | null
  primary_image_url: string | null
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<AdminUserRow | null>(null)
  const [listings, setListings] = useState<UserListing[]>([])
  const [stripeSubscription, setStripeSubscription] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rigburrito/users/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data.user)
      setListings(data.listings ?? [])
      setStripeSubscription(data.stripe_subscription ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchUser() }, [fetchUser])

  if (loading) {
    return (
      <div>
        <Link href="/rigburrito/users" className="rigburrito-text-link rigburrito-caption mb-6 inline-flex items-center gap-2 hover:text-[#0F1117]">
          <ArrowLeft size={16} /> Back to Users
        </Link>
        <TableSkeleton rows={6} cols={3} />
      </div>
    )
  }

  if (error || !user) return <ErrorState message={error || 'User not found'} onRetry={fetchUser} />

  return (
    <div>
      <Link href="/rigburrito/users" className="rigburrito-text-link rigburrito-caption mb-6 inline-flex items-center gap-2 hover:text-[#0F1117]">
        <ArrowLeft size={16} /> Back to Users
      </Link>

      <div className="mb-6 flex items-start gap-4">
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt="" width={64} height={64} className="rounded-full" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-medium text-white" style={{ background: '#6B7280' }}>
            {getInitials(user.full_name ?? user.email)}
          </div>
        )}
        <div>
          <h1 className="rigburrito-page-title" style={{ marginBottom: 4 }}>{user.full_name ?? '—'}</h1>
          <p className="rigburrito-caption" style={{ color: '#6B7280' }}>{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <PlanBadge plan={user.plan} />
            {user.suspended && <span className="text-xs font-medium text-red-500">Suspended</span>}
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminCard>
          <p className="rigburrito-card-label">Phone</p>
          <p className="rigburrito-mono rigburrito-body mt-2">{user.phone ?? ''}</p>
        </AdminCard>
        <AdminCard>
          <p className="rigburrito-card-label">Location</p>
          <p className="rigburrito-body mt-2">{formatUserLocation(user)}</p>
        </AdminCard>
        <AdminCard>
          <p className="rigburrito-card-label">Company</p>
          <p className="rigburrito-body mt-2 font-medium">{user.company_name ?? '—'}</p>
        </AdminCard>
        <AdminCard>
          <p className="rigburrito-card-label">Joined</p>
          <p className="rigburrito-mono rigburrito-body mt-2">{formatDate(user.created_at)}</p>
        </AdminCard>
        <AdminCard>
          <p className="rigburrito-card-label">Active Listings</p>
          <p className="rigburrito-mono rigburrito-body mt-2">{formatActiveListingDisplay(user.plan, user.listing_count)}</p>
        </AdminCard>
        <AdminCard>
          <p className="rigburrito-card-label">Saved Listings</p>
          <p className="rigburrito-mono rigburrito-body mt-2">{user.saved_count}</p>
        </AdminCard>
      </div>

      {stripeSubscription && (
        <AdminCard className="mb-8">
          <p className="rigburrito-section-title">Stripe Subscription</p>
          <pre className="rigburrito-mono overflow-auto text-xs">{JSON.stringify(stripeSubscription, null, 2)}</pre>
        </AdminCard>
      )}

      <AdminCard className="mb-8">
        <h2 className="rigburrito-section-title">Listing Activity</h2>
        {listings.length === 0 ? (
          <EmptyState icon={Package} title="No listings" description="This user hasn't created any listings yet." />
        ) : (
          <div className="rigburrito-table-wrap">
            <table className="rigburrito-table">
              <thead>
                <tr>
                  {['', 'Title', 'Status', 'Price', 'Location', 'Created', 'Updated'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id}>
                    <td>
                      {l.primary_image_url ? (
                        <Image src={l.primary_image_url} alt="" width={48} height={36} className="rounded object-cover" style={{ width: 48, height: 36 }} />
                      ) : (
                        <div className="h-9 w-12 rounded bg-[#F0F1F3]" />
                      )}
                    </td>
                    <td className="max-w-[240px] truncate font-medium">{l.title}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="rigburrito-mono">{formatCurrency(l.price)}</td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>
                      {[l.location_city, l.location_state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{formatDate(l.created_at)}</td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{formatDate(l.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="rigburrito-section-title">Admin Actions</h2>
        {user && (
          <UserAdminActions
            user={user}
            onUpdated={fetchUser}
            onDeleted={() => {
              router.push('/rigburrito/users')
              router.refresh()
            }}
          />
        )}
      </AdminCard>
    </div>
  )
}
