import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const data: {
      name?: string
      phone?: string | null
      email?: string | null
      specialization?: string | null
      active?: boolean
    } = {}

    if (typeof body?.name === 'string') {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      data.name = name
    }
    if (typeof body?.phone === 'string') data.phone = body.phone.trim() || null
    if (typeof body?.email === 'string') data.email = body.email.trim() || null
    if (typeof body?.specialization === 'string') data.specialization = body.specialization.trim() || null
    if (typeof body?.active === 'boolean') data.active = body.active

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.technician.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating technician:', error)
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 })
  }
}
