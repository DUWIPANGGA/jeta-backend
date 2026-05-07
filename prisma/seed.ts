import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding dimulai...');

    // Hapus data lama (urutkan sesuai foreign key)
    await prisma.customOrder.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.user.deleteMany();
    await prisma.paymentMethod.deleteMany();

    // 1. Payment Method
    const bca = await prisma.paymentMethod.create({
        data: {
            bank_code: 'BCA',
            bank_name: 'Bank Central Asia',
            bank_account: '1234567890',
            owner_name: 'PT Jeta Official',
            type: 'bank_transfer',
            status_method: true,
            expired_duration_minutes: 60,
        },
    });

    // 2. User (pastikan role_id 2 sudah ada di tabel roles)
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
        data: {
            name: 'Customer Test',
            email: 'customer@example.com',
            password: hashedPassword,
            address: 'Jl. Contoh No. 123',
            phone: '081234567890',
            role_id: 2,
        },
    });

    // 3. Payment - pakai oreder_type (typo)
    const payment = await prisma.payment.create({
        data: {
            payment_method_id: bca.id,
            amount: 2000000,
            transaction_id: 'TRX-CUSTOM-001',
            oreder_type: 'custom_order',
            payment_status: 'pending',
        },
    });

    // 4. Custom Order
    const customOrder = await prisma.customOrder.create({
        data: {
            user_id: user.id,
            name: user.name,
            phone: user.phone!,
            email: user.email,
            jenis_produk: 'Kaos Sablon Custom',
            jumlah: 50,
            deadline: new Date('2025-12-31T00:00:00.000Z'),
            upload_referensi: 'https://example.com/referensi/kaos.jpg',
            catatan_tambahan: 'Warna hitam, logo di dada kiri',
            dp_amount: 500000,
            remaining_amount: 1500000,
            payment_id: payment.id,
            accept_status: false,
        },
    });

    console.log('Seeding sukses!');
    console.log('User ID:', user.id);
    console.log('Payment ID:', payment.id);
    console.log('Custom Order ID:', customOrder.id);
}

main()
    .catch(e => {
        console.error('Gagal seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });