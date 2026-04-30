import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getBaseUrl(): string {
    return this.configService.get('APP_URL') || 'http://localhost:3000';
  }

  private transformProductImage(product: any) {
    if (!product.image) return product;
    
    // Jika image sudah berupa URL lengkap, return as-is
    if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
      return product;
    }
    
    // Jika hanya nama file, tambahkan base URL
    return {
      ...product,
      image: `${this.getBaseUrl()}/uploads/${product.image}`,
    };
  }

  async create(data: {
  category_id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  status: ProductStatus;
}) {
  const product = await this.prisma.product.create({
    data: {
      category_id: data.category_id,
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image,
      status: data.status,
    },
    include: {
      variants: true,
    },
  });
  return this.transformProductImage(product);
}
  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    return products.map(product => this.transformProductImage(product));
  }

  async findOne(id: number) {
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
    
    return this.transformProductImage(product);
  }

  async update(id: number, data: Partial<{
    category_id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    status: ProductStatus;
  }>) {
    await this.findOne(id);
    
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        variants: true,
      },
    });
    
    return this.transformProductImage(product);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: `Product with ID ${id} successfully deleted` };
  }

  async findByCategory(categoryId: number) {
    const products = await this.prisma.product.findMany({
      where: { category_id: categoryId },
      include: {
        category: true,
        variants: true,
      },
    });
    
    return products.map(product => this.transformProductImage(product));
  }

  async updateStatus(id: number, status: ProductStatus) {
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: {
        category: true,
        variants: true,
      },
    });
    return this.transformProductImage(product);
  }
}