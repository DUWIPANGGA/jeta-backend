// src/custom-orders/custom-orders.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private isDeadlineValid(deadline: Date): boolean {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setUTCHours(0, 0, 0, 0);
    return deadlineDate >= today;
  }

  // Helper untuk parse images dari JSON string ke array
  private parseImages(images: string | null): string[] | null {
    if (!images) return null;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // ==================== CREATE ====================
  async create(createCustomOrderDto: CreateCustomOrderDto, user: any, files?: Express.Multer.File[]) {
    if (!user) throw new NotFoundException('User not found');

    const isAdmin = user.role_id === 1;

    if (!isAdmin) {
      if (
        createCustomOrderDto.dp_amount !== undefined ||
        createCustomOrderDto.remaining_amount !== undefined ||
        createCustomOrderDto.total_amount !== undefined
      ) {
        throw new ForbiddenException('You are not allowed to set financial fields');
      }
    }

    const deadline = createCustomOrderDto.deadline;
    if (!this.isDeadlineValid(deadline)) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    // Konversi manual items
    let items = createCustomOrderDto.items;
    
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        throw new BadRequestException('Invalid items format');
      }
    }
    
    if (!Array.isArray(items)) {
      throw new BadRequestException('Items must be an array');
    }

    interface ValidatedItem {
      sub_category_id: number;
      quantity: number;
    }
    
    const validatedItems: ValidatedItem[] = [];
    
    for (const item of items) {
      const sub_category_id = Number(item.sub_category_id);
      const quantity = Number(item.quantity);
      
      if (isNaN(sub_category_id) || sub_category_id <= 0) {
        throw new BadRequestException('Invalid sub_category_id');
      }
      if (isNaN(quantity) || quantity <= 0) {
        throw new BadRequestException('Invalid quantity');
      }
      
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: sub_category_id },
      });
      if (!subCategory) {
        throw new BadRequestException(`SubCategory with ID ${sub_category_id} not found`);
      }
      
      validatedItems.push({ sub_category_id, quantity });
    }

    // Proses multiple images
    let imagePaths: string | null = null;
    if (files && files.length > 0) {
      imagePaths = JSON.stringify(files.map(file => `/uploads/custom-orders/${file.filename}`));
    }

    const data: Prisma.CustomOrderUncheckedCreateInput = {
      user_id: user.id,
      name: createCustomOrderDto.name,
      phone: createCustomOrderDto.phone,
      email: createCustomOrderDto.email,
      deadline,
      catatan_tambahan: createCustomOrderDto.catatan_tambahan ?? '',
      images: imagePaths,
      accept_status: false,
      payment_status: false,
      dp_amount: isAdmin ? createCustomOrderDto.dp_amount ?? null : null,
      remaining_amount: isAdmin ? createCustomOrderDto.remaining_amount ?? null : null,
      total_amount: isAdmin ? createCustomOrderDto.total_amount ?? null : null,
    };

    if (isAdmin && !data.total_amount && data.dp_amount && data.remaining_amount) {
      data.total_amount = data.dp_amount + data.remaining_amount;
    }

    try {
      const customOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.customOrder.create({ data });

        for (const item of validatedItems) {
          await tx.customOrderItem.create({
            data: {
              custom_order_id: order.id,
              sub_category_id: item.sub_category_id,
              quantity: item.quantity,
            },
          });
        }

        const result = await tx.customOrder.findUnique({
          where: { id: order.id },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            payment: true,
            items: {
              include: {
                sub_category: {
                  include: { category: true },
                },
              },
            },
          },
        });

        if (!result) {
          throw new NotFoundException('Failed to retrieve created custom order');
        }

        return {
          ...result,
          images: this.parseImages(result.images),
        };
      });
      return customOrder;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry (unique constraint)');
      }
      throw error;
    }
  }

  // ==================== FIND ALL ====================
  async findAll() {
    const customOrders = await this.prisma.customOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
        projects: { include: { members: true } },
        items: {
          include: {
            sub_category: {
              include: { category: true },
            },
          },
        },
      },
    });

    return customOrders.map(order => ({
      ...order,
      images: this.parseImages(order.images),
    }));
  }

  // ==================== FIND ONE ====================
  async findOne(id: number) {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
        projects: { include: { members: true } },
        items: {
          include: {
            sub_category: {
              include: { category: true },
            },
          },
        },
      },
    });
    if (!customOrder) {
      throw new NotFoundException(`Custom order with ID ${id} not found`);
    }
    return {
      ...customOrder,
      images: this.parseImages(customOrder.images),
    };
  }

  // ==================== FIND BY USER ====================
  async findByUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const customOrders = await this.prisma.customOrder.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        payment: true,
        items: {
          include: {
            sub_category: {
              include: { category: true },
            },
          },
        },
      },
    });
    return customOrders.map(order => ({
      ...order,
      images: this.parseImages(order.images),
    }));
  }

  // ==================== UPDATE ====================
  async update(id: number, updateCustomOrderDto: UpdateCustomOrderDto, currentUser: any, files?: Express.Multer.File[]) {
    await this.findOne(id);
    const isAdmin = currentUser.role_id === 1;

    const protectedFields = ['dp_amount', 'remaining_amount', 'total_amount', 'accept_status', 'payment_status'];

    if (!isAdmin) {
      for (const field of protectedFields) {
        if ((updateCustomOrderDto as any)[field] !== undefined) {
          throw new ForbiddenException(`You are not allowed to update ${field}`);
        }
      }
    }

    if (updateCustomOrderDto.deadline) {
      const deadline = new Date(updateCustomOrderDto.deadline);
      if (!this.isDeadlineValid(deadline)) {
        throw new BadRequestException('Deadline cannot be in the past');
      }
    }

    let imagePaths: string | null | undefined = undefined;
    if (files && files.length > 0) {
      imagePaths = JSON.stringify(files.map(file => `/uploads/custom-orders/${file.filename}`));
    }

    const updateData: Prisma.CustomOrderUncheckedUpdateInput = {};

    if (updateCustomOrderDto.name !== undefined) updateData.name = updateCustomOrderDto.name;
    if (updateCustomOrderDto.phone !== undefined) updateData.phone = updateCustomOrderDto.phone;
    if (updateCustomOrderDto.email !== undefined) updateData.email = updateCustomOrderDto.email;
    if (updateCustomOrderDto.deadline !== undefined) updateData.deadline = updateCustomOrderDto.deadline;
    if (updateCustomOrderDto.catatan_tambahan !== undefined) updateData.catatan_tambahan = updateCustomOrderDto.catatan_tambahan;
    if (imagePaths !== undefined) updateData.images = imagePaths;

    if (isAdmin) {
      if (updateCustomOrderDto.dp_amount !== undefined) updateData.dp_amount = updateCustomOrderDto.dp_amount;
      if (updateCustomOrderDto.remaining_amount !== undefined) updateData.remaining_amount = updateCustomOrderDto.remaining_amount;
      if (updateCustomOrderDto.total_amount !== undefined) updateData.total_amount = updateCustomOrderDto.total_amount;
      if (updateCustomOrderDto.accept_status !== undefined) updateData.accept_status = updateCustomOrderDto.accept_status;
      if (updateCustomOrderDto.payment_status !== undefined) updateData.payment_status = updateCustomOrderDto.payment_status;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.customOrder.update({
        where: { id },
        data: updateData,
      });

      // Update items jika disertakan
      if (updateCustomOrderDto.items !== undefined) {
        // Hapus semua items lama
        await tx.customOrderItem.deleteMany({ where: { custom_order_id: id } });

        // Konversi dan validasi items baru
        let newItems = updateCustomOrderDto.items;
        if (typeof newItems === 'string') {
          try {
            newItems = JSON.parse(newItems);
          } catch (e) {
            throw new BadRequestException('Invalid items format');
          }
        }

        if (Array.isArray(newItems) && newItems.length > 0) {
          for (const item of newItems) {
            const sub_category_id = Number(item.sub_category_id);
            const quantity = Number(item.quantity);
            
            if (isNaN(sub_category_id) || sub_category_id <= 0) {
              throw new BadRequestException('Invalid sub_category_id');
            }
            if (isNaN(quantity) || quantity <= 0) {
              throw new BadRequestException('Invalid quantity');
            }
            
            const subCategory = await tx.subCategory.findUnique({
              where: { id: sub_category_id },
            });
            if (!subCategory) {
              throw new BadRequestException(`SubCategory with ID ${sub_category_id} not found`);
            }
            
            await tx.customOrderItem.create({
              data: {
                custom_order_id: id,
                sub_category_id,
                quantity,
              },
            });
          }
        }
      }

      const result = await tx.customOrder.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          payment: true,
          items: {
            include: {
              sub_category: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundException(`Custom order with ID ${id} not found after update`);
      }

      return {
        ...result,
        images: this.parseImages(result.images),
      };
    });
  }

  // ==================== UPDATE ACCEPT STATUS ====================
  async updateAcceptStatus(id: number, acceptStatus: boolean) {
    const customOrder = await this.findOne(id);

    if (acceptStatus === true) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { custom_order_id: id },
      });
      if (!existingPayment) {
        const defaultPaymentMethod = await this.prisma.paymentMethod.findFirst({
          where: { status_method: true },
        });
        await this.prisma.payment.create({
          data: {
            custom_order_id: id,
            order_type: 'custom_order',
            payment_status: 'pending',
            payment_method_id: defaultPaymentMethod?.id ?? null,
            amount: null,
            paid_at: null,
            payment_proof: null,
          },
        });
      }

      let project = await this.prisma.project.findFirst({
        where: { custom_order_id: id },
      });
      if (!project) {
        project = await this.prisma.project.create({
          data: {
            user_id: customOrder.user_id,
            custom_order_id: id,
            status: true,
          },
        });
      }

      const result = await this.prisma.customOrder.update({
        where: { id },
        data: { accept_status: true },
        include: {
          payment: true,
          projects: { include: { members: true } },
          items: {
            include: {
              sub_category: {
                include: { category: true },
              },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        ...result,
        images: this.parseImages(result.images),
      };
    } else {
      const result = await this.prisma.customOrder.update({
        where: { id },
        data: { accept_status: false },
      });
      return {
        ...result,
        images: this.parseImages(result.images),
      };
    }
  }

  // ==================== REMOVE ====================
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.customOrder.delete({ where: { id } });
    return { message: `Custom order with ID ${id} deleted successfully` };
  }

  // ==================== STATISTICS ====================
  async getStatistics() {
    const totalOrders = await this.prisma.customOrder.count();
    const acceptedOrders = await this.prisma.customOrder.count({
      where: { accept_status: true },
    });
    const pendingOrders = await this.prisma.customOrder.count({
      where: { accept_status: false },
    });

    const all = await this.prisma.customOrder.findMany({
      select: { dp_amount: true, remaining_amount: true, total_amount: true },
    });

    let totalDp = 0,
      totalRemaining = 0,
      totalAmountSum = 0;
    for (const order of all) {
      totalDp += order.dp_amount ?? 0;
      totalRemaining += order.remaining_amount ?? 0;
      totalAmountSum += order.total_amount ?? 0;
    }

    return {
      total_orders: totalOrders,
      accepted_orders: acceptedOrders,
      pending_orders: pendingOrders,
      total_dp_amount: totalDp,
      total_remaining_amount: totalRemaining,
      total_amount: totalAmountSum,
    };
  }
}