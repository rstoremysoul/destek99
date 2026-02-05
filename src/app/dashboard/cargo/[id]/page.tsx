'use client'

import { useState, useEffect } from 'react'
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

interface PageProps {
  params: { id: string }
}

export default function CargoDetailPage({ params }: PageProps) {
  const [cargo, setCargo] = useState<CargoTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCargo()
  }, [params.id])

  const fetchCargo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cargo/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // Map database format to component format
        const mappedData: CargoTracking = {
          id: data.id,
          trackingNumber: data.trackingNumber,
          type: data.type.toLowerCase(),
          status: data.status.toLowerCase(),
          sender: data.sender,
          receiver: data.receiver,
          cargoCompany: data.cargoCompany,
          sentDate: data.sentDate ? new Date(data.sentDate) : undefined,
          deliveredDate: data.deliveredDate ? new Date(data.deliveredDate) : undefined,
          destination: data.destination.toLowerCase(),
          destinationAddress: data.destinationAddress,
          notes: data.notes,
          devices: data.devices.map((d: any) => ({
            id: d.id,
            deviceName: d.deviceName,
            model: d.model,
            serialNumber: d.serialNumber,
            quantity: d.quantity,
            condition: d.condition.toLowerCase(),
            purpose: d.purpose.toLowerCase(),
          })),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setCargo(mappedData)
      } else if (response.status === 404) {
        router.push('/dashboard/cargo')
      }
    } catch (error) {
      console.error('Error fetching cargo:', error)
    } finally {
      setLoading(false)
    }
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
      month: 'long',
      year: 'numeric'
    }).format(date)
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
            <Badge variant="outline" className="text-sm py-1">
              {cargo.type === 'incoming' ? 'Gelen' : 'Giden'}
            </Badge>
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
                <p className="font-medium">{cargo.receiver}</p>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

