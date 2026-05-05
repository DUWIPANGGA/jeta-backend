const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi generate order number
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${year}${month}${day}-${random}`;
}

// Data orders
const orders = [
    {
        user_email: 'superadmin@jeta.com',
        status: 'completed',
        grand_total: 425000,
        shipping_address: 'Jl. Sudirman No. 123, Jakarta Selatan',
        shipping_cost: 15000,
        payment_method: 'BCA Transfer',
        tracking_code: 'TRK001',
        order_items: [
            { product_name: 'Kaos Polos Pria', variant_size: 'M', variant_color: 'Hitam', quantity: 2, price: 85000 },
            { product_name: 'Topi Baseball', variant_size: null, variant_color: null, quantity: 1, price: 65000 },
        ]
    },
    {
        user_email: 'superadmin@jeta.com',
        status: 'pending',
        grand_total: 310000,
        shipping_address: 'Jl. Thamrin No. 45, Jakarta Pusat',
        shipping_cost: 10000,
        payment_method: 'OVO',
        tracking_code: null,
        order_items: [
            { product_name: 'Blouse Wanita', variant_size: 'M', variant_color: 'Putih', quantity: 1, price: 120000 },
            { product_name: 'Rok Plisket Wanita', variant_size: 'L', variant_color: 'Hitam', quantity: 1, price: 135000 },
            { product_name: 'Tas Selempang Wanita', variant_size: null, variant_color: null, quantity: 1, price: 125000 },
        ]
    },
    {
        user_email: 'superadmin@jeta.com',
        status: 'processing',
        grand_total: 540000,
        shipping_address: 'Jl. Gatot Subroto No. 67, Jakarta Selatan',
        shipping_cost: 20000,
        payment_method: 'Mandiri Transfer',
        tracking_code: 'TRK002',
        order_items: [
            { product_name: 'Jaket Hoodie Pria', variant_size: 'L', variant_color: 'Hitam', quantity: 1, price: 250000 },
            { product_name: 'Kemeja Flanel Pria', variant_size: 'M', variant_color: 'Merah Kotak', quantity: 1, price: 175000 },
            { product_name: 'Sepatu Sneakers Pria', variant_size: '42', variant_color: 'Putih', quantity: 1, price: 195000 },
        ]
    },
    {
        user_email: 'superadmin@jeta.com',
        status: 'shipped',
        grand_total: 365000,
        shipping_address: 'Jl. Kemang Raya No. 89, Jakarta Selatan',
        shipping_cost: 15000,
        payment_method: 'DANA',
        tracking_code: 'TRK003',
        order_items: [
            { product_name: 'Dress Wanita', variant_size: 'M', variant_color: 'Biru', quantity: 1, price: 165000 },
            { product_name: 'Tas Ransel Pria', variant_size: null, variant_color: null, quantity: 1, price: 185000 },
        ]
    },
    {
        user_email: 'superadmin@jeta.com',
        status: 'cancelled',
        grand_total: 220000,
        shipping_address: 'Jl. Prapanca No. 12, Kebayoran Baru',
        shipping_cost: 10000,
        payment_method: 'ShopeePay',
        tracking_code: null,
        order_items: [
            { product_name: 'Matras Yoga', variant_size: null, variant_color: null, quantity: 1, price: 220000 },
        ]
    },
    {
        user_email: 'superadmin@jeta.com',
        status: 'completed',
        grand_total: 305000,
        shipping_address: 'Jl. Fatmawati No. 34, Jakarta Selatan',
        shipping_cost: 10000,
        payment_method: 'BNI Transfer',
        tracking_code: 'TRK004',
        order_items: [
            { product_name: 'Setelan Anak Laki-laki', variant_size: 'M', variant_color: 'Biru', quantity: 1, price: 95000 },
            { product_name: 'Dress Anak Perempuan', variant_size: 'L', variant_color: 'Pink', quantity: 1, price: 85000 },
            { product_name: 'Sapu Lantai Magic', variant_size: null, variant_color: null, quantity: 1, price: 75000 },
            { product_name: 'Ikat Pinggang Kulit', variant_size: null, variant_color: null, quantity: 1, price: 110000 },
        ]
    },
];

async function main() {
    console.log('🌱 Seeding orders...');

    // Get user
    const user = await prisma.user.findFirst({
        where: { email: 'superadmin@jeta.com' }
    });

    if (!user) {
        console.log('⚠️  User not found. Please run user seeder first.');
        return;
    }

    // Get all products and variants
    const products = await prisma.product.findMany();
    const variants = await prisma.productVariant.findMany();

    const productMap = {};
    products.forEach(prod => {
        productMap[prod.name] = prod;
    });

    const variantMap = {};
    variants.forEach(variant => {
        const key = `${variant.product_id}_${variant.size}_${variant.color}`;
        variantMap[key] = variant;
    });

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const orderData of orders) {
        // Cek apakah order sudah ada berdasarkan alamat dan total
        const existingOrder = await prisma.order.findFirst({
            where: {
                user_id: user.id,
                grand_total: orderData.grand_total,
                shipping_address: orderData.shipping_address,
            }
        });

        if (existingOrder) {
            skippedCount++;
            console.log(`⏭️  Order already exists: ${existingOrder.order_number}`);
            continue;
        }

        // Create order
        const order = await prisma.order.create({
            data: {
                user_id: user.id,
                order_number: generateOrderNumber(),
                status: orderData.status,
                grand_total: orderData.grand_total,
                shipping_address: orderData.shipping_address,
                shipping_cost: orderData.shipping_cost,
                payment_method: orderData.payment_method,
                tracking_code: orderData.tracking_code,
            }
        });

        console.log(`✅ Created order: ${order.order_number} (Status: ${order.status})`);

        // Create order items
        for (const item of orderData.order_items) {
            const product = productMap[item.product_name];

            if (!product) {
                console.log(`  ⚠️  Product not found: ${item.product_name}`);
                errorCount++;
                continue;
            }

            let variantId = null;

            // Find variant if size/color specified
            if (item.variant_size && item.variant_color) {
                const variantKey = `${product.id}_${item.variant_size}_${item.variant_color}`;
                const variant = variantMap[variantKey];
                if (variant) {
                    variantId = variant.id;
                } else {
                    console.log(`  ⚠️  Variant not found: ${item.product_name} - ${item.variant_size} - ${item.variant_color}`);
                }
            }

            await prisma.orderItem.create({
                data: {
                    order_id: order.id,
                    product_id: product.id,
                    variant_id: variantId,
                    quantity: item.quantity,
                    price: item.price,
                }
            });

            console.log(`  📦 Added item: ${item.product_name} x${item.quantity} = Rp${(item.price * item.quantity).toLocaleString()}`);
        }

        createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new orders`);
    console.log(`⏭️  Skipped: ${skippedCount} existing orders`);
    console.log(`❌ Errors: ${errorCount}`);

    // Verifikasi
    const allOrders = await prisma.order.findMany({
        include: {
            user: { select: { name: true, email: true } },
            order_items: {
                include: {
                    product: { select: { name: true } },
                    variant: { select: { size: true, color: true } }
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    console.log(`\n📄 All orders in database (${allOrders.length} total):`);
    allOrders.forEach(order => {
        console.log(`  ${order.order_number} - ${order.status} - Rp${order.grand_total.toLocaleString()} (${order.user.name})`);
        order.order_items.forEach(item => {
            const variantText = item.variant ? ` (${item.variant.size}/${item.variant.color})` : '';
            console.log(`    - ${item.product.name}${variantText} x${item.quantity} = Rp${(item.price * item.quantity).toLocaleString()}`);
        });
    });
}

async function down() {
    console.log('🗑️ Rolling back orders...');

    // Delete order items first (due to foreign key)
    await prisma.orderItem.deleteMany({});
    // Delete orders
    await prisma.order.deleteMany({});

    console.log(`↩️ Rollback completed: All orders and order items deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Order seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}