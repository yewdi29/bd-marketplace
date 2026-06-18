import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'

export const metadata = {
  title: 'The Operator Journal',
  description: 'Expert guides on oil & gas equipment: drill pipe specs, rig types, BOP maintenance, and industry insights.',
}

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  drill_pipe: 'Drill Pipe',
  upstream: 'Upstream',
  midstream: 'Midstream',
  downstream: 'Downstream',
  equipment_guides: 'Equipment Guides',
  market_news: 'Market News',
  industry: 'Industry',
}

const STUB_ARTICLES = [
  {
    title: 'The Complete Guide to Drill Pipe Grades',
    excerpt: 'Everything you need to know about E75, X95, G105, and S135 drill pipe grades — strength, applications, and when to spec up.',
    category: 'drill_pipe',
    read_time_mins: 8,
    slug: 'drill-pipe-grades-guide',
  },
  {
    title: 'How to Value a Used Drilling Rig in 2025',
    excerpt: 'Market conditions, inspection checklists, and the key factors that determine rig value in the current O&G market.',
    category: 'equipment_guides',
    read_time_mins: 12,
    slug: 'valuing-used-drilling-rig-2025',
  },
  {
    title: 'Blowout Preventer Maintenance: A Field Checklist',
    excerpt: 'Step-by-step BOP inspection and maintenance procedures to stay compliant and keep your crew safe.',
    category: 'upstream',
    read_time_mins: 6,
    slug: 'blowout-preventer-maintenance-checklist',
  },
  {
    title: 'Understanding API Specs for Oilfield Equipment',
    excerpt: 'Decoding API 5DP, API 6A, API 16A, and more — what every buyer and seller should know before a transaction.',
    category: 'equipment_guides',
    read_time_mins: 10,
    slug: 'api-specs-oilfield-equipment',
  },
  {
    title: 'Permian Basin vs Eagle Ford: Equipment Market Differences',
    excerpt: 'Regional supply/demand dynamics, preferred equipment specs, and pricing trends in the two biggest US shale plays.',
    category: 'market_news',
    read_time_mins: 7,
    slug: 'permian-vs-eagle-ford-equipment-market',
  },
  {
    title: 'Sourcing Surplus Oilfield Equipment: A Buyer\'s Guide',
    excerpt: 'How to find, evaluate, and safely purchase surplus equipment — from auction houses to direct seller deals.',
    category: 'industry',
    read_time_mins: 9,
    slug: 'sourcing-surplus-oilfield-equipment',
  },
]

export default async function KnowledgeBasePage() {
  const supabase = await createClient()

  const { data: publishedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, read_time_mins, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const published = (publishedArticles ?? []) as Partial<Article>[]
  const publishedSlugs = new Set(published.map(a => a.slug))
  const remainingStubs = STUB_ARTICLES.filter(a => !publishedSlugs.has(a.slug))

  const articles = [...published, ...remainingStubs]

  const categories = Array.from(new Set(articles.map(a => a.category as ArticleCategory)))

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-12">

      {/* Header */}
      <div className="max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-bg border border-orange-bdr rounded-pill px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange" />
          <span className="font-mono text-[11px] font-bold text-orange uppercase tracking-wider">The Operator Journal</span>
        </div>
        <h1
          className="font-sans font-extrabold text-ink leading-[1.05]"
          style={{ fontSize: '42px', letterSpacing: '-0.03em' }}
        >
          Field-Grade<br />
          <span className="text-orange">Intelligence</span>
        </h1>
        <p className="mt-5 text-[15px] font-sans text-ink-2 leading-[1.7] max-w-lg">
          Equipment guides, market analysis, and industry knowledge written by oilfield veterans.
          Built to help you buy and sell smarter.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="px-3.5 py-1.5 bg-orange-bg border border-orange-bdr rounded-pill text-sm font-sans font-semibold text-orange cursor-pointer">
          All Topics
        </span>
        {categories.map(cat => (
          <span
            key={cat}
            className="px-3.5 py-1.5 bg-white border border-[#E8E9EA] rounded-pill text-sm font-sans font-medium text-ink-3 cursor-pointer hover:border-orange hover:text-orange transition-colors"
          >
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, i) => (
          <article
            key={article.slug ?? i}
            className="group bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] p-6 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-card hover:shadow-card-hover"
          >
            {/* Category + read time */}
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] font-bold text-orange uppercase tracking-wider">
                {CATEGORY_LABELS[article.category as ArticleCategory] ?? article.category}
              </span>
              {article.read_time_mins && (
                <>
                  <span className="text-[#D4D5D7]">·</span>
                  <span className="text-[13px] font-sans text-ink-3">{article.read_time_mins} min read</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2
              className="font-sans font-bold text-[18px] text-ink group-hover:text-orange transition-colors leading-snug mb-3"
              style={{ letterSpacing: '-0.01em' }}
            >
              {article.title}
            </h2>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-[13px] font-sans text-ink-3 leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
            )}

            {/* Read link */}
            <div className="mt-5">
              {article.slug ? (
                <Link
                  href={`/knowledge-base/${article.slug}`}
                  className="text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
                >
                  Read article →
                </Link>
              ) : (
                <span className="text-sm font-sans text-ink-3 italic">Coming soon</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 bg-white rounded-[20px] p-10 text-center shadow-card">
        <h2 className="font-sans font-bold text-2xl text-ink mb-3" style={{ letterSpacing: '-0.02em' }}>
          Have Equipment Expertise?
        </h2>
        <p className="text-[15px] font-sans text-ink-3 max-w-lg mx-auto leading-relaxed mb-6">
          We work with oilfield veterans to produce high-quality technical content.
          If you&apos;re an expert in your field, let&apos;s talk.
        </p>
        <Link
          href="/contact"
          className="inline-block px-8 py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
        >
          Get in Touch
        </Link>
      </div>

      <div className="pb-16" />
    </div>
  )
}
