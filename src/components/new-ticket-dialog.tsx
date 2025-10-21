'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SupportTicket } from '@/types'
import { mockCompanies, mockCustomers } from '@/lib/mock-data'
import { useAuth } from '@/hooks/useAuth'

interface NewTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketCreate: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'images'>) => void
}

export function NewTicketDialog({ open, onOpenChange, onTicketCreate }: NewTicketDialogProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as SupportTicket['priority'],
    customerId: '',
    companyId: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.subject || !formData.description || !formData.customerId || !formData.companyId) {
      return
    }

    setLoading(true)

    try {
      const customer = mockCustomers.find(c => c.id === formData.customerId)
      const company = mockCompanies.find(c => c.id === formData.companyId)

      if (!customer || !company) {
        throw new Error('Müşteri veya firma bulunamadı')
      }

      const newTicketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'images'> = {
        subject: formData.subject,
        description: formData.description,
        status: 'open',
        priority: formData.priority,
        assignedTo: user.id,
        customerId: formData.customerId,
        companyId: formData.companyId,
        customerName: customer.name,
        companyName: company.name,
        location: {
          lat: 41.0082,
          lng: 28.9784,
          address: company.address
        }
      }

      onTicketCreate(newTicketData)
      
      // Form'u temizle
      setFormData({
        subject: '',
        description: '',
        priority: 'medium',
        customerId: '',
        companyId: ''
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Ticket oluşturma hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    setFormData(prev => ({
      ...prev,
      companyId,
      customerId: '' // Firma değiştiğinde müşteriyi sıfırla
    }))
  }

  const availableCustomers = formData.companyId 
    ? mockCustomers.filter(customer => customer.companyId === formData.companyId)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Destek Talebi</DialogTitle>
          <DialogDescription>
            Yeni bir destek talebi oluşturun. Tüm alanları doldurmak zorunludur.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Konu *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Sorunun kısa açıklaması"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Sorunun detaylı açıklaması"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: SupportTicket['priority']) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Firma *</Label>
              <Select 
                value={formData.companyId} 
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  {mockCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Müşteri *</Label>
            <Select 
              value={formData.customerId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
              disabled={!formData.companyId}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.companyId ? "Müşteri seçin" : "Önce firma seçin"} />
              </SelectTrigger>
              <SelectContent>
                {availableCustomers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.subject || !formData.description || !formData.customerId}
            >
              {loading ? 'Oluşturuluyor...' : 'Ticket Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}