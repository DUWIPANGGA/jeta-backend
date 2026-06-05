const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superadminRole = await prisma.role.findFirst({ where: { name: 'superadmin' } });
  const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  const staffRole = await prisma.role.findFirst({ where: { name: 'staff' } });
  const userRole = await prisma.role.findFirst({ where: { name: 'customer' } });
  const financeRole = await prisma.role.findFirst({ where: { name: 'finance' } });

  if (!superadminRole || !adminRole || !staffRole || !userRole || !financeRole) {
    console.log('⚠️  Roles not found. Please run role seeder first.');
    return;
  }

  const users = [
    { name: 'Super Admin', email: 'superadmin@jeta.com', password: hashedPassword, address: 'Jeta Office', role_id: superadminRole.id, email_verified_at: new Date() },
    { name: 'Admin User', email: 'admin@jeta.com', password: hashedPassword, address: 'Jl. Admin No. 1', role_id: adminRole.id, email_verified_at: new Date() },
    { name: 'Finance User', email: 'finance@jeta.com', password: hashedPassword, address: 'Jl. Finance No. 1', role_id: financeRole.id, email_verified_at: new Date() },
    { name: 'Staff User 1', email: 'staff1@jeta.com', password: hashedPassword, address: 'Jl. Staff No. 1', role_id: staffRole.id, email_verified_at: new Date() },
    { name: 'Staff User 2', email: 'staff2@jeta.com', password: hashedPassword, address: 'Jl. Staff No. 2', role_id: staffRole.id, email_verified_at: new Date() },
    { name: 'Staff User 3', email: 'staff3@jeta.com', password: hashedPassword, address: 'Jl. Staff No. 3', role_id: staffRole.id, email_verified_at: new Date() },
    { name: 'Staff User 4', email: 'staff4@jeta.com', password: hashedPassword, address: 'Jl. Staff No. 4', role_id: staffRole.id, email_verified_at: new Date() },
    { name: 'Staff User 5', email: 'staff5@jeta.com', password: hashedPassword, address: 'Jl. Staff No. 5', role_id: staffRole.id, email_verified_at: new Date() },
    { name: 'Regular User', email: 'user@jeta.com', password: hashedPassword, address: 'Jl. User No. 3', role_id: userRole.id, email_verified_at: new Date() },
    { name: 'Budi Santoso', email: 'budi@example.com', password: hashedPassword, address: 'Jl. Merdeka No. 45', role_id: userRole.id, email_verified_at: new Date() },
    { name: 'Siti Aminah', email: 'siti@example.com', password: hashedPassword, address: 'Jl. Sudirman No. 10', role_id: userRole.id, email_verified_at: new Date() },
  ];

  let createdCount = 0, skippedCount = 0;

  for (const user of users) {
    const existingUser = await prisma.user.findFirst({ where: { email: user.email } });
    if (existingUser) {
      skippedCount++;
      console.log(`⏭️  User already exists: ${user.email}`);
    } else {
      await prisma.user.create({ data: user });
      createdCount++;
      console.log(`✅ Created user: ${user.email} (Role: ${user.role_id === superadminRole.id ? 'superadmin' : user.role_id === adminRole.id ? 'admin' : user.role_id === staffRole.id ? 'staff' : user.role_id === financeRole.id ? 'finance' : 'user'})`);
    }
  }

  console.log(`\n📊 Summary: Created: ${createdCount}, Skipped: ${skippedCount}`);
}

async function down() {
  await prisma.user.deleteMany({
    where: { email: { in: ['superadmin@jeta.com', 'admin@jeta.com', 'finance@jeta.com', 'staff1@jeta.com', 'staff2@jeta.com', 'staff3@jeta.com', 'staff4@jeta.com', 'staff5@jeta.com', 'user@jeta.com', 'budi@example.com', 'siti@example.com'] } }
  });
  console.log(`↩️ Rollback completed`);
}

module.exports = { main, down };

if (require.main === module) {
  main().catch(e => console.error('❌ User seed failed:', e)).finally(() => prisma.$disconnect());
}