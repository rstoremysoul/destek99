'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface InstallationFormProps {
  onSubmit?: (data: InstallationFormData) => void
  onCancel?: () => void
  initialData?: Partial<InstallationFormData>
}

export interface InstallationFormData {
  formNumber: string
  companyName: string
  customerName: string
  requestDate?: Date
  plannedInstallDate?: Date
  status: 'received' | 'preparing' | 'ready' | 'installing' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  installationAddress: string
  contactPerson: string
  contactPhone: string
  notes?: string
  technicianName?: string
}

export function InstallationForm({ onSubmit, onCancel, initialData }: InstallationFormProps) {
  const [formData, setFormData] = useState<InstallationFormData>({
    formNumber: '',
    companyName: '',
    customerName: '',
    status: 'received',
    priority: 'medium',
    installationAddress: '',
    contactPerson: '',
    contactPhone: '',
    ...initialData
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }

      // Reset form
      setFormData({
        formNumber: '',
        companyName: '',
        customerName: '',
        status: 'received',
        priority: 'medium',
        installationAddress: '',
        contactPerson: '',
        contactPhone: '',
      })
    } catch (error) {
      console.error('Error saving installation form:', error)
      alert('Form kaydedilirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InstallationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateSelect = (field: keyof InstallationFormData, date: Date | undefined) => {
    handleInputChange(field, date)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Kurulum Formu</CardTitle>
        <CardDescription>
          Kurulum bilgilerini girin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol Kolon */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formNumber">Form Numarası *</Label>
                <Input
                  id="formNumber"
                  value={formData.formNumber}
                  onChange={(e) => handleInputChange('formNumber', e.target.value)}
                  placeholder="KF-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Firma Adı *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Firma adını girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">İletişim Kişisi *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="İletişim kişisinin adı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">İletişim Telefonu *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="0555 555 55 55"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Talep Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.requestDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.requestDate ? (
                        format(formData.requestDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={formData.requestDate ? format(formData.requestDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleDateSelect('requestDate', date)
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Planlanan Kurulum Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.plannedInstallDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.plannedInstallDate ? (
                        format(formData.plannedInstallDate, "PPP", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Input
                        type="date"
                        value={formData.plannedInstallDate ? format(formData.plannedInstallDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined
                          handleDateSelect('plannedInstallDate', date)
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Alındı</SelectItem>
                    <SelectItem value="preparing">Hazırlanıyor</SelectItem>
                    <SelectItem value="ready">Hazır</SelectItem>
                    <SelectItem value="installing">Kuruluyor</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicianName">Teknisyen</Label>
                <Select
                  value={formData.technicianName || ''}
                  onValueChange={(value) => handleInputChange('technicianName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Teknisyen seçin" />
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

              <div className="space-y-2">
                <Label htmlFor="installationAddress">Kurulum Adresi *</Label>
                <Textarea
                  id="installationAddress"
                  value={formData.installationAddress}
                  onChange={(e) => handleInputChange('installationAddress', e.target.value)}
                  placeholder="Kurulum adresini girin"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ek notlar..."
                  rows={4}
                />
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
              disabled={loading || !formData.formNumber || !formData.companyName || !formData.customerName || !formData.contactPerson || !formData.contactPhone || !formData.installationAddress}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
