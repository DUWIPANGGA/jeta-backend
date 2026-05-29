import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, data: {
    stage_id: number;
    order_type: string;
    custom_order_id?: number;
    sport_order_id?: number;
    quantity: number;
    earned_amount?: number;
  }) {
    // Validasi user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validasi stage
    const stage = await this.prisma.stage.findUnique({
      where: { id: data.stage_id },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${data.stage_id} not found`);
    }

    return this.prisma.workLog.create({
      data: {
        user_id: userId,
        stage_id: data.stage_id,
        order_type: data.order_type,
        custom_order_id: data.custom_order_id,
        sport_order_id: data.sport_order_id,
        quantity: data.quantity,
        earned_amount: data.earned_amount,
      },
      include: {
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {        // ← PERUBAHAN: variant_option → selected_options
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sport_order: true,
      },
    });
  }

  async findAll() {
    return this.prisma.workLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {        // ← PERUBAHAN: variant_option → selected_options
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sport_order: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {        // ← PERUBAHAN: variant_option → selected_options
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sport_order: true,
      },
    });
    if (!workLog) {
      throw new NotFoundException(`Work log with ID ${id} not found`);
    }
    return workLog;
  }

  async findByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.workLog.findMany({
      where: { user_id: userId },
      include: {
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {        // ← PERUBAHAN: variant_option → selected_options
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sport_order: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProject(customOrderId: number) {
    return this.prisma.workLog.findMany({
      where: { custom_order_id: customOrderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stage: true,
        custom_order: {
          include: {
            items: {
              include: {
                selected_options: {        // ← PERUBAHAN: variant_option → selected_options
                  include: {
                    variant_option: {
                      include: {
                        custom_variant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: number, data: {
    stage_id?: number;
    quantity?: number;
    earned_amount?: number;
  }) {
    await this.findOne(id);
    return this.prisma.workLog.update({
      where: { id },
      data,
      include: {
        stage: true,
        custom_order: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.workLog.delete({
      where: { id },
    });
  }

  async getTotalEarnedByUser(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { user_id: userId };

    if (startDate && endDate) {
      where.created_at = {
        gte: startDate,
        lte: endDate,
      };
    }

    const result = await this.prisma.workLog.aggregate({
      where,
      _sum: {
        earned_amount: true,
      },
    });

    return {
      user_id: userId,
      total_earned: result._sum.earned_amount || 0,
    };
  }

  async getProgress(type: string, id: number) {
    // 1. Dapatkan daftar tahapan (stages) berurutan
    const stages = await this.prisma.stage.findMany({
      orderBy: { order_index: 'asc' },
    });

    let orderIdLabel: string = '';
    let overallTotalQty = 0;
    const progressData: any[] = [];

    if (type.toUpperCase() === 'SPORT') {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: { order_items: true },
      });
      if (!order) throw new NotFoundException(`Order SPORT #${id} not found`);

      // ✅ PERBAIKAN: gunakan fallback jika order_number null
      orderIdLabel = order.order_number || `ORD-${order.id}`;
      overallTotalQty = order.order_items.reduce((acc, curr) => acc + curr.quantity, 0);

      // Agregasi work_logs untuk SPORT
      const groupedLogs = await this.prisma.workLog.groupBy({
        by: ['stage_id'],
        where: { sport_order_id: id },
        _sum: { quantity: true },
      });

      for (const stage of stages) {
        const logForStage = groupedLogs.find(g => g.stage_id === stage.id);
        const completedQuantity = logForStage?._sum.quantity || 0;
        const totalQuantity = overallTotalQty;
        const percentage = totalQuantity > 0 ? Math.min(100, Math.round((completedQuantity / totalQuantity) * 100)) : 0;

        progressData.push({
          stageId: stage.id,
          stageName: stage.stage_name,
          completedQuantity,
          totalQuantity,
          percentage
        });
      }
    } else if (type.toUpperCase() === 'CUSTOM') {
      const customOrder = await this.prisma.customOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!customOrder) throw new NotFoundException(`Custom Order #${id} not found`);

      // ✅ PERBAIKAN: gunakan fallback jika name null
      orderIdLabel = customOrder.name || `CUSTOM-${customOrder.id}`;
      overallTotalQty = customOrder.items.reduce((acc, curr) => acc + curr.quantity, 0);

      // Ambil progress dari ProgressReports (milik custom order)
      const project = await this.prisma.project.findUnique({
        where: { custom_order_id: id },
        include: { progressReports: true }
      });

      const progressReports = project ? project.progressReports : [];

      for (const stage of stages) {
        const logsForStage = progressReports.filter(pr => pr.stage_id === stage.id && (pr.approval_status === true || pr.status === 'selesai'));
        const completedQuantity = logsForStage.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
        const totalQuantity = overallTotalQty;
        const percentage = totalQuantity > 0 ? Math.min(100, Math.round((completedQuantity / totalQuantity) * 100)) : 0;

        progressData.push({
          stageId: stage.id,
          stageName: stage.stage_name,
          completedQuantity,
          totalQuantity,
          percentage
        });
      }
    } else {
      throw new NotFoundException(`Invalid type: ${type}`);
    }

    return {
      orderId: orderIdLabel,
      totalQuantity: overallTotalQty,
      progress: progressData
    };
  }
}