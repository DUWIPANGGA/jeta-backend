const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Data Custom Variant (jenis varian) - tanpa description
const customVariants = [
  { name: 'Neck', status: true },
  { name: 'Lengan', status: true },
  { name: 'Warna', status: true },
  { name: 'Ukuran', status: true },
  { name: 'Bahan', status: true },
  { name: 'Sablon', status: true },
];

// Data Variant Option (pilihan dari setiap custom variant) - tanpa description
const variantOptions = [
  // Neck options
  { custom_variant_name: 'Neck', name: 'V-Neck', status: true },
  { custom_variant_name: 'Neck', name: 'O-Neck', status: true },
  { custom_variant_name: 'Neck', name: 'Polo Collar', status: true },
  { custom_variant_name: 'Neck', name: 'Turtleneck', status: true },
  
  // Lengan options
  { custom_variant_name: 'Lengan', name: 'Lengan Pendek', status: true },
  { custom_variant_name: 'Lengan', name: 'Lengan Panjang', status: true },
  { custom_variant_name: 'Lengan', name: 'Tanpa Lengan', status: true },
  
  // Warna options
  { custom_variant_name: 'Warna', name: 'Hitam', description: '#000000', status: true },
  { custom_variant_name: 'Warna', name: 'Putih', description: '#FFFFFF', status: true },
  { custom_variant_name: 'Warna', name: 'Merah', description: '#FF0000', status: true },
  { custom_variant_name: 'Warna', name: 'Biru', description: '#0000FF', status: true },
  { custom_variant_name: 'Warna', name: 'Kuning', description: '#FFFF00', status: true },
  { custom_variant_name: 'Warna', name: 'Hijau', description: '#008000', status: true },
  { custom_variant_name: 'Warna', name: 'Navy', description: '#000080', status: true },
  { custom_variant_name: 'Warna', name: 'Abu-abu', description: '#808080', status: true },
  
  // Ukuran options
  { custom_variant_name: 'Ukuran', name: 'S', status: true },
  { custom_variant_name: 'Ukuran', name: 'M', status: true },
  { custom_variant_name: 'Ukuran', name: 'L', status: true },
  { custom_variant_name: 'Ukuran', name: 'XL', status: true },
  { custom_variant_name: 'Ukuran', name: 'XXL', status: true },
  
  // Bahan options
  { custom_variant_name: 'Bahan', name: 'Combed 20s', status: true },
  { custom_variant_name: 'Bahan', name: 'Combed 24s', status: true },
  { custom_variant_name: 'Bahan', name: 'Combed 30s', status: true },
  { custom_variant_name: 'Bahan', name: 'Cotton Bamboo', status: true },
  { custom_variant_name: 'Bahan', name: 'Spandex', status: true },
  { custom_variant_name: 'Bahan', name: 'Polyester', status: true },
  
  // Sablon options
  { custom_variant_name: 'Sablon', name: 'Sablon Plastisol', status: true },
  { custom_variant_name: 'Sablon', name: 'Sablon Waterbase', status: true },
  { custom_variant_name: 'Sablon', name: 'Sablon Foil', status: true },
  { custom_variant_name: 'Sablon', name: 'Sablon Glow in the Dark', status: true },
  { custom_variant_name: 'Sablon', name: 'Bordir', status: true },
  { custom_variant_name: 'Sablon', name: 'Sublim', status: true },
];

async function getCustomVariantIdByName(name) {
  const variant = await prisma.customVariant.findFirst({
    where: { name: name },
  });
  return variant?.id;
}

async function main() {
  console.log('🌱 Seeding custom variants and variant options...\n');

  let createdVariants = 0;
  let updatedVariants = 0;
  let createdOptions = 0;
  let updatedOptions = 0;

  // ==================== SEED CUSTOM VARIANTS ====================
  console.log('📌 Processing Custom Variants...');
  
  for (const variant of customVariants) {
    const existing = await prisma.customVariant.findFirst({
      where: { name: variant.name },
    });

    if (existing) {
      if (existing.status !== variant.status) {
        await prisma.customVariant.update({
          where: { id: existing.id },
          data: { status: variant.status },
        });
        updatedVariants++;
        console.log(`  🔄 Updated custom variant: ${variant.name}`);
      } else {
        console.log(`  ⏭️  Custom variant already exists: ${variant.name}`);
      }
    } else {
      await prisma.customVariant.create({
        data: { name: variant.name, status: variant.status },
      });
      createdVariants++;
      console.log(`  ✅ Created custom variant: ${variant.name}`);
    }
  }

  // ==================== SEED VARIANT OPTIONS ====================
  console.log('\n📌 Processing Variant Options...');

  for (const option of variantOptions) {
    const customVariantId = await getCustomVariantIdByName(option.custom_variant_name);
    
    if (!customVariantId) {
      console.log(`  ⚠️  Skipping option "${option.name}" - Custom variant "${option.custom_variant_name}" not found`);
      continue;
    }

    const existing = await prisma.variantOption.findFirst({
      where: {
        name: option.name,
        custom_variant_id: customVariantId,
      },
    });

    if (existing) {
      if (existing.status !== option.status || existing.description !== (option.description || null)) {
        await prisma.variantOption.update({
          where: { id: existing.id },
          data: { 
            status: option.status,
            description: option.description || null,
          },
        });
        updatedOptions++;
        console.log(`  🔄 Updated variant option: ${option.name} (${option.custom_variant_name})`);
      } else {
        console.log(`  ⏭️  Variant option already exists: ${option.name} (${option.custom_variant_name})`);
      }
    } else {
      await prisma.variantOption.create({
        data: {
          name: option.name,
          custom_variant_id: customVariantId,
          status: option.status,
        },
      });
      createdOptions++;
      console.log(`  ✅ Created variant option: ${option.name} (${option.custom_variant_name})`);
    }
  }

  // ==================== SUMMARY ====================
  console.log('\n📊 Summary:');
  console.log(`✅ Custom Variants - Created: ${createdVariants}, Updated: ${updatedVariants}`);
  console.log(`✅ Variant Options - Created: ${createdOptions}, Updated: ${updatedOptions}`);

  // ==================== VERIFICATION ====================
  const allVariants = await prisma.customVariant.findMany({
    orderBy: { id: 'asc' },
    include: {
      options: {
        orderBy: { id: 'asc' },
      },
    },
  });

  console.log('\n📄 Verification:');
  for (const variant of allVariants) {
    console.log(`  ${variant.name} (ID: ${variant.id}) - ${variant.options.length} options`);
    for (const opt of variant.options) {
      console.log(`    - ${opt.name} (ID: ${opt.id})`);
    }
  }
}

async function down() {
  console.log('\n🗑️ Rolling back...');
  await prisma.variantOption.deleteMany({});
  await prisma.customVariant.deleteMany({});
  console.log('✅ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch(e => console.error('❌ Seeding failed:', e))
    .finally(() => prisma.$disconnect());
}