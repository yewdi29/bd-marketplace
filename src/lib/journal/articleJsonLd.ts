import { PUBLIC_SITE_URL } from '@/lib/site'

export interface BuildJournalArticleJsonLdInput {
  title: string
  slug: string
  description?: string | null
  featuredImage?: string | null
  datePublished?: string | null
  dateModified?: string | null
}

/**
 * schema.org Article JSON-LD for Operator Journal /journal/[slug].
 * Author is the publishing Organization (journal does not display a byline).
 */
export function buildJournalArticleJsonLd(input: BuildJournalArticleJsonLdInput) {
  const url = `${PUBLIC_SITE_URL}/journal/${input.slug}`
  const publisher = {
    '@type': 'Organization',
    name: 'Black Diamond Marketplace',
    url: PUBLIC_SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${PUBLIC_SITE_URL}/bd_logo-icon.svg`,
    },
  }

  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Organization',
      name: 'Black Diamond Marketplace',
      url: PUBLIC_SITE_URL,
    },
    publisher,
  }

  if (input.description) {
    article.description = input.description
  }
  if (input.featuredImage) {
    article.image = input.featuredImage
  }
  if (input.datePublished) {
    article.datePublished = input.datePublished
  }
  if (input.dateModified) {
    article.dateModified = input.dateModified
  }

  return article
}
