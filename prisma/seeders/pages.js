const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Daftar nama page yang diambil dari struktur folder pada gambar
const pageNames = [
  'auth',
  'cart-items',
  'carts',
  'categories',
  'consultation-files',
  'consultation-materials',
  'consultations',
  'custom-orders',
  'order-items',
  'orders',
  'payments',
  'portofolio',
  'product-variants',
  'production-logs',
  'production-stages',
  'products',
  'role',
  'salary-logs',
  'staffs',
  'stages',
  'tracking-histories',
  'trackings',
  'users'
];

async function main() {
  console.log('🌱 Seeding pages...');
  
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pageNames.length; i++) {
    const pageName = pageNames[i];
    const nomor = i + 1; // nomor dimulai dari 1, 2, 3, ...
    
    try {
      // Cek apakah page sudah ada berdasarkan name
      const existingPage = await prisma.page.findFirst({
        where: { name: pageName }
      });
      
      if (existingPage) {
        // Jika sudah ada, skip
        skippedCount++;
        console.log(`⏭️  Page already exists: ${pageName} (ID: ${existingPage.id}, nomor: ${existingPage.nomor})`);
      } else {
        // Buat baru jika belum ada
        const page = await prisma.page.create({
          data: { 
            name: pageName,
            nomor: nomor
          }
        });
        createdCount++;
        console.log(`✅ Created page: ${pageName} (ID: ${page.id}, nomor: ${page.nomor})`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing page "${pageName}":`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${createdCount} new pages`);
  console.log(`⏭️  Skipped: ${skippedCount} existing pages`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total: ${pageNames.length} pages processed`);
  
  // Verifikasi semua page berhasil dibuat
  const allPages = await prisma.page.findMany({
    orderBy: { nomor: 'asc' }
  });
  
  console.log(`\n📄 All pages in database (${allPages.length} total):`);
  allPages.forEach(page => {
    console.log(`  ${page.nomor}. ${page.name} (ID: ${page.id})`);
  });
}

async function down() {
  try {
    console.log('🗑️ Rolling back page seeds...');
    
    // Hapus hanya page yang namanya ada di daftar
    for (const pageName of pageNames) {
      await prisma.page.deleteMany({
        where: { name: pageName }
      });
    }
    
    console.log(`↩️ Rollback completed: ${pageNames.length} pages deleted`);
  } catch (error) {
    console.error('❌ Error while performing rollback:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ekspor fungsi untuk digunakan di seed runner
module.exports = { main, down };

// Jika dijalankan langsung
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}