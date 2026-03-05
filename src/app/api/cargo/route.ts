import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { CargoType, CargoStatus, CargoDestination, DeviceCondition, CargoPurpose, Prisma } from '@prisma/client'
import { appendCargoRepairHistory, parseCargoRepairMeta } from '@/lib/cargo-repair'
import { parseIncomingCargoFlowMeta } from '@/lib/incoming-cargo-flow'
import { ensureSystemWarehouses } from '@/lib/system-warehouses'
import { upsertCargoVendorMeta } from '@/lib/cargo-vendor-workflow'

const DEFAULT_HQ_NAME = 'Merkez Ofis Deposu'
const DEFAULT_VENDOR_WAREHOUSE_NAME = 'Tedarikci Takibi Deposu'
const DEFAULT_CONSIGNMENT_WAREHOUSE_NAME = 'Konsinye Depo'

function generateEquivalentDeviceNumber() {
  return `INC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`
}

function isUnknownRecordStatusArg(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.includes('Unknown argument `recordStatus`') || error.message.includes('record_status')
}

function normalizeRecordStatus(status: string | null | undefined, notes?: string | null) {
  const raw = typeof status === 'string' ? status.toLowerCase() : 'open'
  const { meta } = parseCargoRepairMeta(notes)
  if (meta?.active) return 'device_repair'
  if (meta?.status === 'completed' && meta?.shipmentStatus === 'ready_to_ship') return 'ready_to_ship'
  return raw
}

function isClosedRepairStatus(status: string) {
  return status === 'COMPLETED' || status === 'UNREPAIRABLE'
}

function parseCargoDeviceIdMarker(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const match = String(value || '').match(/\[CARGO_DEVICE:([^\]]+)\]/)
    if (match?.[1]) return match[1]
  }
  return null
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

async function getVendorTrackingLocation() {
  const location = await prisma.location.findFirst({
    where: {
      OR: [
        { name: DEFAULT_VENDOR_WAREHOUSE_NAME },
        { type: 'SUPPLIER' },
      ],
      active: true,
    },
    orderBy: { name: 'asc' },
  })

  if (location) return location

  return prisma.location.create({
    data: {
      name: DEFAULT_VENDOR_WAREHOUSE_NAME,
      type: 'SUPPLIER',
      address: 'Otomatik Olusturuldu',
      active: true,
    },
  })
}

async function getConsignmentLocation() {
  const location = await prisma.location.findFirst({
    where: {
      OR: [
        { name: DEFAULT_CONSIGNMENT_WAREHOUSE_NAME },
        { type: 'CONSIGNMENT' },
      ],
      active: true,
    },
    orderBy: { name: 'asc' },
  })

  if (location) return location

  return prisma.location.create({
    data: {
      name: DEFAULT_CONSIGNMENT_WAREHOUSE_NAME,
      type: 'CONSIGNMENT',
      address: 'Otomatik Olusturuldu',
      active: true,
    },
  })
}

// GET all cargo trackings
export async function GET(request: NextRequest) {
  try {
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
      // Varsayilan olarak depo bilgisi verme; sadece envanterde dogrulanmis lokasyon goster.
      // Gelen kargoda is kurali geregi depo her zaman merkez ofis kabul edilir.
      let locationName: string | null = cargo.type === 'INCOMING'
        ? (cargo.destinationAddress || DEFAULT_HQ_NAME)
        : null;

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
          if (locations.size === 0 && cargo.type === 'INCOMING') {
            locationName = cargo.destinationAddress || DEFAULT_HQ_NAME;
          }
        } else if (cargo.type === 'INCOMING') {
          locationName = cargo.destinationAddress || DEFAULT_HQ_NAME;
        }
      } else if (cargo.type === 'INCOMING') {
        // Cihaz girisi olmayan gelen kayitlarda da merkez ofis depo kabul edilir.
        locationName = cargo.destinationAddress || DEFAULT_HQ_NAME;
      }

      const repairRows = await prisma.deviceRepair.findMany({
        where: {
          OR: [
            { repairNotes: { contains: `[CARGO:${cargo.id}]` } },
            { diagnosisNotes: { contains: `[CARGO:${cargo.id}]` } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          repairNumber: true,
          status: true,
          repairNotes: true,
          diagnosisNotes: true,
          updatedAt: true,
        },
      })

      const deviceRepairMap = new Map<string, { id: string; repairNumber: string; status: 'open' | 'closed'; state: string; updatedAt: Date }>()
      for (const row of repairRows) {
        const cargoDeviceId = parseCargoDeviceIdMarker(row.repairNotes, row.diagnosisNotes)
        if (!cargoDeviceId) continue
        const status = isClosedRepairStatus(row.status) ? 'closed' : 'open'
        const existing = deviceRepairMap.get(cargoDeviceId)
        if (existing && existing.updatedAt > row.updatedAt) continue
        deviceRepairMap.set(cargoDeviceId, {
          id: row.id,
          repairNumber: row.repairNumber,
          status,
          state: String(row.status || '').toLowerCase(),
          updatedAt: row.updatedAt,
        })
      }

      const anyOpenRepair = Array.from(deviceRepairMap.values()).some((item) => item.status === 'open')
      const anyClosedRepair = Array.from(deviceRepairMap.values()).some((item) => item.status === 'closed')
      const normalized = anyOpenRepair
        ? 'device_repair'
        : (anyClosedRepair ? 'ready_to_ship' : normalizeRecordStatus(cargo.recordStatus, cargo.notes))

      return {
        ...cargo,
        recordStatus: normalized,
        devices: cargo.devices.map((device: any) => {
          const ticket = deviceRepairMap.get(device.id)
          return {
            ...device,
            repairTicket: ticket
              ? {
                  id: ticket.id,
                  repairNumber: ticket.repairNumber,
                  status: ticket.status,
                  state: ticket.state,
                }
              : undefined,
          }
        }),
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

    const resolvedType = typeMap[type?.toLowerCase()] || CargoType.OUTGOING
    const isIncoming = resolvedType === CargoType.INCOMING
    const incomingMeta = parseIncomingCargoFlowMeta(typeof notes === 'string' ? notes : '').meta
    const isSupplierIncoming = isIncoming && incomingMeta?.channel === 'supplier'

    if (isIncoming) {
      await ensureSystemWarehouses(prisma as any)
    }

    const supplierTargetLocation = isSupplierIncoming
      ? await getVendorTrackingLocation()
      : null

    const createData: any = {
      trackingNumber: normalizedTrackingNumber,
      type: resolvedType,
      status: statusMap[status?.toLowerCase()] || CargoStatus.IN_TRANSIT,
      sender,
      receiver,
      cargoCompany: isSupplierIncoming ? 'Tedarikci' : (cargoCompany || ''),
      sentDate: sentDate ? new Date(sentDate) : null,
      deliveredDate: deliveredDate ? new Date(deliveredDate) : null,
      destination: isIncoming
        ? (isSupplierIncoming ? CargoDestination.DISTRIBUTOR : CargoDestination.HEADQUARTERS)
        : (destinationMap[destination?.toLowerCase()] || CargoDestination.CUSTOMER),
      destinationAddress: isIncoming
        ? (isSupplierIncoming ? (supplierTargetLocation?.name || DEFAULT_VENDOR_WAREHOUSE_NAME) : DEFAULT_HQ_NAME)
        : destinationAddress,
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
    if (resolvedType === CargoType.INCOMING) {
      try {
        let targetLocation = null as any
        let consignmentLocation = null as any
        if (isSupplierIncoming) {
          targetLocation = supplierTargetLocation || await getVendorTrackingLocation()
          consignmentLocation = await getConsignmentLocation()
        } else {
          targetLocation = await getHeadquartersLocation()
          if (!targetLocation) {
            targetLocation = await prisma.location.create({
              data: {
                name: DEFAULT_HQ_NAME,
                type: 'HEADQUARTERS',
                address: 'Otomatik Olusturuldu',
                active: true,
              },
            })
          }
        }

        let movedEquivalentCount = 0
        let createdEquivalentCount = 0
        const vendorProductIds: string[] = []
        const usedTargetLocationIds = new Set<string>()
        const usedTargetLocationNames = new Set<string>()
        const vendorName = String(incomingMeta?.companyName || sender || 'Tedarikci').trim() || 'Tedarikci'
        let vendorId: string | null = null

        for (const device of deviceList) {
          if (!device.serialNumber || device.serialNumber.length < 3) continue

          let existingDevice = null
          if (device.equivalentDeviceId) {
            existingDevice = await prisma.equivalentDevice.findUnique({
              where: { id: device.equivalentDeviceId },
            })
          }

          if (!existingDevice) {
            existingDevice = await prisma.equivalentDevice.findUnique({
              where: { serialNumber: device.serialNumber },
            })
          }

          let deviceTargetLocation = targetLocation

          if (isSupplierIncoming) {
            const modelDef = await prisma.deviceModel.findFirst({
              where: {
                name: String(device.model || '').trim(),
                brand: {
                  name: String(device.deviceName || '').trim(),
                },
              },
              select: { isConsignment: true },
            })

            const consignmentOverride = incomingMeta?.deviceFaults?.find((f: any) => {
              const sameSerial = String(f?.serialNumber || '').trim() === String(device.serialNumber || '').trim()
              const sameModel = String(f?.model || '').trim() === String(device.model || '').trim()
              return sameSerial && sameModel
            })

            const isConsignmentDevice =
              typeof consignmentOverride?.isConsignment === 'boolean'
                ? consignmentOverride.isConsignment
                : Boolean(modelDef?.isConsignment)

            deviceTargetLocation = isConsignmentDevice ? (consignmentLocation || targetLocation) : targetLocation

            if (!vendorId) {
              const existingVendor = await prisma.vendor.findFirst({
                where: { name: vendorName },
                select: { id: true },
              })
              if (existingVendor) {
                vendorId = existingVendor.id
              } else {
                const createdVendor = await prisma.vendor.create({
                  data: {
                    name: vendorName,
                    type: 'DISTRIBUTOR',
                    active: true,
                    notes: `Gelen kargo supplier kanalindan otomatik olusturuldu (${trackingNumber})`,
                  },
                  select: { id: true },
                })
                vendorId = createdVendor.id
              }
            }

            const vendorProduct = await prisma.vendorProduct.create({
              data: {
                vendorId,
                deviceName: String(device.deviceName || 'Bilinmeyen Cihaz'),
                model: String(device.model || '-'),
                serialNumber: String(device.serialNumber),
                isConsignment: isConsignmentDevice,
                problemDescription: `Supplier kanalindan gelen cihaz kaydi (${trackingNumber})`,
                currentStatus: 'AT_VENDOR',
                sentDate: new Date(),
                notes: [
                  `[CARGO:${cargo.id}]`,
                  `[CARGO_TRACKING:${trackingNumber}]`,
                  `Kaynak kanal: supplier`,
                  `Depo: ${deviceTargetLocation.name}`,
                ].join('\n'),
              },
              select: { id: true },
            })

            vendorProductIds.push(vendorProduct.id)

            await prisma.vendorProductStatusHistory.create({
              data: {
                productId: vendorProduct.id,
                status: 'AT_VENDOR',
                statusDate: new Date(),
                notes: `Supplier kanalinda gelen kargodan otomatik olusturuldu (${trackingNumber})`,
                updatedBy: 'SYSTEM',
                updatedByName: 'Sistem',
              },
            })
          }

          usedTargetLocationIds.add(String(deviceTargetLocation.id))
          usedTargetLocationNames.add(String(deviceTargetLocation.name))

          if (existingDevice) {
            await prisma.equivalentDevice.update({
              where: { id: existingDevice.id },
              data: {
                location: { connect: { id: deviceTargetLocation.id } },
                currentLocation: 'IN_WAREHOUSE',
                status: 'AVAILABLE',
              },
            })

            await prisma.equivalentDeviceHistory.create({
              data: {
                device: { connect: { id: existingDevice.id } },
                previousLocation: existingDevice.currentLocation,
                newLocation: 'IN_WAREHOUSE',
                previousLocationId: existingDevice.locationId,
                newLocationId: deviceTargetLocation.id,
                assignedToName: `Kargo ile Giris (${trackingNumber})`,
                notes: `Gelen Kargo: ${trackingNumber} - Gonderen: ${sender} - Depo: ${deviceTargetLocation.name}`,
                changedBy: 'SYSTEM',
                changedByName: 'Sistem (Otomatik Kargo Girisi)',
              },
            })

            movedEquivalentCount++
          } else {
            let createdDevice = null as any
            try {
              createdDevice = await prisma.equivalentDevice.create({
                data: {
                  deviceNumber: generateEquivalentDeviceNumber(),
                  deviceName: String(device.deviceName || 'Bilinmeyen Cihaz'),
                  brand: String(device.deviceName || 'GENEL'),
                  model: String(device.model || '-'),
                  serialNumber: String(device.serialNumber),
                  locationId: deviceTargetLocation.id,
                  currentLocation: 'IN_WAREHOUSE',
                  status: 'AVAILABLE',
                  recordStatus: 'OPEN',
                  condition: 'GOOD',
                  notes: `Gelen kargo kaydindan otomatik olusturuldu (${trackingNumber})`,
                  createdBy: 'SYSTEM',
                  createdByName: 'Sistem (Otomatik Kargo Girisi)',
                },
              })
            } catch (createError) {
              createdDevice = await prisma.equivalentDevice.findUnique({
                where: { serialNumber: String(device.serialNumber) },
              })
              if (!createdDevice) throw createError
            }

            await prisma.equivalentDeviceHistory.create({
              data: {
                deviceId: createdDevice.id,
                previousLocation: createdDevice.currentLocation || 'IN_WAREHOUSE',
                newLocation: 'IN_WAREHOUSE',
                previousLocationId: createdDevice.locationId || deviceTargetLocation.id,
                newLocationId: deviceTargetLocation.id,
                assignedToName: `Kargo ile Giris (${trackingNumber})`,
                notes: `Gelen Kargo: ${trackingNumber} - Gonderen: ${sender} - Depo: ${deviceTargetLocation.name} (otomatik olusturma)`,
                changedBy: 'SYSTEM',
                changedByName: 'Sistem (Otomatik Kargo Girisi)',
              },
            })

            createdEquivalentCount++
          }
        }

        if (isSupplierIncoming && vendorProductIds.length > 0) {
          const locationNameForMeta = usedTargetLocationNames.size === 1
            ? Array.from(usedTargetLocationNames)[0]
            : Array.from(usedTargetLocationNames).join(' / ')
          const locationIdForMeta = usedTargetLocationIds.size === 1
            ? Array.from(usedTargetLocationIds)[0]
            : (targetLocation?.id || '')
          const updatedNotes = upsertCargoVendorMeta(cargo.notes || '', {
            stage: 'vendor_tracking',
            vendorId: vendorId || undefined,
            vendorName,
            vendorProductIds,
            targetLocationId: locationIdForMeta,
            targetLocationName: locationNameForMeta,
            transferredAt: new Date().toISOString(),
          })

          const updatedCargo = await prisma.cargoTracking.update({
            where: { id: cargo.id },
            data: {
              cargoCompany: 'Tedarikci',
              destinationAddress: locationNameForMeta || targetLocation.name,
              notes: updatedNotes,
            },
            include: { devices: true },
          })
          cargo = updatedCargo
        }

        if (movedEquivalentCount > 0 || createdEquivalentCount > 0) {
          console.log(
            `[cargo-incoming] tracking=${trackingNumber} movedEquivalent=${movedEquivalentCount} createdEquivalent=${createdEquivalentCount} supplierIncoming=${isSupplierIncoming}`
          )
        }
      } catch (err) {
        console.error('Error auto-assigning incoming cargo to warehouse:', err)
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




