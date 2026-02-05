import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Dispatch cargo devices to a warehouse/location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cargoId, deviceIds, targetLocationId, notes } = body

        if (!cargoId || !deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0 || !targetLocationId) {
            return NextResponse.json(
                { error: 'Cargo ID, Device IDs (array), and Target Location ID are required' },
                { status: 400 }
            )
        }

        // Get target location
        const targetLocation = await prisma.location.findUnique({
            where: { id: targetLocationId }
        })

        if (!targetLocation) {
            return NextResponse.json(
                { error: 'Target location not found' },
                { status: 404 }
            )
        }

        // Get the cargo with its devices
        const cargo = await prisma.cargoTracking.findUnique({
            where: { id: cargoId },
            include: { devices: true }
        })

        if (!cargo) {
            return NextResponse.json(
                { error: 'Cargo not found' },
                { status: 404 }
            )
        }

        // Filter to only the selected devices
        const selectedDevices = cargo.devices.filter(d => deviceIds.includes(d.id))

        if (selectedDevices.length === 0) {
            return NextResponse.json(
                { error: 'No matching devices found in cargo' },
                { status: 400 }
            )
        }

        // Determine the EquivalentLocation based on LocationType
        // Valid values: IN_WAREHOUSE, ON_SITE_SERVICE, AT_CUSTOMER
        const mapLocationTypeToEquivalentLocation = (type: string | null): 'IN_WAREHOUSE' | 'ON_SITE_SERVICE' | 'AT_CUSTOMER' => {
            switch (type) {
                case 'WAREHOUSE':
                case 'HEADQUARTERS':
                case 'BRANCH':
                case 'SUPPLIER':
                case 'TESTING':
                case 'CONSIGNMENT':
                    return 'IN_WAREHOUSE'
                case 'INSTALLATION_TEAM':
                case 'SERVICE_CENTER':
                case 'TECHNICAL_SERVICE':
                    return 'ON_SITE_SERVICE'
                case 'CUSTOMER':
                    return 'AT_CUSTOMER'
                default:
                    return 'IN_WAREHOUSE'
            }
        }

        const newLocation = mapLocationTypeToEquivalentLocation(targetLocation.type)

        // Process each selected cargo device
        const results = await prisma.$transaction(async (tx) => {
            const createdDevices = []

            for (const device of selectedDevices) {
                // Check if an equivalent device with this serial already exists
                let equivalentDevice = null

                if (device.serialNumber) {
                    equivalentDevice = await tx.equivalentDevice.findUnique({
                        where: { serialNumber: device.serialNumber }
                    })
                }

                if (equivalentDevice) {
                    // Update existing device
                    const updated = await tx.equivalentDevice.update({
                        where: { id: equivalentDevice.id },
                        data: {
                            locationId: targetLocationId,
                            currentLocation: newLocation,
                            status: 'AVAILABLE',
                        }
                    })

                    // Create history
                    await tx.equivalentDeviceHistory.create({
                        data: {
                            deviceId: equivalentDevice.id,
                            previousLocation: equivalentDevice.currentLocation,
                            newLocation: newLocation,
                            assignedToName: targetLocation.name,
                            notes: notes || `Kargo ${cargo.trackingNumber} üzerinden sevk edildi`,
                            changedBy: 'USER',
                            changedByName: 'Kullanıcı',
                        }
                    })

                    createdDevices.push(updated)
                } else {
                    // Create new equivalent device
                    const newDev = await tx.equivalentDevice.create({
                        data: {
                            deviceNumber: `DEV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                            deviceName: device.deviceName,
                            brand: 'Bilinmiyor',
                            model: device.model,
                            serialNumber: device.serialNumber || `SN-${Date.now()}`,
                            locationId: targetLocationId,
                            currentLocation: newLocation,
                            status: 'AVAILABLE',
                            condition: 'GOOD',
                        }
                    })

                    // Create history
                    await tx.equivalentDeviceHistory.create({
                        data: {
                            deviceId: newDev.id,
                            previousLocation: 'IN_WAREHOUSE',
                            newLocation: newLocation,
                            assignedToName: targetLocation.name,
                            notes: notes || `Kargo ${cargo.trackingNumber} üzerinden sevk edildi - Yeni kayıt`,
                            changedBy: 'USER',
                            changedByName: 'Kullanıcı',
                        }
                    })

                    createdDevices.push(newDev)
                }
            }

            return createdDevices
        })

        return NextResponse.json({
            success: true,
            count: results.length,
            message: `${results.length} cihaz ${targetLocation.name} lokasyonuna sevk edildi`
        })

    } catch (error) {
        console.error('Cargo dispatch error:', error)
        return NextResponse.json(
            { error: 'Failed to dispatch cargo devices' },
            { status: 500 }
        )
    }
}
