const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOptionId(variantName, optionName) {
    const variant = await prisma.customVariant.findUnique({
        where: { name: variantName },
        include: { options: true },
    });
    const option = variant?.options.find(o => o.name === optionName);
    return option?.id;
}

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

    const customOrdersData = [
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
            options: [
                { variant: 'Warna', option: 'Hitam' },
                { variant: 'Ukuran', option: 'M' },
                { variant: 'Bahan', option: 'Combed 30s' },
                { variant: 'Sablon', option: 'Sablon Plastisol' },
            ]
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
            options: [
                { variant: 'Warna', option: 'Hitam' },
                { variant: 'Sablon', option: 'Bordir' },
            ]
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
            options: [
                { variant: 'Warna', option: 'Abu-abu' },
                { variant: 'Ukuran', option: 'L' },
                { variant: 'Bahan', option: 'Polyester' },
            ]
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
            options: [
                { variant: 'Warna', option: 'Putih' },
            ]
        },
    ];

    // Hapus semua data custom_orders sebelumnya (Cascade deletes will automatically handle child items/projects)
    await prisma.customOrder.deleteMany();
    console.log('🗑️  Semua custom order sebelumnya dihapus.');

    for (const orderData of customOrdersData) {
        // Gabungkan jenis_produk dan upload_referensi ke dalam catatan_tambahan demi menjaga integritas data tanpa field yang tidak valid di schema
        const mergedCatatan = `[Produk: ${orderData.jenis_produk}] [Referensi: ${orderData.upload_referensi}] ${orderData.catatan_tambahan}`;

        const createdOrder = await prisma.customOrder.create({
            data: {
                user_id: orderData.user_id,
                name: orderData.name,
                phone: orderData.phone,
                email: orderData.email,
                deadline: orderData.deadline,
                catatan_tambahan: mergedCatatan,
                dp_amount: orderData.dp_amount,
                remaining_amount: orderData.remaining_amount,
                total_amount: orderData.total_amount,
                accept_status: orderData.accept_status,
                payment_status: orderData.payment_status,
            }
        });

        // Buat item pesanan custom
        const orderItem = await prisma.customOrderItem.create({
            data: {
                custom_order_id: createdOrder.id,
                quantity: orderData.jumlah,
                remaining_quantity: orderData.jumlah,
            }
        });

        // Hubungkan varian pilihan item jika ada
        for (const opt of orderData.options) {
            const optionId = await getOptionId(opt.variant, opt.option);
            if (optionId) {
                await prisma.customOrderItemOption.create({
                    data: {
                        custom_order_item_id: orderItem.id,
                        variant_option_id: optionId,
                    }
                });
            } else {
                console.log(`  ⚠️  Varian option tidak ditemukan: ${opt.variant} -> ${opt.option}`);
            }
        }

        console.log(`✅ Custom order created: "${createdOrder.name}" (${orderData.jenis_produk}) dengan ${orderData.options.length} pilihan varian.`);
    }

    console.log(`✅ Seluruh custom orders berhasil di-seed.`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding custom_orders:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });