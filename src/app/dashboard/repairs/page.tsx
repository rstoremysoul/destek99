'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CargoRepairTicket, DeviceRepair } from '@/types'
import { Plus, Search, Eye, Wrench, Calendar, CheckCircle, Clock, Shield } from 'lucide-react'
import { RepairFormDialog } from '@/components/repair-form-dialog'

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<DeviceRepair[]>([])
  const [cargoRepairs, setCargoRepairs] = useState<CargoRepairTicket[]>([])
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

  useEffect(() => {
    fetchRepairs()
    fetchCargoRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/repairs')
      if (response.ok) {
        const data = await response.json()
        const mappedData = data.map((item: any) => ({
          id: item.id,
          repairNumber: item.repairNumber,
          companyId: item.companyId,
          companyName: item.company.name,
          customerId: item.customerId,
          customerName: item.customer.name,
          deviceName: item.deviceName,
          model: item.model,
          serialNumber: item.serialNumber,
          brand: item.brand,
          receivedDate: new Date(item.receivedDate),
          completedDate: item.completedDate ? new Date(item.completedDate) : undefined,
          estimatedCompletion: item.estimatedCompletion ? new Date(item.estimatedCompletion) : undefined,
          status: item.status.toLowerCase(),
          priority: item.priority.toLowerCase(),
          problemDescription: item.problemDescription,
          diagnosisNotes: item.diagnosisNotes,
          repairNotes: item.repairNotes,
          isWarranty: item.isWarranty,
          warrantyInfo: item.warrantyInfo,
          assignedTechnician: item.assignedTechnician,
          technicianName: item.technician?.name || 'Atanmamış',
          laborCost: item.laborCost,
          partsCost: item.partsCost,
          totalCost: item.totalCost,
          repairCost: item.repairCost,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }))
        setRepairs(mappedData)
      }
    } catch (error) {
      console.error('Error fetching repairs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCargoRepairs = async () => {
    try {
      const response = await fetch('/api/cargo-repairs')
      if (!response.ok) return
      const data = await response.json()
      const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        trackingNumber: item.trackingNumber,
        sender: item.sender,
        receiver: item.receiver,
        cargoCompany: item.cargoCompany || '',
        currentLocationName: item.currentLocationName || null,
        recordStatus: item.recordStatus || 'device_repair',
        devices: item.devices || [],
        technicianName: item.technicianName || '',
        operations: item.operations || [],
        imageUrl: item.imageUrl || '',
        repairNote: item.repairNote || '',
        repairHistory: item.repairHistory || [],
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
      setCargoRepairs(mapped)
    } catch (error) {
      console.error('Error fetching cargo repairs:', error)
    }
  }

  // Benzersiz firma listesi
  const uniqueCompanies = Array.from(new Set(repairs.map(r => r.companyName))).sort()

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch =
      repair.repairNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.customerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || repair.priority === priorityFilter
    const matchesCompany = companyFilter === 'all' || repair.companyName === companyFilter

    // Tarih filtreleme
    let matchesDate = true
    if (dateFilter === 'custom' && (dateRangeStart || dateRangeEnd)) {
      const recordDate = new Date(repair.receivedDate)
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
      const recordDate = new Date(repair.receivedDate)

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

  const totalPages = Math.ceil(filteredRepairs.length / recordsPerPage)
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

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
      case 'received': return 'Alındı'
      case 'diagnosing': return 'Teşhis Ediliyor'
      case 'waiting_parts': return 'Parça Bekleniyor'
      case 'repairing': return 'Tamir Ediliyor'
      case 'testing': return 'Test Ediliyor'
      case 'completed': return 'Tamamlandı'
      case 'unrepairable': return 'Tamir Edilemez'
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

  const handleNewRepair = async (repairData: Partial<DeviceRepair>) => {
    try {
      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repairData),
      })

      if (response.ok) {
        fetchRepairs()
      } else {
        console.error('Failed to create repair')
      }
    } catch (error) {
      console.error('Error creating repair:', error)
    }
  }

  const stats = {
    total: repairs.length,
    received: repairs.filter(r => r.status === 'received').length,
    ongoing: repairs.filter(r => ['diagnosing', 'waiting_parts', 'repairing', 'testing'].includes(r.status)).length,
    completed: repairs.filter(r => r.status === 'completed').length,
    thisMonth: repairs.filter(r => {
      const recordDate = new Date(r.receivedDate)
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
        <h1 className="text-3xl font-bold tracking-tight">Cihaz Tamiri</h1>
        <p className="text-muted-foreground">
          Tüm tamir taleplerini yönetin ve takip edin.
        </p>
      </div>

      {/* Arama ve Filtreler */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tamir no, firma, müşteri, cihaz veya seri no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Tamir
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
              <SelectItem value="diagnosing">Teşhis Ediliyor</SelectItem>
              <SelectItem value="waiting_parts">Parça Bekleniyor</SelectItem>
              <SelectItem value="repairing">Tamir Ediliyor</SelectItem>
              <SelectItem value="testing">Test Ediliyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="unrepairable">Tamir Edilemez</SelectItem>
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
              <CardTitle className="text-sm font-medium">Toplam Tamir</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tüm tamir kayıtları
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alınan</CardTitle>
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
                Tamir sürecinde
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kargodan Gelen Cihaz Tamiri Ticketları</CardTitle>
          <CardDescription>
            Kargo takipte durumu &quot;Cihaz Tamiri&quot; olan kayıtlar burada görünür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cargoRepairs.map((ticket) => (
              <div key={ticket.id} className="border rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{ticket.trackingNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.sender} → {ticket.receiver} • {ticket.devices.length} cihaz
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Teknisyen: {ticket.technicianName || 'Atanmadı'}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/repairs/cargo/${ticket.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Tamiri Yönet
                </Button>
              </div>
            ))}
            {cargoRepairs.length === 0 && (
              <div className="text-sm text-muted-foreground">Aktif kargo tamir ticketı yok.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Tamir Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredRepairs.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tamir No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Firma</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Müşteri</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cihaz</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seri No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Öncelik</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alınma Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Teknisyen</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Garanti</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRepairs.map((repair) => (
                  <tr key={repair.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {repair.repairNumber}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(repair.companyName, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(repair.customerName, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(repair.deviceName, 20)}
                    </td>
                    <td className="p-4 align-middle font-mono text-sm">
                      {repair.serialNumber}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(repair.status)}>
                        {getStatusText(repair.status)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getPriorityColor(repair.priority)}>
                        {getPriorityText(repair.priority)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(repair.receivedDate)}
                    </td>
                    <td className="p-4 align-middle">
                      {repair.technicianName || '-'}
                    </td>
                    <td className="p-4 align-middle text-center">
                      {repair.isWarranty ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Garanti
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/repairs/${repair.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedRepairs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {filteredRepairs.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {paginatedRepairs.length} kayıt gösteriliyor (toplam {filteredRepairs.length})
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
      <RepairFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleNewRepair}
      />
    </div>
  )
}
