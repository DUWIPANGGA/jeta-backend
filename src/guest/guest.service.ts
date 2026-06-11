import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        material: true, // ✅ material di product, bukan di variant
        variants: {
          include: {
            size: true,
            color: true,
            // ❌ HAPUS attribute: true,
            // ❌ HAPUS material: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      total: products.length,
    };
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        material: true, // ✅ material di product
        variants: {
          include: {
            size: true,
            color: true,
            // ❌ HAPUS attribute: true,
            // ❌ HAPUS material: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        products: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  async getAllPortofolios() {
    const portofolios = await this.prisma.portofolio.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Portofolios retrieved successfully',
      data: portofolios,
    };
  }

  async getAllStages() {
    const stages = await this.prisma.stage.findMany({
      orderBy: { order_index: 'asc' },
    });

    return {
      success: true,
      message: 'Stages retrieved successfully',
      data: stages,
    };
  }

  async getRecommendedProducts() {
    const items = await this.prisma.recommendedProduct.findMany({
      include: { product: true },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Recommended products retrieved successfully',
      data: items,
    };
  }

  private async enrichWithVirtualStatus(order: any) {
    if (!order) return order;

    let virtualStatus = 'Menunggu ACC';
    if (order.accept_status === 'accepted') {
      const tracking = order.tracking || await this.prisma.tracking.findFirst({
        where: { custom_order_id: order.id },
      });

      const hasDpVerified = order.payments?.some(
        (p: any) => p.payment_stage === 'down_payment' && p.payment_status === 'completed',
      );

      if (!hasDpVerified) {
        virtualStatus = 'Menunggu DP';
      } else if (order.payment_status) {
        virtualStatus = 'Selesai';
      } else if (tracking) {
        const stage = tracking.current_stage;
        if (stage === 'Dalam Perjalanan' || stage === 'Pesanan Dikirim') {
          virtualStatus = 'Dikirim';
        } else if (stage === 'Selesai' || stage === 'Diterima' || stage === 'Completed') {
          virtualStatus = 'Selesai';
        } else {
          virtualStatus = 'Diproses';
        }
      } else {
        virtualStatus = 'Diproses';
      }
    }

    order.virtual_status = virtualStatus;
    return order;
  }

  // ✅ Metode baru: Pelacakan pesanan terpadu (katalog & kustom) untuk guest
  async trackOrder(code: string) {
    const cleanCode = code.trim();

    if (cleanCode.startsWith('ORD-')) {
      const order = await this.prisma.order.findUnique({
        where: { order_number: cleanCode },
        include: {
          user: { select: { id: true, name: true, email: true } },
          order_items: {
            include: {
              product: { select: { name: true, price: true, image: true } },
              variant: {
                include: {
                  size: true,
                  color: true,
                },
              },
            },
          },
          trackings: {
            include: {
              tracking_histories: {
                orderBy: { created_at: 'desc' },
              },
            },
          },
          payment: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Pesanan katalog dengan nomor ${cleanCode} tidak ditemukan.`);
      }

      return {
        success: true,
        type: 'catalog',
        data: order,
      };
    } else if (cleanCode.startsWith('CSO-')) {
      const customOrder = await this.prisma.customOrder.findUnique({
        where: { custom_order_number: cleanCode },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          payments: true,
          items: {
            include: {
              selected_options: {
                include: {
                  variant_option: {
                    include: { custom_variant: true },
                  },
                },
              },
            },
          },
          tracking: {
            include: {
              tracking_histories: {
                orderBy: { created_at: 'desc' },
              },
            },
          },
        },
      });

      if (!customOrder) {
        throw new NotFoundException(`Pesanan kustom dengan nomor ${cleanCode} tidak ditemukan.`);
      }

      const withStatus = await this.enrichWithVirtualStatus(customOrder);

      return {
        success: true,
        type: 'custom',
        data: withStatus,
      };
    } else {
      throw new BadRequestException('Format nomor pelacakan tidak valid. Harus dimulai dengan ORD- atau CSO-');
    }
  }
}