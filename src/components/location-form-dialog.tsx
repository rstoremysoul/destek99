'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Location } from '@/types'

interface LocationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (location: Partial<Location>) => void
}

export function LocationFormDialog({ open, onOpenChange, onSubmit }: LocationFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    contactPerson: '',
    type: '' as 'warehouse' | 'customer' | 'service_center' | 'branch' | 'headquarters' | '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newLocation: Partial<Location> = {
      name: formData.name,
      address: formData.address,
      city: formData.city || undefined,
      district: formData.district || undefined,
      phone: formData.phone || undefined,
      contactPerson: formData.contactPerson || undefined,
      type: formData.type || undefined,
      active: true,
    }

    onSubmit(newLocation)

    // Formu sıfırla
    setFormData({
      name: '',
      address: '',
      city: '',
      district: '',
      phone: '',
      contactPerson: '',
      type: '',
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Yeni Lokasyon Ekle
          </DialogTitle>
          <DialogDescription>
            Yeni bir lokasyon/adres kaydı oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Lokasyon Adı *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: ABC Şirketi - Merkez Ofis"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Adres *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Tam adresi girin"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Şehir
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Örn: İstanbul"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">
                  İlçe
                </Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Örn: Kadıköy"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-medium">
                  İletişim Kişisi
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Kişi adı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0 (5xx) xxx xx xx"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Lokasyon Tipi
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tip seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Depo</SelectItem>
                  <SelectItem value="customer">Müşteri</SelectItem>
                  <SelectItem value="service_center">Servis Merkezi</SelectItem>
                  <SelectItem value="branch">Şube</SelectItem>
                  <SelectItem value="headquarters">Merkez Ofis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              Lokasyon Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

