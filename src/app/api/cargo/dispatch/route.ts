import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'
import { upsertCargoVendorMeta } from '@/lib/cargo-vendor-workflow'

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

    if (String(cargo.recordStatus || '').toUpperCase() === 'CLOSED') {
      return NextResponse.json(
        { error: 'Kapali kargo kaydindan tekrar sevk baslatilamaz' },
        { status: 400 }
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
    const isSupplierTarget = targetLocation.type === 'SUPPLIER'

    const results = await prisma.$transaction(async (tx) => {
      const dispatchedIds: string[] = []
      const skippedSerials: string[] = []
      const vendorProductIds: string[] = []
      let vendorId: string | null = null
      let vendorName: string | null = null

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

        if (isSupplierTarget) {
          let vendor = await tx.vendor.findFirst({
            where: { name: targetLocation.name },
            select: { id: true, name: true },
          })

          if (!vendor) {
            vendor = await tx.vendor.create({
              data: {
                name: targetLocation.name,
                type: 'DISTRIBUTOR',
                address: targetLocation.address || null,
                contactPerson: null,
                active: true,
                notes: `Lokasyondan otomatik olusturuldu (${targetLocation.id})`,
              },
              select: { id: true, name: true },
            })
          }

          vendorId = vendor.id
          vendorName = vendor.name

          const createdVendorProduct = await tx.vendorProduct.create({
            data: {
              vendorId: vendor.id,
              deviceName: device.deviceName || 'Bilinmeyen Cihaz',
              model: device.model || '-',
              serialNumber: device.serialNumber,
              problemDescription: `Kargo sevkinden olusan tedarikci kaydi (${cargo.trackingNumber})`,
              currentStatus: 'AT_VENDOR',
              sentDate: new Date(),
              notes: [
                `[CARGO:${cargo.id}]`,
                `[CARGO_DEVICE:${device.id}]`,
                `[CARGO_TRACKING:${cargo.trackingNumber}]`,
                `Kaynak lokasyon: ${targetLocation.name}`,
              ].join('\n'),
            },
            select: { id: true },
          })

          vendorProductIds.push(createdVendorProduct.id)

          await tx.vendorProductStatusHistory.create({
            data: {
              productId: createdVendorProduct.id,
              status: 'AT_VENDOR',
              statusDate: new Date(),
              notes: `Kargo ${cargo.trackingNumber} sevkinden otomatik olusturuldu`,
              updatedBy: 'SYSTEM',
              updatedByName: 'Sistem',
            },
          })
        }
      }

      const parsed = parseCargoRepairMeta(cargo.notes)
      let nextNotes = cargo.notes || ''
      let shouldUpdateCargo = false
      const cargoUpdateData: Record<string, any> = {}

      if (parsed.meta) {
        nextNotes = appendCargoRepairHistory(
          upsertCargoRepairMeta(nextNotes, {
            shipmentStatus: 'shipped',
          }),
          {
            at: new Date().toISOString(),
            action: `Kargo sevk edildi (${targetLocation.name})`,
            note: notes || '',
          }
        )
        shouldUpdateCargo = true
      }

      if (isSupplierTarget) {
        nextNotes = upsertCargoVendorMeta(nextNotes, {
          stage: 'vendor_tracking',
          vendorId: vendorId || undefined,
          vendorName: vendorName || targetLocation.name,
          vendorProductIds,
          targetLocationId: targetLocation.id,
          targetLocationName: targetLocation.name,
          transferredAt: new Date().toISOString(),
        })
        cargoUpdateData.recordStatus = 'CLOSED'
        shouldUpdateCargo = true
      }

      if (shouldUpdateCargo) {
        cargoUpdateData.notes = nextNotes
        await tx.cargoTracking.update({
          where: { id: cargo.id },
          data: cargoUpdateData,
        })
      }

      return {
        dispatchedIds,
        skippedSerials,
        vendorTransfer: isSupplierTarget
          ? {
              vendorId,
              vendorName: vendorName || targetLocation.name,
              vendorProductIds,
            }
          : null,
      }
    })

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
        results.vendorTransfer
          ? `${results.dispatchedIds.length} cihaz tedarikciye sevk edildi, ${results.vendorTransfer.vendorProductIds.length} tedarikci kaydi olusturuldu`
          : results.skippedSerials.length > 0
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
