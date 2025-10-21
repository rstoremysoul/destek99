'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { mockCargoTrackings } from '@/lib/hardware-mock-data'
import { CargoTracking } from '@/types'
import { Plus, Search, Filter, Truck, Package, ArrowUp, ArrowDown, MapPin, Calendar } from 'lucide-react'

export default function CargoPage() {
  const [cargos] = useState<CargoTracking[]>(mockCargoTrackings)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const filteredCargos = cargos.filter(cargo =>
    cargo.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.receiver.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
      case 'delivered':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
      case 'returned':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
      case 'lost':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
      case 'damaged':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  const stats = {
    total: cargos.length,
    incoming: cargos.filter(c => c.type === 'incoming').length,
    outgoing: cargos.filter(c => c.type === 'outgoing').length,
    inTransit: cargos.filter(c => c.status === 'in_transit').length,
    delivered: cargos.filter(c => c.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Kargo Takibi</h1>
            <p className="text-blue-100 text-lg">
              Gelen ve giden kargoları takip edin
            </p>
          </div>
          <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <Plus className="mr-2 h-5 w-5" />
            Yeni Kargo
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
              <Truck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Gelen</p>
              <p className="text-3xl font-bold text-green-900">{stats.incoming}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full">
              <ArrowDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Giden</p>
              <p className="text-3xl font-bold text-orange-900">{stats.outgoing}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full">
              <ArrowUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Yolda</p>
              <p className="text-3xl font-bold text-blue-900">{stats.inTransit}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full">
              <Truck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Teslim Edilen</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.delivered}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Kargo Listesi */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Kargo Listesi</h2>
              <p className="text-slate-600 mt-1">
                Tüm kargo gönderimlerini takip edin
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Takip numarası, gönderen veya alıcı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-slate-200/50 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl shadow-sm"
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
            {filteredCargos.map((cargo) => (
              <Card key={cargo.id} className="hover:shadow-lg transition-all duration-200 border-slate-200/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${cargo.type === 'incoming' ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-orange-100 to-red-100'}`}>
                        {cargo.type === 'incoming' ? (
                          <ArrowDown className="h-6 w-6 text-green-600" />
                        ) : (
                          <ArrowUp className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{cargo.trackingNumber}</h3>
                        <p className="text-sm text-slate-600">
                          {cargo.cargoCompany} - {cargo.devices.length} cihaz
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getStatusColor(cargo.status)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                        {getStatusText(cargo.status)}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-3 py-1.5 text-xs font-semibold rounded-full border-0">
                        {cargo.type === 'incoming' ? 'Gelen' : 'Giden'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-slate-500" />
                      <span><strong>Gönderen:</strong> {cargo.sender}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-slate-500" />
                      <span><strong>Alıcı:</strong> {cargo.receiver}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span><strong>Hedef:</strong> {getDestinationText(cargo.destination)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>
                        {cargo.sentDate ? formatDate(cargo.sentDate) : 'Gönderilmedi'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">
                      <strong>Cihazlar:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cargo.devices.slice(0, 3).map((device) => (
                        <span key={device.id} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                          {device.deviceName} ({device.quantity}x)
                        </span>
                      ))}
                      {cargo.devices.length > 3 && (
                        <span className="text-slate-500 text-xs">
                          +{cargo.devices.length - 3} daha...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      {cargo.deliveredDate 
                        ? `Teslim: ${formatDate(cargo.deliveredDate)}`
                        : 'Henüz teslim edilmedi'
                      }
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/cargo/${cargo.id}`)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 rounded-full px-6"
                    >
                      Detaylar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCargos.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 mx-auto max-w-md">
                <div className="text-slate-400 mb-4">
                  <Truck className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Kargo bulunamadı</h3>
                <p className="text-slate-500 text-sm">Filtreleri kontrol edin veya yeni kargo ekleyin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}