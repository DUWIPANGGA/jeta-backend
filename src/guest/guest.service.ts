import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ProductQueryParams {
  page: number;
  limit: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  size?: string;
  color?: string;
}

@Injectable()
export class GuestService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts(params: ProductQueryParams) {
    const { page, limit, search, minPrice, maxPrice, category, size, color } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (category) {
      where.category = { name: { equals: category, mode: 'insensitive' } };
    }

    if (size || color) {
      where.variants = { some: {} };
      if (size) {
        where.variants.some.size = { name: { equals: size, mode: 'insensitive' } };
      }
      if (color) {
        where.variants.some.color = { name: { equals: color, mode: 'insensitive' } };
      }
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          material: true,
          variants: {
            include: {
              size: true,
              color: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((p) => ({
      ...p,
      status: p.status ? 'tersedia' : 'habis',
    }));

    return {
      success: true,
      message: 'Products retrieved successfully',
      data,
      last_page: Math.ceil(total / limit),
    };
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        material: true,
        variants: {
          include: {
            size: true,
            color: true,
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
      data: {
        ...product,
        status: product.status ? 'tersedia' : 'habis',
      },
    };
  }

  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data,
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