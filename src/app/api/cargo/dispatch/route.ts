import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Priority, RepairStatus } from '@prisma/client'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'
import { upsertCargoVendorMeta } from '@/lib/cargo-vendor-workflow'
import { parseIncomingCargoFlowMeta } from '@/lib/incoming-cargo-flow'
import { ensureSystemWarehouses, getSystemWarehouseKeyByName } from '@/lib/system-warehouses'

const UNKNOWN_PHONE = '-'

function generateEquivalentDeviceNumber() {
  return `AUTO-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 90 + 10)}`
}

function sanitizeRepairNumberPart(value: string) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-8)
}

function getCargoDeviceMarker(cargoId: string, deviceId: string) {
  return `[CARGO:${cargoId}][CARGO_DEVICE:${deviceId}]`
}

function isClosedRepairStatus(status: RepairStatus) {
  return status === RepairStatus.COMPLETED || status === RepairStatus.UNREPAIRABLE
}

function mapLocationTypeToEquivalentLocation(
  type: string | null
): 'IN_WAREHOUSE' | 'ON_SITE_SERVICE' | 'AT_CUSTOMER' {
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

async function ensureCompanyAndCustomer(tx: any, cargo: any) {
  const incomingMeta = parseIncomingCargoFlowMeta(cargo.notes || '').meta
  const companyName = String(
    incomingMeta?.companyName || cargo.sender || 'Kargo Musterisi'
  ).trim() || 'Kargo Musterisi'

  const customerName = String(
    incomingMeta?.branchName || incomingMeta?.companyName || cargo.sender || 'Kargo Musterisi'
  ).trim() || 'Kargo Musterisi'

  let company = await tx.company.findFirst({ where: { name: companyName } })
  if (!company) {
    company = await tx.company.create({ data: { name: companyName } })
  }

  let customer = await tx.customer.findFirst({
    where: { name: customerName, companyId: company.id },
  })

  if (!customer) {
    customer = await tx.customer.create({
      data: {
        name: customerName,
        phone: UNKNOWN_PHONE,
        companyId: company.id,
      },
    })
  }

  return { company, customer }
}

// POST - Dispatch selected incoming cargo devices to a location
export async function POST(request: NextRequest) {
  try {
    await ensureSystemWarehouses(prisma)

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

    const newLocation = mapLocationTypeToEquivalentLocation(targetLocation.type)
    const isSupplierTarget = targetLocation.type === 'SUPPLIER'
    const systemTargetKey = getSystemWarehouseKeyByName(targetLocation.name)

    const results = await prisma.$transaction(async (tx) => {
      const dispatchedIds: string[] = []
      const skippedSerials: string[] = []
      const vendorProductIds: string[] = []
      let vendorId: string | null = null
      let vendorName: string | null = null
      let createdRepairCount = 0
      let existingRepairCount = 0
      let createdTechnicalServiceCount = 0

      const customerBundle =
        systemTargetKey === 'DEVICE_REPAIR' ? await ensureCompanyAndCustomer(tx, cargo) : null

      for (let index = 0; index < selectedDevices.length; index++) {
        const device = selectedDevices[index]
        if (!device.serialNumber) {
          skippedSerials.push(`${device.deviceName}/${device.model}`)
          continue
        }

        let equivalentDevice = await tx.equivalentDevice.findUnique({
          where: { serialNumber: device.serialNumber },
        })

        if (!equivalentDevice) {
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
            notes: notes || `Kargo ${cargo.trackingNumber} uzerinden sevk edildi`,
            changedBy: 'USER',
            changedByName: 'Kullanici',
          },
        })

        dispatchedIds.push(equivalentDevice.id)

        if (systemTargetKey === 'DEVICE_REPAIR' && customerBundle) {
          const marker = getCargoDeviceMarker(cargo.id, device.id)

          const matched = await tx.deviceRepair.findMany({
            where: {
              repairNotes: { contains: marker },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
            },
          })

          const activeTicket = matched.find((item: any) => !isClosedRepairStatus(item.status))
          if (activeTicket) {
            existingRepairCount += 1
          } else {
            const timestampSuffix = Date.now().toString().slice(-6)
            const repairNumber = `CT-${sanitizeRepairNumberPart(cargo.trackingNumber)}-${timestampSuffix}${String(index + 1).padStart(2, '0')}`

            await tx.deviceRepair.create({
              data: {
                repairNumber,
                companyId: customerBundle.company.id,
                customerId: customerBundle.customer.id,
                deviceName: device.deviceName || 'Bilinmeyen Cihaz',
                model: device.model || '-',
                serialNumber: device.serialNumber || `${cargo.trackingNumber}-${index + 1}`,
                brand: null,
                receivedDate: new Date(),
                completedDate: null,
                estimatedCompletion: null,
                status: RepairStatus.RECEIVED,
                priority: Priority.MEDIUM,
                problemDescription: `Kargo cihaz tamiri ticketi (${cargo.trackingNumber})`,
                diagnosisNotes: `${marker}\nKargo Ticketi: ${cargo.trackingNumber}`,
                repairNotes: `${marker}\nKaynak: Kargo Takibi\nTakip No: ${cargo.trackingNumber}\nCihaz: ${device.deviceName} / ${device.model}`,
                isWarranty: false,
                warrantyInfo: null,
                laborCost: 0,
                partsCost: 0,
                distributorCost: 0,
                internalServiceCost: 0,
                totalCost: 0,
                repairCost: 0,
                technicianId: null,
              },
            })

            createdRepairCount += 1
          }
        }

        if (systemTargetKey === 'TECHNICAL_SERVICE') {
          const marker = getCargoDeviceMarker(cargo.id, device.id)
          const existingTech = await tx.technicalService.findFirst({
            where: {
              deviceSerial: device.serialNumber,
              serviceExitDate: null,
              problemDescription: { contains: marker },
            },
            select: { id: true },
          })

          if (!existingTech) {
            await tx.technicalService.create({
              data: {
                operatingPersonnel: 'SYSTEM',
                businessName: String(cargo.sender || 'Kargo Musterisi'),
                deviceName: device.deviceName || 'Bilinmeyen Cihaz',
                model: device.model || '-',
                deviceSerial: device.serialNumber,
                serviceEntryDate: new Date(),
                deviceProblem: `Kargo sevk kaydi (${cargo.trackingNumber})`,
                problemDescription: `${marker}\nKargo ${cargo.trackingNumber} sevkinden teknik servise otomatik acildi`,
                performedAction: 'Beklemede - ilk inceleme',
              },
            })
            createdTechnicalServiceCount += 1
          }
        }

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

      if (createdRepairCount > 0) {
        cargoUpdateData.recordStatus = 'ON_HOLD'
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
        createdRepairCount,
        existingRepairCount,
        createdTechnicalServiceCount,
      }
    })

    if (results.dispatchedIds.length === 0) {
      return NextResponse.json(
        { error: 'Secilen cihazlar arasinda kayitli muadil cihaz bulunamadi' },
        { status: 400 }
      )
    }

    const extraNotes: string[] = []
    if (results.createdRepairCount > 0) {
      extraNotes.push(`${results.createdRepairCount} cihaz tamir kaydi acildi`)
    }
    if (results.createdTechnicalServiceCount > 0) {
      extraNotes.push(`${results.createdTechnicalServiceCount} teknik servis kaydi acildi`)
    }

    const baseMessage = results.vendorTransfer
      ? `${results.dispatchedIds.length} cihaz tedarikciye sevk edildi, ${results.vendorTransfer.vendorProductIds.length} tedarikci kaydi olusturuldu`
      : results.skippedSerials.length > 0
      ? `${results.dispatchedIds.length} muadil cihaz sevk edildi, ${results.skippedSerials.length} cihaz atlandi`
      : `${results.dispatchedIds.length} cihaz ${targetLocation.name} lokasyonuna sevk edildi`

    return NextResponse.json({
      success: true,
      count: results.dispatchedIds.length,
      skippedCount: results.skippedSerials.length,
      skippedSerials: results.skippedSerials,
      createdRepairCount: results.createdRepairCount,
      existingRepairCount: results.existingRepairCount,
      createdTechnicalServiceCount: results.createdTechnicalServiceCount,
      message: extraNotes.length > 0 ? `${baseMessage} (${extraNotes.join(', ')})` : baseMessage,
    })
  } catch (error) {
    console.error('Cargo dispatch error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch cargo devices' },
      { status: 500 }
    )
  }
}
