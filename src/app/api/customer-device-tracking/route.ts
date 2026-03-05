import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EquivalentLocation } from '@prisma/client'

// GET customer-device tracking records (devices currently at customer locations)
export async function GET() {
  try {
    const devices = await prisma.equivalentDevice.findMany({
      where: {
        OR: [
          { currentLocation: EquivalentLocation.AT_CUSTOMER },
          { location: { is: { type: 'CUSTOMER' } } },
          { location: { is: { name: { contains: 'Musteri' } } } },
          { location: { is: { name: { contains: 'Müşteri' } } } },
        ],
      },
      include: {
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const normalized = devices.map((device: any) => ({
      ...device,
      assignedTo: device.location || null,
      recordStatus: typeof device.recordStatus === 'string' ? device.recordStatus.toLowerCase() : 'open',
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Error fetching customer device tracking records:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch customer device tracking records',
        details:
          process.env.NODE_ENV === 'production'
            ? undefined
            : error instanceof Error
              ? error.message
              : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
