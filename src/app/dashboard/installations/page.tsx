'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InstallationForm } from '@/types'
import { Plus, Search, Eye, Package, Calendar, Clock, CheckCircle } from 'lucide-react'
import { InstallationFormDialog } from '@/components/installation-form-dialog'

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<InstallationForm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  const recordsPerPage = 20

  // Fetch installations from API
  useEffect(() => {
    fetchInstallations()
  }, [])

  const fetchInstallations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/installations')
      if (response.ok) {
        const data = await response.json()
        // Map database format to component format
        const mappedData = data.map((item: any) => ({
          id: item.id,
          formNumber: item.formNumber,
          companyId: item.companyId,
          companyName: item.company.name,
          customerId: item.customerId,
          customerName: item.customer.name,
          technicianId: item.technicianId,
          technicianName: item.technician?.name,
          requestDate: new Date(item.requestDate),
          plannedInstallDate: new Date(item.plannedInstallDate),
          actualInstallDate: item.actualInstallDate ? new Date(item.actualInstallDate) : undefined,
          status: item.status.toLowerCase(),
          priority: item.priority.toLowerCase(),
          devices: item.devices.map((d: any) => ({
            id: d.id,
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            model: d.model,
            serialNumber: d.serialNumber,
            quantity: d.quantity,
            installationStatus: d.installationStatus.toLowerCase(),
            notes: d.notes,
          })),
          installationAddress: item.installationAddress,
          contactPerson: item.contactPerson,
          contactPhone: item.contactPhone,
          notes: item.notes,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }))
        setInstallations(mappedData)
      }
    } catch (error) {
      console.error('Error fetching installations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Benzersiz firma listesi
  const uniqueCompanies = Array.from(new Set(installations.map(i => i.companyName))).sort()

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
      case 'received': return 'Alındı'
      case 'preparing': return 'Hazırlanıyor'
      case 'ready': return 'Hazır'
      case 'installing': return 'Kuruluyor'
      case 'completed': return 'Tamamlandı'
      case 'cancelled': return 'İptal Edildi'
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
      case 'low': return 'Düşük'
      default: return priority
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleNewForm = async (formData: Partial<InstallationForm>) => {
    try {
      const response = await fetch('/api/installations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          customerPhone: formData.contactPhone,
        }),
      })

      if (response.ok) {
        // Refresh the list
        fetchInstallations()
      } else {
        console.error('Failed to create installation')
      }
    } catch (error) {
      console.error('Error creating installation:', error)
    }
  }

  const filteredInstallations = installations.filter(installation => {
    const matchesSearch =
      installation.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installation.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installation.customerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || installation.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || installation.priority === priorityFilter
    const matchesCompany = companyFilter === 'all' || installation.companyName === companyFilter

    // Tarih filtreleme
    let matchesDate = true
    if (dateFilter === 'custom' && (dateRangeStart || dateRangeEnd)) {
      const recordDate = new Date(installation.requestDate)
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
      const recordDate = new Date(installation.requestDate)

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

    return matchesSearch && matchesStatus && matchesPriority && matchesCompany && matchesDate
  })

  const totalPages = Math.ceil(filteredInstallations.length / recordsPerPage)
  const paginatedInstallations = filteredInstallations.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const stats = {
    total: installations.length,
    received: installations.filter(i => i.status === 'received').length,
    ongoing: installations.filter(i => ['preparing', 'ready', 'installing'].includes(i.status)).length,
    completed: installations.filter(i => i.status === 'completed').length,
    thisMonth: installations.filter(i => {
      const recordDate = new Date(i.requestDate)
      const now = new Date()
      return recordDate.getMonth() === now.getMonth() &&
             recordDate.getFullYear() === now.getFullYear()
    }).length,
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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Kurulum Formları</h1>
        <p className="text-muted-foreground">
          Tüm kurulum taleplerini yönetin ve takip edin.
        </p>
      </div>

      {/* Arama ve Filtreler */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Form no, firma veya müşteri ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Form
          </Button>
        </div>

        {/* Filtre Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Firma Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {uniqueCompanies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
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
              <SelectItem value="received">Alındı</SelectItem>
              <SelectItem value="preparing">Hazırlanıyor</SelectItem>
              <SelectItem value="ready">Hazır</SelectItem>
              <SelectItem value="installing">Kuruluyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Öncelik Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="urgent">Acil</SelectItem>
              <SelectItem value="high">Yüksek</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="low">Düşük</SelectItem>
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
        {(companyFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
            {companyFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setCompanyFilter('all')}>
                Firma: {companyFilter} ✕
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                Durum: {getStatusText(statusFilter)} ✕
              </Badge>
            )}
            {priorityFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setPriorityFilter('all')}>
                Öncelik: {getPriorityText(priorityFilter)} ✕
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
                setCompanyFilter('all')
                setStatusFilter('all')
                setPriorityFilter('all')
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
              <CardTitle className="text-sm font-medium">Toplam Form</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tüm kurulum formları
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.received}</div>
              <p className="text-xs text-muted-foreground">
                Alındı durumunda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ongoing}</div>
              <p className="text-xs text-muted-foreground">
                Hazırlık ve kurulum aşamasında
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
                Başarıyla tamamlanan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Kurulum Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredInstallations.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Form No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Firma</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Müşteri</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Öncelik</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Talep Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Planlanan Tarih</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Adres</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teknisyen</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Cihaz Sayısı</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInstallations.map((installation) => (
                  <tr key={installation.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {installation.formNumber}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(installation.companyName, 25)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(installation.customerName, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(installation.status)}>
                        {getStatusText(installation.status)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getPriorityColor(installation.priority)}>
                        {getPriorityText(installation.priority)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(installation.requestDate)}
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(installation.plannedInstallDate)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(installation.installationAddress, 30)}
                    </td>
                    <td className="p-4 align-middle">
                      {installation.technicianName || '-'}
                    </td>
                    <td className="p-4 align-middle text-center">
                      {installation.devices.length}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/installations/${installation.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedInstallations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {filteredInstallations.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {paginatedInstallations.length} kayıt gösteriliyor (toplam {filteredInstallations.length})
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

      {/* Form Dialog */}
      <InstallationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleNewForm}
      />
    </div>
  )
}

