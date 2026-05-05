const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roles = [
    { id: 1, name: 'superadmin', level: 1, description: 'Super Administrator - Full access to everything' },
    { id: 2, name: 'admin', level: 2, description: 'Administrator - Manage operational data' },
    { id: 3, name: 'staff', level: 3, description: 'Staff - Limited access for daily operations' },
    { id: 4, name: 'user', level: 4, description: 'Regular User - Customer access only' },
];

async function main() {
    console.log('🌱 Seeding roles...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const role of roles) {
        const existingRole = await prisma.role.findFirst({
            where: { name: role.name }
        });

        if (existingRole) {
            skippedCount++;
            console.log(`⏭️  Role already exists: ${role.name} (ID: ${existingRole.id})`);
        } else {
            await prisma.role.create({
                data: role
            });
            createdCount++;
            console.log(`✅ Created role: ${role.name} (ID: ${role.id}, Level: ${role.level})`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new roles`);
    console.log(`⏭️  Skipped: ${skippedCount} existing roles`);
    console.log(`📋 Total: ${roles.length} roles processed`);

    // Verifikasi
    const allRoles = await prisma.role.findMany({
        orderBy: { level: 'asc' }
    });

    console.log(`\n📄 All roles in database (${allRoles.length} total):`);
    allRoles.forEach(role => {
        console.log(`  ${role.level}. ${role.name} (ID: ${role.id})`);
    });
}

async function down() {
    console.log('🗑️ Rolling back roles...');

    for (const role of roles) {
        await prisma.role.deleteMany({
            where: { name: role.name }
        });
    }

    console.log(`↩️ Rollback completed: ${roles.length} roles deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Role seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}