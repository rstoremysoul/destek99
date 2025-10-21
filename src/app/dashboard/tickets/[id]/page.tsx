'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTickets } from '@/contexts/TicketContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Camera,
  Plus,
  Save,
  Edit
} from 'lucide-react'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { getTicketById, updateTicketStatus, updateTicketPriority, addNoteToTicket } = useTickets()
  const [newNote, setNewNote] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)
  const [tempStatus, setTempStatus] = useState('')
  const [tempPriority, setTempPriority] = useState('')

  const ticket = getTicketById(params.id as string)

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket bulunamadı</h2>
          <p className="text-gray-600 mb-4">Belirtilen ticket mevcut değil.</p>
          <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Açık'
      case 'in-progress': return 'Devam Ediyor'
      case 'resolved': return 'Çözüldü'
      case 'closed': return 'Kapalı'
      default: return status
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
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !user) return
    
    addNoteToTicket(ticket.id, newNote, user.id, user.name)
    setNewNote('')
  }

  const handleStatusUpdate = () => {
    if (tempStatus && tempStatus !== ticket.status) {
      updateTicketStatus(ticket.id, tempStatus as any)
    }
    if (tempPriority && tempPriority !== ticket.priority) {
      updateTicketPriority(ticket.id, tempPriority as any)
    }
    setEditingStatus(false)
  }

  const handleEditStart = () => {
    setTempStatus(ticket.status)
    setTempPriority(ticket.priority)
    setEditingStatus(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ticket #{ticket.id}
          </h1>
          <p className="text-muted-foreground">
            {ticket.subject}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Ana İçerik */}
        <div className="md:col-span-2 space-y-6">
          {/* Ticket Bilgileri */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Detayları</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {getPriorityText(ticket.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Açıklama</h4>
                <p className="text-gray-700 whitespace-pre-line">
                  {ticket.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Oluşturulma: {formatDate(ticket.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Güncelleme: {formatDate(ticket.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle>Notlar ve Güncellemeler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{note.authorName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              ))}

              {ticket.notes.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Henüz not bulunmuyor
                </p>
              )}

              <Separator />

              {/* Yeni Not Ekleme */}
              <div className="space-y-3">
                <h4 className="font-medium">Yeni Not Ekle</h4>
                <Textarea
                  placeholder="Not yazın..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Not Ekle
                  </Button>
                  <Button variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Fotoğraf Ekle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yan Panel */}
        <div className="space-y-6">
          {/* Durum Yönetimi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Durum Yönetimi
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingStatus ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Durum</label>
                    <Select value={tempStatus} onValueChange={setTempStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Açık</SelectItem>
                        <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                        <SelectItem value="resolved">Çözüldü</SelectItem>
                        <SelectItem value="closed">Kapalı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Öncelik</label>
                    <Select value={tempPriority} onValueChange={setTempPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Acil</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleStatusUpdate}>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingStatus(false)}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Durum:</span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusText(ticket.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Öncelik:</span>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {getPriorityText(ticket.priority)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Müşteri Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{ticket.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>{ticket.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-blue-600">
                  info@{ticket.companyName.toLowerCase().replace(/\s+/g, '')}.com
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">+90 212 555 0001</span>
              </div>
              {ticket.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{ticket.location.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}