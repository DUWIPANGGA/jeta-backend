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
    colors: ['Merah', 'Biru', 'Hijau'],
    sizes: ['M', 'L', 'XL'],
    materials: ['Polyester'],
  },
  {
    name: 'Jersey Premium Dry-Fit',
    image: '/uploads/jersey-templates/premium.jpg',
    description: 'Jersey dengan bahan dry-fit premium, ringan dan cepat kering.',
    status: true,
    colors: ['Hitam', 'Putih', 'Navy'],
    sizes: ['L', 'XL', 'XXL'],
    materials: ['Spandex'],
  },
  {
    name: 'Jersey Economy',
    image: '/uploads/jersey-templates/economy.jpg',
    description: 'Jersey ekonomis dengan bahan nyaman, cocok untuk latihan harian.',
    status: true,
    colors: ['Kuning', 'Abu-abu'],
    sizes: ['S', 'M', 'L'],
    materials: ['Combed 20s'],
  },
  {
    name: 'Jersey Full Sublim',
    image: '/uploads/jersey-templates/sublim.jpg',
    description: 'Jersey full sublimasi, warna tidak mudah luntur dan desain bebas.',
    status: true,
    colors: ['Merah', 'Biru', 'Hijau'],
    sizes: ['XL'],
    materials: ['Combed 30s'],
  },
];

async function main() {
  console.log('🌱 Seeding jersey templates...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const tpl of templates) {
    const existing = await prisma.jerseyTemplate.findFirst({
      where: { name: tpl.name },
    });

    const colorIds = [];
    for (const name of tpl.colors) {
      const id = await getOptionId('Warna', name);
      if (!id) { console.log(`  ⚠️  Color "${name}" not found`); break; }
      colorIds.push(id);
    }
    if (colorIds.length !== tpl.colors.length) { skipped++; continue; }

    const sizeIds = [];
    for (const name of tpl.sizes) {
      const id = await getOptionId('Ukuran', name);
      if (!id) { console.log(`  ⚠️  Size "${name}" not found`); break; }
      sizeIds.push(id);
    }
    if (sizeIds.length !== tpl.sizes.length) { skipped++; continue; }

    const materialIds = [];
    for (const name of tpl.materials) {
      const id = await getOptionId('Bahan', name);
      if (!id) { console.log(`  ⚠️  Material "${name}" not found`); break; }
      materialIds.push(id);
    }
    if (materialIds.length !== tpl.materials.length) { skipped++; continue; }

    if (existing) {
      // Update existing template with new options
      await prisma.templateColor.deleteMany({ where: { jersey_template_id: existing.id } });
      await prisma.templateSize.deleteMany({ where: { jersey_template_id: existing.id } });
      await prisma.templateMaterial.deleteMany({ where: { jersey_template_id: existing.id } });
      await prisma.templateColor.createMany({
        data: colorIds.map(id => ({ jersey_template_id: existing.id, variant_option_id: id })),
      });
      await prisma.templateSize.createMany({
        data: sizeIds.map(id => ({ jersey_template_id: existing.id, variant_option_id: id })),
      });
      await prisma.templateMaterial.createMany({
        data: materialIds.map(id => ({ jersey_template_id: existing.id, variant_option_id: id })),
      });
      updated++;
      console.log(`  🔄 Updated jersey template: ${tpl.name}`);
    } else {
      await prisma.jerseyTemplate.create({
        data: {
          name: tpl.name,
          image: tpl.image,
          description: tpl.description,
          status: tpl.status,
          colors: { create: colorIds.map(id => ({ variant_option_id: id })) },
          sizes: { create: sizeIds.map(id => ({ variant_option_id: id })) },
          materials: { create: materialIds.map(id => ({ variant_option_id: id })) },
        },
      });
      created++;
      console.log(`  ✅ Created jersey template: ${tpl.name}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Created: ${created} jersey templates`);
  console.log(`  🔄 Updated: ${updated} jersey templates`);
  console.log(`  ⏭️  Skipped: ${skipped} missing options`);
}

async function down() {
  console.log('\n🗑️ Rolling back jersey templates...');
  await prisma.templateColor.deleteMany({});
  await prisma.templateSize.deleteMany({});
  await prisma.templateMaterial.deleteMany({});
  await prisma.jerseyTemplate.deleteMany({});
  console.log('✅ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => console.error('❌ Seeding failed:', e))
    .finally(() => prisma.$disconnect());
}
