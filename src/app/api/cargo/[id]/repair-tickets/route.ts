import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Priority, RepairStatus } from '@prisma/client'

const UNKNOWN_PHONE = '-'

function sanitizeRepairNumberPart(value: string) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-8)
}

function isClosedRepairStatus(status: RepairStatus) {
  return status === RepairStatus.COMPLETED || status === RepairStatus.UNREPAIRABLE
}

function getCargoDeviceMarker(cargoId: string, deviceId: string) {
  return `[CARGO:${cargoId}][CARGO_DEVICE:${deviceId}]`
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const deviceIds: string[] = Array.isArray(body?.deviceIds) ? body.deviceIds : []

    if (deviceIds.length === 0) {
      return NextResponse.json({ error: 'Tamir ticketi icin en az bir cihaz secilmelidir' }, { status: 400 })
    }

    const cargo = await prisma.cargoTracking.findUnique({
      where: { id: params.id },
      include: { devices: true },
    })

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    const selectedDevices = cargo.devices.filter((d) => deviceIds.includes(d.id))
    if (selectedDevices.length === 0) {
      return NextResponse.json({ error: 'Secilen cihazlar kargo kaydinda bulunamadi' }, { status: 400 })
    }

    const companyName = String(cargo.sender || '').trim() || 'Kargo Musterisi'
    const customerName = String(cargo.sender || '').trim() || 'Kargo Musterisi'

    const result = await prisma.$transaction(async (tx) => {
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

      const created: Array<{ id: string; repairNumber: string; cargoDeviceId: string }> = []
      const existing: Array<{ id: string; repairNumber: string; cargoDeviceId: string }> = []

      for (let i = 0; i < selectedDevices.length; i++) {
        const device = selectedDevices[i]
        const marker = getCargoDeviceMarker(cargo.id, device.id)

        const matched = await tx.deviceRepair.findMany({
          where: {
            repairNotes: { contains: marker },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            repairNumber: true,
            status: true,
          },
        })

        const activeTicket = matched.find((item) => !isClosedRepairStatus(item.status))
        if (activeTicket) {
          existing.push({
            id: activeTicket.id,
            repairNumber: activeTicket.repairNumber,
            cargoDeviceId: device.id,
          })
          continue
        }

        const timestampSuffix = Date.now().toString().slice(-6)
        const repairNumber = `CT-${sanitizeRepairNumberPart(cargo.trackingNumber)}-${timestampSuffix}${String(i + 1).padStart(2, '0')}`

        const createdTicket = await tx.deviceRepair.create({
          data: {
            repairNumber,
            companyId: company.id,
            customerId: customer.id,
            deviceName: device.deviceName || 'Bilinmeyen Cihaz',
            model: device.model || '-',
            serialNumber: device.serialNumber || `${cargo.trackingNumber}-${i + 1}`,
            brand: null,
            receivedDate: new Date(),
            completedDate: null,
            estimatedCompletion: null,
            status: RepairStatus.RECEIVED,
            priority: Priority.MEDIUM,
            problemDescription: `Kargo cihaz tamiri ticketi (${cargo.trackingNumber})`,
            diagnosisNotes: `Kargo Ticketi: ${cargo.trackingNumber}`,
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
          select: {
            id: true,
            repairNumber: true,
          },
        })

        created.push({
          id: createdTicket.id,
          repairNumber: createdTicket.repairNumber,
          cargoDeviceId: device.id,
        })
      }

      if (created.length > 0) {
        await tx.cargoTracking.update({
          where: { id: cargo.id },
          data: { recordStatus: 'ON_HOLD' },
        })
      }

      return { created, existing }
    })

    return NextResponse.json({
      createdCount: result.created.length,
      existingCount: result.existing.length,
      created: result.created,
      existing: result.existing,
      message:
        result.created.length > 0
          ? `${result.created.length} cihaz icin tamir ticketi olusturuldu`
          : 'Secilen cihazlar icin zaten acik ticket bulunuyor',
    })
  } catch (error) {
    console.error('Error creating cargo repair tickets:', error)
    return NextResponse.json({ error: 'Failed to create cargo repair tickets' }, { status: 500 })
  }
}
