'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminButton from '@/components/rigburrito/AdminButton'
import ArticleEditor from '@/components/rigburrito/ArticleEditor'
import { slugifyTitle } from '@/lib/rigburrito/strings'
import { ARTICLE_CATEGORIES } from '@/lib/rigburrito/types'
import type { ArticleCategory } from '@/lib/types/database'

interface ArticleEditorFormProps {
  articleId?: string
  initial?: {
    title: string
    slug: string
    body: string
    category: ArticleCategory
    tags: string[]
    read_time_mins: number | null
    meta_description: string | null
    featured_image: string | null
  }
}

export default function ArticleEditorForm({ articleId, initial }: ArticleEditorFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [category, setCategory] = useState<ArticleCategory>(initial?.category ?? 'industry')
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [readTime, setReadTime] = useState(String(initial?.read_time_mins ?? ''))
  const [metaDescription, setMetaDescription] = useState(initial?.meta_description ?? '')
  const [featuredImage, setFeaturedImage] = useState(initial?.featured_image ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!articleId && title && !initial?.slug) {
      setSlug(slugifyTitle(title))
    }
  }, [title, articleId, initial?.slug])

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/rigburrito/journal/upload', { method: 'POST', body: fd })
    const data = await res.json()
    return data.url ?? null
  }

  async function save(publish = false) {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugifyTitle(title),
      body,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time_mins: readTime ? parseInt(readTime, 10) : null,
      meta_description: metaDescription || null,
      featured_image: featuredImage || null,
      status: publish ? 'published' : 'draft',
      publish,
    }

    const url = articleId ? `/api/rigburrito/journal/${articleId}` : '/api/rigburrito/journal'
    const method = articleId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articleId && publish ? { ...payload, publish: true } : payload),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    router.push('/rigburrito/journal')
    router.refresh()
  }

  async function handleFeaturedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setFeaturedImage(url)
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      <div className="w-[60%]">
        <ArticleEditor content={body} onChange={setBody} onImageUpload={uploadImage} />
      </div>
      <div className="rigburrito-card flex w-[40%] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="rigburrito-card-label mb-1 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="rigburrito-input w-full" />
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="rigburrito-input rigburrito-mono w-full" />
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as ArticleCategory)} className="rigburrito-select w-full">
              {ARTICLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} className="rigburrito-input w-full" />
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Read Time (mins)</label>
            <input type="number" value={readTime} onChange={e => setReadTime(e.target.value)} className="rigburrito-input w-full" />
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Meta Description</label>
            <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} className="rigburrito-textarea" />
          </div>
          <div>
            <label className="rigburrito-card-label mb-1 block">Featured Image</label>
            <input type="file" accept="image/*" onChange={handleFeaturedUpload} className="rigburrito-body text-sm" />
            {featuredImage && <p className="rigburrito-caption mt-1 truncate">{featuredImage}</p>}
          </div>
          {error && <p className="rigburrito-body text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2 border-t pt-4" style={{ borderColor: '#F0F1F3' }}>
          <AdminButton variant="secondary" onClick={() => save(false)} disabled={saving} className="flex-1">Save Draft</AdminButton>
          <AdminButton variant="accent" onClick={() => save(true)} disabled={saving} className="flex-1">Publish</AdminButton>
        </div>
      </div>
    </div>
  )
}
