'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { TicketProvider } from '@/contexts/TicketContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <TicketProvider>
      <div className="relative flex h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.15),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(16,185,129,0.14),transparent_32%)]" />
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="dashboard-content flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TicketProvider>
  )
}
