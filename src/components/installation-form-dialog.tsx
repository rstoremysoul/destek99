'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { InstallationForm, Technician } from '@/types'

interface InstallationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: Partial<InstallationForm>) => void
}

type InstallationFormDraft = {
  companyName: string
  customerName: string
  contactPerson: string
  contactPhone: string
  installationAddress: string
  plannedInstallDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  technicianId: string
  notes: string
}

export function InstallationFormDialog({ open, onOpenChange, onSubmit }: InstallationFormDialogProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [formData, setFormData] = useState<InstallationFormDraft>({
    companyName: '',
    customerName: '',
    contactPerson: '',
    contactPhone: '',
    installationAddress: '',
    plannedInstallDate: '',
    priority: 'medium',
    technicianId: '',
    notes: '',
  })

  // Fetch technicians
  useEffect(() => {
    if (open) {
      fetch('/api/technicians')
        .then(res => res.json())
        .then(data => setTechnicians(data.filter((t: Technician) => t.active)))
        .catch(err => console.error('Error fetching technicians:', err))
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Form numarasını otomatik oluştur
    const formNumber = `KF-${Date.now().toString().slice(-6)}`

    const newForm: Partial<InstallationForm> = {
      formNumber,
      companyName: formData.companyName,
      customerName: formData.customerName,
      contactPerson: formData.contactPerson,
      contactPhone: formData.contactPhone,
      installationAddress: formData.installationAddress,
      plannedInstallDate: new Date(formData.plannedInstallDate),
      requestDate: new Date(),
      priority: formData.priority,
      technicianId: formData.technicianId || undefined,
      notes: formData.notes,
      status: 'received',
      devices: [],
    }

    onSubmit(newForm)

    // Formu sıfırla
    setFormData({
      companyName: '',
      customerName: '',
      contactPerson: '',
      contactPhone: '',
      installationAddress: '',
      plannedInstallDate: '',
      priority: 'medium',
      technicianId: '',
      notes: '',
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Yeni Kurulum Formu
          </DialogTitle>
          <DialogDescription>
            Yeni bir kurulum formu oluşturun. Tüm gerekli bilgileri doldurun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Firma Bilgileri */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Firma Adı *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Firma adını girin"
                required
                className="border-slate-200 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>

            {/* Müşteri Bilgileri */}
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Müşteri Adı *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Müşteri adını girin"
                required
                className="border-slate-200 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>

            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-medium">
                  İletişim Kişisi *
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="İletişim kişisi"
                  required
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-sm font-medium">
                  Telefon *
                </Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="0555 123 45 67"
                  required
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
            </div>

            {/* Kurulum Adresi */}
            <div className="space-y-2">
              <Label htmlFor="installationAddress" className="text-sm font-medium">
                Kurulum Adresi *
              </Label>
              <Textarea
                id="installationAddress"
                value={formData.installationAddress}
                onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                placeholder="Kurulum yapılacak adresi girin"
                required
                className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 min-h-[80px]"
              />
            </div>

            {/* Tarih ve Öncelik */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedInstallDate" className="text-sm font-medium">
                  Planlanan Kurulum Tarihi *
                </Label>
                <Input
                  id="plannedInstallDate"
                  type="date"
                  value={formData.plannedInstallDate}
                  onChange={(e) => setFormData({ ...formData, plannedInstallDate: e.target.value })}
                  required
                  className="border-slate-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Öncelik *
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-green-400 focus:ring-green-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teknisyen Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="technician" className="text-sm font-medium">
                Atanacak Teknisyen
              </Label>
              <Select
                value={formData.technicianId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, technicianId: value === 'none' ? '' : value })}
              >
                <SelectTrigger className="border-slate-200 focus:border-green-400 focus:ring-green-400/20">
                  <SelectValue placeholder="Teknisyen seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atanmadı</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                      {tech.specialization && ` (${tech.specialization})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="border-slate-200 focus:border-green-400 focus:ring-green-400/20 min-h-[100px]"
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
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              Formu Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

