'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Brand = {
  id: string
  name: string
  active: boolean
}

type ModelRecord = {
  id: string
  name: string
  active: boolean
  brand: {
    id: string
    name: string
    active: boolean
  }
}

export function DeviceModelsSettingsCard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<ModelRecord[]>([])
  const [newModel, setNewModel] = useState('')
  const [selectedBrandForModel, setSelectedBrandForModel] = useState('')
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

  const loadModels = async () => {
    try {
      const res = await fetch('/api/models/all')
      if (res.ok) {
        const data = await res.json()
        setModels(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Error loading models:', e)
    }
  }

  useEffect(() => {
    loadBrands()
    loadModels()
  }, [])

  useEffect(() => {
    if (!selectedBrandForModel && brands.length > 0) {
      const firstActive = brands.find((b) => b.active)
      if (firstActive) setSelectedBrandForModel(firstActive.name)
    }
  }, [brands, selectedBrandForModel])

  const addModel = async () => {
    const brand = selectedBrandForModel.trim()
    const name = newModel.trim()
    if (!brand || !name) return

    setLoading(true)
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, name }),
      })
      if (res.ok) {
        setNewModel('')
        await loadModels()
      }
    } catch (e) {
      console.error('Error adding model:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleModelActive = async (model: ModelRecord) => {
    try {
      const res = await fetch(`/api/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !model.active }),
      })
      if (res.ok) {
        await loadModels()
      }
    } catch (e) {
      console.error('Error updating model:', e)
    }
  }

  const visibleModels = useMemo(() => {
    if (!selectedBrandForModel) return models
    return models.filter((m) => m.brand?.name === selectedBrandForModel)
  }, [models, selectedBrandForModel])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Yonetimi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-[260px_1fr_auto]">
          <Select value={selectedBrandForModel} onValueChange={setSelectedBrandForModel}>
            <SelectTrigger>
              <SelectValue placeholder="Cihaz turu secin" />
            </SelectTrigger>
            <SelectContent>
              {brands.filter((b) => b.active).map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Yeni model adi"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addModel()
            }}
          />

          <Button onClick={addModel} disabled={loading || !selectedBrandForModel}>
            Ekle
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Cihaz Turu</th>
                <th className="text-left p-3">Model</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {visibleModels.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.brand?.name || '-'}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">
                    <Badge variant={m.active ? 'default' : 'secondary'}>
                      {m.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleModelActive(m)}>
                      {m.active ? 'Pasiflestir' : 'Aktiflestir'}
                    </Button>
                  </td>
                </tr>
              ))}
              {visibleModels.length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    Bu cihaz turu icin model bulunamadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
