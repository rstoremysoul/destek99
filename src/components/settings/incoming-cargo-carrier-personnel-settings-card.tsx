'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type CarrierPersonnel = {
  id: string
  name: string
  active: boolean
}

export function IncomingCargoCarrierPersonnelSettingsCard() {
  const [rows, setRows] = useState<CarrierPersonnel[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const loadRows = async () => {
    try {
      const res = await fetch('/api/incoming-cargo-carrier-personnel')
      if (!res.ok) return
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error loading incoming cargo carrier personnel:', e)
    }
  }

  useEffect(() => {
    loadRows()
  }, [])

  const addRow = async () => {
    const name = newName.trim()
    if (!name) return
    setLoading(true)
    try {
      const res = await fetch('/api/incoming-cargo-carrier-personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, active: true }),
      })
      if (!res.ok) return
      setNewName('')
      await loadRows()
    } catch (e) {
      console.error('Error adding incoming cargo carrier personnel:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (row: CarrierPersonnel) => {
    try {
      const res = await fetch(`/api/incoming-cargo-carrier-personnel/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !row.active }),
      })
      if (!res.ok) return
      await loadRows()
    } catch (e) {
      console.error('Error updating incoming cargo carrier personnel:', e)
    }
  }

  return (
    <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="border-b border-slate-700/60 pb-4">
        <CardTitle className="text-slate-100">Cihazi Getiren Personel Ayari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Yeni personel adi"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRow()
            }}
            className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
          />
          <Button
            onClick={addRow}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
          >
            Ekle
          </Button>
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 p-2 text-slate-100"
            >
              <span>{row.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(row)}
                className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
              >
                <Badge variant={row.active ? 'default' : 'secondary'}>{row.active ? 'Aktif' : 'Pasif'}</Badge>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
