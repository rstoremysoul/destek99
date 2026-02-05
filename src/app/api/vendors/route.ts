import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET all vendors
export async function GET(request: NextRequest) {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        products: {
          include: {
            statusHistory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST create new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      contactPerson,
      contactPhone,
      contactEmail,
      address,
      notes,
      active,
    } = body

    const vendor = await prisma.vendor.create({
      data: {
        name,
        type: type.toUpperCase(),
        contactPerson,
        contactPhone,
        contactEmail,
        address,
        notes,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}

