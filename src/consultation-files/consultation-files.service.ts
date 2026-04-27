import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultationFilesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.consultationFile.create({ data: dto });
  }

  findAll() {
    return this.prisma.consultationFile.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.consultationFile.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ConsultationFile #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.consultationFile.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.consultationFile.delete({ where: { id } });
    return { message: `ConsultationFile #${id} successfully deleted` };
  }
}
