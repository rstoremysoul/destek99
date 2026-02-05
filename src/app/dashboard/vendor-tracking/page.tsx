'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Vendor, VendorProduct } from '@/types'
import { Plus, Search, Eye, Package, Clock, CheckCircle, Building2, Calendar, AlertCircle } from 'lucide-react'
import { VendorFormDialog } from '@/components/vendor-form-dialog'
import { VendorProductFormDialog } from '@/components/vendor-product-form-dialog'

export default function VendorTrackingPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [vendorFilter, setVendorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  const recordsPerPage = 20

  useEffect(() => {
    fetchVendors()
    fetchProducts()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/vendor-tracking')
      const data = await response.json()
      // Map API data to VendorProduct format
      const mappedProducts = data.map((item: any) => ({
        id: item.id,
        vendorId: item.vendorId,
        vendorName: item.vendor?.name || '',
        productType: 'other' as const,
        productName: item.deviceName,
        model: item.model,
        serialNumber: item.serialNumber,
        businessName: '', // Not in API, will need to add if required
        companyId: '',
        currentStatus: (item.currentStatus?.toLowerCase() || 'at_vendor') as 'at_vendor' | 'in_testing' | 'in_transit' | 'completed' | 'returned',
        entryDate: new Date(item.sentDate || item.createdAt),
        exitDate: item.receivedDate ? new Date(item.receivedDate) : undefined,
        estimatedCompletionDate: item.estimatedReturn ? new Date(item.estimatedReturn) : undefined,
        problemDescription: item.problemDescription || '',
        vendorAction: '',
        cost: item.cost,
        isPaidByVendor: false,
        statusHistory: [],
        notes: item.notes,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendorName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesVendor = vendorFilter === 'all' || product.vendorId === vendorFilter
    const matchesStatus = statusFilter === 'all' || product.currentStatus === statusFilter

    // Tarih filtreleme
    let matchesDate = true
    if (dateFilter === 'custom' && (dateRangeStart || dateRangeEnd)) {
      const recordDate = new Date(product.entryDate)
      recordDate.setHours(0, 0, 0, 0)

      if (dateRangeStart && dateRangeEnd) {
        const startDate = new Date(dateRangeStart)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dateRangeEnd)
        endDate.setHours(23, 59, 59, 999)
        matchesDate = recordDate >= startDate && recordDate <= endDate
      } else if (dateRangeStart) {
        const startDate = new Date(dateRangeStart)
        startDate.setHours(0, 0, 0, 0)
        matchesDate = recordDate >= startDate
      } else if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd)
        endDate.setHours(23, 59, 59, 999)
        matchesDate = recordDate <= endDate
      }
    } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const now = new Date()
      const recordDate = new Date(product.entryDate)

      switch (dateFilter) {
        case 'today':
          matchesDate = recordDate.toDateString() === now.toDateString()
          break
        case 'this_week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
          matchesDate = recordDate >= weekStart
          break
        case 'this_month':
          matchesDate = recordDate.getMonth() === now.getMonth() &&
                       recordDate.getFullYear() === now.getFullYear()
          break
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          matchesDate = recordDate.getMonth() === lastMonth.getMonth() &&
                       recordDate.getFullYear() === lastMonth.getFullYear()
          break
      }
    }

    return matchesSearch && matchesVendor && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredProducts.length / recordsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at_vendor': return 'secondary'
      case 'in_testing': return 'default'
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
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleAddVendor = async (newVendor: Partial<Vendor>) => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      })
      if (response.ok) {
        fetchVendors()
      }
    } catch (error) {
      console.error('Error adding vendor:', error)
    }
  }

  const handleEditVendor = async (updatedVendor: Partial<Vendor>) => {
    try {
      const response = await fetch(`/api/vendors/${updatedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVendor),
      })
      if (response.ok) {
        fetchVendors()
      }
    } catch (error) {
      console.error('Error updating vendor:', error)
    }
  }

  const handleAddProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/vendor-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  // Statistikler
  const stats = {
    totalProducts: products.length,
    atVendor: products.filter(p => p.currentStatus === 'at_vendor').length,
    inTesting: products.filter(p => p.currentStatus === 'in_testing').length,
    completed: products.filter(p => p.currentStatus === 'completed').length,
  }

  // Her tedarikçi için ürün sayıları
  const vendorStats = vendors.map(vendor => ({
    ...vendor,
    totalCount: products.filter(p => p.vendorId === vendor.id).length,
  })).filter(v => v.totalCount > 0 || v.active)

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tedarikçi Takibi</h1>
        <p className="text-muted-foreground">
          Tedarikçilerdeki ürünleri yönetin ve takip edin.
        </p>
      </div>

      {/* Arama ve Filtreler */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün adı, seri no veya tedarikçi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsProductFormOpen(true)}>
            <Package className="mr-2 h-4 w-4" />
            Ürün Gönder
          </Button>
          <Button onClick={() => {
            setSelectedVendor(null)
            setIsVendorFormOpen(true)
          }} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Tedarikçi
          </Button>
        </div>

        {/* Filtre Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tedarikçi Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tedarikçiler</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="at_vendor">Tedarikçide</SelectItem>
              <SelectItem value="in_testing">Test Ediliyor</SelectItem>
              <SelectItem value="in_transit">Kargoda</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="returned">İade Edildi</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(value) => {
              setDateFilter(value)
              if (value !== 'custom') {
                setDateRangeStart('')
                setDateRangeEnd('')
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tarih Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tarihler</SelectItem>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="this_week">Bu Hafta</SelectItem>
              <SelectItem value="this_month">Bu Ay</SelectItem>
              <SelectItem value="last_month">Geçen Ay</SelectItem>
              <SelectItem value="custom">Özel Tarih Aralığı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tarih Aralığı Seçici */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="dateStart" className="text-sm font-medium">
                Başlangıç Tarihi
              </Label>
              <Input
                id="dateStart"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd" className="text-sm font-medium">
                Bitiş Tarihi
              </Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                min={dateRangeStart}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Aktif Filtreler */}
        {(vendorFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
            {vendorFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setVendorFilter('all')}>
                Tedarikçi: {vendors.find(v => v.id === vendorFilter)?.name} ✕
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                Durum: {getStatusText(statusFilter)} ✕
              </Badge>
            )}
            {dateFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  setDateFilter('all')
                  setDateRangeStart('')
                  setDateRangeEnd('')
                }}
              >
                Tarih: {
                  dateFilter === 'custom'
                    ? `${dateRangeStart ? new Date(dateRangeStart).toLocaleDateString('tr-TR') : '?'} - ${dateRangeEnd ? new Date(dateRangeEnd).toLocaleDateString('tr-TR') : '?'}`
                    : dateFilter === 'today'
                      ? 'Bugün'
                      : dateFilter === 'this_week'
                        ? 'Bu Hafta'
                        : dateFilter === 'this_month'
                          ? 'Bu Ay'
                          : 'Geçen Ay'
                } ✕
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVendorFilter('all')
                setStatusFilter('all')
                setDateFilter('all')
                setDateRangeStart('')
                setDateRangeEnd('')
              }}
              className="text-xs"
            >
              Tümünü Temizle
            </Button>
          </div>
        )}
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Tedarikçilerde olan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tedarikçide</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.atVendor}</div>
              <p className="text-xs text-muted-foreground">
                Tamir/İşlem görüyor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Ediliyor</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTesting}</div>
              <p className="text-xs text-muted-foreground">
                Test aşamasında
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                İşlem tamamlandı
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredProducts.length} kayıt gösteriliyor
            {vendorStats.length > 0 && ` â€¢ ${vendorStats.length} aktif tedarikçi`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ürün Adı</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Model</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seri No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tedarikçi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Giriş Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tahmini Dönüş</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Maliyet</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {truncateText(product.productName, 25)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(product.model, 20)}
                    </td>
                    <td className="p-4 align-middle font-mono text-sm">
                      {product.serialNumber}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(product.vendorName, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(product.currentStatus)}>
                        {getStatusText(product.currentStatus)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(product.entryDate)}
                    </td>
                    <td className="p-4 align-middle">
                      {product.estimatedCompletionDate
                        ? formatDate(product.estimatedCompletionDate)
                        : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      {product.cost
                        ? `â‚º${product.cost.toLocaleString('tr-TR')}`
                        : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/vendor-tracking/${product.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {paginatedProducts.length} kayıt gösteriliyor (toplam {filteredProducts.length})
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Form Dialog */}
      <VendorFormDialog
        open={isVendorFormOpen}
        onOpenChange={setIsVendorFormOpen}
        onSubmit={selectedVendor ? handleEditVendor : handleAddVendor}
        vendor={selectedVendor}
      />

      {/* Vendor Product Form Dialog */}
      <VendorProductFormDialog
        open={isProductFormOpen}
        onOpenChange={setIsProductFormOpen}
        onSubmit={handleAddProduct}
        vendors={vendors}
      />
    </div>
  )
}

