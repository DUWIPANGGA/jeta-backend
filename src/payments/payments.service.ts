import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.payment.create({ data: dto });
  }

  findAll() {
    return this.prisma.payment.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.payment.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Payment #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.payment.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment #${id} successfully deleted` };
  }
}
