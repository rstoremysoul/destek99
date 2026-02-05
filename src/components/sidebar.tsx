'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Ticket,
  Users,
  Building2,
  Settings,
  LogOut,
  Wrench,
  Package,
  Truck,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Cog,

  BarChart3,
  Factory,
  Box,
  Warehouse
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: Home },
  { name: 'Destek Kayıtları', href: '/dashboard/tickets', icon: Ticket },
  {
    name: 'Donanım Birimi',
    icon: HardDrive,
    children: [
      { name: 'Kurulum Formları', href: '/dashboard/installations', icon: Package },
      { name: 'Kargo Takibi', href: '/dashboard/cargo', icon: Truck },
      { name: 'Cihaz Tamiri', href: '/dashboard/repairs', icon: Wrench },
      { name: 'Muadil Cihazlar', href: '/dashboard/equivalent-devices', icon: Box },
      { name: 'Teknik Servis Takibi', href: '/dashboard/technical-service', icon: Cog },
      { name: 'Tedarikçi Takibi', href: '/dashboard/vendor-tracking', icon: Factory },
      { name: 'Servis Analitikleri', href: '/dashboard/technical-service/analytics', icon: BarChart3 },
      { name: 'Depolar', href: '/dashboard/warehouses', icon: Warehouse }, // Added 'Depolar' link
    ]
  },
  { name: 'Müşteriler', href: '/dashboard/customers', icon: Users },
  { name: 'Firmalar', href: '/dashboard/companies', icon: Building2 },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedMenu, setExpandedMenu] = useState<string>('Donanım Birimi')

  return (
    <div className={cn("flex h-full w-64 flex-col bg-gray-50 border-r", className)}>
      <div className="flex h-16 items-center px-6 border-b">
        <h2 className="text-lg font-semibold">Destek Yönetimi</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          if ('children' in item) {
            const isExpanded = expandedMenu === item.name
            return (
              <div key={item.name}>
                <button
                  onClick={() => setExpandedMenu(isExpanded ? '' : item.name)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && item.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-indigo-100 text-indigo-900 border-l-2 border-indigo-500'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          } else {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-100 text-indigo-900 border-l-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          }
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

