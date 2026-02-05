const vendors = [
  {
    name: 'Micros TÃ¼rkiye',
    type: 'MANUFACTURER',
    contactPerson: 'Ahmet YÄ±lmaz',
    contactPhone: '0212 555 1234',
    contactEmail: 'ahmet@micros.com.tr',
    address: 'Ä°stanbul, TÃ¼rkiye',
    notes: 'POS sistemleri Ã¼reticisi',
    active: true,
  },
  {
    name: 'RobotPOS Servis',
    type: 'SERVICE_PROVIDER',
    contactPerson: 'Mehmet Demir',
    contactPhone: '0216 555 5678',
    contactEmail: 'mehmet@robotpos.com',
    address: 'Ankara, TÃ¼rkiye',
    notes: 'Yetkili servis merkezi',
    active: true,
  },
  {
    name: 'Pos Teknik',
    type: 'DISTRIBUTOR',
    contactPerson: 'AyÅŸe Kaya',
    contactPhone: '0232 555 9012',
    contactEmail: 'ayse@posteknik.com',
    address: 'Ä°zmir, TÃ¼rkiye',
    notes: 'DistribÃ¼tÃ¶r firma',
    active: true,
  },
  {
    name: 'NCR TÃ¼rkiye',
    type: 'MANUFACTURER',
    contactPerson: 'Fatma Åahin',
    contactPhone: '0212 555 3456',
    contactEmail: 'fatma@ncr.com.tr',
    address: 'Ä°stanbul, TÃ¼rkiye',
    notes: 'Global POS Ã¼reticisi',
    active: true,
  },
];

async function addVendors() {
  for (const vendor of vendors) {
    try {
      const response = await fetch('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendor),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`âœ“ Added vendor: ${vendor.name}`);
      } else {
        const error = await response.text();
        console.error(`âœ— Failed to add ${vendor.name}:`, error);
      }
    } catch (error) {
      console.error(`âœ— Error adding ${vendor.name}:`, error.message);
    }
  }
  console.log('\nâœ“ Vendor seeding completed!');
}

addVendors();

