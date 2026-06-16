import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCategory(category: ArticleCategory | string): string {
  return category.replace(/_/g, ' ').toUpperCase()
}

function formatPublishedDate(dateString: string | null): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return `Published ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

/** Splits a sentence-per-item paragraph into individual checklist items. */
function splitChecklistItems(line: string): string[] {
  return line
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean)
}

/** Renders the plain-text article body, treating each blank-line-separated block as a
 *  section: first line = H2 heading, remaining lines = paragraphs or checklist items. */
function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).map(b => b.trim()).filter(Boolean)

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        const [heading, ...content] = lines
        const isChecklistSection = /checklist|testing|inspection/i.test(heading)

        return (
          <div key={i}>
            <h2 className="font-sans font-bold text-ink leading-[1.2] mt-10 mb-4" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>
              {heading}
            </h2>
            {content.map((line, j) => {
              const items = isChecklistSection ? splitChecklistItems(line) : [line]

              if (isChecklistSection && items.length > 1) {
                return (
                  <ul key={j} className="list-none pl-0 mb-6 space-y-3">
                    {items.map((item, k) => (
                      <li key={k} className="flex items-start gap-3">
                        <Check
                          className="shrink-0 mt-1"
                          style={{ width: '16px', height: '16px', color: '#FF6B35' }}
                          strokeWidth={3}
                        />
                        <span className="font-sans text-[15px] text-ink-2 leading-[1.8]">{item}</span>
                      </li>
                    ))}
                  </ul>
                )
              }

              return (
                <p key={j} className="font-sans text-[15px] text-ink-2 leading-[1.9] mb-6">
                  {line}
                </p>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select('title, meta_description, featured_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return { title: 'Article Not Found' }

  return {
    title: data.title,
    description: data.meta_description ?? undefined,
    openGraph: {
      title: data.title,
      description: data.meta_description ?? undefined,
      images: data.featured_image ? [data.featured_image] : undefined,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: articleData } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!articleData) redirect('/knowledge-base')

  const article = articleData as Article
  const categoryLabel = formatCategory(article.category)
  const publishedLabel = formatPublishedDate(article.published_at)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[64px]">
        <div className="max-w-[720px] mx-auto px-6 py-12">

          {/* ── Back button ────────────────────────────────────────────────── */}
          <Link
            href="/knowledge-base"
            className="inline-flex items-center gap-1 text-[13px] font-sans font-semibold text-ink-3 hover:text-orange transition-colors mb-8"
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            <span>Back to Knowledge Base</span>
          </Link>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-mono font-bold uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#FF6B35' }}
              >
                {categoryLabel}
              </span>
              {article.read_time_mins != null && (
                <>
                  <span className="text-[#D4D5D7]">·</span>
                  <span className="text-[13px] font-sans text-ink-3">{article.read_time_mins} min read</span>
                </>
              )}
            </div>

            <h1
              className="font-sans font-extrabold text-ink leading-[1.1] mb-3"
              style={{ fontSize: '36px', letterSpacing: '-0.02em' }}
            >
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="font-sans text-ink-3 leading-[1.7]" style={{ fontSize: '16px' }}>
                {article.excerpt}
              </p>
            )}
          </div>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <div className="mb-8" style={{ borderTop: '2px solid #FF6B35', width: '100%' }} />

          {/* ── Featured image ──────────────────────────────────────────────── */}
          {/* FEATURED IMAGE — replace placeholder when asset is ready */}
          <div
            className="relative w-full overflow-hidden mb-10"
            style={{ maxHeight: '400px', height: '400px', borderRadius: '16px' }}
          >
            {article.featured_image ? (
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: '#F7F8F9',
                  border: '1px dashed #D4D5D7',
                  borderRadius: '16px',
                }}
              >
                <span className="font-sans text-[14px] text-ink-3">Thumbnail coming soon</span>
              </div>
            )}
          </div>

          {/* ── Article body ────────────────────────────────────────────────── */}
          <ArticleBody body={article.body} />

          {/* ── Published date ──────────────────────────────────────────────── */}
          {publishedLabel && (
            <p className="font-sans text-[13px] text-ink-3 mt-10 pt-6" style={{ borderTop: '1px solid #E8E9EA' }}>
              {publishedLabel}
            </p>
          )}

          <div className="pb-16" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
