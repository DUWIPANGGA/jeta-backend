import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkLogsService {
  constructor(private readonly prisma: PrismaService) {}

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
}