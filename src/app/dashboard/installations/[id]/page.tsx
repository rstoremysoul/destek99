'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Save, X, Building2, User, Phone, MapPin, Calendar, Package, Wrench } from 'lucide-react'
import { InstallationForm } from '@/types'

interface PageProps {
  params: { id: string }
}

export default function InstallationDetailPage({ params }: PageProps) {
  const [installation, setInstallation] = useState<InstallationForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInstallation()
  }, [params.id])

  const fetchInstallation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/installations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // Map database format to component format
        const mappedData = {
          id: data.id,
          formNumber: data.formNumber,
          companyId: data.companyId,
          companyName: data.company.name,
          customerId: data.customerId,
          customerName: data.customer.name,
          technicianId: data.technicianId,
          technicianName: data.technician?.name,
          requestDate: new Date(data.requestDate),
          plannedInstallDate: new Date(data.plannedInstallDate),
          actualInstallDate: data.actualInstallDate ? new Date(data.actualInstallDate) : undefined,
          status: data.status.toLowerCase(),
          priority: data.priority.toLowerCase(),
          devices: data.devices.map((d: any) => ({
            id: d.id,
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            model: d.model,
            serialNumber: d.serialNumber,
            quantity: d.quantity,
            installationStatus: d.installationStatus.toLowerCase(),
            notes: d.notes,
          })),
          installationAddress: data.installationAddress,
          contactPerson: data.contactPerson,
          contactPhone: data.contactPhone,
          notes: data.notes,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setInstallation(mappedData)
      } else if (response.status === 404) {
        router.push('/dashboard/installations')
      }
    } catch (error) {
      console.error('Error fetching installation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'default'
      case 'preparing': return 'secondary'
      case 'ready': return 'default'
      case 'installing': return 'secondary'
      case 'completed': return 'default'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Al1nd1'
      case 'preparing': return 'Haz1rlan1yor'
      case 'ready': return 'Haz1r'
      case 'installing': return 'Kuruluyor'
      case 'completed': return 'Tamamland1'
      case 'cancelled': return '0ptal Edildi'
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

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'configured': return 'default'
      case 'installed': return 'default'
      case 'tested': return 'default'
      case 'completed': return 'default'
      default: return 'outline'
    }
  }

  const getDeviceStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor'
      case 'configured': return 'Yap1land1r1ld1'
      case 'installed': return 'Kuruldu'
      case 'tested': return 'Test Edildi'
      case 'completed': return 'Tamamland1'
      default: return status
    }
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

  if (!installation) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Kurulum formu bulunamad1</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{installation.formNumber}</h1>
            <p className="text-muted-foreground">
              Kurulum Formu Detaylar1
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant={getStatusColor(installation.status)} className="text-sm py-1">
              {getStatusText(installation.status)}
            </Badge>
            <Badge variant={getPriorityColor(installation.priority)} className="text-sm py-1">
              {getPriorityText(installation.priority)}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="devices">Cihazlar ({installation.devices.length})</TabsTrigger>
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
                  <p className="font-medium">{installation.companyName}</p>
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
                  <p className="font-medium">{installation.customerName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kurulum Detaylar1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Kurulum Adresi
                  </p>
                  <p className="font-medium">{installation.installationAddress}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    0leti_im Ki_isi
                  </p>
                  <p className="font-medium">{installation.contactPerson}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    0leti_im Telefonu
                  </p>
                  <p className="font-medium">{installation.contactPhone}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Atanan Teknisyen
                  </p>
                  <p className="font-medium">{installation.technicianName || 'Atanmam1_'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Talep Tarihi
                  </p>
                  <p className="font-medium">{formatDate(installation.requestDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Planlanan Kurulum
                  </p>
                  <p className="font-medium">{formatDate(installation.plannedInstallDate)}</p>
                </div>

                {installation.actualInstallDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Gerçekle_en Kurulum
                    </p>
                    <p className="font-medium">{formatDate(installation.actualInstallDate)}</p>
                  </div>
                )}
              </div>

              {installation.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notlar</p>
                  <p className="font-medium whitespace-pre-wrap">{installation.notes}</p>
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
                Kurulacak Cihazlar
              </CardTitle>
              <CardDescription>
                Toplam {installation.devices.length} cihaz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installation.devices.map((device, index) => (
                  <div
                    key={device.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{device.deviceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {device.model} " S/N: {device.serialNumber}
                        </p>
                      </div>
                      <Badge variant={getDeviceStatusColor(device.installationStatus)}>
                        {getDeviceStatusText(device.installationStatus)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Adet:</span>{' '}
                        <span className="font-medium">{device.quantity}</span>
                      </div>
                    </div>

                    {device.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Not:</span>{' '}
                        <span>{device.notes}</span>
                      </div>
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
              <CardTitle>0_lem Geçmi_i</CardTitle>
              <CardDescription>
                Form olu_turma ve güncelleme bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Olu_turulma</div>
                  <div className="font-medium">
                    {formatDate(installation.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Son Güncelleme</div>
                  <div className="font-medium">
                    {formatDate(installation.updatedAt)}
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

