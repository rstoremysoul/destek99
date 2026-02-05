import { Device, InstallationForm, CargoTracking, DeviceRepair, InstallationDevice, CargoDevice, RepairPart, RepairNote, Vendor, VendorProduct } from '@/types'

export const mockDevices: Device[] = [
  {
    id: 'DEV001',
    name: 'HP ProLiant DL380 Gen10',
    model: 'DL380-G10',
    serialNumber: 'HP001ABC123',
    brand: 'HP',
    category: 'server',
    warrantyEndDate: new Date('2025-12-31'),
    purchaseDate: new Date('2023-01-15'),
    specifications: {
      'CPU': 'Intel Xeon Silver 4214R',
      'RAM': '32GB DDR4',
      'Storage': '2x 600GB SAS',
      'Network': '4x 1GbE'
    }
  },
  {
    id: 'DEV002',
    name: 'Cisco Catalyst 2960',
    model: 'WS-C2960X-24TS-L',
    serialNumber: 'CIS002XYZ789',
    brand: 'Cisco',
    category: 'switch',
    warrantyEndDate: new Date('2026-06-30'),
    purchaseDate: new Date('2023-06-01'),
    specifications: {
      'Ports': '24x 10/100/1000',
      'Uplinks': '4x SFP+',
      'Power': '370W'
    }
  },
  {
    id: 'DEV003',
    name: 'Fortinet FortiGate 100F',
    model: 'FG-100F',
    serialNumber: 'FG100F001',
    brand: 'Fortinet',
    category: 'firewall',
    warrantyEndDate: new Date('2025-03-15'),
    purchaseDate: new Date('2023-03-15'),
    specifications: {
      'Throughput': '10 Gbps',
      'VPN Throughput': '8 Gbps',
      'Ports': '14x GbE RJ45, 2x SFP+'
    }
  }
]

export const mockInstallationForms: InstallationForm[] = [
  {
    id: 'INST001',
    formNumber: 'KF-2024-001',
    companyId: '1',
    companyName: 'Teknoloji A.Ş.',
    customerId: '1',
    customerName: 'Mehmet Özkan',
    requestDate: new Date('2024-03-10'),
    plannedInstallDate: new Date('2024-03-18'),
    actualInstallDate: new Date('2024-03-18'),
    status: 'completed',
    priority: 'high',
    devices: [
      {
        id: 'INSTDEV001',
        deviceId: 'DEV001',
        deviceName: 'HP ProLiant DL380 Gen10',
        model: 'DL380-G10',
        serialNumber: 'HP001ABC123',
        quantity: 2,
        installationStatus: 'completed',
        configurationNotes: 'RAID 1 konfigürasyonu yapıldı',
        testResults: 'Tüm testler başarılı'
      }
    ],
    installationAddress: 'İstanbul, Şişli, Teknik Merkez',
    contactPerson: 'Ahmet Yılmaz',
    contactPhone: '+90 532 123 4567',
    notes: 'Veri merkezi kurulumu',
    assignedTechnician: '2',
    technicianName: 'Ahmet Yılmaz',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-18')
  },
  {
    id: 'INST002',
    formNumber: 'KF-2024-002',
    companyId: '2',
    companyName: 'Yazılım Ltd.',
    customerId: '2',
    customerName: 'Ayşe Kaya',
    requestDate: new Date('2024-03-12'),
    plannedInstallDate: new Date('2024-03-20'),
    status: 'installing',
    priority: 'medium',
    devices: [
      {
        id: 'INSTDEV002',
        deviceId: 'DEV002',
        deviceName: 'Cisco Catalyst 2960',
        model: 'WS-C2960X-24TS-L',
        serialNumber: 'CIS002XYZ789',
        quantity: 1,
        installationStatus: 'installed',
        configurationNotes: 'VLAN konfigürasyonu yapıldı'
      },
      {
        id: 'INSTDEV003',
        deviceId: 'DEV003',
        deviceName: 'Fortinet FortiGate 100F',
        model: 'FG-100F',
        serialNumber: 'FG100F001',
        quantity: 1,
        installationStatus: 'configured',
        configurationNotes: 'Güvenlik politikaları yapılandırılıyor'
      }
    ],
    installationAddress: 'Ankara, Çankaya, Ofis Binası',
    contactPerson: 'Fatma Demir',
    contactPhone: '+90 533 987 6543',
    notes: 'Ofis ağ altyapısı kurulumu',
    assignedTechnician: '3',
    technicianName: 'Ayşe Demir',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-19')
  }
]

export const mockCargoTrackings: CargoTracking[] = [
  {
    id: 'CARGO001',
    trackingNumber: 'TK123456789',
    type: 'outgoing',
    status: 'delivered',
    sender: 'Destek Merkezi',
    receiver: 'Teknoloji A.Ş.',
    cargoCompany: 'Yurtiçi Kargo',
    sentDate: new Date('2024-03-15'),
    deliveredDate: new Date('2024-03-17'),
    devices: [
      {
        id: 'CARGODEV001',
        deviceId: 'DEV001',
        deviceName: 'HP ProLiant DL380 Gen10',
        model: 'DL380-G10',
        serialNumber: 'HP001ABC123',
        quantity: 2,
        condition: 'new',
        purpose: 'installation'
      }
    ],
    destination: 'customer',
    destinationAddress: 'İstanbul, Şişli, Teknik Merkez',
    notes: 'Kurulum için gönderildi',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-17')
  },
  {
    id: 'CARGO002',
    trackingNumber: 'TK987654321',
    type: 'incoming',
    status: 'in_transit',
    sender: 'ABC Teknoloji',
    receiver: 'Destek Merkezi',
    cargoCompany: 'MNG Kargo',
    sentDate: new Date('2024-03-18'),
    devices: [
      {
        id: 'CARGODEV002',
        deviceId: undefined,
        deviceName: 'Dell PowerEdge R540',
        model: 'R540',
        serialNumber: 'DELL001XYZ',
        quantity: 1,
        condition: 'damaged',
        purpose: 'repair'
      }
    ],
    destination: 'headquarters',
    destinationAddress: 'İstanbul, Merkez Ofis',
    notes: 'Arızalı cihaz tamiri için gönderildi',
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-19')
  }
]

export const mockDeviceRepairs: DeviceRepair[] = [
  {
    id: 'REP001',
    repairNumber: 'TAM-2024-001',
    deviceName: 'Dell PowerEdge R540',
    model: 'R540',
    serialNumber: 'DELL001XYZ',
    companyId: '3',
    companyName: 'ABC Teknoloji',
    customerId: '3',
    customerName: 'Ali Demir',
    receivedDate: new Date('2024-03-05'),
    problemDescription: 'Sunucu boot olmuyor, power LED yanmıyor',
    status: 'completed',
    priority: 'high',
    assignedTechnician: '2',
    technicianName: 'Ahmet Yılmaz',
    estimatedCompletionDate: new Date('2024-03-12'),
    actualCompletionDate: new Date('2024-03-10'),
    repairCost: 850,
    isWarranty: false,
    partsUsed: [
      {
        id: 'PART001',
        partName: 'Power Supply Unit',
        partNumber: 'PSU-550W-80Plus',
        quantity: 1,
        unitPrice: 750,
        totalPrice: 750,
        supplier: 'Dell Türkiye',
        warrantyMonths: 24,
        usedDate: new Date('2024-03-08')
      }
    ],
    repairNotes: [
      {
        id: 'NOTE001',
        note: 'Power supply arızası tespit edildi',
        author: '2',
        authorName: 'Ahmet Yılmaz',
        createdAt: new Date('2024-03-06'),
        type: 'diagnostic'
      },
      {
        id: 'NOTE002',
        note: 'Yeni power supply takıldı ve test edildi',
        author: '2',
        authorName: 'Ahmet Yılmaz',
        createdAt: new Date('2024-03-08'),
        type: 'repair'
      }
    ],
    finalReport: 'Power supply değişimi yapıldı. Cihaz normal çalışır durumda.',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'REP002',
    repairNumber: 'TAM-2024-002',
    deviceName: 'HP ProLiant ML350',
    model: 'ML350-G9',
    serialNumber: 'HP002DEF456',
    companyId: '1',
    companyName: 'Teknoloji A.Ş.',
    customerId: '1',
    customerName: 'Mehmet Özkan',
    receivedDate: new Date('2024-03-15'),
    problemDescription: 'RAID kontrolcü arızası, diskler görünmüyor',
    status: 'repairing',
    priority: 'urgent',
    assignedTechnician: '3',
    technicianName: 'Ayşe Demir',
    estimatedCompletionDate: new Date('2024-03-25'),
    repairCost: 1200,
    isWarranty: true,
    warrantyEndDate: new Date('2025-06-30'),
    partsUsed: [],
    repairNotes: [
      {
        id: 'NOTE003',
        note: 'RAID kontrolcü sorunu tespit edildi',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-16'),
        type: 'diagnostic'
      },
      {
        id: 'NOTE004',
        note: 'Garanti kapsamında yeni kontrolcü bekleniyor',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-17'),
        type: 'general'
      }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-19')
  }
]

export const mockVendors: Vendor[] = [
  {
    id: 'VENDOR001',
    name: 'Micros',
    type: 'manufacturer',
    contactPerson: 'Can Yılmaz',
    contactPhone: '+90 212 555 0101',
    contactEmail: 'can.yilmaz@micros.com',
    address: 'İstanbul, Türkiye',
    notes: 'POS cihazları üreticisi ve servis sağlayıcısı',
    active: true,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'VENDOR002',
    name: 'RobotPOS',
    type: 'manufacturer',
    contactPerson: 'Elif Demir',
    contactPhone: '+90 216 555 0202',
    contactEmail: 'elif.demir@robotpos.com',
    address: 'Ankara, Türkiye',
    notes: 'Yerli POS çözümleri üreticisi',
    active: true,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'VENDOR003',
    name: 'Epson Servis',
    type: 'service_provider',
    contactPerson: 'Mehmet Kaya',
    contactPhone: '+90 312 555 0303',
    contactEmail: 'mehmet.kaya@epsonservis.com',
    address: 'İzmir, Türkiye',
    notes: 'Epson yazıcı servisi',
    active: true,
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'VENDOR004',
    name: 'HP Authorized Service',
    type: 'service_provider',
    contactPerson: 'Ayşe Öztürk',
    contactPhone: '+90 212 555 0404',
    contactEmail: 'ayse.ozturk@hpservice.com',
    address: 'İstanbul, Türkiye',
    notes: 'HP yetkili servisi',
    active: true,
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2024-03-20')
  }
]

export const mockVendorProducts: VendorProduct[] = [
  {
    id: 'VP001',
    vendorId: 'VENDOR001',
    vendorName: 'Micros',
    productType: 'pos',
    productName: 'Micros Workstation 6',
    model: 'WS6-700',
    serialNumber: 'MICROS001ABC',
    businessName: 'Cafe Istanbul',
    companyId: '1',
    currentStatus: 'at_vendor',
    entryDate: new Date('2024-03-18'),
    estimatedCompletionDate: new Date('2024-03-25'),
    problemDescription: 'Ekran dokunmatik çalışmıyor, güç tuşu arızalı',
    vendorAction: 'Ekran değişimi yapılacak',
    cost: 1500,
    isPaidByVendor: true,
    statusHistory: [
      {
        id: 'VPSH001',
        status: 'at_vendor',
        statusDate: new Date('2024-03-18'),
        notes: 'Cihaz tedarikçiye gönderildi',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      }
    ],
    notes: 'Garanti kapsamında',
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-18')
  },
  {
    id: 'VP002',
    vendorId: 'VENDOR001',
    vendorName: 'Micros',
    productType: 'pos',
    productName: 'Micros Workstation 5A',
    model: 'WS5A-500',
    serialNumber: 'MICROS002XYZ',
    businessName: 'Restaurant Moda',
    companyId: '2',
    currentStatus: 'in_testing',
    entryDate: new Date('2024-03-10'),
    exitDate: new Date('2024-03-20'),
    problemDescription: 'Yazılım güncellemesi sonrası açılmıyor',
    vendorAction: 'Yazılım yeniden yüklendi',
    cost: 0,
    isPaidByVendor: true,
    statusHistory: [
      {
        id: 'VPSH002',
        status: 'at_vendor',
        statusDate: new Date('2024-03-10'),
        notes: 'Cihaz tedarikçiye gönderildi',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      },
      {
        id: 'VPSH003',
        status: 'in_testing',
        statusDate: new Date('2024-03-20'),
        notes: 'Tamir tamamlandı, test ediliyor',
        updatedBy: '3',
        updatedByName: 'Ayşe Demir'
      }
    ],
    notes: 'Garanti kapsamında ücretsiz tamir',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'VP003',
    vendorId: 'VENDOR002',
    vendorName: 'RobotPOS',
    productType: 'pos',
    productName: 'Robot POS X5',
    model: 'RPX5-PRO',
    serialNumber: 'ROBOT001ABC',
    businessName: 'Market 24',
    companyId: '3',
    currentStatus: 'at_vendor',
    entryDate: new Date('2024-03-15'),
    estimatedCompletionDate: new Date('2024-03-22'),
    problemDescription: 'Termal yazıcı çalışmıyor',
    vendorAction: 'Yazıcı kafası değişimi',
    cost: 850,
    isPaidByVendor: false,
    statusHistory: [
      {
        id: 'VPSH004',
        status: 'at_vendor',
        statusDate: new Date('2024-03-15'),
        notes: 'Tedarikçide tamir için bekliyor',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      }
    ],
    notes: 'Garanti dışı, ücretli tamir',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'VP004',
    vendorId: 'VENDOR002',
    vendorName: 'RobotPOS',
    productType: 'pos',
    productName: 'Robot POS Mini',
    model: 'RPM-2024',
    serialNumber: 'ROBOT002DEF',
    businessName: 'Kafe Latte',
    companyId: '1',
    currentStatus: 'completed',
    entryDate: new Date('2024-03-01'),
    exitDate: new Date('2024-03-12'),
    problemDescription: 'Barkod okuyucu arızalı',
    vendorAction: 'Barkod okuyucu değiştirildi',
    cost: 0,
    isPaidByVendor: true,
    statusHistory: [
      {
        id: 'VPSH005',
        status: 'at_vendor',
        statusDate: new Date('2024-03-01'),
        notes: 'Cihaz tedarikçiye gönderildi',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      },
      {
        id: 'VPSH006',
        status: 'in_transit',
        statusDate: new Date('2024-03-12'),
        notes: 'Tamir tamamlandı, kargoya verildi',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      },
      {
        id: 'VPSH007',
        status: 'completed',
        statusDate: new Date('2024-03-14'),
        notes: 'Müşteriye teslim edildi',
        updatedBy: '3',
        updatedByName: 'Ayşe Demir'
      }
    ],
    notes: 'Başarılı şekilde tamamlandı',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-14')
  },
  {
    id: 'VP005',
    vendorId: 'VENDOR003',
    vendorName: 'Epson Servis',
    productType: 'printer',
    productName: 'Epson TM-T88VI',
    model: 'TM-T88VI',
    serialNumber: 'EPSON001XYZ',
    businessName: 'Süpermarket Plus',
    companyId: '2',
    currentStatus: 'in_testing',
    entryDate: new Date('2024-03-12'),
    exitDate: new Date('2024-03-19'),
    problemDescription: 'Kağıt sıkışması sürekli oluyor',
    vendorAction: 'Kağıt yolu temizlendi ve sensör ayarlandı',
    cost: 0,
    isPaidByVendor: true,
    statusHistory: [
      {
        id: 'VPSH008',
        status: 'at_vendor',
        statusDate: new Date('2024-03-12'),
        notes: 'Epson servise gönderildi',
        updatedBy: '3',
        updatedByName: 'Ayşe Demir'
      },
      {
        id: 'VPSH009',
        status: 'in_testing',
        statusDate: new Date('2024-03-19'),
        notes: 'Tamir tamamlandı, ofiste test ediliyor',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      }
    ],
    notes: 'Garanti kapsamında tamir edildi',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-19')
  },
  {
    id: 'VP006',
    vendorId: 'VENDOR004',
    vendorName: 'HP Authorized Service',
    productType: 'printer',
    productName: 'HP LaserJet Pro M404dn',
    model: 'M404dn',
    serialNumber: 'HP001ABC123',
    businessName: 'Ofis Merkezi A.Ş.',
    companyId: '3',
    currentStatus: 'at_vendor',
    entryDate: new Date('2024-03-16'),
    estimatedCompletionDate: new Date('2024-03-28'),
    problemDescription: 'Kağıt besleme ünitesi arızalı, toner kartuşu tanımıyor',
    vendorAction: 'Besleme ünitesi ve toner sensörü değişimi',
    cost: 1200,
    isPaidByVendor: false,
    statusHistory: [
      {
        id: 'VPSH010',
        status: 'at_vendor',
        statusDate: new Date('2024-03-16'),
        notes: 'HP servise gönderildi, parça bekliyor',
        updatedBy: '2',
        updatedByName: 'Ahmet Yılmaz'
      }
    ],
    notes: 'Garanti dışı, parça bekliyor',
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-16')
  }
]
