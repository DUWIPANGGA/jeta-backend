import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalaryLogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.salaryLog.create({ data: dto });
  }

  findAll() {
    return this.prisma.salaryLog.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.salaryLog.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`SalaryLog #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.salaryLog.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.salaryLog.delete({ where: { id } });
    return { message: `SalaryLog #${id} successfully deleted` };
  }
}
