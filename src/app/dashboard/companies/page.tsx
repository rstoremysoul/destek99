'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function CompaniesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Firmalar</h2>
                    <p className="text-muted-foreground">
                        Firma listesi ve yönetimi
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Firma Listesi
                    </CardTitle>
                    <CardDescription>
                        Sistemde kayıtlı firmalar burada listelenecek.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                        Henüz firma kaydı bulunmamaktadır.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
