const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    name: 'Dharma Ayu Pop Culture - Jersey Olahraga Bertema Kota',
    description: 'Jersey olahraga dengan tema kota, desain unik dan berkualitas',
    price: 89000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'Jersey Persib Edisi Spesial Back to Back',
    description: 'Jersey Persib edisi spesial back to back, ready big size S-4XL',
    price: 150000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'Jeta Running Jersey Basic Superlight',
    description: 'Running jersey basic superlight, nyaman dan adem dipakai',
    price: 99000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'Basic Series Football Teamwear',
    description: 'Basic series football teamwear, cocok untuk tim sepakbola dan futsal',
    price: 79000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'Black Navy Waterproof Jacket',
    description: 'Jaket waterproof musim hujan, bahan tebal dan anti air',
    price: 279000,
    image: null,
    category_name: 'Jaket'
  },
  {
    name: 'Jeta Running Shorts - Everest Series',
    description: 'Celana running gym fitness multifungsi, nyaman dan elastis',
    price: 159000,
    image: null,
    category_name: 'Celana'
  },
  {
    name: 'Tshirt Jeta Cotton Combed 24s',
    description: 'Kaos dengan bahan cotton combed 24s, adem dan nyaman dipakai',
    price: 75000,
    image: null,
    category_name: 'Kaos'
  },
  {
    name: 'Kaos Kaki Sambung - Sleeveless Socks',
    description: 'Kaos kaki sambung dengan 20 pilihan warna, nyaman dipakai',
    price: 35000,
    image: null,
    category_name: 'Kaos Kaki'
  },
  {
    name: 'Kinesio Tape 5cm x 5m Therapy Tapping Original',
    description: 'Kinesio tape therapy tapping original, berbagai pilihan warna',
    price: 30000,
    image: null,
    category_name: 'Aksesoris'
  },
  {
    name: 'Archipelago Indonesian Football Fantasy Jersey',
    description: 'Jersey fantasy Timnas Indonesia, desain kepulauan Nusantara',
    price: 175000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'Kaos Kaki Sepakbola Anti Slip',
    description: 'Kaos kaki sepakbola anti slip panjang, cocok untuk futsal dan sepakbola',
    price: 50150,
    image: null,
    category_name: 'Kaos Kaki'
  },
  {
    name: 'Jeta Celana Training Half Pants',
    description: 'Celana training pendek selutut, cocok untuk sport lari gym sepeda',
    price: 199000,
    image: null,
    category_name: 'Celana'
  },
  {
    name: 'Surge Series Football Teamwear',
    description: 'Surge series football teamwear, setelan jersey sepakbola dan futsal',
    price: 149000,
    image: null,
    category_name: 'Jersey'
  },
  {
    name: 'MV Print',
    description: 'MV Print - produk cetak berkualitas',
    price: 84150,
    image: null,
    category_name: 'Aksesoris'
  }
];

async function main() {
  console.log('🌱 Seeding products...');

  const categories = await prisma.category.findMany();
  const categoryMap = {};
  categories.forEach(cat => { categoryMap[cat.name] = cat.id; });

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of products) {
    const categoryId = categoryMap[product.category_name];
    if (!categoryId) {
      console.log(`⚠️  Category "${product.category_name}" not found, skipping: ${product.name}`);
      errorCount++;
      continue;
    }

    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
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
      console.log(`✅ Created product: ${product.name}`);
    }
  }

  console.log(`\n📊 Summary: ${createdCount} created, ${skippedCount} skipped, ${errorCount} errors`);
}

async function down() {
  for (const product of products) {
    await prisma.product.deleteMany({ where: { name: product.name } });
  }
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}
