export const CARGO_VENDOR_META_TAG = '[[CARGO_VENDOR_META]]'

export interface CargoVendorMeta {
  stage: 'vendor_tracking'
  vendorId?: string
  vendorName: string
  vendorProductIds: string[]
  targetLocationId: string
  targetLocationName: string
  transferredAt: string
}

interface ParseResult {
  meta: CargoVendorMeta | null
  notesWithoutMeta: string
}

function normalizeMeta(value: any): CargoVendorMeta | null {
  if (!value || value.stage !== 'vendor_tracking') return null
  if (!value.targetLocationId || !value.targetLocationName || !value.vendorName) return null
  return {
    stage: 'vendor_tracking',
    vendorId: typeof value.vendorId === 'string' ? value.vendorId : undefined,
    vendorName: String(value.vendorName),
    vendorProductIds: Array.isArray(value.vendorProductIds) ? value.vendorProductIds.map((id: unknown) => String(id)) : [],
    targetLocationId: String(value.targetLocationId),
    targetLocationName: String(value.targetLocationName),
    transferredAt: typeof value.transferredAt === 'string' ? value.transferredAt : new Date().toISOString(),
  }
}

export function parseCargoVendorMeta(notes?: string | null): ParseResult {
  const text = String(notes || '')
  if (!text.trim()) {
    return { meta: null, notesWithoutMeta: '' }
  }

  let parsed: CargoVendorMeta | null = null
  const keptLines: string[] = []

  for (const line of text.split('\n')) {
    if (!line.startsWith(CARGO_VENDOR_META_TAG)) {
      keptLines.push(line)
      continue
    }
    try {
      const raw = line.slice(CARGO_VENDOR_META_TAG.length).trim()
      parsed = normalizeMeta(JSON.parse(raw))
    } catch {
      // Keep malformed lines in plain notes to avoid data loss.
      keptLines.push(line)
    }
  }

  return {
    meta: parsed,
    notesWithoutMeta: keptLines.join('\n').trim(),
  }
}

export function upsertCargoVendorMeta(
  notes: string | null | undefined,
  patch: Partial<CargoVendorMeta>
): string {
  const parsed = parseCargoVendorMeta(notes)
  const nextMeta = normalizeMeta({
    ...(parsed.meta || {}),
    ...patch,
    stage: 'vendor_tracking',
  })

  if (!nextMeta) {
    return parsed.notesWithoutMeta
  }

  const base = parsed.notesWithoutMeta
  const metaLine = `${CARGO_VENDOR_META_TAG} ${JSON.stringify(nextMeta)}`
  return base ? `${base}\n${metaLine}` : metaLine
}
