const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding logistics carriers...');

    const logistics = [
        { name: 'Jalur Nugraha Ekakurir', alias: 'JNE', description: 'JNE Express Delivery', status: true },
        { name: 'J&T Express', alias: 'J&T', description: 'J&T Regular & DFOD Delivery', status: true },
        { name: 'SiCepat Ekspres', alias: 'SiCepat', description: 'SiCepat Regular & Cargo Delivery', status: true },
        { name: 'Pos Indonesia', alias: 'POS', description: 'Pos Indonesia Regular & Kilat Delivery', status: true },
    ];

    for (const item of logistics) {
        await prisma.logistic.upsert({
            where: { alias: item.alias },
            update: {
                name: item.name,
                description: item.description,
                status: item.status
            },
            create: item
        });
    }
    console.log('✅ Logistics carriers seeded.');
}

async function down() {
    await prisma.logistic.deleteMany();
    console.log('🗑️ Logistics deleted.');
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Logistics seeding failed:', e))
        .finally(() => prisma.$disconnect());
}
