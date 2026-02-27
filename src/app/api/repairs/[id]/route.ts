import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { CargoDestination, CargoStatus, CargoType } from '@prisma/client'
import { upsertCargoRepairMeta } from '@/lib/cargo-repair'

function isClosedRepairStatus(status: string | null | undefined) {
  return status === 'COMPLETED' || status === 'UNREPAIRABLE'
}

function extractCargoIdFromText(value?: string | null) {
  if (!value) return null
  const match = value.match(/\[CARGO:([^\]]+)\]/)
  return match ? match[1] : null
}

function extractVendorProductIdFromText(value?: string | null) {
  if (!value) return null
  const match = value.match(/\[VENDOR_PRODUCT:([^\]]+)\]/)
  return match ? match[1] : null
}

function extractCargoIdFromRepair(repairNotes?: string | null, diagnosisNotes?: string | null) {
  return extractCargoIdFromText(repairNotes) || extractCargoIdFromText(diagnosisNotes)
}

function extractVendorProductIdFromRepair(repairNotes?: string | null, diagnosisNotes?: string | null) {
  return extractVendorProductIdFromText(repairNotes) || extractVendorProductIdFromText(diagnosisNotes)
}

async function generateUniqueOutgoingTrackingNumber(tx: any) {
  for (let i = 0; i < 8; i++) {
    const candidate = `TS-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 90 + 10)}`
    const exists = await tx.cargoTracking.findUnique({
      where: { trackingNumber: candidate },
      select: { id: true },
    })
    if (!exists) return candidate
  }
  return `TS-${Date.now()}`
}

// GET single repair by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await prisma.deviceRepair.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        customer: true,
        technician: true,
      },
    })

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair not found' },
        { status: 404 }
      )
    }

    const outgoingMarker = `[AUTO_OUTGOING_FROM_REPAIR:${repair.id}]`
    const relatedOutgoingCargo = await prisma.cargoTracking.findFirst({
      where: {
        type: CargoType.OUTGOING,
        notes: { contains: outgoingMarker },
      },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        recordStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ...repair,
      relatedOutgoingCargo,
    })
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repair' },
      { status: 500 }
    )
  }
}

// PATCH update repair
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { assignedTechnician, technicianId: bodyTechnicianId, ...rest } = body || {}
    const normalizedAssignedTechnician = typeof assignedTechnician === 'string' ? assignedTechnician : undefined

    const repair = await prisma.deviceRepair.update({
      where: { id: params.id },
      data: {
        ...rest,
        technicianId: normalizedAssignedTechnician !== undefined
          ? (normalizedAssignedTechnician || null)
          : (bodyTechnicianId !== undefined ? (bodyTechnicianId || null) : undefined),
        receivedDate: rest.receivedDate ? new Date(rest.receivedDate) : undefined,
        completedDate: rest.completedDate ? new Date(rest.completedDate) : undefined,
        estimatedCompletion: rest.estimatedCompletion ? new Date(rest.estimatedCompletion) : undefined,
        status: rest.status?.toUpperCase(),
        priority: rest.priority?.toUpperCase(),
      },
      include: {
        company: true,
        customer: true,
        technician: true,
      },
    })

    const cargoId = extractCargoIdFromRepair(repair.repairNotes, repair.diagnosisNotes)
    const vendorProductId = extractVendorProductIdFromRepair(repair.repairNotes, repair.diagnosisNotes)

    if (cargoId && !vendorProductId) {
      const linkedRepairs = await prisma.deviceRepair.findMany({
        where: {
          OR: [
            { repairNotes: { contains: `[CARGO:${cargoId}]` } },
            { diagnosisNotes: { contains: `[CARGO:${cargoId}]` } },
          ],
        },
        select: {
          status: true,
        },
      })

      const anyOpen = linkedRepairs.some((item) => !isClosedRepairStatus(item.status))
      const anyClosed = linkedRepairs.some((item) => isClosedRepairStatus(item.status))

      await prisma.cargoTracking.update({
        where: { id: cargoId },
        data: {
          recordStatus: anyOpen ? 'ON_HOLD' : (anyClosed ? 'OPEN' : undefined),
        },
      }).catch(() => undefined)
    }

    if (vendorProductId && isClosedRepairStatus(repair.status)) {
      await prisma.$transaction(async (tx) => {
        const marker = `[AUTO_OUTGOING_FROM_REPAIR:${repair.id}]`
        const alreadyExists = await tx.cargoTracking.findFirst({
          where: {
            type: CargoType.OUTGOING,
            notes: { contains: marker },
          },
          select: { id: true },
        })
        if (alreadyExists) return

        const vendorProduct = await tx.vendorProduct.findUnique({
          where: { id: vendorProductId },
          include: { vendor: true },
        })
        if (!vendorProduct) return

        const linkedCargoId = extractCargoIdFromText(vendorProduct.notes)
        const linkedCargo = linkedCargoId
          ? await tx.cargoTracking.findUnique({
              where: { id: linkedCargoId },
              select: {
                sender: true,
                receiver: true,
                destinationAddress: true,
                cargoCompany: true,
              },
            })
          : null

        const outgoingNotes = upsertCargoRepairMeta(
          [
            marker,
            `[VENDOR_PRODUCT:${vendorProduct.id}]`,
            `[REPAIR:${repair.id}]`,
            'Kaynak: Teknik Servis',
          ].join('\n'),
          {
            active: false,
            status: 'completed',
            shipmentStatus: 'ready_to_ship',
          }
        )

        const trackingNumber = await generateUniqueOutgoingTrackingNumber(tx)
        await tx.cargoTracking.create({
          data: {
            trackingNumber,
            type: CargoType.OUTGOING,
            status: CargoStatus.IN_TRANSIT,
            recordStatus: 'OPEN',
            sender: linkedCargo?.receiver || 'Merkez Ofis Deposu',
            receiver: linkedCargo?.sender || vendorProduct.vendor.name || 'Musteri',
            cargoCompany: linkedCargo?.cargoCompany || '',
            sentDate: null,
            deliveredDate: null,
            destination: CargoDestination.CUSTOMER,
            destinationAddress: linkedCargo?.destinationAddress || 'Musteri Adresi',
            notes: outgoingNotes,
            devices: {
              create: [
                {
                  deviceName: repair.deviceName,
                  model: repair.model,
                  serialNumber: repair.serialNumber,
                  quantity: 1,
                  condition: 'USED',
                  purpose: 'RETURN',
                },
              ],
            },
          },
        })
      })
    }

    return NextResponse.json(repair)
  } catch (error) {
    console.error('Error updating repair:', error)
    return NextResponse.json(
      { error: 'Failed to update repair' },
      { status: 500 }
    )
  }
}

// DELETE repair
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.deviceRepair.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repair:', error)
    return NextResponse.json(
      { error: 'Failed to delete repair' },
      { status: 500 }
    )
  }
}
