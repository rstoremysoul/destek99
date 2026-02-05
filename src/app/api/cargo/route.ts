import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { CargoType, CargoStatus, CargoDestination, DeviceCondition, CargoPurpose } from '@prisma/client'

// GET all cargo trackings
export async function GET(request: NextRequest) {
  try {
    const cargos = await prisma.cargoTracking.findMany({
      include: {
        devices: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(cargos)
  } catch (error) {
    console.error('Error fetching cargo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cargo' },
      { status: 500 }
    )
  }
}

// POST create new cargo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      trackingNumber,
      type,
      status,
      sender,
      receiver,
      cargoCompany,
      sentDate,
      deliveredDate,
      destination,
      destinationAddress,
      notes,
      devices,
    } = body

    // Map enum values
    const typeMap: { [key: string]: CargoType } = {
      'incoming': CargoType.INCOMING,
      'outgoing': CargoType.OUTGOING,
      // Add other types if necessary or default
    }

    const statusMap: { [key: string]: CargoStatus } = {
      'in_transit': CargoStatus.IN_TRANSIT,
      'delivered': CargoStatus.DELIVERED,
      'returned': CargoStatus.RETURNED,
      'lost': CargoStatus.LOST,
      'damaged': CargoStatus.DAMAGED,
    }

    const destinationMap: { [key: string]: CargoDestination } = {
      'customer': CargoDestination.CUSTOMER,
      'distributor': CargoDestination.DISTRIBUTOR,
      'branch': CargoDestination.BRANCH,
      'headquarters': CargoDestination.HEADQUARTERS,
    }

    const conditionMap: { [key: string]: DeviceCondition } = {
      'new': DeviceCondition.NEW,
      'used': DeviceCondition.USED,
      'refurbished': DeviceCondition.REFURBISHED,
      'damaged': DeviceCondition.DAMAGED,
    }

    const purposeMap: { [key: string]: CargoPurpose } = {
      'installation': CargoPurpose.INSTALLATION,
      'replacement': CargoPurpose.REPLACEMENT,
      'repair': CargoPurpose.REPAIR,
      'return': CargoPurpose.RETURN,
    }

    const cargo = await prisma.cargoTracking.create({
      data: {
        trackingNumber,
        type: typeMap[type?.toLowerCase()] || CargoType.OUTGOING,
        status: statusMap[status?.toLowerCase()] || CargoStatus.IN_TRANSIT,
        sender,
        receiver,
        cargoCompany: cargoCompany || '',
        sentDate: sentDate ? new Date(sentDate) : null,
        deliveredDate: deliveredDate ? new Date(deliveredDate) : null,
        destination: destinationMap[destination?.toLowerCase()] || CargoDestination.CUSTOMER,
        destinationAddress,
        notes,
        devices: {
          create: devices.map((device: any) => ({
            deviceName: device.deviceName,
            model: device.model,
            serialNumber: device.serialNumber,
            quantity: device.quantity || 1,
            condition: conditionMap[device.condition?.toLowerCase()] || DeviceCondition.NEW,
            purpose: purposeMap[device.purpose?.toLowerCase()] || CargoPurpose.INSTALLATION,
          })),
        },
      },
      include: {
        devices: true,
      },
    })

    // --- AUTOMATIC WAREHOUSE ASSIGNMENT FOR INCOMING CARGO ---
    if (typeMap[type?.toLowerCase()] === CargoType.INCOMING) {
      try {
        // 1. Find or Create "Office" Warehouse
        let office = await prisma.location.findFirst({
          where: {
            OR: [
              { type: 'HEADQUARTERS' },
              { name: { contains: 'Merkez' } },
              { name: { contains: 'Ofis' } }
            ]
          }
        })

        if (!office) {
          office = await prisma.location.create({
            data: {
              name: 'Merkez Ofis',
              type: 'HEADQUARTERS',
              address: 'Otomatik Oluşturuldu',
            }
          })
        }

        // 2. Process each device to update/create Inventory
        for (const device of devices) {
          if (!device.serialNumber || device.serialNumber.length < 3) continue;

          const existingDevice = await prisma.equivalentDevice.findUnique({
            where: { serialNumber: device.serialNumber }
          })

          if (existingDevice) {
            // Update existing device location
            await prisma.equivalentDevice.update({
              where: { id: existingDevice.id },
              data: {
                location: { connect: { id: office.id } },
                currentLocation: 'IN_WAREHOUSE',
                status: 'AVAILABLE',
              }
            })

            // Track History
            await prisma.equivalentDeviceHistory.create({
              data: {
                device: { connect: { id: existingDevice.id } },
                previousLocation: existingDevice.currentLocation,
                newLocation: 'IN_WAREHOUSE',
                assignedToName: `Kargo ile Giriş (${trackingNumber})`,
                notes: `Gelen Kargo: ${trackingNumber} - Gönderen: ${sender}`,
                changedBy: 'SYSTEM',
                changedByName: 'Sistem (Otomatik Kargo Girişi)',
              }
            })

          } else {
            // Create new inventory item
            const newDev = await prisma.equivalentDevice.create({
              data: {
                deviceNumber: `DEV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                deviceName: device.deviceName,
                brand: 'Bilinmiyor',
                model: device.model,
                serialNumber: device.serialNumber,
                location: { connect: { id: office.id } },
                currentLocation: 'IN_WAREHOUSE',
                status: 'AVAILABLE',
                condition: 'GOOD',
              }
            })

            // Track History
            await prisma.equivalentDeviceHistory.create({
              data: {
                device: { connect: { id: newDev.id } },
                previousLocation: 'IN_WAREHOUSE',
                newLocation: 'IN_WAREHOUSE',
                assignedToName: `Kargo ile Giriş (${trackingNumber})`,
                notes: `Yeni Kayıt - Gelen Kargo: ${trackingNumber}`,
                changedBy: 'SYSTEM',
                changedByName: 'Sistem (Otomatik Kargo Girişi)',
              }
            })
          }
        }
      } catch (err) {
        console.error('Error auto-assigning incoming cargo to warehouse:', err)
        // Don't fail the request, just log error
      }
    }
    // ---------------------------------------------------------

    return NextResponse.json(cargo, { status: 201 })
  } catch (error) {
    console.error('Error creating cargo:', error)
    return NextResponse.json(
      { error: 'Failed to create cargo' },
      { status: 500 }
    )
  }
}

