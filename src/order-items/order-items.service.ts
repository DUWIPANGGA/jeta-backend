import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderItemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.orderItem.create({ data: dto });
  }

  findAll() {
    return this.prisma.orderItem.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.orderItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`OrderItem #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.orderItem.delete({ where: { id } });
    return { message: `OrderItem #${id} successfully deleted` };
  }
}
