import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.vendor.findMany({
      where: {
        type: 'DISTRIBUTOR',
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching supplier companies:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const created = await prisma.vendor.create({
      data: {
        name,
        type: 'DISTRIBUTOR',
        active: body?.active !== false,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier company:', error)
    return NextResponse.json({ error: 'Failed to create supplier company' }, { status: 500 })
  }
}
