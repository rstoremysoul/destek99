import { LocationType } from '@prisma/client'

export type SystemWarehouseKey =
  | 'DEVICE_REPAIR'
  | 'EQUIVALENT_DEVICES'
  | 'TECHNICAL_SERVICE'
  | 'VENDOR_TRACKING'
  | 'CONSIGNMENT_TRACKING'

type MinimalLocationClient = {
  location: {
    findFirst: (args: any) => Promise<any>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
  }
}

export const SYSTEM_WAREHOUSES: Array<{
  key: SystemWarehouseKey
  name: string
  type: LocationType
  address: string
}> = [
  {
    key: 'DEVICE_REPAIR',
    name: 'Cihaz Tamiri Deposu',
    type: LocationType.SERVICE_CENTER,
    address: 'Sabit sistem deposu - Cihaz tamiri akis noktasi',
  },
  {
    key: 'EQUIVALENT_DEVICES',
    name: 'Muadil Cihazlar Deposu',
    type: LocationType.WAREHOUSE,
    address: 'Sabit sistem deposu - Muadil cihaz akis noktasi',
  },
  {
    key: 'TECHNICAL_SERVICE',
    name: 'Teknik Servis Takibi Deposu',
    type: LocationType.TECHNICAL_SERVICE,
    address: 'Sabit sistem deposu - Teknik servis akis noktasi',
  },
  {
    key: 'VENDOR_TRACKING',
    name: 'Tedarikci Takibi Deposu',
    type: LocationType.SUPPLIER,
    address: 'Sabit sistem deposu - Tedarikci akis noktasi',
  },
  {
    key: 'CONSIGNMENT_TRACKING',
    name: 'Konsinye Depo',
    type: LocationType.CONSIGNMENT,
    address: 'Sabit sistem deposu - Konsinye akis noktasi',
  },
]

function normalize(value: string) {
  return String(value || '').trim().toLowerCase()
}

export function getSystemWarehouseKeyByName(name?: string | null): SystemWarehouseKey | null {
  const normalized = normalize(name || '')
  const found = SYSTEM_WAREHOUSES.find((item) => normalize(item.name) === normalized)
  return found?.key || null
}

export async function ensureSystemWarehouses(client: MinimalLocationClient) {
  for (const item of SYSTEM_WAREHOUSES) {
    const existing = await client.location.findFirst({
      where: { name: item.name },
      select: { id: true, active: true, address: true, type: true },
    })

    if (!existing) {
      await client.location.create({
        data: {
          name: item.name,
          type: item.type,
          address: item.address,
          active: true,
        },
      })
      continue
    }

    const nextType = String(existing.type || '')
    const nextAddress = String(existing.address || '')
    if (!existing.active || nextType !== item.type || !nextAddress) {
      await client.location.update({
        where: { id: existing.id },
        data: {
          active: true,
          type: item.type,
          address: nextAddress || item.address,
        },
      })
    }
  }
}
