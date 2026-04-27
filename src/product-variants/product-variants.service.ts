import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.productVariant.create({ data: dto });
  }

  findAll() {
    return this.prisma.productVariant.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ProductVariant #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.productVariant.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.productVariant.delete({ where: { id } });
    return { message: `ProductVariant #${id} successfully deleted` };
  }
}
