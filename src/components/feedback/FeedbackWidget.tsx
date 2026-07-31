'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  FEEDBACK_IMAGE_ACCEPT,
  FEEDBACK_IMAGE_HINT,
  uploadFeedbackImage,
} from '@/lib/feedback/feedbackUpload'
import { FEEDBACK_OPEN_EVENT } from '@/lib/feedback/openFeedback'
import type { FeedbackCategory } from '@/lib/types/database'

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'feature_request', label: 'Feature request' },
  { id: 'like', label: 'Something I like' },
  { id: 'dislike', label: "Something I don't like" },
]

/**
 * Site-wide peeking feedback tab + slide-over form.
 * Hidden on command center (/rigburrito) — feedback is reviewed there instead.
 */
export default function FeedbackWidget() {
  const pathname = usePathname()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hideOnCommandCenter = pathname?.startsWith('/rigburrito')

  // Allow MobileMenu (and other entry points) to open the panel
  useEffect(() => {
    function handleOpen() {
      setOpen(true)
    }
    window.addEventListener(FEEDBACK_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(FEEDBACK_OPEN_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, loading])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function resetForm() {
    setCategory('bug')
    setMessage('')
    setImageFile(null)
    setImagePreview(null)
    setError('')
    setSent(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    setTimeout(resetForm, 200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = null
      if (category === 'bug' && imageFile) {
        const upload = await uploadFeedbackImage(imageFile)
        if (!upload.ok) {
          setError(upload.error)
          setLoading(false)
          return
        }
        imageUrl = upload.url
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          image_url: imageUrl,
          page_url: typeof window !== 'undefined' ? window.location.href : pathname ?? '/',
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (hideOnCommandCenter) return null

  return (
    <>
      {/* Peeking tab — fixed to right edge */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="feedback-peek-tab"
      >
        <span className="feedback-peek-tab__label">Feedback</span>
      </button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button
            type="button"
            aria-label="Close feedback form"
            className="absolute inset-0 bg-black/30"
            onClick={handleClose}
          />
          <div
            className="feedback-panel absolute right-0 top-0 flex h-full w-full flex-col bg-white sm:w-[400px]"
            style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}
          >
            <div
              className="flex h-16 shrink-0 items-center justify-between px-5"
              style={{ borderBottom: '1px solid #E8E9EA' }}
            >
              <h2 id={titleId} className="font-sans text-base font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>
                Send feedback
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-bg hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {sent ? (
                <div className="flex flex-col items-start gap-3 py-4">
                  <p className="font-sans text-base font-semibold text-ink">Thank you</p>
                  <p className="font-sans text-sm text-ink-2" style={{ lineHeight: 1.55 }}>
                    Your feedback was submitted. We read every one.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 rounded-pill bg-orange px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-lt"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3">
                      Category
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {CATEGORIES.map(c => {
                        const active = category === c.id
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategory(c.id)
                              if (c.id !== 'bug') {
                                setImageFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                              }
                            }}
                            className="rounded-[10px] px-3 py-2.5 text-left text-sm font-sans font-medium transition-colors"
                            style={{
                              border: active ? '1.5px solid #FFD4C2' : '1.5px solid #E8E9EA',
                              background: active ? '#FFF2ED' : '#FFFFFF',
                              color: active ? '#FF6B35' : '#4A4D52',
                            }}
                          >
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="feedback-message"
                      className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3"
                    >
                      Message
                    </label>
                    <textarea
                      id="feedback-message"
                      required
                      rows={5}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Tell us what's going on..."
                      className="w-full resize-none rounded-[10px] border border-[#E8E9EA] bg-white px-3.5 py-2.5 font-sans text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-orange focus:ring-2 focus:ring-orange/20"
                    />
                  </div>

                  {category === 'bug' && (
                    <div>
                      <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3">
                        Screenshot <span className="normal-case font-sans font-normal">(optional)</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={FEEDBACK_IMAGE_ACCEPT}
                        className="block w-full text-sm font-sans text-ink-2 file:mr-3 file:rounded-pill file:border-0 file:bg-orange-bg file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange"
                        onChange={e => {
                          const file = e.target.files?.[0] ?? null
                          setImageFile(file)
                        }}
                      />
                      <p className="mt-1.5 font-mono text-[11px] text-ink-3">{FEEDBACK_IMAGE_HINT}</p>
                      {imagePreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Screenshot preview"
                          className="mt-3 max-h-40 rounded-[10px] border border-[#E8E9EA] object-contain"
                        />
                      )}
                    </div>
                  )}

                  {error && (
                    <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>

            {!sent && (
              <div
                className="shrink-0 px-5 py-4"
                style={{ borderTop: '1px solid #E8E9EA' }}
              >
                <button
                  type="submit"
                  form="feedback-form"
                  disabled={loading || message.trim().length < 3}
                  className="w-full rounded-pill bg-orange py-3 text-sm font-bold text-white transition-colors hover:bg-orange-lt disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Sending…' : 'Submit feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
