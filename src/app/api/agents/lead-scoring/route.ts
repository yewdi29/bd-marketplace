import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'

const AGENT_NAME = 'Lead Scorer'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      lead_id,
      quality_score,
      quality_classification,
      quality_reasoning,
    } = body as {
      lead_id?: string
      quality_score?: number
      quality_classification?: 'hot' | 'warm' | 'cold'
      quality_reasoning?: string
    }

    if (!lead_id || quality_score == null || !quality_classification || !quality_reasoning) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['hot', 'warm', 'cold'].includes(quality_classification)) {
      return NextResponse.json({ error: 'Invalid quality_classification' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: lead, error: leadError } = await service
      .from('leads')
      .select(`
        id,
        buyer_name,
        listings(title)
      `)
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { error: updateError } = await service
      .from('leads')
      .update({
        quality_score,
        quality_classification,
        quality_reasoning,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const listing = lead.listings as unknown as { title: string } | null
    const listingTitle = listing?.title ?? 'Unknown listing'
    const classificationLabel = quality_classification.toUpperCase()
    const summary = `${classificationLabel} lead (${quality_score}/10) on ${listingTitle} — ${lead.buyer_name}`

    const { error: logError } = await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'lead_scored',
      entity_type: 'lead',
      entity_id: lead_id,
      outcome: 'scored',
      summary,
    })

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
