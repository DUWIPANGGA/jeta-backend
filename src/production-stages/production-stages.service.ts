import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductionStagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.productionStage.create({ data: dto });
  }

  findAll() {
    return this.prisma.productionStage.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.productionStage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ProductionStage #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.productionStage.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.productionStage.delete({ where: { id } });
    return { message: `ProductionStage #${id} successfully deleted` };
  }
}
