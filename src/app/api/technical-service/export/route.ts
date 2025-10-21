import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const records = await db.technicalService.findMany({
      orderBy: {
        serviceEntryDate: 'desc'
      }
    })

    // Convert data to CSV format
    const headers = [
      'ID',
      'İşlem Yapan Personel',
      'Fatura Tarihi',
      'Marka',
      'İşletme Adı',
      'Cihazın Adı',
      'Model',
      'Cihaz Seri No',
      'Teknik Servise Giriş Tarihi',
      'Teknik Servisten Çıkış Tarihi',
      'Cihaz Sorunu',
      'Cihaz Sorun Açıklamaları',
      'Yapılan İşlem',
      'Teknik Servis Masrafı',
      'Bizim Müşteriye Söylediğimiz Masraf',
      'Onaylayan Kişi',
      'Connect Yazıldı mı',
      'Oluşturulma Tarihi',
      'Güncellenme Tarihi'
    ]

    const csvRows = [
      headers.join(';'),
      ...records.map(record => {
        const formatDate = (date: Date | null) =>
          date ? date.toLocaleDateString('tr-TR') : ''

        return [
          record.id,
          record.operatingPersonnel || '',
          formatDate(record.invoiceDate),
          record.brand || '',
          record.businessName || '',
          record.deviceName || '',
          record.model || '',
          record.deviceSerial || '',
          formatDate(record.serviceEntryDate),
          formatDate(record.serviceExitDate),
          record.deviceProblem || '',
          record.problemDescription || '',
          record.performedAction || '',
          record.serviceCost || '',
          record.customerCost || '',
          record.approvedBy || '',
          record.connectWritten || '',
          formatDate(record.createdAt),
          formatDate(record.updatedAt)
        ].map(field => `"${String(field).replace(/"/g, '""')}"`)
         .join(';')
      })
    ]

    const csvContent = csvRows.join('\n')

    // Add BOM for proper UTF-8 encoding
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="teknik-servis-kayitlari-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting records:', error)
    return NextResponse.json(
      { error: 'Failed to export records' },
      { status: 500 }
    )
  }
}