import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePageDto) {
    return this.prisma.page.create({ data: dto });
  }

  findAll() {
    return this.prisma.page.findMany({
      orderBy: { nomor: 'asc' },
    });
  }

  async findOne(id: number) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException(`Page #${id} tidak ditemukan`);
    return page;
  }

  async update(id: number, dto: UpdatePageDto) {
    await this.findOne(id);
    return this.prisma.page.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
    return { message: `Page #${id} berhasil dihapus` };
  }
}
