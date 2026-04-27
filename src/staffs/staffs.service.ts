import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.staff.create({ data: dto });
  }

  findAll() {
    return this.prisma.staff.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.staff.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Staff #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.staff.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.staff.delete({ where: { id } });
    return { message: `Staff #${id} successfully deleted` };
  }
}
