import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import {
  EquivalentCondition,
  EquivalentDeviceStatus,
  EquivalentLocation,
  EquivalentRecordStatus,
} from '@prisma/client'

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
    const locationMap: Record<string, EquivalentLocation> = {
      'in_warehouse': EquivalentLocation.IN_WAREHOUSE,
      'on_site_service': EquivalentLocation.ON_SITE_SERVICE,
      'at_customer': EquivalentLocation.AT_CUSTOMER,
    }

    const statusMap: Record<string, EquivalentDeviceStatus> = {
      'available': EquivalentDeviceStatus.AVAILABLE,
      'in_use': EquivalentDeviceStatus.IN_USE,
      'in_maintenance': EquivalentDeviceStatus.IN_MAINTENANCE,
      'reserved': EquivalentDeviceStatus.RESERVED,
      'retired': EquivalentDeviceStatus.RETIRED,
      'passive': EquivalentDeviceStatus.PASSIVE,
    }

    const conditionMap: Record<string, EquivalentCondition> = {
      'new': EquivalentCondition.NEW,
      'excellent': EquivalentCondition.EXCELLENT,
      'good': EquivalentCondition.GOOD,
      'fair': EquivalentCondition.FAIR,
      'poor': EquivalentCondition.POOR,
    }

    const recordStatusMap: Record<string, EquivalentRecordStatus> = {
      'open': EquivalentRecordStatus.OPEN,
      'on_hold': EquivalentRecordStatus.ON_HOLD,
      'closed': EquivalentRecordStatus.CLOSED,
    }

    const device = await prisma.equivalentDevice.create({
      data: {
        deviceNumber,
        deviceName,
        brand,
        model,
        serialNumber,
        currentLocation: locationMap[currentLocation?.toLowerCase()] || EquivalentLocation.IN_WAREHOUSE,
        recordStatus: recordStatus ? (recordStatusMap[recordStatus?.toLowerCase()] || EquivalentRecordStatus.OPEN) : EquivalentRecordStatus.OPEN,
        status: statusMap[status?.toLowerCase()] || EquivalentDeviceStatus.AVAILABLE,
        assignedToId: assignedToId || null,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        condition: conditionMap[condition?.toLowerCase()] || EquivalentCondition.GOOD,
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
        previousLocation: locationMap[currentLocation?.toLowerCase()] || EquivalentLocation.IN_WAREHOUSE,
        newLocation: locationMap[currentLocation?.toLowerCase()] || EquivalentLocation.IN_WAREHOUSE,
        newStatus: statusMap[status?.toLowerCase()] || EquivalentDeviceStatus.AVAILABLE,
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

