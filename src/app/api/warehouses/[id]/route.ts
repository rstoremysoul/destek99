
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_HQ_NAME = 'Merkez Ofis Deposu'

function buildCargoWhereForWarehouse(warehouse: { name: string; type: string | null }) {
  const type = String(warehouse.type || '').toUpperCase()
  const name = String(warehouse.name || '').trim()
  const orConditions: Array<any> = []

  if (name) {
    orConditions.push({ destinationAddress: name })
    orConditions.push({ destinationAddress: { contains: name } })
  }

  if (type === 'HEADQUARTERS') {
    orConditions.push({ destination: 'HEADQUARTERS' })
    orConditions.push({ destinationAddress: DEFAULT_HQ_NAME })
    orConditions.push({ destinationAddress: { contains: 'Merkez Ofis' } })
  }

  if (orConditions.length === 0) {
    return undefined
  }

  return { OR: orConditions }
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const warehouse = await prisma.location.findUnique({
            where: { id: params.id },
            include: {
                assignedDevices: {
                    where: { status: 'AVAILABLE' }, // Or filtered by status
                    orderBy: { deviceName: 'asc' }
                }
            }
        });

        if (!warehouse) {
            return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
        }

        const cargoWhere = buildCargoWhereForWarehouse(warehouse)
        const relatedCargos = cargoWhere
          ? await prisma.cargoTracking.findMany({
              where: cargoWhere,
              include: {
                devices: {
                  select: {
                    id: true,
                    deviceName: true,
                    model: true,
                    serialNumber: true,
                    quantity: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 200,
            })
          : []

        return NextResponse.json({
          ...warehouse,
          relatedCargos,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch warehouse details' }, { status: 500 });
    }
}
