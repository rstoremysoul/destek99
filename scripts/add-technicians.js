// Teknisyen ekleme scripti - tarayÄ±cÄ± console'unda Ã§alÄ±ÅŸtÄ±rÄ±n

const technicians = [
  {
    name: 'Ahmet YÄ±lmaz',
    phone: '0532 123 4567',
    email: 'ahmet.yilmaz@example.com',
    specialization: 'Network & Server',
    active: true,
  },
  {
    name: 'Mehmet Demir',
    phone: '0533 234 5678',
    email: 'mehmet.demir@example.com',
    specialization: 'POS & Printer',
    active: true,
  },
  {
    name: 'AyÅŸe Kaya',
    phone: '0534 345 6789',
    email: 'ayse.kaya@example.com',
    specialization: 'Server & Storage',
    active: true,
  },
  {
    name: 'Fatma Ã‡elik',
    phone: '0535 456 7890',
    email: 'fatma.celik@example.com',
    specialization: 'Network Infrastructure',
    active: true,
  },
];

async function addTechnicians() {
  for (const tech of technicians) {
    try {
      const response = await fetch('http://localhost:3000/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tech),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`âœ“ ${data.name} eklendi`);
      } else {
        console.error(`âœ— ${tech.name} eklenemedi:`, await response.text());
      }
    } catch (error) {
      console.error(`âœ— ${tech.name} eklenirken hata:`, error);
    }
  }
  console.log('\nÄ°ÅŸlem tamamlandÄ±!');
}

addTechnicians();

