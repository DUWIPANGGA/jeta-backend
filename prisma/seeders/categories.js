const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
    { name: 'Pakaian Pria' },
    { name: 'Pakaian Wanita' },
    { name: 'Pakaian Anak' },
    { name: 'Aksesoris' },
    { name: 'Sepatu' },
    { name: 'Tas' },
    { name: 'Alat Olahraga' },
    { name: 'Perlengkapan Rumah' },
];

async function main() {
    console.log('🌱 Seeding categories...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
        const existingCategory = await prisma.category.findFirst({
            where: { name: category.name }
        });

        if (existingCategory) {
            skippedCount++;
            console.log(`⏭️  Category already exists: ${category.name} (ID: ${existingCategory.id})`);
        } else {
            const newCategory = await prisma.category.create({
                data: category
            });
            createdCount++;
            console.log(`✅ Created category: ${newCategory.name} (ID: ${newCategory.id})`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new categories`);
    console.log(`⏭️  Skipped: ${skippedCount} existing categories`);
    console.log(`📋 Total: ${categories.length} categories processed`);

    // Verifikasi
    const allCategories = await prisma.category.findMany({
        orderBy: { id: 'asc' }
    });

    console.log(`\n📄 All categories in database (${allCategories.length} total):`);
    allCategories.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.name}`);
    });
}

async function down() {
    console.log('🗑️ Rolling back categories...');

    for (const category of categories) {
        await prisma.category.deleteMany({
            where: { name: category.name }
        });
    }

    console.log(`↩️ Rollback completed: ${categories.length} categories deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Category seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}