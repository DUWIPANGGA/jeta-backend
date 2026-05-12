// src/sub-categories/sub-categories.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

@Injectable()
export class SubCategoriesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateSubCategoryDto) {
    // Cek apakah category_id ada
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${createDto.category_id} not found`);
    }

    // Optional: cek duplikasi nama+category_id (meskipun tidak ada unique constraint di database)
    const existing = await this.prisma.subCategory.findFirst({
      where: {
        name: createDto.name,
        category_id: createDto.category_id,
      },
    });
    if (existing) {
      throw new ConflictException(`SubCategory '${createDto.name}' already exists for this category`);
    }

    return this.prisma.subCategory.create({
      data: {
        category_id: createDto.category_id,
        name: createDto.name,
        description: createDto.description ?? null,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    return this.prisma.subCategory.findMany({
      include: {
        category: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!subCategory) {
      throw new NotFoundException(`SubCategory with ID ${id} not found`);
    }
    return subCategory;
  }

  async findByCategory(categoryId: number) {
    return this.prisma.subCategory.findMany({
      where: { category_id: categoryId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, updateDto: UpdateSubCategoryDto) {
    // Cek keberadaan subcategory
    await this.findOne(id);

    // Jika category_id diubah, cek apakah category baru ada
    if (updateDto.category_id !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.category_id },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateDto.category_id} not found`);
      }
    }

    // Jika name diubah, cek duplikasi (opsional)
    if (updateDto.name !== undefined) {
      const existing = await this.prisma.subCategory.findFirst({
        where: {
          name: updateDto.name,
          category_id: updateDto.category_id ?? (await this.findOne(id)).category_id,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`SubCategory name '${updateDto.name}' already exists for this category`);
      }
    }

    const updateData: any = {};
    if (updateDto.category_id !== undefined) updateData.category_id = updateDto.category_id;
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;

    return this.prisma.subCategory.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.subCategory.delete({ where: { id } });
    return { message: `SubCategory with ID ${id} deleted successfully` };
  }
}