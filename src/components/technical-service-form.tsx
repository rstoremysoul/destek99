'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TechnicalServiceFormProps {
  onSubmit?: (data: TechnicalServiceFormData) => void
  onCancel?: () => void
  initialData?: Partial<TechnicalServiceFormData>
}

export interface TechnicalServiceFormData {
  operatingPersonnel?: string
  invoiceDate?: Date
  brand?: string
  businessName: string
  deviceName: string
  model?: string
  deviceSerial?: string
  serviceEntryDate?: Date
  serviceExitDate?: Date
  deviceProblem?: string
  problemDescription?: string
  performedAction?: string
  serviceCost?: string
  customerCost?: string
  approvedBy?: string
  connectWritten?: string
}

export function TechnicalServiceForm({ onSubmit, onCancel, initialData }: TechnicalServiceFormProps) {
  const [formData, setFormData] = useState<TechnicalServiceFormData>({
    businessName: '',
    deviceName: '',
    ...initialData
  })

  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.ok ? r.json() : [])
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((e) => console.error('Error fetching brands:', e))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      } else {
        const response = await fetch('/api/technical-service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to save record')
        }

        // Reset form
        setFormData({
          businessName: '',
          deviceName: '',
        })

        alert('Kayıt başarıyla oluşturuldu!')
      }
    } catch (error) {
      console.error('Error saving record:', error)
      alert('Kayıt oluşturulurken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TechnicalServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateSelect = (field: keyof TechnicalServiceFormData, date: Date | undefined) => {
    handleInputChange(field, date)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Teknik Servis Kaydı</CardTitle>
        <CardDescription>
          Cihazın teknik servis bilgilerini girin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol Kolon */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">İşletme Adı *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="İşletme adını girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Cihaz Adı *</Label>
                <Input
                  id="deviceName"
                  value={formData.deviceName}
                  onChange={(e) => handleInputChange('deviceName', e.target.value)}
                  placeholder="Cihaz adını girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marka</Label>
                <Select
                  value={formData.brand || ''}
                  onValueChange={(value) => handleInputChange('brand', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Marka seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Model bilgisini girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceSerial">Seri Numarası</Label>
                <Input
                  id="deviceSerial"
                  value={formData.deviceSerial || ''}
                  onChange={(e) => handleInputChange('deviceSerial', e.target.value)}
                  placeholder="Seri numarasını girin"
                />
              </div>

              <div className="space-y-2">
                <Label>Servise Giriş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.serviceEntryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.serviceEntryDate ? (
                        format(formData.serviceEntryDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={formData.serviceEntryDate ? format(formData.serviceEntryDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleDateSelect('serviceEntryDate', date)
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Servisten Çıkış Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.serviceExitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.serviceExitDate ? (
                        format(formData.serviceExitDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin (opsiyonel)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={formData.serviceExitDate ? format(formData.serviceExitDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleDateSelect('serviceExitDate', date)
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingPersonnel">Sorumlu Tekniker</Label>
                <Select
                  value={formData.operatingPersonnel || ''}
                  onValueChange={(value) => handleInputChange('operatingPersonnel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tekniker seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Metin">Metin</SelectItem>
                    <SelectItem value="Şeref">Şeref</SelectItem>
                    <SelectItem value="Oğuzhan">Oğuzhan</SelectItem>
                    <SelectItem value="Ali Ünlü">Ali Ünlü</SelectItem>
                    <SelectItem value="Leyla">Leyla</SelectItem>
                    <SelectItem value="Yüksel">Yüksel</SelectItem>
                    <SelectItem value="Adem">Adem</SelectItem>
                    <SelectItem value="Onur">Onur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceProblem">Cihaz Sorunu</Label>
                <Input
                  id="deviceProblem"
                  value={formData.deviceProblem || ''}
                  onChange={(e) => handleInputChange('deviceProblem', e.target.value)}
                  placeholder="Sorun özeti"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemDescription">Sorun Açıklaması</Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription || ''}
                  onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                  placeholder="Detaylı sorun açıklaması..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedAction">Yapılan İşlem</Label>
                <Textarea
                  id="performedAction"
                  value={formData.performedAction || ''}
                  onChange={(e) => handleInputChange('performedAction', e.target.value)}
                  placeholder="Yapılan tamiraat ve işlemler..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCost">Servis Maliyeti</Label>
                <Input
                  id="serviceCost"
                  value={formData.serviceCost || ''}
                  onChange={(e) => handleInputChange('serviceCost', e.target.value)}
                  placeholder="75USD+KDV"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerCost">Müşteri Fiyatı</Label>
                <Input
                  id="customerCost"
                  value={formData.customerCost || ''}
                  onChange={(e) => handleInputChange('customerCost', e.target.value)}
                  placeholder="75USD+KDV"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvedBy">Onaylayan Kişi</Label>
                <Input
                  id="approvedBy"
                  value={formData.approvedBy || ''}
                  onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                  placeholder="Onaylayan yetkili"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectWritten">Connect Yazıldı mı?</Label>
                <Select
                  value={formData.connectWritten || ''}
                  onValueChange={(value) => handleInputChange('connectWritten', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evet">Evet</SelectItem>
                    <SelectItem value="hayir">Hayır</SelectItem>
                    <SelectItem value="bekliyor">Bekliyor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fatura Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.invoiceDate ? (
                        format(formData.invoiceDate, "PPP", { locale: tr })
                      ) : (
                        <span>Fatura tarihi (opsiyonel)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={formData.invoiceDate ? format(formData.invoiceDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleDateSelect('invoiceDate', date)
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                İptal
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !formData.businessName || !formData.deviceName}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

