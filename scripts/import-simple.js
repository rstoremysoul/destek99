const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const cleanDate = dateString.trim();

  // Try different date formats
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

async function importCSVData() {
  try {
    console.log('Starting CSV import...');

    const csvPath = path.join(process.cwd(), 'TEKNÄ°K TAKÄ°P LÄ°STESÄ°csv.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Split by lines and remove BOM if present
    const lines = csvContent.replace(/^\uFEFF/, '').split('\n');

    // Get header line and data lines
    const headerLine = lines[0];
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    console.log(`Found ${dataLines.length} data rows`);

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < Math.min(dataLines.length, 200); i++) { // Import first 200 records for testing
      const line = dataLines[i];
      if (line.trim() === '' || line.trim() === ';;;;;;;;;;;;;;;;;;;;;;;') {
        skippedCount++;
        continue;
      }

      const columns = line.split(';');

      // Skip if not enough columns or mostly empty
      if (columns.length < 16) {
        skippedCount++;
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

      // Skip empty rows - need at least business name OR device name
      if ((!businessName || businessName.trim() === '') &&
          (!deviceName || deviceName.trim() === '')) {
        skippedCount++;
        continue;
      }

      try {
        await prisma.technicalService.create({
          data: {
            operatingPersonnel: operatingPersonnel?.trim() || null,
            invoiceDate: parseDate(invoiceDate?.trim()),
            brand: brand?.trim() || null,
            businessName: businessName?.trim() || null,
            deviceName: deviceName?.trim() || null,
            model: model?.trim() || null,
            deviceSerial: deviceSerial?.trim() || null,
            serviceEntryDate: parseDate(serviceEntryDate?.trim()),
            serviceExitDate: parseDate(serviceExitDate?.trim()),
            deviceProblem: deviceProblem?.trim() || null,
            problemDescription: problemDescription?.trim() || null,
            performedAction: performedAction?.trim() || null,
            serviceCost: serviceCost?.trim() || null,
            customerCost: customerCost?.trim() || null,
            approvedBy: approvedBy?.trim() || null,
            connectWritten: connectWritten?.trim() || null,
          },
        });

        importedCount++;

        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount} records...`);
        }
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`Import completed!`);
    console.log(`Imported: ${importedCount} records`);
    console.log(`Skipped: ${skippedCount} records`);

  } catch (error) {
    console.error('Error importing CSV:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCSVData();
