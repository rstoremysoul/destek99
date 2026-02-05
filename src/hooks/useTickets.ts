'use client'

import { useState, useCallback } from 'react'
import { SupportTicket, Note } from '@/types'
import { mockTickets } from '@/lib/mock-data'

export const useTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)

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
      id: `T${String(Date.now()).slice(-3).padStart(3, '0')}`,
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

  return {
    tickets,
    updateTicketStatus,
    updateTicketPriority,
    addNoteToTicket,
    createTicket,
    getTicketById
  }
}
