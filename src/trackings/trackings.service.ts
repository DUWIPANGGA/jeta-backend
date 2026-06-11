import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { TRACKING_STAGE_MAP } from '../common/constants/tracking.constants';

@Injectable()
export class TrackingsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateTrackingDto) {
    const { order_id, custom_order_id, current_stage, progress_percentage, estimated_completion } = createDto;

    if ((!order_id && !custom_order_id) || (order_id && custom_order_id)) {
      throw new BadRequestException('Harus menentukan salah satu dari order_id atau custom_order_id.');
    }

    const dataToCreate: any = {
      current_stage,
      progress_percentage,
      estimated_completion: new Date(estimated_completion),
    };

    if (order_id) {
      const order = await this.prisma.order.findUnique({
        where: { id: order_id },
      });
      if (!order) {
        throw new BadRequestException(`Order with ID ${order_id} not found`);
      }
      if (order.status === 'cancelled') {
        throw new BadRequestException('Tidak dapat membuat pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
      }
      if (order.status === 'pending') {
        throw new BadRequestException('Tidak dapat membuat pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
      }

      const existingTracking = await this.prisma.tracking.findFirst({
        where: { order_id },
      });
      if (existingTracking) {
        throw new BadRequestException(`Tracking already exists for order ID ${order_id}`);
      }

      dataToCreate.order_id = order_id;
    } else if (custom_order_id) {
      const customOrder = await this.prisma.customOrder.findUnique({
        where: { id: custom_order_id },
      });
      if (!customOrder) {
        throw new BadRequestException(`Custom Order with ID ${custom_order_id} not found`);
      }
      if (customOrder.accept_status !== 'accepted') {
        throw new BadRequestException('Tidak dapat membuat pelacakan pengiriman untuk pesanan kustom yang belum disetujui.');
      }

      const existingTracking = await this.prisma.tracking.findFirst({
        where: { custom_order_id },
      });
      if (existingTracking) {
        throw new BadRequestException(`Tracking already exists for custom order ID ${custom_order_id}`);
      }

      dataToCreate.custom_order_id = custom_order_id;
    }

    return this.prisma.tracking.create({
      data: dataToCreate,
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
        custom_order: {
          select: {
            id: true,
            name: true,
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
        custom_order: {
          select: {
            id: true,
            name: true,
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
        custom_order: {
          select: {
            id: true,
            name: true,
            accept_status: true,
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

  async findByCustomOrder(customOrderId: number) {
    const tracking = await this.prisma.tracking.findFirst({
      where: { custom_order_id: customOrderId },
      include: {
        custom_order: {
          select: {
            id: true,
            name: true,
          },
        },
        tracking_histories: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!tracking) {
      throw new NotFoundException(`Tracking for custom order ID ${customOrderId} not found`);
    }
    return tracking;
  }

  async update(id: number, updateDto: UpdateTrackingDto) {
    const tracking = await this.findOne(id);

    if (tracking.order) {
      if (tracking.order.status === 'cancelled') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
      }
      if (tracking.order.status === 'pending') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
      }
    } else if (tracking.custom_order) {
      if (tracking.custom_order.accept_status !== 'accepted') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan kustom yang belum disetujui.');
      }
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
          custom_order: {
            select: {
              id: true,
              name: true,
            },
          },
          tracking_histories: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (nextOrderStatus && tracking.order && tracking.order.status !== nextOrderStatus) {
        await tx.order.update({
          where: { id: tracking.order.id },
          data: { status: nextOrderStatus as any },
        });
      }

      return updated;
    });
  }

  async updateStage(id: number, stageName: string, progressPercentage?: number) {
    const tracking = await this.findOne(id);

    if (tracking.order) {
      if (tracking.order.status === 'cancelled') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
      }
      if (tracking.order.status === 'pending') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang belum dibayar (status: pending).');
      }
    } else if (tracking.custom_order) {
      if (tracking.custom_order.accept_status !== 'accepted') {
        throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan kustom yang belum disetujui.');
      }
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
          custom_order: true,
          tracking_histories: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      // 3. Update order status if mapped and changed
      if (nextOrderStatus && tracking.order && tracking.order.status !== nextOrderStatus) {
        await tx.order.update({
          where: { id: tracking.order.id },
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