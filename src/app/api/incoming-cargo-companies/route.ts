import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.incomingCargoCompany.findMany({
      include: {
        branches: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching incoming cargo companies:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming cargo companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const created = await prisma.incomingCargoCompany.create({
      data: {
        name,
        active: body?.active !== false,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating incoming cargo company:', error)
    return NextResponse.json({ error: 'Failed to create incoming cargo company' }, { status: 500 })
  }
}
