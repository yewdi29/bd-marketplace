import { createClient } from '@/lib/supabase/server'
import HomeSectionHeader from '@/components/home/HomeSectionHeader'
import ArticleCard from '@/components/journal/ArticleCard'
import type { Article } from '@/lib/types/database'

export default async function OperatorJournalSection() {
  const supabase = await createClient()

  const { data: published } = await supabase
    .from('articles')
    .select('id, title, slug, meta_description, excerpt, category, read_time_mins, published_at, featured_image')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  const articles = (published ?? []) as Partial<Article>[]
  if (articles.length === 0) return null

  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]">
      <HomeSectionHeader linkHref="/journal" linkLabel="View all →">
        <h2
          className="font-sans font-bold text-2xl text-ink"
          style={{ letterSpacing: '-0.02em' }}
        >
          From The Operator Journal
        </h2>
        <p className="mt-1 text-sm font-sans text-ink-3">
          Field-grade guides and market intelligence
        </p>
      </HomeSectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            titleAs="h3"
          />
        ))}
      </div>
    </section>
  )
}
