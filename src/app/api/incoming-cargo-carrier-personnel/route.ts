import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CarrierPersonnelRow = {
  id: string
  name: string
  active: boolean | number
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<CarrierPersonnelRow[]>`
      SELECT
        id,
        name,
        active,
        created_at as createdAt,
        updated_at as updatedAt
      FROM incoming_cargo_carrier_personnel
      ORDER BY name COLLATE NOCASE ASC
    `
    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        active: row.active === true || row.active === 1,
      }))
    )
  } catch (error) {
    console.error('Error fetching incoming cargo carrier personnel:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming cargo carrier personnel' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const active = body?.active !== false ? 1 : 0
    await prisma.$executeRaw`
      INSERT INTO incoming_cargo_carrier_personnel (id, name, active, created_at, updated_at)
      VALUES (${id}, ${name}, ${active}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    const created = await prisma.$queryRaw<CarrierPersonnelRow[]>`
      SELECT
        id,
        name,
        active,
        created_at as createdAt,
        updated_at as updatedAt
      FROM incoming_cargo_carrier_personnel
      WHERE id = ${id}
      LIMIT 1
    `

    return NextResponse.json(
      {
        ...created[0],
        active: created[0]?.active === true || created[0]?.active === 1,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating incoming cargo carrier personnel:', error)
    return NextResponse.json({ error: 'Failed to create incoming cargo carrier personnel' }, { status: 500 })
  }
}
