'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { mockInstallationForms } from '@/lib/hardware-mock-data'
import { InstallationForm } from '@/types'
import { InstallationForm as InstallationFormComponent } from '@/components/installation-form'
import { Plus, Search, Filter, Package, Calendar, User, Building2, MapPin } from 'lucide-react'

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<InstallationForm[]>(mockInstallationForms)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const router = useRouter()

  const handleFormSubmit = async (formData: any) => {
    try {
      // Yeni form ekle
      const newInstallation: InstallationForm = {
        id: `inst-${Date.now()}`,
        formNumber: formData.formNumber,
        companyId: `comp-${Date.now()}`,
        companyName: formData.companyName,
        customerId: `cust-${Date.now()}`,
        customerName: formData.customerName,
        requestDate: formData.requestDate || new Date(),
        plannedInstallDate: formData.plannedInstallDate || new Date(),
        status: formData.status,
        priority: formData.priority,
        devices: [],
        installationAddress: formData.installationAddress,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        notes: formData.notes || '',
        technicianName: formData.technicianName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setInstallations(prev => [newInstallation, ...prev])
      setShowNewForm(false)
      alert('Kurulum formu başarıyla oluşturuldu!')
    } catch (error) {
      console.error('Error saving installation form:', error)
      alert('Form kaydedilirken hata oluştu.')
    }
  }

  const filteredInstallations = installations.filter(installation =>
    installation.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installation.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installation.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
      case 'preparing':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
      case 'ready':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
      case 'installing':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
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
    total: installations.length,
    received: installations.filter(i => i.status === 'received').length,
    preparing: installations.filter(i => i.status === 'preparing').length,
    installing: installations.filter(i => i.status === 'installing').length,
    completed: installations.filter(i => i.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Kurulum Formları</h1>
            <p className="text-green-100 text-lg">
              Cihaz kurulum formlarını takip edin ve yönetin
            </p>
          </div>
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            Yeni Form
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
              <Package className="h-6 w-6 text-white" />
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
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">Hazırlanan</p>
              <p className="text-3xl font-bold text-amber-900">{stats.preparing}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Kurulan</p>
              <p className="text-3xl font-bold text-purple-900">{stats.installing}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full">
              <Package className="h-6 w-6 text-white" />
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
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Listesi */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Kurulum Formları</h2>
              <p className="text-slate-600 mt-1">
                Kurulum formlarını arayın ve filtreleyin
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Form numarası, firma veya müşteri adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-slate-200/50 focus:border-green-400 focus:ring-green-400/20 rounded-xl shadow-sm"
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
            {filteredInstallations.map((installation) => (
              <Card key={installation.id} className="hover:shadow-lg transition-all duration-200 border-slate-200/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                        <Package className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{installation.formNumber}</h3>
                        <p className="text-sm text-slate-600">
                          {installation.devices.length} cihaz
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getStatusColor(installation.status)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                        {getStatusText(installation.status)}
                      </Badge>
                      <Badge className={`${getPriorityColor(installation.priority)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                        {getPriorityText(installation.priority)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{installation.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>{installation.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>Planlanan: {formatDate(installation.plannedInstallDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="truncate">{installation.installationAddress}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      Teknisyen: {installation.technicianName || 'Atanmamış'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/installations/${installation.id}`)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 rounded-full px-6"
                    >
                      Detaylar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInstallations.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 mx-auto max-w-md">
                <div className="text-slate-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Kurulum formu bulunamadı</h3>
                <p className="text-slate-500 text-sm">Filtreleri kontrol edin veya yeni form oluşturun</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Form Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kurulum Formu</DialogTitle>
            <DialogDescription>
              Kurulum bilgilerini girerek yeni form oluşturun
            </DialogDescription>
          </DialogHeader>
          <InstallationFormComponent
            onSubmit={handleFormSubmit}
            onCancel={() => setShowNewForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}