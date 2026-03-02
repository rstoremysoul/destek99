'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { CargoTracking } from '@/types'

type IncomingChannel = 'cargo' | 'on_site_service' | 'supplier' | 'installation_team' | 'customer'
type CosmeticState = 'normal' | 'damaged_in_shipping'

type Company = { id: string; name: string; active: boolean; branches?: Array<{ id: string; name: string; active: boolean }> }
type Branch = { id: string; name: string; active: boolean; companyId: string }
type Fault = { id: string; name: string; active: boolean }

type DeviceLine = {
  deviceName: string
  model: string
  serialNumber: string
}

interface IncomingCargoWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cargo: Partial<CargoTracking>) => Promise<boolean | void> | boolean | void
}

const STEP_TITLES = [
  'Urun Gelme Kanali',
  'Tasima Bilgisi',
  'Firma ve Sube',
  'Cihaz Bilgileri',
  'Ariza ve Kozmetik',
  'Onizleme',
]

const CHANNEL_LABELS: Record<IncomingChannel, string> = {
  cargo: 'Kargo',
  on_site_service: 'Yerinde Servis',
  supplier: 'Tedarikci',
  installation_team: 'Kurulum Ekibi',
  customer: 'Musteri',
}

const createEmptyDevice = (): DeviceLine => ({
  deviceName: '',
  model: '',
  serialNumber: '',
})

function buildAutoTrackingNumber() {
  return `INC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 90 + 10)}`
}

function buildDeviceId() {
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function IncomingCargoWizardDialog({ open, onOpenChange, onSubmit }: IncomingCargoWizardDialogProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [channel, setChannel] = useState<IncomingChannel>('cargo')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [cargoCompany, setCargoCompany] = useState('')
  const [cargoCompanies, setCargoCompanies] = useState<string[]>([])

  const [companies, setCompanies] = useState<Company[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')

  const [deviceTypes, setDeviceTypes] = useState<string[]>([])
  const [deviceModels, setDeviceModels] = useState<Array<{ id: string; name: string; active: boolean; brand: { name: string } }>>([])
  const [devices, setDevices] = useState<DeviceLine[]>([createEmptyDevice()])

  const [faultOptions, setFaultOptions] = useState<Fault[]>([])
  const [selectedFaultIds, setSelectedFaultIds] = useState<string[]>([])
  const [cosmeticState, setCosmeticState] = useState<CosmeticState>('normal')
  const [cosmeticDetail, setCosmeticDetail] = useState('')
  const [damageImageData, setDamageImageData] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const requiresTransport = channel !== 'on_site_service' && channel !== 'installation_team'
  const activeCompanies = companies.filter((c) => c.active)
  const activeBranches = branches.filter((b) => b.active && b.companyId === companyId)
  const activeFaults = faultOptions.filter((f) => f.active)

  const selectedCompanyName = useMemo(
    () => companies.find((c) => c.id === companyId)?.name || '',
    [companies, companyId]
  )
  const selectedBranchName = useMemo(
    () => branches.find((b) => b.id === branchId)?.name || '',
    [branches, branchId]
  )

  useEffect(() => {
    if (!open) return
    const load = async () => {
      const [
        companyRes,
        branchRes,
        faultRes,
        deviceTypeRes,
        modelRes,
        cargoCompanyRes,
      ] = await Promise.all([
        fetch('/api/incoming-cargo-companies'),
        fetch('/api/incoming-cargo-branches'),
        fetch('/api/incoming-cargo-faults'),
        fetch('/api/brands'),
        fetch('/api/models/all'),
        fetch('/api/cargo-companies'),
      ])

      const [
        companyData,
        branchData,
        faultData,
        deviceTypeData,
        modelData,
        cargoCompanyData,
      ] = await Promise.all([
        companyRes.json(),
        branchRes.json(),
        faultRes.json(),
        deviceTypeRes.json(),
        modelRes.json(),
        cargoCompanyRes.json(),
      ])

      setCompanies(Array.isArray(companyData) ? companyData : [])
      setBranches(Array.isArray(branchData) ? branchData : [])
      setFaultOptions(Array.isArray(faultData) ? faultData : [])
      setDeviceTypes(Array.isArray(deviceTypeData) ? deviceTypeData : [])
      setDeviceModels(Array.isArray(modelData) ? modelData : [])
      setCargoCompanies(
        Array.isArray(cargoCompanyData)
          ? cargoCompanyData
              .filter((c: any) => c?.active !== false)
              .map((c: any) => String(c.name || ''))
              .filter(Boolean)
          : []
      )
    }
    load().catch((e) => console.error('incoming wizard load error', e))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!companyId && activeCompanies.length > 0) {
      setCompanyId(activeCompanies[0].id)
    }
  }, [open, companyId, activeCompanies])

  useEffect(() => {
    if (!open) return
    if (!branchId && activeBranches.length > 0) {
      setBranchId(activeBranches[0].id)
    }
  }, [open, branchId, activeBranches])

  useEffect(() => {
    if (!open) return
    if (!requiresTransport) {
      setCargoCompany('Yerinde/Kurulum')
      if (!trackingNumber) setTrackingNumber(buildAutoTrackingNumber())
    }
  }, [open, requiresTransport, trackingNumber])

  const modelsForDevice = (deviceName: string) => {
    return deviceModels
      .filter((m) => m.active && m.brand?.name === deviceName)
      .map((m) => m.name)
  }

  const updateDevice = (index: number, patch: Partial<DeviceLine>) => {
    setDevices((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  const toggleFault = (faultId: string) => {
    setSelectedFaultIds((prev) => (prev.includes(faultId) ? prev.filter((id) => id !== faultId) : [...prev, faultId]))
  }

  const handleDamageImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setDamageImageData([])
      return
    }
    const readers = Array.from(files).slice(0, 4).map((file) => {
      return new Promise<string>((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result || ''))
        r.onerror = () => resolve('')
        r.readAsDataURL(file)
      })
    })
    const values = await Promise.all(readers)
    setDamageImageData(values.filter(Boolean))
  }

  const validateStep = () => {
    if (step === 0 && !channel) return 'Urun gelme kanalini secin'
    if (step === 1 && requiresTransport) {
      if (!trackingNumber.trim()) return 'Takip no zorunlu'
      if (!cargoCompany.trim()) return 'Kargo firmasi zorunlu'
    }
    if (step === 2) {
      if (!companyId) return 'Firma secimi zorunlu'
      if (!branchId) return 'Sube secimi zorunlu'
    }
    if (step === 3) {
      for (let i = 0; i < devices.length; i++) {
        const d = devices[i]
        if (!d.deviceName || !d.model || !d.serialNumber.trim()) {
          return `Cihaz #${i + 1} icin cihaz/model/seri no zorunlu`
        }
      }
    }
    if (step === 4 && cosmeticState === 'damaged_in_shipping' && damageImageData.length === 0) {
      return 'Kargodan hasarli geldiyse en az bir gorsel yuklenmeli'
    }
    return null
  }

  const nextStep = () => {
    const error = validateStep()
    if (error) {
      toast.error(error)
      return
    }
    setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))
  }

  const prevStep = () => setStep((s) => Math.max(0, s - 1))

  const handleSubmit = async () => {
    const error = validateStep()
    if (error) {
      toast.error(error)
      return
    }

    const selectedFaultNames = activeFaults
      .filter((f) => selectedFaultIds.includes(f.id))
      .map((f) => f.name)

    const flowMeta = {
      channel,
      companyId,
      companyName: selectedCompanyName,
      branchId,
      branchName: selectedBranchName,
      selectedFaultIds,
      selectedFaultNames,
      cosmeticState,
      cosmeticDetail: cosmeticDetail || '',
      damageImageData,
    }

    const payload: Partial<CargoTracking> = {
      trackingNumber: requiresTransport ? trackingNumber.trim() : buildAutoTrackingNumber(),
      type: 'incoming',
      status: 'in_transit',
      recordStatus: 'open',
      sender: `${selectedCompanyName}${selectedBranchName ? ' / ' + selectedBranchName : ''}`,
      receiver: '',
      cargoCompany: requiresTransport ? cargoCompany : 'Yerinde/Kurulum',
      destination: 'headquarters',
      destinationAddress: 'Merkez Ofis Deposu',
      notes: [
        notes?.trim() || '',
        `[[INCOMING_FLOW_META]] ${JSON.stringify(flowMeta)}`,
      ].filter(Boolean).join('\n'),
      devices: devices.map((d) => ({
        id: buildDeviceId(),
        deviceName: d.deviceName,
        model: d.model,
        serialNumber: d.serialNumber.trim(),
        quantity: 1,
        condition: 'used',
        purpose: 'repair',
      })),
    }

    setSubmitting(true)
    try {
      const ok = await onSubmit(payload)
      if (ok === false) return
      toast.success('Gelen kargo kaydi olusturuldu')
      onOpenChange(false)
      setStep(0)
      setChannel('cargo')
      setTrackingNumber('')
      setCargoCompany('')
      setDevices([createEmptyDevice()])
      setSelectedFaultIds([])
      setCosmeticState('normal')
      setCosmeticDetail('')
      setDamageImageData([])
      setNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <DialogHeader>
          <DialogTitle>Yeni Gelen Kargo - Adim Adim Kayit</DialogTitle>
          <DialogDescription>
            Her adimi tamamlayarak kaydi net ve tutarli sekilde olusturun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {STEP_TITLES.map((title, idx) => {
              const done = idx < step
              const active = idx === step
              return (
                <div
                  key={title}
                  className={`rounded-lg border px-2 py-2 text-xs transition-all ${
                    active
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                      : done
                        ? 'border-slate-300 bg-slate-100 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <div className="font-semibold">Adim {idx + 1}</div>
                  <div className="truncate">{title}</div>
                </div>
              )
            })}
          </div>
          <div className="h-2 rounded bg-slate-200">
            <div className="h-2 rounded bg-emerald-500 transition-all" style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
                Once urunun ofise nasil geldigi secilir. Kanal secimine gore tasima adimi otomatik uyarlanir.
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(CHANNEL_LABELS) as IncomingChannel[]).map((value) => {
                  const selected = channel === value
                  const lightweightFlow = value === 'on_site_service' || value === 'installation_team'
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setChannel(value)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{CHANNEL_LABELS[value]}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {lightweightFlow ? 'Takip no ve kargo firmasi adimi zorunlu degil.' : 'Takip no ve kargo firmasi adimi gerekir.'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {requiresTransport ? (
                <>
                  <div className="space-y-2">
                    <Label>Takip No</Label>
                    <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="TK-..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Kargo Firmasi</Label>
                    {cargoCompanies.length > 0 ? (
                      <Select value={cargoCompany} onValueChange={setCargoCompany}>
                        <SelectTrigger><SelectValue placeholder="Firma secin" /></SelectTrigger>
                        <SelectContent>
                          {cargoCompanies.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                          Secilebilir kargo firmasi yok. Ayarlar ekranindan firma ekleyin.
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => window.open('/dashboard/settings', '_blank')}
                        >
                          Ayarlari Ac
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  {CHANNEL_LABELS[channel]} secildigi icin kargo firmasi ve takip no adimi otomatik gecilecek.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Firma Adi</Label>
                <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setBranchId('') }}>
                  <SelectTrigger><SelectValue placeholder="Firma secin" /></SelectTrigger>
                  <SelectContent>
                    {activeCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sube Adi</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="Sube secin" /></SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {devices.map((device, index) => (
                <div key={index} className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Cihaz Adi</Label>
                    <Select value={device.deviceName} onValueChange={(v) => updateDevice(index, { deviceName: v, model: '' })}>
                      <SelectTrigger><SelectValue placeholder="Cihaz secin" /></SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={device.model} onValueChange={(v) => updateDevice(index, { model: v })}>
                      <SelectTrigger><SelectValue placeholder="Model secin" /></SelectTrigger>
                      <SelectContent>
                        {modelsForDevice(device.deviceName).map((m) => (
                          <SelectItem key={`${device.deviceName}-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seri No</Label>
                    <Input value={device.serialNumber} onChange={(e) => updateDevice(index, { serialNumber: e.target.value })} />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDevices((prev) => [...prev, createEmptyDevice()])}>
                  Cihaz Satiri Ekle
                </Button>
                {devices.length > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setDevices((prev) => prev.slice(0, -1))}>
                    Son Satiri Sil
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bildirilen Ariza (coklu secim)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeFaults.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 rounded border p-2 text-sm">
                      <Checkbox checked={selectedFaultIds.includes(f.id)} onCheckedChange={() => toggleFault(f.id)} />
                      {f.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kozmetik Durumu</Label>
                <Select value={cosmeticState} onValueChange={(v: CosmeticState) => setCosmeticState(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="damaged_in_shipping">Kargodan Hasarli Geldi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cosmeticState === 'damaged_in_shipping' ? (
                <div className="space-y-2">
                  <Label>Hasar Aciklamasi</Label>
                  <Textarea value={cosmeticDetail} onChange={(e) => setCosmeticDetail(e.target.value)} placeholder="Kart okuyucu kirik, kasa kirik, ekran cizik vb." />
                  <Label>Gorsel Yukle (zorunlu)</Label>
                  <Input type="file" accept="image/*" multiple onChange={(e) => handleDamageImageChange(e.target.files)} />
                  {damageImageData.length > 0 ? (
                    <div className="text-xs text-muted-foreground">{damageImageData.length} gorsel secildi</div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Ek Not</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ek notlar..." />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <div><strong>Kanal:</strong> {CHANNEL_LABELS[channel]}</div>
              <div><strong>Takip No:</strong> {requiresTransport ? trackingNumber || '-' : '(otomatik)'}</div>
              <div><strong>Kargo Firmasi:</strong> {requiresTransport ? cargoCompany || '-' : 'Yerinde/Kurulum'}</div>
              <div><strong>Firma/Sube:</strong> {selectedCompanyName} / {selectedBranchName}</div>
              <div><strong>Cihaz Sayisi:</strong> {devices.length}</div>
              <div><strong>Ariza Secimi:</strong> {selectedFaultIds.length}</div>
              <div><strong>Kozmetik:</strong> {cosmeticState === 'damaged_in_shipping' ? 'Hasarli' : 'Normal'}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => (step === 0 ? onOpenChange(false) : prevStep())}>Geri</Button>
          {step < STEP_TITLES.length - 1 ? (
            <Button onClick={nextStep}>Ileri</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Kaydediliyor...' : 'Kaydi Olustur'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
