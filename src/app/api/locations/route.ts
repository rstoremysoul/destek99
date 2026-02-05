import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET all locations
export async function GET(request: NextRequest) {
  try {
    const locations = await prisma.location.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      address,
      city,
      district,
      phone,
      contactPerson,
      type,
    } = body

    const location = await prisma.location.create({
      data: {
        name,
        address,
        city,
        district,
        phone,
        contactPerson,
        type: type ? type.toUpperCase() : null,
        active: true,
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}

