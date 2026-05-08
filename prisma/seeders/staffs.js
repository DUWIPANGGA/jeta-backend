const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Cari role staff
    let staffRole = await prisma.role.findFirst({ where: { name: 'staff' } });
    if (!staffRole) {
        staffRole = await prisma.role.create({ data: { name: 'staff' } });
        console.log('Role staff created with id:', staffRole.id);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const staffs = [
        { name: 'Staff Satu', email: 'staff1@example.com', phone: '08123456789', address: 'Jl. Merdeka No. 1' },
        { name: 'Staff Dua', email: 'staff2@example.com', phone: '08123456780', address: 'Jl. Sudirman No. 2' },
        { name: 'Staff Tiga', email: 'staff3@example.com', phone: '08123456781', address: 'Jl. Thamrin No. 3' },
    ];

    for (const staff of staffs) {
        await prisma.user.upsert({
            where: { email: staff.email },
            update: {},
            create: {
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                password: hashedPassword,
                role_id: staffRole.id,
                address: staff.address,
            },
        });
    }

    console.log('✅ Staff users seeded');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding staffs:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });