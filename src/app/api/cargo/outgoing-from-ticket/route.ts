import { NextRequest, NextResponse } from 'next/server'
import { CargoDestination, CargoRecordStatus, CargoStatus, CargoType, EquivalentLocation } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { appendCargoRepairHistory, parseCargoRepairMeta, upsertCargoRepairMeta } from '@/lib/cargo-repair'

function buildTrackingNumber() {
  return `OUT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`
}

function mapLocationTypeToDestination(type?: string | null): CargoDestination {
  switch (String(type || '').toUpperCase()) {
    case 'CUSTOMER':
      return CargoDestination.CUSTOMER
    case 'SUPPLIER':
      return CargoDestination.DISTRIBUTOR
    case 'HEADQUARTERS':
      return CargoDestination.HEADQUARTERS
    default:
      return CargoDestination.BRANCH
  }
}

function mapLocationTypeToEquivalent(type?: string | null): EquivalentLocation {
  switch (String(type || '').toUpperCase()) {
    case 'CUSTOMER':
      return EquivalentLocation.AT_CUSTOMER
    case 'SERVICE_CENTER':
    case 'INSTALLATION_TEAM':
    case 'TECHNICAL_SERVICE':
      return EquivalentLocation.ON_SITE_SERVICE
    default:
      return EquivalentLocation.IN_WAREHOUSE
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      selectedDevices,
      sourceLocationId,
      receiverCompanyName,
      receiverBranchName,
      targetLocationId,
      notes,
    } = body || {}

    if (!Array.isArray(selectedDevices) || selectedDevices.length === 0 || !sourceLocationId || !targetLocationId) {
      return NextResponse.json(
        { error: 'Secilen cihazlar, kaynak depo ve hedef depo zorunludur' },
        { status: 400 }
      )
    }

    const [sourceLocation, targetLocation] = await Promise.all([
      prisma.location.findUnique({
        where: { id: String(sourceLocationId) },
        select: { id: true, name: true, type: true, active: true },
      }),
      prisma.location.findUnique({
        where: { id: String(targetLocationId) },
        select: { id: true, name: true, type: true, active: true },
      }),
    ])

    if (!sourceLocation || !sourceLocation.active) {
      return NextResponse.json({ error: 'Kaynak depo bulunamadi' }, { status: 404 })
    }
    if (!targetLocation || !targetLocation.active) {
      return NextResponse.json({ error: 'Hedef depo bulunamadi' }, { status: 404 })
    }
    if (sourceLocation.id === targetLocation.id) {
      return NextResponse.json({ error: 'Kaynak ve hedef depo ayni olamaz' }, { status: 400 })
    }

    const receiver = [String(receiverCompanyName || '').trim(), String(receiverBranchName || '').trim()]
      .filter(Boolean)
      .join(' / ')
    if (!receiver) {
      return NextResponse.json({ error: 'Alici firma/sube zorunludur' }, { status: 400 })
    }

    const transferNote = String(notes || '').trim()

    const result = await prisma.$transaction(async (tx) => {
      const devicesToCreate: Array<{
        deviceName: string
        model: string
        serialNumber: string
        quantity: number
        condition: any
        purpose: any
      }> = []
      const sourceTicketsToClose = new Map<string, { cargo: any; count: number }>()
      const movedEquivalentIds: string[] = []

      for (const selected of selectedDevices) {
        const sourceEquivalentDeviceId = String(selected?.sourceEquivalentDeviceId || '')
        const sourceSerialNumber = String(selected?.sourceSerialNumber || '')
        const sourceCargoId = selected?.sourceCargoId ? String(selected.sourceCargoId) : ''
        const sourceDeviceId = selected?.sourceDeviceId ? String(selected.sourceDeviceId) : ''

        if (!sourceEquivalentDeviceId || !sourceSerialNumber) continue

        const equivalent = await tx.equivalentDevice.findUnique({
          where: { id: sourceEquivalentDeviceId },
        })

        if (!equivalent) {
          throw new Error('Secilen kaynak cihaz bulunamadi')
        }
        if (equivalent.locationId !== sourceLocation.id) {
          throw new Error(`Cihaz kaynak depoda degil: ${sourceSerialNumber}`)
        }

        // Kaynak ticket bulma: oncelik explicit cargoId/deviceId, sonra seri no ile acik incoming ticket arama.
        let sourceCargo = null as any
        if (sourceCargoId) {
          sourceCargo = await tx.cargoTracking.findUnique({
            where: { id: sourceCargoId },
            include: { devices: true },
          })
        }
        if (!sourceCargo) {
          const candidates = await tx.cargoTracking.findMany({
            where: {
              type: CargoType.INCOMING,
              recordStatus: { not: CargoRecordStatus.CLOSED },
              devices: {
                some: {
                  serialNumber: sourceSerialNumber,
                },
              },
            },
            include: { devices: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          })
          sourceCargo = candidates[0] || null
        }

        const sourceCargoDevice = sourceCargo
          ? (
              sourceCargo.devices.find((d: any) =>
                sourceDeviceId ? d.id === sourceDeviceId : d.serialNumber === sourceSerialNumber
              ) || sourceCargo.devices.find((d: any) => d.serialNumber === sourceSerialNumber)
            )
          : null

        devicesToCreate.push({
          deviceName: sourceCargoDevice?.deviceName || equivalent.deviceName || 'Bilinmeyen Cihaz',
          model: sourceCargoDevice?.model || equivalent.model || '-',
          serialNumber: sourceCargoDevice?.serialNumber || sourceSerialNumber,
          quantity: sourceCargoDevice?.quantity || 1,
          condition: sourceCargoDevice?.condition || 'USED',
          purpose: sourceCargoDevice?.purpose || 'INSTALLATION',
        })

        await tx.equivalentDevice.update({
          where: { id: equivalent.id },
          data: {
            locationId: targetLocation.id,
            currentLocation: mapLocationTypeToEquivalent(targetLocation.type),
            status: 'AVAILABLE',
          },
        })

        await tx.equivalentDeviceHistory.create({
          data: {
            deviceId: equivalent.id,
            previousLocation: equivalent.currentLocation,
            newLocation: mapLocationTypeToEquivalent(targetLocation.type),
            previousLocationId: equivalent.locationId,
            newLocationId: targetLocation.id,
            assignedToName: targetLocation.name,
            notes: transferNote || `Ticket urunu ${sourceLocation.name} -> ${targetLocation.name} transfer edildi`,
            changedBy: 'USER',
            changedByName: 'Kullanici',
          },
        })

        movedEquivalentIds.push(equivalent.id)
        if (sourceCargo) {
          sourceTicketsToClose.set(sourceCargo.id, {
            cargo: sourceCargo,
            count: (sourceTicketsToClose.get(sourceCargo.id)?.count || 0) + 1,
          })
        }
      }

      if (devicesToCreate.length === 0) {
        throw new Error('Transfer edilecek uygun urun bulunamadi')
      }

      const outgoing = await tx.cargoTracking.create({
        data: {
          trackingNumber: buildTrackingNumber(),
          type: CargoType.OUTGOING,
          status: CargoStatus.IN_TRANSIT,
          recordStatus: CargoRecordStatus.OPEN,
          sender: sourceLocation.name,
          receiver,
          cargoCompany: 'Ic Transfer',
          destination: mapLocationTypeToDestination(targetLocation.type),
          destinationAddress: targetLocation.name,
          sentDate: new Date(),
          notes: transferNote || null,
          devices: {
            create: devicesToCreate,
          },
        },
        include: { devices: true },
      })

      for (const [cargoId, ticketInfo] of Array.from(sourceTicketsToClose.entries())) {
        const sourceCargo = ticketInfo.cargo
        const parsed = parseCargoRepairMeta(sourceCargo.notes)
        let nextSourceNotes = sourceCargo.notes || ''

        if (parsed.meta) {
          nextSourceNotes = appendCargoRepairHistory(
            upsertCargoRepairMeta(nextSourceNotes, {
              active: false,
              status: 'completed',
              shipmentStatus: 'shipped',
            }),
            {
              at: new Date().toISOString(),
              action: `${ticketInfo.count} urun ${targetLocation.name} deposuna transfer edildi, ticket kapatildi`,
              note: transferNote || '',
            }
          )
        } else {
          nextSourceNotes = [
            nextSourceNotes,
            `Ticket transfer: ${sourceLocation.name} -> ${targetLocation.name} (${ticketInfo.count} urun)`,
          ]
            .filter(Boolean)
            .join('\n')
        }

        await tx.cargoTracking.update({
          where: { id: cargoId },
          data: {
            recordStatus: CargoRecordStatus.CLOSED,
            notes: nextSourceNotes,
          },
        })
      }

      return {
        outgoingId: outgoing.id,
        movedCount: movedEquivalentIds.length,
        closedTicketCount: sourceTicketsToClose.size,
      }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Outgoing from ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transfer islemi basarisiz' },
      { status: 500 }
    )
  }
}
