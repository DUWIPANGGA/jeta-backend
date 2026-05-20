import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariantOptionDto } from './dto/create-variant-option.dto';
import { UpdateVariantOptionDto } from './dto/update-variant-option.dto';

@Injectable()
export class VariantOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateVariantOptionDto) {
    const customVariant = await this.prisma.customVariant.findUnique({
      where: { id: createDto.custom_variant_id },
    });
    if (!customVariant) {
      throw new NotFoundException(`Custom variant with ID ${createDto.custom_variant_id} not found`);
    }

    return this.prisma.variantOption.create({
      data: {
        name: createDto.name,
        custom_variant_id: createDto.custom_variant_id,
        description: createDto.description,
        status: createDto.status ?? true,
      },
    });
  }

  async findAll(includeInactive: boolean = true) {
    return this.prisma.variantOption.findMany({
      where: includeInactive ? {} : { status: true },
      include: {
        custom_variant: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const variantOption = await this.prisma.variantOption.findUnique({
      where: { id },
      include: {
        custom_variant: true,
      },
    });
    if (!variantOption) {
      throw new NotFoundException(`Variant option with ID ${id} not found`);
    }
    return variantOption;
  }

  async update(id: number, updateDto: UpdateVariantOptionDto) {
    await this.findOne(id);
    return this.prisma.variantOption.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const isUsed = await this.prisma.customOrderItemOption.findFirst({
      where: { variant_option_id: id },
    });
    
    if (isUsed) {
      throw new ConflictException(`Variant option with ID ${id} is being used and cannot be deleted`);
    }

    return this.prisma.variantOption.delete({ where: { id } });
  }

  async findByCustomVariant(customVariantId: number, includeInactive: boolean = false) {
    const customVariant = await this.prisma.customVariant.findUnique({
      where: { id: customVariantId },
    });
    
    if (!customVariant) {
      throw new NotFoundException(`Custom variant with ID ${customVariantId} not found`);
    }

    return this.prisma.variantOption.findMany({
      where: {
        custom_variant_id: customVariantId,
        ...(includeInactive ? {} : { status: true }),
      },
      include: {
        custom_variant: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}