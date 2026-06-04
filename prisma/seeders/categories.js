const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Jersey', status: true },
  { name: 'Jaket', status: true },
  { name: 'Celana', status: true },
  { name: 'Kaos', status: true },
  { name: 'Aksesoris', status: true },
  { name: 'Kaos Kaki', status: true },
];

async function main() {
  console.log('🌱 Seeding categories...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (existing) {
      skippedCount++;
      console.log(`⏭️  Category already exists: ${category.name} (ID: ${existing.id})`);
    } else {
      const newCat = await prisma.category.create({ data: category });
      createdCount++;
      console.log(`✅ Created category: ${newCat.name} (ID: ${newCat.id})`);
    }
  }

  console.log(`\n📊 Summary: ${createdCount} created, ${skippedCount} skipped`);
}

async function down() {
  for (const category of categories) {
    await prisma.category.deleteMany({ where: { name: category.name } });
  }
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}
