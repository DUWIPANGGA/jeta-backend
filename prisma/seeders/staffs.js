// prisma/seeders/staff.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding staff users and staff records...');
 
    // Cari role staff (asumsi name = 'staff')
    let staffRole = await prisma.role.findFirst({ where: { name: 'staff' } });
    if (!staffRole) {
        // Jika role staff belum ada, buat role baru
        staffRole = await prisma.role.create({
            data: {
                name: 'staff',
                level: 3,
                description: 'Staff karyawan',
            },
        });
        console.log('✅ Role staff created with id:', staffRole.id);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const staffUsers = [
        { name: 'Staff Satu', email: 'staff1@example.com', phone: '08123456789', address: 'Jl. Merdeka No. 1' },
        { name: 'Staff Dua', email: 'staff2@example.com', phone: '08123456780', address: 'Jl. Sudirman No. 2' },
        { name: 'Staff Tiga', email: 'staff3@example.com', phone: '08123456781', address: 'Jl. Thamrin No. 3' },
    ];

    let createdUserCount = 0;
    let existingUserCount = 0;

    for (const staff of staffUsers) {
        // Upsert user dengan role staff
        const user = await prisma.user.upsert({
            where: { email: staff.email },
            update: {},
            create: {
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                password: hashedPassword,
                role_id: staffRole.id,
                address: staff.address,
                email_verified_at: new Date(),
            },
        });
        if (user.created_at === user.updated_at) {
            createdUserCount++;
            console.log(`✅ Created user: ${staff.email}`);
        } else {
            existingUserCount++;
            console.log(`⏭️  User already exists: ${staff.email}`);
        }

        // Upsert staff record (tabel Staff) yang terhubung ke user
        const today = new Date();
        await prisma.staff.upsert({
            where: { user_id: user.id },
            update: {
                // Misal update salary atau tgl_masuk jika perlu
                tgl_masuk: today,
                salary: 0,
            },
            create: {
                user_id: user.id,
                tgl_masuk: today,
                salary: 0,
            },
        });
        console.log(`   → Staff record for user ID ${user.id} (${staff.name}) created/updated.`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created new users: ${createdUserCount}`);
    console.log(`⏭️  Skipped existing users: ${existingUserCount}`);
    console.log(`✅ All staff records are linked.`);

    // Opsional: tampilkan daftar staff yang berhasil
    const allStaff = await prisma.staff.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log(`\n📋 Staff records in database:`);
    allStaff.forEach(s => {
        console.log(`  - ID Staff: ${s.id} | User: ${s.user.name} (${s.user.email}) | Salary: ${s.salary} | Tgl Masuk: ${s.tgl_masuk.toISOString().slice(0, 10)}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Seeder gagal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });