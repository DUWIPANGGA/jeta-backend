import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategorysService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.category.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Category #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: `Category #${id} successfully deleted` };
  }
}
