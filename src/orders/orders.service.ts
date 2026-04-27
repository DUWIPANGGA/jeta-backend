import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.order.create({ data: dto });
  }

  findAll() {
    return this.prisma.order.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.order.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Order #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.order.delete({ where: { id } });
    return { message: `Order #${id} successfully deleted` };
  }
}
