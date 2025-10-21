'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2 } from 'lucide-react'
// import { AgGridReact } from 'ag-grid-react'
// import 'ag-grid-community/styles/ag-grid.css'
// import 'ag-grid-community/styles/ag-theme-quartz.css'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TechnicalServiceForm } from '@/components/technical-service-form'

interface TechnicalServiceRecord {
  id: number
  businessName: string | null
  deviceName: string | null
  deviceSerial: string | null
  serviceEntryDate: string | null
  serviceExitDate: string | null
  deviceProblem: string | null
  performedAction: string | null
  serviceCost: string | null
  approvedBy: string | null
  operatingPersonnel: string | null
  vendorName: string | null
  isAtVendor: boolean
  vendorStatus: string | null
}

export default function TechnicalServicePage() {
  const [records, setRecords] = useState<TechnicalServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<TechnicalServiceRecord | null>(null)
  const [showNewRecordForm, setShowNewRecordForm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TechnicalServiceRecord | null>(null)
  const [vendorFilter, setVendorFilter] = useState('all')

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/technical-service')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/technical-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save record')
      }

      // Refresh records and close form
      await fetchRecords()
      setShowNewRecordForm(false)
      alert('Kayıt başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error saving record:', error)
      alert('Kayıt oluşturulurken hata oluştu.')
    }
  }

  const handleEdit = (record: TechnicalServiceRecord) => {
    setEditingRecord(record)
    setShowEditDialog(true)
  }

  const handleUpdate = async (formData: any) => {
    try {
      const response = await fetch('/api/technical-service', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRecord?.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update record')
      }

      await fetchRecords()
      setShowEditDialog(false)
      setEditingRecord(null)
      alert('Kayıt başarıyla güncellendi!')
    } catch (error) {
      console.error('Error updating record:', error)
      alert('Kayıt güncellenirken hata oluştu.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/technical-service?id=${id}`, {
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/technical-service/export')
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `teknik-servis-kayitlari-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting records:', error)
      alert('Dışa aktarım başarısız oldu.')
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      (record.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (record.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (record.deviceSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesVendor = vendorFilter === 'all' ||
      (vendorFilter === 'at_vendor' && record.isAtVendor) ||
      (vendorFilter === 'not_at_vendor' && !record.isAtVendor) ||
      (vendorFilter !== 'all' && vendorFilter !== 'at_vendor' && vendorFilter !== 'not_at_vendor' && record.vendorName === vendorFilter)

    return matchesSearch && matchesVendor
  })

  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 20
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('tr-TR')
  }

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Teknik Servis Takibi</h1>
        <p className="text-muted-foreground">
          Cihazların teknik servis süreçlerini takip edin ve yönetin.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İşletme, cihaz adı veya seri numarası ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={showNewRecordForm} onOpenChange={setShowNewRecordForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kayıt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Teknik Servis Kaydı</DialogTitle>
              <DialogDescription>
                Yeni bir cihaz teknik servis kaydı oluşturun
              </DialogDescription>
            </DialogHeader>
            <TechnicalServiceForm
              onSubmit={handleFormSubmit}
              onCancel={() => setShowNewRecordForm(false)}
            />
          </DialogContent>
        </Dialog>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tedarikçi Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kayıtlar</SelectItem>
            <SelectItem value="at_vendor">Tedarikçide Olanlar</SelectItem>
            <SelectItem value="not_at_vendor">Tedarikçide Olmayanlar</SelectItem>
            <SelectItem value="ROBOTPOS">ROBOTPOS</SelectItem>
            <SelectItem value="MICROS">MICROS</SelectItem>
            <SelectItem value="HUGIN">HUGIN</SelectItem>
            <SelectItem value="POS SAFE">POS SAFE</SelectItem>
            <SelectItem value="POSSIFY">POSSIFY</SelectItem>
            <SelectItem value="MERKEZ SERVİS">MERKEZ SERVİS</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Dışa Aktar
        </Button>
      </div>

      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.length}</div>
              <p className="text-xs text-muted-foreground">
                Tüm teknik servis kayıtları
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => !r.serviceExitDate).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Henüz tamamlanmamış
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => r.serviceExitDate).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Başarıyla tamamlanan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records.filter(r => {
                  if (!r.serviceEntryDate) return false
                  const recordDate = new Date(r.serviceEntryDate)
                  const now = new Date()
                  return recordDate.getMonth() === now.getMonth() &&
                         recordDate.getFullYear() === now.getFullYear()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Bu ayki kayıtlar
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teknik Servis Kayıtları</CardTitle>
          <CardDescription>
            Toplam {filteredRecords.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Tarih</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">İşletme</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Cihaz</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Seri No</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Sorun</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Durum</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Tedarikçi</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Tekniker</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Maliyet</th>
                  <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {formatDate(record.serviceEntryDate)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.businessName, 30)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.deviceName, 20)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.deviceSerial, 15)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.deviceProblem, 30)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      <Badge variant={record.serviceExitDate ? 'default' : 'destructive'}>
                        {record.serviceExitDate ? 'Tamamlandı' : 'Devam Ediyor'}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {record.isAtVendor ? (
                        <Badge variant="outline" className="text-xs">
                          {truncateText(record.vendorName, 12)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.operatingPersonnel, 15)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {truncateText(record.serviceCost, 15)}
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
                              <DialogTitle>Teknik Servis Detayları</DialogTitle>
                              <DialogDescription>
                                Cihaz takip kaydının detaylı bilgileri
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRecord && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
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
                                    <p>{formatDate(selectedRecord.serviceEntryDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Çıkış Tarihi</Label>
                                    <p>{selectedRecord.serviceExitDate ? formatDate(selectedRecord.serviceExitDate) : 'Devam ediyor'}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <Label className="font-semibold">Cihaz Sorunu</Label>
                                    <p>{selectedRecord.deviceProblem || '-'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Yapılan İşlem</Label>
                                    <p>{selectedRecord.performedAction || '-'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Servis Maliyeti</Label>
                                    <p>{selectedRecord.serviceCost || '-'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Onaylayan</Label>
                                    <p>{selectedRecord.approvedBy || '-'}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Tekniker</Label>
                                    <p>{selectedRecord.operatingPersonnel || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teknik Servis Kaydını Düzenle</DialogTitle>
            <DialogDescription>
              Mevcut kayıt bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <TechnicalServiceForm
              initialData={{
                operatingPersonnel: editingRecord.operatingPersonnel || '',
                brand: editingRecord.businessName || '',
                businessName: editingRecord.businessName || '',
                deviceName: editingRecord.deviceName || '',
                deviceSerial: editingRecord.deviceSerial || '',
                serviceEntryDate: editingRecord.serviceEntryDate ? new Date(editingRecord.serviceEntryDate) : undefined,
                serviceExitDate: editingRecord.serviceExitDate ? new Date(editingRecord.serviceExitDate) : undefined,
                deviceProblem: editingRecord.deviceProblem || '',
                performedAction: editingRecord.performedAction || '',
                serviceCost: editingRecord.serviceCost || '',
                approvedBy: editingRecord.approvedBy || '',
              }}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingRecord(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}