'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Building2
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Toplam Ticket',
      value: '24',
      icon: Ticket,
      color: 'text-blue-600'
    },
    {
      title: 'Bekleyen',
      value: '8',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Tamamlanan',
      value: '12',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Acil',
      value: '4',
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Modern Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Hoş geldiniz, {user?.name}! 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            Destek yönetim panelinize genel bir bakış
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
            <CardDescription>
              Bugün gerçekleşen son aktiviteler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Ticket #001 güncellendi</span>
              <span className="text-muted-foreground">2 dk önce</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Yeni ticket oluşturuldu</span>
              <span className="text-muted-foreground">15 dk önce</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Ticket #003 kapatıldı</span>
              <span className="text-muted-foreground">1 saat önce</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Hızlı Erişim
            </CardTitle>
            <CardDescription>
              Sık kullanılan işlemler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Ticket className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Yeni Ticket Oluştur</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm">Müşteri Listesi</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Building2 className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Firma Yönetimi</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}