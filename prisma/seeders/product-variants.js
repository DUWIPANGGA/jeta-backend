const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sizesData = [
  { name: 'S' }, { name: 'M' }, { name: 'L' }, { name: 'XL' }, { name: 'XXL' },
  { name: 'XXXL' }, { name: 'XXXXL' }, { name: 'XXXXXL' }, { name: '3XL' }, { name: '4XL' },
  { name: 'XX Kids' }, { name: 'S Kids' }, { name: 'M Kids' }, { name: 'L Kids' }
];

const colorsData = [
  { name: 'Hitam', hex_code: '#000000' }, { name: 'Putih', hex_code: '#FFFFFF' },
  { name: 'Merah', hex_code: '#FF0000' }, { name: 'Biru', hex_code: '#0000FF' },
  { name: 'Kuning', hex_code: '#FFFF00' }, { name: 'Hijau', hex_code: '#008000' },
  { name: 'Navy', hex_code: '#000080' }, { name: 'Maroon', hex_code: '#800000' },
  { name: 'Abu Muda', hex_code: '#D3D3D3' }, { name: 'Abu Tua', hex_code: '#A9A9A9' },
  { name: 'Oranye', hex_code: '#FFA500' }, { name: 'Gold', hex_code: '#FFD700' },
  { name: 'Ungu Tua', hex_code: '#800080' }, { name: 'Dusty Pink', hex_code: '#DCAE96' },
  { name: 'Pink Baby', hex_code: '#F4C2C2' }, { name: 'Hijau Tosca', hex_code: '#3BB08C' },
  { name: 'Biru Tosca', hex_code: '#008080' }, { name: 'Hijau Botol', hex_code: '#006400' },
  { name: 'Army', hex_code: '#4B5320' }, { name: 'Biru Langit', hex_code: '#87CEEB' },
  { name: 'Stabilo', hex_code: '#FFFF66' }, { name: 'Hijau Fuji', hex_code: '#00FF7F' },
  { name: 'Mint', hex_code: '#98FB98' }, { name: 'Broken White', hex_code: '#F5F5DC' },
  { name: 'Silver', hex_code: '#C0C0C0' }, { name: 'Tosca', hex_code: '#3BB08C' },
  { name: 'Cream', hex_code: '#FFFDD0' }, { name: 'Turkish', hex_code: '#008B8B' },
  // Compound colors used in variants
  { name: 'Putih/Hijau', hex_code: '#FFFFFF' }, { name: 'Putih/Army', hex_code: '#FFFFFF' },
  { name: 'Putih/Maroon', hex_code: '#FFFFFF' }, { name: 'Maroon/Putih', hex_code: '#800000' },
  { name: 'Merah/Hitam', hex_code: '#FF0000' }, { name: 'Kuning/Hitam', hex_code: '#FFFF00' },
  { name: 'Hijau/Putih', hex_code: '#008000' }, { name: 'Turkish/Putih', hex_code: '#008B8B' },
  { name: 'Hitam & Navy', hex_code: '#000080' }, { name: 'Red', hex_code: '#FF0000' },
  { name: 'White', hex_code: '#FFFFFF' }, { name: 'Black', hex_code: '#000000' },
  { name: 'Blue', hex_code: '#0000FF' }, { name: 'Pink', hex_code: '#FFC0CB' },
  { name: 'Ungu', hex_code: '#800080' }, { name: 'Biru Tua', hex_code: '#000080' },
  { name: 'Biru Muda', hex_code: '#87CEEB' }, { name: 'Oren', hex_code: '#FFA500' },
  { name: 'Kunyit', hex_code: '#FFD700' }
];

// Product variants mapped by product name
const productVariants = {
  'Dharma Ayu Pop Culture - Jersey Olahraga Bertema Kota': [
    { size: 'S', stock: 24 }, { size: 'M', stock: 24 }, { size: 'L', stock: 24 },
    { size: 'XL', stock: 24 }, { size: 'XXL', stock: 24 }, { size: 'XXXL', stock: 24 },
    { size: 'XX Kids', stock: 24 }, { size: 'S Kids', stock: 24 },
    { size: 'M Kids', stock: 24 }, { size: 'L Kids', stock: 24 }
  ],
  'Jersey Persib Edisi Spesial Back to Back': [
    { size: 'S', stock: 16 }, { size: 'M', stock: 16 }, { size: 'L', stock: 16 },
    { size: 'XL', stock: 16 }, { size: 'XXL', stock: 16 }, { size: '3XL', stock: 16 },
    { size: '4XL', stock: 16 }
  ],
  'Jeta Running Jersey Basic Superlight': [
    { color: 'Black', size: 'S', stock: 10 }, { color: 'Black', size: 'M', stock: 10 },
    { color: 'Black', size: 'L', stock: 10 }, { color: 'Black', size: 'XL', stock: 10 },
    { color: 'Black', size: 'XXL', stock: 10 }, { color: 'Black', size: '3XL', stock: 10 },
    { color: 'Black', size: '4XL', stock: 10 },
    { color: 'Mint', size: 'S', stock: 10 }, { color: 'Mint', size: 'M', stock: 10 },
    { color: 'Mint', size: 'L', stock: 10 }, { color: 'Mint', size: 'XL', stock: 10 },
    { color: 'Mint', size: 'XXL', stock: 10 }, { color: 'Mint', size: '3XL', stock: 10 },
    { color: 'Mint', size: '4XL', stock: 10 },
    { color: 'Broken White', size: 'S', stock: 10 }, { color: 'Broken White', size: 'M', stock: 10 },
    { color: 'Broken White', size: 'L', stock: 10 }, { color: 'Broken White', size: 'XL', stock: 10 },
    { color: 'Broken White', size: 'XXL', stock: 10 }, { color: 'Broken White', size: '3XL', stock: 10 },
    { color: 'Broken White', size: '4XL', stock: 10 }
  ],
  'Basic Series Football Teamwear': [
    { color: 'Putih/Hijau', size: 'S', stock: 20 }, { color: 'Putih/Hijau', size: 'M', stock: 20 },
    { color: 'Putih/Hijau', size: 'L', stock: 20 }, { color: 'Putih/Hijau', size: 'XL', stock: 20 },
    { color: 'Putih/Hijau', size: 'XXL', stock: 20 },
    { color: 'Putih/Army', size: 'S', stock: 20 }, { color: 'Putih/Army', size: 'M', stock: 20 },
    { color: 'Putih/Army', size: 'L', stock: 20 }, { color: 'Putih/Army', size: 'XL', stock: 20 },
    { color: 'Putih/Army', size: 'XXL', stock: 20 },
    { color: 'Putih/Maroon', size: 'S', stock: 20 }, { color: 'Putih/Maroon', size: 'M', stock: 20 },
    { color: 'Putih/Maroon', size: 'L', stock: 20 }, { color: 'Putih/Maroon', size: 'XL', stock: 20 },
    { color: 'Putih/Maroon', size: 'XXL', stock: 20 },
    { color: 'Maroon/Putih', size: 'S', stock: 20 }, { color: 'Maroon/Putih', size: 'M', stock: 20 },
    { color: 'Maroon/Putih', size: 'L', stock: 20 }, { color: 'Maroon/Putih', size: 'XL', stock: 20 },
    { color: 'Maroon/Putih', size: 'XXL', stock: 20 },
    { color: 'Merah/Hitam', size: 'S', stock: 20 }, { color: 'Merah/Hitam', size: 'M', stock: 20 },
    { color: 'Merah/Hitam', size: 'L', stock: 20 }, { color: 'Merah/Hitam', size: 'XL', stock: 20 },
    { color: 'Merah/Hitam', size: 'XXL', stock: 20 },
    { color: 'Kuning/Hitam', size: 'S', stock: 20 }, { color: 'Kuning/Hitam', size: 'M', stock: 20 },
    { color: 'Kuning/Hitam', size: 'L', stock: 20 }, { color: 'Kuning/Hitam', size: 'XL', stock: 20 },
    { color: 'Kuning/Hitam', size: 'XXL', stock: 20 },
    { color: 'Hijau/Putih', size: 'S', stock: 20 }, { color: 'Hijau/Putih', size: 'M', stock: 20 },
    { color: 'Hijau/Putih', size: 'L', stock: 20 }, { color: 'Hijau/Putih', size: 'XL', stock: 20 },
    { color: 'Hijau/Putih', size: 'XXL', stock: 20 },
    { color: 'Turkish/Putih', size: 'S', stock: 20 }, { color: 'Turkish/Putih', size: 'M', stock: 20 },
    { color: 'Turkish/Putih', size: 'L', stock: 20 }, { color: 'Turkish/Putih', size: 'XL', stock: 20 },
    { color: 'Turkish/Putih', size: 'XXL', stock: 20 }
  ],
  'Black Navy Waterproof Jacket': [
    { color: 'Hitam & Navy', size: 'M', stock: 10 }, { color: 'Hitam & Navy', size: 'L', stock: 10 },
    { color: 'Hitam & Navy', size: 'XL', stock: 10 }, { color: 'Hitam & Navy', size: 'XXL', stock: 10 }
  ],
  'Jeta Running Shorts - Everest Series': [
    { color: 'Army', size: 'S', stock: 15 }, { color: 'Army', size: 'M', stock: 15 },
    { color: 'Army', size: 'L', stock: 15 }, { color: 'Army', size: 'XL', stock: 15 },
    { color: 'Army', size: 'XXL', stock: 15 }, { color: 'Army', size: '3XL', stock: 15 },
    { color: 'Hitam', size: 'S', stock: 15 }, { color: 'Hitam', size: 'M', stock: 15 },
    { color: 'Hitam', size: 'L', stock: 15 }, { color: 'Hitam', size: 'XL', stock: 15 },
    { color: 'Hitam', size: 'XXL', stock: 15 }, { color: 'Hitam', size: '3XL', stock: 15 },
    { color: 'Maroon', size: 'S', stock: 15 }, { color: 'Maroon', size: 'M', stock: 15 },
    { color: 'Maroon', size: 'L', stock: 15 }, { color: 'Maroon', size: 'XL', stock: 15 },
    { color: 'Maroon', size: 'XXL', stock: 15 }, { color: 'Maroon', size: '3XL', stock: 15 },
    { color: 'Silver', size: 'S', stock: 15 }, { color: 'Silver', size: 'M', stock: 15 },
    { color: 'Silver', size: 'L', stock: 15 }, { color: 'Silver', size: 'XL', stock: 15 },
    { color: 'Silver', size: 'XXL', stock: 15 }, { color: 'Silver', size: '3XL', stock: 15 },
    { color: 'Tosca', size: 'S', stock: 15 }, { color: 'Tosca', size: 'M', stock: 15 },
    { color: 'Tosca', size: 'L', stock: 15 }, { color: 'Tosca', size: 'XL', stock: 15 },
    { color: 'Tosca', size: 'XXL', stock: 15 }, { color: 'Tosca', size: '3XL', stock: 15 }
  ],
  'Tshirt Jeta Cotton Combed 24s': [
    { color: 'Hitam', size: 'M', stock: 1 }, { color: 'Hitam', size: 'L', stock: 1 },
    { color: 'Hitam', size: 'XL', stock: 1 }, { color: 'Hitam', size: 'XXL', stock: 1 },
    { color: 'Merah', size: 'M', stock: 1 }, { color: 'Merah', size: 'L', stock: 1 },
    { color: 'Merah', size: 'XL', stock: 1 }, { color: 'Merah', size: 'XXL', stock: 1 }
  ],
  'Kaos Kaki Sambung - Sleeveless Socks': [
    { color: 'Hitam', stock: 50 }, { color: 'Putih', stock: 50 },
    { color: 'Abu Muda', stock: 50 }, { color: 'Abu Tua', stock: 50 },
    { color: 'Merah', stock: 50 }, { color: 'Oranye', stock: 50 },
    { color: 'Kuning', stock: 50 }, { color: 'Gold', stock: 50 },
    { color: 'Ungu Tua', stock: 50 }, { color: 'Dusty Pink', stock: 50 },
    { color: 'Pink Baby', stock: 50 }, { color: 'Hijau Tosca', stock: 50 },
    { color: 'Biru Tosca', stock: 50 }, { color: 'Hijau Botol', stock: 50 },
    { color: 'Army', stock: 50 }, { color: 'Biru Langit', stock: 50 },
    { color: 'Stabilo', stock: 50 }, { color: 'Biru', stock: 50 },
    { color: 'Hijau Fuji', stock: 50 }, { color: 'Navy', stock: 50 }
  ],
  'Kinesio Tape 5cm x 5m Therapy Tapping Original': [
    { color: 'Hitam', stock: 13 }, { color: 'Putih', stock: 13 },
    { color: 'Cream', stock: 13 }, { color: 'Hijau', stock: 13 },
    { color: 'Biru Tua', stock: 13 }, { color: 'Pink', stock: 13 },
    { color: 'Ungu', stock: 13 }, { color: 'Biru Muda', stock: 13 },
    { color: 'Oren', stock: 13 }, { color: 'Kuning', stock: 13 }
  ],
  'Archipelago Indonesian Football Fantasy Jersey': [
    { color: 'Red', size: 'S', stock: 10 }, { color: 'Red', size: 'M', stock: 10 },
    { color: 'Red', size: 'L', stock: 10 }, { color: 'Red', size: 'XL', stock: 10 },
    { color: 'Red', size: 'XXL', stock: 10 }, { color: 'Red', size: 'XXXL', stock: 10 },
    { color: 'Red', size: 'XXXXL', stock: 10 }, { color: 'Red', size: 'XXXXXL', stock: 10 },
    { color: 'White', size: 'S', stock: 10 }, { color: 'White', size: 'M', stock: 10 },
    { color: 'White', size: 'L', stock: 10 }, { color: 'White', size: 'XL', stock: 10 },
    { color: 'White', size: 'XXL', stock: 10 }, { color: 'White', size: 'XXXL', stock: 10 },
    { color: 'White', size: 'XXXXL', stock: 10 }, { color: 'White', size: 'XXXXXL', stock: 10 }
  ],
  'Kaos Kaki Sepakbola Anti Slip': [
    { color: 'Hitam', stock: 25 }, { color: 'Putih', stock: 25 },
    { color: 'Kuning', stock: 25 }, { color: 'Navy', stock: 25 },
    { color: 'Merah', stock: 25 }, { color: 'Maroon', stock: 25 },
    { color: 'Hijau', stock: 25 }, { color: 'Biru', stock: 25 },
    { color: 'Kunyit', stock: 25 }
  ],
  'Jeta Celana Training Half Pants': [
    { size: 'S', stock: 7 }, { size: 'M', stock: 7 }, { size: 'L', stock: 7 },
    { size: 'XL', stock: 7 }, { size: 'XXL', stock: 7 }, { size: '3XL', stock: 7 }
  ],
  'Surge Series Football Teamwear': [
    { color: 'Hijau', size: 'S', stock: 15 }, { color: 'Hijau', size: 'M', stock: 15 },
    { color: 'Hijau', size: 'L', stock: 15 }, { color: 'Hijau', size: 'XL', stock: 15 },
    { color: 'Hijau', size: 'XXL', stock: 15 }, { color: 'Hijau', size: '3XL', stock: 15 },
    { color: 'Merah', size: 'S', stock: 15 }, { color: 'Merah', size: 'M', stock: 15 },
    { color: 'Merah', size: 'L', stock: 15 }, { color: 'Merah', size: 'XL', stock: 15 },
    { color: 'Merah', size: 'XXL', stock: 15 }, { color: 'Merah', size: '3XL', stock: 15 },
    { color: 'Navy', size: 'S', stock: 15 }, { color: 'Navy', size: 'M', stock: 15 },
    { color: 'Navy', size: 'L', stock: 15 }, { color: 'Navy', size: 'XL', stock: 15 },
    { color: 'Navy', size: 'XXL', stock: 15 }, { color: 'Navy', size: '3XL', stock: 15 },
    { color: 'Kuning', size: 'S', stock: 15 }, { color: 'Kuning', size: 'M', stock: 15 },
    { color: 'Kuning', size: 'L', stock: 15 }, { color: 'Kuning', size: 'XL', stock: 15 },
    { color: 'Kuning', size: 'XXL', stock: 15 }, { color: 'Kuning', size: '3XL', stock: 15 },
    { color: 'Blue', size: 'S', stock: 15 }, { color: 'Blue', size: 'M', stock: 15 },
    { color: 'Blue', size: 'L', stock: 15 }, { color: 'Blue', size: 'XL', stock: 15 },
    { color: 'Blue', size: 'XXL', stock: 15 }, { color: 'Blue', size: '3XL', stock: 15 }
  ],
  'MV Print': [
    { stock: 3 }
  ]
};

async function main() {
  console.log('🌱 Seeding sizes, colors, and product variants...');

  // Seed sizes
  const sizeMap = {};
  for (const s of sizesData) {
    const size = await prisma.size.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
    sizeMap[s.name] = size.id;
  }
  console.log(`✅ ${sizesData.length} sizes seeded.`);

  // Seed colors
  const colorMap = {};
  for (const c of colorsData) {
    const color = await prisma.color.upsert({
      where: { name: c.name },
      update: { hex_code: c.hex_code },
      create: c
    });
    colorMap[c.name] = color.id;
  }
  console.log(`✅ ${colorsData.length} colors seeded.`);

  // Clear existing product variants
  await prisma.productVariant.deleteMany({});
  console.log('🗑️  Existing product variants cleared.');

  const products = await prisma.product.findMany();
  let totalVariants = 0;

  for (const product of products) {
    const variantList = productVariants[product.name];
    if (!variantList) {
      console.log(`⚠️  No variant data for product: ${product.name}`);
      continue;
    }

    for (const v of variantList) {
      const colorId = v.color ? colorMap[v.color] || null : null;
      const sizeId = v.size ? sizeMap[v.size] || null : null;

      await prisma.productVariant.create({
        data: {
          product_id: product.id,
          size_id: sizeId,
          color_id: colorId,
          stock: v.stock,
          price_adjustment: 0,
        }
      });
      totalVariants++;
    }
    console.log(`✅ ${variantList.length} variants for: ${product.name}`);
  }

  console.log(`\n📊 Summary: ${totalVariants} product variants created.`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
