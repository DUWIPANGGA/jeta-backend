// prisma/seeders/access.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Konfigurasi akses untuk setiap role berdasarkan page ID
const accessConfig = {
    // Superadmin (ID: 1) - Full access semua page
    1: (pageId) => ({
        create: true,
        read: true,
        update: true,
        delete: true,
    }),

    // Admin (ID: 2) - Full access semua page, kecuali yang dilarang
    2: (pageId) => {
        // Admin bisa akses SEMUA page dari 1-33
        // Kecuali page_id 25 (Roles) tidak bisa delete
        return {
            create: true,
            read: true,
            update: true,
            delete: pageId === 25 ? false : true,
        };
    },

    // Staff (ID: 3) - Akses terbatas untuk operasional harian
    3: (pageId) => {
        // Staff bisa akses: Dashboard(1), Products(5), CustomOrders(10), 
        // ProgressReports(22), Projects(23), Staffs(28), Stages(29), WorkLogs(33)
        const staffPages = [1, 5, 10, 22, 23, 28, 29, 33];
        if (staffPages.includes(pageId)) {
            if (pageId === 22) { // ProgressReports
                return { create: true, read: true, update: true, delete: false };
            }
            if (pageId === 5) { // Products
                return { create: false, read: true, update: false, delete: false };
            }
            if (pageId === 10) { // CustomOrders
                return { create: false, read: true, update: false, delete: false };
            }
            if (pageId === 23) { // Projects
                return { create: false, read: true, update: true, delete: false };
            }
            if (pageId === 28) { // Staffs
                return { create: false, read: true, update: false, delete: false };
            }
            if (pageId === 29) { // Stages
                return { create: false, read: true, update: false, delete: false };
            }
            if (pageId === 33) { // WorkLogs
                return { create: true, read: true, update: true, delete: false };
            }
            return { create: false, read: true, update: false, delete: false };
        }
        return { create: false, read: false, update: false, delete: false };
    },

    // User (ID: 4) - Akses customer
    4: (pageId) => {
        // User bisa akses: Dashboard(1), Carts(2), Categories(3), SubCategories(4), 
        // Products(5), CustomOrders(10), CustomerData(11), Guest(13)
        const userPages = [1, 2, 3, 4, 5, 10, 11, 13];
        if (userPages.includes(pageId)) {
            return {
                create: pageId === 2 || pageId === 10 ? true : false,  // Create cart & custom order
                read: true,
                update: pageId === 2 ? true : false,                   // Update cart only
                delete: pageId === 2 ? true : false,                   // Delete cart only
            };
        }
        return { create: false, read: false, update: false, delete: false };
    },

    // Finance (ID: 5) - Akses keuangan
    5: (pageId) => {
        const financePages = [1, 12, 26, 27, 28, 30, 33];
        if (financePages.includes(pageId)) {
            return {
                create: pageId === 27 ? true : false,
                read: true,
                update: pageId === 27 ? true : false,
                delete: false,
            };
        }
        return { create: false, read: false, update: false, delete: false };
    },
};

async function main() {
    console.log('🌱 Seeding accesses...');

    const pages = await prisma.page.findMany();
    const roles = await prisma.role.findMany();

    if (pages.length === 0) {
        console.log('⚠️  No pages found. Please run page seeder first.');
        return;
    }
    if (roles.length === 0) {
        console.log('⚠️  No roles found. Please run role seeder first.');
        return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const role of roles) {
        console.log(`\n📌 Processing accesses for ${role.name} (ID: ${role.id})...`);

        const getAccess = accessConfig[role.id];
        if (!getAccess) {
            console.log(`  ⚠️  No access config for role ${role.name}, skipping...`);
            continue;
        }

        for (const page of pages) {
            const access = getAccess(page.id);

            if (!access.create && !access.read && !access.update && !access.delete) {
                continue;
            }

            const existingAccess = await prisma.access.findFirst({
                where: { role_id: role.id, page_id: page.id },
            });

            const accessName = `${role.name}_${page.name}`;

            if (existingAccess) {
                if (existingAccess.create !== access.create ||
                    existingAccess.read !== access.read ||
                    existingAccess.update !== access.update ||
                    existingAccess.delete !== access.delete) {
                    await prisma.access.update({
                        where: { id: existingAccess.id },
                        data: {
                            name: accessName,
                            create: access.create,
                            read: access.read,
                            update: access.update,
                            delete: access.delete,
                        },
                    });
                    updatedCount++;
                    console.log(`  🔄 Updated access: ${role.name} -> ${page.name} (C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete})`);
                } else {
                    console.log(`  ⏭️  Access unchanged: ${role.name} -> ${page.name}`);
                }
            } else {
                await prisma.access.create({
                    data: {
                        name: accessName,
                        create: access.create,
                        read: access.read,
                        update: access.update,
                        delete: access.delete,
                        role_id: role.id,
                        page_id: page.id,
                    },
                });
                createdCount++;
                console.log(`  ✅ Created access: ${role.name} -> ${page.name} (C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete})`);
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new accesses`);
    console.log(`🔄 Updated: ${updatedCount} existing accesses`);

    const allAccesses = await prisma.access.findMany({
        include: { role: { select: { name: true } }, page: { select: { name: true, id: true } } },
        orderBy: { role_id: 'asc' },
    });

    console.log(`\n📄 All accesses in database (${allAccesses.length} total):`);
    allAccesses.forEach(access => {
        console.log(`  ${access.role.name} -> ${access.page.name} (ID:${access.page.id}): C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete}`);
    });
}

async function down() {
    console.log('🗑️ Rolling back accesses...');
    await prisma.access.deleteMany({});
    console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Access seed failed:', e))
        .finally(() => prisma.$disconnect());
}