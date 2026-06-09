import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJerseyTemplateDto } from './dto/create-jersey-template.dto';
import { UpdateJerseyTemplateDto } from './dto/update-jersey-template.dto';

@Injectable()
export class JerseyTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateJerseyTemplateDto) {
    const existing = await this.prisma.jerseyTemplate.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Jersey template with name "${createDto.name}" already exists`);
    }

    return this.prisma.jerseyTemplate.create({
      data: {
        name: createDto.name,
        image: createDto.image,
        description: createDto.description,
        status: createDto.status ?? true,
        combinations: createDto.combinations
          ? {
              create: createDto.combinations.map((c) => ({
                color_option_id: c.color_option_id,
                size_option_id: c.size_option_id,
                material_option_id: c.material_option_id,
              })),
            }
          : undefined,
      },
      include: {
        combinations: {
          include: {
            color: true,
            size: true,
            material: true,
          },
        },
      },
    });
  }

  async findAll(includeInactive: boolean = true) {
    const where = includeInactive ? {} : { status: true };

    return this.prisma.jerseyTemplate.findMany({
      where,
      include: {
        combinations: {
          include: {
            color: true,
            size: true,
            material: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const template = await this.prisma.jerseyTemplate.findUnique({
      where: { id },
      include: {
        combinations: {
          include: {
            color: true,
            size: true,
            material: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Jersey template with ID ${id} not found`);
    }

    return template;
  }

  async update(id: number, updateDto: UpdateJerseyTemplateDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.jerseyTemplate.findFirst({
        where: { name: updateDto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Jersey template with name "${updateDto.name}" already exists`);
      }
    }

    if (updateDto.combinations) {
      await this.prisma.templateCombination.deleteMany({
        where: { jersey_template_id: id },
      });

      await this.prisma.templateCombination.createMany({
        data: updateDto.combinations.map((c) => ({
          jersey_template_id: id,
          color_option_id: c.color_option_id,
          size_option_id: c.size_option_id,
          material_option_id: c.material_option_id,
        })),
      });
    }

    return this.prisma.jerseyTemplate.update({
      where: { id },
      data: {
        name: updateDto.name,
        image: updateDto.image,
        description: updateDto.description,
        status: updateDto.status,
      },
      include: {
        combinations: {
          include: {
            color: true,
            size: true,
            material: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.templateCombination.deleteMany({
      where: { jersey_template_id: id },
    });

    return this.prisma.jerseyTemplate.delete({ where: { id } });
  }
}
