const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import fungsi main dari file individual
// Sesuaikan require path-nya dengan file yang ada di folder seeders kamu
const seedRoles = require('./seeders/roles').main;
const seedPages = require('./seeders/pages').main;
const seedAccesses = require('./seeders/accesses').main;
const seedCategories = require('./seeders/categories').main;
const seedUsers = require('./seeders/users').main;
const seedStaffs = require('./seeders/staffs').main;
const seedProducts = require('./seeders/products').main;
const seedOrders = require('./seeders/orders').main;

async function main() {
    console.log('🚀 Start seeding...');

    // Eksekusi berurutan (Urutan ini krusial untuk relasi Database)
    await seedRoles(prisma);
    await seedPages(prisma);
    await seedAccesses(prisma);
    await seedCategories(prisma);
    await seedUsers(prisma);
    // await seedStaffs(prisma);
    // await seedProducts(prisma);
    // await seedOrders(prisma);

    console.log('✅ Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });