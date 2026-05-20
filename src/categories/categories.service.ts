import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Category with name "${createDto.name}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        name: createDto.name,
        status: createDto.status ?? true,
      },
    });
  }

  async findAll(includeInactive: boolean = false) {
    // Buat where condition secara eksplisit
    const where: Prisma.CategoryWhereInput = {};
    // if (!includeInactive) {
    //   where.status = true;
    // }
    
    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Category with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateDto.name,
        status: updateDto.status,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.category.delete({ where: { id } });
  }
}