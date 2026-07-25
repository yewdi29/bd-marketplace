import type { ArticleCategory } from '@/lib/types/database'

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  drill_pipe: 'Drill Pipe',
  upstream: 'Upstream',
  midstream: 'Midstream',
  downstream: 'Downstream',
  equipment_guides: 'Equipment Guides',
  market_news: 'Market News',
  industry: 'Industry',
}

export function formatArticleCategory(category: ArticleCategory | string): string {
  return ARTICLE_CATEGORY_LABELS[category as ArticleCategory] ?? category.replace(/_/g, ' ')
}

export function formatArticlePublishedDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
