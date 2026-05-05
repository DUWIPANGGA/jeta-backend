import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@Injectable()
export class StagesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createStageDto: CreateStageDto) {
    const existingOrder = await this.prisma.stage.findFirst({
      where: { order: createStageDto.order },
    });
    if (existingOrder) {
      throw new ConflictException(`Stage with order ${createStageDto.order} already exists`);
    }

    const stage = await this.prisma.stage.create({
      data: {
        stage_name: createStageDto.stage_name,
        order: createStageDto.order,
        description: createStageDto.description,
      },
    });

    return {
      success: true,
      message: 'Stage created successfully',
      data: stage,
    };
  }

  async findAll() {
    const stages = await this.prisma.stage.findMany({
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Stages retrieved successfully',
      data: stages,
      total: stages.length,
    };
  }

  async findOne(id: number) {
    const stage = await this.prisma.stage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Stage retrieved successfully',
      data: stage,
    };
  }

  async update(id: number, updateStageDto: UpdateStageDto) {
    await this.findOne(id);

    if (updateStageDto.order !== undefined) {
      const existingOrder = await this.prisma.stage.findFirst({
        where: {
          order: updateStageDto.order,
          id: { not: id },
        },
      });
      if (existingOrder) {
        throw new ConflictException(`Stage with order ${updateStageDto.order} already exists`);
      }
    }

    const updated = await this.prisma.stage.update({
      where: { id },
      data: updateStageDto,
    });

    return {
      success: true,
      message: 'Stage updated successfully',
      data: updated,
    };
  }

  async updateOrder(id: number, newOrder: number) {
    await this.findOne(id);

    const existingOrder = await this.prisma.stage.findFirst({
      where: {
        order: newOrder,
        id: { not: id },
      },
    });

    if (existingOrder) {
      throw new ConflictException(`Stage with order ${newOrder} already exists`);
    }

    const updated = await this.prisma.stage.update({
      where: { id },
      data: { order: newOrder },
    });

    return {
      success: true,
      message: 'Stage order updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.stage.delete({ where: { id } });
    return {
      success: true,
      message: `Stage with ID ${id} deleted successfully`,
    };
  }
}