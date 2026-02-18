export interface CargoRepairHistoryItem {
  at: string
  action: string
  technicianName?: string
  operations?: string[]
  note?: string
  laborCost?: number
  partsCost?: number
  totalCost?: number
}

export interface CargoRepairSparePartItem {
  name: string
  quantity: number
  unitCost: number
}

export interface CargoRepairMeta {
  active: boolean
  technicianId?: string
  technicianName?: string
  operations: string[]
  imageUrl?: string
  note?: string
  spareParts: CargoRepairSparePartItem[]
  laborCost?: number
  partsCost?: number
  totalCost?: number
  status: 'pending' | 'in_progress' | 'completed'
  history: CargoRepairHistoryItem[]
  updatedAt: string
}

const META_TAG = '[[CARGO_REPAIR_META]]'

const defaultMeta = (): CargoRepairMeta => ({
  active: true,
  technicianName: '',
  operations: [],
  imageUrl: '',
  note: '',
  spareParts: [],
  laborCost: 0,
  partsCost: 0,
  totalCost: 0,
  status: 'pending',
  history: [],
  updatedAt: new Date().toISOString(),
})

export function parseCargoRepairMeta(notes?: string | null): {
  cleanNotes: string
  meta: CargoRepairMeta | null
} {
  const text = (notes || '').trim()
  if (!text.includes(META_TAG)) {
    return { cleanNotes: text, meta: null }
  }

  const lines = text.split('\n')
  const clean: string[] = []
  let meta: CargoRepairMeta | null = null

  for (const line of lines) {
    if (!line.startsWith(META_TAG)) {
      clean.push(line)
      continue
    }

    const payload = line.slice(META_TAG.length).trim()
    try {
      const parsed = JSON.parse(payload)
      meta = {
        ...defaultMeta(),
        ...parsed,
        history: Array.isArray(parsed?.history) ? parsed.history : [],
        operations: Array.isArray(parsed?.operations) ? parsed.operations : [],
        spareParts: Array.isArray(parsed?.spareParts) ? parsed.spareParts : [],
      }
    } catch {
      meta = null
    }
  }

  return {
    cleanNotes: clean.join('\n').trim(),
    meta,
  }
}

export function upsertCargoRepairMeta(notes: string | null | undefined, input: Partial<CargoRepairMeta>): string {
  const { cleanNotes, meta } = parseCargoRepairMeta(notes)
  const next: CargoRepairMeta = {
    ...(meta || defaultMeta()),
    ...input,
    operations: Array.isArray(input.operations) ? input.operations : (meta?.operations || []),
    spareParts: Array.isArray(input.spareParts) ? input.spareParts : (meta?.spareParts || []),
    history: Array.isArray(input.history) ? input.history : (meta?.history || []),
    updatedAt: new Date().toISOString(),
  }

  const parts = [cleanNotes, `${META_TAG}${JSON.stringify(next)}`].filter(Boolean)
  return parts.join('\n')
}

export function appendCargoRepairHistory(
  notes: string | null | undefined,
  item: CargoRepairHistoryItem,
  patch?: Partial<CargoRepairMeta>
): string {
  const { meta } = parseCargoRepairMeta(notes)
  const base = meta || defaultMeta()
  const history = [...base.history, item]
  return upsertCargoRepairMeta(notes, {
    ...patch,
    history,
  })
}
