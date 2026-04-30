import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';

@Injectable()
export class PortofolioService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(createPortofolioDto: CreatePortofolioDto) {
    return await this.prisma.portofolio.create({
      data: {
        title: createPortofolioDto.title,
        description: createPortofolioDto.description,
        image: createPortofolioDto.image,
        client: createPortofolioDto.client
      },
    });
  }

  // READ ALL - HAPUS include user
  async findAll() {
    return await this.prisma.portofolio.findMany({
      orderBy: { created_at: 'desc' }
      // ✅ Hapus include user
    });
  }

  // READ ONE - HAPUS include user
  async findOne(id: number) {
    const portofolio = await this.prisma.portofolio.findUnique({
      where: { id }
      // ✅ Hapus include user
    });

    if (!portofolio) {
      throw new NotFoundException(`Portofolio with ID ${id} not found`);
    }

    return portofolio;
  }

  // UPDATE
  async update(id: number, updatePortofolioDto: UpdatePortofolioDto) {
    await this.findOne(id);

    return await this.prisma.portofolio.update({
      where: { id },
      data: {
        title: updatePortofolioDto.title,
        description: updatePortofolioDto.description,
        image: updatePortofolioDto.image,
        client: updatePortofolioDto.client,
      },
    });
  }

  // DELETE
  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.portofolio.delete({
      where: { id },
    });
  }

  // SEARCH
  async search(keyword: string) {
    return await this.prisma.portofolio.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { client: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { created_at: 'desc' },
    });
  }
}