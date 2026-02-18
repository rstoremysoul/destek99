import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'
import { Priority, RepairStatus } from '@prisma/client'

const UNKNOWN_PHONE = '-'

function sanitizeRepairNumberPart(value: string) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-8)
}

export async function GET(
  _request: NextRequest,
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
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    const { cleanNotes, meta } = parseCargoRepairMeta(cargo.notes)

    return NextResponse.json({
      id: cargo.id,
      trackingNumber: cargo.trackingNumber,
      sender: cargo.sender,
      receiver: cargo.receiver,
      cargoCompany: cargo.cargoCompany || '',
      recordStatus: meta?.active ? 'device_repair' : String(cargo.recordStatus).toLowerCase(),
      notes: cleanNotes,
      devices: cargo.devices,
      repair: meta,
      createdAt: cargo.createdAt,
      updatedAt: cargo.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching cargo repair detail:', error)
    return NextResponse.json({ error: 'Failed to fetch cargo repair detail' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      technicianId,
      technicianName,
      operations,
      imageUrl,
      repairNote,
      spareParts,
      laborCost,
      partsCost,
      totalCost,
      action,
    } = body || {}

    const cargo = await prisma.cargoTracking.findUnique({
      where: { id: params.id },
      include: {
        devices: true,
      },
    })

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    let nextNotes = upsertCargoRepairMeta(cargo.notes, {
      active: true,
      status: 'in_progress',
      technicianId: technicianId || '',
      technicianName: technicianName || '',
      operations: Array.isArray(operations) ? operations : [],
      imageUrl: imageUrl || '',
      note: repairNote || '',
      spareParts: Array.isArray(spareParts) ? spareParts : [],
      laborCost: typeof laborCost === 'number' ? laborCost : 0,
      partsCost: typeof partsCost === 'number' ? partsCost : 0,
      totalCost: typeof totalCost === 'number' ? totalCost : 0,
    })

    if (action === 'complete') {
      const companyName = String(cargo.sender || '').trim() || 'Kargo Musterisi'
      const customerName = String(cargo.sender || '').trim() || 'Kargo Musterisi'
      const timestampSuffix = Date.now().toString().slice(-6)

      let company = await prisma.company.findFirst({
        where: { name: companyName },
      })
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName },
        })
      }

      let customer = await prisma.customer.findFirst({
        where: { name: customerName, companyId: company.id },
      })
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            phone: UNKNOWN_PHONE,
            companyId: company.id,
          },
        })
      }

      for (let i = 0; i < cargo.devices.length; i++) {
        const device = cargo.devices[i]
        const marker = `[CARGO_REPAIR:${cargo.id}:${device.id}]`

        const alreadyCreated = await prisma.deviceRepair.findFirst({
          where: {
            repairNotes: { contains: marker },
          },
          select: { id: true },
        })

        if (alreadyCreated) continue

        const repairNumber = `CR-${sanitizeRepairNumberPart(cargo.trackingNumber)}-${timestampSuffix}${String(i + 1).padStart(2, '0')}`
        const operationsText = Array.isArray(operations) && operations.length > 0
          ? operations.join(', ')
          : 'Belirtilmedi'
        const sparePartsText = Array.isArray(spareParts) && spareParts.length > 0
          ? spareParts.map((p: any) => `${p.name || '-'} x${Number(p.quantity) || 0} (${Number(p.unitCost || 0).toFixed(2)} TL)`).join(' | ')
          : 'Parca kullanilmadi'

        await prisma.deviceRepair.create({
          data: {
            repairNumber,
            companyId: company.id,
            customerId: customer.id,
            deviceName: device.deviceName || 'Bilinmeyen Cihaz',
            model: device.model || '-',
            serialNumber: device.serialNumber || `${cargo.trackingNumber}-${i + 1}`,
            brand: null,
            receivedDate: cargo.createdAt,
            completedDate: new Date(),
            estimatedCompletion: null,
            status: RepairStatus.COMPLETED,
            priority: Priority.MEDIUM,
            problemDescription: String(repairNote || '').trim() || `Kargo tamir kaydi (${cargo.trackingNumber})`,
            diagnosisNotes: `Kargo ticket: ${cargo.trackingNumber} | Teknisyen: ${technicianName || '-'} | Islemler: ${operationsText}`,
            repairNotes: `${marker}\nTeknisyen: ${technicianName || '-'}\nIslemler: ${operationsText}\nYedek Parcalar: ${sparePartsText}\nNot: ${repairNote || '-'}\nToplam Maliyet: ${(typeof totalCost === 'number' ? totalCost : 0).toFixed(2)} TL`,
            isWarranty: false,
            warrantyInfo: null,
            laborCost: typeof laborCost === 'number' ? laborCost : 0,
            partsCost: typeof partsCost === 'number' ? partsCost : 0,
            totalCost: typeof totalCost === 'number' ? totalCost : 0,
            repairCost: typeof totalCost === 'number' ? totalCost : 0,
            technicianId: technicianId || null,
          },
        })
      }

      nextNotes = appendCargoRepairHistory(
        nextNotes,
        {
          at: new Date().toISOString(),
          action: 'Cihaz onarimi tamamlandi',
          technicianName: technicianName || '',
          operations: Array.isArray(operations) ? operations : [],
          note: repairNote || '',
          laborCost: typeof laborCost === 'number' ? laborCost : 0,
          partsCost: typeof partsCost === 'number' ? partsCost : 0,
          totalCost: typeof totalCost === 'number' ? totalCost : 0,
        },
        {
          active: false,
          status: 'completed',
        }
      )
    } else {
      nextNotes = appendCargoRepairHistory(
        nextNotes,
        {
          at: new Date().toISOString(),
          action: 'Cihaz tamiri kaydi guncellendi',
          technicianName: technicianName || '',
          operations: Array.isArray(operations) ? operations : [],
          note: repairNote || '',
          laborCost: typeof laborCost === 'number' ? laborCost : 0,
          partsCost: typeof partsCost === 'number' ? partsCost : 0,
          totalCost: typeof totalCost === 'number' ? totalCost : 0,
        },
        {
          active: true,
          status: 'in_progress',
        }
      )
    }

    const updated = await prisma.cargoTracking.update({
      where: { id: params.id },
      data: {
        notes: nextNotes,
        recordStatus: action === 'complete' ? 'OPEN' : 'ON_HOLD',
      },
      include: {
        devices: true,
      },
    })

    const { cleanNotes, meta } = parseCargoRepairMeta(updated.notes)

    return NextResponse.json({
      id: updated.id,
      trackingNumber: updated.trackingNumber,
      notes: cleanNotes,
      repair: meta,
      recordStatus: action === 'complete' ? 'open' : 'device_repair',
      devices: updated.devices,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('Error updating cargo repair detail:', error)
    return NextResponse.json({ error: 'Failed to update cargo repair detail' }, { status: 500 })
  }
}
