import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateMaterialDto) {
    const existing = await this.prisma.material.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Material with name "${createDto.name}" already exists`);
    }

    return this.prisma.material.create({
      data: {
        name: createDto.name,
        description: createDto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.material.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        products: { // ✅ ganti dari variants ke products
          include: {
            variants: true,
          },
        },
      },
    });
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    return material;
  }

  async update(id: number, updateDto: UpdateMaterialDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.material.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Material with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.material.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // ✅ Cek apakah material masih dipakai di Product (bukan ProductVariant)
    const isUsed = await this.prisma.product.findFirst({
      where: { material_id: id },
    });
    if (isUsed) {
      throw new ConflictException(`Material with ID ${id} is being used by products and cannot be deleted`);
    }

    return this.prisma.material.delete({ where: { id } });
  }
}