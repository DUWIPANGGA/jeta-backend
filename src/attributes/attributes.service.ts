import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAttributeDto) {
    const existing = await this.prisma.attribute.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Attribute with name "${createDto.name}" already exists`);
    }

    return this.prisma.attribute.create({
      data: {
        name: createDto.name,
        description: createDto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.attribute.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
    });
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }
    return attribute;
  }

  async update(id: number, updateDto: UpdateAttributeDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.attribute.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Attribute with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.attribute.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Attribute sudah tidak dipakai di ProductVariant, jadi tidak perlu cek isUsed
    // Langsung hapus saja
    return this.prisma.attribute.delete({ where: { id } });
  }
}