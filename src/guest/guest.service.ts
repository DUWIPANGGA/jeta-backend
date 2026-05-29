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

  // ✅ Metode baru: Pelacakan pesanan kustom publik dengan verifikasi ganda email/no.telp
  async trackCustomOrder(id: number, contact: string) {
    const cleanContact = contact.trim().toLowerCase();

    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id },
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
      throw new NotFoundException(`Custom Order dengan ID ${id} tidak ditemukan.`);
    }

    // Validasi silang kontak (Bisa mencocokkan email/no.telp pemesan langsung atau user terdaftar)
    const matchDirectEmail = customOrder.email?.trim().toLowerCase() === cleanContact;
    const matchDirectPhone = customOrder.phone?.trim() === contact.trim();
    const matchUserEmail = customOrder.user?.email?.trim().toLowerCase() === cleanContact;
    const matchUserPhone = customOrder.user?.phone?.trim() === contact.trim();

    if (!matchDirectEmail && !matchDirectPhone && !matchUserEmail && !matchUserPhone) {
      throw new BadRequestException('Verifikasi kontak gagal. Email atau nomor telepon tidak cocok dengan data pemesan.');
    }

    return {
      success: true,
      message: 'Pelacakan pesanan kustom berhasil ditemukan.',
      data: customOrder,
    };
  }
}