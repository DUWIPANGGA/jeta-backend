import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';

@Injectable()
export class PortofolioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePortofolioDto) {
    return this.prisma.portofolio.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.portofolio.findMany({
      orderBy: [
        { order: 'asc' },      // Pertama urutkan berdasarkan nomor urut
        { created_at: 'desc' } // Jika order sama, urutkan dari yang terbaru
      ],
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.portofolio.findUnique({ where: { id } });
    if (!data) throw new NotFoundException(`Portofolio dengan ID ${id} tidak ditemukan`);
    return data;
  }

  async update(id: number, dto: UpdatePortofolioDto) {
    await this.findOne(id);
    return this.prisma.portofolio.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.portofolio.delete({ where: { id } });
  }
}