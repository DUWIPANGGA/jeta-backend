import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting backfill of custom_order_number for existing Custom Orders...');

  const orders = await prisma.customOrder.findMany({
    where: {
      OR: [
        { custom_order_number: null },
        { custom_order_number: '' }
      ]
    }
  });

  console.log(`🔍 Found ${orders.length} Custom Orders needing backfill.`);

  let successCount = 0;
  for (const order of orders) {
    const dateStr = new Date(order.created_at || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
    const generatedCode = `CSO-${dateStr}-${order.id.toString().padStart(4, '0')}`;

    try {
      await prisma.customOrder.update({
        where: { id: order.id },
        data: { custom_order_number: generatedCode }
      });
      console.log(`✅ Backfilled Custom Order ID ${order.id} -> ${generatedCode}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update Custom Order ID ${order.id}:`, error);
    }
  }

  console.log(`✨ Backfill completed successfully! ${successCount} orders updated.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
