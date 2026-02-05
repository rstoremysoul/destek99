import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET single cargo by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cargo = await prisma.cargoTracking.findUnique({
      where: { id: params.id },
      include: {
        devices: true,
      },
    })

    if (!cargo) {
      return NextResponse.json(
        { error: 'Cargo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cargo)
  } catch (error) {
    console.error('Error fetching cargo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cargo' },
      { status: 500 }
    )
  }
}

// PATCH update cargo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const cargo = await prisma.cargoTracking.update({
      where: { id: params.id },
      data: {
        ...body,
        sentDate: body.sentDate ? new Date(body.sentDate) : undefined,
        deliveredDate: body.deliveredDate ? new Date(body.deliveredDate) : undefined,
        type: body.type?.toUpperCase(),
        status: body.status?.toUpperCase(),
        destination: body.destination?.toUpperCase(),
      },
      include: {
        devices: true,
      },
    })

    return NextResponse.json(cargo)
  } catch (error) {
    console.error('Error updating cargo:', error)
    return NextResponse.json(
      { error: 'Failed to update cargo' },
      { status: 500 }
    )
  }
}

// DELETE cargo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cargoTracking.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cargo:', error)
    return NextResponse.json(
      { error: 'Failed to delete cargo' },
      { status: 500 }
    )
  }
}

