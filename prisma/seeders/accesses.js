const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping role ID ke level
const roleLevels = {
    1: 'superadmin', // Full access semua page
    2: 'admin',      // Akses operational pages
    3: 'staff',      // Akses terbatas
    4: 'user',       // Akses minimal
};

// Daftar page yang diperlukan berdasarkan struktur sidebar
const pages = [
    { id: 1, name: 'Dashboard' },
    // Sistem & Akses
    { id: 2, name: 'Akses Role' },
    { id: 3, name: 'Akun (Staff)' },
    { id: 4, name: 'Log Aktivitas' },
    { id: 5, name: 'Metode Pembayaran' },
    { id: 6, name: 'Logistik' },
    // Master Data
    { id: 7, name: 'Kategori Produk' },
    { id: 8, name: 'Ukuran Per Kategori' },
    { id: 9, name: 'Opsi Kustomisasi' },
    { id: 10, name: 'Bahan / Material' },
    { id: 11, name: 'Status Produksi' },
    // Catalog & CMS
    { id: 12, name: 'Manajemen Produk' },
    { id: 13, name: 'CMS' },
    // Pelanggan
    { id: 14, name: 'Data Pelanggan' },
    // Operasional - Permintaan
    { id: 15, name: 'Permintaan Custom' },
    { id: 16, name: 'Antrian Permintaan' },
    { id: 17, name: 'Detail & Timeline Follow-up' },
    { id: 18, name: 'Konversi ke Order' },
    // Operasional - Order
    { id: 19, name: 'Order Masuk' },
    { id: 20, name: 'Pesanan Langsung' },
    { id: 21, name: 'Custom Order' },
    // Operasional - Produksi
    { id: 22, name: 'Monitoring Produksi' },
    { id: 23, name: 'Antrian Produksi' },
    { id: 24, name: 'Status per Order' },
    { id: 25, name: 'Assign ke Karyawan' },
    { id: 26, name: 'Verifikasi Pembayaran' },
    { id: 27, name: 'Tracking Progress' },
    // Operasional - Finance
    { id: 28, name: 'Histori Transaksi' },
    // Laporan
    { id: 29, name: 'Sistem Upah (per pcs)' },
    { id: 30, name: 'Rekap Penggajian' },
    { id: 31, name: 'Laporan Penjualan' },
    { id: 32, name: 'Laporan Produksi' },
    { id: 33, name: 'Laporan Penggajian' },
];

// Konfigurasi akses untuk setiap role
const accessConfig = {
    // Superadmin (ID: 1) - Full access semua page
    1: (pageId) => ({
        create: true,
        read: true,
        update: true,
        delete: true,
    }),

    // Admin (ID: 2) - Akses operational dan management
    2: (pageId) => {
        const adminPages = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
        if (adminPages.includes(pageId)) {
            return {
                create: true,
                read: true,
                update: true,
                delete: pageId === 3 ? false : true, // Admin tidak bisa delete staff
            };
        }
        return { create: false, read: false, update: false, delete: false };
    },

    // Staff (ID: 3) - Akses terbatas untuk operasional harian
    3: (pageId) => {
        const readOnlyPages = [4, 5, 7, 10, 12, 14, 16, 19, 23];
        const createPages = [15, 22];
        const updatePages = [22, 24, 25, 26, 27];

        if (readOnlyPages.includes(pageId)) {
            return { create: false, read: true, update: false, delete: false };
        }
        if (createPages.includes(pageId)) {
            return { create: true, read: true, update: false, delete: false };
        }
        if (updatePages.includes(pageId)) {
            return { create: false, read: true, update: true, delete: false };
        }
        if (pageId === 1) { // Dashboard
            return { create: false, read: true, update: false, delete: false };
        }
        return { create: false, read: false, update: false, delete: false };
    },

    // User (ID: 4) - Akses customer minimal
    4: (pageId) => {
        if (pageId === 1 || pageId === 14) { // Dashboard dan Data Pelanggan (own data)
            return { create: false, read: true, update: false, delete: false };
        }
        return { create: false, read: false, update: false, delete: false };
    },
};

async function main() {
    console.log('🌱 Seeding accesses...');

    // Pastikan pages sudah ada
    const existingPages = await prisma.page.findMany();
    if (existingPages.length === 0) {
        console.log('⚠️  No pages found. Please run page seeder first.');
        return;
    }

    // Pastikan roles sudah ada
    const existingRoles = await prisma.role.findMany();
    if (existingRoles.length === 0) {
        console.log('⚠️  No roles found. Please run role seeder first.');
        return;
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const role of existingRoles) {
        console.log(`\n📌 Processing accesses for ${role.name} (ID: ${role.id})...`);

        const getAccess = accessConfig[role.id];
        if (!getAccess) {
            console.log(`  ⚠️  No access config for role ${role.name}, skipping...`);
            continue;
        }

        for (const page of existingPages) {
            const access = getAccess(page.id);

            if (!access.create && !access.read && !access.update && !access.delete) {
                continue; // Skip jika tidak ada akses sama sekali
            }

            try {
                const existingAccess = await prisma.access.findFirst({
                    where: {
                        role_id: role.id,
                        page_id: page.id,
                    },
                });

                const accessName = `access_${role.name}_${page.name}`;

                if (existingAccess) {
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
                    skippedCount++;
                    console.log(`  🔄 Updated access: ${role.name} -> ${page.name} (C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete})`);
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
            } catch (error) {
                errorCount++;
                console.error(`  ❌ Error creating access for ${role.name} -> ${page.name}:`, error.message);
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new accesses`);
    console.log(`🔄 Updated: ${skippedCount} existing accesses`);
    console.log(`❌ Errors: ${errorCount}`);

    // Verifikasi
    const allAccesses = await prisma.access.findMany({
        include: {
            role: { select: { name: true } },
            page: { select: { name: true } },
        },
        orderBy: { role_id: 'asc' },
    });

    console.log(`\n📄 All accesses in database (${allAccesses.length} total):`);
    allAccesses.forEach(access => {
        console.log(`  ${access.role.name} -> ${access.page.name}: C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete}`);
    });
}

async function down() {
    console.log('🗑️ Rolling back accesses...');

    await prisma.access.deleteMany({});
    console.log(`↩️ Rollback completed: All accesses deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Access seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}