const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding accesses for SUPERADMIN only...\n');

  const pages = await prisma.page.findMany();
  const roles = await prisma.role.findMany();

  if (pages.length === 0) {
    console.log('⚠️  No pages found. Please run page seeder first.');
    return;
  }
  if (roles.length === 0) {
    console.log('⚠️  No roles found. Please run role seeder first.');
    return;
  }

  // Cari role Superadmin
  const superadminRole = roles.find(role => role.name === 'superadmin' || role.id === 1);
  
  if (!superadminRole) {
    console.log('⚠️  Superadmin role not found!');
    return;
  }

  console.log(`📌 Processing accesses for ${superadminRole.name} (ID: ${superadminRole.id})...\n`);

  let createdCount = 0;
  let updatedCount = 0;

  // Hapus semua access yang ada untuk superadmin
  await prisma.access.deleteMany({
    where: { role_id: superadminRole.id }
  });
  console.log(`🗑️  Cleared existing accesses for ${superadminRole.name}`);

  // Buat access baru untuk semua page
  for (const page of pages) {
    const accessName = `${superadminRole.name}_${page.name}`;

    await prisma.access.create({
      data: {
        name: accessName,
        create: true,
        read: true,
        update: true,
        delete: true,
        role_id: superadminRole.id,
        page_id: page.id,
      },
    });
    createdCount++;
    console.log(`  ✅ Created access: ${superadminRole.name} -> ${page.name} (ID:${page.id})`);
  }

  console.log(`\n📊 Summary for SUPERADMIN:`);
  console.log(`✅ Created: ${createdCount} new accesses`);
  console.log(`🔄 Updated: ${updatedCount} existing accesses`);

  const allAccesses = await prisma.access.findMany({
    where: { role_id: superadminRole.id },
    include: { role: { select: { name: true } }, page: { select: { name: true, id: true } } },
    orderBy: { page_id: 'asc' },
  });

  console.log(`\n📄 All accesses for ${superadminRole.name} (${allAccesses.length} total):`);
  allAccesses.forEach(access => {
    console.log(`  ${access.role.name} -> ${access.page.name} (ID:${access.page.id}): FULL ACCESS`);
  });
}

async function down() {
  console.log('🗑️ Rolling back accesses...');
  await prisma.access.deleteMany({});
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch(e => console.error('❌ Access seed failed:', e))
    .finally(() => prisma.$disconnect());
}