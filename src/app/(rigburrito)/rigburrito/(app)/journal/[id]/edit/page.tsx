'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ArticleEditorForm from '@/components/rigburrito/ArticleEditorForm'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import type { ArticleCategory } from '@/lib/types/database'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [initial, setInitial] = useState<Parameters<typeof ArticleEditorForm>[0]['initial']>()

  useEffect(() => {
    if (!id) {
      setError('Article ID is missing')
      setLoading(false)
      return
    }

    async function load() {
      try {
        const res = await fetch(`/api/rigburrito/journal/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const a = data.article
        setInitial({
          title: a.title,
          slug: a.slug,
          body: a.body ?? '',
          category: a.category as ArticleCategory,
          tags: Array.isArray(a.tags) ? a.tags : [],
          read_time_mins: a.read_time_mins,
          meta_description: a.meta_description,
          featured_image: a.featured_image,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <TableSkeleton rows={6} cols={2} />
  if (error) return <ErrorState message={error} />
  if (!initial) return null

  return (
    <div>
      <h1 className="rigburrito-page-title">Edit Article</h1>
      <ArticleEditorForm articleId={id} initial={initial} showCloseButton />
    </div>
  )
}
