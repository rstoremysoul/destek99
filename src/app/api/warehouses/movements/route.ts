import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET warehouse movements (device history)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const warehouseId = searchParams.get('warehouseId')
        const type = searchParams.get('type') // 'incoming', 'outgoing', 'all'
        const limit = parseInt(searchParams.get('limit') || '100')

        // Build where clause based on filters
        let whereClause: any = {}

        if (warehouseId) {
            if (type === 'incoming') {
                // Devices that came INTO this warehouse
                whereClause.newLocationId = warehouseId
            } else if (type === 'outgoing') {
                // Devices that LEFT this warehouse
                whereClause.previousLocationId = warehouseId
            } else {
                // All movements involving this warehouse
                whereClause.OR = [
                    { newLocationId: warehouseId },
                    { previousLocationId: warehouseId }
                ]
            }
        }

        const movements = await prisma.equivalentDeviceHistory.findMany({
            where: whereClause,
            include: {
                device: {
                    select: {
                        id: true,
                        deviceNumber: true,
                        deviceName: true,
                        brand: true,
                        model: true,
                        serialNumber: true,
                        status: true,
                        currentLocation: true,
                    }
                }
            },
            orderBy: { changedAt: 'desc' },
            take: limit
        })

        // Enrich with location names
        const locationIds = new Set<string>()
        movements.forEach(m => {
            if (m.previousLocationId) locationIds.add(m.previousLocationId)
            if (m.newLocationId) locationIds.add(m.newLocationId)
        })

        const locations = await prisma.location.findMany({
            where: { id: { in: Array.from(locationIds) } },
            select: { id: true, name: true, type: true }
        })

        const locationMap = new Map(locations.map(l => [l.id, l]))

        const enrichedMovements = movements.map(m => ({
            ...m,
            previousLocationName: m.previousLocationId ? locationMap.get(m.previousLocationId)?.name : null,
            previousLocationType: m.previousLocationId ? locationMap.get(m.previousLocationId)?.type : null,
            newLocationName: m.newLocationId ? locationMap.get(m.newLocationId)?.name : null,
            newLocationType: m.newLocationId ? locationMap.get(m.newLocationId)?.type : null,
        }))

        return NextResponse.json(enrichedMovements)
    } catch (error) {
        console.error('Error fetching warehouse movements:', error)
        return NextResponse.json(
            { error: 'Failed to fetch warehouse movements' },
            { status: 500 }
        )
    }
}
