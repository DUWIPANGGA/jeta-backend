import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.stage.create({ data: dto });
  }

  findAll() {
    return this.prisma.stage.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.stage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Stage #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.stage.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.stage.delete({ where: { id } });
    return { message: `Stage #${id} successfully deleted` };
  }
}
