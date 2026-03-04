'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CargoTracking } from '@/types'
import {
  ArrowLeft,
  Truck,
  Package,
  ArrowUp,
  ArrowDown,
  MapPin,
  Calendar,
  User,
  Building2,
  ClipboardList
} from 'lucide-react'
import { CargoRepairTicketDialog } from '@/components/cargo-repair-ticket-dialog'
import { parseCargoVendorMeta } from '@/lib/cargo-vendor-workflow'
import { parseIncomingCargoFlowMeta } from '@/lib/incoming-cargo-flow'

interface PageProps {
  params: { id: string }
}

export default function CargoDetailPage({ params }: PageProps) {
  const [cargo, setCargo] = useState<CargoTracking | null>(null)
  const [repairHistory, setRepairHistory] = useState<Array<{ at: string; action: string; technicianName?: string; operations?: string[]; note?: string }>>([])
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

  useEffect(() => {
    fetchCargo()
  }, [fetchCargo])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit': return 'secondary'
      case 'delivered': return 'default'
      case 'returned': return 'secondary'
      case 'lost': return 'destructive'
      case 'damaged': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit': return 'Yolda'
      case 'delivered': return 'Teslim Edildi'
      case 'returned': return 'İade Edildi'
      case 'lost': return 'Kayıp'
      case 'damaged': return 'Hasarlı'
      default: return status
    }
  }

  const getDestinationText = (destination: string) => {
    switch (destination) {
      case 'customer': return 'Müşteri'
      case 'distributor': return 'Distribütör'
      case 'branch': return 'Şube'
      case 'headquarters': return 'Merkez'
      default: return destination
    }
  }

  const getRecordStatusText = (status?: string) => {
    switch (status) {
      case 'open': return 'Açık'
      case 'on_hold': return 'Beklemede'
      case 'closed': return 'Kapalı'
      case 'device_repair': return 'Cihaz Tamiri'
      case 'ready_to_ship': return 'Gonderime Hazir'
      default: return 'Açık'
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Yeni'
      case 'used': return 'Kullanılmış'
      case 'refurbished': return 'Yenilenmiş'
      case 'damaged': return 'Hasarlı'
      default: return condition
    }
  }

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case 'installation': return 'Kurulum'
      case 'replacement': return 'Değişim'
      case 'repair': return 'Tamir'
      case 'return': return 'İade'
      default: return purpose
    }
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

  const isTechnicalServiceOutgoing =
    cargo.type === 'outgoing' && String(cargo.notes || '').includes('[AUTO_OUTGOING_FROM_REPAIR:')

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
            <Badge variant={getStatusColor(cargo.status)} className="text-sm py-1">
              {getStatusText(cargo.status)}
            </Badge>
              <Badge
              variant={cargo.recordStatus === 'closed' ? 'secondary' : cargo.recordStatus === 'on_hold' ? 'outline' : cargo.recordStatus === 'device_repair' ? 'destructive' : 'default'}
              className="text-sm py-1"
            >
              {getRecordStatusText(cargo.recordStatus)}
            </Badge>
            <Badge variant="outline" className="text-sm py-1">
              {cargo.type === 'incoming' ? 'Gelen' : 'Giden'}
            </Badge>
            {isTechnicalServiceOutgoing ? (
              <Badge variant="outline" className="text-sm py-1">
                Kaynak: Teknik Servis
              </Badge>
            ) : null}
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
          <TabsTrigger value="devices">Cihazlar ({cargo.devices.length})</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Sender and Receiver Info */}
          <div className="grid gap-4 md:grid-cols-2">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5" />
                  Alıcı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{cargo.type === 'incoming' ? '-' : (cargo.receiver || '-')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Cargo Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kargo Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Kargo Şirketi
                  </p>
                  <p className="font-medium">{cargo.cargoCompany}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Hedef
                  </p>
                  <p className="font-medium">{getDestinationText(cargo.destination)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Adresi
                  </p>
                  <p className="font-medium">{cargo.destinationAddress}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Gönderim Tarihi
                  </p>
                  <p className="font-medium">
                    {cargo.sentDate ? formatDate(cargo.sentDate) : 'Henüz gönderilmedi'}
                  </p>
                </div>

                {cargo.deliveredDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Teslim Tarihi
                    </p>
                    <p className="font-medium">{formatDate(cargo.deliveredDate)}</p>
                  </div>
                )}
              </div>

              {cargo.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="font-medium whitespace-pre-wrap">{cargo.notes}</p>
                </div>
              )}
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
                  <p className="text-sm">Ariza Sayisi: {cargo.incomingFlow.selectedFaultNames?.length || 0}</p>
                  <p className="text-sm">Kozmetik: {cargo.incomingFlow.cosmeticState === 'damaged_in_shipping' ? 'Kargodan Hasarli Geldi' : 'Normal'}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Kargodaki Cihazlar
              </CardTitle>
              <CardDescription>
                Toplam {cargo.devices.length} cihaz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cargo.devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{device.deviceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {device.model} - S/N: {device.serialNumber}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {device.quantity}x
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Durum:</span>{' '}
                        <span className="font-medium">{getConditionText(device.condition)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amaç:</span>{' '}
                        <span className="font-medium">{getPurposeText(device.purpose)}</span>
                      </div>
                    </div>
                    {device.repairTicket ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant={device.repairTicket.status === 'open' ? 'destructive' : 'default'}>
                          {device.repairTicket.status === 'open' ? 'Tamirde' : 'Tamir Tamamlandi'}
                        </Badge>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => router.push(`/dashboard/repairs/${device.repairTicket?.id}`)}
                        >
                          {device.repairTicket.repairNumber}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground pt-1">Bu cihaz icin tamir ticketi yok.</div>
                    )}
                  </div>
                ))}
              </div>
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

