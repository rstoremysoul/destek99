export const VENDOR_WORKFLOW_META_TAG = '[[VENDOR_WORKFLOW_META]]'

export interface VendorWorkflowMeta {
  stage: 'technical_service'
  repairId: string
  repairNumber: string
  transferredAt: string
}

interface ParseResult {
  meta: VendorWorkflowMeta | null
  notesWithoutMeta: string
}

function normalize(value: any): VendorWorkflowMeta | null {
  if (!value || value.stage !== 'technical_service') return null
  if (!value.repairId || !value.repairNumber) return null
  return {
    stage: 'technical_service',
    repairId: String(value.repairId),
    repairNumber: String(value.repairNumber),
    transferredAt: typeof value.transferredAt === 'string' ? value.transferredAt : new Date().toISOString(),
  }
}

export function parseVendorWorkflowMeta(notes?: string | null): ParseResult {
  const text = String(notes || '')
  if (!text.trim()) return { meta: null, notesWithoutMeta: '' }

  let parsed: VendorWorkflowMeta | null = null
  const keptLines: string[] = []
  for (const line of text.split('\n')) {
    if (!line.startsWith(VENDOR_WORKFLOW_META_TAG)) {
      keptLines.push(line)
      continue
    }
    try {
      parsed = normalize(JSON.parse(line.slice(VENDOR_WORKFLOW_META_TAG.length).trim()))
    } catch {
      keptLines.push(line)
    }
  }

  return {
    meta: parsed,
    notesWithoutMeta: keptLines.join('\n').trim(),
  }
}

export function upsertVendorWorkflowMeta(
  notes: string | null | undefined,
  patch: Partial<VendorWorkflowMeta>
): string {
  const parsed = parseVendorWorkflowMeta(notes)
  const next = normalize({
    ...(parsed.meta || {}),
    ...patch,
    stage: 'technical_service',
  })
  if (!next) return parsed.notesWithoutMeta

  const base = parsed.notesWithoutMeta
  const metaLine = `${VENDOR_WORKFLOW_META_TAG} ${JSON.stringify(next)}`
  return base ? `${base}\n${metaLine}` : metaLine
}
