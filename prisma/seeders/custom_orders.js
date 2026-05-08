const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Ambil beberapa user yang sudah ada (asumsi minimal ada 1 user)
    const users = await prisma.user.findMany({
        take: 3,
        select: { id: true, name: true },
    });

    if (users.length === 0) {
        console.log('⚠️  Tidak ada user ditemukan. Seeder custom_orders dibatalkan.');
        return;
    }

    const customOrders = [
        {
            user_id: users[0].id,
            name: 'Budi Santoso',
            phone: '081234567890',
            email: 'budi@example.com',
            jenis_produk: 'Kaos Custom',
            jumlah: 50,
            deadline: new Date('2025-12-31'),
            upload_referensi: 'https://example.com/referensi/kaos.pdf',
            catatan_tambahan: 'Warna hitam, sablon depan',
            dp_amount: 500000,
            remaining_amount: 500000,
            total_amount: 1000000,
            accept_status: true,
            payment_status: false,
        },
        {
            user_id: users[0].id,
            name: 'Budi Santoso',
            phone: '081234567890',
            email: 'budi@example.com',
            jenis_produk: 'Topi Custom',
            jumlah: 100,
            deadline: new Date('2025-11-30'),
            upload_referensi: 'https://example.com/referensi/topi.pdf',
            catatan_tambahan: 'Bordir logo',
            dp_amount: 300000,
            remaining_amount: 300000,
            total_amount: 600000,
            accept_status: false,
            payment_status: false,
        },
        {
            user_id: users.length > 1 ? users[1].id : users[0].id,
            name: 'Siti Nurhaliza',
            phone: '081298765432',
            email: 'siti@example.com',
            jenis_produk: 'Jaket Custom',
            jumlah: 25,
            deadline: new Date('2025-10-15'),
            upload_referensi: 'https://example.com/referensi/jaket.pdf',
            catatan_tambahan: 'Bahan fleece, printing besar',
            dp_amount: 750000,
            remaining_amount: 750000,
            total_amount: 1500000,
            accept_status: true,
            payment_status: true,
        },
        {
            user_id: users.length > 2 ? users[2].id : users[0].id,
            name: 'Agus Wijaya',
            phone: '081277889900',
            email: 'agus@example.com',
            jenis_produk: 'Mug Custom',
            jumlah: 200,
            deadline: new Date('2025-09-20'),
            upload_referensi: 'https://example.com/referensi/mug.pdf',
            catatan_tambahan: 'Full color kedua sisi',
            dp_amount: 400000,
            remaining_amount: 0,
            total_amount: 400000,
            accept_status: false,
            payment_status: false,
        },
    ];

    // Hapus semua data custom_orders (opsional)
    await prisma.customOrder.deleteMany();
    console.log('🗑️  Semua custom order sebelumnya dihapus.');

    for (const order of customOrders) {
        await prisma.customOrder.create({ data: order });
    }

    console.log(`✅ ${customOrders.length} custom orders berhasil di-seed.`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding custom_orders:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });