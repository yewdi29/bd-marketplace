/**
 * One-off script: preview and apply cleanup of redundant specs keys.
 *
 * Usage:
 *   npx tsx scripts/clean-listing-specs.ts          # dry run (count + samples)
 *   npx tsx scripts/clean-listing-specs.ts --apply  # write changes
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { sanitizeAiSpecs, SPECS_INTERNAL_KEYS } from '../src/lib/listings/listingSpecs'

function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local optional when env vars are already exported
  }
}

loadEnvLocal()

const RESERVED = new Set([
  'year', 'manufacturer', 'brand', 'make', 'model', 'condition', 'category',
])

function normalizeKey(key: string): string {
  return key.trim().toLowerCase()
}

function hasRedundantKeys(specs: Record<string, unknown>): boolean {
  return Object.keys(specs).some(k => RESERVED.has(normalizeKey(k)))
}

function cleanSpecs(specs: Record<string, unknown>): Record<string, string> | null {
  const preserved: Record<string, string> = {}
  for (const key of Array.from(SPECS_INTERNAL_KEYS)) {
    const match = Object.entries(specs).find(([k]) => normalizeKey(k) === key)
    if (match?.[1] != null && String(match[1]).trim()) {
      preserved[match[0]] = String(match[1]).trim()
    }
  }
  const functional = sanitizeAiSpecs(specs as Record<string, string>) ?? {}
  const merged = { ...functional, ...preserved }
  return Object.keys(merged).length > 0 ? merged : null
}

async function main() {
  const apply = process.argv.includes('--apply')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, status, specs')
    .not('specs', 'is', null)

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  const affected = (listings ?? []).filter(row => {
    const specs = row.specs as Record<string, unknown> | null
    return specs && typeof specs === 'object' && hasRedundantKeys(specs)
  })

  console.log(`Listings with specs: ${listings?.length ?? 0}`)
  console.log(`Affected (redundant keys): ${affected.length}`)

  for (const row of affected.slice(0, 5)) {
    console.log(`  - ${row.id} [${row.status}] ${row.title}`)
    console.log(`    before:`, JSON.stringify(row.specs))
    console.log(`    after:`, JSON.stringify(cleanSpecs(row.specs as Record<string, unknown>)))
  }

  if (!apply) {
    console.log('\nDry run only. Pass --apply to update the database.')
    return
  }

  let updated = 0
  for (const row of affected) {
    const cleaned = cleanSpecs(row.specs as Record<string, unknown>)
    const { error: updateError } = await supabase
      .from('listings')
      .update({ specs: cleaned })
      .eq('id', row.id)
    if (updateError) {
      console.error(`Failed ${row.id}:`, updateError.message)
    } else {
      updated++
    }
  }

  console.log(`\nUpdated ${updated} listing(s).`)
}

main()
