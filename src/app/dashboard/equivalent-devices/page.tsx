'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EquivalentDevice } from '@/types'
import { Plus, Search, Eye, Package, CheckCircle, Wrench, Box } from 'lucide-react'
import { EquivalentDeviceFormDialog } from '@/components/equivalent-device-form-dialog'

export default function EquivalentDevicesPage() {
  const [devices, setDevices] = useState<EquivalentDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  const recordsPerPage = 20

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/equivalent-devices')
      if (response.ok) {
        const data = await response.json()
        const mappedData = data.map((item: any) => ({
          id: item.id,
          deviceNumber: item.deviceNumber,
          deviceName: item.deviceName,
          brand: item.brand,
          model: item.model,
          serialNumber: item.serialNumber,
          currentLocation: item.currentLocation.toLowerCase(),
          status: item.status.toLowerCase(),
          assignedToId: item.assignedToId,
          assignedTo: item.assignedTo,
          assignedDate: item.assignedDate ? new Date(item.assignedDate) : undefined,
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
          warrantyEnd: item.warrantyEnd ? new Date(item.warrantyEnd) : undefined,
          condition: item.condition.toLowerCase(),
          images: item.images,
          notes: item.notes,
          createdBy: item.createdBy,
          createdByName: item.createdByName,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }))
        setDevices(mappedData)
      }
    } catch (error) {
      console.error('Error fetching equivalent devices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Benzersiz marka listesi
  const uniqueBrands = Array.from(new Set(devices.map(d => d.brand))).sort()

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.deviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.assignedTo && device.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesCondition = conditionFilter === 'all' || device.condition === conditionFilter
    const matchesBrand = brandFilter === 'all' || device.brand === brandFilter
    const matchesLocation = locationFilter === 'all' || device.currentLocation === locationFilter

    return matchesSearch && matchesStatus && matchesCondition && matchesBrand && matchesLocation
  })

  const totalPages = Math.ceil(filteredDevices.length / recordsPerPage)
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default'
      case 'in_use': return 'secondary'
      case 'in_maintenance': return 'secondary'
      case 'reserved': return 'default'
      case 'retired': return 'destructive'
      case 'passive': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Müsait'
      case 'in_use': return 'Kullanımda'
      case 'in_maintenance': return 'Bakımda'
      case 'reserved': return 'Rezerve'
      case 'retired': return 'Emekli'
      case 'passive': return 'Pasif'
      default: return status
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'default'
      case 'excellent': return 'default'
      case 'good': return 'secondary'
      case 'fair': return 'secondary'
      case 'poor': return 'destructive'
      default: return 'outline'
    }
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Yeni'
      case 'excellent': return 'Mükemmel'
      case 'good': return 'İyi'
      case 'fair': return 'Orta'
      case 'poor': return 'Zayıf'
      default: return condition
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleNewDevice = async (deviceData: Partial<EquivalentDevice>) => {
    try {
      const response = await fetch('/api/equivalent-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      })

      if (response.ok) {
        fetchDevices()
      } else {
        console.error('Failed to create device')
      }
    } catch (error) {
      console.error('Error creating device:', error)
    }
  }

  const stats = {
    total: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    inUse: devices.filter(d => d.status === 'in_use').length,
    inMaintenance: devices.filter(d => d.status === 'in_maintenance').length,
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
        <h1 className="text-3xl font-bold tracking-tight">Muadil Cihazlar</h1>
        <p className="text-muted-foreground">
          Tüm muadil cihazları yönetin ve takip edin.
        </p>
      </div>

      {/* Arama ve Filtreler */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cihaz no, marka, model, seri no, konum veya atanan kişi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Cihaz
          </Button>
        </div>

        {/* Filtre Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Marka Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Markalar</SelectItem>
              {uniqueBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Muadil Konum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Konumlar</SelectItem>
              <SelectItem value="in_warehouse">Depoda</SelectItem>
              <SelectItem value="on_site_service">Yerinde Serviste</SelectItem>
              <SelectItem value="at_customer">Müşteride</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Durum Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="available">Müsait</SelectItem>
              <SelectItem value="in_use">Kullanımda</SelectItem>
              <SelectItem value="in_maintenance">Bakımda</SelectItem>
              <SelectItem value="reserved">Rezerve</SelectItem>
              <SelectItem value="retired">Emekli</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Kondisyon Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kondisyonlar</SelectItem>
              <SelectItem value="new">Yeni</SelectItem>
              <SelectItem value="excellent">Mükemmel</SelectItem>
              <SelectItem value="good">İyi</SelectItem>
              <SelectItem value="fair">Orta</SelectItem>
              <SelectItem value="poor">Zayıf</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aktif Filtreler */}
        {(brandFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all' || conditionFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktif Filtreler:</span>
            {brandFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setBrandFilter('all')}>
                Marka: {brandFilter} ✕
              </Badge>
            )}
            {locationFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setLocationFilter('all')}>
                Konum: {
                  locationFilter === 'in_warehouse' ? 'Depoda' :
                  locationFilter === 'on_site_service' ? 'Yerinde Serviste' :
                  'Müşteride'
                } ✕
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                Durum: {getStatusText(statusFilter)} ✕
              </Badge>
            )}
            {conditionFilter !== 'all' && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => setConditionFilter('all')}>
                Kondisyon: {getConditionText(conditionFilter)} ✕
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBrandFilter('all')
                setLocationFilter('all')
                setStatusFilter('all')
                setConditionFilter('all')
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
              <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tüm muadil cihazlar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Müsait</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.available}</div>
              <p className="text-xs text-muted-foreground">
                Kullanıma hazır
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kullanımda</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inUse}</div>
              <p className="text-xs text-muted-foreground">
                Aktif kullanımda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bakımda</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inMaintenance}</div>
              <p className="text-xs text-muted-foreground">
                Bakım sürecinde
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Cihaz Listesi</CardTitle>
          <CardDescription>
            Toplam {filteredDevices.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cihaz No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cihaz Adı</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Marka</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Model</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seri No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Muadil Konum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kondisyon</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Atanan Lokasyon</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDevices.map((device) => (
                  <tr key={device.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {device.deviceNumber}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(device.deviceName, 20)}
                    </td>
                    <td className="p-4 align-middle">
                      {device.brand}
                    </td>
                    <td className="p-4 align-middle">
                      {truncateText(device.model, 15)}
                    </td>
                    <td className="p-4 align-middle font-mono text-sm">
                      {device.serialNumber}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={
                        device.currentLocation === 'in_warehouse' ? 'default' :
                        device.currentLocation === 'on_site_service' ? 'secondary' :
                        'outline'
                      } className={
                        device.currentLocation === 'in_warehouse' ? 'bg-green-100 text-green-800' :
                        device.currentLocation === 'on_site_service' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }>
                        {device.currentLocation === 'in_warehouse' ? 'Depoda' :
                         device.currentLocation === 'on_site_service' ? 'Yerinde Serviste' :
                         'Müşteride'}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getStatusColor(device.status)}>
                        {getStatusText(device.status)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getConditionColor(device.condition)}>
                        {getConditionText(device.condition)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {device.assignedTo ? truncateText(device.assignedTo.name, 20) : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/equivalent-devices/${device.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedDevices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Kayıt bulunamadı</p>
              </div>
            )}

            {/* Sayfalama */}
            {filteredDevices.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {paginatedDevices.length} kayıt gösteriliyor (toplam {filteredDevices.length})
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
      <EquivalentDeviceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleNewDevice}
      />
    </div>
  )
}

