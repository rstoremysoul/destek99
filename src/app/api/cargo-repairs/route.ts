export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCargoRepairMeta } from '@/lib/cargo-repair'

export async function GET() {
  try {
    const cargos = await prisma.cargoTracking.findMany({
      where: {
        type: 'INCOMING',
      },
      include: {
        devices: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const filtered = cargos
      .map((cargo) => {
        const { meta } = parseCargoRepairMeta(cargo.notes)
        const isRepair = Boolean(meta?.active)
        if (!isRepair) return null

        return {
          id: cargo.id,
          trackingNumber: cargo.trackingNumber,
          sender: cargo.sender,
          receiver: cargo.receiver,
          cargoCompany: cargo.cargoCompany || '',
          recordStatus: 'device_repair',
          devices: cargo.devices,
          technicianName: meta?.technicianName || '',
          operations: meta?.operations || [],
          spareParts: meta?.spareParts || [],
          approvalStatus: meta?.approvalStatus || 'pending',
          approvalAt: meta?.approvalAt || '',
          approvalNote: meta?.approvalNote || '',
          laborCost: meta?.laborCost || 0,
          partsCost: meta?.partsCost || 0,
          distributorCost: meta?.distributorCost || 0,
          internalServiceCost: meta?.internalServiceCost || 0,
          totalCost: meta?.totalCost || 0,
          shipmentStatus: meta?.shipmentStatus || 'pending',
          imageUrl: meta?.imageUrl || '',
          repairNote: meta?.note || '',
          repairHistory: meta?.history || [],
          createdAt: cargo.createdAt,
          updatedAt: cargo.updatedAt,
        }
      })
      .filter(Boolean)

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error fetching cargo repairs:', error)
    return NextResponse.json({ error: 'Failed to fetch cargo repairs' }, { status: 500 })
  }
}

