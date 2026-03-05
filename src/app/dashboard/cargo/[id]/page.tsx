'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CargoTracking } from '@/types'
import {
  ArrowLeft,
  Truck,
  ArrowUp,
  Calendar,
  Save,
  X
} from 'lucide-react'
import { CargoRepairTicketDialog } from '@/components/cargo-repair-ticket-dialog'
import { parseCargoVendorMeta } from '@/lib/cargo-vendor-workflow'
import { parseIncomingCargoFlowMeta } from '@/lib/incoming-cargo-flow'

interface PageProps {
  params: { id: string }
}

type DeviceLookupHistoryItem = {
  source: 'cargo' | 'repair' | 'installation' | 'equivalent'
  date: string
  title: string
  details: string
}

type DeviceHistoryGroup = {
  serialNumber: string
  items: DeviceLookupHistoryItem[]
}

export default function CargoDetailPage({ params }: PageProps) {
  const [cargo, setCargo] = useState<CargoTracking | null>(null)
  const [repairHistory, setRepairHistory] = useState<Array<{ at: string; action: string; technicianName?: string; operations?: string[]; note?: string }>>([])
  const [deviceHistoryGroups, setDeviceHistoryGroups] = useState<DeviceHistoryGroup[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState<{
    cargoCompany: string
    notes: string
    sentDate: string
    devices: Array<{
      id: string
      deviceName: string
      model: string
      serialNumber: string
      condition: string
      purpose: string
      quantity: number
    }>
  }>({
    cargoCompany: '',
    notes: '',
    sentDate: '',
    devices: [],
  })
  const [loading, setLoading] = useState(true)
  const [repairTicketOpen, setRepairTicketOpen] = useState(false)
  const router = useRouter()

  const fetchCargo = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cargo/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        const vendorMeta = parseCargoVendorMeta(data.notes)
        const incomingMeta = parseIncomingCargoFlowMeta(vendorMeta.notesWithoutMeta)
        // Map database format to component format
        const mappedData: CargoTracking = {
          id: data.id,
          trackingNumber: data.trackingNumber,
          type: data.type.toLowerCase(),
          status: data.status.toLowerCase(),
          recordStatus: (data.recordStatus ? String(data.recordStatus).toLowerCase() : 'open') as 'open' | 'on_hold' | 'closed' | 'device_repair' | 'ready_to_ship',
          sender: data.sender,
          receiver: data.receiver || '',
          cargoCompany: data.cargoCompany,
          sentDate: data.sentDate ? new Date(data.sentDate) : undefined,
          deliveredDate: data.deliveredDate ? new Date(data.deliveredDate) : undefined,
          destination: data.destination.toLowerCase(),
          destinationAddress: data.destinationAddress,
          notes: incomingMeta.cleanNotes,
          vendorTracking: vendorMeta.meta,
          incomingFlow: incomingMeta.meta,
          devices: data.devices.map((d: any) => ({
            id: d.id,
            deviceName: d.deviceName,
            model: d.model,
            serialNumber: d.serialNumber,
            repairTicket: d.repairTicket
              ? {
                  id: d.repairTicket.id,
                  repairNumber: d.repairTicket.repairNumber,
                  status: d.repairTicket.status,
                  state: d.repairTicket.state,
                }
              : undefined,
            deviceSource: d.deviceSource || 'other',
            equivalentDeviceId: d.equivalentDeviceId || undefined,
            customerName: d.customerName || undefined,
            customerCompanyName: d.customerCompanyName || undefined,
            quantity: d.quantity,
            condition: d.condition.toLowerCase(),
            purpose: d.purpose.toLowerCase(),
          })),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setCargo(mappedData)
        setRepairHistory(Array.isArray(data?.repair?.history) ? data.repair.history : [])
      } else if (response.status === 404) {
        router.push('/dashboard/cargo')
      }
    } catch (error) {
      console.error('Error fetching cargo:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  const fetchDeviceHistoryBySerial = useCallback(async (devices: Array<{ serialNumber?: string | null }>) => {
    const serials = Array.from(new Set((devices || []).map((d) => String(d.serialNumber || '').trim()).filter(Boolean)))
    if (serials.length === 0) {
      setDeviceHistoryGroups([])
      return
    }

    try {
      setHistoryLoading(true)
      const responses = await Promise.all(
        serials.map(async (serial) => {
          const response = await fetch(`/api/devices/lookup?serial=${encodeURIComponent(serial)}`)
          if (!response.ok) return { serial, history: [] as DeviceLookupHistoryItem[] }
          const payload = await response.json()
          const history = Array.isArray(payload?.history) ? payload.history : []
          return { serial, history }
        })
      )

      const normalized = responses.map((entry) => ({
        serialNumber: entry.serial,
        items: entry.history.map((item: any) => ({
          source: item.source,
          date: String(item.date),
          title: String(item.title || '-'),
          details: String(item.details || '-'),
        })),
      }))
      setDeviceHistoryGroups(normalized)
    } catch (error) {
      console.error('Error fetching device history by serial:', error)
      setDeviceHistoryGroups([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCargo()
  }, [fetchCargo])

  useEffect(() => {
    if (!cargo) return
    setDetailsForm({
      cargoCompany: cargo.cargoCompany || '',
      notes: cargo.notes || '',
      sentDate: cargo.sentDate ? toDateTimeLocal(cargo.sentDate) : '',
      devices: cargo.devices.map((device) => ({
        id: device.id,
        deviceName: device.deviceName || '',
        model: device.model || '',
        serialNumber: device.serialNumber || '',
        condition: device.condition,
        purpose: device.purpose,
        quantity: device.quantity || 1,
      })),
    })
    fetchDeviceHistoryBySerial(cargo.devices)
  }, [cargo, fetchDeviceHistoryBySerial])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!cargo) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Kargo kaydı bulunamadı</p>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  const toDateTimeLocal = (date: Date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 16)
  }

  const saveDetails = async () => {
    if (!cargo) return
    try {
      setIsSavingDetails(true)
      const payload = {
        cargoCompany: detailsForm.cargoCompany,
        notes: detailsForm.notes,
        sentDate: detailsForm.sentDate ? new Date(detailsForm.sentDate).toISOString() : null,
        devices: detailsForm.devices.map((device) => ({
          deviceName: device.deviceName,
          model: device.model,
          serialNumber: device.serialNumber,
          condition: device.condition,
          purpose: device.purpose,
          quantity: device.quantity || 1,
        })),
      }

      const response = await fetch(`/api/cargo/${cargo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Kargo detaylari guncellenemedi')
      }

      await fetchCargo()
      setIsEditingDetails(false)
    } catch (error) {
      console.error('Error saving cargo details:', error)
    } finally {
      setIsSavingDetails(false)
    }
  }

  const getIncomingChannelText = (channel?: string) => {
    switch (channel) {
      case 'on_site_service': return 'Yerinde Servis'
      case 'installation_team': return 'Kurulum Ekibi'
      case 'supplier': return 'Tedarikci'
      case 'customer': return 'Musteri'
      case 'cargo': return 'Kargo'
      default: return '-'
    }
  }

  const getCargoCompanyDisplay = () => {
    if (cargo.incomingFlow?.channel === 'on_site_service') return '-'
    if (cargo.incomingFlow?.channel === 'supplier') return 'Tedarikci'
    return cargo.cargoCompany || '-'
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
            <h1 className="text-3xl font-bold tracking-tight">{cargo.trackingNumber}</h1>
            <p className="text-muted-foreground">
              Kargo Takip Detayları
            </p>
          </div>

          <div className="flex gap-2">
            {cargo.vendorTracking?.vendorProductIds?.[0] ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/vendor-tracking/${cargo.vendorTracking?.vendorProductIds?.[0]}`)}
              >
                Tedarikci Takibinde
              </Button>
            ) : null}
            {cargo.recordStatus === 'device_repair' && (
              <Button variant="secondary" size="sm" onClick={() => setRepairTicketOpen(true)}>
                Ticket Ac
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5" />
                  Gönderen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{cargo.sender}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Kargo Detayları</CardTitle>
                {isEditingDetails ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingDetails(false)
                        setDetailsForm({
                          cargoCompany: cargo.cargoCompany || '',
                          notes: cargo.notes || '',
                          sentDate: cargo.sentDate ? toDateTimeLocal(cargo.sentDate) : '',
                          devices: cargo.devices.map((device) => ({
                            id: device.id,
                            deviceName: device.deviceName || '',
                            model: device.model || '',
                            serialNumber: device.serialNumber || '',
                            condition: device.condition,
                            purpose: device.purpose,
                            quantity: device.quantity || 1,
                          })),
                        })
                      }}
                      disabled={isSavingDetails}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Iptal
                    </Button>
                    <Button type="button" size="sm" onClick={saveDetails} disabled={isSavingDetails}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSavingDetails ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDetails(true)}>
                    Duzenle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Kargo Şirketi
                  </p>
                  {isEditingDetails ? (
                    <Input
                      value={detailsForm.cargoCompany}
                      onChange={(event) => setDetailsForm((prev) => ({ ...prev, cargoCompany: event.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{getCargoCompanyDisplay()}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Kayit Tarihi
                  </p>
                  <p className="font-medium">{formatDate(cargo.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Gonderim Tarihi
                  </p>
                  {isEditingDetails ? (
                    <Input
                      type="datetime-local"
                      value={detailsForm.sentDate}
                      onChange={(event) => setDetailsForm((prev) => ({ ...prev, sentDate: event.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{cargo.sentDate ? formatDate(cargo.sentDate) : 'Henüz gönderilmedi'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Gelen Cihaz Bilgileri (Marka / Model / Seri No)</p>
                <div className="space-y-3">
                  {(isEditingDetails ? detailsForm.devices : cargo.devices).map((device, index) => (
                    <div key={device.id || `${device.serialNumber}-${index}`} className="grid gap-2 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Marka</p>
                        {isEditingDetails ? (
                          <Input
                            value={detailsForm.devices[index]?.deviceName || ''}
                            onChange={(event) =>
                              setDetailsForm((prev) => {
                                const next = [...prev.devices]
                                next[index] = { ...next[index], deviceName: event.target.value }
                                return { ...prev, devices: next }
                              })
                            }
                          />
                        ) : (
                          <p className="font-medium">{device.deviceName || '-'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        {isEditingDetails ? (
                          <Input
                            value={detailsForm.devices[index]?.model || ''}
                            onChange={(event) =>
                              setDetailsForm((prev) => {
                                const next = [...prev.devices]
                                next[index] = { ...next[index], model: event.target.value }
                                return { ...prev, devices: next }
                              })
                            }
                          />
                        ) : (
                          <p className="font-medium">{device.model || '-'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Seri No</p>
                        {isEditingDetails ? (
                          <Input
                            value={detailsForm.devices[index]?.serialNumber || ''}
                            onChange={(event) =>
                              setDetailsForm((prev) => {
                                const next = [...prev.devices]
                                next[index] = { ...next[index], serialNumber: event.target.value }
                                return { ...prev, devices: next }
                              })
                            }
                          />
                        ) : (
                          <p className="font-medium">{device.serialNumber || '-'}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ariza Bildirimi</p>
                {cargo.incomingFlow?.deviceFaults && cargo.incomingFlow.deviceFaults.length > 0 ? (
                  <div className="space-y-2">
                    {cargo.incomingFlow.deviceFaults.map((fault, idx) => (
                      <div key={`${fault.serialNumber}-${idx}`} className="rounded-md border p-2">
                        <p className="text-sm font-medium">{fault.deviceName} / {fault.model} / {fault.serialNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {(fault.selectedFaultNames || []).length > 0 ? fault.selectedFaultNames.join(', ') : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">
                    {(cargo.incomingFlow?.selectedFaultNames || []).length > 0
                      ? cargo.incomingFlow?.selectedFaultNames?.join(', ')
                      : 'Ariza bilgisi yok'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ek Notlar</p>
                {isEditingDetails ? (
                  <Textarea
                    value={detailsForm.notes}
                    onChange={(event) => setDetailsForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={4}
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{cargo.notes || '-'}</p>
                )}
              </div>
              {cargo.vendorTracking ? (
                <div>
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <p className="font-medium">
                    Kayit tedarikci takibine devredildi ({cargo.vendorTracking.vendorName})
                  </p>
                </div>
              ) : null}
              {cargo.incomingFlow ? (
                <div className="rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Gelen Kargo Akis Bilgisi</p>
                  <p className="font-medium">Kanal: {getIncomingChannelText(cargo.incomingFlow.channel)}</p>
                  <p className="text-sm">Firma/Sube: {cargo.incomingFlow.companyName} / {cargo.incomingFlow.branchName}</p>
                  {cargo.incomingFlow.carrierPersonnelName ? (
                    <p className="text-sm">Cihazi Getiren Personel: {cargo.incomingFlow.carrierPersonnelName}</p>
                  ) : null}
                  <p className="text-sm">Ariza Sayisi: {cargo.incomingFlow.selectedFaultNames?.length || 0}</p>
                  <p className="text-sm">Kozmetik: {cargo.incomingFlow.cosmeticState === 'damaged_in_shipping' ? 'Kargodan Hasarli Geldi' : 'Normal'}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>
                Kayıt oluşturma ve güncelleme bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Oluşturulma</div>
                  <div className="font-medium">
                    {formatDate(cargo.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Son Güncelleme</div>
                  <div className="font-medium">
                    {formatDate(cargo.updatedAt)}
                  </div>
                </div>
                {repairHistory.map((item, idx) => (
                  <div key={`${item.at}-${idx}`} className="border rounded p-3">
                    <div className="text-sm font-medium">{item.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.at).toLocaleString('tr-TR')}
                    </div>
                    {item.technicianName && (
                      <div className="text-sm">Teknisyen: {item.technicianName}</div>
                    )}
                    {item.operations && item.operations.length > 0 && (
                      <div className="text-sm">İşlemler: {item.operations.join(', ')}</div>
                    )}
                    {item.note && <div className="text-sm">Not: {item.note}</div>}
                  </div>
                ))}
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Cihaz Servis ve Depo Gecmisi (Seri No Bazli)</div>
                  {historyLoading ? (
                    <div className="text-sm text-muted-foreground">Gecmis hareketler yukleniyor...</div>
                  ) : deviceHistoryGroups.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Bu kayitta seri no bazli gecmis bulunamadi.</div>
                  ) : (
                    <div className="space-y-3">
                      {deviceHistoryGroups.map((group) => (
                        <div key={group.serialNumber} className="rounded-md border p-3">
                          <p className="text-sm font-semibold">Seri No: {group.serialNumber}</p>
                          {group.items.length === 0 ? (
                            <p className="text-xs text-muted-foreground mt-2">Hareket kaydi yok.</p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {group.items.map((entry, index) => (
                                <div key={`${group.serialNumber}-${entry.date}-${index}`} className="rounded border p-2">
                                  <div className="text-sm font-medium">{entry.title}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString('tr-TR')}</div>
                                  <div className="text-sm">{entry.details}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {cargo ? (
        <CargoRepairTicketDialog
          open={repairTicketOpen}
          onOpenChange={setRepairTicketOpen}
          cargo={cargo}
          onSuccess={fetchCargo}
        />
      ) : null}
    </div>
  )
}

