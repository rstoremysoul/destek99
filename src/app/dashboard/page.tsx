'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle2,
  Wrench,
  FolderOpen,
  XCircle,
  Truck,
  PackageCheck,
  Clock3,
  ReceiptText,
  Plus,
  Search,
  CalendarDays,
  ClipboardCheck,
  FileWarning,
  Loader2,
  MoreVertical,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

type StatusCard = {
  title: string
  count: number
  note: string
  icon: any
  className: string
}

type ServiceRow = {
  id: string
  ticketNo: string
  customer: string
  productGroup: string
  brand: string
  model: string
  purchaseDate: string
  deliveryDate: string
  serviceType: string
  feeText: string
  status: 'tamirde' | 'teslim_edildi' | 'parca_bekliyor' | 'iptal_iade' | 'test'
  priority: 'dusuk' | 'orta' | 'yuksek'
  isClosed: boolean
  serialNumber: string
}

const secondCards: StatusCard[] = [
  { title: 'KARGOYA VERILENLER', count: 1, note: '%4 Kargoya Verildi', icon: Truck, className: 'bg-pink-600' },
  { title: 'TESLIM EDILENLER', count: 4, note: '%19 Teslim Edildi', icon: PackageCheck, className: 'bg-cyan-500' },
  { title: 'PARCA BEKLEYENLER', count: 1, note: '%4 Parca Bekliyor', icon: Clock3, className: 'bg-blue-600' },
  { title: 'BORCLU OLANLAR', count: 4, note: '%21 Borcu Var', icon: ReceiptText, className: 'bg-indigo-600' },
]

const actionTiles = [
  { label: 'Cihaz Ekle', icon: Plus, count: null },
  { label: 'Tum Cihazlar', icon: Search, count: null },
  { label: 'Randevulu', icon: CalendarDays, count: 1 },
  { label: 'Onay Bekleyen', icon: ClipboardCheck, count: 0 },
  { label: 'Isleme Alinacak', icon: FolderOpen, count: 2 },
  { label: 'Bakimi Gecenler', icon: FileWarning, count: 12 },
]

function mapRepairStatus(status: string): ServiceRow['status'] {
  const value = String(status || '').toUpperCase()
  if (value === 'COMPLETED') return 'teslim_edildi'
  if (value === 'WAITING_PARTS') return 'parca_bekliyor'
  if (value === 'UNREPAIRABLE') return 'iptal_iade'
  if (value === 'TESTING') return 'test'
  return 'tamirde'
}

function mapPriority(priority: string): ServiceRow['priority'] {
  const value = String(priority || '').toUpperCase()
  if (value === 'URGENT' || value === 'HIGH') return 'yuksek'
  if (value === 'MEDIUM') return 'orta'
  return 'dusuk'
}

function formatDateTimeText(dateValue?: string | null) {
  if (!dateValue) return 'TESLIM EDILMEDI'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'TESLIM EDILMEDI'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function statusClass(status: ServiceRow['status']) {
  if (status === 'teslim_edildi') return 'bg-cyan-500 text-white'
  if (status === 'parca_bekliyor') return 'bg-blue-600 text-white'
  if (status === 'iptal_iade') return 'bg-red-500 text-white'
  if (status === 'test') return 'bg-indigo-600 text-white'
  return 'bg-amber-500 text-white'
}

function statusText(status: ServiceRow['status']) {
  if (status === 'teslim_edildi') return 'TESLIM EDILDI'
  if (status === 'parca_bekliyor') return 'PARCA BEKLIYOR'
  if (status === 'iptal_iade') return 'IPTAL IADE'
  if (status === 'test') return 'TEST SURECINDE'
  return 'TAMIRDE'
}

function priorityClass(priority: ServiceRow['priority']) {
  if (priority === 'yuksek') return 'bg-red-100 text-red-700'
  if (priority === 'orta') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function priorityText(priority: ServiceRow['priority']) {
  if (priority === 'yuksek') return 'YUKSEK'
  if (priority === 'orta') return 'ORTA'
  return 'DUSUK'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const fetchRows = async () => {
    try {
      setLoadingRows(true)
      const response = await fetch('/api/repairs')
      if (!response.ok) {
        toast.error('Tamir kayitlari alinamadi')
        return
      }

      const data = await response.json()
      const mapped: ServiceRow[] = (Array.isArray(data) ? data : []).map((item: any) => {
        const status = mapRepairStatus(item.status)
        return {
          id: item.id,
          ticketNo: item.repairNumber || '-',
          customer: item.customer?.name || item.company?.name || '-',
          productGroup: item.deviceName || '-',
          brand: item.brand || '-',
          model: item.model || '-',
          purchaseDate: formatDateTimeText(item.receivedDate),
          deliveryDate: formatDateTimeText(item.completedDate),
          serviceType: item.technician?.name ? 'SERVIS' : 'RANDEVULU',
          feeText: `${Number(item.repairCost || 0).toFixed(2)} ₺`,
          status,
          priority: mapPriority(item.priority),
          isClosed: String(item.status || '').toUpperCase() === 'COMPLETED' || String(item.status || '').toUpperCase() === 'UNREPAIRABLE',
          serialNumber: item.serialNumber || '',
        }
      })

      setRows(mapped.slice(0, 12))
    } catch (error) {
      console.error('Failed to load dashboard repairs', error)
      toast.error('Tamir kayitlari alinamadi')
    } finally {
      setLoadingRows(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  const topCards = useMemo<StatusCard[]>(() => {
    const repaired = rows.filter((r) => r.status === 'teslim_edildi').length
    const repairing = rows.filter((r) => r.status === 'tamirde' || r.status === 'test').length
    const waiting = rows.filter((r) => r.status === 'parca_bekliyor').length
    const cancelled = rows.filter((r) => r.status === 'iptal_iade').length
    const total = Math.max(rows.length, 1)

    const toPct = (value: number) => Math.round((value / total) * 100)

    return [
      { title: 'TAMIR EDILENLER', count: repaired, note: `%${toPct(repaired)} Tamir Edildi`, icon: CheckCircle2, className: 'bg-emerald-600' },
      { title: 'TAMIRDE OLANLAR', count: repairing, note: `%${toPct(repairing)} Tamiri Devam Etmekte`, icon: Wrench, className: 'bg-amber-500' },
      { title: 'ISLEME ALINACAKLAR', count: waiting, note: `%${toPct(waiting)} Isleme Alinmadi`, icon: FolderOpen, className: 'bg-slate-900' },
      { title: 'IPTAL IADE', count: cancelled, note: `%${toPct(cancelled)} Iptal Iade`, icon: XCircle, className: 'bg-red-500' },
    ]
  }, [rows])

  const totalCount = useMemo(() => topCards.reduce((sum, item) => sum + item.count, 0), [topCards])

  const toggleRepairState = async (row: ServiceRow) => {
    try {
      setStatusUpdatingId(row.id)
      const shouldClose = !row.isClosed
      const response = await fetch(`/api/repairs/${row.id}`, {
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
      await fetchRows()
    } catch (error) {
      console.error('Failed to toggle repair status', error)
      toast.error('Durum guncellenemedi')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleDispatch = (row: ServiceRow) => {
    router.push('/dashboard/cargo')
    toast.info(`Sevk icin Kargo Takibi acildi (${row.ticketNo})`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <h1 className="text-xl font-bold tracking-tight">Servis Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user?.name ? `${user.name} icin genel ozet` : 'Genel durum ozeti'} - Toplam {totalCount} aktif kayit
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <div key={card.title} className={`${card.className} rounded-md p-3 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">{card.title}</p>
                <p className="text-2xl font-extrabold">{card.count} ADET</p>
              </div>
              <card.icon className="h-7 w-7 opacity-95" />
            </div>
            <div className="mt-2 border-t border-white/30 pt-2 text-xs font-medium">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {secondCards.map((card) => (
          <div key={card.title} className={`${card.className} rounded-md p-3 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">{card.title}</p>
                <p className="text-2xl font-extrabold">{card.count} ADET</p>
              </div>
              <card.icon className="h-7 w-7 opacity-95" />
            </div>
            <div className="mt-2 border-t border-white/30 pt-2 text-xs font-medium">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-white p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {actionTiles.map((item) => (
            <Button key={item.label} variant="outline" size="sm" className="h-9 gap-2 bg-slate-50">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {typeof item.count === 'number' ? <Badge variant="secondary">{item.count} ADET</Badge> : null}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] border-collapse text-sm">
            <thead>
              <tr className="bg-amber-50 text-left">
                <th className="px-3 py-2 font-semibold">TICKET</th>
                <th className="px-3 py-2 font-semibold">MUSTERI</th>
                <th className="px-3 py-2 font-semibold">URUN GRUBU</th>
                <th className="px-3 py-2 font-semibold">MARKA</th>
                <th className="px-3 py-2 font-semibold">MODEL</th>
                <th className="px-3 py-2 font-semibold">ALIS TARIHI</th>
                <th className="px-3 py-2 font-semibold">TESLIM TARIHI</th>
                <th className="px-3 py-2 font-semibold">SERVIS</th>
                <th className="px-3 py-2 font-semibold">UCRET</th>
                <th className="px-3 py-2 font-semibold">DURUM</th>
                <th className="px-3 py-2 font-semibold">ACILIYET</th>
                <th className="px-3 py-2 font-semibold">ISLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {loadingRows ? (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={12}>
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yukleniyor...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={12}>
                    Kayit bulunamadi
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className={`border-t hover:bg-slate-50 ${row.isClosed ? 'bg-slate-100/80 text-slate-600' : ''}`}>
                    <td className="px-3 py-2 font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{row.ticketNo}</span>
                        {row.isClosed ? (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Kapali
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge className="bg-indigo-600 text-white">{row.customer}</Badge>
                    </td>
                    <td className="px-3 py-2">{row.productGroup}</td>
                    <td className="px-3 py-2">{row.brand}</td>
                    <td className="px-3 py-2">{row.model}</td>
                    <td className="px-3 py-2">{row.purchaseDate}</td>
                    <td className="px-3 py-2">{row.deliveryDate}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{row.serviceType}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{row.feeText}</td>
                    <td className="px-3 py-2">
                      <Badge className={statusClass(row.status)}>{statusText(row.status)}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={priorityClass(row.priority)}>{priorityText(row.priority)}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            Islemler
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/repairs/${row.id}`)}>
                            Duzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={statusUpdatingId === row.id}
                            onClick={() => toggleRepairState(row)}
                          >
                            {statusUpdatingId === row.id ? 'Bekleyin...' : (row.isClosed ? 'Ac' : 'Kapat')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDispatch(row)}>
                            Sevk Et
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
