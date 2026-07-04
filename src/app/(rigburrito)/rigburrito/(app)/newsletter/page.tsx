'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminButton from '@/components/rigburrito/AdminButton'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import { downloadCsv, formatDate } from '@/lib/rigburrito/utils'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  status: string
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    try {
      const res = await fetch(`/api/rigburrito/newsletter${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubscribers(data.subscribers)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  function exportCsv() {
    downloadCsv('newsletter-subscribers.csv', [
      ['Email', 'Subscribed At'],
      ...subscribers.map(s => [s.email, s.subscribed_at]),
    ])
  }

  return (
    <div>
      <h1 className="rigburrito-page-title">Newsletter Subscribers</h1>
      <p className="rigburrito-mono rigburrito-body mb-6" style={{ color: '#6B7280' }}>{total} total subscribers</p>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rigburrito-input"
          style={{ minWidth: 280 }}
        />
        <AdminButton variant="secondary" onClick={exportCsv}>Export CSV</AdminButton>
      </div>

      {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchData} /> : (
        <div className="rigburrito-table-wrap">
          <table className="rigburrito-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Signup Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(s => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{formatDate(s.subscribed_at)}</td>
                  <td className="capitalize">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
