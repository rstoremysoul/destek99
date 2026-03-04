'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Technician = {
  id: string
  name: string
  active: boolean
  phone?: string | null
  email?: string | null
  specialization?: string | null
}

export function TechniciansSettingsCard() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [newTechnicianName, setNewTechnicianName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadTechnicians = async () => {
    try {
      const res = await fetch('/api/technicians')
      if (res.ok) {
        const data = await res.json()
        setTechnicians(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Error loading technicians:', e)
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  const addTechnician = async () => {
    const name = newTechnicianName.trim()
    if (!name) return

    setLoading(true)
    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, active: true }),
      })
      if (res.ok) {
        setNewTechnicianName('')
        await loadTechnicians()
      }
    } catch (e) {
      console.error('Error adding technician:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleTechnicianActive = async (tech: Technician) => {
    try {
      const res = await fetch(`/api/technicians/${tech.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !tech.active }),
      })
      if (res.ok) {
        await loadTechnicians()
      }
    } catch (e) {
      console.error('Error updating technician:', e)
    }
  }

  return (
    <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="border-b border-slate-700/60 pb-4">
        <CardTitle className="text-slate-100">Teknisyen Yonetimi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Yeni teknisyen adi"
            value={newTechnicianName}
            onChange={(e) => setNewTechnicianName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTechnician()
            }}
            className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
          />
          <Button
            onClick={addTechnician}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
          >
            Ekle
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-700/70 bg-slate-900/50">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/85 text-slate-200">
              <tr>
                <th className="text-left p-3">Teknisyen</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id} className="border-t border-slate-700/70 text-slate-100 transition-colors hover:bg-slate-800/45">
                  <td className="p-3">{tech.name}</td>
                  <td className="p-3">
                    <Badge variant={tech.active ? 'default' : 'secondary'}>
                      {tech.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTechnicianActive(tech)}
                      className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                    >
                      {tech.active ? 'Pasiflestir' : 'Aktiflestir'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
