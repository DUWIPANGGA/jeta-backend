import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecommendedProductDto } from './dto/create-recommended-product.dto';
import { UpdateRecommendedProductDto } from './dto/update-recommended-product.dto';

@Injectable()
export class RecommendedProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateRecommendedProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createDto.product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${createDto.product_id} not found`);
    }

    const existing = await this.prisma.recommendedProduct.findUnique({
      where: { product_id: createDto.product_id },
    });
    if (existing) {
      throw new ConflictException(`Product with ID ${createDto.product_id} is already recommended`);
    }

    const recommended = await this.prisma.recommendedProduct.create({
      data: {
        product_id: createDto.product_id,
        order: createDto.order,
      },
      include: { product: true },
    });

    return {
      success: true,
      message: 'Recommended product created successfully',
      data: recommended,
    };
  }

  async findAll() {
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

  async findOne(id: number) {
    const item = await this.prisma.recommendedProduct.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException(`Recommended product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Recommended product retrieved successfully',
      data: item,
    };
  }

  async update(id: number, updateDto: UpdateRecommendedProductDto) {
    const existing = await this.prisma.recommendedProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Recommended product with ID ${id} not found`);
    }

    if (updateDto.product_id) {
      const product = await this.prisma.product.findUnique({
        where: { id: updateDto.product_id },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateDto.product_id} not found`);
      }

      const duplicate = await this.prisma.recommendedProduct.findFirst({
        where: { product_id: updateDto.product_id, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(`Product with ID ${updateDto.product_id} is already recommended`);
      }
    }

    const updated = await this.prisma.recommendedProduct.update({
      where: { id },
      data: updateDto,
      include: { product: true },
    });

    return {
      success: true,
      message: 'Recommended product updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.recommendedProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Recommended product with ID ${id} not found`);
    }

    await this.prisma.recommendedProduct.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Recommended product with ID ${id} deleted successfully`,
    };
  }
}
