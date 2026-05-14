// prisma/seeders/sub_categories.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding subcategories...');

  // Pastikan kategori sudah ada, jika belum buat (gunakan findFirst karena name bukan unique)
  const categories = [
    { name: 'Neck', description: 'Jenis kerah / leher' },
    { name: 'Sleeve', description: 'Jenis lengan' },
    { name: 'Material', description: 'Jenis bahan' },
    { name: 'Printing', description: 'Jenis sablon/printing' },
  ];

  const createdCategories = [];

  for (const cat of categories) {
    let existing = await prisma.category.findFirst({
      where: { name: cat.name }
    });
    if (!existing) {
      existing = await prisma.category.create({
        data: { name: cat.name }
      });
      console.log(`✅ Created category: ${cat.name} (ID: ${existing.id})`);
    } else {
      console.log(`⏭️  Category already exists: ${cat.name} (ID: ${existing.id})`);
    }
    createdCategories.push(existing);
  }

  // Ambil kategori yang sudah ada
  const neckCat = createdCategories.find(c => c.name === 'Neck');
  const sleeveCat = createdCategories.find(c => c.name === 'Sleeve');
  const materialCat = createdCategories.find(c => c.name === 'Material');
  const printingCat = createdCategories.find(c => c.name === 'Printing');

  const subCategories = [
    // Neck subcategories
    { category_id: neckCat.id, name: 'V-Neck', description: 'Leher berbentuk V' },
    { category_id: neckCat.id, name: 'O-Neck', description: 'Leher bulat (Round Neck)' },
    { category_id: neckCat.id, name: 'Crew Neck', description: 'Leher kerah biasa' },
    { category_id: neckCat.id, name: 'Turtle Neck', description: 'Leher tinggi' },
    { category_id: neckCat.id, name: 'Hoodie Neck', description: 'Leher berkerudung' },

    // Sleeve subcategories
    { category_id: sleeveCat.id, name: 'Short Sleeve', description: 'Lengan pendek' },
    { category_id: sleeveCat.id, name: 'Long Sleeve', description: 'Lengan panjang' },
    { category_id: sleeveCat.id, name: 'Raglan Sleeve', description: 'Lengan raglan' },
    { category_id: sleeveCat.id, name: 'Sleeveless', description: 'Tanpa lengan' },

    // Material subcategories
    { category_id: materialCat.id, name: 'Cotton Combed', description: 'Katun combed 30s' },
    { category_id: materialCat.id, name: 'Cotton Bamboo', description: 'Katun bamboo' },
    { category_id: materialCat.id, name: 'Polyester', description: 'Polyester' },
    { category_id: materialCat.id, name: 'Spandex', description: 'Spandex / lycra' },

    // Printing subcategories
    { category_id: printingCat.id, name: 'Screen Printing', description: 'Sablon manual' },
    { category_id: printingCat.id, name: 'DTF', description: 'Direct to Film' },
    { category_id: printingCat.id, name: 'DTG', description: 'Direct to Garment' },
    { category_id: printingCat.id, name: 'Sublimation', description: 'Sublimasi' },
    { category_id: printingCat.id, name: 'Embroidery', description: 'Bordir' },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const sub of subCategories) {
    const existing = await prisma.subCategory.findFirst({
      where: { name: sub.name, category_id: sub.category_id }
    });

    if (existing) {
      skippedCount++;
      console.log(`⏭️  SubCategory already exists: ${sub.name}`);
    } else {
      await prisma.subCategory.create({ data: sub });
      createdCount++;
      console.log(`✅ Created subcategory: ${sub.name} (Category: ${sub.category_id})`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${createdCount} new subcategories`);
  console.log(`⏭️  Skipped: ${skippedCount} existing subcategories`);

  // Tampilkan semua subcategories yang ada
  const allSubCategories = await prisma.subCategory.findMany({
    include: { category: true },
    orderBy: { category_id: 'asc' }
  });

  console.log(`\n📋 All subcategories in database (${allSubCategories.length} total):`);
  allSubCategories.forEach(sc => {
    console.log(`  - ${sc.category?.name} → ${sc.name}`);
  });
}

async function down() {
  console.log('🗑️ Rolling back subcategories...');
  await prisma.subCategory.deleteMany();
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ SubCategory seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}