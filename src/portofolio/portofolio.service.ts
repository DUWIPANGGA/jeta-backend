import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PortofolioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePortofolioDto, file: Express.Multer.File) {
    const data: any = { ...dto };
    data.image = `/uploads/portofolios/${file.filename}`;

    return this.prisma.portofolio.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.portofolio.findMany({
      orderBy: [
        { order: 'asc' },
        { created_at: 'desc' },
      ],
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.portofolio.findUnique({ where: { id } });
    if (!data) throw new NotFoundException(`Portofolio dengan ID ${id} tidak ditemukan`);
    return data;
  }

  async update(id: number, dto: UpdatePortofolioDto, file?: Express.Multer.File) {
    const existing = await this.findOne(id);
    const data: any = { ...dto };

    if (file) {
      if (existing.image) {
        const oldPath = path.join(process.cwd(), 'uploads', 'portofolios',
          path.basename(existing.image));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      data.image = `/uploads/portofolios/${file.filename}`;
    }

    return this.prisma.portofolio.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    if (existing.image) {
      const imagePath = path.join(process.cwd(), 'uploads', 'portofolios',
        path.basename(existing.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return this.prisma.portofolio.delete({ where: { id } });
  }
}
