'use client'

import { MobileSidebar } from './mobile-sidebar'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-cyan-400/20 bg-slate-950/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <h1 className="text-xl font-semibold text-slate-100 md:hidden">Destek Yonetimi</h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2 transition-colors hover:bg-slate-800">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
