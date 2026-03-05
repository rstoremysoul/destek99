'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SupplierCompany = {
  id: string
  name: string
  active: boolean
}

export function SupplierCompaniesSettingsCard() {
  const [rows, setRows] = useState<SupplierCompany[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/supplier-companies')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((e) => console.error('supplier companies load error', e))
  }, [])

  const addCompany = async () => {
    const name = newName.trim()
    if (!name) return
    await fetch('/api/supplier-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setNewName('')
    await load()
  }

  const toggleActive = async (row: SupplierCompany) => {
    await fetch(`/api/supplier-companies/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    })
    await load()
  }

  return (
    <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="border-b border-slate-700/60 pb-4">
        <CardTitle className="text-slate-100">Tedarikci Firmalari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yeni tedarikci firma"
            className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
          />
          <Button
            onClick={addCompany}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400"
          >
            Ekle
          </Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Yukleniyor...</div>
          ) : rows.length === 0 ? (
            <div className="rounded border border-dashed border-slate-600/80 bg-slate-900/45 p-3 text-sm text-slate-300">
              Henuz tedarikci firma yok. Yukaridan ekleyebilirsiniz.
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded border border-slate-700/70 bg-slate-900/50 p-2 text-slate-100"
              >
                <span className="text-sm font-medium">{row.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(row)}
                  className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                >
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
