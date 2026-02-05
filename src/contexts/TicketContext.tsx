'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SupportTicket, Note } from '@/types'

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'T001',
    subject: 'Sunucu bağlantı sorunu',
    description: 'Ana sunucuya bağlanılmıyor. Sistem tamamen durmuş durumda. Acil müdahale gerekiyor.',
    status: 'open',
    priority: 'urgent',
    assignedTo: '2',
    customerId: '1',
    companyId: '1',
    customerName: 'Mehmet Özkan',
    companyName: 'Teknoloji A.Ş.',
    createdAt: new Date('2024-03-15T09:30:00'),
    updatedAt: new Date('2024-03-15T09:30:00'),
    images: [],
    notes: [],
    location: {
      lat: 41.0082,
      lng: 28.9784,
      address: 'İstanbul, Türkiye'
    }
  },
  {
    id: 'T002',
    subject: 'Yazılım güncellemesi hatası',
    description: 'Son güncelleme sonrası uygulama açılmıyor. Hata kodu: ERR_UPDATE_FAILED',
    status: 'in-progress',
    priority: 'high',
    assignedTo: '2',
    customerId: '2',
    companyId: '2',
    customerName: 'Ayşe Kaya',
    companyName: 'Yazılım Ltd.',
    createdAt: new Date('2024-03-14T14:20:00'),
    updatedAt: new Date('2024-03-15T08:45:00'),
    images: [],
    notes: [
      {
        id: 'N001',
        content: 'Uzaktan bağlantı kuruldu. Güncelleme rollback yapıldı.',
        author: '2',
        authorName: 'Ahmet Yılmaz',
        createdAt: new Date('2024-03-15T08:45:00')
      }
    ]
  },
  {
    id: 'T003',
    subject: 'Veri yedekleme problemi',
    description: 'Otomatik yedekleme sistemi çalışmıyor. Son 3 gündür yedek alınmamış.',
    status: 'resolved',
    priority: 'medium',
    assignedTo: '3',
    customerId: '3',
    companyId: '3',
    customerName: 'Ali Demir',
    companyName: 'Sistem Çözümleri',
    createdAt: new Date('2024-03-13T11:15:00'),
    updatedAt: new Date('2024-03-14T16:30:00'),
    images: [],
    notes: [
      {
        id: 'N002',
        content: 'Yedekleme scriptinde hata bulundu ve düzeltildi.',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-14T16:30:00')
      }
    ]
  },
  {
    id: 'T004',
    subject: 'E-posta sistemi yavaşlığı',
    description: 'E-posta gönderim ve alma işlemleri çok yavaş. Kullanıcılar şikayetçi.',
    status: 'open',
    priority: 'medium',
    assignedTo: '2',
    customerId: '4',
    companyId: '4',
    customerName: 'Fatma Yılmaz',
    companyName: 'Dijital Medya',
    createdAt: new Date('2024-03-15T13:45:00'),
    updatedAt: new Date('2024-03-15T13:45:00'),
    images: [],
    notes: []
  }
]

interface TicketContextType {
  tickets: SupportTicket[]
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void
  updateTicketPriority: (ticketId: string, priority: SupportTicket['priority']) => void
  addNoteToTicket: (ticketId: string, content: string, author: string, authorName: string) => void
  createTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'images'>) => SupportTicket
  getTicketById: (id: string) => SupportTicket | undefined
}

const TicketContext = createContext<TicketContextType | undefined>(undefined)

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS)


  const updateTicketStatus = useCallback((ticketId: string, status: SupportTicket['status']) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status, updatedAt: new Date() }
          : ticket
      )
    )
  }, [])

  const updateTicketPriority = useCallback((ticketId: string, priority: SupportTicket['priority']) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, priority, updatedAt: new Date() }
          : ticket
      )
    )
  }, [])

  const addNoteToTicket = useCallback((ticketId: string, content: string, author: string, authorName: string) => {
    const newNote: Note = {
      id: `N${Date.now()}`,
      content,
      author,
      authorName,
      createdAt: new Date()
    }

    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId
          ? {
            ...ticket,
            notes: [...ticket.notes, newNote],
            updatedAt: new Date()
          }
          : ticket
      )
    )
  }, [])

  const createTicket = useCallback((ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'images'>) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `T${String(Date.now()).slice(-3)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: [],
      images: []
    }

    setTickets(prevTickets => [...prevTickets, newTicket])
    return newTicket
  }, [])

  const getTicketById = useCallback((id: string) => {
    return tickets.find(ticket => ticket.id === id)
  }, [tickets])

  const value: TicketContextType = {
    tickets,
    updateTicketStatus,
    updateTicketPriority,
    addNoteToTicket,
    createTicket,
    getTicketById
  }

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketContext)
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider')
  }
  return context
}
