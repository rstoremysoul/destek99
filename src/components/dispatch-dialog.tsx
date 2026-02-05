'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface DispatchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentWarehouseId: string
    availableInventory: any[] // device list
    onSuccess: () => void
}

interface Warehouse {
    id: string
    name: string
    type: string
}

export function DispatchDialog({ open, onOpenChange, currentWarehouseId, availableInventory, onSuccess }: DispatchDialogProps) {
    const [selectedDevices, setSelectedDevices] = useState<string[]>([])
    const [targetWarehouse, setTargetWarehouse] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loadingWarehouses, setLoadingWarehouses] = useState(false)

    useEffect(() => {
        if (open) {
            setLoadingWarehouses(true)
            fetch('/api/warehouses')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Filter out current warehouse
                        setWarehouses(data.filter((w: Warehouse) => w.id !== currentWarehouseId))
                    }
                })
                .catch(err => console.error('Failed to load warehouses', err))
                .finally(() => setLoadingWarehouses(false))

            setSelectedDevices([])
            setTargetWarehouse('')
            setNotes('')
        }
    }, [open, currentWarehouseId])

    const toggleDevice = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        )
    }

    const toggleAll = () => {
        if (selectedDevices.length === availableInventory.length) {
            setSelectedDevices([])
        } else {
            setSelectedDevices(availableInventory.map(d => d.id))
        }
    }

    const handleDispatch = async () => {
        if (!targetWarehouse) {
            toast.error('Lütfen hedef depo seçiniz')
            return
        }
        if (selectedDevices.length === 0) {
            toast.error('Lütfen en az bir cihaz seçiniz')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/inventory/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceIds: selectedDevices,
                    targetLocationId: targetWarehouse,
                    notes: notes
                })
            })

            if (res.ok) {
                toast.success(`${selectedDevices.length} adet cihaz sevk edildi`)
                onSuccess()
                onOpenChange(false)
            } else {
                const error = await res.json()
                toast.error(error.error || 'Sevk işlemi başarısız')
            }
        } catch (error) {
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                        Cihaz Sevkiyatı / Transfer
                    </DialogTitle>
                    <DialogDescription>
                        Seçili cihazları başka bir depoya veya ekibe transfer edin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Hedef Depo / Ekip</Label>
                            <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Hedef seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingWarehouses ? (
                                        <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                                    ) : (
                                        warehouses.map(w => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{w.name}</span>
                                                    <Badge variant="outline" className="text-xs">{w.type}</Badge>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Transfer Notu</Label>
                            <Textarea
                                placeholder="Örn: Kurulum için gönderildi"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Cihaz Seçimi ({selectedDevices.length} Seçili)</Label>
                            <Button variant="ghost" size="sm" onClick={toggleAll} className="h-auto py-1">
                                {selectedDevices.length === availableInventory.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                            </Button>
                        </div>

                        <div className="border rounded-md max-h-[300px] overflow-y-auto">
                            {availableInventory.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">Transfer edilecek cihaz yok.</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0 z-10">
                                        <tr className="border-b">
                                            <th className="p-3 w-[40px]">
                                                <Checkbox
                                                    checked={availableInventory.length > 0 && selectedDevices.length === availableInventory.length}
                                                    onCheckedChange={toggleAll}
                                                />
                                            </th>
                                            <th className="p-3 text-left">Cihaz</th>
                                            <th className="p-3 text-left">Seri No</th>
                                            <th className="p-3 text-left">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableInventory.map(device => (
                                            <tr key={device.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="p-3">
                                                    <Checkbox
                                                        checked={selectedDevices.includes(device.id)}
                                                        onCheckedChange={() => toggleDevice(device.id)}
                                                    />
                                                </td>
                                                <td className="p-3 font-medium">
                                                    {device.deviceName}
                                                    <span className="text-muted-foreground ml-1 text-xs">({device.model})</span>
                                                </td>
                                                <td className="p-3 font-mono text-xs">{device.serialNumber}</td>
                                                <td className="p-3">
                                                    <Badge variant="secondary" className="text-xs">{device.condition}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button
                        onClick={handleDispatch}
                        disabled={loading || selectedDevices.length === 0 || !targetWarehouse}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                        Transferi Tamamla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
