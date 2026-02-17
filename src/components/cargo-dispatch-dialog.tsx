'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CargoTracking } from '@/types'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'

interface Location {
  id: string
  name: string
  type: string | null
  address: string
}

interface CargoDispatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cargo: CargoTracking
  onSuccess: () => void
}

export function CargoDispatchDialog({ open, onOpenChange, cargo, onSuccess }: CargoDispatchDialogProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    if (open) {
      fetchLocations()
      setSelectedDeviceIds(cargo.devices.map((d: any) => d.id))
    }
  }, [open, cargo])

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true)
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDeviceIds.length === cargo.devices.length) {
      setSelectedDeviceIds([])
    } else {
      setSelectedDeviceIds(cargo.devices.map((d: any) => d.id))
    }
  }

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      toast.error('Lutfen hedef depo secin')
      return
    }
    if (selectedDeviceIds.length === 0) {
      toast.error('Lutfen en az bir cihaz secin')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cargo/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargoId: cargo.id,
          deviceIds: selectedDeviceIds,
          targetLocationId: selectedLocationId,
          notes: notes || `Kargo ${cargo.trackingNumber} uzerinden sevk edildi`,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || `${selectedDeviceIds.length} cihaz basariyla sevk edildi`)
        onSuccess()
        onOpenChange(false)
        setSelectedLocationId('')
        setNotes('')
        setSelectedDeviceIds([])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Sevk islemi basarisiz')
      }
    } catch (error) {
      console.error('Dispatch error:', error)
      toast.error('Sevk islemi sirasinda hata olustu')
    } finally {
      setLoading(false)
    }
  }

  const getLocationTypeName = (type: string | null) => {
    switch (type) {
      case 'HEADQUARTERS':
        return 'Merkez'
      case 'BRANCH':
        return 'Sube'
      case 'WAREHOUSE':
        return 'Depo'
      case 'CUSTOMER':
        return 'Musteri'
      case 'SUPPLIER':
        return 'Tedarikci'
      case 'SERVICE_CENTER':
        return 'Servis'
      case 'INSTALLATION_TEAM':
        return 'Kurulum Ekibi'
      default:
        return type || 'Diger'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cihazlari Sevk Et</DialogTitle>
          <DialogDescription>
            Kargo <strong>{cargo.trackingNumber}</strong> icindeki cihazlari bir depoya sevk edin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Hedef Depo / Lokasyon</Label>
            {loadingLocations ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Depolar yukleniyor...
              </div>
            ) : (
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Depo secin..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({getLocationTypeName(loc.type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sevk Edilecek Cihazlar</Label>
              <Button variant="link" size="sm" onClick={handleSelectAll} className="h-auto p-0">
                {selectedDeviceIds.length === cargo.devices.length ? 'Tumunu Kaldir' : 'Tumunu Sec'}
              </Button>
            </div>
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {cargo.devices.map((device: any) => (
                <div
                  key={device.id}
                  className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`device-${device.id}`}
                    checked={selectedDeviceIds.includes(device.id)}
                    onCheckedChange={() => handleDeviceToggle(device.id)}
                  />
                  <label htmlFor={`device-${device.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{device.deviceName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {device.model} - {device.serialNumber || 'Seri No Yok'}
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDeviceIds.length} / {cargo.devices.length} cihaz secildi
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Sevk Notu (Opsiyonel)</Label>
            <Textarea
              id="notes"
              placeholder="Sevk ile ilgili notlar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Iptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedDeviceIds.length === 0 || !selectedLocationId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedDeviceIds.length} Cihazi Sevk Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
