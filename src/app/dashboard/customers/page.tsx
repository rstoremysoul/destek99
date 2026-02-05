'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Müşteriler</h2>
          <p className="text-muted-foreground">
            Müşteri listesi ve yönetimi
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Müşteri Listesi
          </CardTitle>
          <CardDescription>
            Sistemde kayıtlı müşteriler burada listelenecek.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
            Henüz müşteri kaydı bulunmamaktadır.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
