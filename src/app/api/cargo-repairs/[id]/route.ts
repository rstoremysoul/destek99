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
      approvalStatus,
      approvalNote,
      laborCost,
      partsCost,
      distributorCost,
      internalServiceCost,
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

    const normalizedApprovalStatus =
      approvalStatus === 'approved' || approvalStatus === 'rejected' ? approvalStatus : 'pending'
    const normalizedApprovalNote = String(approvalNote || '').trim()
    const normalizedLaborCost = typeof laborCost === 'number' ? laborCost : 0
    const normalizedPartsCost = typeof partsCost === 'number' ? partsCost : 0
    const normalizedDistributorCost = typeof distributorCost === 'number' ? distributorCost : 0
    const normalizedInternalServiceCost = typeof internalServiceCost === 'number' ? internalServiceCost : 0
    const normalizedTotalCost =
      typeof totalCost === 'number'
        ? totalCost
        : normalizedLaborCost + normalizedPartsCost + normalizedDistributorCost + normalizedInternalServiceCost

    if (action === 'complete' && normalizedApprovalStatus === 'rejected' && !normalizedApprovalNote) {
      return NextResponse.json({ error: 'Onay reddedildi secildiginde aciklama notu zorunludur' }, { status: 400 })
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
      approvalStatus: normalizedApprovalStatus,
      approvalAt: normalizedApprovalStatus === 'pending' ? '' : new Date().toISOString(),
      approvalNote: normalizedApprovalNote,
      laborCost: normalizedLaborCost,
      partsCost: normalizedPartsCost,
      distributorCost: normalizedDistributorCost,
      internalServiceCost: normalizedInternalServiceCost,
      totalCost: normalizedTotalCost,
      shipmentStatus: 'pending',
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
        const approvalStatusText =
          normalizedApprovalStatus === 'approved'
            ? 'Musteri onayi alindi'
            : normalizedApprovalStatus === 'rejected'
              ? 'Musteri reddetti - tamirsiz iade'
              : 'Onay bilgisi belirtilmedi'
        const approvalLine = normalizedApprovalNote ? `\nOnay Notu: ${normalizedApprovalNote}` : ''

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
            status: normalizedApprovalStatus === 'rejected' ? RepairStatus.UNREPAIRABLE : RepairStatus.COMPLETED,
            priority: Priority.MEDIUM,
            problemDescription:
              String(repairNote || '').trim() ||
              (normalizedApprovalStatus === 'rejected'
                ? `Musteri onayi reddedildi - tamirsiz iade (${cargo.trackingNumber})`
                : `Kargo tamir kaydi (${cargo.trackingNumber})`),
            diagnosisNotes: `Kargo ticket: ${cargo.trackingNumber} | Teknisyen: ${technicianName || '-'} | Islemler: ${operationsText} | Onay: ${approvalStatusText}`,
            repairNotes: `${marker}\nTeknisyen: ${technicianName || '-'}\nIslemler: ${operationsText}\nYedek Parcalar: ${sparePartsText}\nOnay: ${approvalStatusText}${approvalLine}\nNot: ${repairNote || '-'}\nToplam Maliyet: ${normalizedTotalCost.toFixed(2)} TL`,
            isWarranty: false,
            warrantyInfo: null,
            laborCost: normalizedLaborCost,
            partsCost: normalizedPartsCost,
            distributorCost: normalizedDistributorCost,
            internalServiceCost: normalizedInternalServiceCost,
            totalCost: normalizedTotalCost,
            repairCost: normalizedTotalCost,
            technicianId: technicianId || null,
          },
        })
      }

      nextNotes = appendCargoRepairHistory(
        nextNotes,
        {
          at: new Date().toISOString(),
          action: normalizedApprovalStatus === 'rejected' ? 'Musteri onayi reddedildi, tamirsiz iade icin kayit kapatildi' : 'Cihaz onarimi tamamlandi',
          technicianName: technicianName || '',
          operations: Array.isArray(operations) ? operations : [],
          note: repairNote || '',
          approvalStatus: normalizedApprovalStatus,
          approvalNote: normalizedApprovalNote,
          laborCost: normalizedLaborCost,
          partsCost: normalizedPartsCost,
          distributorCost: normalizedDistributorCost,
          internalServiceCost: normalizedInternalServiceCost,
          totalCost: normalizedTotalCost,
        },
        {
          active: false,
          status: 'completed',
          shipmentStatus: 'ready_to_ship',
          approvalStatus: normalizedApprovalStatus,
          approvalAt: normalizedApprovalStatus === 'pending' ? '' : new Date().toISOString(),
          approvalNote: normalizedApprovalNote,
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
          approvalStatus: normalizedApprovalStatus,
          approvalNote: normalizedApprovalNote,
          laborCost: normalizedLaborCost,
          partsCost: normalizedPartsCost,
          distributorCost: normalizedDistributorCost,
          internalServiceCost: normalizedInternalServiceCost,
          totalCost: normalizedTotalCost,
        },
        {
          active: true,
          status: 'in_progress',
          approvalStatus: normalizedApprovalStatus,
          approvalAt: normalizedApprovalStatus === 'pending' ? '' : new Date().toISOString(),
          approvalNote: normalizedApprovalNote,
          shipmentStatus: 'pending',
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
      recordStatus: action === 'complete' ? 'ready_to_ship' : 'device_repair',
      devices: updated.devices,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('Error updating cargo repair detail:', error)
    return NextResponse.json({ error: 'Failed to update cargo repair detail' }, { status: 500 })
  }
}
