import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingHistoriesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: { tracking_id: number; status: string }) {
    // Validasi tracking_id exists
    const tracking = await this.prisma.tracking.findUnique({
      where: { id: dto.tracking_id },
    });
    if (!tracking) {
      throw new BadRequestException(`Tracking with ID ${dto.tracking_id} not found`);
    }

    return this.prisma.trackingHistory.create({
      data: {
        tracking_id: dto.tracking_id,
        status: dto.status,
      },
      include: {
        tracking: {
          select: {
            id: true,
            order_id: true,
            current_stage: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.trackingHistory.findMany({
      include: {
        tracking: {
          select: {
            id: true,
            order_id: true,
            current_stage: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.trackingHistory.findUnique({
      where: { id },
      include: {
        tracking: {
          select: {
            id: true,
            order_id: true,
            current_stage: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException(`TrackingHistory #${id} not found`);
    return item;
  }

  async findByTracking(trackingId: number) {
    return this.prisma.trackingHistory.findMany({
      where: { tracking_id: trackingId },
      include: {
        tracking: {
          select: {
            id: true,
            order_id: true,
            current_stage: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: number, dto: { status?: string }) {
    await this.findOne(id);
    return this.prisma.trackingHistory.update({
      where: { id },
      data: dto,
      include: {
        tracking: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.trackingHistory.delete({ where: { id } });
    return { message: `TrackingHistory #${id} successfully deleted` };
  }
}