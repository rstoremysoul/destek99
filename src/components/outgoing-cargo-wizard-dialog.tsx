'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { parseIncomingCargoFlowMeta } from '@/lib/incoming-cargo-flow'
import { Badge } from '@/components/ui/badge'

type TicketDeviceOption = {
  cargoId: string
  cargoTrackingNumber: string
  deviceId: string
  serialNumber: string
  incomingMeta: ReturnType<typeof parseIncomingCargoFlowMeta>['meta']
}

interface OutgoingWizardSubmitPayload {
  selectedDevices: Array<{
    sourceCargoId?: string
    sourceDeviceId?: string
    sourceSerialNumber: string
    sourceEquivalentDeviceId: string
  }>
  sourceLocationId: string
  receiverCompanyName: string
  receiverBranchName: string
  targetLocationId: string
  notes: string
}

interface OutgoingCargoWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: OutgoingWizardSubmitPayload) => Promise<boolean | void> | boolean | void
}

const STEP_TITLES = ['Kaynak Depo ve Urun', 'Alici ve Hedef', 'Onizleme']

type Company = { id: string; name: string; active: boolean }
type Branch = { id: string; name: string; active: boolean; companyId: string }
type Warehouse = { id: string; name: string; type?: string | null; active?: boolean }
type InventoryDevice = {
  id: string
  deviceName: string
  model: string
  serialNumber: string
  condition?: string
  location?: { id?: string; name?: string }
}

function normalize(text: string) {
  return String(text || '').toLowerCase()
}

export function OutgoingCargoWizardDialog({ open, onOpenChange, onSubmit }: OutgoingCargoWizardDialogProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [ticketOptions, setTicketOptions] = useState<TicketDeviceOption[]>([])
  const [sourceLocationId, setSourceLocationId] = useState('')
  const [inventoryDevices, setInventoryDevices] = useState<InventoryDevice[]>([])
  const [selectedEquivalentDeviceIds, setSelectedEquivalentDeviceIds] = useState<string[]>([])
  const [serialSearch, setSerialSearch] = useState('')

  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [targetLocationId, setTargetLocationId] = useState('')
  const [notes, setNotes] = useState('')

  const ticketBySerial = useMemo(() => {
    const map = new Map<string, TicketDeviceOption>()
    for (const item of ticketOptions) {
      const key = normalize(item.serialNumber)
      // Keep first (latest) match to avoid older records overriding metadata
      if (!map.has(key)) {
        map.set(key, item)
      }
    }
    return map
  }, [ticketOptions])

  const selectedDevices = useMemo(
    () => inventoryDevices.filter((d) => selectedEquivalentDeviceIds.includes(d.id)),
    [inventoryDevices, selectedEquivalentDeviceIds]
  )
  const selectedTickets = useMemo(
    () =>
      selectedDevices
        .map((d) => ticketBySerial.get(normalize(d.serialNumber)) || null)
        .filter((x): x is TicketDeviceOption => Boolean(x)),
    [selectedDevices, ticketBySerial]
  )
  const selectedTicket = useMemo(
    () => selectedTickets[0] || null,
    [selectedTickets]
  )
  const activeCompanies = useMemo(() => companies.filter((c) => c.active), [companies])
  const activeBranches = useMemo(
    () => branches.filter((b) => b.active && b.companyId === companyId),
    [branches, companyId]
  )
  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.active !== false && String(w.type || '').toUpperCase() !== 'CUSTOMER'),
    [warehouses]
  )

  const targetWarehouses = useMemo(
    () =>
      warehouses.filter((w) => {
        const type = String(w.type || '').toUpperCase()
        return w.active !== false && type !== 'HEADQUARTERS'
      }),
    [warehouses]
  )

  const filteredDevices = useMemo(() => {
    const q = normalize(serialSearch)
    const base = inventoryDevices
    if (!q) return base
    return base.filter((d) =>
      [d.serialNumber, d.deviceName, d.model].some((field) => normalize(field).includes(q))
    )
  }, [inventoryDevices, serialSearch])

  useEffect(() => {
    if (!open) return
    const load = async () => {
      const [cargoRes, companyRes, branchRes, warehouseRes] = await Promise.all([
        fetch('/api/cargo'),
        fetch('/api/incoming-cargo-companies'),
        fetch('/api/incoming-cargo-branches'),
        fetch('/api/warehouses'),
      ])

      const [cargoData, companyData, branchData, warehouseData] = await Promise.all([
        cargoRes.json(),
        companyRes.json(),
        branchRes.json(),
        warehouseRes.json(),
      ])

      setCompanies(Array.isArray(companyData) ? companyData : [])
      setBranches(Array.isArray(branchData) ? branchData : [])
      const warehouseList = Array.isArray(warehouseData) ? warehouseData : []
      setWarehouses(warehouseList)
      if (warehouseList.length > 0 && !sourceLocationId) {
        setSourceLocationId(String(warehouseList[0].id))
      }

      const allCargos = Array.isArray(cargoData) ? cargoData : []
      const options: TicketDeviceOption[] = []

      for (const cargo of allCargos) {
        const type = normalize(cargo?.type)
        const status = normalize(cargo?.recordStatus)
        const loc = normalize(cargo?.currentLocationName || cargo?.destinationAddress || '')
        if (type !== 'incoming') continue
        if (status === 'closed') continue
        if (!loc.includes('merkez')) continue

        const meta = parseIncomingCargoFlowMeta(cargo?.notes).meta
        const devices = Array.isArray(cargo?.devices) ? cargo.devices : []
        for (const device of devices) {
          options.push({
            cargoId: String(cargo.id),
            cargoTrackingNumber: String(cargo.trackingNumber || ''),
            deviceId: String(device.id),
            serialNumber: String(device.serialNumber || ''),
            incomingMeta: meta,
          })
        }
      }

      setTicketOptions(options)
    }
    load().catch((error) => console.error('outgoing wizard load error', error))
  }, [open, sourceLocationId])

  useEffect(() => {
    if (!open || !sourceLocationId) return
    const loadInventory = async () => {
      const res = await fetch(`/api/warehouses/inventory?locationId=${encodeURIComponent(sourceLocationId)}`)
      const data = await res.json()
      setInventoryDevices(Array.isArray(data) ? data : [])
      setSelectedEquivalentDeviceIds([])
    }
    loadInventory().catch((error) => console.error('outgoing wizard inventory load error', error))
  }, [open, sourceLocationId])

  useEffect(() => {
    if (!open || selectedDevices.length === 0) return

    const metas = selectedDevices
      .map((device) => ticketBySerial.get(normalize(device.serialNumber))?.incomingMeta || null)
      .filter((meta): meta is NonNullable<TicketDeviceOption['incomingMeta']> => Boolean(meta))

    if (metas.length === 0) return

    const uniqueCompanyIds = Array.from(new Set(metas.map((m) => String(m.companyId || '')).filter(Boolean)))
    const uniqueBranchIds = Array.from(new Set(metas.map((m) => String(m.branchId || '')).filter(Boolean)))

    if (uniqueCompanyIds.length === 1) {
      setCompanyId(uniqueCompanyIds[0])
    }
    if (uniqueBranchIds.length === 1) {
      setBranchId(uniqueBranchIds[0])
    }
  }, [open, selectedDevices, ticketBySerial])

  useEffect(() => {
    if (!open) return
    if (!targetLocationId && targetWarehouses.length > 0) {
      setTargetLocationId(targetWarehouses[0].id)
    }
  }, [open, targetLocationId, targetWarehouses])

  const validateStep = () => {
    if (step === 0) {
      if (!sourceLocationId) return 'Kaynak depo secmelisiniz'
      if (selectedDevices.length === 0) return 'Depodaki urunlerden en az bir cihaz secmelisiniz'
    }
    if (step === 1) {
      if (!companyId) return 'Firma secimi zorunlu'
      if (!branchId) return 'Sube secimi zorunlu'
      if (!targetLocationId) return 'Hedef depo secimi zorunlu'
    }
    return null
  }

  const nextStep = () => {
    const error = validateStep()
    if (error) return toast.error(error)
    setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))
  }

  const prevStep = () => setStep((s) => Math.max(0, s - 1))

  const handleSubmit = async () => {
    const error = validateStep()
    if (error) return toast.error(error)
    if (selectedDevices.length === 0) return

    const companyName = companies.find((c) => c.id === companyId)?.name || ''
    const branchName = branches.find((b) => b.id === branchId)?.name || ''

    setSubmitting(true)
    try {
      const ok = await onSubmit({
        selectedDevices: selectedDevices.map((device) => {
          const ticket = ticketBySerial.get(normalize(device.serialNumber))
          return {
            sourceCargoId: ticket?.cargoId,
            sourceDeviceId: ticket?.deviceId,
            sourceSerialNumber: device.serialNumber,
            sourceEquivalentDeviceId: device.id,
          }
        }),
        sourceLocationId,
        receiverCompanyName: companyName,
        receiverBranchName: branchName,
        targetLocationId,
        notes: notes.trim(),
      })
      if (ok === false) return
      toast.success(`${selectedDevices.length} urun transfer edildi`)
      onOpenChange(false)
      setStep(0)
      setSelectedEquivalentDeviceIds([])
      setCompanyId('')
      setBranchId('')
      setTargetLocationId('')
      setSourceLocationId('')
      setSerialSearch('')
      setNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name || '-'
  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || '-'
  const selectedWarehouseName = warehouses.find((w) => w.id === targetLocationId)?.name || '-'

  const toggleDevice = (deviceId: string) => {
    setSelectedEquivalentDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden border-slate-700/70 bg-slate-950/95 text-slate-100 shadow-[0_32px_80px_-40px_rgba(8,145,178,0.85)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_52%_88%,rgba(16,185,129,0.12),transparent_34%)]" />
        <DialogHeader>
          <DialogTitle className="text-slate-100">Yeni Giden Kargo - Ticket Uzerinden Transfer</DialogTitle>
          <DialogDescription className="text-slate-300">
            Merkez ofisteki acik ticket urununu secin, hedef depoyu belirleyin ve transferi tamamlayin.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {STEP_TITLES.map((title, idx) => {
              const done = idx < step
              const active = idx === step
              return (
                <div
                  key={title}
                  className={`rounded-lg border px-2 py-2 text-xs transition-all ${
                    active
                      ? 'border-blue-400/60 bg-blue-500/15 text-blue-100 shadow-[0_14px_28px_-22px_rgba(59,130,246,0.9)]'
                      : done
                        ? 'border-slate-600 bg-slate-800/90 text-slate-200'
                        : 'border-slate-700 bg-slate-900/75 text-slate-400'
                  }`}
                >
                  <div className="font-semibold">Adim {idx + 1}</div>
                  <div className="truncate">{title}</div>
                </div>
              )
            })}
          </div>
          <div className="h-2 rounded bg-slate-800">
            <div className="h-2 rounded bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all" style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }} />
          </div>
        </div>

        <div className="relative z-10 space-y-4 py-2">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kaynak Depo (kare secim)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {activeWarehouses.map((warehouse) => {
                    const selected = sourceLocationId === warehouse.id
                    return (
                      <button
                        type="button"
                        key={warehouse.id}
                        onClick={() => setSourceLocationId(warehouse.id)}
                        className={`rounded-lg border px-3 py-3 text-left transition ${
                          selected
                            ? 'border-blue-400/60 bg-blue-500/15 text-blue-100'
                            : 'border-slate-700 bg-slate-900/75 hover:border-blue-400/30 hover:bg-slate-900'
                        }`}
                      >
                        <div className="text-sm font-semibold">{warehouse.name}</div>
                        <div className="text-xs text-slate-400">{String(warehouse.type || '').toUpperCase()}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seri No ile Urun Ara</Label>
                <Input
                  placeholder="Seri no yazarak ara (elle giris)"
                  value={serialSearch}
                  onChange={(e) => setSerialSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Depodaki Ticket Urunleri</Label>
                <div className="themed-scrollbar max-h-64 space-y-2 overflow-y-auto rounded-md border border-slate-700 bg-slate-900/70 p-2">
                  {filteredDevices.map((device) => {
                    const selected = selectedEquivalentDeviceIds.includes(device.id)
                    const ticket = ticketBySerial.get(normalize(device.serialNumber))
                    return (
                      <button
                        type="button"
                        key={device.id}
                        onClick={() => toggleDevice(device.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition ${
                          selected
                            ? 'border-blue-400/60 bg-blue-500/15'
                            : 'border-slate-700 bg-slate-950/80 hover:border-blue-400/30 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{device.deviceName} / {device.model}</div>
                          {selected ? <Badge>Secili</Badge> : <Badge variant="outline">Sec</Badge>}
                        </div>
                        <div className="text-xs text-slate-300">Seri: {device.serialNumber}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {ticket ? <Badge variant="outline">Ticket: {ticket.cargoTrackingNumber}</Badge> : <Badge variant="secondary">Ticket bulunamadi</Badge>}
                        </div>
                      </button>
                    )
                  })}
                  {filteredDevices.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Bu depoda aramaya uygun ticket urunu yok.</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Firma</Label>
                <Select value={companyId} onValueChange={(value) => { setCompanyId(value); setBranchId('') }}>
                  <SelectTrigger><SelectValue placeholder="Firma secin" /></SelectTrigger>
                  <SelectContent>
                    {activeCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sube</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Sube secin" /></SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hedef Depo</Label>
                <Select value={targetLocationId} onValueChange={setTargetLocationId}>
                  <SelectTrigger><SelectValue placeholder="Depo secin" /></SelectTrigger>
                  <SelectContent>
                    {targetWarehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
                <div><strong>Kaynak Ticket:</strong> {selectedTicket?.cargoTrackingNumber || 'Eslesme yok'}</div>
                <div><strong>Kaynak Depo:</strong> {warehouses.find((w) => w.id === sourceLocationId)?.name || '-'}</div>
                <div><strong>Secili Urun:</strong> {selectedDevices.length} adet</div>
                <div><strong>Alici:</strong> {selectedCompanyName} / {selectedBranchName}</div>
                <div><strong>Hedef Depo:</strong> {selectedWarehouseName}</div>
              </div>
              <div className="space-y-2">
                <Label>Transfer Notu</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel not" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="relative z-10 gap-2">
          <Button type="button" variant="outline" className="border-slate-600 bg-slate-900/80 text-slate-100 hover:bg-slate-800" onClick={prevStep} disabled={step === 0 || submitting}>
            Geri
          </Button>
          {step < STEP_TITLES.length - 1 ? (
            <Button type="button" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400" onClick={nextStep}>
              Ileri
            </Button>
          ) : (
            <Button type="button" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Transfer ediliyor...' : 'Transferi Tamamla'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
