import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultationMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.consultationMaterial.create({ data: dto });
  }

  findAll() {
    return this.prisma.consultationMaterial.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.consultationMaterial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ConsultationMaterial #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.consultationMaterial.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.consultationMaterial.delete({ where: { id } });
    return { message: `ConsultationMaterial #${id} successfully deleted` };
  }
}
