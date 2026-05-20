import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSizeDto) {
    const existing = await this.prisma.size.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Size with name "${createDto.name}" already exists`);
    }

    return this.prisma.size.create({
      data: { name: createDto.name },
    });
  }

  async findAll() {
    return this.prisma.size.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const size = await this.prisma.size.findUnique({
      where: { id },
    });
    if (!size) {
      throw new NotFoundException(`Size with ID ${id} not found`);
    }
    return size;
  }

  async update(id: number, updateDto: UpdateSizeDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.size.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Size with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.size.update({
      where: { id },
      data: { name: updateDto.name },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const isUsed = await this.prisma.productVariant.findFirst({
      where: { size_id: id },
    });
    if (isUsed) {
      throw new ConflictException(`Size with ID ${id} is being used by product variants and cannot be deleted`);
    }

    return this.prisma.size.delete({ where: { id } });
  }
}