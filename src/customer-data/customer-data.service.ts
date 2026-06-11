import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerPurchaseHistory(userId: number) {
    // 1. Ambil semua order produk yang sudah completed
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
        status: 'completed',
      },
      include: {
        order_items: {
          include: {
            product: true,
            variant: {
              include: {
                size: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Mapping ke format umum (produk katalog)
    const productHistory = orders.flatMap(order =>
      order.order_items.map(item => {
        const price = item.price ?? item.product.price ?? 0;
        const total = price * item.quantity;

        return {
          type: 'product' as const,
          order_id: order.id,
          order_number: order.order_number,
          product_id: item.product_id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: price,
          total: total,
          status: order.status,
          created_at: order.created_at,
          image: item.product.image,
          variant: item.variant
            ? [item.variant.size?.name, item.variant.color?.name]
                .filter(Boolean)
                .join(' ')
            : null,
        };
      })
    );

    // 2. Ambil custom order yang sudah di-ACC
    // PERBAIKAN: gunakan selected_options, bukan variant_option
    const customOrders = await this.prisma.customOrder.findMany({
      where: {
        user_id: userId,
        accept_status: 'accepted',
      },
      include: {
        items: {
          include: {
            selected_options: {        // ← PERUBAHAN: selected_options
              include: {
                variant_option: {      // ← tetap, karena selected_options punya variant_option
                  include: {
                    custom_variant: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Mapping custom order ke format umum
    // PERBAIKAN: akses selected_options, bukan variant_option langsung
    const customHistory = customOrders.map(co => {
      const itemsDesc = co.items
        ?.flatMap(item => 
          item.selected_options?.map(opt => {
            const variantName = opt.variant_option?.name || '';
            const customVariantName = opt.variant_option?.custom_variant?.name || '';
            return `${customVariantName} ${variantName}`.trim();
          }) || []
        )
        .filter(Boolean)
        .join(', ') || 'Produk Custom';

      const totalQuantity = co.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

      return {
        type: 'custom_order' as const,
        id: co.id,
        name: co.name,
        deskripsi_produk: itemsDesc,
        jumlah: totalQuantity,
        deadline: co.deadline,
        total_amount: co.total_amount,
        dp_amount: co.dp_amount,
        remaining_amount: co.remaining_amount,
        accept_status: co.accept_status,
        payment_status: co.payment_status,
        created_at: co.created_at,
      };
    });

    // Gabung dan urutkan
    const allHistory = [...productHistory, ...customHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allHistory;
  }
}