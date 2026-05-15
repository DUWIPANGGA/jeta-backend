// prisma/seeders/pages.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Daftar page sesuai dengan page ID yang sudah ditentukan
const pages = [
  { id: 1, nomor: 1, name: 'Auth' },
  { id: 2, nomor: 2, name: 'Carts' },
  { id: 3, nomor: 3, name: 'Categories' },
  { id: 4, nomor: 4, name: 'SubCategories' },
  { id: 5, nomor: 5, name: 'Products' },
  { id: 6, nomor: 6, name: 'ProductVariants' },
  { id: 7, nomor: 7, name: 'ConsultationFiles' },
  { id: 8, nomor: 8, name: 'ConsultationMaterials' },
  { id: 9, nomor: 9, name: 'Consultations' },
  { id: 10, nomor: 10, name: 'CustomOrders' },
  { id: 11, nomor: 11, name: 'CustomerData' },
  { id: 12, nomor: 12, name: 'Finance' },
  { id: 13, nomor: 13, name: 'Guest' },
  { id: 14, nomor: 14, name: 'Logistics' },
  { id: 15, nomor: 15, name: 'OrderItems' },
  { id: 16, nomor: 16, name: 'Orders' },
  { id: 17, nomor: 17, name: 'Pages' },
  { id: 18, nomor: 18, name: 'PaymentMethods' },
  { id: 19, nomor: 19, name: 'Payments' },
  { id: 20, nomor: 20, name: 'Portofolio' },
  { id: 21, nomor: 21, name: 'ProductionLogs' },
  { id: 22, nomor: 22, name: 'ProgressReports' },
  { id: 23, nomor: 23, name: 'Projects' },
  { id: 24, nomor: 24, name: 'Reports' },
  { id: 25, nomor: 25, name: 'Roles' },
  { id: 26, nomor: 26, name: 'SalaryLogs' },
  { id: 27, nomor: 27, name: 'SalaryProjects' },
  { id: 28, nomor: 28, name: 'Staffs' },
  { id: 29, nomor: 29, name: 'Stages' },
  { id: 30, nomor: 30, name: 'TrackingHistories' },
  { id: 31, nomor: 31, name: 'Trackings' },
  { id: 32, nomor: 32, name: 'Users' },
  { id: 33, nomor: 33, name: 'WorkLogs' },
];

async function main() {
  console.log('🌱 Seeding pages...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const page of pages) {
    const existingPage = await prisma.page.findUnique({
      where: { id: page.id }
    });

    if (existingPage) {
      // Update jika ada perbedaan
      if (existingPage.name !== page.name || existingPage.nomor !== page.nomor) {
        await prisma.page.update({
          where: { id: page.id },
          data: { name: page.name, nomor: page.nomor }
        });
        updatedCount++;
        console.log(`🔄 Updated page: ${page.name} (ID: ${page.id}, nomor: ${page.nomor})`);
      } else {
        console.log(`⏭️  Page already exists: ${page.name} (ID: ${page.id})`);
      }
    } else {
      await prisma.page.create({ data: page });
      createdCount++;
      console.log(`✅ Created page: ${page.name} (ID: ${page.id}, nomor: ${page.nomor})`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${createdCount} new pages`);
  console.log(`🔄 Updated: ${updatedCount} existing pages`);

  const allPages = await prisma.page.findMany({ orderBy: { nomor: 'asc' } });
  console.log(`\n📄 All pages in database (${allPages.length} total):`);
  allPages.forEach(page => {
    console.log(`  ${page.nomor}. ${page.name} (ID: ${page.id})`);
  });
}

async function down() {
  console.log('🗑️ Rolling back pages...');
  await prisma.page.deleteMany({});
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch(e => console.error('❌ Page seed failed:', e))
    .finally(() => prisma.$disconnect());
}