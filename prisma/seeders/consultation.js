const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding consultation entries...');

    const users = await prisma.user.findMany({
        take: 2,
        select: { id: true }
    });

    if (users.length === 0) {
        console.log('⚠️ Tidak ada user ditemukan. Seeder consultation dibatalkan.');
        return;
    }

    await prisma.consultationFile.deleteMany();
    await prisma.consultationMaterial.deleteMany();
    await prisma.consultation.deleteMany();
    console.log('🗑️ Consultations cleared.');

    const c1 = await prisma.consultation.create({
        data: {
            user_id: users[0].id,
            message: 'Saya ingin konsultasi mengenai pembuatan jersey tim sepak bola sebanyak 30 pcs dengan dry-fit premium.',
            quantity_estimate: '30 pcs',
            status: 'pending',
        }
    });

    await prisma.consultationMaterial.create({
        data: {
            consultation_id: c1.id,
            material_name: 'Dry-fit Premium',
            material_type: 'Polyester Blend',
            color_require: 'Biru Dongker & Emas',
            sample_required: true
        }
    });

    await prisma.consultationFile.create({
        data: {
            consultation_id: c1.id,
            file_name: 'jersey-tim-desain.pdf',
            file_path: '/uploads/consultations/jersey-tim-desain.pdf'
        }
    });

    const c2 = await prisma.consultation.create({
        data: {
            user_id: users.length > 1 ? users[1].id : users[0].id,
            message: 'Konsultasi desain seragam kemeja kerja kantor untuk 150 staf.',
            quantity_estimate: '150 pcs',
            status: 'completed',
        }
    });

    await prisma.consultationMaterial.create({
        data: {
            consultation_id: c2.id,
            material_name: 'Kain Drill American',
            material_type: 'Cotton Blend',
            color_require: 'Abu-abu & Hitam',
            sample_required: false
        }
    });

    console.log('✅ Consultation entries seeded.');
}

async function down() {
    await prisma.consultationFile.deleteMany();
    await prisma.consultationMaterial.deleteMany();
    await prisma.consultation.deleteMany();
    console.log('🗑️ Consultations deleted.');
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Consultation seeding failed:', e))
        .finally(() => prisma.$disconnect());
}
