const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Known vendor names from the data
const KNOWN_VENDORS = [
  'HUGIN',
  'POS SAFE',
  'POSSIFY',
  'MICROS',
  'ROBOTPOS',
  'EPSON',
  'VINTEC',
  'VITAL LINK',
  'ECHOPOS'
];

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const cleanDate = dateString.trim();
  const formats = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,     // DD.MM.YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{2})/,     // DD.MM.YY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,     // DD/MM/YYYY
  ];

  for (const format of formats) {
    const match = cleanDate.match(format);
    if (match) {
      const [, day, month, year] = match;
      const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;

      try {
        const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function detectVendorFromText(deviceName, problemDescription, performedAction) {
  const text = `${deviceName || ''} ${problemDescription || ''} ${performedAction || ''}`.toUpperCase();

  for (const vendor of KNOWN_VENDORS) {
    if (text.includes(vendor.toUpperCase())) {
      return vendor;
    }
  }

  // Additional vendor detection logic
  if (text.includes('MERKEZE GÃ–NDERÄ°LDÄ°') || text.includes('MERKEZE')) {
    return 'MERKEZ SERVÄ°S';
  }

  if (text.includes('GARANTÄ°') || text.includes('GARANTI')) {
    return 'GARANTÄ° SERVÄ°SÄ°';
  }

  return null;
}

function isAtVendorService(problemDescription, performedAction) {
  const text = `${problemDescription || ''} ${performedAction || ''}`.toUpperCase();

  const vendorKeywords = [
    'MERKEZE GÃ–NDERÄ°LDÄ°',
    'MERKEZE',
    'HUGIN',
    'POS SAFE',
    'POSSIFY',
    'SERVIS ALIYOR',
    'TEDARIKÃ‡I',
    'SERVÄ°SE GÃ–NDERÄ°LDÄ°'
  ];

  return vendorKeywords.some(keyword => text.includes(keyword));
}

async function createVendorRecords() {
  console.log('Creating vendor records...');

  const vendors = [
    { name: 'HUGIN', type: 'REPAIR_SERVICE' },
    { name: 'POS SAFE', type: 'REPAIR_SERVICE' },
    { name: 'POSSIFY', type: 'REPAIR_SERVICE' },
    { name: 'MICROS', type: 'SUPPLIER' },
    { name: 'ROBOTPOS', type: 'SUPPLIER' },
    { name: 'EPSON', type: 'SUPPLIER' },
    { name: 'VINTEC', type: 'SUPPLIER' },
    { name: 'VITAL LINK', type: 'SUPPLIER' },
    { name: 'ECHOPOS', type: 'SUPPLIER' },
    { name: 'MERKEZ SERVÄ°S', type: 'REPAIR_SERVICE' },
    { name: 'GARANTÄ° SERVÄ°SÄ°', type: 'WARRANTY' }
  ];

  for (const vendor of vendors) {
    try {
      await prisma.vendor.create({
        data: vendor
      });
      console.log(`Created vendor: ${vendor.name}`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Vendor already exists: ${vendor.name}`);
      } else {
        console.error(`Error creating vendor ${vendor.name}:`, error.message);
      }
    }
  }
}

async function importVendorTracking() {
  try {
    console.log('Starting vendor tracking import...');

    // First create vendor records
    await createVendorRecords();

    const csvPath = path.join(process.cwd(), 'TEKNÄ°K TAKÄ°P LÄ°STESÄ°csv.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const lines = csvContent.replace(/^\uFEFF/, '').split('\n');
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    console.log(`Found ${dataLines.length} data rows`);

    let vendorTrackingCount = 0;
    let updatedTechnicalServiceCount = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (line.trim() === '' || line.trim() === ';;;;;;;;;;;;;;;;;;;;;;;') {
        continue;
      }

      const columns = line.split(';');
      if (columns.length < 16) {
        continue;
      }

      const [
        operatingPersonnel,
        invoiceDate,
        brand,
        businessName,
        deviceName,
        model,
        deviceSerial,
        serviceEntryDate,
        serviceExitDate,
        deviceProblem,
        problemDescription,
        performedAction,
        serviceCost,
        customerCost,
        approvedBy,
        connectWritten
      ] = columns;

      // Skip empty rows
      if (!businessName?.trim() && !deviceName?.trim()) {
        continue;
      }

      // Detect if device is at vendor
      const detectedVendor = detectVendorFromText(deviceName, problemDescription, performedAction);
      const isAtVendor = isAtVendorService(problemDescription, performedAction);

      try {
        // Find the corresponding technical service record
        const existingRecord = await prisma.technicalService.findFirst({
          where: {
            AND: [
              { businessName: businessName?.trim() || null },
              { deviceName: deviceName?.trim() || null },
              { deviceSerial: deviceSerial?.trim() || null }
            ]
          }
        });

        if (existingRecord && (detectedVendor || isAtVendor)) {
          // Update technical service record with vendor info
          await prisma.technicalService.update({
            where: { id: existingRecord.id },
            data: {
              vendorName: detectedVendor,
              isAtVendor: isAtVendor,
              vendorEntryDate: parseDate(serviceEntryDate?.trim()),
              vendorExitDate: parseDate(serviceExitDate?.trim()),
              vendorStatus: serviceExitDate ? 'RETURNED_FROM_VENDOR' : 'AT_VENDOR'
            }
          });
          updatedTechnicalServiceCount++;

          // Create vendor tracking record if device is at vendor
          if (detectedVendor && isAtVendor) {
            await prisma.vendorTracking.create({
              data: {
                vendorName: detectedVendor,
                deviceName: deviceName?.trim() || null,
                deviceSerial: deviceSerial?.trim() || null,
                businessName: businessName?.trim() || null,
                entryDate: parseDate(serviceEntryDate?.trim()),
                exitDate: parseDate(serviceExitDate?.trim()),
                problemDescription: problemDescription?.trim() || null,
                vendorAction: performedAction?.trim() || null,
                cost: serviceCost?.trim() || null,
                status: serviceExitDate ? 'RETURNED_FROM_VENDOR' : 'AT_VENDOR',
                notes: `${deviceProblem || ''} - ${approvedBy || ''}`.trim()
              }
            });
            vendorTrackingCount++;
          }
        }

        if ((vendorTrackingCount + updatedTechnicalServiceCount) % 50 === 0) {
          console.log(`Processed ${vendorTrackingCount + updatedTechnicalServiceCount} vendor records...`);
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error.message);
      }
    }

    console.log(`Vendor tracking import completed!`);
    console.log(`Created vendor tracking records: ${vendorTrackingCount}`);
    console.log(`Updated technical service records: ${updatedTechnicalServiceCount}`);

    // Show vendor statistics
    const vendorStats = await prisma.vendorTracking.groupBy({
      by: ['vendorName'],
      _count: {
        vendorName: true
      },
      orderBy: {
        _count: {
          vendorName: 'desc'
        }
      }
    });

    console.log('\nVendor Statistics:');
    vendorStats.forEach(stat => {
      console.log(`${stat.vendorName}: ${stat._count.vendorName} devices`);
    });

  } catch (error) {
    console.error('Error importing vendor tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importVendorTracking();
