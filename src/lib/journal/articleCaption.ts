/** Card caption and SEO blurb — meta description is canonical; excerpt is a legacy fallback. */
export function articleCaption(article: {
  meta_description?: string | null
  excerpt?: string | null
}): string | null {
  const meta = article.meta_description?.trim()
  if (meta) return meta
  const excerpt = article.excerpt?.trim()
  return excerpt || null
}
