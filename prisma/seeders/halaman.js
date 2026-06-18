const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const halamanData = [
  {
    name: 'dashboard',
    label: 'Beranda',
    description: 'Dashboard utama',
    sort_order: 1,
    modules: [
      { pageName: 'Auth', can_read: true },
    ],
  },
  {
    name: 'product-management',
    label: 'Manajemen Produk',
    description: 'Kelola produk katalog, kategori, varian',
    sort_order: 2,
    modules: [
      { pageName: 'Products', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'ProductVariants', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Categories', can_read: true },
      { pageName: 'Colors', can_read: true },
      { pageName: 'Sizes', can_read: true },
      { pageName: 'Attributes', can_read: true },
      { pageName: 'Materials', can_read: true },
    ],
  },
  {
    name: 'cms',
    label: 'Manajemen CMS',
    description: 'Kelola konten website: carousel, portofolio, rekomendasi',
    sort_order: 3,
    modules: [
      { pageName: 'Carousels', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Portofolio', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'RecommendedProducts', can_create: true, can_read: true, can_update: true, can_delete: true },
    ],
  },
  {
    name: 'customers',
    label: 'Pelanggan',
    description: 'Data pelanggan',
    sort_order: 4,
    modules: [
      { pageName: 'CustomerData', can_read: true },
    ],
  },
  {
    name: 'catalog-orders',
    label: 'Pesanan Katalog',
    description: 'Pesanan produk katalog',
    sort_order: 5,
    modules: [
      { pageName: 'Orders', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'OrderItems', can_read: true },
    ],
  },
  {
    name: 'custom-orders',
    label: 'Pesanan Kustom',
    description: 'Pesanan kustom jersey dan lainnya',
    sort_order: 6,
    modules: [
      { pageName: 'CustomOrders', can_create: true, can_read: true, can_update: true, can_delete: true },
    ],
  },
  {
    name: 'staff-account',
    label: 'Manajemen Staff & Akun',
    description: 'Kelola staff dan akun pengguna',
    sort_order: 7,
    modules: [
      { pageName: 'Staffs', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Users', can_create: true, can_read: true, can_update: true, can_delete: true },
    ],
  },
  {
    name: 'system-access',
    label: 'Sistem & Akses',
    description: 'Konfigurasi sistem, role, log aktivitas',
    sort_order: 8,
    modules: [
      { pageName: 'Roles', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'ActivityLogs', can_read: true },
      { pageName: 'PaymentMethods', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Logistics', can_read: true },
    ],
  },
  {
    name: 'production',
    label: 'Produksi',
    description: 'Manajemen produksi, monitoring, assignment',
    sort_order: 9,
    modules: [
      { pageName: 'ProductionLogs', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'ProgressReports', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'WorkLogs', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Projects', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Stages', can_read: true },
    ],
  },
  {
    name: 'payment-finance',
    label: 'Pembayaran & Finance',
    description: 'Verifikasi pembayaran, finance, laporan',
    sort_order: 10,
    modules: [
      { pageName: 'Payments', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Finance', can_read: true },
      { pageName: 'SalaryProjects', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'Reports', can_read: true },
    ],
  },
  {
    name: 'customization',
    label: 'Kustomisasi Produk',
    description: 'Varian kustom, opsi, template jersey',
    sort_order: 11,
    modules: [
      { pageName: 'CustomVariants', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'VariantOptions', can_create: true, can_read: true, can_update: true, can_delete: true },
      { pageName: 'JerseyTemplates', can_create: true, can_read: true, can_update: true, can_delete: true },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding halaman...');

  let created = 0;
  let updated = 0;

  for (const h of halamanData) {
    const { modules, ...hData } = h;

    const existing = await prisma.halaman.findUnique({ where: { name: hData.name } });

    let halaman;
    if (existing) {
      halaman = await prisma.halaman.update({
        where: { id: existing.id },
        data: hData,
      });
      updated++;
      console.log(`🔄 Updated halaman: ${hData.label}`);
    } else {
      halaman = await prisma.halaman.create({ data: hData });
      created++;
      console.log(`✅ Created halaman: ${hData.label}`);
    }

    // Upsert modules
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const page = await prisma.page.findFirst({ where: { name: mod.pageName } });
      if (!page) {
        console.warn(`⚠️  Page "${mod.pageName}" not found, skipping module for ${hData.label}`);
        continue;
      }

      const existingMod = await prisma.halamanModule.findFirst({
        where: { halaman_id: halaman.id, page_id: page.id },
      });

      const modData = {
        halaman_id: halaman.id,
        page_id: page.id,
        can_create: mod.can_create ?? false,
        can_read: mod.can_read ?? true,
        can_update: mod.can_update ?? false,
        can_delete: mod.can_delete ?? false,
        sort_order: i,
      };

      if (existingMod) {
        await prisma.halamanModule.update({
          where: { id: existingMod.id },
          data: modData,
        });
      } else {
        await prisma.halamanModule.create({ data: modData });
      }
    }
  }

  console.log(`\n📊 Halaman summary:`);
  console.log(`✅ Created: ${created}`);
  console.log(`🔄 Updated: ${updated}`);

  const allHalaman = await prisma.halaman.findMany({
    include: { modules: { include: { page: true }, orderBy: { sort_order: 'asc' } } },
    orderBy: { sort_order: 'asc' },
  });
  console.log(`\n📄 All halaman (${allHalaman.length} total):`);
  allHalaman.forEach(h => {
    const modNames = h.modules.map(m => `${m.page.name}(${m.can_read?'R':''}${m.can_create?'C':''}${m.can_update?'U':''}${m.can_delete?'D':''})`).join(', ');
    console.log(`  ${h.sort_order}. ${h.label} → ${modNames}`);
  });
}

async function down() {
  console.log('🗑️ Rolling back halaman...');
  await prisma.halamanModule.deleteMany({});
  await prisma.halaman.deleteMany({});
  console.log('↩️ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch(e => console.error('❌ Halaman seed failed:', e))
    .finally(() => prisma.$disconnect());
}
