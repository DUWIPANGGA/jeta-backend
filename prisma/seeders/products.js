const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Produk untuk Pakaian Pria (category_id: 1)
const products = [
    {
        name: 'Kaos Polos Pria',
        description: 'Kaos polos premium bahan cotton combed 30s, nyaman dipakai sehari-hari',
        price: 85000,
        image: '/uploads/products/kaos-polos-pria.jpg',
        category_name: 'Pakaian Pria'
    },
    {
        name: 'Kemeja Flanel Pria',
        description: 'Kemeja flanel kotak-kotak, bahan tebal dan hangat',
        price: 175000,
        image: '/uploads/products/kemeja-flanel.jpg',
        category_name: 'Pakaian Pria'
    },
    {
        name: 'Jaket Hoodie Pria',
        description: 'Jaket hoodie oversized, bahan cotton fleece tebal',
        price: 250000,
        image: '/uploads/products/hoodie-pria.jpg',
        category_name: 'Pakaian Pria'
    },
    // Pakaian Wanita (category_id: 2)
    {
        name: 'Blouse Wanita',
        description: 'Blouse wanita bahan chiffon, motif bunga elegan',
        price: 120000,
        image: '/uploads/products/blouse-wanita.jpg',
        category_name: 'Pakaian Wanita'
    },
    {
        name: 'Rok Plisket Wanita',
        description: 'Rok plisket midi, bahan woven, nyaman dipakai',
        price: 135000,
        image: '/uploads/products/rok-plisket.jpg',
        category_name: 'Pakaian Wanita'
    },
    {
        name: 'Dress Wanita',
        description: 'Dress casual wanita, bahan cotton santai',
        price: 165000,
        image: '/uploads/products/dress-wanita.jpg',
        category_name: 'Pakaian Wanita'
    },
    // Pakaian Anak (category_id: 3)
    {
        name: 'Setelan Anak Laki-laki',
        description: 'Setelan kemeja + celana pendek untuk anak laki-laki',
        price: 95000,
        image: '/uploads/products/setelan-anak-laki.jpg',
        category_name: 'Pakaian Anak'
    },
    {
        name: 'Dress Anak Perempuan',
        description: 'Dress anak perempuan bahan katun motif unicorn',
        price: 85000,
        image: '/uploads/products/dress-anak-perempuan.jpg',
        category_name: 'Pakaian Anak'
    },
    // Aksesoris (category_id: 4)
    {
        name: 'Topi Baseball',
        description: 'Topi baseball adjustable, bahan wool',
        price: 65000,
        image: '/uploads/products/topi-baseball.jpg',
        category_name: 'Aksesoris'
    },
    {
        name: 'Ikat Pinggang Kulit',
        description: 'Ikat pinggang kulit asli, buckle stainless steel',
        price: 110000,
        image: '/uploads/products/ikat-pinggang.jpg',
        category_name: 'Aksesoris'
    },
    // Sepatu (category_id: 5)
    {
        name: 'Sepatu Sneakers Pria',
        description: 'Sneakers casual, bahan kanvas, nyaman dipakai',
        price: 195000,
        image: '/uploads/products/sneakers-pria.jpg',
        category_name: 'Sepatu'
    },
    {
        name: 'Sepatu Flat Wanita',
        description: 'Sepatu flat wanita, bahan kulit sintetis',
        price: 145000,
        image: '/uploads/products/flat-wanita.jpg',
        category_name: 'Sepatu'
    },
    // Tas (category_id: 6)
    {
        name: 'Tas Ransel Pria',
        description: 'Tas ransel casual, bahan kanvas tebal, multi fungsi',
        price: 185000,
        image: '/uploads/products/tas-ransel.jpg',
        category_name: 'Tas'
    },
    {
        name: 'Tas Selempang Wanita',
        description: 'Tas selempang mini, bahan kulit sintetis, elegan',
        price: 125000,
        image: '/uploads/products/tas-selempang.jpg',
        category_name: 'Tas'
    },
    // Alat Olahraga (category_id: 7)
    {
        name: 'Matras Yoga',
        description: 'Matras yoga tebal 10mm, anti slip, nyaman',
        price: 220000,
        image: '/uploads/products/matras-yoga.jpg',
        category_name: 'Alat Olahraga'
    },
    // Perlengkapan Rumah (category_id: 8)
    {
        name: 'Sapu Lantai Magic',
        description: 'Sapu lantai modern, pisau magnet, serbaguna',
        price: 75000,
        image: '/uploads/products/sapu-magic.jpg',
        category_name: 'Perlengkapan Rumah'
    },
];

async function main() {
    console.log('🌱 Seeding products...');

    // Get all categories first
    const categories = await prisma.category.findMany();
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
    });

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
        const categoryId = categoryMap[product.category_name];

        if (!categoryId) {
            console.log(`⚠️  Category "${product.category_name}" not found, skipping product: ${product.name}`);
            errorCount++;
            continue;
        }

        const existingProduct = await prisma.product.findFirst({
            where: { name: product.name }
        });

        if (existingProduct) {
            skippedCount++;
            console.log(`⏭️  Product already exists: ${product.name}`);
        } else {
            await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    category_id: categoryId,
                }
            });
            createdCount++;
            console.log(`✅ Created product: ${product.name} (Category: ${product.category_name})`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${createdCount} new products`);
    console.log(`⏭️  Skipped: ${skippedCount} existing products`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total: ${products.length} products processed`);

    // Verifikasi
    const allProducts = await prisma.product.findMany({
        include: {
            category: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`\n📄 All products in database (${allProducts.length} total):`);
    allProducts.forEach(product => {
        console.log(`  ${product.id}. ${product.name} - ${product.category.name} - Rp${product.price.toLocaleString()}`);
    });
}

async function down() {
    console.log('🗑️ Rolling back products...');

    for (const product of products) {
        await prisma.product.deleteMany({
            where: { name: product.name }
        });
    }

    console.log(`↩️ Rollback completed: ${products.length} products deleted`);
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch((e) => {
            console.error('❌ Product seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}