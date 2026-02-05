'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Vendor } from '@/types'

interface VendorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (vendor: Partial<Vendor>) => void
  vendor?: Vendor | null
}

export function VendorFormDialog({ open, onOpenChange, onSubmit, vendor }: VendorFormDialogProps) {
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    type: vendor?.type || 'manufacturer' as 'manufacturer' | 'service_provider' | 'distributor',
    contactPerson: vendor?.contactPerson || '',
    contactPhone: vendor?.contactPhone || '',
    contactEmail: vendor?.contactEmail || '',
    address: vendor?.address || '',
    notes: vendor?.notes || '',
    active: vendor?.active !== undefined ? vendor.active : true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const vendorData: Partial<Vendor> = {
      ...(vendor?.id && { id: vendor.id }),
      name: formData.name,
      type: formData.type,
      contactPerson: formData.contactPerson || undefined,
      contactPhone: formData.contactPhone || undefined,
      contactEmail: formData.contactEmail || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      active: formData.active,
    }

    onSubmit(vendorData)

    // Reset form
    if (!vendor) {
      setFormData({
        name: '',
        type: 'manufacturer',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        notes: '',
        active: true,
      })
    }

    onOpenChange(false)
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Üretici'
      case 'service_provider': return 'Servis Sağlayıcı'
      case 'distributor': return 'Distribütör'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {vendor ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
          </DialogTitle>
          <DialogDescription>
            {vendor ? 'Tedarikçi bilgilerini güncelleyin' : 'Yeni bir tedarikçi firması ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Temel Bilgiler */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <h3 className="font-semibold text-slate-900">Temel Bilgiler</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Tedarikçi Adı *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Micros, RobotPOS"
                    required
                    className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Tedarikçi Tipi *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'manufacturer' | 'service_provider' | 'distributor') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Üretici</SelectItem>
                      <SelectItem value="service_provider">Servis Sağlayıcı</SelectItem>
                      <SelectItem value="distributor">Distribütör</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Durum</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <Label htmlFor="active" className="text-sm cursor-pointer">
                      Aktif Tedarikçi
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-slate-900">İletişim Bilgileri</h3>

              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-medium">
                  İletişim Kişisi
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Yetkili kişi adı"
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium">
                    Telefon
                  </Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+90 555 123 45 67"
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium">
                    E-posta
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="ornek@firma.com"
                    className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Adres
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Firma adresi"
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 min-h-[60px] bg-white"
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
                placeholder="Tedarikçi hakkında ek notlar (opsiyonel)"
                className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 min-h-[80px]"
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
              {vendor ? 'Güncelle' : 'Tedarikçi Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

