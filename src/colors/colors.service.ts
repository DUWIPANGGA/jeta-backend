import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateColorDto) {
    const existing = await this.prisma.color.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Color with name "${createDto.name}" already exists`);
    }

    return this.prisma.color.create({
      data: {
        name: createDto.name,
        hex_code: createDto.hex_code,
      },
    });
  }

  async findAll() {
    return this.prisma.color.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const color = await this.prisma.color.findUnique({
      where: { id },
    });
    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }
    return color;
  }

  async update(id: number, updateDto: UpdateColorDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.color.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Color with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.color.update({
      where: { id },
      data: {
        name: updateDto.name,
        hex_code: updateDto.hex_code,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const isUsed = await this.prisma.productVariant.findFirst({
      where: { color_id: id },
    });
    if (isUsed) {
      throw new ConflictException(`Color with ID ${id} is being used by product variants and cannot be deleted`);
    }

    return this.prisma.color.delete({ where: { id } });
  }
}