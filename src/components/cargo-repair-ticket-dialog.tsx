'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CargoTracking } from '@/types'
import { toast } from 'sonner'
import { Loader2, Wrench } from 'lucide-react'

interface CargoRepairTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cargo: CargoTracking
  onSuccess: () => void
}

export function CargoRepairTicketDialog({ open, onOpenChange, cargo, onSuccess }: CargoRepairTicketDialogProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const selectable = cargo.devices
      .filter((d) => d.repairTicket?.status !== 'open')
      .map((d) => d.id)
    setSelectedDeviceIds(selectable)
  }, [open, cargo])

  const toggleDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]))
  }

  const selectAll = () => {
    const selectable = cargo.devices
      .filter((d) => d.repairTicket?.status !== 'open')
      .map((d) => d.id)

    if (selectedDeviceIds.length === selectable.length) {
      setSelectedDeviceIds([])
      return
    }
    setSelectedDeviceIds(selectable)
  }

  const handleSubmit = async () => {
    if (selectedDeviceIds.length === 0) {
      toast.error('Tamir ticketi icin en az bir cihaz secilmelidir')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/cargo/${cargo.id}/repair-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds: selectedDeviceIds }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error || 'Tamir ticketlari olusturulamadi')
        return
      }

      toast.success(data?.message || 'Tamir ticketlari olusturuldu')
      onSuccess()
      onOpenChange(false)
      setSelectedDeviceIds([])
    } catch (error) {
      console.error('Failed to create repair tickets', error)
      toast.error('Tamir ticketlari olusturulurken hata olustu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Cihaz Tamir Ticketi Olustur
          </DialogTitle>
          <DialogDescription>
            <strong>{cargo.trackingNumber}</strong> kaydindaki hangi cihazlar icin tamir ticketi acilacagini secin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <Label>Secilebilir cihazlar</Label>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={selectAll}>
              {selectedDeviceIds.length === cargo.devices.filter((d) => d.repairTicket?.status !== 'open').length ? 'Tumunu Kaldir' : 'Tumunu Sec'}
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto border rounded-md">
            {cargo.devices.map((device) => {
              const hasOpenTicket = device.repairTicket?.status === 'open'
              return (
                <label key={device.id} className={`flex items-start gap-3 p-3 border-b last:border-b-0 ${hasOpenTicket ? 'bg-muted/50' : 'hover:bg-muted/30 cursor-pointer'}`}>
                  <Checkbox
                    checked={selectedDeviceIds.includes(device.id)}
                    disabled={hasOpenTicket}
                    onCheckedChange={() => toggleDevice(device.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{device.deviceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.model} - {device.serialNumber || 'Seri No Yok'}
                    </div>
                    {hasOpenTicket ? (
                      <div className="text-xs text-amber-700 mt-1">
                        Acik ticket var: {device.repairTicket?.repairNumber}
                      </div>
                    ) : null}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Iptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedDeviceIds.length === 0}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Ticket Olustur ({selectedDeviceIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
