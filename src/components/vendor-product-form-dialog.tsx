'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Vendor } from '@/types'

interface VendorProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (product: any) => void
  vendors: Vendor[]
}

export function VendorProductFormDialog({ open, onOpenChange, onSubmit, vendors }: VendorProductFormDialogProps) {
  const [formData, setFormData] = useState({
    vendorId: '',
    deviceName: '',
    model: '',
    serialNumber: '',
    brand: '',
    problemDescription: '',
    currentStatus: 'at_vendor',
    sentDate: '',
    receivedDate: '',
    estimatedReturn: '',
    cost: '',
    notes: '',
  })

  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      fetch('/api/brands')
        .then(r => r.ok ? r.json() : [])
        .then((data) => setBrands(Array.isArray(data) ? data : []))
        .catch((e) => console.error('Error fetching brands:', e))
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      vendorId: formData.vendorId,
      deviceName: formData.deviceName,
      model: formData.model,
      serialNumber: formData.serialNumber,
      brand: formData.brand,
      problemDescription: formData.problemDescription,
      status: formData.currentStatus,
      sentDate: formData.sentDate,
      receivedDate: formData.receivedDate || null,
      estimatedReturn: formData.estimatedReturn || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      notes: formData.notes,
    })

    // Reset form
    setFormData({
      vendorId: '',
      deviceName: '',
      model: '',
      serialNumber: '',
      brand: '',
      problemDescription: '',
      currentStatus: 'at_vendor',
      sentDate: '',
      receivedDate: '',
      estimatedReturn: '',
      cost: '',
      notes: '',
    })

    onOpenChange(false)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'at_vendor': return 'Tedarikçide'
      case 'in_testing': return 'Test Ediliyor'
      case 'in_transit': return 'Kargoda'
      case 'completed': return 'Tamamlandı'
      case 'returned': return 'İade Edildi'
      default: return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Tedarikçiye Ürün Gönder
          </DialogTitle>
          <DialogDescription>
            Tedarikçiye gönderilecek ürün bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Tedarikçi ve Cihaz Bilgileri */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <h3 className="font-semibold text-slate-900">Tedarikçi ve Cihaz Bilgileri</h3>

              <div className="space-y-2">
                <Label htmlFor="vendorId" className="text-sm font-medium">
                  Tedarikçi *
                </Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                  required
                >
                  <SelectTrigger className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white">
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.filter(v => v.active).map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Cihaz Adı *
                  </Label>
                  <Input
                    id="deviceName"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    placeholder="Örn: POS Terminal"
                    required
                    className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-medium">
                    Marka
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Örn: Micros"
                    className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Model *
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Model numarası"
                    required
                    className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="text-sm font-medium">
                    Seri No *
                  </Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Seri numarası"
                    required
                    className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Sorun ve Durum */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-slate-900">Sorun ve Durum</h3>

              <div className="space-y-2">
                <Label htmlFor="problemDescription" className="text-sm font-medium">
                  Sorun Açıklaması *
                </Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  placeholder="Cihazın sorunu nedir?"
                  required
                  className="border-slate-200 focus:border-orange-400 focus:ring-orange-400/20 min-h-[80px] bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStatus" className="text-sm font-medium">
                  Durum
                </Label>
                <Select
                  value={formData.currentStatus}
                  onValueChange={(value) => setFormData({ ...formData, currentStatus: value })}
                >
                  <SelectTrigger className="border-slate-200 focus:border-orange-400 focus:ring-orange-400/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at_vendor">Tedarikçide</SelectItem>
                    <SelectItem value="in_testing">Test Ediliyor</SelectItem>
                    <SelectItem value="in_transit">Kargoda</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="returned">İade Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tarih ve Maliyet */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-slate-900">Tarih ve Maliyet</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sentDate" className="text-sm font-medium">
                    Gönderim Tarihi *
                  </Label>
                  <Input
                    id="sentDate"
                    type="date"
                    value={formData.sentDate}
                    onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
                    required
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receivedDate" className="text-sm font-medium">
                    Alındığı Tarih
                  </Label>
                  <Input
                    id="receivedDate"
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedReturn" className="text-sm font-medium">
                    Tahmini Dönüş
                  </Label>
                  <Input
                    id="estimatedReturn"
                    type="date"
                    value={formData.estimatedReturn}
                    onChange={(e) => setFormData({ ...formData, estimatedReturn: e.target.value })}
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Maliyet (â‚º)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                />
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
                placeholder="Ek notlar (opsiyonel)"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 min-h-[60px]"
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
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Ürün Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

