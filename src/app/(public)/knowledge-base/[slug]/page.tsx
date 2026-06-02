import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'
import NewsletterCTA from './NewsletterCTA'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  equipment_guides: 'Equipment Guides',
  market_news:      'Market News',
  industry:         'Industry',
  upstream:         'Upstream',
  midstream:        'Midstream',
  downstream:       'Downstream',
  drill_pipe:       'Drill Pipe',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase  = await createClient()

  const { data } = await supabase
    .from('articles')
    .select('title, meta_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return { title: 'Article Not Found' }

  return {
    title:       data.title,
    description: data.meta_description ?? undefined,
  }
}

// ─── Article image placeholder ────────────────────────────────────────────────

function ImagePlaceholder() {
  return (
    <div className="w-full h-full bg-[#F0F0F0] flex items-center justify-center">
      <svg
        className="w-16 h-16 text-ink-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )
}

// ─── Related article card ─────────────────────────────────────────────────────

function RelatedCard({ article }: { article: Partial<Article> }) {
  const label = CATEGORY_LABELS[article.category as ArticleCategory] ?? article.category

  return (
    <article className="group bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] p-6 transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover">
      {/* Category + read time */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[11px] font-bold text-orange uppercase tracking-wider">
          {label}
        </span>
        {article.read_time_mins && (
          <>
            <span className="text-[#D4D5D7]">·</span>
            <span className="text-[13px] font-sans text-ink-3">{article.read_time_mins} min read</span>
          </>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-sans font-bold text-[18px] text-ink group-hover:text-orange transition-colors leading-snug mb-3"
        style={{ letterSpacing: '-0.01em' }}
      >
        {article.title}
      </h3>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-[13px] font-sans text-ink-3 leading-relaxed line-clamp-3">
          {article.excerpt}
        </p>
      )}

      {/* Read link */}
      {article.slug && (
        <div className="mt-5">
          <Link
            href={`/knowledge-base/${article.slug}`}
            className="text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
          >
            Read article →
          </Link>
        </div>
      )}
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase  = await createClient()

  // Fetch article — must be published
  const { data: articleData } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!articleData) notFound()

  const article = articleData as Article
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category

  // Fetch related: same category, excluding this article
  const { data: sameCat } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, read_time_mins')
    .eq('status', 'published')
    .eq('category', article.category)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  let related: Partial<Article>[] = sameCat ?? []

  // Fallback: most recent published articles from any category
  if (related.length === 0) {
    const { data: recent } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, category, read_time_mins')
      .eq('status', 'published')
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(3)
    related = recent ?? []
  }

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-10">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-[13px] font-sans text-ink-3 mb-8 flex-wrap">
        <Link
          href="/knowledge-base"
          className="flex items-center gap-1 hover:text-orange transition-colors shrink-0"
        >
          <span>←</span>
          <span>Field Guide</span>
        </Link>
        <span className="text-[#E8E9EA]">/</span>
        <span className="shrink-0">{categoryLabel}</span>
        <span className="text-[#E8E9EA]">/</span>
        <span className="text-ink truncate" style={{ maxWidth: '260px' }}>
          {article.title}
        </span>
      </nav>

      {/* ── Featured image ───────────────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden mb-8"
        style={{ height: '400px', borderRadius: '16px' }}
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
          <ImagePlaceholder />
        )}
      </div>

      {/* ── Article header ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Category badge */}
        <div className="mb-3">
          <span
            className="font-mono font-bold uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              background: '#FFF2ED',
              color: '#FF6B35',
              border: '1px solid #FFD4C2',
              borderRadius: '100px',
              padding: '3px 10px',
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-sans font-extrabold text-ink leading-[1.1] mb-3"
          style={{ fontSize: '36px', letterSpacing: '-0.02em' }}
        >
          {article.title}
        </h1>

        {/* Read time */}
        {article.read_time_mins != null && (
          <p className="font-mono text-ink-3" style={{ fontSize: '11px' }}>
            {article.read_time_mins} min read
          </p>
        )}
      </div>

      {/* ── AI Summary box ───────────────────────────────────────────────────── */}
      {article.excerpt && (
        <div
          className="mb-8"
          style={{
            background: '#FFF2ED',
            borderLeft: '3px solid #FF6B35',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <p
            className="font-mono font-bold text-orange uppercase mb-1.5"
            style={{ fontSize: '9px', letterSpacing: '0.1em' }}
          >
            AI Summary
          </p>
          <p
            className="font-sans text-ink-2 italic leading-[1.7]"
            style={{ fontSize: '14px' }}
          >
            {article.excerpt}
          </p>
        </div>
      )}

      {/* ── Article body ─────────────────────────────────────────────────────── */}
      <div className="max-w-[720px] mx-auto mb-16">
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>

      {/* ── Newsletter CTA ───────────────────────────────────────────────────── */}
      <div className="mb-16">
        <NewsletterCTA />
      </div>

      {/* ── Related articles ─────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section>
          <h2
            className="font-sans font-bold text-ink mb-4"
            style={{ fontSize: '20px' }}
          >
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((rel, i) => (
              <RelatedCard key={rel.slug ?? i} article={rel} />
            ))}
          </div>
        </section>
      )}

      <div className="pb-16" />
    </div>
  )
}
