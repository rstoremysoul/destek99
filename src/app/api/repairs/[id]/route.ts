import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

function isClosedRepairStatus(status: string | null | undefined) {
  return status === 'COMPLETED' || status === 'UNREPAIRABLE'
}

function extractCargoIdFromRepairNotes(notes?: string | null) {
  if (!notes) return null
  const match = notes.match(/\[CARGO:([^\]]+)\]/)
  return match ? match[1] : null
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

    return NextResponse.json(repair)
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

    const cargoId = extractCargoIdFromRepairNotes(repair.repairNotes)
    if (cargoId) {
      const linkedRepairs = await prisma.deviceRepair.findMany({
        where: {
          repairNotes: { contains: `[CARGO:${cargoId}]` },
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
