import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Enriches custom order items in any nested structure with dynamic stage remaining quantities.
 */
export async function enrichCustomOrderItemsWithStages(
  prisma: any,
  data: any,
  stageId?: number
) {
  if (!data) return data;

  // Find all objects that look like a CustomOrderItem
  const items: any[] = [];
  const findItems = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this object is a CustomOrderItem
    if (
      obj.hasOwnProperty('id') &&
      obj.hasOwnProperty('quantity') &&
      (obj.hasOwnProperty('custom_order_id') || obj.hasOwnProperty('selected_options'))
    ) {
      items.push(obj);
      return;
    }

    for (const key of Object.keys(obj)) {
      findItems(obj[key]);
    }
  };

  findItems(data);

  if (items.length === 0) return data;

  const itemIds = items.map(item => item.id);

  // 1. Fetch all stages ordered by index
  const stages = await prisma.stage.findMany({
    orderBy: { order_index: 'asc' }
  });

  // 2. Fetch progress reports for all these items in status 'proses' or 'selesai'
  const reports = await prisma.progressReport.findMany({
    where: {
      custom_order_item_id: { in: itemIds },
      status: { in: ['proses', 'selesai'] }
    },
    select: {
      custom_order_item_id: true,
      stage_id: true,
      quantity: true
    }
  });

  // 3. Aggregate reported quantities by item and stage
  const reportMap = new Map<string, number>();
  for (const report of reports) {
    if (report.custom_order_item_id && report.stage_id) {
      const key = `${report.custom_order_item_id}_${report.stage_id}`;
      const current = reportMap.get(key) || 0;
      reportMap.set(key, current + (report.quantity ?? 0));
    }
  }

  // 4. Enrich each item with stage_remaining_quantities
  for (const item of items) {
    const stage_remaining_quantities = stages.map(stage => {
      const key = `${item.id}_${stage.id}`;
      const reported = reportMap.get(key) || 0;
      const remaining = item.quantity - reported;
      return {
        stage_id: stage.id,
        stage_name: stage.stage_name,
        completed: reported,
        remaining: remaining < 0 ? 0 : remaining
      };
    });

    item.stage_remaining_quantities = stage_remaining_quantities;

    // Optional context: if stageId is specified, override the `remaining_quantity` field
    // with the stage-specific remaining quantity!
    if (stageId !== undefined) {
      const specificStage = stage_remaining_quantities.find(s => s.stage_id === stageId);
      if (specificStage) {
        item.remaining_quantity = specificStage.remaining;
      }
    }
  }

  return data;
}
