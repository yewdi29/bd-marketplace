import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEnterpriseInquiryAlert } from '@/lib/email/enterpriseInquiryAlerts'
import type { EnterpriseDealMetadata } from '@/lib/organizations/enterpriseDealMetadata'

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const TEAM_SIZE_RANGES: Record<string, number> = {
  '1-5': 5,
  '6-10': 10,
  '11-25': 25,
  '26-50': 50,
  '51-100': 100,
  '100+': 150,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      company_name?: string
      contact_name?: string
      contact_email?: string
      contact_phone?: string
      estimated_team_size?: number | string
      locations_regions?: string
      message?: string
    }

    const companyName = body.company_name?.trim()
    const contactName = body.contact_name?.trim()
    const contactEmail = body.contact_email?.trim().toLowerCase()
    const contactPhone = body.contact_phone?.trim()
    const locationsRegions = body.locations_regions?.trim() ?? ''

    if (!companyName || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'Company name, contact name, email, and phone are required' },
        { status: 400 },
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    const phoneDigits = contactPhone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: 'Enter a valid phone number (at least 10 digits)' },
        { status: 400 },
      )
    }

    let teamSize = 0
    if (typeof body.estimated_team_size === 'number' && body.estimated_team_size > 0) {
      teamSize = Math.round(body.estimated_team_size)
    } else if (typeof body.estimated_team_size === 'string') {
      teamSize = TEAM_SIZE_RANGES[body.estimated_team_size]
        ?? parseInt(body.estimated_team_size, 10)
        ?? 0
    }

    if (teamSize <= 0) {
      return NextResponse.json({ error: 'Estimated team size is required' }, { status: 400 })
    }

    const metadata: EnterpriseDealMetadata = {
      company_name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      estimated_team_size: teamSize,
      locations_regions: locationsRegions,
      message: body.message?.trim() || null,
      submitted_at: new Date().toISOString(),
    }

    const service = getService()
    const { data: deal, error } = await service
      .from('deals')
      .insert({
        deal_type: 'enterprise',
        deal_tier: null,
        status: 'identified',
        enterprise_metadata: metadata,
        buyer_name: contactName,
        buyer_email: contactEmail,
        buyer_phone: metadata.contact_phone,
        notes: `Enterprise inquiry from ${companyName}`,
      })
      .select('id')
      .single()

    if (error || !deal) {
      console.error('[enterprise/inquiry]', error)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    void sendEnterpriseInquiryAlert({ dealId: deal.id, metadata }).catch(err => {
      console.error('[enterprise/inquiry] alert email failed:', err)
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[enterprise/inquiry]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
