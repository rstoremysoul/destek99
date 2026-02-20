'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Building2, User, Calendar, Wrench, AlertCircle, DollarSign } from 'lucide-react'
import { DeviceRepair } from '@/types'
import { toast } from 'sonner'

interface PageProps {
  params: { id: string }
}

const REPAIR_OPERATIONS = [
  'Dokunmatik Degisimi',
  'Yazici Kafasi Degisimi',
  'Anakart Onarimi',
  'Anakart Degisimi',
  'Soket Onarimi',
  'Yazilim / Image',
]

type RepairTicketMeta = {
  operations: string[]
  customerApprovalStatus: 'pending' | 'approved' | 'rejected'
  approvalNote: string
}

const REPAIR_META_TAG = '[[REPAIR_TICKET_META]]'

function parseRepairTicketMeta(raw?: string | null): { cleanNotes: string; meta: RepairTicketMeta } {
  const text = String(raw || '')
  if (!text.includes(REPAIR_META_TAG)) {
    return {
      cleanNotes: text,
      meta: { operations: [], customerApprovalStatus: 'pending', approvalNote: '' },
    }
  }

  const lines = text.split('\n')
  const cleanLines: string[] = []
  let parsed: RepairTicketMeta | null = null

  for (const line of lines) {
    if (!line.startsWith(REPAIR_META_TAG)) {
      cleanLines.push(line)
      continue
    }
    try {
      const payload = JSON.parse(line.slice(REPAIR_META_TAG.length).trim())
      parsed = {
        operations: Array.isArray(payload?.operations) ? payload.operations : [],
        customerApprovalStatus:
          payload?.customerApprovalStatus === 'approved' || payload?.customerApprovalStatus === 'rejected'
            ? payload.customerApprovalStatus
            : 'pending',
        approvalNote: String(payload?.approvalNote || ''),
      }
    } catch {
      parsed = null
    }
  }

  return {
    cleanNotes: cleanLines.join('\n').trim(),
    meta: parsed || { operations: [], customerApprovalStatus: 'pending', approvalNote: '' },
  }
}

function buildRepairNotesWithMeta(cleanNotes: string, meta: RepairTicketMeta) {
  const parts = [
    String(cleanNotes || '').trim(),
    `${REPAIR_META_TAG}${JSON.stringify(meta)}`,
  ].filter(Boolean)
  return parts.join('\n')
}

export default function RepairDetailPage({ params }: PageProps) {
  const [repair, setRepair] = useState<DeviceRepair | null>(null)
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; active: boolean }>>([])
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    status: 'received',
    priority: 'medium',
    technicianId: '',
    problemDescription: '',
    repairNotes: '',
    estimatedCompletionDate: '',
    completedDate: '',
    repairCost: '',
    partsCost: '',
    distributorCost: '',
    operations: [] as string[],
    customerApprovalStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    approvalNote: '',
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchRepair = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/repairs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const parsedMeta = parseRepairTicketMeta(data.repairNotes)
        // Map database format to component format
        const mappedData: DeviceRepair = {
          id: data.id,
          repairNumber: data.repairNumber,
          deviceName: data.deviceName,
          model: data.model,
          serialNumber: data.serialNumber,
          companyId: data.companyId,
          companyName: data.company.name,
          customerId: data.customerId,
          customerName: data.customer.name,
          technicianId: data.technicianId,
          technicianName: data.technician?.name,
          receivedDate: new Date(data.receivedDate),
          problemDescription: data.problemDescription,
          status: data.status.toLowerCase(),
          priority: data.priority.toLowerCase(),
          estimatedCompletionDate: data.estimatedCompletion ? new Date(data.estimatedCompletion) : undefined,
          actualCompletionDate: data.completedDate ? new Date(data.completedDate) : undefined,
          repairCost: data.repairCost || data.totalCost,
          distributorCost: data.distributorCost,
          internalServiceCost: data.internalServiceCost,
          isWarranty: data.isWarranty,
          warrantyEndDate: data.warrantyInfo ? undefined : undefined,
          partsUsed: [],
          repairNotes: [],
          finalReport: parsedMeta.cleanNotes,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setRepair(mappedData)
        setFormData({
          status: mappedData.status,
          priority: mappedData.priority,
          technicianId: mappedData.technicianId || '',
          problemDescription: mappedData.problemDescription || '',
          repairNotes: mappedData.finalReport || '',
          estimatedCompletionDate: mappedData.estimatedCompletionDate
            ? new Date(mappedData.estimatedCompletionDate).toISOString().split('T')[0]
            : '',
          completedDate: mappedData.actualCompletionDate
            ? new Date(mappedData.actualCompletionDate).toISOString().split('T')[0]
            : '',
          repairCost: typeof mappedData.repairCost === 'number' ? String(mappedData.repairCost) : '',
          partsCost: typeof data.partsCost === 'number' ? String(data.partsCost) : '',
          distributorCost: typeof data.distributorCost === 'number' ? String(data.distributorCost) : '',
          operations: parsedMeta.meta.operations || [],
          customerApprovalStatus: parsedMeta.meta.customerApprovalStatus || 'pending',
          approvalNote: parsedMeta.meta.approvalNote || '',
        })
      } else if (response.status === 404) {
        router.push('/dashboard/repairs')
      }
    } catch (error) {
      console.error('Error fetching repair:', error)
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
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((item: any) => item.active) : []
        setTechnicians(list)
      })
      .catch((error) => console.error('Error fetching technicians:', error))
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const normalizedRepairCost = formData.repairCost ? Number(formData.repairCost) : 0
      const normalizedPartsCost = formData.partsCost ? Number(formData.partsCost) : 0
      const normalizedDistributorCost = formData.distributorCost ? Number(formData.distributorCost) : 0
      const normalizedInternalServiceCost = Math.max(0, normalizedRepairCost - normalizedPartsCost - normalizedDistributorCost)
      const composedRepairNotes = buildRepairNotesWithMeta(formData.repairNotes, {
        operations: formData.operations,
        customerApprovalStatus: formData.customerApprovalStatus,
        approvalNote: formData.approvalNote,
      })

      const response = await fetch(`/api/repairs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          technicianId: formData.technicianId || null,
          problemDescription: formData.problemDescription,
          repairNotes: composedRepairNotes,
          estimatedCompletion: formData.estimatedCompletionDate || null,
          completedDate: formData.completedDate || null,
          repairCost: normalizedRepairCost,
          partsCost: normalizedPartsCost,
          distributorCost: normalizedDistributorCost,
          internalServiceCost: normalizedInternalServiceCost,
          totalCost: normalizedRepairCost,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        toast.error(err?.error || 'Kayit guncellenemedi')
        return
      }

      toast.success('Tamir kaydi guncellendi')
      setEditMode(false)
      await fetchRepair()
    } catch (error) {
      console.error('Error updating repair:', error)
      toast.error('Kayit guncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'default'
      case 'diagnosing': return 'secondary'
      case 'waiting_parts': return 'secondary'
      case 'repairing': return 'secondary'
      case 'testing': return 'default'
      case 'completed': return 'default'
      case 'unrepairable': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Al1nd1'
      case 'diagnosing': return 'Te_his Ediliyor'
      case 'waiting_parts': return 'Parça Bekleniyor'
      case 'repairing': return 'Onar1l1yor'
      case 'testing': return 'Test Ediliyor'
      case 'completed': return 'Tamamland1'
      case 'unrepairable': return 'Onar1lamaz'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'secondary'
      case 'medium': return 'default'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil'
      case 'high': return 'Yüksek'
      case 'medium': return 'Orta'
      case 'low': return 'Dü_ük'
      default: return priority
    }
  }

  const toggleOperation = (op: string) => {
    setFormData((prev) => ({
      ...prev,
      operations: prev.operations.includes(op)
        ? prev.operations.filter((item) => item !== op)
        : [...prev.operations, op],
    }))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Onar1m kayd1 bulunamad1</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{repair.repairNumber}</h1>
            <p className="text-muted-foreground">
              Onar1m Kayd1 Detaylar1
            </p>
          </div>

          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                  Vazgec
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  Kaydet
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Duzenle
              </Button>
            )}
            <Badge variant={getStatusColor(repair.status)} className="text-sm py-1">
              {getStatusText(repair.status)}
            </Badge>
            <Badge variant={getPriorityColor(repair.priority)} className="text-sm py-1">
              {getPriorityText(repair.priority)}
            </Badge>
            {repair.isWarranty && (
              <Badge variant="default" className="text-sm py-1">
                Garanti Kapsam1nda
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="repair">Onar1m Detaylar1</TabsTrigger>
          <TabsTrigger value="history">Geçmi_</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Company and Customer Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Firma Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Firma Ad1</p>
                  <p className="font-medium">{repair.companyName}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mü_teri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Mü_teri Ad1</p>
                  <p className="font-medium">{repair.customerName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cihaz Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cihaz Ad1</p>
                  <p className="font-medium">{repair.deviceName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{repair.model}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Seri Numaras1</p>
                  <p className="font-medium">{repair.serialNumber}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Atanan Teknisyen
                  </p>
                  {editMode ? (
                    <Select
                      value={formData.technicianId || 'none'}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, technicianId: value === 'none' ? '' : value }))}
                    >
                      <SelectTrigger className="mt-1 max-w-xs">
                        <SelectValue placeholder="Teknisyen secin" />
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
                  ) : (
                    <p className="font-medium">{repair.technicianName || 'Atanmamis'}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Al1nma Tarihi
                  </p>
                  <p className="font-medium">{formatDate(repair.receivedDate)}</p>
                </div>
              </div>

              {(repair.estimatedCompletionDate || repair.actualCompletionDate) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {repair.estimatedCompletionDate && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tahmini Tamamlanma
                      </p>
                      <p className="font-medium">{formatDate(repair.estimatedCompletionDate)}</p>
                    </div>
                  )}

                  {repair.actualCompletionDate && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Gerçekle_en Tamamlanma
                      </p>
                      <p className="font-medium">{formatDate(repair.actualCompletionDate)}</p>
                    </div>
                  )}
                </div>
              )}

              {repair.repairCost && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Onar1m Maliyeti
                  </p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(repair.repairCost)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repair" className="space-y-4">
          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle>Duzenleme Alanlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                      <SelectTrigger>
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
                    <Label>Oncelik</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Dusuk</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="high">Yuksek</SelectItem>
                        <SelectItem value="urgent">Acil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahmini Tamamlanma</Label>
                    <Input
                      type="date"
                      value={formData.estimatedCompletionDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estimatedCompletionDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gercek Tamamlanma</Label>
                    <Input
                      type="date"
                      value={formData.completedDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, completedDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label>Musteriden Talep Edilen Fiyat (TL)</Label>
                  <Input
                    type="number"
                    value={formData.repairCost}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repairCost: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Parca Maliyeti (TL)</Label>
                    <Input
                      type="number"
                      value={formData.partsCost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, partsCost: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distributor Maliyeti (TL)</Label>
                    <Input
                      type="number"
                      value={formData.distributorCost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, distributorCost: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Musteri Onayi</Label>
                  <Select
                    value={formData.customerApprovalStatus}
                    onValueChange={(value: 'pending' | 'approved' | 'rejected') =>
                      setFormData((prev) => ({ ...prev, customerApprovalStatus: value }))
                    }
                  >
                    <SelectTrigger>
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
                  <Label>Onay Notu</Label>
                  <Textarea
                    value={formData.approvalNote}
                    onChange={(e) => setFormData((prev) => ({ ...prev, approvalNote: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Yapilacak / Yapilan Islemler</Label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {REPAIR_OPERATIONS.map((op) => (
                      <label key={op} className="flex items-center gap-2 text-sm border rounded p-2">
                        <Checkbox checked={formData.operations.includes(op)} onCheckedChange={() => toggleOperation(op)} />
                        <span>{op}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ar1za Aç1klamas1
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={formData.problemDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, problemDescription: e.target.value }))}
                  rows={5}
                />
              ) : (
                <p className="whitespace-pre-wrap">{repair.problemDescription}</p>
              )}
            </CardContent>
          </Card>

          {(repair.finalReport || editMode) && (
            <Card>
              <CardHeader>
                <CardTitle>Onar1m Notlar1</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={formData.repairNotes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, repairNotes: e.target.value }))}
                    rows={5}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{repair.finalReport}</p>
                )}
              </CardContent>
            </Card>
          )}

          {!editMode && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  Musteri Onayi: {formData.customerApprovalStatus === 'approved' ? 'Onaylandi' : formData.customerApprovalStatus === 'rejected' ? 'Reddedildi' : 'Onay Bekliyor'}
                </div>
                {formData.approvalNote ? (
                  <div className="text-sm">Onay Notu: {formData.approvalNote}</div>
                ) : null}
                <div className="text-sm">Parca Maliyeti: {formData.partsCost || '0'} TL</div>
                <div className="text-sm">Distributor Maliyeti: {formData.distributorCost || '0'} TL</div>
                <div className="text-sm font-medium">Musteriden Talep Edilen: {formData.repairCost || '0'} TL</div>
                <div className="text-sm">
                  Islemler: {formData.operations.length > 0 ? formData.operations.join(', ') : '-'}
                </div>
              </CardContent>
            </Card>
          )}

          {repair.isWarranty && (
            <Card>
              <CardHeader>
                <CardTitle>Garanti Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    Bu cihaz garanti kapsam1ndad1r ve onar1m ücretsiz olarak gerçekle_tirilecektir.
                  </p>
                  {repair.warrantyEndDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Garanti Biti_ Tarihi</p>
                      <p className="font-medium">{formatDate(repair.warrantyEndDate)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>0_lem Geçmi_i</CardTitle>
              <CardDescription>
                Kay1t olu_turma ve güncelleme bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Olu_turulma</div>
                  <div className="font-medium">
                    {formatDate(repair.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Son Güncelleme</div>
                  <div className="font-medium">
                    {formatDate(repair.updatedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

