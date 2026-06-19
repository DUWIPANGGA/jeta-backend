// prisma/seeders/accesses.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const noAccess = { create: false, read: false, update: false, delete: false };

const accessConfig = {
  superadmin: () => ({
    create: true,
    read: true,
    update: true,
    delete: true,
  }),

  admin: (pageName) => ({
    create: true,
    read: true,
    update: true,
    delete: pageName === 'Roles' ? false : true,
  }),

  staff: (pageName) => {
    const staffPages = new Set([
      'Auth',
      'Products',
      'CustomOrders',
      'ProgressReports',
      'Projects',
      'Staffs',
      'Stages',
      'WorkLogs',
      'JerseyTemplates',
    ]);

    if (!staffPages.has(pageName)) return noAccess;

    if (pageName === 'ProgressReports') {
      return { create: true, read: true, update: true, delete: false };
    }
    if (pageName === 'Products') {
      return { create: false, read: true, update: false, delete: false };
    }
    if (pageName === 'CustomOrders') {
      return { create: false, read: true, update: false, delete: false };
    }
    if (pageName === 'Projects') {
      return { create: false, read: true, update: true, delete: false };
    }
    if (pageName === 'Staffs') {
      return { create: false, read: true, update: false, delete: false };
    }
    if (pageName === 'Stages') {
      return { create: false, read: true, update: false, delete: false };
    }
    if (pageName === 'WorkLogs') {
      return { create: true, read: true, update: true, delete: false };
    }
    if (pageName === 'JerseyTemplates') {
      return { create: false, read: true, update: false, delete: false };
    }

    return { create: false, read: true, update: false, delete: false };
  },

  customer: (pageName) => {
    const userPages = new Set([
      'Auth',
      'Carts',
      'Categories',
      'Products',
      'CustomOrders',
      'CustomerData',
      'Guest',
      'PaymentMethods',
      'Payments',
      'JerseyTemplates',
      'VariantOptions',
      'CustomVariants',
      'Orders',
      'Users',
    ]);

    if (!userPages.has(pageName)) return noAccess;

    return {
      create: pageName === 'Carts' || pageName === 'CustomOrders' || pageName === 'Orders',
      read: true,
      update: pageName === 'Carts' || pageName === 'Payments' || pageName === 'Users',
      delete: pageName === 'Carts',
    };
  },

  finance: (pageName) => {
    const financePages = new Set([
      'Auth',
      'Finance',
      'SalaryLogs',
      'SalaryProjects',
      'Staffs',
      'Reports',
      'WorkLogs',
    ]);

    if (!financePages.has(pageName)) return noAccess;

    return {
      create: pageName === 'SalaryProjects',
      read: true,
      update: pageName === 'SalaryProjects',
      delete: false,
    };
  },
};

async function main() {
  console.log('🌱 Seeding accesses...');

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

  let createdCount = 0;
  let updatedCount = 0;

  for (const role of roles) {
    console.log(`\n📌 Processing accesses for ${role.name} (ID: ${role.id})...`);

    const getAccess = accessConfig[role.name];
    if (!getAccess) {
      console.log(`  ⚠️  No access config for role ${role.name}, skipping...`);
      continue;
    }

    for (const page of pages) {
      const access = getAccess(page.name);

      if (!access.create && !access.read && !access.update && !access.delete) {
        continue;
      }

      const existingAccess = await prisma.access.findFirst({
        where: { role_id: role.id, page_id: page.id },
      });

      const accessName = `${role.name}_${page.name}`;

      if (existingAccess) {
        if (
          existingAccess.create !== access.create ||
          existingAccess.read !== access.read ||
          existingAccess.update !== access.update ||
          existingAccess.delete !== access.delete
        ) {
          await prisma.access.update({
            where: { id: existingAccess.id },
            data: {
              name: accessName,
              create: access.create,
              read: access.read,
              update: access.update,
              delete: access.delete,
            },
          });
          updatedCount++;
          console.log(
            `  🔄 Updated access: ${role.name} -> ${page.name} (C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete})`
          );
        } else {
          console.log(`  ⏭️  Access unchanged: ${role.name} -> ${page.name}`);
        }
      } else {
        await prisma.access.create({
          data: {
            name: accessName,
            create: access.create,
            read: access.read,
            update: access.update,
            delete: access.delete,
            role_id: role.id,
            page_id: page.id,
          },
        });
        createdCount++;
        console.log(
          `  ✅ Created access: ${role.name} -> ${page.name} (C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete})`
        );
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${createdCount} new accesses`);
  console.log(`🔄 Updated: ${updatedCount} existing accesses`);

  const allAccesses = await prisma.access.findMany({
    include: { role: { select: { name: true } }, page: { select: { name: true, id: true } } },
    orderBy: { role_id: 'asc' },
  });

  console.log(`\n📄 All accesses in database (${allAccesses.length} total):`);
  allAccesses.forEach((access) => {
    console.log(
      `  ${access.role.name} -> ${access.page.name} (ID:${access.page.id}): C:${access.create}, R:${access.read}, U:${access.update}, D:${access.delete}`
    );
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
    .catch((e) => console.error('❌ Access seed failed:', e))
    .finally(() => prisma.$disconnect());
}