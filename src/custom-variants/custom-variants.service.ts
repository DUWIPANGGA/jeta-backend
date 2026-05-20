import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomVariantDto } from './dto/create-custom-variant.dto';
import { UpdateCustomVariantDto } from './dto/update-custom-variant.dto';

@Injectable()
export class CustomVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCustomVariantDto) {
    const existing = await this.prisma.customVariant.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Custom variant with name "${createDto.name}" already exists`);
    }

    return this.prisma.customVariant.create({
      data: {
        name: createDto.name,
        status: createDto.status ?? true,
      },
    });
  }

  // 🔥 PERUBAHAN: default includeInactive = true (tampilkan semua)
  async findAll(includeInactive: boolean = true) {
    const where = includeInactive ? {} : { status: true };
    return this.prisma.customVariant.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const customVariant = await this.prisma.customVariant.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!customVariant) {
      throw new NotFoundException(`Custom variant with ID ${id} not found`);
    }
    return customVariant;
  }

  async update(id: number, updateDto: UpdateCustomVariantDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.customVariant.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Custom variant with name "${updateDto.name}" already exists`);
      }
    }

    return this.prisma.customVariant.update({
      where: { id },
      data: {
        name: updateDto.name,
        status: updateDto.status,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const isUsed = await this.prisma.variantOption.findFirst({
      where: { custom_variant_id: id },
    });
    if (isUsed) {
      throw new ConflictException(`Custom variant with ID ${id} has related variant options and cannot be deleted`);
    }

    return this.prisma.customVariant.delete({ where: { id } });
  }
}