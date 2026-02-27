import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.incomingCargoFaultOption.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching incoming cargo faults:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming cargo faults' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const created = await prisma.incomingCargoFaultOption.create({
      data: {
        name,
        active: body?.active !== false,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating incoming cargo fault option:', error)
    return NextResponse.json({ error: 'Failed to create incoming cargo fault option' }, { status: 500 })
  }
}
