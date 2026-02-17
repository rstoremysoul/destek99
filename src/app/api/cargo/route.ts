import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { CargoType, CargoStatus, CargoDestination, DeviceCondition, CargoPurpose, Prisma } from '@prisma/client'
import { appendCargoRepairHistory, parseCargoRepairMeta } from '@/lib/cargo-repair'

const DEFAULT_HQ_NAME = 'Merkez Ofis Deposu'

function isUnknownRecordStatusArg(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.includes('Unknown argument `recordStatus`') || error.message.includes('record_status')
}

function normalizeRecordStatus(status: string | null | undefined, notes?: string | null) {
  const raw = typeof status === 'string' ? status.toLowerCase() : 'open'
  const { meta } = parseCargoRepairMeta(notes)
  if (meta?.active) return 'device_repair'
  return raw
}

async function getHeadquartersLocation() {
  const hq = await prisma.location.findFirst({
    where: {
      OR: [
        { type: 'HEADQUARTERS' },
        { name: { contains: 'Merkez' } },
        { name: { contains: 'Ofis' } },
      ],
      active: true,
    },
    orderBy: { name: 'asc' },
  })

  return hq
}

// GET all cargo trackings
export async function GET(request: NextRequest) {
  try {
    const headquarters = await getHeadquartersLocation()
    const hqName = headquarters?.name || DEFAULT_HQ_NAME

    let cargos: any[] = []
    try {
      cargos = await (prisma.cargoTracking as any).findMany({
        include: {
          devices: true,
        },
        orderBy: [
          { recordStatus: 'asc' },
          { createdAt: 'desc' },
        ],
      })
    } catch (error) {
      if (!isUnknownRecordStatusArg(error)) throw error

      cargos = await prisma.cargoTracking.findMany({
        include: {
          devices: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    const enriched = await Promise.all(cargos.map(async (cargo) => {
      // Varsayılan ofis ismi
      let locationName = cargo.type === 'INCOMING' ? hqName : null;

      // Eğer kargo cihaz içeriyorsa, bu cihazların güncel konumuna bakalım
      if (cargo.devices && cargo.devices.length > 0) {
          const serials = cargo.devices
            .map((d: any) => d.serialNumber)
            .filter((s: string | null | undefined): s is string => Boolean(s));

        if (serials.length > 0) {
          // Bu seri numaralarına sahip cihazların güncel konumlarını bulalım
          const devicesInSystem = await prisma.equivalentDevice.findMany({
            where: { serialNumber: { in: serials } },
            include: { location: true }
          });

          // Cihazların bulunduğu benzersiz konumları topla
          const locations = new Set<string>();
          devicesInSystem.forEach(d => {
            if (d.location && d.location.name) {
              locations.add(d.location.name);
            } else if (d.currentLocation === 'ON_SITE_SERVICE') {
              locations.add('Sahada / Müşteride');
            } else if (d.currentLocation === 'AT_CUSTOMER') {
              locations.add('Müşteride');
            }
          });

          if (locations.size === 1) {
            locationName = Array.from(locations)[0];
          } else if (locations.size > 1) {
            locationName = 'Muhtelif / Dağıtılmış';
          }
          // locations.size === 0 ise (henüz envantere girmemiş veya eşleşmemiş), varsayılanı koru
        }
      }

      return {
        ...cargo,
        recordStatus: normalizeRecordStatus(cargo.recordStatus, cargo.notes),
        currentLocationName: locationName,
      };
    }));

    return NextResponse.json(enriched)
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
      recordStatus,
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
      'on_site_service': CargoType.ON_SITE_SERVICE,
      'installation_team': CargoType.INSTALLATION_TEAM,
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

    const recordStatusMap: { [key: string]: string } = {
      'open': 'OPEN',
      'on_hold': 'ON_HOLD',
      'closed': 'CLOSED',
      'device_repair': 'ON_HOLD',
    }

    const normalizedTrackingNumber = String(trackingNumber || '').trim()
    if (!normalizedTrackingNumber) {
      return NextResponse.json(
        { error: 'Takip numarasi zorunludur.' },
        { status: 400 }
      )
    }

    const existingCargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: normalizedTrackingNumber },
      select: { id: true },
    })

    if (existingCargo) {
      return NextResponse.json(
        { error: 'Bu takip numarasi zaten kayitli. Lutfen farkli bir takip numarasi girin.' },
        { status: 409 }
      )
    }

    const deviceList = Array.isArray(devices) ? devices : []

    const createData: any = {
      trackingNumber: normalizedTrackingNumber,
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
        create: deviceList.map((device: any) => ({
          deviceName: device.deviceName,
          model: device.model,
          serialNumber: device.serialNumber,
          quantity: device.quantity || 1,
          condition: conditionMap[device.condition?.toLowerCase()] || DeviceCondition.NEW,
          purpose: purposeMap[device.purpose?.toLowerCase()] || CargoPurpose.INSTALLATION,
        })),
      },
    }

    if (typeof recordStatus === 'string') {
      const mappedStatus = recordStatusMap[recordStatus.toLowerCase()]
      if (mappedStatus) {
        createData.recordStatus = mappedStatus
      }
    }

    if (String(recordStatus || '').toLowerCase() === 'device_repair') {
      createData.notes = appendCargoRepairHistory(
        typeof notes === 'string' ? notes : '',
        {
          at: new Date().toISOString(),
          action: 'Kargo kaydi cihaz tamiri durumunda olusturuldu',
        },
        {
          active: true,
          status: 'pending',
        }
      )
    }

    let cargo: any
    try {
      cargo = await (prisma.cargoTracking as any).create({
        data: createData,
        include: {
          devices: true,
        },
      })
    } catch (error) {
      if (!isUnknownRecordStatusArg(error)) throw error

      delete createData.recordStatus
      cargo = await prisma.cargoTracking.create({
        data: createData,
        include: {
          devices: true,
        },
      })
    }

    // --- AUTOMATIC WAREHOUSE ASSIGNMENT FOR INCOMING CARGO ---
    if (typeMap[type?.toLowerCase()] === CargoType.INCOMING) {
      try {
        let targetLocation;

        // 1. Determine Target Location
        if (body.targetLocationId) {
          targetLocation = await prisma.location.findUnique({
            where: { id: body.targetLocationId }
          });
        }

        // Fallback to "Office" if no target selected or not found
        if (!targetLocation) {
          targetLocation = await getHeadquartersLocation();
          if (!targetLocation) {
            targetLocation = await prisma.location.create({
              data: {
                name: DEFAULT_HQ_NAME,
                type: 'HEADQUARTERS',
                address: 'Otomatik Oluşturuldu',
                active: true,
              }
            })
          }
        }

        // 2. Process only predefined equivalent devices
        let movedEquivalentCount = 0
        let skippedNonEquivalentCount = 0

        for (const device of deviceList) {
          const sourceType = String(device?.sourceType || '').toLowerCase()
          if (sourceType !== 'equivalent') {
            skippedNonEquivalentCount++
            continue
          }

          if (!device.serialNumber || device.serialNumber.length < 3) continue;

          let existingDevice = null
          if (device.equivalentDeviceId) {
            existingDevice = await prisma.equivalentDevice.findUnique({
              where: { id: device.equivalentDeviceId }
            })
          }

          if (!existingDevice) {
            existingDevice = await prisma.equivalentDevice.findUnique({
              where: { serialNumber: device.serialNumber }
            })
          }

          if (existingDevice) {
            // Update existing device location
            await prisma.equivalentDevice.update({
              where: { id: existingDevice.id },
              data: {
                location: { connect: { id: targetLocation.id } },
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
                previousLocationId: existingDevice.locationId,
                newLocationId: targetLocation.id,
                assignedToName: `Kargo ile Giriş (${trackingNumber})`,
                notes: `Gelen Kargo: ${trackingNumber} - Gönderen: ${sender} - Depo: ${targetLocation.name}`,
                changedBy: 'SYSTEM',
                changedByName: 'Sistem (Otomatik Kargo Girişi)',
              }
            })

            movedEquivalentCount++
          } else {
            skippedNonEquivalentCount++
          }
        }

        if (movedEquivalentCount > 0 || skippedNonEquivalentCount > 0) {
          console.log(
            `[cargo-incoming] tracking=${trackingNumber} movedEquivalent=${movedEquivalentCount} skipped=${skippedNonEquivalentCount}`
          )
        }
      } catch (err) {
        console.error('Error auto-assigning incoming cargo to warehouse:', err)
        // Don't fail the request, just log error
      }
    }
    // ---------------------------------------------------------

    return NextResponse.json(cargo, { status: 201 })
  } catch (error) {
    const p2002Target = (error instanceof Prisma.PrismaClientKnownRequestError
      ? (error as any).meta?.target
      : null)
    const targetText = Array.isArray(p2002Target)
      ? p2002Target.join(',')
      : String(p2002Target || '')

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (
        targetText.includes('tracking_number') ||
        targetText.includes('trackingNumber')
      )
    ) {
      return NextResponse.json(
        { error: 'Bu takip numarasi zaten kayitli. Lutfen farkli bir takip numarasi girin.' },
        { status: 409 }
      )
    }

    console.error('Error creating cargo:', error)
    return NextResponse.json(
      { error: 'Failed to create cargo' },
      { status: 500 }
    )
  }
}


