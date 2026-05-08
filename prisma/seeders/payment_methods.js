const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding payment methods...');

    const paymentMethods = [
        {
            bank_code: 'BCA',
            bank_name: 'Bank Central Asia (BCA)',
            bank_account: '1234567890',
            owner_name: 'PT Jeta Indonesia',
            type: 'bank_transfer',
            status_method: true,
        },
        {
            bank_code: 'MANDIRI',
            bank_name: 'Bank Mandiri',
            bank_account: '0987654321',
            owner_name: 'PT Jeta Indonesia',
            type: 'bank_transfer',
            status_method: true,
        }
    ];

    for (const method of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: { bank_code: method.bank_code },
            update: method,
            create: method,
        });
    }

    console.log('Payment methods seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
