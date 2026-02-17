import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET all equivalent devices
export async function GET(request: NextRequest) {
  try {
    const devices = await prisma.equivalentDevice.findMany({
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
    console.error('Error fetching equivalent devices:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch equivalent devices',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}

// POST create new equivalent device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      deviceNumber,
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
      images,
      createdBy,
      createdByName,
    } = body

    // Check if serial number already exists
    const existingDevice = await prisma.equivalentDevice.findUnique({
      where: { serialNumber },
    })

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Bu seri numarası zaten kayıtlı' },
        { status: 400 }
      )
    }

    // Map enum values
    const locationMap: { [key: string]: string } = {
      'in_warehouse': 'IN_WAREHOUSE',
      'on_site_service': 'ON_SITE_SERVICE',
      'at_customer': 'AT_CUSTOMER',
    }

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

    const recordStatusMap: { [key: string]: string } = {
      'open': 'OPEN',
      'on_hold': 'ON_HOLD',
      'closed': 'CLOSED',
    }

    const device = await prisma.equivalentDevice.create({
      data: {
        deviceNumber,
        deviceName,
        brand,
        model,
        serialNumber,
        currentLocation: locationMap[currentLocation?.toLowerCase()] || 'IN_WAREHOUSE',
        recordStatus: recordStatus ? (recordStatusMap[recordStatus?.toLowerCase()] || 'OPEN') : 'OPEN',
        status: statusMap[status?.toLowerCase()] || 'AVAILABLE',
        assignedToId: assignedToId || null,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        condition: conditionMap[condition?.toLowerCase()] || 'GOOD',
        notes,
        images,
        createdBy,
        createdByName,
      },
      include: {
        location: true,
      },
    })

    // Create initial history entry
    await prisma.equivalentDeviceHistory.create({
      data: {
        deviceId: device.id,
        previousLocation: locationMap[currentLocation?.toLowerCase()] || 'IN_WAREHOUSE',
        newLocation: locationMap[currentLocation?.toLowerCase()] || 'IN_WAREHOUSE',
        newStatus: statusMap[status?.toLowerCase()] || 'AVAILABLE',
        assignedToId: assignedToId || null,
        notes: 'Cihaz ilk kez oluşturuldu',
        changedBy: createdBy || 'system',
        changedByName: createdByName || 'Sistem',
      },
    })

    return NextResponse.json(
      {
        ...device,
        assignedTo: device.location || null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating equivalent device:', error)
    return NextResponse.json(
      {
        error: 'Failed to create equivalent device',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}

