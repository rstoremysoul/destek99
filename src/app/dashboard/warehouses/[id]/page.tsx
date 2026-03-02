'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, CalendarClock, MapPin, Package, Phone, Search, Truck, User } from 'lucide-react'
import { toast } from 'sonner'

type InventoryDevice = {
  id: string
  deviceName: string
  model: string
  serialNumber: string
  condition: string
}

type RelatedCargo = {
  id: string
  trackingNumber: string
  type: string
  status: string
  recordStatus: string
  sender: string
  receiver: string
  cargoCompany?: string | null
  destinationAddress: string
  createdAt: string
  devices: Array<{
    id: string
    deviceName: string
    model: string
    serialNumber: string
    quantity: number
  }>
}

type WarehouseMovement = {
  id: string
  changedAt: string
  assignedToName?: string | null
  notes?: string | null
  previousLocationName?: string | null
  newLocationName?: string | null
  device?: {
    id: string
    deviceNumber?: string
    deviceName: string
    model?: string
    serialNumber?: string
  } | null
}

interface WarehouseDetail {
  id: string
  name: string
  type: string
  address: string | null
  contactPerson: string | null
  phone: string | null
  assignedDevices: InventoryDevice[]
  relatedCargos: RelatedCargo[]
}

function normalize(text: string) {
  return String(text || '').toLowerCase().trim()
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleString('tr-TR')
}

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null)
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [cargoQuery, setCargoQuery] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      const [warehouseRes, movementRes] = await Promise.all([
        fetch(`/api/warehouses/${params.id}`),
        fetch(`/api/warehouses/movements?warehouseId=${params.id}&limit=150`),
      ])

      if (!warehouseRes.ok) {
        toast.error('Depo bilgileri alinamadi')
        return
      }

      const warehouseData = await warehouseRes.json()
      setWarehouse(warehouseData)

      if (movementRes.ok) {
        const movementData = await movementRes.json()
        setMovements(Array.isArray(movementData) ? movementData : [])
      } else {
        setMovements([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Depo detaylari yuklenirken bir hata olustu')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  const filteredInventory = useMemo(() => {
    if (!warehouse) return []
    const q = normalize(inventoryQuery)
    if (!q) return warehouse.assignedDevices
    return warehouse.assignedDevices.filter((device) =>
      [device.deviceName, device.model, device.serialNumber, device.condition].some((field) => normalize(field).includes(q))
    )
  }, [warehouse, inventoryQuery])

  const filteredCargos = useMemo(() => {
    if (!warehouse) return []
    const q = normalize(cargoQuery)
    if (!q) return warehouse.relatedCargos
    return warehouse.relatedCargos.filter((cargo) =>
      [
        cargo.trackingNumber,
        cargo.sender,
        cargo.receiver,
        cargo.destinationAddress,
        cargo.cargoCompany || '',
        ...cargo.devices.map((d) => `${d.deviceName} ${d.model} ${d.serialNumber}`),
      ].some((field) => normalize(field).includes(q))
    )
  }, [warehouse, cargoQuery])

  const filteredMovements = useMemo(() => {
    const q = normalize(historyQuery)
    if (!q) return movements
    return movements.filter((m) =>
      [
        m.device?.deviceName || '',
        m.device?.serialNumber || '',
        m.previousLocationName || '',
        m.newLocationName || '',
        m.assignedToName || '',
        m.notes || '',
      ].some((field) => normalize(field).includes(q))
    )
  }, [movements, historyQuery])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Yukleniyor...</div>
  }

  if (!warehouse) {
    return <div className="p-6 text-sm text-muted-foreground">Depo bulunamadi.</div>
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-slate-200/40 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link href="/dashboard/warehouses">
              <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Depolara Don
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{warehouse.name}</h1>
              <Badge variant="outline">{warehouse.type || 'UNKNOWN'}</Badge>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="inline-flex items-center gap-2 rounded-md bg-background/70 px-2 py-1">
                <MapPin className="h-4 w-4" />
                {warehouse.address || 'Adres tanimli degil'}
              </span>
              {warehouse.contactPerson ? (
                <span className="inline-flex items-center gap-2 rounded-md bg-background/70 px-2 py-1">
                  <User className="h-4 w-4" />
                  {warehouse.contactPerson}
                </span>
              ) : null}
              {warehouse.phone ? (
                <span className="inline-flex items-center gap-2 rounded-md bg-background/70 px-2 py-1">
                  <Phone className="h-4 w-4" />
                  {warehouse.phone}
                </span>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border bg-white/70 p-3 text-xs text-muted-foreground shadow-sm">
            Transfer/Sevk islemleri bu ekranda yeniden duzenlenecek.
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depodaki Cihaz</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-emerald-800">{warehouse.assignedDevices.length}</span>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Iliskili Kargo Kaydi</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-indigo-800">{warehouse.relatedCargos.length}</span>
            <Truck className="h-5 w-5 text-indigo-600" />
          </CardContent>
        </Card>
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Son Hareket Zamani</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium text-amber-800">{movements[0] ? formatDate(movements[0].changedAt) : '-'}</span>
            <CalendarClock className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="inventory" className="rounded-lg">
            Envanter ({warehouse.assignedDevices.length})
          </TabsTrigger>
          <TabsTrigger value="cargos" className="rounded-lg">
            Kargo Kayitlari ({warehouse.relatedCargos.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">
            Hareketler ({movements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle>Envanter Cihaz Listesi</CardTitle>
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cihaz, model veya seri no ara"
                  value={inventoryQuery}
                  onChange={(e) => setInventoryQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Envanterde gosterilecek cihaz bulunamadi.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-medium">Cihaz</th>
                        <th className="p-3 font-medium">Model</th>
                        <th className="p-3 font-medium">Seri No</th>
                        <th className="p-3 font-medium">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((device) => (
                        <tr key={device.id} className="border-t hover:bg-muted/20">
                          <td className="p-3 font-medium">{device.deviceName}</td>
                          <td className="p-3 text-muted-foreground">{device.model}</td>
                          <td className="p-3 font-mono text-xs">{device.serialNumber}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{device.condition}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargos" className="mt-4">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle>Bu Depoya Ait Kargo Kayitlari</CardTitle>
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Takip no, gonderen, alici veya seri no ara"
                  value={cargoQuery}
                  onChange={(e) => setCargoQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredCargos.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Bu depo icin kayit bulunamadi.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCargos.map((cargo) => (
                    <div key={cargo.id} className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{cargo.trackingNumber}</Badge>
                        <Badge variant="secondary">{cargo.type}</Badge>
                        <Badge variant="secondary">{cargo.recordStatus}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(cargo.createdAt)}</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <span>Gonderen: {cargo.sender || '-'}</span>
                        <span>Alici: {cargo.receiver || '-'}</span>
                        <span>Kargo Sirketi: {cargo.cargoCompany || '-'}</span>
                        <span>Hedef: {cargo.destinationAddress || '-'}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cargo.devices.slice(0, 5).map((device) => (
                          <Badge key={device.id} variant="outline" className="font-normal">
                            {device.deviceName} / {device.model} / {device.serialNumber}
                          </Badge>
                        ))}
                        {cargo.devices.length > 5 ? (
                          <Badge variant="outline">+{cargo.devices.length - 5} cihaz</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle>Depo Hareket Gecmisi</CardTitle>
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cihaz, seri no, lokasyon veya not ara"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredMovements.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Hareket kaydi bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-medium">Tarih</th>
                        <th className="p-3 font-medium">Cihaz</th>
                        <th className="p-3 font-medium">Hareket</th>
                        <th className="p-3 font-medium">Not</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((movement) => (
                        <tr key={movement.id} className="border-t align-top hover:bg-muted/20">
                          <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{formatDate(movement.changedAt)}</td>
                          <td className="p-3">
                            <div className="font-medium">{movement.device?.deviceName || '-'}</div>
                            <div className="text-xs text-muted-foreground">{movement.device?.serialNumber || '-'}</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div>{movement.previousLocationName || '-'} -&gt; {movement.newLocationName || '-'}</div>
                            <div className="text-muted-foreground">{movement.assignedToName || '-'}</div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{movement.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
