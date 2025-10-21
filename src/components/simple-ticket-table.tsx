'use client'

import { SupportTicket } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Ticket } from 'lucide-react'

interface SimpleTicketTableProps {
  tickets: SupportTicket[]
  onTicketView?: (ticket: SupportTicket) => void
}

export function SimpleTicketTable({ tickets, onTicketView }: SimpleTicketTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
      case 'in-progress':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
      case 'resolved':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
      case 'closed':
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
      case 'medium':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
      case 'low':
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-400/30'
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-400/30'
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
    return new Intl.DateTimeFormat('tr-TR').format(date)
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse bg-transparent">
        <thead>
          <tr className="border-b-2 border-slate-200/50">
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Konu</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Durum</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Öncelik</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Müşteri</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Firma</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Oluşturma</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/30">
          {tickets.map((ticket, index) => (
            <tr 
              key={ticket.id} 
              className={`hover:bg-slate-50/50 transition-colors duration-200 ${
                index % 2 === 0 ? 'bg-white/60' : 'bg-slate-50/30'
              }`}
            >
              <td className="px-6 py-5 text-sm font-mono font-semibold text-slate-900 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-l-lg">
                {ticket.id}
              </td>
              <td className="px-6 py-5 text-sm text-slate-900 max-w-xs">
                <div className="truncate font-medium" title={ticket.subject}>
                  {ticket.subject}
                </div>
              </td>
              <td className="px-6 py-5">
                <Badge className={`${getStatusColor(ticket.status)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                  {getStatusText(ticket.status)}
                </Badge>
              </td>
              <td className="px-6 py-5">
                <Badge className={`${getPriorityColor(ticket.priority)} px-3 py-1.5 text-xs font-semibold rounded-full border-0`}>
                  {getPriorityText(ticket.priority)}
                </Badge>
              </td>
              <td className="px-6 py-5 text-sm font-medium text-slate-900">{ticket.customerName}</td>
              <td className="px-6 py-5 text-sm font-medium text-slate-900">{ticket.companyName}</td>
              <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                {formatDate(ticket.createdAt)}
              </td>
              <td className="px-6 py-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTicketView?.(ticket)}
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 border-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {tickets.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 mx-auto max-w-md">
            <div className="text-slate-400 mb-4">
              <Ticket className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Hiç ticket bulunamadı</h3>
            <p className="text-slate-500 text-sm">Filtreleri kontrol edin veya yeni ticket oluşturun</p>
          </div>
        </div>
      )}
    </div>
  )
}