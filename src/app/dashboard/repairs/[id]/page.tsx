'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps {
  params: { id: string }
}

type RepairStatusValue = 'received' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'testing' | 'completed' | 'unrepairable'
type RepairPriorityValue = 'low' | 'medium' | 'high' | 'urgent'
type ApprovalStatusValue = 'pending' | 'approved' | 'rejected'

const REPAIR_OPERATIONS = [
  'Dokunmatik Degisimi',
  'Yazici Kafasi Degisimi',
  'Anakart Onarimi',
  'Anakart Degisimi',
  'Soket Onarimi',
  'Yazilim / Image',
]

const REPAIR_META_TAG = '[[REPAIR_TICKET_META]]'

type RepairTicketMeta = {
  operations: string[]
  customerApprovalStatus: ApprovalStatusValue
  approvalNote: string
}

function parseRepairTicketMeta(raw?: string | null): { cleanNotes: string; meta: RepairTicketMeta } {
  const text = String(raw || '')
  const fallbackMeta: RepairTicketMeta = {
    operations: [],
    customerApprovalStatus: 'pending',
    approvalNote: '',
  }

  if (!text.includes(REPAIR_META_TAG)) {
    return { cleanNotes: text, meta: fallbackMeta }
  }

  const lines = text.split('\n')
  const cleanLines: string[] = []
  let parsedMeta = fallbackMeta

  for (const line of lines) {
    if (!line.startsWith(REPAIR_META_TAG)) {
      cleanLines.push(line)
      continue
    }
    try {
      const parsed = JSON.parse(line.slice(REPAIR_META_TAG.length).trim())
      parsedMeta = {
        operations: Array.isArray(parsed?.operations) ? parsed.operations : [],
        customerApprovalStatus:
          parsed?.customerApprovalStatus === 'approved' || parsed?.customerApprovalStatus === 'rejected'
            ? parsed.customerApprovalStatus
            : 'pending',
        approvalNote: String(parsed?.approvalNote || ''),
      }
    } catch {
      parsedMeta = fallbackMeta
    }
  }

  return {
    cleanNotes: cleanLines.join('\n').trim(),
    meta: parsedMeta,
  }
}

function buildRepairNotes(cleanNotes: string, meta: RepairTicketMeta) {
  return [
    String(cleanNotes || '').trim(),
    `${REPAIR_META_TAG}${JSON.stringify(meta)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function extractCargoMarkers(...values: Array<string | null | undefined>) {
  const markerRegex = /\[CARGO:[^\]]+\](?:\[CARGO_DEVICE:[^\]]+\])?/g
  const unique = new Set<string>()
  for (const value of values) {
    const text = String(value || '')
    const matches = text.match(markerRegex) || []
    for (const marker of matches) unique.add(marker)
  }
  return Array.from(unique)
}

function extractCargoInfo(rawNotes?: string | null): { cargoId: string | null; trackingNumber: string | null } {
  const text = String(rawNotes || '')
  const cargoIdMatch = text.match(/\[CARGO:([^\]]+)\]/)
  const trackingMatch = text.match(/Takip No:\s*([^\n\r]+)/)
  return {
    cargoId: cargoIdMatch ? cargoIdMatch[1] : null,
    trackingNumber: trackingMatch ? trackingMatch[1].trim() : null,
  }
}

export default function RepairDetailPage({ params }: PageProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; active: boolean }>>([])
  const [cargoMarkers, setCargoMarkers] = useState<string[]>([])

  const [form, setForm] = useState({
    repairNumber: '',
    companyName: '',
    customerName: '',
    deviceName: '',
    model: '',
    serialNumber: '',
    status: 'received' as RepairStatusValue,
    priority: 'medium' as RepairPriorityValue,
    technicianId: '',
    technicianName: '',
    receivedDate: '',
    estimatedCompletionDate: '',
    completedDate: '',
    problemDescription: '',
    diagnosisNotes: '',
    finalNotes: '',
    isWarranty: false,
    laborCost: '',
    partsCost: '',
    distributorCost: '',
    internalServiceCost: '',
    customerPrice: '',
    operations: [] as string[],
    customerApprovalStatus: 'pending' as ApprovalStatusValue,
    approvalNote: '',
    cargoId: '',
    cargoTrackingNumber: '',
  })

  const totalCostPreview = useMemo(() => {
    const labor = Number(form.laborCost || 0)
    const parts = Number(form.partsCost || 0)
    const distributor = Number(form.distributorCost || 0)
    const internal = Number(form.internalServiceCost || 0)
    return labor + parts + distributor + internal
  }, [form.laborCost, form.partsCost, form.distributorCost, form.internalServiceCost])

  const fetchRepair = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/repairs/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/dashboard/repairs')
          return
        }
        toast.error('Tamir kaydi yuklenemedi')
        return
      }

      const data = await response.json()
      const parsed = parseRepairTicketMeta(data.repairNotes)
      const cargoInfo = extractCargoInfo(data.repairNotes || data.diagnosisNotes)
      setCargoMarkers(extractCargoMarkers(data.repairNotes, data.diagnosisNotes))

      setForm({
        repairNumber: data.repairNumber || '',
        companyName: data.company?.name || '',
        customerName: data.customer?.name || '',
        deviceName: data.deviceName || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        status: (String(data.status || 'RECEIVED').toLowerCase() as RepairStatusValue),
        priority: (String(data.priority || 'MEDIUM').toLowerCase() as RepairPriorityValue),
        technicianId: data.technicianId || '',
        technicianName: data.technician?.name || '',
        receivedDate: data.receivedDate ? new Date(data.receivedDate).toISOString().split('T')[0] : '',
        estimatedCompletionDate: data.estimatedCompletion ? new Date(data.estimatedCompletion).toISOString().split('T')[0] : '',
        completedDate: data.completedDate ? new Date(data.completedDate).toISOString().split('T')[0] : '',
        problemDescription: data.problemDescription || '',
        diagnosisNotes: data.diagnosisNotes || '',
        finalNotes: parsed.cleanNotes || '',
        isWarranty: Boolean(data.isWarranty),
        laborCost: String(data.laborCost ?? ''),
        partsCost: String(data.partsCost ?? ''),
        distributorCost: String(data.distributorCost ?? ''),
        internalServiceCost: String(data.internalServiceCost ?? ''),
        customerPrice: String(data.repairCost ?? data.totalCost ?? ''),
        operations: parsed.meta.operations || [],
        customerApprovalStatus: parsed.meta.customerApprovalStatus,
        approvalNote: parsed.meta.approvalNote || '',
        cargoId: cargoInfo.cargoId || '',
        cargoTrackingNumber: cargoInfo.trackingNumber || '',
      })
    } catch (error) {
      console.error('Error fetching repair detail:', error)
      toast.error('Tamir kaydi yuklenemedi')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchRepair()
  }, [fetchRepair])

  useEffect(() => {
    fetch('/api/technicians')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setTechnicians(Array.isArray(list) ? list.filter((t) => t.active !== false) : []))
      .catch((error) => console.error('Failed to load technicians', error))
  }, [])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleOperation = (operation: string) => {
    setForm((prev) => ({
      ...prev,
      operations: prev.operations.includes(operation)
        ? prev.operations.filter((item) => item !== operation)
        : [...prev.operations, operation],
    }))
  }

  const handleSave = async () => {
    if (form.customerApprovalStatus === 'rejected' && !form.approvalNote.trim()) {
      toast.error('Musteri onayi reddedildiyse onay notu zorunludur')
      return
    }

    const repairCost = Number(form.customerPrice || 0)
    const partsCost = Number(form.partsCost || 0)
    const distributorCost = Number(form.distributorCost || 0)
    const laborCost = Number(form.laborCost || 0)
    const internalServiceCost =
      form.internalServiceCost.trim() !== ''
        ? Number(form.internalServiceCost || 0)
        : Math.max(0, repairCost - partsCost - distributorCost)

    const nextRepairNotes = buildRepairNotes(form.finalNotes, {
      operations: form.operations,
      customerApprovalStatus: form.customerApprovalStatus,
      approvalNote: form.approvalNote,
    })
    const preservedMarkers = cargoMarkers.filter((marker) => !nextRepairNotes.includes(marker))
    const composedRepairNotes = [preservedMarkers.join('\n'), nextRepairNotes].filter(Boolean).join('\n')

    try {
      setSaving(true)
      const res = await fetch(`/api/repairs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          priority: form.priority,
          technicianId: form.technicianId || null,
          problemDescription: form.problemDescription,
          diagnosisNotes: form.diagnosisNotes,
          repairNotes: composedRepairNotes,
          receivedDate: form.receivedDate || null,
          estimatedCompletion: form.estimatedCompletionDate || null,
          completedDate: form.completedDate || null,
          laborCost,
          partsCost,
          distributorCost,
          internalServiceCost,
          repairCost,
          totalCost: repairCost,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Kayit guncellenemedi')
        return
      }

      toast.success('Ticket guncellendi')
      await fetchRepair()
    } catch (error) {
      console.error('Error saving repair ticket:', error)
      toast.error('Kayit guncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    received: 'default',
    diagnosing: 'secondary',
    waiting_parts: 'secondary',
    repairing: 'secondary',
    testing: 'default',
    completed: 'default',
    unrepairable: 'destructive',
  }

  const statusText: Record<string, string> = {
    received: 'Alindi',
    diagnosing: 'Teshis Ediliyor',
    waiting_parts: 'Parca Bekleniyor',
    repairing: 'Tamir Ediliyor',
    testing: 'Test Ediliyor',
    completed: 'Onarim Tamamlandi',
    unrepairable: 'Tamir Edilemez',
  }

  const approvalText: Record<ApprovalStatusValue, string> = {
    pending: 'Onay Bekliyor',
    approved: 'Onaylandi',
    rejected: 'Reddedildi',
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold">{form.repairNumber}</h1>
          <Badge variant={statusVariant[form.status] || 'outline'}>{statusText[form.status] || form.status}</Badge>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Kaydet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kaynak ve Genel Bilgi</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Kaynak Kargo</Label>
            <div className="text-sm mt-1">
              {form.cargoTrackingNumber ? (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => router.push(form.cargoId ? `/dashboard/cargo/${form.cargoId}` : '/dashboard/cargo')}
                >
                  {form.cargoTrackingNumber}
                </Button>
              ) : '-'}
            </div>
          </div>
          <div>
            <Label>Firma</Label>
            <Input value={form.companyName} onChange={(e) => setField('companyName', e.target.value)} />
          </div>
          <div>
            <Label>Musteri</Label>
            <Input value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cihaz Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Cihaz Adi</Label>
            <Input value={form.deviceName} onChange={(e) => setField('deviceName', e.target.value)} />
          </div>
          <div>
            <Label>Model</Label>
            <Input value={form.model} onChange={(e) => setField('model', e.target.value)} />
          </div>
          <div>
            <Label>Seri No</Label>
            <Input value={form.serialNumber} onChange={(e) => setField('serialNumber', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Durum ve Teknisyen</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div>
            <Label>Durum</Label>
            <Select value={form.status} onValueChange={(v: RepairStatusValue) => setField('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Alindi</SelectItem>
                <SelectItem value="diagnosing">Teshis Ediliyor</SelectItem>
                <SelectItem value="waiting_parts">Parca Bekleniyor</SelectItem>
                <SelectItem value="repairing">Tamir Ediliyor</SelectItem>
                <SelectItem value="testing">Test Ediliyor</SelectItem>
                <SelectItem value="completed">Onarim Tamamlandi</SelectItem>
                <SelectItem value="unrepairable">Tamir Edilemez</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Oncelik</Label>
            <Select value={form.priority} onValueChange={(v: RepairPriorityValue) => setField('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Dusuk</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="high">Yuksek</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teknisyen</Label>
            <Select
              value={form.technicianId || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setField('technicianId', '')
                  setField('technicianName', '')
                  return
                }
                setField('technicianId', value)
                const selected = technicians.find((t) => t.id === value)
                setField('technicianName', selected?.name || '')
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Secilmedi</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Badge variant={form.customerApprovalStatus === 'approved' ? 'default' : form.customerApprovalStatus === 'rejected' ? 'destructive' : 'secondary'}>
              {approvalText[form.customerApprovalStatus]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarih Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Alinma Tarihi</Label>
            <Input type="date" value={form.receivedDate} onChange={(e) => setField('receivedDate', e.target.value)} />
          </div>
          <div>
            <Label>Tahmini Tamamlanma</Label>
            <Input type="date" value={form.estimatedCompletionDate} onChange={(e) => setField('estimatedCompletionDate', e.target.value)} />
          </div>
          <div>
            <Label>Gercek Tamamlanma</Label>
            <Input type="date" value={form.completedDate} onChange={(e) => setField('completedDate', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Islem ve Onay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Yapilacak / Yapilan Islemler</Label>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              {REPAIR_OPERATIONS.map((operation) => (
                <label key={operation} className="flex items-center gap-2 text-sm border rounded p-2">
                  <Checkbox checked={form.operations.includes(operation)} onCheckedChange={() => toggleOperation(operation)} />
                  <span>{operation}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Musteri Onayi</Label>
              <Select value={form.customerApprovalStatus} onValueChange={(v: ApprovalStatusValue) => setField('customerApprovalStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Onay Bekliyor</SelectItem>
                  <SelectItem value="approved">Onaylandi</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Onay Notu</Label>
              <Textarea value={form.approvalNote} onChange={(e) => setField('approvalNote', e.target.value)} rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fiyat Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-4">
          <div>
            <Label>Iscilik</Label>
            <Input type="number" value={form.laborCost} onChange={(e) => setField('laborCost', e.target.value)} />
          </div>
          <div>
            <Label>Parca</Label>
            <Input type="number" value={form.partsCost} onChange={(e) => setField('partsCost', e.target.value)} />
          </div>
          <div>
            <Label>Distributor</Label>
            <Input type="number" value={form.distributorCost} onChange={(e) => setField('distributorCost', e.target.value)} />
          </div>
          <div>
            <Label>Ic Servis</Label>
            <Input type="number" value={form.internalServiceCost} onChange={(e) => setField('internalServiceCost', e.target.value)} />
          </div>
          <div>
            <Label>Musteri Fiyati</Label>
            <Input type="number" value={form.customerPrice} onChange={(e) => setField('customerPrice', e.target.value)} />
          </div>
          <div className="md:col-span-5 text-sm text-muted-foreground">
            Maliyet Toplami (Iscilik + Parca + Distributor + Ic Servis): <span className="font-medium">{totalCostPreview.toFixed(2)} TL</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teknik Notlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ariza Aciklamasi</Label>
            <Textarea value={form.problemDescription} onChange={(e) => setField('problemDescription', e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Teshis Notlari</Label>
            <Textarea value={form.diagnosisNotes} onChange={(e) => setField('diagnosisNotes', e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Onarim/Ticket Notlari</Label>
            <Textarea value={form.finalNotes} onChange={(e) => setField('finalNotes', e.target.value)} rows={5} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
