import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Pendapatan (bulan ini dari payment yang completed)
    const payments = await this.prisma.payment.findMany({
      where: {
        payment_status: 'completed',
        paid_at: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
        order_type: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const revenueCatalogOrders = payments
      .filter((p) => p.order_type === 'order')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const revenueCustomOrders = payments
      .filter((p) => p.order_type === 'custom_order')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 2. Pesanan Baru (hari ini)
    const newCustomOrders = await this.prisma.customOrder.count({
      where: {
        created_at: {
          gte: startOfDay,
        },
      },
    });

    const newProductOrders = await this.prisma.order.count({
      where: {
        created_at: {
          gte: startOfDay,
        },
      },
    });

    const newOrders = newCustomOrders + newProductOrders;

    // 3. Produk Aktif
    const activeProducts = await this.prisma.product.count({
      where: {
        status: true,
      },
    });

    // 4. Pengguna Baru (hari ini)
    const newUsers = await this.prisma.user.count({
      where: {
        created_at: {
          gte: startOfDay,
        },
      },
    });

    // 5. Pesanan Terbaru (5 data terakhir)
    const recentCustomOrders = await this.prisma.customOrder.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
        items: {
          take: 1,
          include: {
            selected_options: {
              include: {
                variant_option: {
                  include: {
                    custom_variant: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const recentProductOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
        order_items: {
          take: 1,
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Gabungkan dan urutkan
    const combinedOrders = [
      ...recentCustomOrders.map(order => ({
        order_id: `CUST-${order.id}`,
        customer_name: order.user?.name || order.name || 'Guest',
        product_name: this.getCustomOrderProductName(order),
        status: order.accept_status ? 'Diproses' : 'Menunggu ACC',
        total: order.total_amount || 0,
        created_at: order.created_at,
        order_type: 'custom',
      })),
      ...recentProductOrders.map(order => ({
        order_id: order.order_number,
        customer_name: order.user?.name || 'Guest',
        product_name: order.order_items[0]?.product?.name || 'Produk Reguler',
        status: order.status,
        total: order.grand_total || 0,
        created_at: order.created_at,
        order_type: 'product',
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // 6. Produk Terbaru (5 data terakhir)
    const recentProducts = await this.prisma.product.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    // Format response
    const formatRupiah = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return {
      success: true,
      cards: {
        total_revenue: totalRevenue,
        total_revenue_formatted: formatRupiah(totalRevenue),
        revenue_catalog_orders: revenueCatalogOrders,
        revenue_catalog_orders_formatted: formatRupiah(revenueCatalogOrders),
        revenue_custom_orders: revenueCustomOrders,
        revenue_custom_orders_formatted: formatRupiah(revenueCustomOrders),
        new_orders: newOrders,
        active_products: activeProducts,
        new_users: newUsers,
      },
      recent_orders: combinedOrders.map(order => ({
        order_id: order.order_id,
        customer_name: order.customer_name,
        product_name: order.product_name,
        status: this.getStatusText(order.status, order.order_type),
        total: order.total,
        total_formatted: formatRupiah(order.total),
        created_at: order.created_at,
      })),
      recent_products: recentProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Uncategorized',
        price: product.price || 0,
        price_formatted: formatRupiah(product.price || 0),
        image: product.image,
        status: product.status,
        created_at: product.created_at,
      })),
    };
  }

  private getCustomOrderProductName(order: any): string {
    if (!order.items || order.items.length === 0) return 'Custom Order';
    
    const item = order.items[0];
    if (!item.selected_options || item.selected_options.length === 0) return 'Custom Order';
    
    const names = item.selected_options.map(opt => 
      `${opt.variant_option?.custom_variant?.name || ''} ${opt.variant_option?.name || ''}`.trim()
    ).filter(Boolean);
    
    return names.join(' ') || 'Custom Order';
  }

  private getStatusText(status: any, orderType: string): string {
    if (orderType === 'custom') {
      if (typeof status === 'string') return status;
      return status === true ? 'Diproses' : 'Menunggu ACC';
    }
    
    const statusMap: Record<string, string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return statusMap[status] || status;
  }
}