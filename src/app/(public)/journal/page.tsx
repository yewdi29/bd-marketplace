import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ArticleCard from '@/components/journal/ArticleCard'
import { ARTICLE_CATEGORY_LABELS } from '@/lib/journal/categoryLabels'
import type { Article, ArticleCategory } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'The Operator Journal',
  description:
    'Field guides, maintenance checklists, market insights, and industry knowledge for heavy equipment operators and procurement professionals.',
  alternates: { canonical: 'https://blackdiamondmkt.com/journal' },
}

export default async function JournalPage() {
  const supabase = await createClient()

  const { data: publishedArticles } = await supabase
    .from('articles')
    .select('id, title, slug, meta_description, excerpt, category, read_time_mins, published_at, featured_image')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const articles = (publishedArticles ?? []) as Partial<Article>[]
  const categories = Array.from(new Set(articles.map(a => a.category as ArticleCategory)))

  return (
    <div className="page-shell py-12">

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
            {ARTICLE_CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Articles grid */}
      {articles.length === 0 ? (
        <div className="bg-white border border-[#E8E9EA] rounded-[16px] p-12 text-center shadow-card">
          <p className="font-sans text-[15px] text-ink-3 leading-relaxed max-w-md mx-auto">
            No articles published yet. Check back soon for field guides, market insights, and equipment knowledge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article, i) => (
            <ArticleCard
              key={article.slug ?? i}
              article={{
                title: article.title!,
                slug: article.slug!,
                meta_description: article.meta_description,
                excerpt: article.excerpt,
                category: article.category!,
                read_time_mins: article.read_time_mins,
                published_at: article.published_at,
                featured_image: article.featured_image,
              }}
              titleAs="h2"
            />
          ))}
        </div>
      )}

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
