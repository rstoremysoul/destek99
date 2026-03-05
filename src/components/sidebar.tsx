'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  Building2,
  Settings,
  LogOut,
  Wrench,
  Truck,
  HardDrive,
  ChevronDown,
  Cog,
  BarChart3,
  Factory,
  Box,
  Warehouse,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: Home },
  {
    name: 'Donanim Birimi',
    icon: HardDrive,
    children: [
      { name: 'Kargo Takibi Gelen', href: '/dashboard/cargo-incoming', icon: Truck },
      { name: 'Kargo Takibi Giden', href: '/dashboard/cargo-outgoing', icon: Truck },
      { name: 'Cihaz Tamiri', href: '/dashboard/repairs', icon: Wrench },
      { name: 'Muadil Cihazlar', href: '/dashboard/equivalent-devices', icon: Box },
      { name: 'Musteri Cihaz Takip', href: '/dashboard/customer-device-tracking', icon: Box },
      { name: 'Teknik Servis Takibi', href: '/dashboard/technical-service', icon: Cog },
      { name: 'Tedarikci Takibi', href: '/dashboard/vendor-tracking', icon: Factory },
      { name: 'Konsinye Takibi', href: '/dashboard/consignment-tracking', icon: Factory },
      { name: 'Servis Analitikleri', href: '/dashboard/technical-service/analytics', icon: BarChart3 },
      { name: 'Depolar', href: '/dashboard/warehouses', icon: Warehouse },
    ],
  },
  { name: 'Musteriler', href: '/dashboard/customers', icon: Users },
  { name: 'Firmalar', href: '/dashboard/companies', icon: Building2 },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedMenu, setExpandedMenu] = useState<string>('Donanim Birimi')

  return (
    <div className={cn('relative flex h-full w-64 flex-col overflow-hidden border-r border-cyan-400/20 bg-slate-950/80 text-slate-100 backdrop-blur-xl', className)}>
      <div className="pointer-events-none absolute -left-16 top-12 h-36 w-36 rounded-full bg-cyan-500/12 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-44 w-44 rounded-full bg-blue-500/12 blur-2xl" />
      <div className="flex h-16 items-center border-b border-cyan-400/20 px-6">
        <h2 className="bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-lg font-semibold text-transparent">
          Destek Yonetimi
        </h2>
      </div>

      <nav className="relative z-10 flex-1 space-y-1.5 px-3 py-4">
        {navigation.map((item) => {
          if ('children' in item) {
            const isExpanded = expandedMenu === item.name
            const children = item.children ?? []
            return (
              <div key={item.name}>
                <button
                  onClick={() => setExpandedMenu(isExpanded ? '' : item.name)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5',
                    isExpanded
                      ? 'bg-cyan-500/12 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.28),0_8px_24px_-18px_rgba(34,211,238,0.9)]'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100 hover:shadow-[0_10px_20px_-18px_rgba(15,23,42,0.95)]'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn('mr-3 h-5 w-5 transition-transform duration-300', isExpanded ? 'scale-105 text-cyan-200' : 'group-hover:scale-105')} />
                    {item.name}
                  </div>
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isExpanded ? 'rotate-180 text-cyan-200' : 'text-slate-400 group-hover:text-slate-200')} />
                </button>

                <div
                  className={cn(
                    'ml-2 grid overflow-hidden pl-4 transition-all duration-300 ease-out',
                    isExpanded ? 'mt-1 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="min-h-0 space-y-1 border-l border-cyan-400/15">
                    {children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5',
                            isActive
                              ? 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_10px_22px_-20px_rgba(34,211,238,0.95)]'
                              : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300 transition-all duration-300',
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                            )}
                          />
                          <child.icon className={cn('mr-3 h-4 w-4 transition-transform duration-300', isActive ? 'text-cyan-200' : 'group-hover:scale-105')} />
                          <span>{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5',
                isActive
                  ? 'border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_10px_22px_-20px_rgba(34,211,238,0.95)]'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100'
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300 transition-all duration-300',
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                )}
              />
              <item.icon className={cn('mr-3 h-5 w-5 transition-transform duration-300', isActive ? 'text-cyan-200' : 'group-hover:scale-105')} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-cyan-400/20 p-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/65 p-3">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-300 hover:bg-slate-800 hover:text-cyan-100"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
