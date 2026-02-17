'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VendorProduct } from '@/types'
import {
  ArrowLeft,
  Package,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  History
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default function VendorProductDetailPage({ params }: PageProps) {
  const [product, setProduct] = useState<VendorProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vendor-tracking/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // Map database format to component format
        const mappedData: VendorProduct = {
          id: data.id,
          vendorId: data.vendorId,
          vendorName: data.vendor.name,
          productType: 'other',
          productName: data.deviceName,
          model: data.model,
          serialNumber: data.serialNumber,
          businessName: 'N/A',
          companyId: 'N/A',
          currentStatus: data.currentStatus.toLowerCase(),
          entryDate: data.sentDate ? new Date(data.sentDate) : new Date(data.createdAt),
          exitDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
          estimatedCompletionDate: data.estimatedReturn ? new Date(data.estimatedReturn) : undefined,
          problemDescription: data.problemDescription,
          vendorAction: undefined,
          cost: data.cost,
          isPaidByVendor: false,
          statusHistory: data.statusHistory.map((h: any) => ({
            id: h.id,
            status: h.status.toLowerCase(),
            statusDate: new Date(h.statusDate),
            notes: h.notes,
            updatedBy: h.updatedBy,
            updatedByName: h.updatedByName,
          })),
          notes: data.notes,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }
        setProduct(mappedData)
      } else if (response.status === 404) {
        router.push('/dashboard/vendor-tracking')
      }
    } catch (error) {
      console.error('Error fetching vendor product:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at_vendor': return 'secondary'
      case 'in_testing': return 'secondary'
      case 'in_transit': return 'secondary'
      case 'completed': return 'default'
      case 'returned': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'at_vendor': return 'Tedarikçide'
      case 'in_testing': return 'Test Ediliyor'
      case 'in_transit': return 'Kargoda'
      case 'completed': return 'Tamamlandı'
      case 'returned': return 'İade Edildi'
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

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Ürün kaydı bulunamadı</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{product.productName}</h1>
            <p className="text-muted-foreground">
              {product.model} - S/N: {product.serialNumber}
            </p>
          </div>

          <Badge variant={getStatusColor(product.currentStatus)} className="text-sm py-1">
            {getStatusText(product.currentStatus)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="history">Durum Geçmişi ({product.statusHistory.length})</TabsTrigger>
          <TabsTrigger value="notes">Notlar</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tedarikçi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{product.vendorName}</p>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ürün Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ürün Adı
                  </p>
                  <p className="font-medium">{product.productName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{product.model}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Seri Numarası</p>
                  <p className="font-medium">{product.serialNumber}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Giriş Tarihi
                  </p>
                  <p className="font-medium">{formatDate(product.entryDate)}</p>
                </div>

                {product.exitDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Çıkış Tarihi
                    </p>
                    <p className="font-medium">{formatDate(product.exitDate)}</p>
                  </div>
                )}

                {product.estimatedCompletionDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tahmini Tamamlanma
                    </p>
                    <p className="font-medium">{formatDate(product.estimatedCompletionDate)}</p>
                  </div>
                )}
              </div>

              {product.cost && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Maliyet
                  </p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(product.cost)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Sorun Açıklaması
                </p>
                <p className="font-medium whitespace-pre-wrap">{product.problemDescription}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Durum Geçmişi
              </CardTitle>
              <CardDescription>
                Ürünün tedarikçideki durum değişiklikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.statusHistory
                  .sort((a, b) => b.statusDate.getTime() - a.statusDate.getTime())
                  .map((history) => (
                    <div
                      key={history.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(history.status)}>
                          {getStatusText(history.status)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(history.statusDate)}
                        </p>
                      </div>

                      <p className="text-sm font-medium">{history.updatedByName}</p>

                      {history.notes && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {history.notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              {product.notes ? (
                <p className="whitespace-pre-wrap">{product.notes}</p>
              ) : (
                <p className="text-muted-foreground">Not bulunmuyor</p>
              )}
            </CardContent>
          </Card>

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
                    {formatDate(product.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-muted-foreground">Son Güncelleme</div>
                  <div className="font-medium">
                    {formatDate(product.updatedAt)}
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

