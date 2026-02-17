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
      include: {
        location: true,
      },
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...device,
      assignedTo: (device as any).location || null,
      recordStatus: typeof (device as any).recordStatus === 'string' ? (device as any).recordStatus.toLowerCase() : 'open',
    })
  } catch (error) {
    console.error('Error fetching equivalent device:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch equivalent device',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
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
      currentLocation,
      recordStatus,
      status,
      assignedToId,
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
      'passive': 'PASSIVE',
    }

    const conditionMap: { [key: string]: string } = {
      'new': 'NEW',
      'excellent': 'EXCELLENT',
      'good': 'GOOD',
      'fair': 'FAIR',
      'poor': 'POOR',
    }

    const locationMap: { [key: string]: string } = {
      'in_warehouse': 'IN_WAREHOUSE',
      'on_site_service': 'ON_SITE_SERVICE',
      'at_customer': 'AT_CUSTOMER',
    }

    const recordStatusMap: { [key: string]: string } = {
      'open': 'OPEN',
      'on_hold': 'ON_HOLD',
      'closed': 'CLOSED',
    }

    const device = await prisma.equivalentDevice.update({
      where: { id: params.id },
      data: {
        deviceName,
        brand,
        model,
        serialNumber,
        currentLocation: currentLocation ? (locationMap[currentLocation.toLowerCase()] || undefined) : undefined,
        recordStatus: recordStatus ? (recordStatusMap[String(recordStatus).toLowerCase()] || undefined) : undefined,
        status: status ? statusMap[status.toLowerCase()] : undefined,
        assignedToId: assignedToId || null,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        condition: condition ? conditionMap[condition.toLowerCase()] : undefined,
        notes,
      },
    })

    const hydrated = await prisma.equivalentDevice.findUnique({
      where: { id: params.id },
      include: { location: true },
    })

    return NextResponse.json({
      ...hydrated,
      assignedTo: (hydrated as any)?.location || null,
      recordStatus: typeof (hydrated as any)?.recordStatus === 'string' ? (hydrated as any).recordStatus.toLowerCase() : 'open',
    })
  } catch (error) {
    console.error('Error updating equivalent device:', error)
    return NextResponse.json(
      {
        error: 'Failed to update equivalent device',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
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
      {
        error: 'Failed to delete equivalent device',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}

