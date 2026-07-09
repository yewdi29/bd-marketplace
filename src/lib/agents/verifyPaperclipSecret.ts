import { NextRequest, NextResponse } from 'next/server'

export function verifyPaperclipSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.PAPERCLIP_AGENT_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Agent secret not configured' }, { status: 500 })
  }

  const provided = req.headers.get('x-paperclip-secret')
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
