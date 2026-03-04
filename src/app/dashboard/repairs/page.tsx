'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DeviceRepair } from '@/types'
import { Plus, Search, Eye, Wrench, Calendar, CheckCircle, Clock, Shield, Lock, Pencil, MoreVertical, XCircle } from 'lucide-react'
import { RepairFormDialog } from '@/components/repair-form-dialog'
import { toast } from 'sonner'

const REPAIR_META_TAG = '[[REPAIR_TICKET_META]]'

function parseRepairTicketMeta(raw?: string | null) {
  const text = String(raw || '')
  const defaultMeta = {
    operations: [] as string[],
    customerApprovalStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    approvalNote: '',
  }
  if (!text.includes(REPAIR_META_TAG)) return defaultMeta

  for (const line of text.split('\n')) {
    if (!line.startsWith(REPAIR_META_TAG)) continue
    try {
      const parsed = JSON.parse(line.slice(REPAIR_META_TAG.length).trim())
      return {
        operations: Array.isArray(parsed?.operations) ? parsed.operations : [],
        customerApprovalStatus:
          parsed?.customerApprovalStatus === 'approved' || parsed?.customerApprovalStatus === 'rejected'
            ? parsed.customerApprovalStatus
            : 'pending',
        approvalNote: String(parsed?.approvalNote || ''),
      }
    } catch {
      return defaultMeta
    }
  }
  return defaultMeta
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<DeviceRepair[]>([])
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
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  const recordsPerPage = 20

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/repairs')
      if (response.ok) {
        const data = await response.json()
        const mappedData = data.map((item: any) => ({
          ...parseRepairTicketMeta(item.repairNotes),
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
          distributorCost: item.distributorCost,
          internalServiceCost: item.internalServiceCost,
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

  const isClosedRepair = (status: string) => status === 'completed' || status === 'unrepairable'

  const sortedFilteredRepairs = [...filteredRepairs].sort((a, b) => {
    const aClosed = isClosedRepair(a.status) ? 1 : 0
    const bClosed = isClosedRepair(b.status) ? 1 : 0
    if (aClosed !== bClosed) return aClosed - bClosed
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const totalPages = Math.ceil(sortedFilteredRepairs.length / recordsPerPage)
  const paginatedRepairs = sortedFilteredRepairs.slice(
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

  const getApprovalText = (status?: string) => {
    if (status === 'approved') return 'Onaylandi'
    if (status === 'rejected') return 'Reddedildi'
    return 'Onay Bekliyor'
  }

  const getApprovalVariant = (status?: string): 'default' | 'secondary' | 'destructive' => {
    if (status === 'approved') return 'default'
    if (status === 'rejected') return 'destructive'
    return 'secondary'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
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

  const toggleRepairClosedState = async (repair: DeviceRepair) => {
    try {
      setStatusUpdatingId(repair.id)
      const shouldClose = !isClosedRepair(repair.status)
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: shouldClose ? 'completed' : 'received',
          completedDate: shouldClose ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        toast.error(err?.error || 'Durum guncellenemedi')
        return
      }

      toast.success(shouldClose ? 'Kayit kapatildi' : 'Kayit acildi')
      await fetchRepairs()
    } catch (error) {
      console.error('Error toggling repair state:', error)
      toast.error('Durum guncellenemedi')
    } finally {
      setStatusUpdatingId(null)
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
  const unrepairableCount = repairs.filter(r => r.status === 'unrepairable').length
  const waitingPartsCount = repairs.filter(r => r.status === 'waiting_parts').length
  const testingCount = repairs.filter(r => r.status === 'testing').length

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
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cihaz Tamiri</h1>
        <p className="text-slate-300">
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
              className="border-slate-600/80 bg-slate-950/70 pl-8 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
            />
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Tamir
          </Button>
        </div>

        {/* Filtre Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="border-slate-600/80 bg-slate-950/70 text-slate-100 focus:ring-cyan-400/40">
              <SelectValue placeholder="Firma Filtresi" />
            </SelectTrigger>
            <SelectContent className="border-slate-700/80 bg-slate-900 text-slate-100">
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {uniqueCompanies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-slate-600/80 bg-slate-950/70 text-slate-100 focus:ring-cyan-400/40">
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent className="border-slate-700/80 bg-slate-900 text-slate-100">
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
            <SelectTrigger className="border-slate-600/80 bg-slate-950/70 text-slate-100 focus:ring-cyan-400/40">
              <SelectValue placeholder="Öncelik Filtresi" />
            </SelectTrigger>
            <SelectContent className="border-slate-700/80 bg-slate-900 text-slate-100">
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
            <SelectTrigger className="border-slate-600/80 bg-slate-950/70 text-slate-100 focus:ring-cyan-400/40">
              <SelectValue placeholder="Tarih Filtresi" />
            </SelectTrigger>
            <SelectContent className="border-slate-700/80 bg-slate-900 text-slate-100">
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
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-700/70 bg-slate-900/55 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateStart" className="text-sm font-medium text-slate-200">
                Başlangıç Tarihi
              </Label>
              <Input
                id="dateStart"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full border-slate-600/80 bg-slate-950/70 text-slate-100 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd" className="text-sm font-medium text-slate-200">
                Bitiş Tarihi
              </Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                min={dateRangeStart}
                className="w-full border-slate-600/80 bg-slate-950/70 text-slate-100 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
              />
            </div>
          </div>
        )}

        {/* Aktif Filtreler */}
        {(companyFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-300">Aktif Filtreler:</span>
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
              className="text-xs text-slate-200 hover:bg-slate-800/70 hover:text-slate-100"
            >
              Tümünü Temizle
            </Button>
          </div>
        )}
      </div>

      {/* İstatistik Kartları */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="liquid-stat-card liquid-amber p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">TAMIRDE OLANLAR</p>
                <p className="text-2xl font-extrabold">{stats.ongoing} ADET</p>
              </div>
              <Wrench className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Aktif tamir sureci devam ediyor</div>
          </div>
          <div className="liquid-stat-card liquid-emerald p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">TAMAMLANANLAR</p>
                <p className="text-2xl font-extrabold">{stats.completed} ADET</p>
              </div>
              <CheckCircle className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Onarimi biten ticketlar</div>
          </div>
          <div className="liquid-stat-card liquid-slate p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">ISLEME ALINANLAR</p>
                <p className="text-2xl font-extrabold">{stats.received} ADET</p>
              </div>
              <Calendar className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Yeni alinan cihaz kayitlari</div>
          </div>
          <div className="liquid-stat-card liquid-rose p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">TAMIR EDILEMEZ</p>
                <p className="text-2xl font-extrabold">{unrepairableCount} ADET</p>
              </div>
              <XCircle className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Reddedilen veya iade edilenler</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="liquid-stat-card liquid-fuchsia p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">TOPLAM TAMIR</p>
                <p className="text-2xl font-extrabold">{stats.total} ADET</p>
              </div>
              <Wrench className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Tum tamir ticket kayitlari</div>
          </div>
          <div className="liquid-stat-card liquid-cyan p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">BU AY</p>
                <p className="text-2xl font-extrabold">{stats.thisMonth} ADET</p>
              </div>
              <Calendar className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Bu ay acilan kayitlar</div>
          </div>
          <div className="liquid-stat-card liquid-blue p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">PARCA BEKLEYEN</p>
                <p className="text-2xl font-extrabold">{waitingPartsCount} ADET</p>
              </div>
              <Clock className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Parca tedarik asamasinda</div>
          </div>
          <div className="liquid-stat-card liquid-indigo p-3 text-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">TEST ASAMASI</p>
                <p className="text-2xl font-extrabold">{testingCount} ADET</p>
              </div>
              <Search className="h-7 w-7" />
            </div>
            <div className="mt-2 border-t border-white/25 pt-2 text-xs">Teslim oncesi test surecinde</div>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
        <CardHeader className="border-b border-slate-700/60 pb-4">
          <CardTitle className="text-slate-100">Tamir Listesi</CardTitle>
          <CardDescription className="text-slate-300">
            Toplam {sortedFilteredRepairs.length} kayıt gösteriliyor (tamir edilenler kapalı olarak listelenir)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-800/85">
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Tamir No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Firma</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Müşteri</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Cihaz</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Seri No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Öncelik</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Olusturma Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Alınma Tarihi</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Teknisyen</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Musteri Onayi</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-slate-300">Islem</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">Garanti</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRepairs.map((repair) => (
                  <tr
                    key={repair.id}
                    className={`border-b border-slate-700/70 text-slate-100 transition-colors hover:bg-slate-800/45 ${
                      isClosedRepair(repair.status)
                        ? 'bg-slate-800/35 text-slate-400 border-l-4 border-l-slate-500/50'
                        : ''
                    }`}
                  >
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{repair.repairNumber}</Badge>
                        {isClosedRepair(repair.status) ? (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Kapali
                          </Badge>
                        ) : null}
                      </div>
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
                      <Badge
                        variant={isClosedRepair(repair.status) ? 'secondary' : getStatusColor(repair.status)}
                        className="gap-1"
                      >
                        {isClosedRepair(repair.status) ? <Lock className="h-3 w-3" /> : null}
                        {getStatusText(repair.status)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getPriorityColor(repair.priority)}>
                        {getPriorityText(repair.priority)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(repair.createdAt)}
                    </td>
                    <td className="p-4 align-middle">
                      {formatDate(repair.receivedDate)}
                    </td>
                    <td className="p-4 align-middle">
                      {repair.technicianName || '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getApprovalVariant(repair.customerApprovalStatus)}>
                        {getApprovalText(repair.customerApprovalStatus)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <Badge variant="outline">{repair.operations?.length || 0}</Badge>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 border-slate-600/80 bg-slate-900/45 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                          >
                            Islemler
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 border-slate-700/80 bg-slate-900 text-slate-100">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/repairs/${repair.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Goruntule
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/repairs/${repair.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Duzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={statusUpdatingId === repair.id}
                            onClick={() => toggleRepairClosedState(repair)}
                          >
                            {statusUpdatingId === repair.id ? 'Bekleyin...' : (isClosedRepair(repair.status) ? 'Ac' : 'Kapat')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedRepairs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-300">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {sortedFilteredRepairs.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-slate-300">
                  {paginatedRepairs.length} kayıt gösteriliyor (toplam {sortedFilteredRepairs.length})
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-600/80 bg-slate-900/45 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                  >
                    Önceki
                  </Button>
                  <span className="text-sm text-slate-200">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-slate-600/80 bg-slate-900/45 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
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
