'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const REPAIR_OPERATIONS = [
  'Dokunmatik Degistir',
  'Yazici Kafasi Degistir',
  'Onarim',
  'Anakart Degistir',
  'Image At',
]

interface CargoRepairDetail {
  id: string
  trackingNumber: string
  sender: string
  receiver: string
  cargoCompany: string
  notes?: string
  devices: Array<{ id: string; deviceName: string; model: string; serialNumber: string }>
  repair?: {
    technicianId?: string
    technicianName?: string
    operations?: string[]
    spareParts?: Array<{ name: string; quantity: number; unitCost: number }>
    laborCost?: number
    partsCost?: number
    totalCost?: number
    imageUrl?: string
    note?: string
    history?: Array<{ at: string; action: string; technicianName?: string; operations?: string[]; note?: string; laborCost?: number; partsCost?: number; totalCost?: number }>
  } | null
}

interface SparePartFormItem {
  name: string
  quantity: number
  unitCost: number
}

interface TechnicianOption {
  id: string
  name: string
  active: boolean
}

export default function CargoRepairDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<CargoRepairDetail | null>(null)
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([])
  const [technicianId, setTechnicianId] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [operations, setOperations] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [repairNote, setRepairNote] = useState('')
  const [spareParts, setSpareParts] = useState<SparePartFormItem[]>([])
  const [laborCost, setLaborCost] = useState<number>(0)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cargo-repairs/${params.id}`)
      if (!res.ok) {
        toast.error('Kargo tamir kaydi bulunamadi')
        router.push('/dashboard/repairs')
        return
      }
      const json = await res.json()
      setData(json)
      setTechnicianId(json?.repair?.technicianId || '')
      setTechnicianName(json?.repair?.technicianName || '')
      setOperations(Array.isArray(json?.repair?.operations) ? json.repair.operations : [])
      setImageUrl(json?.repair?.imageUrl || '')
      setRepairNote(json?.repair?.note || '')
      setSpareParts(Array.isArray(json?.repair?.spareParts) ? json.repair.spareParts : [])
      setLaborCost(typeof json?.repair?.laborCost === 'number' ? json.repair.laborCost : 0)
    } catch (error) {
      console.error(error)
      toast.error('Detay yuklenemedi')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!data) return
    fetch('/api/technicians')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const normalized = Array.isArray(list) ? list.filter((t) => t?.active !== false) : []
        setTechnicians(normalized)
      })
      .catch((error) => console.error('Failed to load technicians', error))
  }, [data?.id])

  const toggleOperation = (op: string) => {
    setOperations((prev) => (prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]))
  }

  const addSparePart = () => {
    setSpareParts((prev) => [...prev, { name: '', quantity: 1, unitCost: 0 }])
  }

  const removeSparePart = (index: number) => {
    setSpareParts((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSparePart = (index: number, patch: Partial<SparePartFormItem>) => {
    setSpareParts((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const partsCost = spareParts.reduce((sum, part) => sum + (Number(part.quantity) || 0) * (Number(part.unitCost) || 0), 0)
  const totalCost = partsCost + (Number(laborCost) || 0)

  const save = async (complete = false) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/cargo-repairs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId,
          technicianName,
          operations,
          imageUrl,
          repairNote,
          spareParts,
          laborCost,
          partsCost,
          totalCost,
          action: complete ? 'complete' : 'save',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Kayit guncellenemedi')
        return
      }

      toast.success(complete ? 'Onarim tamamlandi' : 'Tamir kaydi guncellendi')
      await load()
    } catch (error) {
      console.error(error)
      toast.error('Islem basarisiz')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Geri
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Kargo Tamir Ticketi: {data.trackingNumber}</CardTitle>
          <CardDescription>
            {data.sender} → {data.receiver} • {data.cargoCompany}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tamiri Yapacak Personel</Label>
            <Select
              value={technicianId || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setTechnicianId('')
                  setTechnicianName('')
                  return
                }
                setTechnicianId(value)
                const selected = technicians.find((t) => t.id === value)
                setTechnicianName(selected?.name || '')
              }}
            >
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label>Tamir Islemleri</Label>
            <div className="grid md:grid-cols-2 gap-2">
              {REPAIR_OPERATIONS.map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm border rounded p-2">
                  <Checkbox checked={operations.includes(op)} onCheckedChange={() => toggleOperation(op)} />
                  <span>{op}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image/Foto Linki</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Tamir Notu</Label>
            <Textarea value={repairNote} onChange={(e) => setRepairNote(e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Yedek Parcalar</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSparePart}>
                <Plus className="h-4 w-4 mr-1" />
                Parca Ekle
              </Button>
            </div>
            <div className="space-y-2">
              {spareParts.map((part, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded p-2">
                  <Input
                    className="col-span-6"
                    placeholder="Parca adi"
                    value={part.name}
                    onChange={(e) => updateSparePart(idx, { name: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(idx, { quantity: Number(e.target.value) || 1 })}
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    min="0"
                    step="0.01"
                    value={part.unitCost}
                    onChange={(e) => updateSparePart(idx, { unitCost: Number(e.target.value) || 0 })}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSparePart(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {spareParts.length === 0 && (
                <div className="text-sm text-muted-foreground">Parca eklenmedi.</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Iscilik Maliyeti</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Parca Maliyeti</Label>
              <Input type="number" value={partsCost.toFixed(2)} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Toplam Maliyet</Label>
              <Input type="number" value={totalCost.toFixed(2)} readOnly />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => save(false)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
            <Button variant="default" onClick={() => save(true)} disabled={saving}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Onarimi Tamamla
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Islem Gecmisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data.repair?.history || []).map((item, idx) => (
            <div key={`${item.at}-${idx}`} className="border rounded p-3">
              <div className="font-medium">{item.action}</div>
              <div className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString('tr-TR')}</div>
              {item.technicianName && <div className="text-sm">Teknisyen: {item.technicianName}</div>}
              {item.operations && item.operations.length > 0 && <div className="text-sm">Islemler: {item.operations.join(', ')}</div>}
              {item.note && <div className="text-sm">Not: {item.note}</div>}
              {typeof item.laborCost === 'number' && (
                <div className="text-sm">Iscilik: {item.laborCost.toFixed(2)} TL</div>
              )}
              {typeof item.partsCost === 'number' && (
                <div className="text-sm">Parca: {item.partsCost.toFixed(2)} TL</div>
              )}
              {typeof item.totalCost === 'number' && (
                <div className="text-sm font-medium">Toplam: {item.totalCost.toFixed(2)} TL</div>
              )}
            </div>
          ))}
          {(data.repair?.history || []).length === 0 && <div className="text-sm text-muted-foreground">Kayit yok.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
