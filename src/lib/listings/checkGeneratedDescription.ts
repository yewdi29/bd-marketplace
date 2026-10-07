const ADDED_CLAIM_WORDS = ['verified', 'certified', 'inspected', 'guarantee', 'guaranteed'] as const

export type DescriptionCheckResult = {
  flagged: boolean
  issues: string[]
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\d+)\s*inches?\b/g, '$1"')
    .replace(/\$/g, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/[^\w\s."']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sellerUnits(text: string): string[] {
  const units: string[] = []
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const sentences = line.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
    if (sentences.length > 1) units.push(...sentences)
    else units.push(line)
  }
  return units
}

function wordSet(text: string): Set<string> {
  const words = normalizeForCompare(text).split(' ').filter(Boolean)
  return new Set(words)
}

export function checkGeneratedDescription(
  sellerText: string,
  description: string,
): DescriptionCheckResult {
  const issues: string[] = []
  const normalizedDesc = normalizeForCompare(description)
  const units = sellerUnits(sellerText)

  let lastIndex = -1
  for (const unit of units) {
    const normalizedUnit = normalizeForCompare(unit)
    if (!normalizedUnit) continue
    const idx = normalizedDesc.indexOf(normalizedUnit)
    if (idx === -1) {
      issues.push(`missing seller line/sentence: ${unit}`)
    } else if (idx < lastIndex) {
      issues.push(`seller line/sentence out of order: ${unit}`)
    } else {
      lastIndex = idx
    }
  }

  const sellerHasBullets = /^\s*[-*•]\s+/m.test(sellerText)
  const descHasBullets = /^\s*[-*•]\s+/m.test(description)
  if (sellerHasBullets && !descHasBullets) {
    issues.push('bullet list format was dropped')
  }

  const sellerWords = wordSet(sellerText)
  const descWords = wordSet(description)
  for (const word of ADDED_CLAIM_WORDS) {
    if (descWords.has(word) && !sellerWords.has(word)) {
      issues.push(`added word not in seller text: ${word}`)
    }
  }

  return { flagged: issues.length > 0, issues }
}

const PRICE_AMOUNT = /\$\s*[\d,]+(?:\.\d+)?/g
const ASKING_AMOUNT =
  /\b(?:asking|priced? at|for)\s+\$?\s*[\d,]+(?:\.\d+)?(?:\s*(?:each|per\s+\w+|obo))?\b/gi

function looksLikePriceTag(tag: string): boolean {
  const t = tag.trim().toLowerCase()
  if (/^\$/.test(t)) return true
  if (/^\d[\d,]*(\.\d+)?$/.test(t)) return true
  if (/\b(obo|asking)\b/.test(t) && /\d/.test(t)) return true
  if (/\$/.test(t)) return true
  return false
}

/** Strip price from meta_description and tags when the seller asked to hide price. */
export function stripPriceFromMetaAndTags(
  metaDescription: string,
  tags: string[],
): { meta_description: string; tags: string[] } {
  let meta = metaDescription.replace(ASKING_AMOUNT, '').replace(PRICE_AMOUNT, '')
  meta = meta.replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').trim()

  return {
    meta_description: meta,
    tags: tags.filter(tag => !looksLikePriceTag(tag)),
  }
}

export function trimSellerFallback(sellerText: string): string {
  return sellerText.trim()
}
