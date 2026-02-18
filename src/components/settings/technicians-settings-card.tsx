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
    <Card>
      <CardHeader>
        <CardTitle>Teknisyen Yonetimi</CardTitle>
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
          />
          <Button onClick={addTechnician} disabled={loading}>
            Ekle
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Teknisyen</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id} className="border-t">
                  <td className="p-3">{tech.name}</td>
                  <td className="p-3">
                    <Badge variant={tech.active ? 'default' : 'secondary'}>
                      {tech.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleTechnicianActive(tech)}>
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
