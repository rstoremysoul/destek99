export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const models = await db.deviceModel.findMany({
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
      include: {
        brand: {
          select: { id: true, name: true, active: true },
        },
      },
    })

    return NextResponse.json(models)
  } catch (error) {
    console.error('Error fetching model list:', error)
    return NextResponse.json({ error: 'Failed to fetch model list' }, { status: 500 })
  }
}
