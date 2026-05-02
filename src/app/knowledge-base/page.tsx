import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'

export const metadata = {
  title: 'Knowledge Base',
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
    title: "The Complete Guide to Drill Pipe Grades",
    excerpt: "Everything you need to know about E75, X95, G105, and S135 drill pipe grades — strength, applications, and when to spec up.",
    category: "drill_pipe",
    read_time_mins: 8,
    slug: "drill-pipe-grades-guide",
  },
  {
    title: "How to Value a Used Drilling Rig in 2025",
    excerpt: "Market conditions, inspection checklists, and the key factors that determine rig value in the current O&G market.",
    category: "equipment_guides",
    read_time_mins: 12,
    slug: "valuing-used-drilling-rig-2025",
  },
  {
    title: "Blowout Preventer Maintenance: A Field Checklist",
    excerpt: "Step-by-step BOP inspection and maintenance procedures to stay compliant and keep your crew safe.",
    category: "upstream",
    read_time_mins: 6,
    slug: "bop-maintenance-checklist",
  },
  {
    title: "Understanding API Specs for Oilfield Equipment",
    excerpt: "Decoding API 5DP, API 6A, API 16A, and more — what every buyer and seller should know before a transaction.",
    category: "equipment_guides",
    read_time_mins: 10,
    slug: "api-specs-oilfield-equipment",
  },
  {
    title: "Permian Basin vs Eagle Ford: Equipment Market Differences",
    excerpt: "Regional supply/demand dynamics, preferred equipment specs, and pricing trends in the two biggest US shale plays.",
    category: "market_news",
    read_time_mins: 7,
    slug: "permian-vs-eagle-ford-equipment-market",
  },
  {
    title: "How the Black Diamond Traffic Light System Works",
    excerpt: "Our three-tier routing system explained: what green, yellow, and red mean for your deal, and what support you get at each level.",
    category: "industry",
    read_time_mins: 4,
    slug: "traffic-light-tier-system",
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

  const articles = publishedArticles && publishedArticles.length > 0
    ? publishedArticles as Partial<Article>[]
    : STUB_ARTICLES

  const categories = Array.from(new Set(articles.map(a => a.category as ArticleCategory)))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="max-w-2xl mb-14">
        <p className="font-body text-xs text-gold uppercase tracking-widest mb-3">Knowledge Base</p>
        <h1 className="font-display text-6xl tracking-widest text-white leading-none">
          FIELD-GRADE<br />INTELLIGENCE
        </h1>
        <p className="mt-5 font-body text-base text-gray-500 leading-relaxed">
          Equipment guides, market analysis, and industry knowledge written by oilfield veterans.
          Built to help you buy and sell smarter.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="px-3 py-1 border border-gold/40 bg-gold/10 font-body text-xs text-gold">All Topics</span>
        {categories.map(cat => (
          <span key={cat} className="px-3 py-1 border border-surface-border font-body text-xs text-gray-400 cursor-pointer hover:border-gold/40 hover:text-gold transition-colors">
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <article
            key={article.slug ?? i}
            className="group border border-surface-border bg-surface p-6 hover:border-gold/40 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="font-body text-xs text-gold uppercase tracking-widest">
                {CATEGORY_LABELS[article.category as ArticleCategory] ?? article.category}
              </span>
              {article.read_time_mins && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="font-body text-xs text-gray-600">{article.read_time_mins} min read</span>
                </>
              )}
            </div>

            <h2 className="font-display text-xl tracking-wide text-white group-hover:text-gold transition-colors leading-tight mb-3">
              {article.title}
            </h2>

            {article.excerpt && (
              <p className="font-body text-sm text-gray-500 leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
            )}

            <div className="mt-5">
              {article.slug ? (
                <Link
                  href={`/knowledge-base/${article.slug}`}
                  className="font-body text-xs text-gold hover:text-gold-light transition-colors"
                >
                  Read article →
                </Link>
              ) : (
                <span className="font-body text-xs text-gray-600 italic">Coming soon</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 border border-surface-border bg-surface p-10 text-center">
        <h2 className="font-display text-3xl tracking-widest text-white mb-3">
          HAVE EQUIPMENT EXPERTISE?
        </h2>
        <p className="font-body text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          We work with oilfield veterans to produce high-quality technical content.
          If you&apos;re an expert in your field, let&apos;s talk.
        </p>
        <Link href="/contact" className="mt-6 inline-block">
          <span className="font-display tracking-widest text-sm text-gold border border-gold/40 px-6 py-2.5 hover:bg-gold/10 transition-colors">
            GET IN TOUCH
          </span>
        </Link>
      </div>
    </div>
  )
}
