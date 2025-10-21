'use client'

import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { SupportTicket } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface TicketGridProps {
  tickets: SupportTicket[]
  onTicketView?: (ticket: SupportTicket) => void
}

const StatusBadge = ({ value }: { value: string }) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Açık'
      case 'in-progress':
        return 'Devam Ediyor'
      case 'resolved':
        return 'Çözüldü'
      case 'closed':
        return 'Kapalı'
      default:
        return status
    }
  }

  return (
    <Badge className={getStatusColor(value)}>
      {getStatusText(value)}
    </Badge>
  )
}

const PriorityBadge = ({ value }: { value: string }) => {
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Acil'
      case 'high':
        return 'Yüksek'
      case 'medium':
        return 'Orta'
      case 'low':
        return 'Düşük'
      default:
        return priority
    }
  }

  return (
    <Badge className={getPriorityColor(value)}>
      {getPriorityText(value)}
    </Badge>
  )
}

const ActionButton = ({ data, onTicketView }: { data: SupportTicket, onTicketView?: (ticket: SupportTicket) => void }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onTicketView?.(data)}
      className="h-8 w-8 p-0"
    >
      <Eye className="h-4 w-4" />
    </Button>
  )
}

export function TicketGrid({ tickets, onTicketView }: TicketGridProps) {
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'Ticket ID',
      width: 100,
      pinned: 'left',
      cellClass: 'font-mono'
    },
    {
      field: 'subject',
      headerName: 'Konu',
      flex: 2,
      minWidth: 200
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      cellRenderer: StatusBadge
    },
    {
      field: 'priority',
      headerName: 'Öncelik',
      width: 100,
      cellRenderer: PriorityBadge
    },
    {
      field: 'customerName',
      headerName: 'Müşteri',
      width: 150
    },
    {
      field: 'companyName',
      headerName: 'Firma',
      width: 150
    },
    {
      field: 'createdAt',
      headerName: 'Oluşturma',
      width: 120,
      valueFormatter: (params) => {
        const date = new Date(params.value)
        return date.toLocaleDateString('tr-TR')
      }
    },
    {
      field: 'updatedAt',
      headerName: 'Güncelleme',
      width: 120,
      valueFormatter: (params) => {
        const date = new Date(params.value)
        return date.toLocaleDateString('tr-TR')
      }
    },
    {
      headerName: 'İşlemler',
      width: 80,
      cellRenderer: (params: any) => (
        <ActionButton data={params.data} onTicketView={onTicketView} />
      ),
      pinned: 'right',
      sortable: false,
      filter: false
    }
  ], [onTicketView])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    filterParams: {
      buttons: ['clear', 'apply']
    }
  }), [])

  return (
    <div className="w-full">
      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          rowData={tickets}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          rowSelection="single"
          suppressRowClickSelection={true}
          animateRows={true}
          rowHeight={50}
          domLayout="normal"
        />
      </div>
    </div>
  )
}