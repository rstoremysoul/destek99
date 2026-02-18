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
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Turu Yonetimi</CardTitle>
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
          />
          <Button onClick={addBrand} disabled={loading}>
            Ekle
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Cihaz Turu</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3">
                    <Badge variant={b.active ? 'default' : 'secondary'}>
                      {b.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleBrandActive(b)}>
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
