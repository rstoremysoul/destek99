'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Settings, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'

interface AnalyticsData {
  totalRecords: number
  completedRecords: number
  ongoingRecords: number
  thisMonthRecords: number
  deviceTypes: { name: string; count: number }[]
  businesses: { name: string; count: number }[]
  monthlyTrend: { month: string; count: number }[]
  technicianPerformance: { name: string; count: number }[]
  averageResolutionDays: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

export default function TechnicalServiceAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/technical-service/analytics')
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Analitikler yükleniyor...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Veriler yüklenirken hata oluştu.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Teknik Servis Analitiği</h1>
        <p className="text-muted-foreground">
          Teknik servis operasyonlarınızın detaylı analizi ve istatistikleri.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              Tüm teknik servis kayıtları
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedRecords}</div>
            <p className="text-xs text-muted-foreground">
              %{((data.completedRecords / data.totalRecords) * 100).toFixed(1)} başarı oranı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.ongoingRecords}</div>
            <p className="text-xs text-muted-foreground">
              Henüz tamamlanmamış
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thisMonthRecords}</div>
            <p className="text-xs text-muted-foreground">
              Bu ayki kayıtlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ortalama Çözüm Süresi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.averageResolutionDays}</div>
            <p className="text-sm text-muted-foreground">gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Aktif Tekniker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.technicianPerformance.length}</div>
            <p className="text-sm text-muted-foreground">kişi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              En Çok Cihaz Türü
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.deviceTypes[0]?.name || 'Veri yok'}</div>
            <p className="text-sm text-muted-foreground">
              {data.deviceTypes[0]?.count || 0} kayıt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Aylık Trend</CardTitle>
            <CardDescription>Son 6 ayın kayıt dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cihaz Türü Dağılımı</CardTitle>
            <CardDescription>En çok servis edilen cihazlar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.deviceTypes.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.deviceTypes.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Businesses */}
        <Card>
          <CardHeader>
            <CardTitle>En Aktif İşletmeler</CardTitle>
            <CardDescription>En çok servis alan işletmeler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.businesses.slice(0, 8).map((business, index) => (
                <div key={business.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{business.name}</span>
                  </div>
                  <Badge variant="secondary">{business.count} kayıt</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Tekniker Performansı</CardTitle>
            <CardDescription>Tekniker başına iş yükü</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.technicianPerformance.slice(0, 8).map((tech, index) => (
                <div key={tech.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{tech.name}</span>
                  </div>
                  <Badge variant="outline">{tech.count} iş</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}