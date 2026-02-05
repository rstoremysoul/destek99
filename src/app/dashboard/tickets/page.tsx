'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TicketGrid } from '@/components/ticket-grid'
import { SimpleTicketTable } from '@/components/simple-ticket-table'
import { NewTicketDialog } from '@/components/new-ticket-dialog'
import { useTickets } from '@/contexts/TicketContext'
import { SupportTicket } from '@/types'
import { Plus, Search, Filter, Ticket, AlertCircle, Clock, CheckCircle } from 'lucide-react'

export default function TicketsPage() {
  const { tickets, createTicket } = useTickets()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const router = useRouter()


  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTicketView = (ticket: SupportTicket) => {
    router.push(`/dashboard/tickets/${ticket.id}`)
  }

  const handleTicketCreate = (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'images'>) => {
    const newTicket = createTicket(ticketData)
    router.push(`/dashboard/tickets/${newTicket.id}`)
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Destek Kayıtları</h1>
            <p className="text-indigo-100 text-lg">
              Tüm destek taleplerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button 
            onClick={() => setShowNewTicketDialog(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            Yeni Ticket
          </Button>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Modern İstatistik Kartları */}
      <div className="grid gap-6 md:grid-cols-5">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Toplam</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full">
              <Ticket className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Açık</p>
              <p className="text-3xl font-bold text-blue-900">{stats.open}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1">Devam Eden</p>
              <p className="text-3xl font-bold text-amber-900">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Çözüldü</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Kapalı</p>
              <p className="text-3xl font-bold text-gray-900">{stats.closed}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Arama ve Tablo Kartı */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Ticket Listesi</h2>
              <p className="text-slate-600 mt-1">
                Destek taleplerini arayın ve filtreleyin
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Ticket ID, konu, müşteri veya firma adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-slate-200/50 focus:border-indigo-400 focus:ring-indigo-400/20 rounded-xl shadow-sm"
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
          <SimpleTicketTable
            tickets={filteredTickets}
            onTicketView={handleTicketView}
          />
        </div>
      </div>

      <NewTicketDialog
        open={showNewTicketDialog}
        onOpenChange={setShowNewTicketDialog}
        onTicketCreate={handleTicketCreate}
      />
    </div>
  )
}
