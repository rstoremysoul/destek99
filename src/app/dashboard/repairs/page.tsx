'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { mockDeviceRepairs } from '@/lib/hardware-mock-data'
import { DeviceRepair } from '@/types'
import { Plus, Search, Filter, Wrench, Calendar, User, Building2, DollarSign, Shield } from 'lucide-react'

export default function RepairsPage() {
  const [repairs] = useState<DeviceRepair[]>(mockDeviceRepairs)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const filteredRepairs = repairs.filter(repair =>
    repair.repairNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
      case 'diagnosing':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
      case 'waiting_parts':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
      case 'repairing':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
      case 'testing':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
      case 'unrepairable':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
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
      case 'urgent':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
      case 'medium':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
      case 'low':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-400/30'
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-400/30'
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

  const stats = {
    total: repairs.length,
    received: repairs.filter(r => r.status === 'received').length,
    repairing: repairs.filter(r => r.status === 'repairing').length,
    completed: repairs.filter(r => r.status === 'completed').length,
    warranty: repairs.filter(r => r.isWarranty).length,
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Cihaz Tamiri</h1>
            <p className="text-purple-100 text-lg">
              Arızalı cihazları takip edin ve tamir süreçlerini yönetin
            </p>
          </div>
          <Button className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <Plus className="mr-2 h-5 w-5" />
            Yeni Tamir
          </Button>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Toplam</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Alınan</p>
              <p className="text-3xl font-bold text-blue-900">{stats.received}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Tamir Edilen</p>
              <p className="text-3xl font-bold text-purple-900">{stats.repairing}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Tamamlanan</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.completed}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">Garanti</p>
              <p className="text-3xl font-bold text-amber-900">{stats.warranty}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tamir Listesi */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tamir Listesi</h2>
              <p className="text-slate-600 mt-1">
                Tüm tamir süreçlerini takip edin
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Tamir numarası, cihaz adı, firma veya seri no ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-slate-200/50 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl shadow-sm"
              />
            </div>
            <Button 
              variant="outline"
              className="h-12 px-6 bg-white/80 border-slate-200/50 hover:bg-slate-50 rounded-xl shadow-sm"
            >
              <Filter className="mr-2 h-5 w-5" />
              Filtrele
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid gap-6">
            {filteredRepairs.map((repair) => (
              <Card key={repair.id} className="hover:shadow-lg transition-all duration-200 border-slate-200/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                        <Wrench className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{repair.repairNumber}</h3>
                        <p className="text-sm text-slate-600">
                          {repair.deviceName} - {repair.model}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          S/N: {repair.serialNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getStatusColor(repair.status)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                        {getStatusText(repair.status)}
                      </Badge>
                      <Badge className={`${getPriorityColor(repair.priority)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                        {getPriorityText(repair.priority)}
                      </Badge>
                      {repair.isWarranty && (
                        <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1.5 text-xs font-semibold rounded-full border-0">
                          Garanti
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{repair.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>{repair.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>Alınma: {formatDate(repair.receivedDate)}</span>
                    </div>
                    {repair.repairCost && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-500" />
                        <span>₺{repair.repairCost}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-700">
                      <strong>Sorun:</strong> {repair.problemDescription}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      Teknisyen: {repair.technicianName || 'Atanmamış'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/repairs/${repair.id}`)}
                      className="bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 rounded-full px-6"
                    >
                      Detaylar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRepairs.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 mx-auto max-w-md">
                <div className="text-slate-400 mb-4">
                  <Wrench className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Tamir kaydı bulunamadı</h3>
                <p className="text-slate-500 text-sm">Filtreleri kontrol edin veya yeni tamir kaydı oluşturun</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}