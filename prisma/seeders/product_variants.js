const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding product variants...');

  const products = await prisma.product.findMany();

  if (products.length === 0) {
    console.error('❌ No products found. Please run products seeder first.');
    return;
  }

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Hitam', 'Putih', 'Navy', 'Merah', 'Abu-abu'];

  let count = 0;

  for (const product of products) {
    // Create variants for each product
    // For simplicity, we create 2-3 variants per product
    const numVariants = Math.floor(Math.random() * 3) + 2; 

    for (let i = 0; i < numVariants; i++) {
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Check if this variant already exists (optional, but good for idempotency if you use upsert)
      // Since there's no unique constraint on size/color/product_id, we just create.
      
      await prisma.productVariant.create({
        data: {
          product_id: product.id,
          size: size,
          color: color,
          stock: Math.floor(Math.random() * 100) + 10,
          price_adjustment: Math.floor(Math.random() * 5000) * 1, // small price variation
          description: `Varian ${product.name} ukuran ${size} warna ${color}`,
          atribute: 'Original',
        }
      });
      count++;
    }
    console.log(`✅ Created variants for product: ${product.name}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${count} product variants`);
}

main()
  .catch((e) => {
    console.error(`❌ Error seeding product variants:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
