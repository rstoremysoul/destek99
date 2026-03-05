import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CarrierPersonnelRow = {
  id: string
  name: string
  active: boolean | number
  createdAt: string
  updatedAt: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const nextName = typeof body?.name === 'string' ? body.name.trim() : null
    const hasActive = typeof body?.active === 'boolean'
    const nextActive = hasActive ? (body.active ? 1 : 0) : null

    if (nextName !== null) {
      await prisma.$executeRaw`
        UPDATE incoming_cargo_carrier_personnel
        SET name = ${nextName}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.id}
      `
    }

    if (hasActive) {
      await prisma.$executeRaw`
        UPDATE incoming_cargo_carrier_personnel
        SET active = ${nextActive}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.id}
      `
    }

    const rows = await prisma.$queryRaw<CarrierPersonnelRow[]>`
      SELECT
        id,
        name,
        active,
        created_at as createdAt,
        updated_at as updatedAt
      FROM incoming_cargo_carrier_personnel
      WHERE id = ${params.id}
      LIMIT 1
    `

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: 'Carrier personnel not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...row,
      active: row.active === true || row.active === 1,
    })
  } catch (error) {
    console.error('Error updating incoming cargo carrier personnel:', error)
    return NextResponse.json({ error: 'Failed to update incoming cargo carrier personnel' }, { status: 500 })
  }
}
