import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET active brand names (as strings)
export async function GET(_request: NextRequest) {
  try {
    const brands = await db.deviceBrand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    })
    return NextResponse.json(brands.map(b => b.name))
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch brands',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}

// POST create new brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nameRaw: string | undefined = body?.name
    const name = (nameRaw || '').trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      )
    }

    // Check if brand exists (case-insensitive fallback for sqlite)
    const existing = await db.deviceBrand.findFirst({
      where: {
        OR: [
          { name: { equals: name } },
          { name: { equals: name.toLowerCase() } },
          { name: { equals: name.toUpperCase() } },
        ],
      },
    })
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    const created = await db.deviceBrand.create({
      data: { name, active: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      {
        error: 'Failed to create brand',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}

