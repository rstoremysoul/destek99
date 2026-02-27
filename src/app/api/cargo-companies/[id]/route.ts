import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await prisma.cargoCompany.update({
      where: { id },
      data: {
        ...(typeof body.name === 'string' ? { name: body.name.trim() } : {}),
        ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('cargo company patch error', error)
    return NextResponse.json({ error: 'Failed to update cargo company' }, { status: 500 })
  }
}

