import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ArticleBodyContent from '@/components/journal/ArticleBodyContent'
import { articleCaption } from '@/lib/journal/articleCaption'
import { buildJournalArticleJsonLd } from '@/lib/journal/articleJsonLd'
import { PUBLIC_SITE_URL } from '@/lib/site'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCategory(category: ArticleCategory | string): string {
  return category.replace(/_/g, ' ').toUpperCase()
}

function formatPublishedDate(dateString: string | null): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return `Published ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select('title, excerpt, meta_description, featured_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) notFound()

  const canonicalUrl = `${PUBLIC_SITE_URL}/journal/${slug}`
  const description = data.meta_description ?? data.excerpt ?? undefined
  const ogImage = data.featured_image ?? `${PUBLIC_SITE_URL}/og-image.png`

  return {
    title: `${data.title} | The Operator Journal`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: data.title,
      description,
      images: [{ url: ogImage }],
      url: canonicalUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: [ogImage],
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

  if (!articleData) notFound()

  const article = articleData as Article
  const categoryLabel = formatCategory(article.category)
  const publishedLabel = formatPublishedDate(article.published_at)
  const caption = articleCaption(article)

  const jsonLd = buildJournalArticleJsonLd({
    title: article.title,
    slug: article.slug,
    description: article.meta_description ?? article.excerpt ?? caption,
    featuredImage: article.featured_image,
    datePublished: article.published_at,
    dateModified: article.updated_at,
  })

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 pt-[64px]">
        <div className="max-w-[720px] mx-auto px-6 py-12">

          {/* ── Back button ────────────────────────────────────────────────── */}
          <Link
            href="/journal"
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

            {caption && (
              <p className="font-sans text-ink-3 leading-[1.7]" style={{ fontSize: '16px' }}>
                {caption}
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
          <ArticleBodyContent body={article.body} />

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
