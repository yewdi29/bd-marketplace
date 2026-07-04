import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Article, ArticleCategory } from '@/lib/types/database'

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  drill_pipe:       'Drill Pipe',
  upstream:         'Upstream',
  midstream:        'Midstream',
  downstream:       'Downstream',
  equipment_guides: 'Equipment Guides',
  market_news:      'Market News',
  industry:         'Industry',
}

const STUB_ARTICLES = [
  {
    title: 'The Complete Guide to Drill Pipe Grades',
    excerpt: 'Everything you need to know about E75, X95, G105, and S135 drill pipe grades — strength, applications, and when to spec up.',
    category: 'drill_pipe' as ArticleCategory,
    read_time_mins: 8,
    slug: 'drill-pipe-grades-guide',
    published_at: null,
  },
  {
    title: 'How to Value a Used Drilling Rig in 2025',
    excerpt: 'Market conditions, inspection checklists, and the key factors that determine rig value in the current O&G market.',
    category: 'equipment_guides' as ArticleCategory,
    read_time_mins: 12,
    slug: 'valuing-used-drilling-rig-2025',
    published_at: null,
  },
  {
    title: 'Blowout Preventer Maintenance: A Field Checklist',
    excerpt: 'Step-by-step BOP inspection and maintenance procedures to stay compliant and keep your crew safe.',
    category: 'upstream' as ArticleCategory,
    read_time_mins: 6,
    slug: 'blowout-preventer-maintenance-checklist',
    published_at: null,
  },
]

export default async function OperatorJournalSection() {
  const supabase = await createClient()

  const { data: published } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, read_time_mins, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  const articles: Partial<Article>[] =
    (published && published.length >= 3)
      ? (published as Partial<Article>[])
      : [...(published as Partial<Article>[]), ...STUB_ARTICLES].slice(0, 3)

  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2
            className="font-sans font-bold text-2xl text-ink"
            style={{ letterSpacing: '-0.02em' }}
          >
            From The Operator Journal
          </h2>
          <p className="mt-1 text-sm font-sans text-ink-3">
            Field-grade guides and market intelligence
          </p>
        </div>
        <Link
          href="/knowledge-base"
          className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((article, i) => (
          <article
            key={article.slug ?? i}
            className="group bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] p-6 transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] font-bold text-orange uppercase tracking-wider">
                {CATEGORY_LABELS[article.category as ArticleCategory] ?? article.category}
              </span>
              {article.read_time_mins && (
                <>
                  <span className="text-[#D4D5D7]">·</span>
                  <span className="text-[13px] font-sans text-ink-3">
                    {article.read_time_mins} min read
                  </span>
                </>
              )}
            </div>

            <h3
              className="font-sans font-bold text-[17px] text-ink group-hover:text-orange transition-colors leading-snug mb-2"
              style={{ letterSpacing: '-0.01em' }}
            >
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="text-[13px] font-sans text-ink-3 leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
            )}

            <div className="mt-4">
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

      <div className="mt-4 sm:hidden text-center">
        <Link
          href="/knowledge-base"
          className="text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
        >
          View all articles →
        </Link>
      </div>
    </section>
  )
}
