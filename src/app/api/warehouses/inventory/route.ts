import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    const where = locationId
      ? { locationId }
      : {}

    const devices = await prisma.equivalentDevice.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { deviceName: 'asc' },
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error('Failed to fetch inventory', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
