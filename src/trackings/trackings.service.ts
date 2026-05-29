import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { TRACKING_STAGE_MAP } from '../common/constants/tracking.constants';

@Injectable()
export class TrackingsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateTrackingDto) {
    // Validasi order exists
    const order = await this.prisma.order.findUnique({
      where: { id: createDto.order_id },
    });
    if (!order) {
      throw new BadRequestException(`Order with ID ${createDto.order_id} not found`);
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Tidak dapat membuat pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
    }
    if (order.status === 'pending') {
      throw new BadRequestException('Tidak dapat membuat pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
    }

    // Cek apakah tracking sudah ada untuk order ini
    const existingTracking = await this.prisma.tracking.findFirst({
      where: { order_id: createDto.order_id },
    });
    if (existingTracking) {
      throw new BadRequestException(`Tracking already exists for order ID ${createDto.order_id}`);
    }

    return this.prisma.tracking.create({
      data: {
        order_id: createDto.order_id,
        current_stage: createDto.current_stage,
        progress_percentage: createDto.progress_percentage,
        estimated_completion: new Date(createDto.estimated_completion),
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tracking_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.tracking.findMany({
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tracking_histories: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const tracking = await this.prisma.tracking.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tracking_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!tracking) {
      throw new NotFoundException(`Tracking with ID ${id} not found`);
    }
    return tracking;
  }

  async findByOrder(orderId: number) {
    const tracking = await this.prisma.tracking.findFirst({
      where: { order_id: orderId },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
          },
        },
        tracking_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!tracking) {
      throw new NotFoundException(`Tracking for order ID ${orderId} not found`);
    }
    return tracking;
  }

  async update(id: number, updateDto: UpdateTrackingDto) {
    const tracking = await this.findOne(id);

    if (tracking.order.status === 'cancelled') {
      throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
    }
    if (tracking.order.status === 'pending') {
      throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
    }

    const updateData: any = {};
    if (updateDto.current_stage !== undefined) {
      updateData.current_stage = updateDto.current_stage;
      const mapping = TRACKING_STAGE_MAP[updateDto.current_stage];
      if (mapping && updateDto.progress_percentage === undefined) {
        updateData.progress_percentage = mapping.progress;
      }
    }
    if (updateDto.progress_percentage !== undefined) {
      updateData.progress_percentage = updateDto.progress_percentage;
    }
    if (updateDto.estimated_completion !== undefined) {
      updateData.estimated_completion = new Date(updateDto.estimated_completion);
    }

    const nextOrderStatus = updateDto.current_stage ? TRACKING_STAGE_MAP[updateDto.current_stage]?.orderStatus : null;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tracking.update({
        where: { id },
        data: updateData,
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
            },
          },
          tracking_histories: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (nextOrderStatus && tracking.order.status !== nextOrderStatus) {
        await tx.order.update({
          where: { id: tracking.order_id },
          data: { status: nextOrderStatus as any },
        });
      }

      return updated;
    });
  }

  async updateStage(id: number, stageName: string, progressPercentage?: number) {
    const tracking = await this.findOne(id);

    if (tracking.order.status === 'cancelled') {
      throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
    }
    if (tracking.order.status === 'pending') {
      throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
    }

    const mapping = TRACKING_STAGE_MAP[stageName];
    const progress = progressPercentage !== undefined ? progressPercentage : (mapping ? mapping.progress : tracking.progress_percentage);
    const nextOrderStatus = mapping?.orderStatus;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Tambah history otomatis
      await tx.trackingHistory.create({
        data: {
          tracking_id: id,
          status: stageName,
        },
      });

      // 2. Update tracking
      const updated = await tx.tracking.update({
        where: { id },
        data: {
          current_stage: stageName,
          progress_percentage: progress,
        },
        include: {
          order: true,
          tracking_histories: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      // 3. Update order status if mapped and changed
      if (nextOrderStatus && tracking.order.status !== nextOrderStatus) {
        await tx.order.update({
          where: { id: tracking.order_id },
          data: { status: nextOrderStatus as any },
        });
      }

      return updated;
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Hapus tracking histories terlebih dahulu
    await this.prisma.trackingHistory.deleteMany({
      where: { tracking_id: id },
    });

    await this.prisma.tracking.delete({ where: { id } });
    return { message: `Tracking with ID ${id} successfully deleted` };
  }
}