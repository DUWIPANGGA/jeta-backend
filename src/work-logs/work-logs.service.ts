// src/work-logs/work-logs.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: any) {
    const { orderType, orderId, stageId, quantity } = dto;

    if (!orderType || !orderId || !stageId || !quantity) {
      throw new BadRequestException('orderType, orderId, stageId, and quantity are required');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    let totalQuantity = 0;
    if (orderType === 'CUSTOM') {
      const order = await this.prisma.customOrder.findUnique({
        where: { id: Number(orderId) },
        include: { items: true },  // ← tambahkan include items
      });
      if (!order) throw new BadRequestException('Custom order not found');
      // Hitung total quantity dari items
      totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    } else if (orderType === 'SPORT') {
      const order = await this.prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { order_items: true }
      });
      if (!order) throw new BadRequestException('Sport order not found');
      totalQuantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      throw new BadRequestException('Invalid order type, must be CUSTOM or SPORT');
    }

    const existingLogs = await this.prisma.workLog.findMany({
      where: {
        order_type: orderType,
        ...(orderType === 'CUSTOM' ? { custom_order_id: Number(orderId) } : { sport_order_id: Number(orderId) }),
        stage_id: Number(stageId)
      }
    });
    
    const completedQuantity = existingLogs.reduce((sum, log) => sum + log.quantity, 0);

    if (completedQuantity + quantity > totalQuantity) {
      throw new BadRequestException(`Cannot log ${quantity} items. Only ${totalQuantity - completedQuantity} remaining for this stage.`);
    }

    return this.prisma.workLog.create({
      data: {
        user_id: userId,
        stage_id: Number(stageId),
        order_type: orderType,
        custom_order_id: orderType === 'CUSTOM' ? Number(orderId) : null,
        sport_order_id: orderType === 'SPORT' ? Number(orderId) : null,
        quantity: Number(quantity),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                sub_category: { include: { category: true } }
              }
            }
          }
        },
        sport_order: true,
      }
    });
  }

  findAll() {
    return this.prisma.workLog.findMany({
      include: { 
        user: { select: { id: true, name: true, email: true } }, 
        stage: true, 
        custom_order: {
          include: {
            items: {
              include: {
                sub_category: { include: { category: true } }
              }
            }
          }
        },
        sport_order: true 
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getOrderProgress(orderType: string, orderId: number) {
    let totalQuantity = 0;
    if (orderType === 'CUSTOM') {
      const order = await this.prisma.customOrder.findUnique({
        where: { id: orderId },
        include: { items: true },  // ← tambahkan include items
      });
      if (!order) throw new BadRequestException('Custom order not found');
      totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    } else if (orderType === 'SPORT') {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { order_items: true }
      });
      if (!order) throw new BadRequestException('Sport order not found');
      totalQuantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      throw new BadRequestException('Invalid order type, must be CUSTOM or SPORT');
    }

    const stages = await this.prisma.stage.findMany({
      orderBy: { order_index: 'asc' }
    });

    const workLogs = await this.prisma.workLog.findMany({
      where: {
        order_type: orderType,
        ...(orderType === 'CUSTOM' ? { custom_order_id: orderId } : { sport_order_id: orderId })
      }
    });

    const progress = stages.map(stage => {
      const completed = workLogs
        .filter(log => log.stage_id === stage.id)
        .reduce((sum, log) => sum + log.quantity, 0);
      return {
        stageId: stage.id,
        stageName: stage.stage_name,
        completedQuantity: completed,
        totalQuantity: totalQuantity,
        percentage: totalQuantity > 0 ? Math.round((completed / totalQuantity) * 100) : 0
      };
    });

    return {
      orderType,
      orderId,
      totalQuantity,
      progress
    };
  }

  async findOne(id: number) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
      include: { 
        user: { select: { id: true, name: true, email: true } }, 
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                sub_category: { include: { category: true } }
              }
            }
          }
        },
        sport_order: true,
      }
    });
    if (!workLog) throw new NotFoundException(`Work log with ID ${id} not found`);
    return workLog;
  }

  async remove(id: number) {
    const workLog = await this.findOne(id);
    await this.prisma.workLog.delete({ where: { id } });
    return { message: `Work log with ID ${id} deleted successfully` };
  }
}