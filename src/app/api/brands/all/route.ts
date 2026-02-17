export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all brands with full fields
export async function GET() {
  try {
    const brands = await db.deviceBrand.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching all brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}



