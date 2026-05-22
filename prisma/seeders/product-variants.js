const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sizes, colors, and product variants...');

  const products = await prisma.product.findMany();

  if (products.length === 0) {
    console.error('❌ No products found. Please run products seeder first.');
    return;
  }

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = [
    { name: 'Hitam', hex_code: '#000000' },
    { name: 'Putih', hex_code: '#FFFFFF' },
    { name: 'Navy', hex_code: '#000080' },
    { name: 'Merah', hex_code: '#FF0000' },
    { name: 'Abu-abu', hex_code: '#808080' }
  ];

  // Seed sizes and map their names to IDs
  const sizeMap = {};
  for (const sizeName of sizes) {
    const size = await prisma.size.upsert({
      where: { name: sizeName },
      update: {},
      create: { name: sizeName }
    });
    sizeMap[sizeName] = size.id;
  }
  console.log('✅ Sizes seeded and mapped.');

  // Seed colors and map their names to IDs
  const colorMap = {};
  for (const colorData of colors) {
    const color = await prisma.color.upsert({
      where: { name: colorData.name },
      update: {},
      create: { name: colorData.name, hex_code: colorData.hex_code }
    });
    colorMap[colorData.name] = color.id;
  }
  console.log('✅ Colors seeded and mapped.');

  // Clear existing product variants to ensure fresh seeding and no duplicate items
  await prisma.productVariant.deleteMany({});
  console.log('🗑️  Semua product variants sebelumnya dihapus.');

  let count = 0;

  for (const product of products) {
    // Create variants for each product
    // For simplicity, we create 2-3 variants per product
    const numVariants = Math.floor(Math.random() * 3) + 2; 

    for (let i = 0; i < numVariants; i++) {
      const sizeName = sizes[Math.floor(Math.random() * sizes.length)];
      const colorName = colors[Math.floor(Math.random() * colors.length)].name;
      
      const sizeId = sizeMap[sizeName];
      const colorId = colorMap[colorName];

      await prisma.productVariant.create({
        data: {
          product_id: product.id,
          size_id: sizeId,
          color_id: colorId,
          stock: Math.floor(Math.random() * 100) + 10,
          price_adjustment: Math.floor(Math.random() * 5000) * 1, // small price variation
          description: `Varian ${product.name} ukuran ${sizeName} warna ${colorName}`,
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
