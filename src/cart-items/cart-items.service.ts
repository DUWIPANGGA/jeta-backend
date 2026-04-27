import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartItemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.cartItem.create({ data: dto });
  }

  findAll() {
    return this.prisma.cartItem.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`CartItem #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.cartItem.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.cartItem.delete({ where: { id } });
    return { message: `CartItem #${id} successfully deleted` };
  }
}
