
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, Building2, Phone, User, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DispatchDialog } from '@/components/dispatch-dialog';

interface WarehouseDetail {
    id: string;
    name: string;
    type: string;
    address: string | null;
    contactPerson: string | null;
    phone: string | null;
    assignedDevices: any[]; // refine type later
}

export default function WarehouseDetailPage({ params }: { params: { id: string } }) {
    const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [dispatchOpen, setDispatchOpen] = useState(false);

    const fetchDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/warehouses/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setWarehouse(data);
            } else {
                toast.error('Depo bilgileri alınamadı');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    if (loading) return <div className="p-6">Yükleniyor...</div>;
    if (!warehouse) return <div className="p-6">Depo bulunamadı</div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">{warehouse.name}</h1>
                        <Badge variant="outline">{warehouse.type}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 mt-2 text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {warehouse.address || 'Adres yok'}
                        </div>
                        {(warehouse.contactPerson || warehouse.phone) && (
                            <div className="flex items-center gap-4">
                                {warehouse.contactPerson && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" /> {warehouse.contactPerson}
                                    </div>
                                )}
                                {warehouse.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" /> {warehouse.phone}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDispatchOpen(true)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Yap / Sevk Et
                    </Button>
                </div>
            </div>

            <DispatchDialog
                open={dispatchOpen}
                onOpenChange={setDispatchOpen}
                currentWarehouseId={warehouse.id}
                availableInventory={warehouse.assignedDevices}
                onSuccess={fetchDetails}
            />

            <Tabs defaultValue="inventory" className="w-full">
                <TabsList>
                    <TabsTrigger value="inventory">Envanter ({warehouse.assignedDevices.length})</TabsTrigger>
                    <TabsTrigger value="history">Geçmiş Hareketler</TabsTrigger>
                </TabsList>
                <TabsContent value="inventory" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mevcut Cihazlar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {warehouse.assignedDevices.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">Bu depoda cihaz bulunmamaktadır.</p>
                            ) : (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Cihaz</th>
                                                <th className="p-3 text-left font-medium">Model</th>
                                                <th className="p-3 text-left font-medium">Seri No</th>
                                                <th className="p-3 text-left font-medium">Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {warehouse.assignedDevices.map((device: any) => (
                                                <tr key={device.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{device.deviceName}</td>
                                                    <td className="p-3 text-muted-foreground">{device.model}</td>
                                                    <td className="p-3 font-mono text-xs">{device.serialNumber}</td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary">{device.condition}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Geçmiş hareket kayıtları burada listelenecek.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
