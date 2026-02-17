'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CargoTracking } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CargoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cargo: Partial<CargoTracking>) => void
  initialData?: CargoTracking | null
  mode?: 'create' | 'edit'
}

type DeviceSourceType = 'equivalent' | 'customer' | 'other'

interface DeviceFormData {
  sourceType: DeviceSourceType
  equivalentDeviceId: string
  deviceName: string
  model: string
  serialNumber: string
  quantity: string
  condition: 'new' | 'used' | 'refurbished' | 'damaged'
  purpose: 'installation' | 'replacement' | 'repair' | 'return'
  customerName: string
  customerCompanyName: string
}

interface CargoCompany {
  id: string
  name: string
}

interface EquivalentDeviceOption {
  id: string
  deviceNumber: string
  deviceName: string
  brand: string
  model: string
  serialNumber: string
  status: string
  recordStatus?: string
}

interface LookupItem {
  serialNumber: string
  deviceName: string
  model: string
  brand?: string
  source?: string
  customerName?: string
  companyName?: string
  equivalentDeviceId?: string
}

const DEFAULT_CARGO_COMPANIES = ['MNG Kargo', 'Aras Kargo', 'Yurtici Kargo']

const createEmptyDevice = (): DeviceFormData => ({
  sourceType: 'customer',
  equivalentDeviceId: '',
  deviceName: '',
  model: '',
  serialNumber: '',
  quantity: '1',
  condition: 'new',
  purpose: 'installation',
  customerName: '',
  customerCompanyName: '',
})

export function CargoFormDialog({ open, onOpenChange, onSubmit, initialData, mode = 'create' }: CargoFormDialogProps) {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    type: 'OUTGOING' as string,
    recordStatus: 'OPEN' as string,
    sender: '',
    receiver: '',
    cargoCompany: '',
    destination: 'CUSTOMER' as string,
    destinationAddress: '',
    sentDate: new Date().toISOString().split('T')[0],
    notes: '',
    targetLocationId: '',
  })

  const [devices, setDevices] = useState<DeviceFormData[]>([createEmptyDevice()])
  const [companies, setCompanies] = useState<CargoCompany[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [equivalentDevices, setEquivalentDevices] = useState<EquivalentDeviceOption[]>([])
  const [serialSuggestions, setSerialSuggestions] = useState<Record<number, LookupItem[]>>({})
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const mergedCompanies = useMemo(
    () => Array.from(new Set([...DEFAULT_CARGO_COMPANIES, ...companies.map((company) => company.name)])),
    [companies]
  )

  useEffect(() => {
    if (!open) return

    setLoadingCompanies(true)
    fetch('/api/cargo-companies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data)
      })
      .catch((err) => console.error('Failed to load cargo companies', err))
      .finally(() => setLoadingCompanies(false))

    fetch('/api/warehouses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWarehouses(data)
      })
      .catch((err) => console.error('Failed to load warehouses', err))

    fetch('/api/equivalent-devices')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return
        const normalized = data
          .map((item: any) => ({
            id: item.id,
            deviceNumber: item.deviceNumber,
            deviceName: item.deviceName,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
            status: String(item.status || '').toLowerCase(),
            recordStatus: String(item.recordStatus || 'open').toLowerCase(),
          }))
          .filter((item: EquivalentDeviceOption) => item.recordStatus !== 'closed')
        setEquivalentDevices(normalized)
      })
      .catch((err) => console.error('Failed to load equivalent devices', err))

    if (initialData) {
      const sentDate = initialData.sentDate
        ? new Date(initialData.sentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

      setFormData({
        trackingNumber: initialData.trackingNumber || '',
        type: initialData.type ? initialData.type.toUpperCase() : 'OUTGOING',
        recordStatus: initialData.recordStatus ? initialData.recordStatus.toUpperCase() : 'OPEN',
        sender: initialData.sender || '',
        receiver: initialData.receiver || '',
        cargoCompany: initialData.cargoCompany || '',
        destination: initialData.destination ? initialData.destination.toUpperCase() : 'CUSTOMER',
        destinationAddress: initialData.destinationAddress || '',
        sentDate,
        notes: initialData.notes || '',
        targetLocationId: '',
      })

      if (initialData.devices && initialData.devices.length > 0) {
        setDevices(
          initialData.devices.map((device) => ({
            sourceType: (device.deviceSource as DeviceSourceType) || 'other',
            equivalentDeviceId: device.equivalentDeviceId || '',
            deviceName: device.deviceName || '',
            model: device.model || '',
            serialNumber: device.serialNumber || '',
            quantity: String(device.quantity || 1),
            condition: device.condition || 'new',
            purpose: device.purpose || 'installation',
            customerName: device.customerName || '',
            customerCompanyName: device.customerCompanyName || '',
          }))
        )
      } else {
        setDevices([createEmptyDevice()])
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        sentDate: prev.sentDate || new Date().toISOString().split('T')[0],
      }))
      setDevices([createEmptyDevice()])
    }
  }, [open, initialData])

  const updateDevice = (index: number, patch: Partial<DeviceFormData>) => {
    setDevices((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addDevice = () => setDevices((prev) => [...prev, createEmptyDevice()])

  const removeDevice = (index: number) => {
    if (devices.length <= 1) return
    setDevices((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSourceTypeChange = (index: number, sourceType: DeviceSourceType) => {
    if (sourceType === 'equivalent') {
      updateDevice(index, {
        sourceType,
        equivalentDeviceId: '',
        deviceName: '',
        model: '',
        serialNumber: '',
        customerName: '',
        customerCompanyName: '',
      })
      return
    }

    updateDevice(index, {
      sourceType,
      equivalentDeviceId: '',
      customerName: '',
      customerCompanyName: '',
    })
  }

  const handleEquivalentSelect = (index: number, equivalentDeviceId: string) => {
    const selected = equivalentDevices.find((item) => item.id === equivalentDeviceId)
    if (!selected) return

    updateDevice(index, {
      sourceType: 'equivalent',
      equivalentDeviceId: selected.id,
      deviceName: selected.deviceName,
      model: selected.model,
      serialNumber: selected.serialNumber,
      customerName: '',
      customerCompanyName: '',
    })
  }

  const fetchSerialSuggestions = async (index: number, query: string) => {
    const q = query.trim()
    if (q.length < 2) {
      setSerialSuggestions((prev) => ({ ...prev, [index]: [] }))
      return
    }

    try {
      const response = await fetch(`/api/devices/lookup?q=${encodeURIComponent(q)}`)
      if (!response.ok) return
      const data = await response.json()
      const items = Array.isArray(data?.items) ? data.items : []
      setSerialSuggestions((prev) => ({ ...prev, [index]: items }))
    } catch (error) {
      console.error('Serial search failed', error)
    }
  }

  const applySuggestion = (index: number, serialValue: string) => {
    const list = serialSuggestions[index] || []
    const picked = list.find((item) => item.serialNumber === serialValue)
    if (!picked) return

    updateDevice(index, {
      serialNumber: picked.serialNumber,
      deviceName: picked.deviceName || devices[index].deviceName,
      model: picked.model || devices[index].model,
      customerName: picked.customerName || '',
      customerCompanyName: picked.companyName || '',
      equivalentDeviceId: picked.equivalentDeviceId || devices[index].equivalentDeviceId,
    })
  }

  const handleCustomerSerialChange = (index: number, serialNumber: string) => {
    updateDevice(index, {
      serialNumber,
      customerName: '',
      customerCompanyName: '',
    })
    fetchSerialSuggestions(index, serialNumber)
  }

  const handleSerialBlur = async (index: number) => {
    const serial = devices[index].serialNumber
    if (!serial || serial.length < 2) return

    applySuggestion(index, serial)

    try {
      const res = await fetch(`/api/devices/lookup?serial=${encodeURIComponent(serial)}`)
      if (!res.ok) return

      const data = await res.json()
      if (!data) return

      updateDevice(index, {
        deviceName: data.deviceName || devices[index].deviceName,
        model: data.model || devices[index].model,
        customerName: data.customerName || devices[index].customerName,
        customerCompanyName: data.companyName || devices[index].customerCompanyName,
      })
    } catch (error) {
      console.error('Serial lookup failed', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const invalidEquivalent = devices.find((d) => d.sourceType === 'equivalent' && !d.equivalentDeviceId)
    if (invalidEquivalent) {
      toast.error('Muadil cihaz satirlarinda listeden cihaz secmelisiniz')
      return
    }

    const invalidCustomer = devices.find((d) => d.sourceType === 'customer' && !d.serialNumber)
    if (invalidCustomer) {
      toast.error('Musteri cihazlarinda seri no zorunludur')
      return
    }

    const payload: any = {
      trackingNumber: formData.trackingNumber,
      type: formData.type.toLowerCase(),
      status: 'in_transit',
      recordStatus: formData.recordStatus.toLowerCase(),
      sender: formData.sender,
      receiver: formData.receiver,
      cargoCompany: formData.cargoCompany,
      sentDate: formData.sentDate ? new Date(formData.sentDate).toISOString() : new Date().toISOString(),
      destination: formData.destination,
      destinationAddress: formData.destinationAddress,
      notes: formData.notes,
      targetLocationId: formData.targetLocationId,
      devices: devices.map((device) => ({
        sourceType: device.sourceType,
        equivalentDeviceId: device.equivalentDeviceId || undefined,
        deviceName: device.deviceName,
        model: device.model,
        serialNumber: device.serialNumber,
        customerName: device.customerName || undefined,
        customerCompanyName: device.customerCompanyName || undefined,
        quantity: parseInt(device.quantity, 10) || 1,
        condition: device.condition,
        purpose: device.purpose,
      })),
    }

    onSubmit(payload)

    if (mode === 'create') {
      setFormData({
        trackingNumber: '',
        type: 'OUTGOING',
        recordStatus: 'OPEN',
        sender: '',
        receiver: '',
        cargoCompany: '',
        destination: 'CUSTOMER',
        destinationAddress: '',
        sentDate: new Date().toISOString().split('T')[0],
        notes: '',
        targetLocationId: '',
      })
      setDevices([createEmptyDevice()])
      setSerialSuggestions({})
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Kargo Kaydi Duzenle' : 'Yeni Kargo Kaydi'}</DialogTitle>
          <DialogDescription>
            Muadil cihazlar icin listeden secim yapin. Musteri cihazlarini seri numarasi ile takip edin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Takip Numarasi *</Label>
              <Input
                value={formData.trackingNumber}
                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                placeholder="TK123456"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kargo Sirketi *</Label>
              <Select value={formData.cargoCompany} onValueChange={(value) => setFormData({ ...formData, cargoCompany: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seciniz..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingCompanies ? (
                    <SelectItem value="loading" disabled>
                      Yukleniyor...
                    </SelectItem>
                  ) : (
                    mergedCompanies.map((companyName) => (
                      <SelectItem key={companyName} value={companyName}>
                        {companyName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kargo Tipi *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">Gelen Kargo</SelectItem>
                  <SelectItem value="OUTGOING">Giden Kargo</SelectItem>
                  <SelectItem value="ON_SITE_SERVICE">Yerinde Servis</SelectItem>
                  <SelectItem value="INSTALLATION_TEAM">Kurulum Ekibi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kayit Durumu *</Label>
              <Select value={formData.recordStatus} onValueChange={(value) => setFormData({ ...formData, recordStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Acik</SelectItem>
                  <SelectItem value="ON_HOLD">Beklemede</SelectItem>
                  <SelectItem value="DEVICE_REPAIR">Cihaz Tamiri</SelectItem>
                  <SelectItem value="CLOSED">Kapali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gonderen *</Label>
              <Input value={formData.sender} onChange={(e) => setFormData({ ...formData, sender: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Alici *</Label>
              <Input value={formData.receiver} onChange={(e) => setFormData({ ...formData, receiver: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Hedef *</Label>
              <Select value={formData.destination} onValueChange={(value) => setFormData({ ...formData, destination: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Musteri</SelectItem>
                  <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                  <SelectItem value="BRANCH">Sube</SelectItem>
                  <SelectItem value="HEADQUARTERS">Merkez</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'INCOMING' && (
              <div className="space-y-2">
                <Label>Giris Lokasyonu</Label>
                <Select value={formData.targetLocationId} onValueChange={(value) => setFormData({ ...formData, targetLocationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Depo secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Teslimat Adresi *</Label>
              <Textarea
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cihaz Listesi</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open('/dashboard/equivalent-devices', '_blank')}
                >
                  Muadil Listesini Yonet
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addDevice}>
                  <Plus className="h-4 w-4 mr-1" />
                  Cihaz Ekle
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {devices.map((device, index) => (
                <div key={index} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">Cihaz #{index + 1}</div>
                    {devices.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDevice(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cihaz Turu *</Label>
                      <Select
                        value={device.sourceType}
                        onValueChange={(value: DeviceSourceType) => handleSourceTypeChange(index, value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equivalent">Muadil (hazir listeden)</SelectItem>
                          <SelectItem value="customer">Musteri Cihazi (seri no)</SelectItem>
                          <SelectItem value="other">Diger</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {device.sourceType === 'equivalent' ? (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Muadil Cihaz Sec *</Label>
                        <Select
                          value={device.equivalentDeviceId}
                          onValueChange={(value) => handleEquivalentSelect(index, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Muadil cihaz secin" />
                          </SelectTrigger>
                          <SelectContent>
                            {equivalentDevices.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id}>
                                {eq.deviceNumber} - {eq.deviceName} / {eq.model} / {eq.serialNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Seri No {device.sourceType === 'customer' ? '*' : ''}</Label>
                        <Input
                          value={device.serialNumber}
                          list={`serial-suggestions-${index}`}
                          onChange={(e) => handleCustomerSerialChange(index, e.target.value)}
                          onBlur={() => handleSerialBlur(index)}
                          placeholder={device.sourceType === 'customer' ? 'Seri no yazin (oneriler cikacak)' : 'Seri no'}
                          className="h-9"
                        />
                        <datalist id={`serial-suggestions-${index}`}>
                          {(serialSuggestions[index] || []).map((item) => (
                            <option
                              key={`${item.serialNumber}-${item.source || 'src'}`}
                              value={item.serialNumber}
                              label={`${item.deviceName || ''} ${item.model || ''} ${item.customerName ? '- ' + item.customerName : ''}`}
                            />
                          ))}
                        </datalist>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">Cihaz Adi *</Label>
                      <Input
                        value={device.deviceName}
                        onChange={(e) => updateDevice(index, { deviceName: e.target.value })}
                        className="h-9"
                        required
                        disabled={device.sourceType === 'equivalent'}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Model *</Label>
                      <Input
                        value={device.model}
                        onChange={(e) => updateDevice(index, { model: e.target.value })}
                        className="h-9"
                        required
                        disabled={device.sourceType === 'equivalent'}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Adet *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={device.quantity}
                        onChange={(e) => updateDevice(index, { quantity: e.target.value })}
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Durum *</Label>
                      <Select value={device.condition} onValueChange={(value: any) => updateDevice(index, { condition: value })}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Yeni</SelectItem>
                          <SelectItem value="used">Kullanilmis</SelectItem>
                          <SelectItem value="refurbished">Yenilenmis</SelectItem>
                          <SelectItem value="damaged">Hasarli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Amac *</Label>
                      <Select value={device.purpose} onValueChange={(value: any) => updateDevice(index, { purpose: value })}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="installation">Kurulum</SelectItem>
                          <SelectItem value="replacement">Degisim</SelectItem>
                          <SelectItem value="repair">Tamir</SelectItem>
                          <SelectItem value="return">Iade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {device.sourceType === 'customer' && (device.customerName || device.customerCompanyName) && (
                    <div className="text-xs rounded bg-muted p-2">
                      Bulunan Musteri Bilgisi: {device.customerName || '-'} / {device.customerCompanyName || '-'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Iptal
            </Button>
            <Button type="submit">{mode === 'edit' ? 'Kaydi Guncelle' : 'Kaydi Olustur'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
