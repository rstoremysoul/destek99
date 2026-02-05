import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET single equivalent device
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const device = await prisma.equivalentDevice.findUnique({
      where: { id: params.id },
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error fetching equivalent device:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equivalent device' },
      { status: 500 }
    )
  }
}

// PATCH update equivalent device
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      deviceName,
      brand,
      model,
      serialNumber,
      location,
      apparatus,
      status,
      assignedTo,
      assignedDate,
      purchaseDate,
      warrantyEnd,
      condition,
      notes,
    } = body

    // Map enum values
    const statusMap: { [key: string]: string } = {
      'available': 'AVAILABLE',
      'in_use': 'IN_USE',
      'in_maintenance': 'IN_MAINTENANCE',
      'reserved': 'RESERVED',
      'retired': 'RETIRED',
    }

    const conditionMap: { [key: string]: string } = {
      'new': 'NEW',
      'excellent': 'EXCELLENT',
      'good': 'GOOD',
      'fair': 'FAIR',
      'poor': 'POOR',
    }

    const device = await prisma.equivalentDevice.update({
      where: { id: params.id },
      data: {
        deviceName,
        brand,
        model,
        serialNumber,
        location,
        apparatus,
        status: status ? statusMap[status.toLowerCase()] : undefined,
        assignedTo,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        condition: condition ? conditionMap[condition.toLowerCase()] : undefined,
        notes,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error updating equivalent device:', error)
    return NextResponse.json(
      { error: 'Failed to update equivalent device' },
      { status: 500 }
    )
  }
}

// DELETE equivalent device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.equivalentDevice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equivalent device:', error)
    return NextResponse.json(
      { error: 'Failed to delete equivalent device' },
      { status: 500 }
    )
  }
}

