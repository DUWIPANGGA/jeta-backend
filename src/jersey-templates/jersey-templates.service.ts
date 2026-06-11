import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJerseyTemplateDto } from './dto/create-jersey-template.dto';
import { UpdateJerseyTemplateDto } from './dto/update-jersey-template.dto';

const templateInclude = {
  colors: {
    include: { option: true },
  },
  sizes: {
    include: { option: true },
  },
  materials: {
    include: { option: true },
  },
};

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
        colors: createDto.color_ids
          ? { create: createDto.color_ids.map((id) => ({ variant_option_id: id })) }
          : undefined,
        sizes: createDto.size_ids
          ? { create: createDto.size_ids.map((id) => ({ variant_option_id: id })) }
          : undefined,
        materials: createDto.material_ids
          ? { create: createDto.material_ids.map((id) => ({ variant_option_id: id })) }
          : undefined,
      },
      include: templateInclude,
    });
  }

  async findAll(includeInactive: boolean = true) {
    const where = includeInactive ? {} : { status: true };

    return this.prisma.jerseyTemplate.findMany({
      where,
      include: templateInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const template = await this.prisma.jerseyTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });

    if (!template) {
      throw new NotFoundException(`Jersey template with ID ${id} not found`);
    }

    return template;
  }

  async update(templateId: number, updateDto: UpdateJerseyTemplateDto) {
    await this.findOne(templateId);

    if (updateDto.name) {
      const existing = await this.prisma.jerseyTemplate.findFirst({
        where: { name: updateDto.name, NOT: { id: templateId } },
      });
      if (existing) {
        throw new ConflictException(`Jersey template with name "${updateDto.name}" already exists`);
      }
    }

    if (updateDto.color_ids) {
      await this.prisma.templateColor.deleteMany({
        where: { jersey_template_id: templateId },
      });
      await this.prisma.templateColor.createMany({
        data: updateDto.color_ids.map((optionId) => ({
          jersey_template_id: templateId,
          variant_option_id: optionId,
        })),
      });
    }

    if (updateDto.size_ids) {
      await this.prisma.templateSize.deleteMany({
        where: { jersey_template_id: templateId },
      });
      await this.prisma.templateSize.createMany({
        data: updateDto.size_ids.map((optionId) => ({
          jersey_template_id: templateId,
          variant_option_id: optionId,
        })),
      });
    }

    if (updateDto.material_ids) {
      await this.prisma.templateMaterial.deleteMany({
        where: { jersey_template_id: templateId },
      });
      await this.prisma.templateMaterial.createMany({
        data: updateDto.material_ids.map((optionId) => ({
          jersey_template_id: templateId,
          variant_option_id: optionId,
        })),
      });
    }

    return this.prisma.jerseyTemplate.update({
      where: { id: templateId },
      data: {
        name: updateDto.name,
        image: updateDto.image,
        description: updateDto.description,
        status: updateDto.status,
      },
      include: templateInclude,
    });
  }

  async remove(templateId: number) {
    await this.findOne(templateId);

    await this.prisma.templateColor.deleteMany({ where: { jersey_template_id: templateId } });
    await this.prisma.templateSize.deleteMany({ where: { jersey_template_id: templateId } });
    await this.prisma.templateMaterial.deleteMany({ where: { jersey_template_id: templateId } });

    return this.prisma.jerseyTemplate.delete({ where: { id: templateId } });
  }
}
