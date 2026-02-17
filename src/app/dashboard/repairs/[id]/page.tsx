'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, User, Phone, Calendar, Wrench, AlertCircle, DollarSign } from 'lucide-react'
import { DeviceRepair } from '@/types'

interface PageProps {
  params: { id: string }
}

export default function RepairDetailPage({ params }: PageProps) {
  const [repair, setRepair] = useState<DeviceRepair | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchRepair = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/repairs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
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
          isWarranty: data.isWarranty,
          warrantyEndDate: data.warrantyInfo ? undefined : undefined,
          partsUsed: [],
          repairNotes: [],
          finalReport: data.repairNotes,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setRepair(mappedData)
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
                  <p className="font-medium">{repair.technicianName || 'Atanmam1_'}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ar1za Aç1klamas1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{repair.problemDescription}</p>
            </CardContent>
          </Card>

          {repair.finalReport && (
            <Card>
              <CardHeader>
                <CardTitle>Onar1m Notlar1</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.finalReport}</p>
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

