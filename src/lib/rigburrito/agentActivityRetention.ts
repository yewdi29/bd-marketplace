import type { SupabaseClient } from '@supabase/supabase-js'

export const AGENT_ACTIVITY_RETENTION_DAYS = 180
export const AGENT_ACTIVITY_ARCHIVE_BUCKET = 'agent-activity-archive'

const BATCH_SIZE = 500

const ARCHIVE_COLUMNS = [
  'id',
  'agent_name',
  'action',
  'entity_type',
  'entity_id',
  'outcome',
  'summary',
  'created_at',
  'overall_score',
  'score_breakdown',
  'flag_comment',
  'reasoning',
] as const

type ArchiveColumn = (typeof ARCHIVE_COLUMNS)[number]

export interface AgentActivityLogRow {
  id: string
  agent_name: string
  action: string
  entity_type: string | null
  entity_id: string | null
  outcome: string | null
  summary: string
  created_at: string
  overall_score: number | null
  score_breakdown: unknown
  flag_comment: string | null
  reasoning: string | null
}

export interface AgentActivityRetentionResult {
  retentionDays: number
  dryRun: boolean
  cutoff: string
  archived: number
  deleted: number
  heldForPendingReview: number
  archivePaths: string[]
  errors: string[]
}

function formatDateOnly(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(0, 10)
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function serializeArchiveCell(column: ArchiveColumn, row: AgentActivityLogRow): string {
  const value = row[column]
  if (value == null) return ''
  if (column === 'score_breakdown') {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }
  return String(value)
}

function rowsToCsv(rows: AgentActivityLogRow[]): string {
  const header = ARCHIVE_COLUMNS.join(',')
  const lines = rows.map(row =>
    ARCHIVE_COLUMNS.map(column => escapeCsvCell(serializeArchiveCell(column, row))).join(','),
  )
  return [header, ...lines].join('\n')
}

function buildArchivePath(rows: AgentActivityLogRow[]): string {
  const timestamps = rows.map(row => new Date(row.created_at).getTime())
  const minDate = formatDateOnly(new Date(Math.min(...timestamps)))
  const maxDate = formatDateOnly(new Date(Math.max(...timestamps)))
  return `${minDate}_to_${maxDate}.csv`
}

function isHeldForPendingReview(
  row: AgentActivityLogRow,
  pendingListingIds: Set<string>,
): boolean {
  return row.entity_type === 'listing'
    && !!row.entity_id
    && pendingListingIds.has(row.entity_id)
}

async function loadPendingListingIds(service: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await service
    .from('listings')
    .select('id')
    .eq('status', 'pending_review')

  if (error) throw new Error(`Failed to load pending listings: ${error.message}`)

  return new Set((data ?? []).map(listing => listing.id as string))
}

async function archiveRows(
  service: SupabaseClient,
  rows: AgentActivityLogRow[],
): Promise<string> {
  const path = buildArchivePath(rows)
  const csv = rowsToCsv(rows)
  const body = Buffer.from(csv, 'utf-8')

  const { error } = await service.storage
    .from(AGENT_ACTIVITY_ARCHIVE_BUCKET)
    .upload(path, body, { contentType: 'text/csv', upsert: true })

  if (error) {
    throw new Error(`Archive upload failed for ${path}: ${error.message}`)
  }

  return path
}

async function deleteRows(service: SupabaseClient, ids: string[]): Promise<void> {
  const { error } = await service
    .from('agent_activity_log')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(`Delete failed for ${ids.length} rows: ${error.message}`)
  }
}

export async function runAgentActivityRetention(
  service: SupabaseClient,
  options?: {
    retentionDays?: number
    dryRun?: boolean
  },
): Promise<AgentActivityRetentionResult> {
  const retentionDays = options?.retentionDays ?? AGENT_ACTIVITY_RETENTION_DAYS
  const dryRun = options?.dryRun ?? false

  const cutoffDate = new Date()
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - retentionDays)
  const cutoff = cutoffDate.toISOString()

  const pendingListingIds = await loadPendingListingIds(service)

  const result: AgentActivityRetentionResult = {
    retentionDays,
    dryRun,
    cutoff,
    archived: 0,
    deleted: 0,
    heldForPendingReview: 0,
    archivePaths: [],
    errors: [],
  }

  let cursor: string | null = null

  while (true) {
    let query = service
      .from('agent_activity_log')
      .select(ARCHIVE_COLUMNS.join(', '))
      .lt('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (cursor) {
      query = query.gt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      result.errors.push(`Failed to query agent activity rows: ${error.message}`)
      break
    }

    const batch = (data ?? []) as unknown as AgentActivityLogRow[]
    if (batch.length === 0) break

    cursor = batch[batch.length - 1].created_at

    const eligible: AgentActivityLogRow[] = []
    for (const row of batch) {
      if (isHeldForPendingReview(row, pendingListingIds)) {
        result.heldForPendingReview += 1
        continue
      }
      eligible.push(row)
    }

    if (eligible.length === 0) continue

    if (dryRun) {
      result.archived += eligible.length
      result.deleted += eligible.length
      result.archivePaths.push(buildArchivePath(eligible))
      continue
    }

    try {
      const archivePath = await archiveRows(service, eligible)
      result.archivePaths.push(archivePath)
      result.archived += eligible.length

      await deleteRows(service, eligible.map(row => row.id))
      result.deleted += eligible.length
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown retention error'
      result.errors.push(message)
      console.error('[agent-activity-retention]', message)
      break
    }
  }

  return result
}
