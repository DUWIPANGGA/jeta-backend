import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.customOrder.create({ data: dto });
  }

  findAll() {
    return this.prisma.customOrder.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.customOrder.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`CustomOrder #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.customOrder.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.customOrder.delete({ where: { id } });
    return { message: `CustomOrder #${id} successfully deleted` };
  }
}
