'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DeviceRepair, Technician } from '@/types'
import { Hash, Cpu, Building2, User, CalendarClock, AlertTriangle } from 'lucide-react'

interface RepairFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (repair: Partial<DeviceRepair>) => void
}

type RepairFormDraft = {
  deviceName: string
  model: string
  serialNumber: string
  brand: string
  companyName: string
  customerName: string
  problemDescription: string
  status: 'received' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'testing' | 'completed' | 'unrepairable'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isWarranty: boolean
  warrantyEndDate: string
  estimatedCompletionDate: string
  repairCost: string
  partsCost: string
  distributorCost: string
  customerApprovalStatus: 'pending' | 'approved' | 'rejected'
  approvalNote: string
  operations: string[]
  repairNotes: string
  technicianId: string
}

const REPAIR_OPERATIONS = [
  'Dokunmatik Degisimi',
  'Yazici Kafasi Degisimi',
  'Anakart Onarimi',
  'Anakart Degisimi',
  'Soket Onarimi',
  'Yazilim / Image',
]

const REPAIR_META_TAG = '[[REPAIR_TICKET_META]]'

function buildRepairNotesWithMeta(cleanNotes: string, meta: {
  operations: string[]
  customerApprovalStatus: 'pending' | 'approved' | 'rejected'
  approvalNote: string
}) {
  const parts = [
    String(cleanNotes || '').trim(),
    `${REPAIR_META_TAG}${JSON.stringify(meta)}`,
  ].filter(Boolean)
  return parts.join('\n')
}

export function RepairFormDialog({ open, onOpenChange, onSubmit }: RepairFormDialogProps) {
  const [formData, setFormData] = useState<RepairFormDraft>({
    deviceName: '',
    model: '',
    serialNumber: '',
    brand: '',
    companyName: '',
    customerName: '',
    problemDescription: '',
    status: 'received',
    priority: 'medium',
    isWarranty: false,
    warrantyEndDate: '',
    estimatedCompletionDate: '',
    repairCost: '',
    partsCost: '',
    distributorCost: '',
    customerApprovalStatus: 'pending',
    approvalNote: '',
    operations: [],
    repairNotes: '',
    technicianId: '',
  })

  const [brands, setBrands] = useState<string[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])

  useEffect(() => {
    if (open) {
      fetch('/api/brands')
        .then(r => r.ok ? r.json() : [])
        .then((data) => setBrands(Array.isArray(data) ? data : []))
        .catch((e) => console.error('Error fetching brands:', e))

      fetch('/api/technicians')
        .then(r => r.ok ? r.json() : [])
        .then((data) => setTechnicians(Array.isArray(data) ? data.filter((t: Technician) => t.active) : []))
        .catch((e) => console.error('Error fetching technicians:', e))
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Tamir numarasını otomatik oluştur
    const repairNumber = `TR-${Date.now().toString().slice(-6)}`

    const normalizedRepairCost = formData.repairCost ? Number(formData.repairCost) : 0
    const normalizedPartsCost = formData.partsCost ? Number(formData.partsCost) : 0
    const normalizedDistributorCost = formData.distributorCost ? Number(formData.distributorCost) : 0
    const normalizedInternalServiceCost = Math.max(0, normalizedRepairCost - normalizedPartsCost - normalizedDistributorCost)
    const composedRepairNotes = buildRepairNotesWithMeta(formData.repairNotes, {
      operations: formData.operations,
      customerApprovalStatus: formData.customerApprovalStatus,
      approvalNote: formData.approvalNote,
    })

    const newRepair: Partial<DeviceRepair> = {
      repairNumber,
      deviceName: formData.deviceName,
      model: formData.model,
      serialNumber: formData.serialNumber,
      companyName: formData.companyName,
      customerName: formData.customerName,
      customerPhone: '0000000000', // Geçici değer
      problemDescription: formData.problemDescription,
      status: formData.status,
      priority: formData.priority,
      isWarranty: formData.isWarranty,
      receivedDate: new Date(),
      estimatedCompletionDate: formData.estimatedCompletionDate ? new Date(formData.estimatedCompletionDate) : undefined,
      repairCost: normalizedRepairCost,
      partsCost: normalizedPartsCost,
      distributorCost: normalizedDistributorCost,
      internalServiceCost: normalizedInternalServiceCost,
      totalCost: normalizedRepairCost,
      brand: formData.brand || undefined,
      assignedTechnician: formData.technicianId || undefined,
    }
    ;(newRepair as any).repairNotes = composedRepairNotes

    onSubmit(newRepair)

    // Formu sıfırla
    setFormData({
      deviceName: '',
      model: '',
      serialNumber: '',
      companyName: '',
      customerName: '',
      problemDescription: '',
      status: 'received',
      priority: 'medium',
      isWarranty: false,
      warrantyEndDate: '',
      estimatedCompletionDate: '',
      repairCost: '',
      partsCost: '',
      distributorCost: '',
      customerApprovalStatus: 'pending',
      approvalNote: '',
      operations: [],
      repairNotes: '',
      brand: '',
      technicianId: '',
    })

    onOpenChange(false)
  }

  const toggleOperation = (operation: string) => {
    setFormData((prev) => ({
      ...prev,
      operations: prev.operations.includes(operation)
        ? prev.operations.filter((item) => item !== operation)
        : [...prev.operations, operation],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto border-t-4 border-t-orange-500 bg-[#f5f5f5]">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-2xl font-semibold">Yeni Tamir Kaydi</DialogTitle>
          <DialogDescription>
            Yeni bir tamir kaydı oluşturun. Cihaz ve arıza bilgilerini girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Cihaz Bilgileri */}
            <div className="space-y-4 rounded-md border bg-white/70 p-4">
              <h3 className="font-semibold text-slate-900">Cihaz Bilgileri</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-sm font-medium">
                    Cihaz Adı *
                  </Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="deviceName"
                      value={formData.deviceName}
                      onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                      placeholder="Orn: HP LaserJet Pro"
                      required
                      className="rounded-l-none border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Model *
                  </Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Orn: MFP M428fdw"
                      required
                      className="rounded-l-none border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm font-medium">
                  Seri Numarası *
                </Label>
                <div className="flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Cihazin seri numarasini girin"
                    required
                    className="rounded-l-none border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <div className="space-y-4 rounded-md border bg-white/70 p-4">
              <h3 className="font-semibold text-slate-900">Müşteri Bilgileri</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Firma Adı *
                  </Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Firma adini girin"
                      required
                      className="rounded-l-none border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium">
                    Müşteri Adı *
                  </Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Musteri adini girin"
                      required
                      className="rounded-l-none border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Arıza Bilgileri */}
            <div className="space-y-4 rounded-md border bg-white/70 p-4">
              <h3 className="font-semibold text-slate-900">Arıza Bilgileri</h3>

              <div className="space-y-2">
                <Label htmlFor="problemDescription" className="text-sm font-medium">
                  Sorun Açıklaması *
                </Label>
                <div className="flex">
                  <div className="flex min-h-[100px] w-10 items-start justify-center rounded-l-md border border-r-0 bg-muted pt-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Textarea
                    id="problemDescription"
                    value={formData.problemDescription}
                    onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                    placeholder="Cihazin ariza aciklamasini detayli olarak girin"
                    required
                    className="min-h-[100px] rounded-l-none border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Durum *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'received' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'testing' | 'completed' | 'unrepairable') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Alindi</SelectItem>
                      <SelectItem value="diagnosing">Teshis Ediliyor</SelectItem>
                      <SelectItem value="waiting_parts">Parca Bekleniyor</SelectItem>
                      <SelectItem value="repairing">Tamir Ediliyor</SelectItem>
                      <SelectItem value="testing">Test Ediliyor</SelectItem>
                      <SelectItem value="completed">Tamamlandi</SelectItem>
                      <SelectItem value="unrepairable">Tamir Edilemez</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label className="text-sm font-medium">Atanan Teknisyen</Label>
                  <Select
                    value={formData.technicianId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, technicianId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20">
                      <SelectValue placeholder="Teknisyen secin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Secilmedi</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletionDate" className="text-sm font-medium">
                    Tahmini Tamamlanma Tarihi
                  </Label>
                  <div className="flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="estimatedCompletionDate"
                      type="date"
                      value={formData.estimatedCompletionDate}
                      onChange={(e) => setFormData({ ...formData, estimatedCompletionDate: e.target.value })}
                      className="rounded-l-none border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Yapilacak / Yapilan Islemler</Label>
                <div className="grid md:grid-cols-2 gap-2">
                  {REPAIR_OPERATIONS.map((operation) => (
                    <label key={operation} className="flex items-center gap-2 text-sm border rounded p-2">
                      <Checkbox
                        checked={formData.operations.includes(operation)}
                        onCheckedChange={() => toggleOperation(operation)}
                      />
                      <span>{operation}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Garanti ve Maliyet */}
            <div className="space-y-4 rounded-md border bg-white/70 p-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partsCost" className="text-sm font-medium">
                      Parca Maliyeti (TL)
                    </Label>
                    <Input
                      id="partsCost"
                      type="number"
                      step="0.01"
                      value={formData.partsCost}
                      onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                      placeholder="0.00"
                      className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distributorCost" className="text-sm font-medium">
                      Distributor Maliyeti (TL)
                    </Label>
                    <Input
                      id="distributorCost"
                      type="number"
                      step="0.01"
                      value={formData.distributorCost}
                      onChange={(e) => setFormData({ ...formData, distributorCost: e.target.value })}
                      placeholder="0.00"
                      className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repairCost" className="text-sm font-medium">
                      Musteriden Talep Edilen Fiyat (TL)
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
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Musteri Onayi</Label>
                <Select
                  value={formData.customerApprovalStatus}
                  onValueChange={(value: 'pending' | 'approved' | 'rejected') =>
                    setFormData({ ...formData, customerApprovalStatus: value })
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Onay Bekliyor</SelectItem>
                    <SelectItem value="approved">Onaylandi</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalNote" className="text-sm font-medium">
                  Onay Notu
                </Label>
                <Textarea
                  id="approvalNote"
                  value={formData.approvalNote}
                  onChange={(e) => setFormData({ ...formData, approvalNote: e.target.value })}
                  placeholder="Musteri ile gorusme/teklif notu"
                  className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repairNotes" className="text-sm font-medium">
                  Tamir Notlari
                </Label>
                <Textarea
                  id="repairNotes"
                  value={formData.repairNotes}
                  onChange={(e) => setFormData({ ...formData, repairNotes: e.target.value })}
                  placeholder="Teknik notlar..."
                  className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 min-h-[100px]"
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
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Tamir Kaydı Oluştur
              </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

