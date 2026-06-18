const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roles = [
  { id: 1, name: 'superadmin', level: 1, description: 'Super Administrator - Full access to everything', explicit_page_ids: [] },
  { id: 2, name: 'admin', level: 2, description: 'Administrator - Manage operational data', explicit_page_ids: [] },
  { id: 3, name: 'staff', level: 3, description: 'Staff - Limited access for daily operations', explicit_page_ids: [] },
  { id: 4, name: 'customer', level: 4, description: 'Customer - Customer access only', explicit_page_ids: [] },
  { id: 5, name: 'finance', level: 5, description: 'Finance - Manage payments and salaries', explicit_page_ids: [] },
];

async function main() {
  console.log('🌱 Seeding roles...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const role of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name }
    });

    if (existingRole) {
      skippedCount++;
      console.log(`⏭️  Role already exists: ${role.name} (ID: ${existingRole.id})`);
    } else {
      await prisma.role.create({ data: role });
      createdCount++;
      console.log(`✅ Created role: ${role.name} (ID: ${role.id}, Level: ${role.level})`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${createdCount} new roles`);
  console.log(`⏭️  Skipped: ${skippedCount} existing roles`);

  const allRoles = await prisma.role.findMany({ orderBy: { level: 'asc' } });
  console.log(`\n📄 All roles in database (${allRoles.length} total):`);
  allRoles.forEach(role => {
    console.log(`  ${role.level}. ${role.name} (ID: ${role.id})`);
  });
}

async function down() {
  console.log('🗑️ Rolling back roles...');
  for (const role of roles) {
    await prisma.role.deleteMany({ where: { name: role.name } });
  }
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main()
    .catch((e) => console.error('❌ Role seed failed:', e))
    .finally(() => prisma.$disconnect());
}