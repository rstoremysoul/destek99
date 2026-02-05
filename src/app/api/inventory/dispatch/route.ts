import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { EquivalentDeviceStatus, EquivalentLocation } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { deviceIds, targetLocationId, notes, assignedToName } = body

        if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0 || !targetLocationId) {
            return NextResponse.json(
                { error: 'Device IDs (array) and Target Location ID are required' },
                { status: 400 }
            )
        }

        // 1. Get target location details (to check type and name)
        const targetLocation = await prisma.location.findUnique({
            where: { id: targetLocationId }
        })

        if (!targetLocation) {
            return NextResponse.json(
                { error: 'Target location not found' },
                { status: 404 }
            )
        }

        // Determine new status based on location type
        let newStatus: EquivalentDeviceStatus = EquivalentDeviceStatus.AVAILABLE
        const locType = targetLocation.type
        if (locType === 'INSTALLATION_TEAM') {
            newStatus = EquivalentDeviceStatus.IN_USE
        } else if (locType === 'SERVICE_CENTER') {
            newStatus = EquivalentDeviceStatus.IN_MAINTENANCE
        }

        // 2. Perform Transaction: Update Devices + Create History for each
        const result = await prisma.$transaction(async (tx) => {
            const results = []

            for (const deviceId of deviceIds) {
                // Get current device state for history
                const device = await tx.equivalentDevice.findUnique({
                    where: { id: deviceId }
                })

                if (!device) continue; // Skip if not found

                const newLocEnum = mapLocationTypeToEquivalentLocation(locType)

                // Update Device using connect for relation
                const updatedDevice = await tx.equivalentDevice.update({
                    where: { id: deviceId },
                    data: {
                        location: { connect: { id: targetLocationId } },
                        currentLocation: newLocEnum,
                        status: newStatus,
                    }
                })

                // Create History
                await tx.equivalentDeviceHistory.create({
                    data: {
                        device: { connect: { id: deviceId } },
                        previousLocation: device.currentLocation,
                        newLocation: newLocEnum,
                        previousStatus: device.status,
                        newStatus: newStatus,
                        assignedToName: assignedToName || targetLocation.name,
                        notes: notes || `Sevk edildi: ${targetLocation.name}`,
                        changedBy: 'USER',
                        changedByName: 'Kullanıcı',
                    }
                })

                results.push(updatedDevice)
            }

            return results
        })

        return NextResponse.json({ success: true, count: result.length })
    } catch (error) {
        console.error('Dispatch error:', error)
        return NextResponse.json(
            { error: 'Failed to dispatch devices' },
            { status: 500 }
        )
    }
}

// Helper to map LocationType to EquivalentLocation
function mapLocationTypeToEquivalentLocation(type: string | null): any {
    // EquivalentLocation: IN_WAREHOUSE, WITH_TEAM, AT_CUSTOMER, IN_REPAIR, LOST, SOLD
    switch (type) {
        case 'WAREHOUSE':
        case 'HEADQUARTERS':
        case 'BRANCH':
            return 'IN_WAREHOUSE'
        case 'INSTALLATION_TEAM':
            return 'WITH_TEAM'
        case 'CUSTOMER':
            return 'AT_CUSTOMER'
        case 'TECHNICAL_SERVICE':
        case 'SERVICE_CENTER':
            return 'IN_REPAIR'
        default:
            return 'IN_WAREHOUSE'
    }
}
