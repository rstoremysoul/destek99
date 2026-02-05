'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DeviceRepair } from '@/types'

interface RepairFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (repair: Partial<DeviceRepair>) => void
}

export function RepairFormDialog({ open, onOpenChange, onSubmit }: RepairFormDialogProps) {
  const [formData, setFormData] = useState({
    deviceName: '',
    model: '',
    serialNumber: '',
    brand: '',
    companyName: '',
    customerName: '',
    problemDescription: '',
    priority: 'medium' as const,
    isWarranty: false,
    warrantyEndDate: '',
    estimatedCompletionDate: '',
    repairCost: '',
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

    // Tamir numarasını otomatik oluştur
    const repairNumber = `TR-${Date.now().toString().slice(-6)}`

    const newRepair: Partial<DeviceRepair> = {
      repairNumber,
      deviceName: formData.deviceName,
      model: formData.model,
      serialNumber: formData.serialNumber,
      companyName: formData.companyName,
      customerName: formData.customerName,
      customerPhone: '0000000000', // Geçici değer
      problemDescription: formData.problemDescription,
      priority: formData.priority,
      isWarranty: formData.isWarranty,
      status: 'received',
      receivedDate: new Date().toISOString(),
      estimatedCompletion: formData.estimatedCompletionDate || undefined,
      repairCost: formData.repairCost ? parseFloat(formData.repairCost) : undefined,
      brand: formData.brand || undefined,
    }

    onSubmit(newRepair)

    // Formu sıfırla
    setFormData({
      deviceName: '',
      model: '',
      serialNumber: '',
      companyName: '',
      customerName: '',
      problemDescription: '',
      priority: 'medium',
      isWarranty: false,
      warrantyEndDate: '',
      estimatedCompletionDate: '',
      repairCost: '',
      brand: '',
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Yeni Tamir Kaydı
          </DialogTitle>
          <DialogDescription>
            Yeni bir tamir kaydı oluşturun. Cihaz ve arıza bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Cihaz Bilgileri */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Cihaz Bilgileri</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Cihaz Adı *
                  </Label>
                  <Input
                    id="deviceName"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    placeholder="Örn: HP LaserJet Pro"
                    required
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Model *
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Örn: MFP M428fdw"
                    required
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-medium">
                  Seri Numarası *
                </Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Cihazın seri numarasını girin"
                  required
                  className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Müşteri Bilgileri</h3>

              <div className="grid grid-cols-2 gap-4">
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
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>

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
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              </div>
            </div>

            {/* Arıza Bilgileri */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Arıza Bilgileri</h3>

              <div className="space-y-2">
                <Label htmlFor="problemDescription" className="text-sm font-medium">
                  Sorun Açıklaması *
                </Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  placeholder="Cihazın arıza açıklamasını detaylı olarak girin"
                  required
                  className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20">
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

                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletionDate" className="text-sm font-medium">
                    Tahmini Tamamlanma Tarihi
                  </Label>
                  <Input
                    id="estimatedCompletionDate"
                    type="date"
                    value={formData.estimatedCompletionDate}
                    onChange={(e) => setFormData({ ...formData, estimatedCompletionDate: e.target.value })}
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              </div>
            </div>

            {/* Garanti ve Maliyet */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900">Garanti ve Maliyet</h3>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWarranty"
                  checked={formData.isWarranty}
                  onChange={(e) => setFormData({ ...formData, isWarranty: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                <Label htmlFor="isWarranty" className="text-sm font-medium cursor-pointer">
                  Bu cihaz garanti kapsamında
                </Label>
              </div>

              {formData.isWarranty && (
                <div className="space-y-2">
                  <Label htmlFor="warrantyEndDate" className="text-sm font-medium">
                    Garanti Bitiş Tarihi
                  </Label>
                  <Input
                    id="warrantyEndDate"
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              )}

              {!formData.isWarranty && (
                <div className="space-y-2">
                  <Label htmlFor="repairCost" className="text-sm font-medium">
                    Tahmini Tamir Maliyeti (â‚º)
                  </Label>
                  <Input
                    id="repairCost"
                    type="number"
                    step="0.01"
                    value={formData.repairCost}
                    onChange={(e) => setFormData({ ...formData, repairCost: e.target.value })}
                    placeholder="0.00"
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              )}
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
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
            >
              Tamir Kaydı Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

