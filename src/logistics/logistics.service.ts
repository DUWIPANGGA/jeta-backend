// src/logistics/logistics.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogisticDto } from './dto/create-logistic.dto';
import { UpdateLogisticDto } from './dto/update-logistic.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LogisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateLogisticDto) {
    try {
      return await this.prisma.logistic.create({
        data: {
          name: createDto.name,
          alias: createDto.alias,
          description: createDto.description,
          status: createDto.status ?? true,
        },
      });
    } catch (error) {
      // Menangani error jika name atau alias sudah ada (Unique Constraint)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Nama atau Alias logistik sudah terdaftar');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.logistic.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const logistic = await this.prisma.logistic.findUnique({
      where: { id },
    });

    if (!logistic) {
      throw new NotFoundException(`Logistik dengan ID ${id} tidak ditemukan`);
    }

    return logistic;
  }

  async update(id: number, updateDto: UpdateLogisticDto) {
    // Pastikan data ada sebelum di-update
    await this.findOne(id);

    try {
      return await this.prisma.logistic.update({
        where: { id },
        data: updateDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Nama atau Alias logistik sudah digunakan');
      }
      throw error;
    }
  }

  async remove(id: number) {
    // Pastikan data ada sebelum dihapus
    await this.findOne(id);

    await this.prisma.logistic.delete({
      where: { id },
    });

    return { message: `Logistik dengan ID ${id} berhasil dihapus` };
  }
}