import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'

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
      select: { notes: true, trackingNumber: true },
    })

    if (!cargo) {
      return NextResponse.json({ error: 'Cargo not found' }, { status: 404 })
    }

    let nextNotes = upsertCargoRepairMeta(cargo.notes, {
      active: true,
      status: 'in_progress',
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
