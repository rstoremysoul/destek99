import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'

function isUnknownRecordStatusArg(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.includes('Unknown argument `recordStatus`') || error.message.includes('record_status')
}

function normalizeRecordStatus(status: string | null | undefined, notes?: string | null) {
  const raw = typeof status === 'string' ? status.toLowerCase() : 'open'
  const { meta } = parseCargoRepairMeta(notes)
  if (meta?.active) return 'device_repair'
  return raw
}

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

    return NextResponse.json({
      ...cargo,
      recordStatus: normalizeRecordStatus((cargo as any).recordStatus, (cargo as any).notes),
      repair: parseCargoRepairMeta((cargo as any).notes).meta,
    })
  } catch (error) {
    console.error('Error fetching cargo:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cargo',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
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
    const { devices, ...cargoData } = body || {}
    if ('targetLocationId' in cargoData) {
      delete cargoData.targetLocationId
    }

    const statusMap: { [key: string]: string } = {
      'in_transit': 'IN_TRANSIT',
      'delivered': 'DELIVERED',
      'returned': 'RETURNED',
      'lost': 'LOST',
      'damaged': 'DAMAGED',
    }

    const typeMap: { [key: string]: string } = {
      'incoming': 'INCOMING',
      'outgoing': 'OUTGOING',
      'on_site_service': 'ON_SITE_SERVICE',
      'installation_team': 'INSTALLATION_TEAM',
    }

    const destinationMap: { [key: string]: string } = {
      'customer': 'CUSTOMER',
      'distributor': 'DISTRIBUTOR',
      'branch': 'BRANCH',
      'headquarters': 'HEADQUARTERS',
    }

    const conditionMap: { [key: string]: string } = {
      'new': 'NEW',
      'used': 'USED',
      'refurbished': 'REFURBISHED',
      'damaged': 'DAMAGED',
    }

    const purposeMap: { [key: string]: string } = {
      'installation': 'INSTALLATION',
      'replacement': 'REPLACEMENT',
      'repair': 'REPAIR',
      'return': 'RETURN',
    }

    const recordStatusMap: { [key: string]: string } = {
      'open': 'OPEN',
      'on_hold': 'ON_HOLD',
      'closed': 'CLOSED',
      'device_repair': 'ON_HOLD',
    }

    const requestedRecordStatus = String(cargoData.recordStatus || '').toLowerCase()
    if (requestedRecordStatus === 'device_repair') {
      const cargoWithDevices = await prisma.cargoTracking.findUnique({
        where: { id: params.id },
        include: { devices: true },
      })
      const serials = (cargoWithDevices?.devices || []).map((d) => d.serialNumber).filter(Boolean)
      const devicesInSystem = serials.length
        ? await prisma.equivalentDevice.findMany({
            where: { serialNumber: { in: serials as string[] } },
            include: { location: true },
          })
        : []

      const hasTrackableLocation = devicesInSystem.length > 0
      const isAtHeadquarters = devicesInSystem.some((d) => {
        const locationName = (d.location?.name || '').toLowerCase()
        return (
          locationName.includes('merkez') ||
          locationName.includes('ofis') ||
          d.currentLocation === 'IN_WAREHOUSE'
        )
      })

      // Only enforce HQ rule when we can actually resolve device location from inventory.
      if (hasTrackableLocation && !isAtHeadquarters) {
        return NextResponse.json(
          { error: 'Cihaz tamiri durumuna almak icin cihazin Merkez Ofis deposunda olmasi gerekir' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const currentCargo = await tx.cargoTracking.findUnique({
        where: { id: params.id },
        select: { notes: true },
      })
      let nextNotes = typeof cargoData.notes === 'string' ? cargoData.notes : currentCargo?.notes
      const updateData: Record<string, any> = {
        ...cargoData,
        recordStatus: cargoData.recordStatus
          ? (recordStatusMap[String(cargoData.recordStatus).toLowerCase()] || String(cargoData.recordStatus).toUpperCase())
          : undefined,
        sentDate: cargoData.sentDate ? new Date(cargoData.sentDate) : undefined,
        deliveredDate: cargoData.deliveredDate ? new Date(cargoData.deliveredDate) : undefined,
        type: cargoData.type ? (typeMap[cargoData.type.toLowerCase()] || cargoData.type.toUpperCase()) : undefined,
        status: cargoData.status ? (statusMap[cargoData.status.toLowerCase()] || cargoData.status.toUpperCase()) : undefined,
        destination: cargoData.destination ? (destinationMap[cargoData.destination.toLowerCase()] || cargoData.destination.toUpperCase()) : undefined,
      }

      const nextRecordStatus = String(cargoData.recordStatus || '').toLowerCase()
      if (nextRecordStatus === 'device_repair') {
        nextNotes = appendCargoRepairHistory(
          nextNotes || '',
          {
            at: new Date().toISOString(),
            action: 'Kayit cihaz tamiri durumuna alindi',
          },
          {
            active: true,
            status: 'in_progress',
          }
        )
        updateData.notes = nextNotes
      } else if (nextRecordStatus === 'open' || nextRecordStatus === 'closed') {
        const { meta } = parseCargoRepairMeta(nextNotes || '')
        if (meta) {
          updateData.notes = upsertCargoRepairMeta(nextNotes, {
            active: false,
            status: nextRecordStatus === 'closed' ? 'completed' : 'pending',
          })
        }
      }

      let cargo
      try {
        cargo = await (tx.cargoTracking as any).update({
          where: { id: params.id },
          data: updateData,
        })
      } catch (error) {
        if (!isUnknownRecordStatusArg(error)) throw error

        delete updateData.recordStatus
        cargo = await tx.cargoTracking.update({
          where: { id: params.id },
          data: updateData,
        })
      }

      if (Array.isArray(devices)) {
        await tx.cargoDevice.deleteMany({
          where: { cargoId: params.id },
        })

        await tx.cargoDevice.createMany({
          data: devices.map((device: any) => ({
            cargoId: params.id,
            deviceName: device.deviceName,
            model: device.model,
            serialNumber: device.serialNumber,
            quantity: device.quantity || 1,
            condition:
              (conditionMap[String(device.condition || '').toLowerCase()] ||
                String(device.condition || 'NEW').toUpperCase()) as any,
            purpose:
              (purposeMap[String(device.purpose || '').toLowerCase()] ||
                String(device.purpose || 'INSTALLATION').toUpperCase()) as any,
          })),
        })
      }

      return tx.cargoTracking.findUnique({
        where: { id: params.id },
        include: { devices: true },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating cargo:', error)
    return NextResponse.json(
      {
        error: 'Failed to update cargo',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
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
      {
        error: 'Failed to delete cargo',
        details: process.env.NODE_ENV === 'production'
          ? undefined
          : (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    )
  }
}
