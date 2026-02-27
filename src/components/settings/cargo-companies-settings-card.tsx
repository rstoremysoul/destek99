'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type CargoCompany = {
  id: string
  name: string
  active: boolean
}

export function CargoCompaniesSettingsCard() {
  const [rows, setRows] = useState<CargoCompany[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cargo-companies')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((e) => console.error('cargo companies load error', e))
  }, [])

  const addCompany = async () => {
    const name = newName.trim()
    if (!name) return
    await fetch('/api/cargo-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setNewName('')
    await load()
  }

  const toggleActive = async (row: CargoCompany) => {
    await fetch(`/api/cargo-companies/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    await load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kargo Firmalari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yeni kargo firmasi"
          />
          <Button onClick={addCompany}>Ekle</Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Yukleniyor...</div>
          ) : rows.length === 0 ? (
            <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
              Henuz kargo firmasi yok. Yukaridan ekleyebilirsiniz.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded border p-2">
                <span className="text-sm font-medium">{row.name}</span>
                <Button variant="outline" size="sm" onClick={() => toggleActive(row)}>
                  <Badge variant={row.active ? 'default' : 'secondary'}>
                    {row.active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

