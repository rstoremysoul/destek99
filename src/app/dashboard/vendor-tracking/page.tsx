'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Eye, Package, Users, Clock, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VendorTrackingRecord {
  id: number
  vendorName: string
  deviceName: string | null
  deviceSerial: string | null
  businessName: string | null
  entryDate: string | null
  exitDate: string | null
  problemDescription: string | null
  vendorAction: string | null
  cost: string | null
  status: string
  notes: string | null
  createdAt: string
}

interface Vendor {
  id: number
  name: string
  type: string
  active: boolean
}

const STATUS_LABELS = {
  'AT_VENDOR': 'Tedarikçide',
  'COMPLETED_AT_VENDOR': 'Tamamlandı',
  'RETURNED_FROM_VENDOR': 'Geri Döndü',
  'NOT_AT_VENDOR': 'Tedarikçide Değil'
}

const STATUS_COLORS = {
  'AT_VENDOR': 'destructive',
  'COMPLETED_AT_VENDOR': 'default',
  'RETURNED_FROM_VENDOR': 'secondary',
  'NOT_AT_VENDOR': 'outline'
} as const

export default function VendorTrackingPage() {
  const [records, setRecords] = useState<VendorTrackingRecord[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState<VendorTrackingRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const recordsPerPage = 15

  useEffect(() => {
    fetchRecords()
    fetchVendors()
  }, [selectedVendor, selectedStatus])

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedVendor !== 'all') params.append('vendor', selectedVendor)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/vendor-tracking?${params}`)
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/vendor-tracking?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }

      await fetchRecords()
      alert('Kayıt başarıyla silindi!')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Kayıt silinirken hata oluştu.')
    }
  }

  const filteredRecords = records.filter(record =>
    (record.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (record.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (record.deviceSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (record.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('tr-TR')
  }

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Statistics
  const atVendorCount = records.filter(r => r.status === 'AT_VENDOR').length
  const completedCount = records.filter(r => r.status === 'COMPLETED_AT_VENDOR' || r.status === 'RETURNED_FROM_VENDOR').length
  const totalDevices = records.length

  // Vendor breakdown
  const vendorStats = vendors.map(vendor => ({
    name: vendor.name,
    count: records.filter(r => r.vendorName === vendor.name).length,
    atVendor: records.filter(r => r.vendorName === vendor.name && r.status === 'AT_VENDOR').length
  })).filter(stat => stat.count > 0)

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Veriler yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tedarikçi Takibi</h1>
        <p className="text-muted-foreground">
          Tedarikçi firmalarda bulunan cihazları takip edin ve yönetin.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Tedarikçi geçmişi olan cihazlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Şu An Tedarikçide</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atVendorCount}</div>
            <p className="text-xs text-muted-foreground">
              Aktif olarak tamirde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Tamiri tamamlanan cihazlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Tedarikçi</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Cihazı olan tedarikçiler
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tüm Kayıtlar</TabsTrigger>
          {vendorStats.map(vendor => (
            <TabsTrigger key={vendor.name} value={vendor.name.toLowerCase()}>
              {vendor.name} ({vendor.atVendor})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İşletme, cihaz adı, seri numarası veya tedarikçi ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tedarikçi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tedarikçiler</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="AT_VENDOR">Tedarikçide</SelectItem>
                <SelectItem value="COMPLETED_AT_VENDOR">Tamamlandı</SelectItem>
                <SelectItem value="RETURNED_FROM_VENDOR">Geri Döndü</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tedarikçi Takip Kayıtları</CardTitle>
              <CardDescription>
                Toplam {filteredRecords.length} kayıt gösteriliyor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Tedarikçi</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">İşletme</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Cihaz</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Seri No</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Giriş</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Çıkış</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Durum</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Maliyet</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 text-sm font-medium">
                          {record.vendorName}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {truncateText(record.businessName, 25)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {truncateText(record.deviceName, 20)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {truncateText(record.deviceSerial, 15)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {formatDate(record.entryDate)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {formatDate(record.exitDate)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          <Badge variant={STATUS_COLORS[record.status as keyof typeof STATUS_COLORS] || 'outline'}>
                            {STATUS_LABELS[record.status as keyof typeof STATUS_LABELS] || record.status}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          {truncateText(record.cost, 15)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Tedarikçi Takip Detayları</DialogTitle>
                                  <DialogDescription>
                                    Cihazın tedarikçideki durumu ve işlem geçmişi
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedRecord && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="font-semibold">Tedarikçi Adı</Label>
                                        <p>{selectedRecord.vendorName}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">İşletme Adı</Label>
                                        <p>{selectedRecord.businessName || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Cihaz Adı</Label>
                                        <p>{selectedRecord.deviceName || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Seri Numarası</Label>
                                        <p>{selectedRecord.deviceSerial || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Giriş Tarihi</Label>
                                        <p>{formatDate(selectedRecord.entryDate)}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Çıkış Tarihi</Label>
                                        <p>{formatDate(selectedRecord.exitDate)}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <Label className="font-semibold">Durum</Label>
                                        <p>
                                          <Badge variant={STATUS_COLORS[selectedRecord.status as keyof typeof STATUS_COLORS] || 'outline'}>
                                            {STATUS_LABELS[selectedRecord.status as keyof typeof STATUS_LABELS] || selectedRecord.status}
                                          </Badge>
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Sorun Açıklaması</Label>
                                        <p>{selectedRecord.problemDescription || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Tedarikçi İşlemi</Label>
                                        <p>{selectedRecord.vendorAction || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Maliyet</Label>
                                        <p>{selectedRecord.cost || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Notlar</Label>
                                        <p>{selectedRecord.notes || '-'}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    {paginatedRecords.length} kayıt gösteriliyor (toplam {filteredRecords.length})
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Vendor Tabs */}
        {vendorStats.map(vendor => (
          <TabsContent key={vendor.name} value={vendor.name.toLowerCase()} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{vendor.name} - Cihaz Durumu</CardTitle>
                <CardDescription>
                  {vendor.count} toplam cihaz, {vendor.atVendor} şu an tamirde
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {records
                    .filter(r => r.vendorName === vendor.name)
                    .slice(0, 10)
                    .map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{record.businessName}</div>
                          <div className="text-sm text-gray-600">
                            {record.deviceName} - {record.deviceSerial}
                          </div>
                        </div>
                        <Badge variant={STATUS_COLORS[record.status as keyof typeof STATUS_COLORS] || 'outline'}>
                          {STATUS_LABELS[record.status as keyof typeof STATUS_LABELS] || record.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}