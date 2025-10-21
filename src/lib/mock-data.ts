import { SupportTicket, Company, Customer } from '@/types'

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Teknoloji A.Ş.',
    address: 'İstanbul, Türkiye',
    phone: '+90 212 555 0001',
    email: 'info@teknoloji.com'
  },
  {
    id: '2',
    name: 'Yazılım Ltd.',
    address: 'Ankara, Türkiye',
    phone: '+90 312 555 0002',
    email: 'destek@yazilim.com'
  },
  {
    id: '3',
    name: 'Sistem Çözümleri',
    address: 'İzmir, Türkiye',
    phone: '+90 232 555 0003',
    email: 'iletisim@sistem.com'
  },
  {
    id: '4',
    name: 'Dijital Medya',
    address: 'Bursa, Türkiye',
    phone: '+90 224 555 0004',
    email: 'info@dijital.com'
  }
]

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mehmet Özkan',
    email: 'mehmet.ozkan@teknoloji.com',
    phone: '+90 532 555 0101',
    companyId: '1'
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    email: 'ayse.kaya@yazilim.com',
    phone: '+90 533 555 0102',
    companyId: '2'
  },
  {
    id: '3',
    name: 'Ali Demir',
    email: 'ali.demir@sistem.com',
    phone: '+90 534 555 0103',
    companyId: '3'
  },
  {
    id: '4',
    name: 'Fatma Yılmaz',
    email: 'fatma.yilmaz@dijital.com',
    phone: '+90 535 555 0104',
    companyId: '4'
  },
  {
    id: '5',
    name: 'Can Arslan',
    email: 'can.arslan@teknoloji.com',
    phone: '+90 536 555 0105',
    companyId: '1'
  },
  {
    id: '6',
    name: 'Zeynep Şahin',
    email: 'zeynep.sahin@yazilim.com',
    phone: '+90 537 555 0106',
    companyId: '2'
  }
]

export const mockTickets: SupportTicket[] = [
  {
    id: 'T001',
    subject: 'Sunucu bağlantı sorunu',
    description: 'Ana sunucuya bağlanılmıyor. Sistem tamamen durmuş durumda. Acil müdahale gerekiyor.',
    status: 'open',
    priority: 'urgent',
    assignedTo: '2',
    customerId: '1',
    companyId: '1',
    customerName: 'Mehmet Özkan',
    companyName: 'Teknoloji A.Ş.',
    createdAt: new Date('2024-03-15T09:30:00'),
    updatedAt: new Date('2024-03-15T09:30:00'),
    images: [],
    notes: [],
    location: {
      lat: 41.0082,
      lng: 28.9784,
      address: 'İstanbul, Türkiye'
    }
  },
  {
    id: 'T002',
    subject: 'Yazılım güncellemesi hatası',
    description: 'Son güncelleme sonrası uygulama açılmıyor. Hata kodu: ERR_UPDATE_FAILED',
    status: 'in-progress',
    priority: 'high',
    assignedTo: '2',
    customerId: '2',
    companyId: '2',
    customerName: 'Ayşe Kaya',
    companyName: 'Yazılım Ltd.',
    createdAt: new Date('2024-03-14T14:20:00'),
    updatedAt: new Date('2024-03-15T08:45:00'),
    images: [],
    notes: [
      {
        id: 'N001',
        content: 'Uzaktan bağlantı kuruldu. Güncelleme rollback yapıldı.',
        author: '2',
        authorName: 'Ahmet Yılmaz',
        createdAt: new Date('2024-03-15T08:45:00')
      }
    ]
  },
  {
    id: 'T003',
    subject: 'Veri yedekleme problemi',
    description: 'Otomatik yedekleme sistemi çalışmıyor. Son 3 gündür yedek alınmamış.',
    status: 'resolved',
    priority: 'medium',
    assignedTo: '3',
    customerId: '3',
    companyId: '3',
    customerName: 'Ali Demir',
    companyName: 'Sistem Çözümleri',
    createdAt: new Date('2024-03-13T11:15:00'),
    updatedAt: new Date('2024-03-14T16:30:00'),
    images: [],
    notes: [
      {
        id: 'N002',
        content: 'Yedekleme scriptinde hata bulundu ve düzeltildi.',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-14T16:30:00')
      }
    ]
  },
  {
    id: 'T004',
    subject: 'E-posta sistemi yavaşlığı',
    description: 'E-posta gönderim ve alma işlemleri çok yavaş. Kullanıcılar şikayetçi.',
    status: 'open',
    priority: 'medium',
    assignedTo: '2',
    customerId: '4',
    companyId: '4',
    customerName: 'Fatma Yılmaz',
    companyName: 'Dijital Medya',
    createdAt: new Date('2024-03-15T13:45:00'),
    updatedAt: new Date('2024-03-15T13:45:00'),
    images: [],
    notes: []
  },
  {
    id: 'T005',
    subject: 'Yazıcı konfigürasyonu',
    description: 'Yeni yazıcı ağa bağlanamıyor. IP ayarları kontrol edilmeli.',
    status: 'in-progress',
    priority: 'low',
    assignedTo: '3',
    customerId: '5',
    companyId: '1',
    customerName: 'Can Arslan',
    companyName: 'Teknoloji A.Ş.',
    createdAt: new Date('2024-03-15T10:20:00'),
    updatedAt: new Date('2024-03-15T11:00:00'),
    images: [],
    notes: [
      {
        id: 'N003',
        content: 'Sahaya gidilecek. Yarın sabah randevu alındı.',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-15T11:00:00')
      }
    ]
  },
  {
    id: 'T006',
    subject: 'Güvenlik duvarı güncellemesi',
    description: 'Güvenlik duvarı kuralları güncellenmeli. Yeni politikalar uygulanacak.',
    status: 'closed',
    priority: 'high',
    assignedTo: '2',
    customerId: '6',
    companyId: '2',
    customerName: 'Zeynep Şahin',
    companyName: 'Yazılım Ltd.',
    createdAt: new Date('2024-03-12T09:00:00'),
    updatedAt: new Date('2024-03-13T17:30:00'),
    images: [],
    notes: [
      {
        id: 'N004',
        content: 'Tüm güvenlik politikaları başarıyla güncellendi.',
        author: '2',
        authorName: 'Ahmet Yılmaz',
        createdAt: new Date('2024-03-13T17:30:00')
      }
    ]
  },
  {
    id: 'T007',
    subject: 'Mobil uygulama çökme sorunu',
    description: 'iOS uygulaması sürekli çöküyor. Crash report eklendi.',
    status: 'open',
    priority: 'high',
    assignedTo: '2',
    customerId: '1',
    companyId: '1',
    customerName: 'Mehmet Özkan',
    companyName: 'Teknoloji A.Ş.',
    createdAt: new Date('2024-03-15T15:30:00'),
    updatedAt: new Date('2024-03-15T15:30:00'),
    images: [],
    notes: []
  },
  {
    id: 'T008',
    subject: 'Veritabanı performans optimizasyonu',
    description: 'Sorgu süreleri uzun. İndex yapısı gözden geçirilmeli.',
    status: 'in-progress',
    priority: 'medium',
    assignedTo: '3',
    customerId: '2',
    companyId: '2',
    customerName: 'Ayşe Kaya',
    companyName: 'Yazılım Ltd.',
    createdAt: new Date('2024-03-14T16:45:00'),
    updatedAt: new Date('2024-03-15T09:15:00'),
    images: [],
    notes: [
      {
        id: 'N005',
        content: 'Performans analizi tamamlandı. Optimizasyon planı hazırlandı.',
        author: '3',
        authorName: 'Ayşe Demir',
        createdAt: new Date('2024-03-15T09:15:00')
      }
    ]
  }
]

export const getTicketById = (id: string) => {
  return mockTickets.find(ticket => ticket.id === id)
}

export const getCompanyById = (id: string) => {
  return mockCompanies.find(company => company.id === id)
}

export const getCustomerById = (id: string) => {
  return mockCustomers.find(customer => customer.id === id)
}