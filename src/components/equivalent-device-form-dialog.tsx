'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EquivalentDevice, Location } from '@/types'
import { Plus, AlertCircle } from 'lucide-react'
import { LocationFormDialog } from '@/components/location-form-dialog'

interface EquivalentDeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (device: Partial<EquivalentDevice>) => void
}

export function EquivalentDeviceFormDialog({ open, onOpenChange, onSubmit }: EquivalentDeviceFormDialogProps) {
  const [formData, setFormData] = useState({
    deviceName: 'Muadil RobotPOS Yazıcı - 1',
    brand: '',
    model: '',
    serialNumber: '',
    currentLocation: 'in_warehouse' as const,
    status: 'available' as const,
    condition: 'good' as const,
    assignedToId: '',
    assignedDate: '',
    purchaseDate: '',
    warrantyEnd: '',
    notes: '',
    images: '',
  })

  const [brands, setBrands] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [serialError, setSerialError] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')

  useEffect(() => {
    if (open) {
      fetchBrands()
      fetchLocations()
    }
  }, [open])

  useEffect(() => {
    if (formData.brand) {
      fetchModels(formData.brand)
    } else {
      setModels([])
    }
  }, [formData.brand])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchModels = async (brand: string) => {
    try {
      const response = await fetch(`/api/models?brand=${encodeURIComponent(brand)}`)
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const checkSerialNumber = async (serialNumber: string) => {
    if (!serialNumber) {
      setSerialError('')
      return true
    }

    try {
      const response = await fetch(`/api/equivalent-devices/check-serial?serial=${encodeURIComponent(serialNumber)}`)
      const data = await response.json()

      if (data.exists) {
        setSerialError('Bu seri numarası zaten kayıtlı!')
        return false
      }

      setSerialError('')
      return true
    } catch (error) {
      console.error('Error checking serial number:', error)
      return true
    }
  }

  const handleSerialNumberBlur = () => {
    checkSerialNumber(formData.serialNumber)
  }

  const handleNewLocation = async (locationData: Partial<Location>) => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      })

      if (response.ok) {
        const newLocation = await response.json()
        setLocations([...locations, newLocation])
        setFormData({ ...formData, assignedToId: newLocation.id })
      }
    } catch (error) {
      console.error('Error creating location:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Seri numarası kontrolü
    const isSerialValid = await checkSerialNumber(formData.serialNumber)
    if (!isSerialValid) {
      return
    }

    // Cihaz numarasını otomatik oluştur
    const deviceNumber = `MC-${Date.now().toString().slice(-6)}`

    const newDevice: Partial<EquivalentDevice> = {
      deviceNumber,
      deviceName: formData.deviceName,
      brand: formData.brand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      currentLocation: formData.currentLocation,
      status: formData.status,
      condition: formData.condition,
      assignedToId: formData.assignedToId || undefined,
      assignedDate: formData.assignedDate ? new Date(formData.assignedDate) : undefined,
      purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
      warrantyEnd: formData.warrantyEnd ? new Date(formData.warrantyEnd) : undefined,
      notes: formData.notes || undefined,
      images: formData.images || undefined,
      createdBy: 'current-user-id', // TODO: Get from auth context
      createdByName: 'Current User', // TODO: Get from auth context
    }

    onSubmit(newDevice)

    // Formu sıfırla
    setFormData({
      deviceName: 'Muadil RobotPOS Yazıcı - 1',
      brand: '',
      model: '',
      serialNumber: '',
      currentLocation: 'in_warehouse',
      status: 'available',
      condition: 'good',
      assignedToId: '',
      assignedDate: '',
      purchaseDate: '',
      warrantyEnd: '',
      notes: '',
      images: '',
    })
    setSerialError('')

    onOpenChange(false)
  }

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'in_warehouse': return 'bg-green-100 text-green-800 border-green-300'
      case 'on_site_service': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'at_customer': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getLocationText = (location: string) => {
    switch (location) {
      case 'in_warehouse': return 'Depoda'
      case 'on_site_service': return 'Yerinde Serviste'
      case 'at_customer': return 'Müşteride'
      default: return location
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  )

  const filteredModels = models.filter(model =>
    model.toLowerCase().includes(modelSearch.toLowerCase())
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Yeni Muadil Cihaz
            </DialogTitle>
            <DialogDescription>
              Yeni bir muadil cihaz kaydı oluşturun. Tüm alanları dikkatlice doldurun.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              {/* Cihaz Bilgileri */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Cihaz Bilgileri</h3>

                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Cihaz Adı *
                  </Label>
                  <Input
                    id="deviceName"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    placeholder="Örn: Muadil RobotPOS Yazıcı - 1"
                    required
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium">
                      Marka *
                    </Label>
                    <div className="relative">
                      <Select
                        value={formData.brand}
                        onValueChange={(value) => {
                          setFormData({ ...formData, brand: value, model: '' })
                          setBrandSearch('')
                        }}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                          <SelectValue placeholder="Marka seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-2">
                            <Input
                              placeholder="Marka ara..."
                              value={brandSearch}
                              onChange={(e) => setBrandSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          {filteredBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                          {filteredBrands.length === 0 && (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              Marka bulunamadı
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Listede yoksa yöneticinize bildirin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium">
                      Model *
                    </Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => {
                        setFormData({ ...formData, model: value })
                        setModelSearch('')
                      }}
                      disabled={!formData.brand}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                        <SelectValue placeholder={formData.brand ? "Model seçin" : "Önce marka seçin"} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.brand && (
                          <div className="px-2 pb-2">
                            <Input
                              placeholder="Model ara..."
                              value={modelSearch}
                              onChange={(e) => setModelSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                        )}
                        {filteredModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                        {filteredModels.length === 0 && formData.brand && (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Model bulunamadı
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Listede yoksa yöneticinize bildirin
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="text-sm font-medium">
                    Seri Numarası *
                  </Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, serialNumber: e.target.value })
                      setSerialError('')
                    }}
                    onBlur={handleSerialNumberBlur}
                    placeholder="Cihazın seri numarasını girin"
                    required
                    className={`border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 ${
                      serialError ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {serialError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{serialError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Konum ve Durum */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Konum ve Durum</h3>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Muadil Konum *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['in_warehouse', 'on_site_service', 'at_customer'] as const).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormData({ ...formData, currentLocation: loc })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.currentLocation === loc
                            ? `${getLocationColor(loc)} border-current font-semibold`
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {getLocationText(loc)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Durum *
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Müsait</SelectItem>
                        <SelectItem value="in_use">Kullanımda</SelectItem>
                        <SelectItem value="in_maintenance">Bakımda</SelectItem>
                        <SelectItem value="reserved">Rezerve</SelectItem>
                        <SelectItem value="retired">Emekli</SelectItem>
                        <SelectItem value="passive" className="text-red-600 font-semibold">
                          Pasif (Yönetici Onayı Gerekli)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition" className="text-sm font-medium">
                      Kondisyon *
                    </Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Yeni</SelectItem>
                        <SelectItem value="excellent">Mükemmel</SelectItem>
                        <SelectItem value="good">İyi</SelectItem>
                        <SelectItem value="fair">Orta</SelectItem>
                        <SelectItem value="poor">Zayıf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Atama Bilgileri */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Atama Bilgileri</h3>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium">
                    Atanacağı Lokasyon
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                    >
                      <SelectTrigger className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20">
                        <SelectValue placeholder="Lokasyon seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} - {location.address}
                          </SelectItem>
                        ))}
                        {locations.length === 0 && (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Kayıtlı lokasyon yok
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLocationDialogOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Adres
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedDate" className="text-sm font-medium">
                    Atanma Tarihi
                  </Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={formData.assignedDate}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
              </div>

              {/* Tarih Bilgileri */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Tarih Bilgileri</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate" className="text-sm font-medium">
                      Satın Alma Tarihi
                    </Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyEnd" className="text-sm font-medium">
                      Garanti Bitiş Tarihi
                    </Label>
                    <Input
                      id="warrantyEnd"
                      type="date"
                      value={formData.warrantyEnd}
                      onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
                      className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">Notlar ve Diğer Bilgiler</h3>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notlar
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Cihaz hakkında ek notlar girin"
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 min-h-[100px]"
                  />
                </div>
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
                disabled={!!serialError}
              >
                Cihaz Kaydı Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LocationFormDialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        onSubmit={handleNewLocation}
      />
    </>
  )
}

