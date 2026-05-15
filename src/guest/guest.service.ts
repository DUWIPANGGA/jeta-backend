// src/guest/guest.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuestService {
  constructor(private readonly prisma: PrismaService) { }

  // Guest lihat semua produk
  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      where: { /* bisa ditambah filter, misal is_active: true */ },
      include: {
        category: true,
        variants: true,
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

  // Guest lihat detail produk
  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
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

  // Guest lihat semua kategori
  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        subcategories: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  // Guest lihat semua portofolio
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

  // Guest lihat semua stages (opsional)
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
}