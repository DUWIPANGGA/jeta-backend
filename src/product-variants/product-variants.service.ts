import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductVariantDto, file?: Express.Multer.File) {
    const data: any = {
      product_id: dto.product_id,
      size_id: dto.size_id ?? null,
      color_id: dto.color_id ?? null,
      stock: dto.stock,
      price_adjustment: dto.price_adjustment ?? 0,
      description: dto.description ?? '',
    };
    if (file) {
      data.image = file.path;
    }
    return this.prisma.productVariant.create({ data });
  }

  findAll(productId?: number) {
    const where: any = {};
    if (productId) {
      where.product_id = productId;
    }
    return this.prisma.productVariant.findMany({
      where,
      include: { size: true, color: true },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { size: true, color: true },
    });
    if (!item) throw new NotFoundException(`ProductVariant #${id} not found`);
    return item;
  }

  async update(id: number, dto: UpdateProductVariantDto, file?: Express.Multer.File) {
    await this.findOne(id);
    const data: any = {};
    if (dto.product_id !== undefined) data.product_id = dto.product_id;
    if (dto.size_id !== undefined) data.size_id = dto.size_id;
    if (dto.color_id !== undefined) data.color_id = dto.color_id;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.price_adjustment !== undefined) data.price_adjustment = dto.price_adjustment;
    if (dto.description !== undefined) data.description = dto.description;
    if (file) {
      data.image = file.path;
    }
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.productVariant.delete({ where: { id } });
    return { message: `ProductVariant #${id} successfully deleted` };
  }
}
