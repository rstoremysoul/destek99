import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LocationType } from '@prisma/client'
import { ensureSystemWarehouses } from '@/lib/system-warehouses'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await ensureSystemWarehouses(prisma)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as LocationType | null

    const where = type ? { type, active: true } : { active: true }

    const warehouses = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assignedDevices: true },
        },
      },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureSystemWarehouses(prisma)

    const data = await request.json()
    const normalizedName = String(data.name || '').trim()
    if (!normalizedName) {
      return NextResponse.json({ error: 'Warehouse name is required' }, { status: 400 })
    }

    const existingByName = await prisma.location.findFirst({
      where: { name: normalizedName },
    })
    if (existingByName) {
      return NextResponse.json(existingByName)
    }

    const warehouse = await prisma.location.create({
      data: {
        name: normalizedName,
        address: data.address,
        city: data.city,
        district: data.district,
        phone: data.phone,
        contactPerson: data.contactPerson,
        type: data.type || 'WAREHOUSE',
        active: true,
      },
    })
    return NextResponse.json(warehouse)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
  }
}
