import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = String(searchParams.get('trackingNumber') || '').trim()
    const excludeId = String(searchParams.get('excludeId') || '').trim()

    if (!trackingNumber) {
      return NextResponse.json({ exists: false })
    }

    const existing = await prisma.cargoTracking.findUnique({
      where: { trackingNumber },
      select: { id: true },
    })

    const exists = Boolean(existing && existing.id !== excludeId)
    return NextResponse.json({ exists, id: existing?.id || null })
  } catch (error) {
    console.error('Error checking tracking number:', error)
    return NextResponse.json({ error: 'Failed to check tracking number' }, { status: 500 })
  }
}
