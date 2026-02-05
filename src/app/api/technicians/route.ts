import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET all technicians
export async function GET(request: NextRequest) {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch technicians', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST create new technician
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      email,
      specialization,
      active = true,
    } = body

    const technician = await prisma.technician.create({
      data: {
        name,
        phone,
        email,
        specialization,
        active,
      },
    })

    return NextResponse.json(technician, { status: 201 })
  } catch (error) {
    console.error('Error creating technician:', error)
    return NextResponse.json(
      { error: 'Failed to create technician', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

