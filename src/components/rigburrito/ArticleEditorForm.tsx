'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import ArticleEditor, { type ArticleEditorHandle } from '@/components/rigburrito/ArticleEditor'
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
  showCloseButton?: boolean
}

type FormFields = {
  title: string
  slug: string
  body: string
  category: ArticleCategory
  tags: string
  readTime: string
  metaDescription: string
  featuredImage: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function normalizeTags(tags: string): string {
  return tags.split(',').map(t => t.trim()).filter(Boolean).join(',')
}

function formSnapshot(fields: FormFields) {
  return {
    title: fields.title.trim(),
    slug: fields.slug.trim(),
    body: fields.body,
    category: fields.category,
    tags: normalizeTags(fields.tags),
    readTime: fields.readTime.trim(),
    metaDescription: fields.metaDescription.trim(),
    featuredImage: fields.featuredImage.trim(),
  }
}

function hasDraftContent(fields: FormFields): boolean {
  return Boolean(
    fields.title.trim()
    || stripHtml(fields.body)
    || fields.tags.trim()
    || fields.readTime.trim()
    || fields.metaDescription.trim()
    || fields.featuredImage.trim(),
  )
}

function hasUnsavedChanges(current: FormFields, initial?: ArticleEditorFormProps['initial']): boolean {
  if (!initial) return hasDraftContent(current)

  const baseline = formSnapshot({
    title: initial.title,
    slug: initial.slug,
    body: initial.body,
    category: initial.category,
    tags: initial.tags.join(', '),
    readTime: String(initial.read_time_mins ?? ''),
    metaDescription: initial.meta_description ?? '',
    featuredImage: initial.featured_image ?? '',
  })

  return JSON.stringify(formSnapshot(current)) !== JSON.stringify(baseline)
}

export default function ArticleEditorForm({
  articleId,
  initial,
  showCloseButton = false,
}: ArticleEditorFormProps) {
  const router = useRouter()
  const editorRef = useRef<ArticleEditorHandle>(null)
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
  const [discardOpen, setDiscardOpen] = useState(false)

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

  function currentFields(): FormFields {
    return { title, slug, body, category, tags, readTime, metaDescription, featuredImage }
  }

  async function save(options: { publish?: boolean; preserveStatus?: boolean } = {}): Promise<boolean> {
    const publish = options.publish ?? false
    if (!title.trim()) { setError('Title is required'); return false }

    const bodyHtml = editorRef.current?.commitSourceToPreview() ?? body
    if (bodyHtml !== body) setBody(bodyHtml)

    setSaving(true)
    setError('')
    const payload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim() || slugifyTitle(title),
      body: bodyHtml,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time_mins: readTime ? parseInt(readTime, 10) : null,
      meta_description: metaDescription.trim() || null,
      featured_image: featuredImage || null,
    }

    if (articleId) {
      if (publish) payload.publish = true
      else if (!options.preserveStatus) payload.status = 'draft'
    } else {
      payload.status = publish ? 'published' : 'draft'
      if (publish) payload.publish = true
    }

    const url = articleId ? `/api/rigburrito/journal/${articleId}` : '/api/rigburrito/journal'
    const method = articleId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Save failed')
      return false
    }
    router.push('/rigburrito/journal')
    router.refresh()
    return true
  }

  async function handleFeaturedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setFeaturedImage(url)
  }

  function exitToJournal() {
    router.push('/rigburrito/journal')
  }

  function handleCloseClick() {
    let compareBody = body
    if (editorRef.current?.isSourceMode()) {
      const html = editorRef.current.commitSourceToPreview()
      if (html != null) {
        compareBody = html
        setBody(html)
      }
    }

    if (!hasUnsavedChanges({ ...currentFields(), body: compareBody }, initial)) {
      exitToJournal()
      return
    }
    setDiscardOpen(true)
  }

  async function handleSaveAndExit() {
    const ok = await save({ publish: false, preserveStatus: Boolean(articleId) })
    if (ok) setDiscardOpen(false)
  }

  const isEditing = Boolean(articleId)

  return (
    <>
      {showCloseButton && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="rigburrito-btn-icon"
            aria-label="Close editor"
            onClick={handleCloseClick}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex h-[calc(100vh-120px)] gap-6">
        <div className="w-[60%]">
          <ArticleEditor ref={editorRef} content={body} onChange={setBody} onImageUpload={uploadImage} />
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
              <textarea
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Brief summary for SEO and journal card captions"
                className="rigburrito-textarea"
              />
              <p className="rigburrito-caption mt-1">150 characters recommended · {metaDescription.length}/300</p>
            </div>
            <div>
              <label className="rigburrito-card-label mb-1 block">Featured Image</label>
              <input type="file" accept="image/*" onChange={handleFeaturedUpload} className="rigburrito-body text-sm" />
              {featuredImage && <p className="rigburrito-caption mt-1 truncate">{featuredImage}</p>}
            </div>
            {error && <p className="rigburrito-body text-red-600">{error}</p>}
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4" style={{ borderColor: '#F0F1F3' }}>
            <AdminButton variant="secondary" onClick={() => void save({ publish: false })} disabled={saving} className="flex-1">Save Draft</AdminButton>
            <AdminButton variant="accent" onClick={() => void save({ publish: true })} disabled={saving} className="flex-1">Publish</AdminButton>
          </div>
        </div>
      </div>

      <Dialog.Root open={discardOpen} onOpenChange={setDiscardOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0"
            style={{ zIndex: 10000, background: 'rgba(0,0,0,0.4)' }}
          />
          <Dialog.Content
            className="rigburrito-card fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ zIndex: 10001, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 8 }}>
              {isEditing ? 'Discard changes?' : 'Discard this article?'}
            </Dialog.Title>
            <Dialog.Description className="rigburrito-body mb-5" style={{ color: '#6B7280' }}>
              {isEditing
                ? 'You have unsaved changes. Save them or leave without updating this article.'
                : 'You have unsaved changes. Save a draft or discard them to leave the editor.'}
            </Dialog.Description>
            <div className="flex flex-col gap-2">
              <AdminButton
                variant="accent"
                className="w-full"
                disabled={saving || !title.trim()}
                onClick={() => void handleSaveAndExit()}
              >
                {isEditing ? 'Save Changes' : 'Save as Draft'}
              </AdminButton>
              <AdminButton
                variant="danger"
                className="w-full"
                disabled={saving}
                onClick={() => {
                  setDiscardOpen(false)
                  exitToJournal()
                }}
              >
                Discard
              </AdminButton>
              <AdminButton
                variant="secondary"
                className="w-full"
                disabled={saving}
                onClick={() => setDiscardOpen(false)}
              >
                Keep Editing
              </AdminButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
