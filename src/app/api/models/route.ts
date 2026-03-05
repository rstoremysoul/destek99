export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function isUnknownConsignmentArg(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message || ''
  return (
    message.includes('Unknown argument `isConsignment`') ||
    message.includes('Unknown field `isConsignment`')
  )
}

// GET active models for a specific device type (brand table is used as device type dictionary)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = (searchParams.get('brand') || '').trim()

    if (!brand) {
      return NextResponse.json({ error: 'Brand parameter is required' }, { status: 400 })
    }

    const brandRecord = await db.deviceBrand.findFirst({
      where: { name: brand },
      select: { id: true },
    })

    if (!brandRecord) {
      return NextResponse.json([])
    }

    const models = await db.deviceModel.findMany({
      where: {
        brandId: brandRecord.id,
        active: true,
      },
      orderBy: { name: 'asc' },
      select: { name: true },
    })

    return NextResponse.json(models.map((m) => m.name))
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}

// POST create model for a device type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const brandName = String(body?.brand || '').trim()
    const name = String(body?.name || '').trim()
    const isConsignment = Boolean(body?.isConsignment)

    if (!brandName || !name) {
      return NextResponse.json({ error: 'Brand and model name are required' }, { status: 400 })
    }

    const brand = await db.deviceBrand.upsert({
      where: { name: brandName },
      update: { active: true },
      create: { name: brandName, active: true },
      select: { id: true },
    })

    const existing = await db.deviceModel.findFirst({
      where: {
        brandId: brand.id,
        name,
      },
    })

    if (existing) {
      const currentConsignment = Boolean((existing as any).isConsignment)
      if (!existing.active || currentConsignment !== isConsignment) {
        try {
          const reactivated = await db.deviceModel.update({
            where: { id: existing.id },
            data: { active: true, isConsignment },
          })
          return NextResponse.json(reactivated)
        } catch (error) {
          if (!isUnknownConsignmentArg(error)) throw error
          const reactivated = await db.deviceModel.update({
            where: { id: existing.id },
            data: { active: true },
          })
          await db.$executeRawUnsafe(
            'UPDATE device_models SET is_consignment = ? WHERE id = ?',
            isConsignment ? 1 : 0,
            existing.id
          )
          return NextResponse.json({ ...reactivated, isConsignment })
        }
      }
      return NextResponse.json(existing)
    }

    let created: any
    try {
      created = await db.deviceModel.create({
        data: {
          brandId: brand.id,
          name,
          isConsignment,
          active: true,
        },
      })
    } catch (error) {
      if (!isUnknownConsignmentArg(error)) throw error
      created = await db.deviceModel.create({
        data: {
          brandId: brand.id,
          name,
          active: true,
        },
      })
      await db.$executeRawUnsafe(
        'UPDATE device_models SET is_consignment = ? WHERE id = ?',
        isConsignment ? 1 : 0,
        created.id
      )
      created = { ...created, isConsignment }
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
  }
}
