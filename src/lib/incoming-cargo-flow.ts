export const INCOMING_CARGO_FLOW_META_TAG = '[[INCOMING_FLOW_META]]'

export interface IncomingCargoFlowMeta {
  channel: 'cargo' | 'on_site_service' | 'supplier' | 'installation_team' | 'customer'
  companyId: string
  companyName: string
  branchId: string
  branchName: string
  selectedFaultIds: string[]
  selectedFaultNames: string[]
  deviceFaults?: Array<{
    deviceId: string
    deviceName: string
    model: string
    serialNumber: string
    selectedFaultIds: string[]
    selectedFaultNames: string[]
  }>
  cosmeticState: 'normal' | 'damaged_in_shipping'
  cosmeticDetail?: string
  damageImageData?: string[]
}

export function parseIncomingCargoFlowMeta(notes?: string | null): {
  cleanNotes: string
  meta: IncomingCargoFlowMeta | null
} {
  const text = String(notes || '')
  if (!text.includes(INCOMING_CARGO_FLOW_META_TAG)) {
    return { cleanNotes: text.trim(), meta: null }
  }

  let parsed: IncomingCargoFlowMeta | null = null
  const cleanLines: string[] = []
  for (const line of text.split('\n')) {
    if (!line.startsWith(INCOMING_CARGO_FLOW_META_TAG)) {
      cleanLines.push(line)
      continue
    }
    try {
      const raw = line.slice(INCOMING_CARGO_FLOW_META_TAG.length).trim()
      const data = JSON.parse(raw)
      parsed = {
        channel: data?.channel || 'cargo',
        companyId: String(data?.companyId || ''),
        companyName: String(data?.companyName || ''),
        branchId: String(data?.branchId || ''),
        branchName: String(data?.branchName || ''),
        selectedFaultIds: Array.isArray(data?.selectedFaultIds) ? data.selectedFaultIds.map((x: unknown) => String(x)) : [],
        selectedFaultNames: Array.isArray(data?.selectedFaultNames) ? data.selectedFaultNames.map((x: unknown) => String(x)) : [],
        deviceFaults: Array.isArray(data?.deviceFaults)
          ? data.deviceFaults.map((item: any) => ({
              deviceId: String(item?.deviceId || ''),
              deviceName: String(item?.deviceName || ''),
              model: String(item?.model || ''),
              serialNumber: String(item?.serialNumber || ''),
              selectedFaultIds: Array.isArray(item?.selectedFaultIds) ? item.selectedFaultIds.map((x: unknown) => String(x)) : [],
              selectedFaultNames: Array.isArray(item?.selectedFaultNames) ? item.selectedFaultNames.map((x: unknown) => String(x)) : [],
            }))
          : [],
        cosmeticState: data?.cosmeticState === 'damaged_in_shipping' ? 'damaged_in_shipping' : 'normal',
        cosmeticDetail: String(data?.cosmeticDetail || ''),
        damageImageData: Array.isArray(data?.damageImageData) ? data.damageImageData.map((x: unknown) => String(x)) : [],
      }
    } catch {
      parsed = null
    }
  }

  return {
    cleanNotes: cleanLines.join('\n').trim(),
    meta: parsed,
  }
}
