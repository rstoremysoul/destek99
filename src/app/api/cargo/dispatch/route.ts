import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'

function generateEquivalentDeviceNumber() {
  return `AUTO-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 90 + 10)}`
}

// POST - Dispatch only predefined equivalent devices to a location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cargoId, deviceIds, targetLocationId, notes } = body

    if (!cargoId || !Array.isArray(deviceIds) || deviceIds.length === 0 || !targetLocationId) {
      return NextResponse.json(
        { error: 'Cargo ID, Device IDs (array), and Target Location ID are required' },
        { status: 400 }
      )
    }

    const targetLocation = await prisma.location.findUnique({
      where: { id: targetLocationId },
    })

    if (!targetLocation) {
      return NextResponse.json(
        { error: 'Target location not found' },
        { status: 404 }
      )
    }

    const cargo = await prisma.cargoTracking.findUnique({
      where: { id: cargoId },
      include: { devices: true },
    })

    if (!cargo) {
      return NextResponse.json(
        { error: 'Cargo not found' },
        { status: 404 }
      )
    }

    const selectedDevices = cargo.devices.filter((d) => deviceIds.includes(d.id))
    if (selectedDevices.length === 0) {
      return NextResponse.json(
        { error: 'No matching devices found in cargo' },
        { status: 400 }
      )
    }

    const mapLocationTypeToEquivalentLocation = (
      type: string | null
    ): 'IN_WAREHOUSE' | 'ON_SITE_SERVICE' | 'AT_CUSTOMER' => {
      switch (type) {
        case 'WAREHOUSE':
        case 'HEADQUARTERS':
        case 'BRANCH':
        case 'SUPPLIER':
        case 'TESTING':
        case 'CONSIGNMENT':
          return 'IN_WAREHOUSE'
        case 'INSTALLATION_TEAM':
        case 'SERVICE_CENTER':
        case 'TECHNICAL_SERVICE':
          return 'ON_SITE_SERVICE'
        case 'CUSTOMER':
          return 'AT_CUSTOMER'
        default:
          return 'IN_WAREHOUSE'
      }
    }

    const newLocation = mapLocationTypeToEquivalentLocation(targetLocation.type)

    const results = await prisma.$transaction(async (tx) => {
      const dispatchedIds: string[] = []
      const skippedSerials: string[] = []

      for (const device of selectedDevices) {
        if (!device.serialNumber) {
          skippedSerials.push(`${device.deviceName}/${device.model}`)
          continue
        }

        let equivalentDevice = await tx.equivalentDevice.findUnique({
          where: { serialNumber: device.serialNumber },
        })

        if (!equivalentDevice) {
          // If device is not in equivalent inventory yet, create it automatically.
          equivalentDevice = await tx.equivalentDevice.create({
            data: {
              deviceNumber: generateEquivalentDeviceNumber(),
              deviceName: device.deviceName || 'Bilinmeyen Cihaz',
              brand: 'GENEL',
              model: device.model || '-',
              serialNumber: device.serialNumber,
              locationId: targetLocationId,
              currentLocation: newLocation,
              status: 'AVAILABLE',
              recordStatus: 'OPEN',
              condition: 'GOOD',
              notes: `Kargo ${cargo.trackingNumber} sevk isleminde otomatik olusturuldu`,
              createdBy: 'SYSTEM',
              createdByName: 'Sistem',
            },
          })
        }

        await tx.equivalentDevice.update({
          where: { id: equivalentDevice.id },
          data: {
            locationId: targetLocationId,
            currentLocation: newLocation,
            status: 'AVAILABLE',
          },
        })

        await tx.equivalentDeviceHistory.create({
          data: {
            deviceId: equivalentDevice.id,
            previousLocation: equivalentDevice.currentLocation,
            newLocation,
            previousLocationId: equivalentDevice.locationId,
            newLocationId: targetLocationId,
            assignedToName: targetLocation.name,
            notes: notes || `Kargo ${cargo.trackingNumber} üzerinden sevk edildi`,
            changedBy: 'USER',
            changedByName: 'Kullanıcı',
          },
        })

        dispatchedIds.push(equivalentDevice.id)
      }

      return { dispatchedIds, skippedSerials }
    })

    const parsed = parseCargoRepairMeta(cargo.notes)
    if (parsed.meta) {
      const shippedNotes = appendCargoRepairHistory(
        upsertCargoRepairMeta(cargo.notes, {
          shipmentStatus: 'shipped',
        }),
        {
          at: new Date().toISOString(),
          action: `Kargo sevk edildi (${targetLocation.name})`,
          note: notes || '',
        }
      )

      await prisma.cargoTracking.update({
        where: { id: cargo.id },
        data: { notes: shippedNotes },
      })
    }

    if (results.dispatchedIds.length === 0) {
      return NextResponse.json(
        { error: 'Secilen cihazlar arasinda kayitli muadil cihaz bulunamadi' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      count: results.dispatchedIds.length,
      skippedCount: results.skippedSerials.length,
      skippedSerials: results.skippedSerials,
      message:
        results.skippedSerials.length > 0
          ? `${results.dispatchedIds.length} muadil cihaz sevk edildi, ${results.skippedSerials.length} cihaz atlandi`
          : `${results.dispatchedIds.length} cihaz ${targetLocation.name} lokasyonuna sevk edildi`,
    })
  } catch (error) {
    console.error('Cargo dispatch error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch cargo devices' },
      { status: 500 }
    )
  }
}
