const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding staff...');

    // Cari user dengan role staff dan admin
    const staffUsers = await prisma.user.findMany({
        where: {
            role: {
                name: { in: ['staff', 'admin'] }
            }
        },
        include: { role: true }
    });

    if (staffUsers.length === 0) {
        console.log('⚠️  No staff/admin users found. Please run user seeder first.');
        return;
    }

    // Cari stages
    const stages = await prisma.stage.findMany({
        orderBy: { order: 'asc' }
    });

    if (stages.length === 0) {
        console.log('⚠️  No stages found. Please run stage seeder first.');
        return;
    }

    // Cari role untuk staff
    const staffRole = await prisma.role.findFirst({
        where: { name: 'staff' }
    });

    const adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of staffUsers) {
        // Tentukan role_id berdasarkan role user
        let roleId = staffRole?.id;
        if (user.role.name === 'admin') {
            roleId = adminRole?.id;
        }

        if (!roleId) {
            console.log(`⚠️  Role not found for user: ${user.email}`);
            continue;
        }

        // Cek apakah staff sudah ada
        const existingStaff = await prisma.staff.findUnique({
            where: { user_id: user.id }
        });

        if (existingStaff) {
            skippedCount++;
            console.log(`⏭️  Staff already exists for user: ${user.email}`);
            continue;
        }

        // Buat staff
        const staff = await prisma.staff.create({
            data: {
                user_id: user.id,
                role_id: roleId,
            },
            include: {
                user: true,
                role: true,
            }
        });

        console.log(`✅ Created staff: ${staff.user.name} (${staff.user.email}) - Role: ${staff.role.name}`);

        // Assign staff ke stages (untuk staff, assign ke semua stage)
        if (user.role.name === 'staff') {
            for (const stage of stages) {
                await prisma.staffStage.create({
                    data: {
                        staff_id: staff.id,
                        stage_id: stage.id,
                    }
                });
                console.log(`  📌 Assigned to stage: ${stage.stage_name}`);
            }
        } else if (user.role.name === 'admin') {
            // Admin hanya assign ke stage pertama
            if (stages.length > 0) {
                await prisma.staffStage.create({
                    data: {
                        staff_id: staff.id,
                        stage_id: stages[0].id,
                    }
                });
                console.log(`  📌 Assigned to stage: ${stages[0].stage_name}`);
            }
        }

        createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new staff`);
    console.log(`⏭️  Skipped: ${skippedCount} existing staff`);

    // Tampilkan semua staff
    const allStaff = await prisma.staff.findMany({
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
            role: true,
            staff_stages: {
                include: { stage: true }
            }
        },
        orderBy: { id: 'asc' }
    });

    console.log(`\n📋 All staff in database (${allStaff.length} total):`);
    allStaff.forEach(staff => {
        const stageNames = staff.staff_stages.map(ss => ss.stage.stage_name).join(', ');
        console.log(`  - ${staff.user.name} (${staff.user.email}) - Role: ${staff.role.name} - Stages: [${stageNames || 'none'}]`);
    });
}

async function down() {
    console.log('🗑️ Rolling back staff...');

    // Hapus staff_stages dulu (karena foreign key)
    await prisma.staffStage.deleteMany({});
    // Hapus staff
    await prisma.staff.deleteMany({});

    console.log(`↩️ Rollback completed: All staff and staff_stages deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Staff seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}