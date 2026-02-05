export interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'technician' | 'manager'
}

export interface Technician {
  id: string
  name: string
  phone?: string
  email?: string
  specialization?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  customerId: string
  companyId: string
  customerName: string
  companyName: string
  createdAt: Date
  updatedAt: Date
  images: string[]
  notes: Note[]
  location?: {
    lat: number
    lng: number
    address?: string
  }
}

export interface Note {
  id: string
  content: string
  author: string
  authorName: string
  createdAt: Date
  images?: string[]
}

export interface Company {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  companyId: string
}

// Donanım Birimi Veri Modelleri

export interface Device {
  id: string
  name: string
  model: string
  serialNumber: string
  brand: string
  category: 'server' | 'router' | 'switch' | 'firewall' | 'ups' | 'other'
  warrantyEndDate?: Date
  purchaseDate: Date
  specifications: Record<string, string>
}

export interface InstallationForm {
  id: string
  formNumber: string
  companyId: string
  companyName: string
  customerId: string
  customerName: string
  technicianId?: string
  technicianName?: string
  requestDate: Date
  plannedInstallDate: Date
  actualInstallDate?: Date
  status: 'received' | 'preparing' | 'ready' | 'installing' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  devices: InstallationDevice[]
  installationAddress: string
  contactPerson: string
  contactPhone: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface InstallationDevice {
  id: string
  deviceId: string
  deviceName: string
  model: string
  serialNumber: string
  quantity: number
  installationStatus: 'pending' | 'configured' | 'installed' | 'tested' | 'completed'
  configurationNotes?: string
  testResults?: string
}

export interface CargoTracking {
  id: string
  trackingNumber: string
  type: 'incoming' | 'outgoing'
  status: 'in_transit' | 'delivered' | 'returned' | 'lost' | 'damaged'
  sender: string
  receiver: string
  cargoCompany: string
  sentDate?: Date
  deliveredDate?: Date
  devices: CargoDevice[]
  destination: 'customer' | 'distributor' | 'branch' | 'headquarters'
  destinationAddress: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface CargoDevice {
  id: string
  deviceId?: string
  deviceName: string
  model: string
  serialNumber: string
  quantity: number
  condition: 'new' | 'used' | 'refurbished' | 'damaged'
  purpose: 'installation' | 'replacement' | 'repair' | 'return'
}

export interface DeviceRepair {
  id: string
  repairNumber: string
  deviceId?: string
  deviceName: string
  model: string
  serialNumber: string
  companyId: string
  companyName: string
  customerId: string
  customerName: string
  technicianId?: string
  technicianName?: string
  receivedDate: Date
  problemDescription: string
  status: 'received' | 'diagnosing' | 'waiting_parts' | 'repairing' | 'testing' | 'completed' | 'unrepairable'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedCompletionDate?: Date
  actualCompletionDate?: Date
  repairCost?: number
  isWarranty: boolean
  warrantyEndDate?: Date
  partsUsed: RepairPart[]
  repairNotes: RepairNote[]
  finalReport?: string
  createdAt: Date
  updatedAt: Date
}

export interface RepairPart {
  id: string
  partName: string
  partNumber: string
  quantity: number
  unitPrice: number
  totalPrice: number
  supplier: string
  warrantyMonths: number
  usedDate: Date
}

export interface RepairNote {
  id: string
  note: string
  author: string
  authorName: string
  createdAt: Date
  type: 'diagnostic' | 'repair' | 'test' | 'general'
}

export interface DeviceLocation {
  deviceId: string
  location: 'customer' | 'distributor' | 'branch' | 'headquarters' | 'repair' | 'in_transit'
  locationDetails: string
  contactPerson?: string
  contactPhone?: string
  updatedAt: Date
  updatedBy: string
}

export interface Vendor {
  id: string
  name: string
  type: 'manufacturer' | 'service_provider' | 'distributor'
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VendorProduct {
  id: string
  vendorId: string
  vendorName: string
  productType: 'pos' | 'printer' | 'server' | 'network' | 'other'
  productName: string
  model: string
  serialNumber: string
  businessName: string
  companyId: string
  currentStatus: 'at_vendor' | 'in_testing' | 'in_transit' | 'completed' | 'returned'
  entryDate: Date
  exitDate?: Date
  estimatedCompletionDate?: Date
  problemDescription: string
  vendorAction?: string
  cost?: number
  isPaidByVendor: boolean
  statusHistory: ProductStatusHistory[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductStatusHistory {
  id: string
  status: 'at_vendor' | 'in_testing' | 'in_transit' | 'completed' | 'returned'
  statusDate: Date
  notes?: string
  updatedBy: string
  updatedByName: string
}

export interface Location {
  id: string
  name: string
  address: string
  city?: string
  district?: string
  phone?: string
  contactPerson?: string
  type?: 'warehouse' | 'customer' | 'service_center' | 'branch' | 'headquarters'
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EquivalentDevice {
  id: string
  deviceNumber: string
  deviceName: string
  brand: string
  model: string
  serialNumber: string
  currentLocation: 'in_warehouse' | 'on_site_service' | 'at_customer'
  status: 'available' | 'in_use' | 'in_maintenance' | 'reserved' | 'retired' | 'passive'
  assignedToId?: string
  assignedTo?: Location
  assignedDate?: Date
  purchaseDate?: Date
  warrantyEnd?: Date
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor'
  images?: string
  notes?: string
  createdBy?: string
  createdByName?: string
  createdAt: Date
  updatedAt: Date
  history?: EquivalentDeviceHistory[]
}

export interface EquivalentDeviceHistory {
  id: string
  deviceId: string
  previousLocation: 'in_warehouse' | 'on_site_service' | 'at_customer'
  newLocation: 'in_warehouse' | 'on_site_service' | 'at_customer'
  previousStatus?: 'available' | 'in_use' | 'in_maintenance' | 'reserved' | 'retired' | 'passive'
  newStatus?: 'available' | 'in_use' | 'in_maintenance' | 'reserved' | 'retired' | 'passive'
  assignedToId?: string
  assignedToName?: string
  notes?: string
  changedBy: string
  changedByName: string
  changedAt: Date
}
