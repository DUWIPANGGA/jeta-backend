const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOptionId(customVariantName, optionName) {
  const variant = await prisma.customVariant.findFirst({
    where: { name: customVariantName },
  });
  if (!variant) {
    console.log(`  ⚠️  Custom variant "${customVariantName}" not found`);
    return null;
  }
  const option = await prisma.variantOption.findFirst({
    where: { name: optionName, custom_variant_id: variant.id },
  });
  if (!option) {
    console.log(`  ⚠️  Variant option "${optionName}" (${customVariantName}) not found`);
    return null;
  }
  return option.id;
}

const templates = [
  {
    name: 'Jersey Classic',
    image: '/uploads/jersey-templates/classic.jpg',
    description: 'Jersey klasik dengan potongan standar, cocok untuk futsal dan olahraga santai.',
    status: true,
    combinations: [
      { color: 'Merah', size: 'M', material: 'Polyester' },
      { color: 'Merah', size: 'L', material: 'Polyester' },
      { color: 'Merah', size: 'XL', material: 'Polyester' },
      { color: 'Biru', size: 'M', material: 'Polyester' },
      { color: 'Biru', size: 'L', material: 'Polyester' },
      { color: 'Biru', size: 'XL', material: 'Polyester' },
      { color: 'Hijau', size: 'M', material: 'Polyester' },
      { color: 'Hijau', size: 'L', material: 'Polyester' },
      { color: 'Hijau', size: 'XL', material: 'Polyester' },
    ],
  },
  {
    name: 'Jersey Premium Dry-Fit',
    image: '/uploads/jersey-templates/premium.jpg',
    description: 'Jersey dengan bahan dry-fit premium, ringan dan cepat kering.',
    status: true,
    combinations: [
      { color: 'Hitam', size: 'L', material: 'Spandex' },
      { color: 'Hitam', size: 'XL', material: 'Spandex' },
      { color: 'Hitam', size: 'XXL', material: 'Spandex' },
      { color: 'Putih', size: 'L', material: 'Spandex' },
      { color: 'Putih', size: 'XL', material: 'Spandex' },
      { color: 'Putih', size: 'XXL', material: 'Spandex' },
      { color: 'Navy', size: 'L', material: 'Spandex' },
      { color: 'Navy', size: 'XL', material: 'Spandex' },
      { color: 'Navy', size: 'XXL', material: 'Spandex' },
    ],
  },
  {
    name: 'Jersey Economy',
    image: '/uploads/jersey-templates/economy.jpg',
    description: 'Jersey ekonomis dengan bahan nyaman, cocok untuk latihan harian.',
    status: true,
    combinations: [
      { color: 'Kuning', size: 'S', material: 'Combed 20s' },
      { color: 'Kuning', size: 'M', material: 'Combed 20s' },
      { color: 'Kuning', size: 'L', material: 'Combed 20s' },
      { color: 'Abu-abu', size: 'S', material: 'Combed 20s' },
      { color: 'Abu-abu', size: 'M', material: 'Combed 20s' },
      { color: 'Abu-abu', size: 'L', material: 'Combed 20s' },
    ],
  },
  {
    name: 'Jersey Full Sublim',
    image: '/uploads/jersey-templates/sublim.jpg',
    description: 'Jersey full sublimasi, warna tidak mudah luntur dan desain bebas.',
    status: true,
    combinations: [
      { color: 'Merah', size: 'XL', material: 'Combed 30s' },
      { color: 'Biru', size: 'XL', material: 'Combed 30s' },
      { color: 'Hijau', size: 'XL', material: 'Combed 30s' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding jersey templates...\n');

  let created = 0;
  let skipped = 0;

  for (const tpl of templates) {
    const existing = await prisma.jerseyTemplate.findFirst({
      where: { name: tpl.name },
    });

    if (existing) {
      console.log(`  ⏭️  Jersey template already exists: ${tpl.name}`);
      skipped++;
      continue;
    }

    const combinationData = [];
    let hasMissing = false;

    for (const combo of tpl.combinations) {
      const colorId = await getOptionId('Warna', combo.color);
      const sizeId = await getOptionId('Ukuran', combo.size);
      const materialId = await getOptionId('Bahan', combo.material);
      if (!colorId || !sizeId || !materialId) {
        hasMissing = true;
        continue;
      }
      combinationData.push({
        color_option_id: colorId,
        size_option_id: sizeId,
        material_option_id: materialId,
      });
    }

    if (hasMissing) {
      console.log(`  ⚠️  Skipping template "${tpl.name}" - some variant options missing`);
      skipped++;
      continue;
    }

    await prisma.jerseyTemplate.create({
      data: {
        name: tpl.name,
        image: tpl.image,
        description: tpl.description,
        status: tpl.status,
        combinations: {
          create: combinationData,
        },
      },
    });

    created++;
    console.log(`  ✅ Created jersey template: ${tpl.name} (${combinationData.length} combinations)`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Created: ${created} jersey templates`);
  console.log(`  ⏭️  Skipped: ${skipped} existing/missing`);
}

async function down() {
  console.log('\n🗑️ Rolling back jersey templates...');
  await prisma.templateCombination.deleteMany({});
  await prisma.jerseyTemplate.deleteMany({});
  console.log('✅ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => console.error('❌ Seeding failed:', e))
    .finally(() => prisma.$disconnect());
}
