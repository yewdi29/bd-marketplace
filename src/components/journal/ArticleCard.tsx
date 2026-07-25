import Image from 'next/image'
import Link from 'next/link'
import { formatArticlePublishedDate } from '@/lib/journal/categoryLabels'
import { articleCaption } from '@/lib/journal/articleCaption'

export type ArticleCardData = {
  title: string
  slug: string
  meta_description?: string | null
  excerpt?: string | null
  category: string
  read_time_mins?: number | null
  published_at?: string | null
  featured_image?: string | null
}

type ArticleCardProps = {
  article: ArticleCardData
  /** Index page uses h2; homepage preview uses h3. */
  titleAs?: 'h2' | 'h3'
}

export default function ArticleCard({ article, titleAs = 'h3' }: ArticleCardProps) {
  const TitleTag = titleAs
  const publishedLabel = formatArticlePublishedDate(article.published_at)
  const caption = articleCaption(article)
  const hasImage = Boolean(article.featured_image)

  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group block h-full no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-[16px]"
    >
      <article className="relative flex min-h-[340px] h-full flex-col overflow-hidden rounded-[16px] shadow-card">
        {hasImage ? (
          <Image
            src={article.featured_image!}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-ink" aria-hidden />
        )}

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.18) 68%, transparent 100%)',
          }}
          aria-hidden
        />

        <div className="relative mt-auto flex w-full flex-col justify-end p-6">
          {publishedLabel && (
            <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white/70">
              {publishedLabel}
            </p>
          )}

          <TitleTag
            className="font-sans font-bold text-[18px] text-white leading-snug mb-2 group-hover:text-orange-lt transition-colors"
            style={{ letterSpacing: '-0.01em' }}
          >
            {article.title}
          </TitleTag>

          {caption && (
            <p className="text-[13px] font-sans text-white/85 leading-relaxed line-clamp-2">
              {caption}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
