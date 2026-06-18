// prisma/seeders/projects.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Ambil semua custom order yang sudah di-ACC (accept_status = true)
  const customOrders = await prisma.customOrder.findMany({
    where: { accept_status: 'accepted' },
    select: { id: true, user_id: true, name: true },
  });

  if (customOrders.length === 0) {
    console.log('⚠️  Tidak ada custom order dengan accept_status=accepted. Seeder projects dibatalkan.');
    return;
  }

  // 2. Ambil user dengan role staff (asumsi role name = 'staff' atau level tertentu)
  //    Jika tidak ada, kita bisa ambil user biasa sebagai fallback
  let staffUsers = await prisma.user.findMany({
    where: {
      role: { name: 'staff' } // sesuaikan dengan nama role staff di database Anda
    },
    select: { id: true, name: true },
  });

  if (staffUsers.length === 0) {
    console.log('⚠️  Tidak ada user dengan role "staff". Seeder akan menggunakan user acak sebagai member.');
    // Fallback: ambil user selain admin (role_id != 1) sebagai staff dummy
    staffUsers = await prisma.user.findMany({
      where: { role_id: { not: 1 } },
      select: { id: true, name: true },
      take: 5,
    });
  }

  // Hapus semua data project dan project members sebelumnya (opsional, sesuai kebutuhan)
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  console.log('🗑️  Semua project dan members sebelumnya dihapus.');

  let projectCount = 0;
  for (const customOrder of customOrders) {
    // Buat project untuk custom order ini
    const project = await prisma.project.create({
      data: {
        user_id: customOrder.user_id,         // owner project adalah user pembeli custom order
        custom_order_id: customOrder.id,
        status: true,                         // project aktif
      },
    });
    projectCount++;
    console.log(`✅ Project created for custom order "${customOrder.name}" (ID: ${customOrder.id}) -> Project ID: ${project.id}`);

    // Assign staff (member) ke project secara acak (1-3 staff)
    if (staffUsers.length > 0) {
      // Acak urutan staff
      const shuffled = [...staffUsers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const membersCount = Math.min( Math.floor(Math.random() * 3) + 1, staffUsers.length ); // 1-3 staff
      const selectedStaff = shuffled.slice(0, membersCount);

      for (const staff of selectedStaff) {
        await prisma.projectMember.create({
          data: {
            project_id: project.id,
            user_id: staff.id,
            assigned_name: staff.name,
          },
        });
      }
      console.log(`   → Assigned ${membersCount} staff member(s) to project ${project.id}`);
    } else {
      console.log(`   → No staff available to assign to project ${project.id}`);
    }
  }

  console.log(`✅ ${projectCount} projects berhasil di-seed.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding projects:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });