'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminButton from '@/components/rigburrito/AdminButton'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'
import ManageMenu from '@/components/rigburrito/ManageMenu'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import { formatDate } from '@/lib/rigburrito/utils'

interface ArticleRow {
  id: string
  title: string
  slug: string
  category: string
  status: string
  read_time_mins: number | null
  published_at: string | null
}

export default function JournalPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rigburrito/journal')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setArticles(data.articles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  async function updateStatus(id: string, action: string) {
    await fetch(`/api/rigburrito/journal/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [action]: true }),
    })
    fetchArticles()
  }

  async function deleteArticle(id: string) {
    await fetch(`/api/rigburrito/journal/${id}`, { method: 'DELETE' })
    fetchArticles()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="rigburrito-page-title" style={{ marginBottom: 0 }}>Operator Journal</h1>
        <Link href="/rigburrito/journal/new" className="rigburrito-btn rigburrito-btn-accent no-underline">New Article</Link>
      </div>

      {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchArticles} /> : (
        <div className="rigburrito-table-wrap">
          <table className="rigburrito-table">
            <thead>
              <tr>
                {['Title', 'Category', 'Status', 'Read Time', 'Published', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id}>
                  <td className="font-medium">{a.title}</td>
                  <td className="capitalize">{a.category.replace(/_/g, ' ')}</td>
                  <td><StatusBadge status={a.status} variant="article" /></td>
                  <td className="rigburrito-mono">{a.read_time_mins ?? '—'} min</td>
                  <td>{formatDate(a.published_at)}</td>
                  <td>
                    {deleteId === a.id ? (
                      <div className="flex items-center gap-2">
                        <HoldToConfirmButton
                          label="Confirm Delete"
                          onConfirm={() => { deleteArticle(a.id); setDeleteId(null) }}
                        />
                        <AdminButton variant="secondary" onClick={() => setDeleteId(null)} style={{ padding: '6px 12px' }}>Cancel</AdminButton>
                      </div>
                    ) : (
                      <ManageMenu
                        items={[
                          { label: 'Edit', onSelect: () => router.push(`/rigburrito/journal/${a.id}/edit`) },
                          a.status !== 'published'
                            ? { label: 'Publish', onSelect: () => updateStatus(a.id, 'publish') }
                            : { label: 'Unpublish', onSelect: () => updateStatus(a.id, 'unpublish') },
                          { label: 'Archive', onSelect: () => updateStatus(a.id, 'archive') },
                          { label: 'Delete', onSelect: () => setDeleteId(a.id), variant: 'danger' },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
