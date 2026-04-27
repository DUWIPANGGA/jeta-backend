import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.tracking.create({ data: dto });
  }

  findAll() {
    return this.prisma.tracking.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.tracking.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Tracking #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.tracking.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.tracking.delete({ where: { id } });
    return { message: `Tracking #${id} successfully deleted` };
  }
}
