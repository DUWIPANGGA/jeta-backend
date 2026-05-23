import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  create(dto: any) {
    return this.prisma.order.create({ data: dto });
  }

  async findByUser(userId: number, loggedInUserId: number, loggedInUserRoleId: number) {
    // 1. Dapatkan role dari pengguna yang login
    const role = await this.prisma.role.findUnique({
      where: { id: loggedInUserRoleId }
    });

    const isOwner = loggedInUserId === userId;
    const hasAdminAccess = role && ['superadmin', 'admin', 'staff', 'finance'].includes(role.name);

    if (!isOwner && !hasAdminAccess) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk melihat pesanan ini.');
    }

    return this.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      }
    });
    if (!item) throw new NotFoundException(`Order #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data: dto });
  }

  async updateTracking(id: number, stageName: string) {
    const order = await this.findOne(id);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get or create tracking record
      let tracking = await tx.tracking.findFirst({
        where: { order_id: id }
      });

      if (!tracking) {
        tracking = await tx.tracking.create({
          data: {
            order_id: id,
            current_stage: stageName,
            progress_percentage: 0,
            estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
          }
        });
      } else {
        tracking = await tx.tracking.update({
          where: { id: tracking.id },
          data: { current_stage: stageName }
        });
      }

      // 2. Add history
      await tx.trackingHistory.create({
        data: {
          tracking_id: tracking.id,
          status: stageName
        }
      });

      // 3. Update Order Status if final stage
      const finalStages = ['Selesai', 'Diterima', 'Completed'];
      if (finalStages.includes(stageName)) {
        await tx.order.update({
          where: { id },
          data: { status: 'completed' }
        });
      } else if (order.status === 'pending') {
        await tx.order.update({
          where: { id },
          data: { status: 'processing' }
        });
      }

      return tracking;
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.order.delete({ where: { id } });
    return { message: `Order #${id} successfully deleted` };
  }
}
