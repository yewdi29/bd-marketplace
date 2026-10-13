import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/site'

export const SHARE_IMAGE_PATH = '/main-share-img.png'

export const SHARE_IMAGE_ALT = 'Black Diamond Marketplace — Machinery Deals Made Easy.'

export const SHARE_OG_IMAGES = [
  {
    url: SHARE_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: SHARE_IMAGE_ALT,
  },
] as const

type BuildPageMetadataInput = {
  title: string
  description?: string
  path: string
  noindex?: boolean
}

export function buildPageMetadata({
  title,
  description,
  path,
  noindex,
}: BuildPageMetadataInput): Metadata {
  const canonical = canonicalUrl(path)
  const ogTitle = `${title} | Black Diamond Marketplace`

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: ogTitle,
      ...(description ? { description } : {}),
      siteName: 'Black Diamond Marketplace',
      type: 'website',
      images: [...SHARE_OG_IMAGES],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
      images: [SHARE_IMAGE_PATH],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
