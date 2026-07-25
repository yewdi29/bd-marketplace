/** Detect how stored article body content should be rendered on the public page. */
export type ArticleBodyFormat = 'html' | 'markdown' | 'plain'

const HTML_TAG_PATTERN = /<(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|a|img|hr|div|br)\b[^>]*>/i
const MARKDOWN_PATTERN = /^(#{1,6}\s|[-*+]\s|\d+\.\s|\*\*[^*]+\*\*|__[^_]+__|\[.+?\]\(.+?\))/m

export function detectArticleBodyFormat(body: string): ArticleBodyFormat {
  const trimmed = body.trim()
  if (!trimmed) return 'plain'
  if (HTML_TAG_PATTERN.test(trimmed)) return 'html'
  if (MARKDOWN_PATTERN.test(trimmed)) return 'markdown'
  return 'plain'
}
