import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await prisma.incomingCargoFaultOption.update({
      where: { id: params.id },
      data: {
        name: typeof body?.name === 'string' ? body.name.trim() : undefined,
        active: typeof body?.active === 'boolean' ? body.active : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating incoming cargo fault option:', error)
    return NextResponse.json({ error: 'Failed to update incoming cargo fault option' }, { status: 500 })
  }
}
