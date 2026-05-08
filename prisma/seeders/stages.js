const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const stages = [
        { stage_name: 'Desain', order_index: 1 },
        { stage_name: 'Produksi', order_index: 2 },
        { stage_name: 'Quality Control', order_index: 3 },
        { stage_name: 'Pengiriman', order_index: 4 },
    ];

    for (const stage of stages) {
        await prisma.stage.upsert({
            where: { stage_name: stage.stage_name },
            update: {},
            create: {
                stage_name: stage.stage_name,
                order_index: stage.order_index,
            },
        });
    }

    console.log('✅ Stages seeded');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding stages:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });