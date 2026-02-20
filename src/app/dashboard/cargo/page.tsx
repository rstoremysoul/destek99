'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CargoTracking } from '@/types'
import { Plus, Search, Eye, Truck, Package, ArrowUp, ArrowDown, MapPin, ArrowRightLeft, Pencil, Lock, PauseCircle } from 'lucide-react'
import { CargoFormDialog } from '@/components/cargo-form-dialog'
import { CargoDispatchDialog } from '@/components/cargo-dispatch-dialog'
import { CargoRepairTicketDialog } from '@/components/cargo-repair-ticket-dialog'
import { toast } from 'sonner'

export default function CargoPage() {
  const [cargos, setCargos] = useState<CargoTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [recordStatusFilter, setRecordStatusFilter] = useState<'open' | 'on_hold' | 'closed' | 'device_repair' | 'ready_to_ship' | 'all'>('all')
  const [destinationFilter, setDestinationFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<CargoTracking | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<CargoTracking | null>(null)
  const [repairTicketOpen, setRepairTicketOpen] = useState(false)
  const [repairTicketCargo, setRepairTicketCargo] = useState<CargoTracking | null>(null)
  const router = useRouter()

  const recordsPerPage = 20

  // Fetch cargos from API
  useEffect(() => {
    fetchCargos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter, recordStatusFilter, destinationFilter, dateFilter, dateRangeStart, dateRangeEnd])

  const fetchCargos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cargo')
      if (response.ok) {
        const data = await response.json()
          const mappedData = data.map((item: any) => ({
            id: item.id,
            trackingNumber: item.trackingNumber,
            type: item.type.toLowerCase(),
            status: item.status.toLowerCase(),
            recordStatus: item.recordStatus ? String(item.recordStatus).toLowerCase() : 'open',
            sender: item.sender,
            receiver: item.receiver,
            cargoCompany: item.cargoCompany,
            sentDate: item.sentDate ? new Date(item.sentDate) : undefined,
            deliveredDate: item.deliveredDate ? new Date(item.deliveredDate) : undefined,
            currentLocationName: item.currentLocationName || null,
            destination: item.destination.toLowerCase(),
            destinationAddress: item.destinationAddress,
            notes: item.notes,
            devices: item.devices.map((d: any) => ({
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
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }))
        setCargos(mappedData)
      }
    } catch (error) {
      console.error('Error fetching cargos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Benzersiz kargo şirketleri listesi
  const uniqueCompanies = Array.from(new Set(cargos.map(c => c.cargoCompany))).sort()

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleAddCargo = async (newCargo: Partial<CargoTracking>) => {
    try {
      const response = await fetch('/api/cargo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCargo),
      })

      if (response.ok) {
        fetchCargos()
        toast.success('Kargo kaydi olusturuldu')
        return true
      } else {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || 'Kargo kaydi olusturulamadi')
        console.error('Failed to create cargo', error)
        return false
      }
    } catch (error) {
      toast.error('Kargo kaydi olusturulurken hata olustu')
      console.error('Error creating cargo:', error)
      return false
    }
  }

  const handleUpdateCargo = async (cargoId: string, updatedCargo: Partial<CargoTracking>) => {
    try {
      const response = await fetch(`/api/cargo/${cargoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCargo),
      })

      if (response.ok) {
        fetchCargos()
        toast.success('Kargo kaydi guncellendi')
        return true
      } else {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || 'Kargo kaydi guncellenemedi')
        console.error('Failed to update cargo')
        return false
      }
    } catch (error) {
      toast.error('Kargo kaydi guncellenirken hata olustu')
      console.error('Error updating cargo:', error)
      return false
    }
  }

  const handleUpdateRecordStatus = async (cargoId: string, newStatus: 'open' | 'on_hold' | 'closed' | 'device_repair') => {
    if (newStatus === 'device_repair') {
      const cargo = cargos.find((item) => item.id === cargoId)
      if (!cargo) return
      setRepairTicketCargo(cargo)
      setRepairTicketOpen(true)
      return
    }

    try {
      const response = await fetch(`/api/cargo/${cargoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordStatus: newStatus,
        }),
      })

      if (response.ok) {
        fetchCargos()
      } else {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || 'Kayıt durumu güncellenemedi')
        console.error('Failed to update cargo record status', error)
      }
    } catch (error) {
      toast.error('Kayıt durumu güncellenirken hata oluştu')
      console.error('Error updating cargo record status:', error)
    }
  }

  const filteredCargos = cargos.filter(cargo => {
    const matchesSearch =
      cargo.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.cargoCompany.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || cargo.type === typeFilter
    const matchesStatus = statusFilter === 'all' || cargo.status === statusFilter
    const matchesRecordStatus =
      recordStatusFilter === 'all' ||
      (recordStatusFilter === 'open'
        ? (cargo.recordStatus === 'open' || cargo.recordStatus === 'device_repair')
        : cargo.recordStatus === recordStatusFilter)
    const matchesDestination = destinationFilter === 'all' || cargo.destination === destinationFilter

    // Tarih filtreleme
    let matchesDate = true
    if (dateFilter === 'custom' && (dateRangeStart || dateRangeEnd)) {
      const recordDate = cargo.sentDate ? new Date(cargo.sentDate) : null
      if (recordDate) {
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
      } else {
        matchesDate = false
      }
    } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const now = new Date()
      const recordDate = cargo.sentDate ? new Date(cargo.sentDate) : null

      if (recordDate) {
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
      } else {
        matchesDate = false
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesRecordStatus && matchesDestination && matchesDate
  })

  const getRecordStatusOrder = (status?: string) => {
    switch (status) {
      case 'open': return 0
      case 'on_hold': return 1
      case 'device_repair': return 2
      case 'ready_to_ship': return 3
      case 'closed': return 4
      default: return 0
    }
  }

  const sortedFilteredCargos = [...filteredCargos].sort((a, b) => {
    const orderDiff = getRecordStatusOrder(a.recordStatus) - getRecordStatusOrder(b.recordStatus)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const totalPages = Math.ceil(sortedFilteredCargos.length / recordsPerPage)
  const paginatedCargos = sortedFilteredCargos.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const stats = {
    total: cargos.length,
    incoming: cargos.filter(c => c.type === 'incoming').length,
    outgoing: cargos.filter(c => c.type === 'outgoing').length,
    inTransit: cargos.filter(c => c.status === 'in_transit').length,
    delivered: cargos.filter(c => c.status === 'delivered').length,
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
        <h1 className="text-3xl font-bold tracking-tight">Kargo Takibi</h1>
        <p className="text-muted-foreground">
          Tüm kargo gönderimlerini yönetin ve takip edin.
        </p>
      </div>

      {/* Arama ve Filtreler */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="cargo-search"
              name="cargoSearch"
              placeholder="Takip no, gönderen, alıcı veya kargo şirketi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kargo
          </Button>
        </div>

        {/* Filtre Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Kargo Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="incoming">Gelen</SelectItem>
              <SelectItem value="outgoing">Giden</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="in_transit">Yolda</SelectItem>
              <SelectItem value="delivered">Teslim Edildi</SelectItem>
              <SelectItem value="returned">İade Edildi</SelectItem>
              <SelectItem value="lost">Kayıp</SelectItem>
              <SelectItem value="damaged">Hasarlı</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recordStatusFilter}
            onValueChange={(value: 'open' | 'on_hold' | 'closed' | 'device_repair' | 'ready_to_ship' | 'all') => setRecordStatusFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kayıt Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Açık Kayıtlar (+ Tamirde)</SelectItem>
              <SelectItem value="on_hold">Beklemede</SelectItem>
              <SelectItem value="device_repair">Cihaz Tamiri</SelectItem>
              <SelectItem value="ready_to_ship">Gonderime Hazir</SelectItem>
              <SelectItem value="closed">Kapalı Kayıtlar</SelectItem>
              <SelectItem value="all">Tüm Kayıtlar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={destinationFilter} onValueChange={setDestinationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Hedef Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Hedefler</SelectItem>
              <SelectItem value="customer">Müşteri</SelectItem>
              <SelectItem value="distributor">Distribütör</SelectItem>
              <SelectItem value="branch">Şube</SelectItem>
              <SelectItem value="headquarters">Merkez</SelectItem>
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
        {(typeFilter !== 'all' || statusFilter !== 'all' || recordStatusFilter !== 'all' || destinationFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
            {typeFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                Tip: {typeFilter === 'incoming' ? 'Gelen' : 'Giden'} ✕
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                Durum: {getStatusText(statusFilter)} ✕
              </Badge>
            )}
            {recordStatusFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setRecordStatusFilter('all')}>
                Kayıt: {recordStatusFilter === 'closed' ? 'Kapalı' : recordStatusFilter === 'on_hold' ? 'Beklemede' : recordStatusFilter === 'device_repair' ? 'Cihaz Tamiri' : recordStatusFilter === 'ready_to_ship' ? 'Gonderime Hazir' : 'Tümü'} ✕
              </Badge>
            )}
            {destinationFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setDestinationFilter('all')}>
                Hedef: {getDestinationText(destinationFilter)} ✕
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
                setTypeFilter('all')
                setStatusFilter('all')
                setRecordStatusFilter('all')
                setDestinationFilter('all')
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kargo</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tüm kargo kayıtları
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelen</CardTitle>
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.incoming}</div>
              <p className="text-xs text-muted-foreground">
                Gelen kargolar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giden</CardTitle>
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outgoing}</div>
              <p className="text-xs text-muted-foreground">
                Giden kargolar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yolda</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground">
                Teslimat bekleyen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teslim Edilen</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">
                Başarıyla teslim edildi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Kargo Listesi</CardTitle>
          <CardDescription>
            Toplam {sortedFilteredCargos.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Takip No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tip</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kayıt</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gönderen</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Alıcı</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kargo Şirketi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hedef</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gönderim Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Depo</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Cihaz Sayısı</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCargos.map((cargo) => (
                  <tr
                    key={cargo.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      cargo.recordStatus === 'closed'
                        ? 'bg-muted/40 text-muted-foreground border-l-4 border-l-muted-foreground/40'
                        : cargo.recordStatus === 'on_hold'
                          ? 'bg-amber-50/60 border-l-4 border-l-amber-500/60'
                          : cargo.recordStatus === 'ready_to_ship'
                            ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500/60'
                          : ''
                    }`}
                  >
                    <td className="p-4 align-middle font-medium">
                      {cargo.trackingNumber}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="gap-1">
                        {cargo.type === 'incoming' ? (
                          <>
                            <ArrowDown className="h-3 w-3" />
                            Gelen
                          </>
                        ) : (
                          <>
                            <ArrowUp className="h-3 w-3" />
                            Giden
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(cargo.status)}>
                        {getStatusText(cargo.status)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={cargo.recordStatus === 'closed' ? 'secondary' : cargo.recordStatus === 'on_hold' ? 'outline' : cargo.recordStatus === 'device_repair' ? 'destructive' : cargo.recordStatus === 'ready_to_ship' ? 'default' : 'default'} className="gap-1">
                        {cargo.recordStatus === 'closed' ? <Lock className="h-3 w-3" /> : cargo.recordStatus === 'on_hold' ? <PauseCircle className="h-3 w-3" /> : null}
                        {getRecordStatusText(cargo.recordStatus)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(cargo.sender, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(cargo.receiver, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      {cargo.cargoCompany}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getDestinationText(cargo.destination)}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {cargo.sentDate ? formatDate(cargo.sentDate) : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      {cargo.type === 'incoming' ? (
                        <Badge variant="secondary">
                          {cargo.currentLocationName || 'Merkez Ofis Deposu'}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="flex flex-col items-center">
                        <span>{cargo.devices.length}</span>
                        {cargo.devices.some((d) => d.repairTicket) ? (
                          <span className="text-[11px] text-muted-foreground">
                            Tamirli: {cargo.devices.filter((d) => d.repairTicket?.status === 'closed').length} / Tamirde: {cargo.devices.filter((d) => d.repairTicket?.status === 'open').length}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/cargo/${cargo.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Görüntüle
                        </Button>
                        {cargo.type === 'incoming' && cargo.devices.length > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedCargo(cargo)
                              setDispatchOpen(true)
                            }}
                            disabled={cargo.recordStatus === 'closed'}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Sevk Et
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCargo(cargo)
                            setEditOpen(true)
                          }}
                          disabled={cargo.recordStatus === 'closed'}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        {cargo.recordStatus === 'device_repair' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRepairTicketCargo(cargo)
                              setRepairTicketOpen(true)
                            }}
                          >
                            Ticket Ac
                          </Button>
                        )}
                        <Select
                          value={cargo.recordStatus === 'ready_to_ship' ? 'open' : (cargo.recordStatus || 'open')}
                          onValueChange={(value: 'open' | 'on_hold' | 'closed' | 'device_repair') => handleUpdateRecordStatus(cargo.id, value as any)}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Açık</SelectItem>
                            <SelectItem value="on_hold">Beklemede</SelectItem>
                            <SelectItem value="device_repair">Cihaz Tamiri</SelectItem>
                            <SelectItem value="closed">Kapalı</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedCargos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {sortedFilteredCargos.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {paginatedCargos.length} kayıt gösteriliyor (toplam {sortedFilteredCargos.length})
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

      {/* Kargo Formu Dialog */}
      <CargoFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddCargo}
        mode="create"
      />

      {/* Düzenleme Dialog */}
      {editingCargo && (
        <CargoFormDialog
          open={editOpen}
          onOpenChange={(open: boolean) => {
            setEditOpen(open)
            if (!open) setEditingCargo(null)
          }}
          onSubmit={(updated) => handleUpdateCargo(editingCargo.id, updated)}
          initialData={editingCargo}
          mode="edit"
        />
      )}

      {/* Sevk Dialog */}
      {selectedCargo && (
        <CargoDispatchDialog
          open={dispatchOpen}
          onOpenChange={(open: boolean) => {
            setDispatchOpen(open)
            if (!open) setSelectedCargo(null)
          }}
          cargo={selectedCargo}
          onSuccess={fetchCargos}
        />
      )}

      {repairTicketCargo && (
        <CargoRepairTicketDialog
          open={repairTicketOpen}
          onOpenChange={(open) => {
            setRepairTicketOpen(open)
            if (!open) setRepairTicketCargo(null)
          }}
          cargo={repairTicketCargo}
          onSuccess={fetchCargos}
        />
      )}
    </div>
  )
}

