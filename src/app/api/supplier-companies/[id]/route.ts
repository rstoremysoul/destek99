import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data: { active?: boolean; name?: string } = {}

    if (typeof body?.active === 'boolean') {
      data.active = body.active
    }
    if (typeof body?.name === 'string' && body.name.trim()) {
      data.name = body.name.trim()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const result = await prisma.vendor.updateMany({
      where: { id: params.id, type: 'DISTRIBUTOR' },
      data,
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Supplier company not found' }, { status: 404 })
    }

    const updated = await prisma.vendor.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        active: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating supplier company:', error)
    return NextResponse.json({ error: 'Failed to update supplier company' }, { status: 500 })
  }
}
