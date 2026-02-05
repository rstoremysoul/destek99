
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CargoTracking } from '@/types'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CargoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (cargo: Partial<CargoTracking>) => void
}

interface DeviceFormData {
  deviceName: string
  model: string
  serialNumber: string
  quantity: string
  condition: 'new' | 'used' | 'refurbished' | 'damaged'
  purpose: 'installation' | 'replacement' | 'repair' | 'return'
}

interface CargoCompany {
  id: string
  name: string
}

export function CargoFormDialog({ open, onOpenChange, onSubmit }: CargoFormDialogProps) {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    type: 'outgoing' as string, // Changed to string to support new types
    sender: '',
    receiver: '',
    cargoCompany: '', // Keeps ID or Name
    destination: 'customer' as string,
    destinationAddress: '',
    sentDate: new Date().toISOString().split('T')[0], // Default today
    notes: '',
  })

  const [devices, setDevices] = useState<DeviceFormData[]>([
    {
      deviceName: '',
      model: '',
      serialNumber: '',
      quantity: '1',
      condition: 'new',
      purpose: 'installation',
    },
  ])

  const [companies, setCompanies] = useState<CargoCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  useEffect(() => {
    if (open) {
      // Fetch companies when dialog opens
      setLoadingCompanies(true)
      fetch('/api/cargo-companies')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCompanies(data)
        })
        .catch(err => console.error('Failed to load companies', err))
        .finally(() => setLoadingCompanies(false))

      // Default date if empty
      if (!formData.sentDate) {
        setFormData(prev => ({ ...prev, sentDate: new Date().toISOString().split('T')[0] }))
      }
    }
  }, [open])

  const handleSerialBlur = async (index: number) => {
    const serial = devices[index].serialNumber
    if (!serial || serial.length < 3) return

    try {
      const res = await fetch(`/api/devices/lookup?serial=${serial}`)
      if (res.ok) {
        const data = await res.json()
        if (data && (data.deviceName || data.model)) {
          const newDevices = [...devices]
          if (!newDevices[index].deviceName) newDevices[index].deviceName = data.deviceName || ''
          if (!newDevices[index].model) newDevices[index].model = data.model || ''
          setDevices(newDevices)
          toast.success('Cihaz bilgileri bulundu ve dolduruldu.')
        }
      }
    } catch (error) {
      // Create new device if not found silently
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newCargo: any = { // Use any or updated Type
      trackingNumber: formData.trackingNumber,
      type: formData.type,
      status: 'IN_TRANSIT',
      sender: formData.sender,
      receiver: formData.receiver,
      cargoCompany: formData.cargoCompany, // This might need to be ID or Name depending on backend
      sentDate: formData.sentDate ? new Date(formData.sentDate).toISOString() : new Date().toISOString(),
      destination: formData.destination,
      destinationAddress: formData.destinationAddress,
      notes: formData.notes,
      devices: devices.map((device) => ({
        deviceName: device.deviceName,
        model: device.model,
        serialNumber: device.serialNumber,
        quantity: parseInt(device.quantity) || 1,
        condition: device.condition === 'new' ? 'NEW' : device.condition.toUpperCase(), // Enum mapping
        purpose: device.purpose === 'installation' ? 'INSTALLATION' : device.purpose.toUpperCase(),
      })),
    }

    onSubmit(newCargo)

    // Reset Form
    setFormData({
      trackingNumber: '',
      type: 'outgoing',
      sender: '',
      receiver: '',
      cargoCompany: '',
      destination: 'customer',
      destinationAddress: '',
      sentDate: new Date().toISOString().split('T')[0],
      notes: '',
    })

    setDevices([
      {
        deviceName: '',
        model: '',
        serialNumber: '',
        quantity: '1',
        condition: 'new',
        purpose: 'installation',
      },
    ])

    onOpenChange(false)
  }

  const addDevice = () => {
    setDevices([
      ...devices,
      {
        deviceName: '',
        model: '',
        serialNumber: '',
        quantity: '1',
        condition: 'new',
        purpose: 'installation',
      },
    ])
  }

  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      setDevices(devices.filter((_, i) => i !== index))
    }
  }

  const updateDevice = (index: number, field: keyof DeviceFormData, value: string) => {
    const newDevices = [...devices]
    newDevices[index] = { ...newDevices[index], [field]: value }
    setDevices(newDevices)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Yeni Kargo Kaydı
          </DialogTitle>
          <DialogDescription>
            Yeni bir kargo takip kaydı oluşturun. Gelen kargolar otomatik olarak Ofis deposuna işlenir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Kargo Bilgileri */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                Kargo Bilgileri
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber" className="text-sm font-medium">
                    Takip Numarası *
                  </Label>
                  <Input
                    id="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="Örn: TK123456789"
                    required
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargoCompany" className="text-sm font-medium">
                    Kargo Şirketi *
                  </Label>
                  <Select
                    value={formData.cargoCompany}
                    onValueChange={(value) => setFormData({ ...formData, cargoCompany: value })}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCompanies ? (
                        <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                      ) : (
                        companies.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))
                      )}
                      <SelectItem value="other">Diğer / Manuel Giriş</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Kargo Tipi *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOMING">Gelen Kargo</SelectItem>
                      <SelectItem value="OUTGOING">Giden Kargo</SelectItem>
                      <SelectItem value="ON_SITE_SERVICE">Yerinde Servis (Giden)</SelectItem>
                      <SelectItem value="INSTALLATION_TEAM">Kurulum Ekibi (Sevk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sentDate" className="text-sm font-medium">
                    Gönderim Tarihi
                  </Label>
                  <Input
                    id="sentDate"
                    type="date"
                    value={formData.sentDate}
                    onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Gönderen ve Alıcı Bilgileri */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-slate-900">Gönderen ve Alıcı Bilgileri</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender" className="text-sm font-medium">
                    Gönderen *
                  </Label>
                  <Input
                    id="sender"
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    placeholder="Gönderen adı veya firma"
                    required
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiver" className="text-sm font-medium">
                    Alıcı *
                  </Label>
                  <Input
                    id="receiver"
                    value={formData.receiver}
                    onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                    placeholder="Alıcı adı veya firma"
                    required
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium">
                  Hedef Lokasyon *
                </Label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) =>
                    setFormData({ ...formData, destination: value })
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                    <SelectItem value="DISTRIBUTOR">Distribütör</SelectItem>
                    <SelectItem value="BRANCH">Şube / Ofis</SelectItem>
                    <SelectItem value="HEADQUARTERS">Merkez</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationAddress" className="text-sm font-medium">
                  Teslimat Adresi *
                </Label>
                <Textarea
                  id="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  placeholder="Tam teslimat adresini girin"
                  required
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 min-h-[80px] bg-white"
                />
              </div>
            </div>

            {/* Cihaz Listesi */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Cihaz Listesi</h3>
                <Button
                  type="button"
                  onClick={addDevice}
                  variant="outline"
                  size="sm"
                  className="bg-white border-purple-300 hover:bg-purple-50 text-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Cihaz Ekle
                </Button>
              </div>

              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-purple-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-slate-700">Cihaz #{index + 1}</span>
                      {devices.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeDevice(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Seri No (Otomatik Ara) *</Label>
                        <Input
                          value={device.serialNumber}
                          onChange={(e) => updateDevice(index, 'serialNumber', e.target.value)}
                          onBlur={() => handleSerialBlur(index)}
                          placeholder="Seri numarası girin"
                          required
                          className="border-slate-200 text-sm h-9 bg-yellow-50/50 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Cihaz Adı *</Label>
                        <Input
                          value={device.deviceName}
                          onChange={(e) => updateDevice(index, 'deviceName', e.target.value)}
                          placeholder="Örn: HP ProLiant DL380"
                          required
                          className="border-slate-200 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Model *</Label>
                        <Input
                          value={device.model}
                          onChange={(e) => updateDevice(index, 'model', e.target.value)}
                          placeholder="Örn: DL380-G10"
                          required
                          className="border-slate-200 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Adet *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={device.quantity}
                          onChange={(e) => updateDevice(index, 'quantity', e.target.value)}
                          required
                          className="border-slate-200 text-sm h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Durum *</Label>
                        <Select
                          value={device.condition}
                          onValueChange={(value: any) => updateDevice(index, 'condition', value)}
                        >
                          <SelectTrigger className="border-slate-200 text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Yeni</SelectItem>
                            <SelectItem value="used">Kullanılmış</SelectItem>
                            <SelectItem value="refurbished">Yenilenmiş</SelectItem>
                            <SelectItem value="damaged">Hasarlı</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Amaç *</Label>
                        <Select
                          value={device.purpose}
                          onValueChange={(value: any) => updateDevice(index, 'purpose', value)}
                        >
                          <SelectTrigger className="border-slate-200 text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="installation">Kurulum</SelectItem>
                            <SelectItem value="replacement">Değişim</SelectItem>
                            <SelectItem value="repair">Tamir</SelectItem>
                            <SelectItem value="return">İade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notlar
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ek notlar veya özel talimatlar (opsiyonel)"
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 hover:bg-slate-50"
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
            >
              Kargo Kaydı Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


