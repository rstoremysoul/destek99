'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Brand = {
  id: string
  name: string
  active: boolean
}

export function DeviceTypesSettingsCard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [newBrand, setNewBrand] = useState('')
  const [loading, setLoading] = useState(false)

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/brands/all')
      if (res.ok) {
        const data = await res.json()
        setBrands(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Error loading brands:', e)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const addBrand = async () => {
    const name = newBrand.trim()
    if (!name) return
    setLoading(true)
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setNewBrand('')
        await loadBrands()
      }
    } catch (e) {
      console.error('Error adding brand:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleBrandActive = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !brand.active }),
      })
      if (res.ok) {
        await loadBrands()
      }
    } catch (e) {
      console.error('Error updating brand:', e)
    }
  }

  return (
    <Card className="border-slate-700/70 bg-slate-900/70 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
      <CardHeader className="border-b border-slate-700/60 pb-4">
        <CardTitle className="text-slate-100">Cihaz Turu Yonetimi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Yeni cihaz turu"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addBrand()
            }}
            className="border-slate-600/80 bg-slate-950/70 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/40"
          />
          <Button
            onClick={addBrand}
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
                <th className="text-left p-3">Cihaz Turu</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-slate-700/70 text-slate-100 transition-colors hover:bg-slate-800/45">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3">
                    <Badge variant={b.active ? 'default' : 'secondary'}>
                      {b.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBrandActive(b)}
                      className="border-slate-600/80 bg-slate-900/40 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                    >
                      {b.active ? 'Pasiflestir' : 'Aktiflestir'}
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
