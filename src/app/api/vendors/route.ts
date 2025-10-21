import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const vendors = await db.vendor.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}