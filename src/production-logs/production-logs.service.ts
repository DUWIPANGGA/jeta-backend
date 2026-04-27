import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductionLogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.productionLog.create({ data: dto });
  }

  findAll() {
    return this.prisma.productionLog.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.productionLog.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ProductionLog #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.productionLog.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.productionLog.delete({ where: { id } });
    return { message: `ProductionLog #${id} successfully deleted` };
  }
}
