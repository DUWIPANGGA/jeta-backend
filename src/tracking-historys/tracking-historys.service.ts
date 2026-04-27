import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingHistorysService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.trackingHistory.create({ data: dto });
  }

  findAll() {
    return this.prisma.trackingHistory.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.trackingHistory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`TrackingHistory #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.trackingHistory.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.trackingHistory.delete({ where: { id } });
    return { message: `TrackingHistory #${id} successfully deleted` };
  }
}
