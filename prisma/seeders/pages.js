// prisma/seeders/pages.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Daftar page sesuai dengan page ID yang sudah ditentukan
const pages = [
  { id: 1, nomor: 1, name: 'Auth' },
  { id: 2, nomor: 2, name: 'Carts' },
  { id: 3, nomor: 3, name: 'Categories' },
  // SubCategories sudah dihapus (digantikan oleh VariantOptions)
  { id: 4, nomor: 4, name: 'Products' },  // digeser ke 4
  { id: 5, nomor: 5, name: 'ProductVariants' },
  { id: 6, nomor: 6, name: 'ConsultationFiles' },
  { id: 7, nomor: 7, name: 'ConsultationMaterials' },
  { id: 8, nomor: 8, name: 'Consultations' },
  { id: 9, nomor: 9, name: 'CustomOrders' },
  { id: 10, nomor: 10, name: 'CustomerData' },
  { id: 11, nomor: 11, name: 'Finance' },
  { id: 12, nomor: 12, name: 'Guest' },
  { id: 13, nomor: 13, name: 'Logistics' },
  { id: 14, nomor: 14, name: 'OrderItems' },
  { id: 15, nomor: 15, name: 'Orders' },
  { id: 16, nomor: 16, name: 'Pages' },
  { id: 17, nomor: 17, name: 'PaymentMethods' },
  { id: 18, nomor: 18, name: 'Payments' },
  { id: 19, nomor: 19, name: 'Portofolio' },
  { id: 20, nomor: 20, name: 'ProductionLogs' },
  { id: 21, nomor: 21, name: 'ProgressReports' },
  { id: 22, nomor: 22, name: 'Projects' },
  { id: 23, nomor: 23, name: 'Reports' },
  { id: 24, nomor: 24, name: 'Roles' },
  { id: 25, nomor: 25, name: 'SalaryLogs' },
  { id: 26, nomor: 26, name: 'SalaryProjects' },
  { id: 27, nomor: 27, name: 'Staffs' },
  { id: 28, nomor: 28, name: 'Stages' },
  { id: 29, nomor: 29, name: 'TrackingHistories' },
  { id: 30, nomor: 30, name: 'Trackings' },
  { id: 31, nomor: 31, name: 'Users' },
  { id: 32, nomor: 32, name: 'WorkLogs' },
  // Module baru
  { id: 33, nomor: 33, name: 'Sizes' },
  { id: 34, nomor: 34, name: 'Colors' },
  { id: 35, nomor: 35, name: 'Attributes' },
  { id: 36, nomor: 36, name: 'Materials' },
  { id: 37, nomor: 37, name: 'CustomVariants' },
  { id: 38, nomor: 38, name: 'VariantOptions' },
  { id: 39, nomor: 39, name: 'Summary' },
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