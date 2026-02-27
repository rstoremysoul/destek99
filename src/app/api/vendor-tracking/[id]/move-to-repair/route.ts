import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseVendorWorkflowMeta, upsertVendorWorkflowMeta } from '@/lib/vendor-workflow'

function extractCargoIdFromText(text?: string | null) {
  const match = String(text || '').match(/\[CARGO:([^\]]+)\]/)
  return match?.[1] || null
}

function buildRepairNumber() {
  return `VT-${Date.now().toString().slice(-8)}`
}

async function getHeadquartersLocation(tx: any) {
  return tx.location.findFirst({
    where: {
      active: true,
      OR: [
        { type: 'HEADQUARTERS' },
        { name: { contains: 'Merkez' } },
        { name: { contains: 'Ofis' } },
      ],
    },
    orderBy: { name: 'asc' },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    if (!productId) {
      return NextResponse.json({ error: 'Vendor product ID is required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.vendorProduct.findUnique({
        where: { id: productId },
        include: { vendor: true },
      })

      if (!product) {
        return { error: 'Vendor product not found', status: 404 as const }
      }

      const vendorMeta = parseVendorWorkflowMeta(product.notes)
      if (vendorMeta.meta?.repairId) {
        return {
          success: true,
          repairId: vendorMeta.meta.repairId,
          repairNumber: vendorMeta.meta.repairNumber,
          alreadyMoved: true,
        }
      }

      let company = await tx.company.findFirst({
        where: { name: product.vendor.name },
      })
      if (!company) {
        company = await tx.company.create({
          data: {
            name: product.vendor.name,
            address: product.vendor.address || '',
            phone: product.vendor.contactPhone || '',
            email: product.vendor.contactEmail || '',
          },
        })
      }

      const customerName = 'Tedarikci Teknik Servis'
      let customer = await tx.customer.findFirst({
        where: {
          name: customerName,
          companyId: company.id,
        },
      })
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            phone: product.vendor.contactPhone || '-',
            email: product.vendor.contactEmail || null,
            companyId: company.id,
          },
        })
      }

      const repair = await tx.deviceRepair.create({
        data: {
          repairNumber: buildRepairNumber(),
          companyId: company.id,
          customerId: customer.id,
          deviceName: product.deviceName,
          model: product.model || '-',
          serialNumber: product.serialNumber || `VP-${product.id}`,
          brand: product.brand || null,
          receivedDate: new Date(),
          status: 'RECEIVED',
          priority: 'MEDIUM',
          problemDescription: product.problemDescription || 'Tedarikci kaydindan teknik servise alindi',
          diagnosisNotes: `Kaynak: Tedarikci Takibi\nVendor Product ID: ${product.id}`,
          repairNotes: [
            `[VENDOR_PRODUCT:${product.id}]`,
            product.notes || '',
          ].filter(Boolean).join('\n'),
          isWarranty: false,
        },
        select: {
          id: true,
          repairNumber: true,
        },
      })

      const hq = await getHeadquartersLocation(tx)
      if (hq && product.serialNumber) {
        const matchedDevices = await tx.equivalentDevice.findMany({
          where: { serialNumber: product.serialNumber },
          select: { id: true, currentLocation: true, locationId: true },
        })

        for (const device of matchedDevices) {
          await tx.equivalentDevice.update({
            where: { id: device.id },
            data: {
              locationId: hq.id,
              currentLocation: 'IN_WAREHOUSE',
              status: 'AVAILABLE',
            },
          })

          await tx.equivalentDeviceHistory.create({
            data: {
              deviceId: device.id,
              previousLocation: device.currentLocation,
              newLocation: 'IN_WAREHOUSE',
              previousLocationId: device.locationId || null,
              newLocationId: hq.id,
              assignedToName: hq.name,
              notes: `Tedarikciden teknik servise geri alindi (${product.id})`,
              changedBy: 'SYSTEM',
              changedByName: 'Sistem',
            },
          })
        }
      }

      const updatedNotes = upsertVendorWorkflowMeta(
        `${vendorMeta.notesWithoutMeta}\nDurum: Teknik Servise Devredildi`,
        {
          stage: 'technical_service',
          repairId: repair.id,
          repairNumber: repair.repairNumber,
          transferredAt: new Date().toISOString(),
        }
      )

      await tx.vendorProduct.update({
        where: { id: product.id },
        data: {
          currentStatus: 'COMPLETED',
          receivedDate: new Date(),
          notes: updatedNotes,
        },
      })

      await tx.vendorProductStatusHistory.create({
        data: {
          productId: product.id,
          status: 'COMPLETED',
          statusDate: new Date(),
          notes: `Teknik servise devredildi. Repair: ${repair.repairNumber}`,
          updatedBy: 'SYSTEM',
          updatedByName: 'Sistem',
        },
      })

      const cargoId = extractCargoIdFromText(product.notes)
      if (cargoId) {
        await tx.cargoTracking.update({
          where: { id: cargoId },
          data: { recordStatus: 'ON_HOLD' },
        }).catch(() => undefined)
      }

      return {
        success: true,
        repairId: repair.id,
        repairNumber: repair.repairNumber,
        alreadyMoved: false,
      }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error moving vendor product to repair:', error)
    return NextResponse.json(
      { error: 'Failed to move vendor product to repair' },
      { status: 500 }
    )
  }
}
