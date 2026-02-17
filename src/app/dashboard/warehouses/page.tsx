'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Package, MapPin, Building2, Truck, Wrench, Search, ArrowRight,
    ArrowDownLeft, ArrowUpRight, Clock, User, Box, Filter, RefreshCw,
    Home, ShoppingCart, ShieldCheck, Users
} from 'lucide-react';
import { NewWarehouseDialog } from '@/components/new-warehouse-dialog';
import Link from 'next/link';

interface Warehouse {
    id: string;
    name: string;
    type: string | null;
    address: string | null;
    city: string | null;
    _count?: {
        assignedDevices: number;
    };
}

interface Movement {
    id: string;
    deviceId: string;
    previousLocation: string;
    newLocation: string;
    previousLocationId: string | null;
    newLocationId: string | null;
    previousLocationName: string | null;
    newLocationName: string | null;
    previousStatus: string | null;
    newStatus: string | null;
    assignedToName: string | null;
    notes: string | null;
    changedBy: string;
    changedByName: string;
    changedAt: string;
    device: {
        id: string;
        deviceNumber: string;
        deviceName: string;
        brand: string;
        model: string;
        serialNumber: string;
        status: string;
    };
}

interface InventoryItem {
    id: string;
    deviceNumber: string;
    deviceName: string;
    brand: string;
    model: string;
    serialNumber: string;
    status: string;
    condition: string;
    currentLocation: string;
    location: {
        id: string;
        name: string;
        type: string | null;
    } | null;
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');
    const [inventoryWarehouse, setInventoryWarehouse] = useState('all');
    const [movementType, setMovementType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('inventory');

    // Fetch warehouses for filter dropdown
    const fetchWarehouses = useCallback(async () => {
        try {
            const res = await fetch('/api/warehouses');
            if (res.ok) {
                const data = await res.json();
                setWarehouses(data);
            }
        } catch (error) {
            console.error('Failed to fetch warehouses', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch movements based on filters
    const fetchMovements = useCallback(async () => {
        try {
            setMovementsLoading(true);
            let url = '/api/warehouses/movements?limit=200';

            if (selectedWarehouse !== 'all') {
                url += `&warehouseId=${selectedWarehouse}`;
            }
            if (movementType !== 'all') {
                url += `&type=${movementType}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setMovements(data);
            }
        } catch (error) {
            console.error('Failed to fetch movements', error);
        } finally {
            setMovementsLoading(false);
        }
    }, [selectedWarehouse, movementType]);

    const fetchInventory = useCallback(async () => {
        try {
            setInventoryLoading(true);
            let url = '/api/warehouses/inventory';
            if (inventoryWarehouse !== 'all') {
                url += `?locationId=${inventoryWarehouse}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setInventoryLoading(false);
        }
    }, [inventoryWarehouse]);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const getIcon = (type: string | null) => {
        switch (type) {
            case 'WAREHOUSE': return <Box className="h-6 w-6 text-blue-600" />;
            case 'HEADQUARTERS': return <Home className="h-6 w-6 text-indigo-600" />;
            case 'BRANCH': return <Building2 className="h-6 w-6 text-purple-600" />;
            case 'SUPPLIER': return <ShoppingCart className="h-6 w-6 text-orange-600" />;
            case 'INSTALLATION_TEAM': return <Truck className="h-6 w-6 text-green-600" />;
            case 'SERVICE_CENTER':
            case 'TECHNICAL_SERVICE': return <Wrench className="h-6 w-6 text-red-600" />;
            case 'TESTING': return <ShieldCheck className="h-6 w-6 text-yellow-600" />;
            case 'CONSIGNMENT': return <Package className="h-6 w-6 text-teal-600" />;
            case 'CUSTOMER': return <Users className="h-6 w-6 text-pink-600" />;
            default: return <Package className="h-6 w-6 text-gray-600" />;
        }
    };

    const getTypeBadgeColor = (type: string | null) => {
        switch (type) {
            case 'WAREHOUSE': return 'bg-blue-100 text-blue-800';
            case 'HEADQUARTERS': return 'bg-indigo-100 text-indigo-800';
            case 'BRANCH': return 'bg-purple-100 text-purple-800';
            case 'SUPPLIER': return 'bg-orange-100 text-orange-800';
            case 'INSTALLATION_TEAM': return 'bg-green-100 text-green-800';
            case 'SERVICE_CENTER':
            case 'TECHNICAL_SERVICE': return 'bg-red-100 text-red-800';
            case 'TESTING': return 'bg-yellow-100 text-yellow-800';
            case 'CONSIGNMENT': return 'bg-teal-100 text-teal-800';
            case 'CUSTOMER': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type: string | null) => {
        const types_tr: Record<string, string> = {
            'WAREHOUSE': 'Depo',
            'CUSTOMER': 'Müşteri',
            'SERVICE_CENTER': 'Servis Merkezi',
            'BRANCH': 'Şube',
            'HEADQUARTERS': 'Merkez Ofis',
            'SUPPLIER': 'Tedarikçi',
            'TECHNICAL_SERVICE': 'Teknik Servis',
            'INSTALLATION_TEAM': 'Kurulum Ekibi',
            'TESTING': 'Test',
            'CONSIGNMENT': 'Konsinye'
        };
        return type ? (types_tr[type] || type) : 'Diğer';
    };

    const getLocationLabel = (location: string) => {
        const labels: Record<string, string> = {
            'IN_WAREHOUSE': 'Depoda',
            'ON_SITE_SERVICE': 'Sahada',
            'AT_CUSTOMER': 'Müşteride',
        };
        return labels[location] || location;
    };

    const getStatusBadge = (status: string | null) => {
        if (!status) return null;
        const colors: Record<string, string> = {
            'AVAILABLE': 'bg-green-100 text-green-800',
            'IN_USE': 'bg-blue-100 text-blue-800',
            'IN_MAINTENANCE': 'bg-orange-100 text-orange-800',
            'RESERVED': 'bg-purple-100 text-purple-800',
            'RETIRED': 'bg-gray-100 text-gray-800',
        };
        const labels: Record<string, string> = {
            'AVAILABLE': 'Müsait',
            'IN_USE': 'Kullanımda',
            'IN_MAINTENANCE': 'Bakımda',
            'RESERVED': 'Rezerve',
            'RETIRED': 'Kullanım Dışı',
        };
        return (
            <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
                {labels[status] || status}
            </Badge>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateStr));
    };

    const getMovementIcon = (movement: Movement) => {
        if (selectedWarehouse !== 'all') {
            if (movement.newLocationId === selectedWarehouse) {
                return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
            } else if (movement.previousLocationId === selectedWarehouse) {
                return <ArrowUpRight className="h-5 w-5 text-red-600" />;
            }
        }
        return <ArrowRight className="h-5 w-5 text-blue-600" />;
    };

    const getMovementTypeLabel = (movement: Movement) => {
        if (selectedWarehouse !== 'all') {
            if (movement.newLocationId === selectedWarehouse) {
                return <Badge className="bg-green-100 text-green-800">Giriş</Badge>;
            } else if (movement.previousLocationId === selectedWarehouse) {
                return <Badge className="bg-red-100 text-red-800">Çıkış</Badge>;
            }
        }
        return <Badge className="bg-blue-100 text-blue-800">Transfer</Badge>;
    };

    // Filter warehouses by search
    const filteredWarehouses = warehouses.filter(wh => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            wh.name.toLowerCase().includes(search) ||
            wh.address?.toLowerCase().includes(search) ||
            wh.city?.toLowerCase().includes(search)
        );
    });

    // Filter movements by search term
    const filteredMovements = movements.filter(m => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            m.device.deviceName?.toLowerCase().includes(search) ||
            m.device.serialNumber?.toLowerCase().includes(search) ||
            m.device.model?.toLowerCase().includes(search) ||
            m.notes?.toLowerCase().includes(search) ||
            m.previousLocationName?.toLowerCase().includes(search) ||
            m.newLocationName?.toLowerCase().includes(search)
        );
    });

    const filteredInventory = inventory.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            item.deviceName?.toLowerCase().includes(search) ||
            item.serialNumber?.toLowerCase().includes(search) ||
            item.model?.toLowerCase().includes(search) ||
            item.brand?.toLowerCase().includes(search) ||
            item.location?.name?.toLowerCase().includes(search)
        );
    });

    // Stats
    const stats = {
        totalWarehouses: warehouses.length,
        totalDevices: warehouses.reduce((sum, w) => sum + (w._count?.assignedDevices || 0), 0),
        totalMovements: movements.length,
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Depolar ve Hareketler</h1>
                    <p className="text-muted-foreground mt-1">
                        Depoları görüntüleyin ve cihaz hareketlerini takip edin.
                    </p>
                </div>
                <NewWarehouseDialog onSuccess={fetchWarehouses} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Depo</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWarehouses}</div>
                        <p className="text-xs text-muted-foreground">Aktif lokasyon</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDevices}</div>
                        <p className="text-xs text-muted-foreground">Tüm lokasyonlarda</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hareket Kayıtları</CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMovements}</div>
                        <p className="text-xs text-muted-foreground">Kayıtlı transfer</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Depo, cihaz, seri no veya adres ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-xl grid-cols-3">
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Envanter ({filteredInventory.length})
                    </TabsTrigger>
                    <TabsTrigger value="warehouses" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Depolar ({filteredWarehouses.length})
                    </TabsTrigger>
                    <TabsTrigger value="movements" className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Hareketler ({filteredMovements.length})
                    </TabsTrigger>
                </TabsList>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Envanter Filtreleri
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select value={inventoryWarehouse} onValueChange={setInventoryWarehouse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Depo Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Depolar</SelectItem>
                                        {warehouses.map(wh => (
                                            <SelectItem key={wh.id} value={wh.id}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Envanter Kayıtları</CardTitle>
                            <CardDescription>
                                {filteredInventory.length} kayıt gösteriliyor
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                {inventoryLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredInventory.length > 0 ? (
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cihaz</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Marka / Model</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seri No</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Depo</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Konum</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInventory.map((item) => (
                                                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <div className="font-medium">{item.deviceName}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{item.deviceNumber}</div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="text-sm">{item.brand} {item.model}</div>
                                                        <div className="text-xs text-muted-foreground">{item.condition}</div>
                                                    </td>
                                                    <td className="p-4 align-middle font-mono text-xs">
                                                        {item.serialNumber}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {getStatusBadge(item.status)}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {item.location?.name || '-'}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {getLocationLabel(item.currentLocation)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-12">
                                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">Envanter Kaydı Bulunamadı</h3>
                                        <p className="text-muted-foreground mt-1">
                                            Bu filtreler için envanter kaydı yok.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Warehouses Tab */}
                <TabsContent value="warehouses" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredWarehouses.map((warehouse) => (
                            <Link href={`/dashboard/warehouses/${warehouse.id}`} key={warehouse.id}>
                                <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full group">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <Badge className={`${getTypeBadgeColor(warehouse.type)} text-xs`}>
                                            {getTypeLabel(warehouse.type)}
                                        </Badge>
                                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                            {getIcon(warehouse.type)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                {warehouse.name}
                                            </h3>
                                            {warehouse.address && (
                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">{warehouse.address}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{warehouse._count?.assignedDevices || 0}</span>
                                                <span className="text-muted-foreground">cihaz</span>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-primary">
                                                Detay →
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {filteredWarehouses.length === 0 && (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Depo Bulunamadı</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchTerm ? 'Aramanıza uygun depo bulunamadı.' : 'Henüz depo eklenmemiş.'}
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Movements Tab */}
                <TabsContent value="movements" className="mt-6 space-y-4">
                    {/* Movement Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Hareket Filtreleri
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Depo Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Depolar</SelectItem>
                                        {warehouses.map(wh => (
                                            <SelectItem key={wh.id} value={wh.id}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={movementType} onValueChange={setMovementType} disabled={selectedWarehouse === 'all'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hareket Tipi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Hareketler</SelectItem>
                                        <SelectItem value="incoming">Sadece Giriş</SelectItem>
                                        <SelectItem value="outgoing">Sadece Çıkış</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Movements Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hareket Kayıtları</CardTitle>
                            <CardDescription>
                                {filteredMovements.length} kayıt gösteriliyor
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                {movementsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredMovements.length > 0 ? (
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tip</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cihaz</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kaynak → Hedef</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tarih</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">İşlemi Yapan</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Not</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMovements.map((movement) => (
                                                <tr key={movement.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            {getMovementIcon(movement)}
                                                            {getMovementTypeLabel(movement)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div>
                                                            <div className="font-medium">{movement.device.deviceName}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {movement.device.brand} {movement.device.model}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {movement.device.serialNumber}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {movement.previousLocationName || getLocationLabel(movement.previousLocation)}
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                            <div className="text-sm font-medium">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {movement.newLocationName || getLocationLabel(movement.newLocation)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {getStatusBadge(movement.newStatus)}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            {formatDate(movement.changedAt)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            {movement.changedByName || movement.changedBy}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={movement.notes || ''}>
                                                            {movement.notes || '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-12">
                                        <ArrowRight className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">Hareket Kaydı Bulunamadı</h3>
                                        <p className="text-muted-foreground mt-1">
                                            Henüz cihaz hareketi kaydedilmemiş. Kargo sayfasından cihaz sevk ettiğinizde burada görünecektir.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
