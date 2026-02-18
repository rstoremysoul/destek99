'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

interface LookupHistoryItem {
  source: 'cargo' | 'repair' | 'installation' | 'equivalent'
  date: string
  title: string
  details: string
}

interface DeviceModelOption {
  id: string
  name: string
  active: boolean
  brandId: string
  brand: {
    id: string
    name: string
    active: boolean
  }
}

const DEFAULT_CARGO_COMPANIES = ['MNG Kargo', 'Aras Kargo', 'Yurtici Kargo']
const DEFAULT_DEVICE_TYPES = [
  'RobotPOS Cihaz',
  'RobotPOS Musteri Gostergesi',
  'Hugin Cihaz',
  'RobotPOS Termal Yazici',
  'OrderGo El Terminali',
]
const DEFAULT_INCOMING_ADDRESS = 'Merkez Ofis Deposu'

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
  const [serialHistory, setSerialHistory] = useState<Record<number, LookupHistoryItem[]>>({})
  const [deviceTypes, setDeviceTypes] = useState<string[]>([])
  const [deviceModels, setDeviceModels] = useState<DeviceModelOption[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [trackingCheck, setTrackingCheck] = useState({
    checking: false,
    exists: false,
    checkedValue: '',
  })
  const trackingCheckReqRef = useRef(0)

  const mergedCompanies = useMemo(
    () => Array.from(new Set([...DEFAULT_CARGO_COMPANIES, ...companies.map((company) => company.name)])),
    [companies]
  )
  const mergedDeviceTypes = useMemo(
    () => Array.from(new Set([...DEFAULT_DEVICE_TYPES, ...deviceTypes])),
    [deviceTypes]
  )

  const headquartersWarehouse = useMemo(
    () => warehouses.find((w) => /merkez|ofis/i.test(w.name)) || warehouses[0],
    [warehouses]
  )
  const initialTrackingNumber = (initialData?.trackingNumber || '').trim()

  const checkTrackingConflict = async (rawTrackingNumber: string) => {
    const trackingNumber = rawTrackingNumber.trim()
    if (!trackingNumber) {
      setTrackingCheck({ checking: false, exists: false, checkedValue: '' })
      return false
    }

    if (mode === 'edit' && trackingNumber === initialTrackingNumber) {
      setTrackingCheck({ checking: false, exists: false, checkedValue: trackingNumber })
      return false
    }

    const requestId = ++trackingCheckReqRef.current
    setTrackingCheck((prev) => ({ ...prev, checking: true }))

    try {
      const params = new URLSearchParams({ trackingNumber })
      if (mode === 'edit' && initialData?.id) {
        params.set('excludeId', initialData.id)
      }
      const res = await fetch(`/api/cargo/check-tracking?${params.toString()}`)
      if (!res.ok) {
        if (requestId === trackingCheckReqRef.current) {
          setTrackingCheck({ checking: false, exists: false, checkedValue: trackingNumber })
        }
        return false
      }
      const data = await res.json()
      const exists = Boolean(data?.exists)
      if (requestId === trackingCheckReqRef.current) {
        setTrackingCheck({ checking: false, exists, checkedValue: trackingNumber })
      }
      return exists
    } catch (error) {
      console.error('Tracking number check failed', error)
      if (requestId === trackingCheckReqRef.current) {
        setTrackingCheck({ checking: false, exists: false, checkedValue: trackingNumber })
      }
      return false
    }
  }

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

    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDeviceTypes(data)
      })
      .catch((err) => console.error('Failed to load device types', err))

    fetch('/api/models/all')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDeviceModels(data)
      })
      .catch((err) => console.error('Failed to load models', err))

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
      setSerialHistory({})
    }
  }, [open, initialData])

  useEffect(() => {
    if (!open) return
    if (formData.type !== 'INCOMING') return
    if (!headquartersWarehouse?.id) return

    setFormData((prev) => {
      if (prev.targetLocationId === headquartersWarehouse.id && prev.destination === 'HEADQUARTERS') {
        return prev
      }
      return {
        ...prev,
        targetLocationId: headquartersWarehouse.id,
        destination: 'HEADQUARTERS',
        destinationAddress: DEFAULT_INCOMING_ADDRESS,
      }
    })
  }, [open, formData.type, headquartersWarehouse?.id, headquartersWarehouse?.name])

  useEffect(() => {
    if (!open) return

    const trackingNumber = formData.trackingNumber.trim()
    if (!trackingNumber) {
      setTrackingCheck({ checking: false, exists: false, checkedValue: '' })
      return
    }

    const timeout = setTimeout(() => {
      checkTrackingConflict(trackingNumber)
    }, 350)

    return () => clearTimeout(timeout)
  }, [open, formData.trackingNumber, mode, initialData?.id, initialTrackingNumber])

  const updateDevice = (index: number, patch: Partial<DeviceFormData>) => {
    setDevices((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addDevice = () => setDevices((prev) => [...prev, createEmptyDevice()])

  const removeDevice = (index: number) => {
    if (devices.length <= 1) return
    setDevices((prev) => prev.filter((_, i) => i !== index))
  }

  const modelsForType = (deviceType: string) => {
    return deviceModels
      .filter((item) => item.active && item.brand?.name === deviceType)
      .map((item) => item.name)
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
    setSerialHistory((prev) => ({ ...prev, [index]: [] }))
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
      const history = Array.isArray(data.history) ? data.history : []
      setSerialHistory((prev) => ({ ...prev, [index]: history }))
    } catch (error) {
      console.error('Serial lookup failed', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trackingConflict = await checkTrackingConflict(formData.trackingNumber)
    if (trackingConflict) {
      toast.error('Bu takip numarasi zaten kayitli')
      return
    }

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

    const invalidDeviceInfo = devices.find((d) => d.sourceType !== 'equivalent' && (!d.deviceName || !d.model))
    if (invalidDeviceInfo) {
      toast.error('Cihaz adi ve model secimi zorunludur')
      return
    }

    if (formData.type !== 'INCOMING' && !formData.destinationAddress.trim()) {
      toast.error('Teslimat adresi zorunludur')
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
      destination: formData.type === 'INCOMING' ? 'HEADQUARTERS' : 'CUSTOMER',
      destinationAddress: formData.type === 'INCOMING'
        ? DEFAULT_INCOMING_ADDRESS
        : formData.destinationAddress,
      notes: formData.notes,
      targetLocationId: formData.type === 'INCOMING'
        ? (formData.targetLocationId || headquartersWarehouse?.id || '')
        : '',
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
        targetLocationId: headquartersWarehouse?.id || '',
      })
      setDevices([createEmptyDevice()])
      setSerialSuggestions({})
      setSerialHistory({})
      setTrackingCheck({ checking: false, exists: false, checkedValue: '' })
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
              {trackingCheck.checking && (
                <p className="text-xs text-muted-foreground">Takip numarasi kontrol ediliyor...</p>
              )}
              {!trackingCheck.checking &&
                trackingCheck.exists &&
                trackingCheck.checkedValue === formData.trackingNumber.trim() && (
                  <p className="text-xs text-red-600">Bu takip numarasi zaten kayitli.</p>
                )}
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
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value,
                    destination: value === 'INCOMING' ? 'HEADQUARTERS' : 'CUSTOMER',
                    destinationAddress: value === 'INCOMING' ? DEFAULT_INCOMING_ADDRESS : prev.destinationAddress,
                    targetLocationId: value === 'INCOMING' ? (headquartersWarehouse?.id || prev.targetLocationId) : '',
                  }))
                }
              >
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

            {formData.type === 'INCOMING' && (
              <div className="space-y-2">
                <Label>Giris Lokasyonu</Label>
                <Input value={headquartersWarehouse?.name || DEFAULT_INCOMING_ADDRESS} readOnly />
              </div>
            )}

            {formData.type !== 'INCOMING' && (
              <div className="space-y-2 md:col-span-2">
                <Label>Teslimat Adresi *</Label>
                <Textarea
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  required
                />
              </div>
            )}
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open('/dashboard/settings', '_blank')}
                >
                  Tur/Model Listesini Yonet
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
                      {device.sourceType === 'equivalent' ? (
                        <Input value={device.deviceName} className="h-9" required disabled />
                      ) : (
                        <Select
                          value={device.deviceName}
                          onValueChange={(value) => updateDevice(index, { deviceName: value, model: '' })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Cihaz turu secin" />
                          </SelectTrigger>
                          <SelectContent>
                            {mergedDeviceTypes.map((typeName) => (
                              <SelectItem key={typeName} value={typeName}>
                                {typeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Model *</Label>
                      {device.sourceType === 'equivalent' ? (
                        <Input value={device.model} className="h-9" required disabled />
                      ) : (
                        <Select
                          value={device.model}
                          onValueChange={(value) => updateDevice(index, { model: value })}
                          disabled={!device.deviceName}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={device.deviceName ? 'Model secin' : 'Once cihaz turu secin'} />
                          </SelectTrigger>
                          <SelectContent>
                            {modelsForType(device.deviceName).map((modelName) => (
                              <SelectItem key={`${device.deviceName}-${modelName}`} value={modelName}>
                                {modelName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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

                  {device.sourceType !== 'equivalent' && (serialHistory[index] || []).length > 0 && (
                    <div className="rounded border bg-muted/40 p-2 space-y-2">
                      <div className="text-xs font-medium">Bu seri no icin onceki islemler</div>
                      <div className="space-y-1">
                        {serialHistory[index].map((item, historyIndex) => (
                          <div key={`${item.source}-${item.date}-${historyIndex}`} className="text-xs">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-muted-foreground">{new Date(item.date).toLocaleDateString('tr-TR')}</div>
                            <div className="text-muted-foreground">{item.details}</div>
                          </div>
                        ))}
                      </div>
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
            <Button type="submit" disabled={trackingCheck.checking || trackingCheck.exists}>
              {mode === 'edit' ? 'Kaydi Guncelle' : 'Kaydi Olustur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
