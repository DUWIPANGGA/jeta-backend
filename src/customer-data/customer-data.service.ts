// src/customer-data/customer-data.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerPurchaseHistory(userId: number) {
    // 1. Ambil semua order produk yang sudah completed (atau sesuai kebutuhan)
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
        status: 'completed',
      },
      include: {
        order_items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Mapping ke format umum
    const productHistory = orders.flatMap(order =>
      order.order_items.map(item => ({
        type: 'product' as const,
        order_id: order.id,
        order_number: order.order_number,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price || item.product.price,
        total: (item.price || item.product.price) * item.quantity,
        status: order.status,
        created_at: order.created_at,
        image: item.product.image,
        variant: item.variant
          ? [item.variant.size, item.variant.color].filter(Boolean).join(' ')
          : null,
      }))
    );

    // 2. Ambil custom order yang sudah di-ACC (atau sesuai kebutuhan)
    const customOrders = await this.prisma.customOrder.findMany({
      where: {
        user_id: userId,
        accept_status: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const customHistory = customOrders.map(co => ({
      type: 'custom_order' as const,
      id: co.id,
      name: co.name,
      jenis_produk: co.jenis_produk,
      jumlah: co.jumlah,
      deadline: co.deadline,
      total_amount: co.total_amount,
      dp_amount: co.dp_amount,
      remaining_amount: co.remaining_amount,
      accept_status: co.accept_status,
      payment_status: co.payment_status,
      created_at: co.created_at,
    }));

    // Gabung dan urutkan berdasarkan created_at descending
    const allHistory = [...productHistory, ...customHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allHistory;
  }

  // Opsional: bisa ditambahkan method untuk mengambil detail satu item (produk atau custom order)
}