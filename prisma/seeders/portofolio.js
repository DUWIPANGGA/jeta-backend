const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding portofolio items...');

    const portofolios = [
        { name: 'Jaket Bomber JETA Official', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', description: 'Jaket Bomber kustom premium dengan bordir komputer kualitas tinggi untuk komunitas JETA.', order: 1 },
        { name: 'Kaos Oversized Heavy Cotton', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', description: 'Kaos berukuran besar dengan sablon Plastisol tahan lama menggunakan kain Heavy Cotton 20s.', order: 2 },
        { name: 'Topi Trucker Bordir Logo', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500', description: 'Topi model jaring/trucker dengan bordir logo timbul premium untuk merchandise resmi JETA.', order: 3 },
    ];

    await prisma.portofolio.deleteMany();
    console.log('🗑️ Portofolios cleared.');

    for (const item of portofolios) {
        await prisma.portofolio.create({
            data: item
        });
    }
    console.log('✅ Portofolios seeded.');
}

async function down() {
    await prisma.portofolio.deleteMany();
    console.log('🗑️ Portofolios deleted.');
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Portofolio seeding failed:', e))
        .finally(() => prisma.$disconnect());
}
