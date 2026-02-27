import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId')
    const rows = await prisma.incomingCargoBranch.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching incoming cargo branches:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming cargo branches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const companyId = String(body?.companyId || '').trim()
    if (!companyId || !name) {
      return NextResponse.json({ error: 'companyId and name are required' }, { status: 400 })
    }

    const created = await prisma.incomingCargoBranch.create({
      data: {
        companyId,
        name,
        active: body?.active !== false,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating incoming cargo branch:', error)
    return NextResponse.json({ error: 'Failed to create incoming cargo branch' }, { status: 500 })
  }
}
