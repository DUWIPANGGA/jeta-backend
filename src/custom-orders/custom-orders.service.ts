import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { CreateAdminCustomOrderDto } from './dto/create-admin-custom-order.dto';
import { AcceptCustomOrderDto } from './dto/accept-custom-order.dto';
import { Prisma } from '@prisma/client';
import { enrichCustomOrderItemsWithStages } from '../common/utils/remaining-quantity.helper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  private async getStageIdForUser(userId?: number): Promise<number | undefined> {
    if (!userId) return undefined;
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userId },
      include: { staffStages: true }
    });
    return staff?.staffStages?.[0]?.stage_id;
  }

  private isDeadlineValid(deadline: Date): boolean {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setUTCHours(0, 0, 0, 0);
    return deadlineDate >= today;
  }

  private parseImages(images: string | null): string[] | null {
    if (!images) return null;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // ==================== CREATE (USER) ====================
  async create(createCustomOrderDto: CreateCustomOrderDto, user: any, files?: Express.Multer.File[]) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });
    const isAdmin = dbUser?.role?.name === 'superadmin' || dbUser?.role?.name === 'admin';

    if (!isAdmin) {
      if (
        createCustomOrderDto.dp_amount !== undefined ||
        createCustomOrderDto.remaining_amount !== undefined ||
        createCustomOrderDto.total_amount !== undefined
      ) {
        throw new HttpException('You are not allowed to set financial fields', HttpStatus.FORBIDDEN);
      }
    }

    const deadline = createCustomOrderDto.deadline;
    if (!this.isDeadlineValid(deadline)) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

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
      variant_option_ids: number[];
      quantity: number;
    }

    const validatedItems: ValidatedItem[] = [];

    for (const item of items) {
      let variantOptionIds = item.variant_option_ids;
      const quantity = Number(item.quantity);

      if (typeof variantOptionIds === 'string') {
        try {
          variantOptionIds = JSON.parse(variantOptionIds);
        } catch (e) {
          throw new BadRequestException('Invalid variant_option_ids format');
        }
      }

      if (!Array.isArray(variantOptionIds) || variantOptionIds.length === 0) {
        throw new BadRequestException('variant_option_ids must be a non-empty array');
      }

      if (isNaN(quantity) || quantity <= 0) {
        throw new BadRequestException('Invalid quantity');
      }

      for (const optionId of variantOptionIds) {
        const numericId = Number(optionId);
        if (isNaN(numericId) || numericId <= 0) {
          throw new BadRequestException(`Invalid variant_option_id: ${optionId}`);
        }

        const variantOption = await this.prisma.variantOption.findUnique({
          where: { id: numericId },
          include: { custom_variant: true },
        });
        if (!variantOption) {
          throw new BadRequestException(`Variant option with ID ${numericId} not found`);
        }
      }

      validatedItems.push({
        variant_option_ids: variantOptionIds.map(id => Number(id)),
        quantity
      });
    }

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
          const orderItem = await tx.customOrderItem.create({
            data: {
              custom_order_id: order.id,
              quantity: item.quantity,
              remaining_quantity: item.quantity,
            },
          });

          for (const optionId of item.variant_option_ids) {
            await tx.customOrderItemOption.create({
              data: {
                custom_order_item_id: orderItem.id,
                variant_option_id: optionId,
              },
            });
          }
        }

        const result = await tx.customOrder.findUnique({
          where: { id: order.id },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            payments: true,
            items: {
              include: {
                selected_options: {
                  include: {
                    variant_option: {
                      include: { custom_variant: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!result) {
          throw new NotFoundException('Failed to retrieve created custom order');
        }

        const enriched = {
          ...result,
          images: this.parseImages(result.images),
        };

        const stageId = await this.getStageIdForUser(user.id);
        return enrichCustomOrderItemsWithStages(tx, enriched, stageId);
      });
      return customOrder;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry (unique constraint)');
      }
      throw error;
    }
  }

  // ==================== CREATE (ADMIN) ====================
  async createAdminOrder(createDto: CreateAdminCustomOrderDto, adminUser: any, files?: Express.Multer.File[]) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: adminUser.id },
      include: { role: true },
    });
    const isAdmin = dbUser?.role?.name === 'superadmin' || dbUser?.role?.name === 'admin';

    if (!isAdmin) {
      throw new HttpException('Only admin can create admin custom orders', HttpStatus.FORBIDDEN);
    }

    // 1. Validasi deadline
    const deadline = new Date(createDto.deadline);
    if (!this.isDeadlineValid(deadline)) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    // 2. Validasi customer (user_id atau offline data)
    let customerId: number;
    let customerName: string | null = null;
    let customerPhone: string | null = null;
    let customerEmail: string | null = null;
    let offlineCustomerName: string | null = null;
    let offlinePhone: string | null = null;
    let offlineAddress: string | null = null;

    if (createDto.user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.user_id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${createDto.user_id} not found`);
      }
      customerId = user.id;
      customerName = user.name;
      customerPhone = user.phone;
      customerEmail = user.email;
    } else if (createDto.offline_customer_name) {
      // Offline Customer: TIDAK membuat user baru otomatis. 
      // user_id diisi dengan ID admin yang menginputkan.
      customerId = adminUser.id;
      offlineCustomerName = createDto.offline_customer_name;
      offlinePhone = createDto.offline_phone || null;
      offlineAddress = createDto.offline_address || null;
    } else {
      throw new BadRequestException('Either user_id or offline_customer_name must be provided');
    }

    // 3. Validasi items
    let items = createDto.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        throw new BadRequestException('Invalid items format');
      }
    }

    interface ValidatedItem {
      variant_option_ids: number[];
      quantity: number;
      manual_price_per_pcs?: number;
    }

    const validatedItems: ValidatedItem[] = [];

    for (const item of items) {
      let variantOptionIds = item.variant_option_ids;
      const quantity = Number(item.quantity);
      const manualPricePerPcs = item.manual_price_per_pcs ? Number(item.manual_price_per_pcs) : undefined;

      if (typeof variantOptionIds === 'string') {
        try {
          variantOptionIds = JSON.parse(variantOptionIds);
        } catch (e) {
          throw new BadRequestException('Invalid variant_option_ids format');
        }
      }

      if (!Array.isArray(variantOptionIds) || variantOptionIds.length === 0) {
        throw new BadRequestException('variant_option_ids must be a non-empty array');
      }

      if (isNaN(quantity) || quantity <= 0) {
        throw new BadRequestException('Invalid quantity');
      }

      if (manualPricePerPcs !== undefined && (isNaN(manualPricePerPcs) || manualPricePerPcs < 0)) {
        throw new BadRequestException('manual_price_per_pcs must be a positive number');
      }

      for (const optionId of variantOptionIds) {
        const numericId = Number(optionId);
        if (isNaN(numericId) || numericId <= 0) {
          throw new BadRequestException(`Invalid variant_option_id: ${optionId}`);
        }
        const variantOption = await this.prisma.variantOption.findUnique({
          where: { id: numericId },
        });
        if (!variantOption) {
          throw new BadRequestException(`Variant option with ID ${numericId} not found`);
        }
      }

      validatedItems.push({
        variant_option_ids: variantOptionIds.map(id => Number(id)),
        quantity,
        manual_price_per_pcs: manualPricePerPcs,
      });
    }

    // 4. Proses images
    let imagePaths: string | null = null;
    if (files && files.length > 0) {
      imagePaths = JSON.stringify(files.map(file => `/uploads/custom-orders/${file.filename}`));
    }

    // 5. Hitung total amount
    let itemsTotal = 0;
    for (const item of validatedItems) {
      let totalItemPrice = 0;
      for (const optionId of item.variant_option_ids) {
        const variantOption = await this.prisma.variantOption.findUnique({
          where: { id: optionId },
        });
        if (variantOption && variantOption.price_adjustment) {
          totalItemPrice += variantOption.price_adjustment;
        }
      }
      const pricePerPcs = item.manual_price_per_pcs !== undefined
        ? item.manual_price_per_pcs
        : totalItemPrice;
      itemsTotal += pricePerPcs * item.quantity;
    }

    const totalAmount = createDto.total_amount || itemsTotal;
    const dpAmount = createDto.dp_amount || Math.floor(totalAmount * 0.3);
    const remainingAmount = totalAmount - dpAmount;

    // 6. Create data
    const createdDate = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = Math.abs(deadlineDate.getTime() - createdDate.getTime());
    const productionEstimate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const data: Prisma.CustomOrderUncheckedCreateInput = {
      user_id: customerId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      deadline,
      catatan_tambahan: createDto.catatan_tambahan ?? '',
      images: imagePaths,
      accept_status: true,
      payment_status: false,
      dp_amount: dpAmount,
      remaining_amount: remainingAmount,
      total_amount: totalAmount,
      is_admin_order: true,
      offline_customer_name: offlineCustomerName,
      offline_phone: offlinePhone,
      offline_address: offlineAddress,
      production_estimate: productionEstimate,
    };
    try {
      const customOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.customOrder.create({ data });

        for (const item of validatedItems) {
          let basePrice = 0;
          for (const optionId of item.variant_option_ids) {
            const variantOption = await tx.variantOption.findUnique({
              where: { id: optionId },
            });
            if (variantOption && variantOption.price_adjustment) {
              basePrice += variantOption.price_adjustment;
            }
          }

          const finalPricePerPcs = item.manual_price_per_pcs !== undefined
            ? item.manual_price_per_pcs
            : basePrice;

          const orderItem = await tx.customOrderItem.create({
            data: {
              custom_order_id: order.id,
              quantity: item.quantity,
              remaining_quantity: item.quantity,
              manual_price_per_pcs: item.manual_price_per_pcs,
            },
          });

          for (const optionId of item.variant_option_ids) {
            await tx.customOrderItemOption.create({
              data: {
                custom_order_item_id: orderItem.id,
                variant_option_id: optionId,
              },
            });
          }
        }

        // Create Project langsung
        await tx.project.create({
          data: {
            user_id: customerId,
            custom_order_id: order.id,
            status: true,
          },
        });

        // Create Payment untuk DP
        const defaultPaymentMethod = await tx.paymentMethod.findFirst({
          where: { status_method: true },
        });

        await tx.payment.create({
          data: {
            custom_order_id: order.id,
            order_type: 'custom_order',
            payment_status: 'pending',
            payment_method_id: defaultPaymentMethod?.id ?? null,
            amount: dpAmount,
            payment_stage: 'down_payment',
          },
        });

        const result = await tx.customOrder.findUnique({
          where: { id: order.id },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            payments: true,
            items: {
              include: {
                selected_options: {
                  include: {
                    variant_option: {
                      include: { custom_variant: true },
                    },
                  },
                },
              },
            },
            projects: true,
          },
        });

        if (!result) {
          throw new NotFoundException('Failed to retrieve created custom order');
        }

        const enriched = {
          ...result,
          images: this.parseImages(result.images),
        };

        const stageId = await this.getStageIdForUser(adminUser.id);
        return enrichCustomOrderItemsWithStages(tx, enriched, stageId);
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
  async findAll(userId?: number) {
    const customOrders = await this.prisma.customOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
        projects: { include: { members: true } },
        items: {
          include: {
            selected_options: {
              include: {
                variant_option: {
                  include: { custom_variant: true },
                },
              },
            },
          },
        },
      },
    });

    const parsedOrders = customOrders.map(order => ({
      ...order,
      images: this.parseImages(order.images),
    }));

    const stageId = await this.getStageIdForUser(userId);
    return enrichCustomOrderItemsWithStages(this.prisma, parsedOrders, stageId);
  }

  // ==================== FIND ONE ====================
  async findOne(id: number, userId?: number) {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
        projects: { include: { members: true } },
        items: {
          include: {
            selected_options: {
              include: {
                variant_option: {
                  include: { custom_variant: true },
                },
              },
            },
          },
        },
      },
    });
    if (!customOrder) {
      throw new NotFoundException(`Custom order with ID ${id} not found`);
    }
    const enriched = {
      ...customOrder,
      images: this.parseImages(customOrder.images),
    };
    const stageId = await this.getStageIdForUser(userId);
    return enrichCustomOrderItemsWithStages(this.prisma, enriched, stageId);
  }

  // ==================== FIND BY USER ====================
  async findByUser(userId: number, currentUserId?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const customOrders = await this.prisma.customOrder.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        payments: true,
        items: {
          include: {
            selected_options: {
              include: {
                variant_option: {
                  include: { custom_variant: true },
                },
              },
            },
          },
        },
      },
    });
    const parsedOrders = customOrders.map(order => ({
      ...order,
      images: this.parseImages(order.images),
    }));
    const stageId = await this.getStageIdForUser(currentUserId);
    return enrichCustomOrderItemsWithStages(this.prisma, parsedOrders, stageId);
  }

  // ==================== UPDATE ====================
  async update(id: number, updateCustomOrderDto: UpdateCustomOrderDto, currentUser: any, files?: Express.Multer.File[]) {
    await this.findOne(id);
    const dbUser = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { role: true },
    });
    const isAdmin = dbUser?.role?.name === 'superadmin' || dbUser?.role?.name === 'admin';

    const protectedFields = ['dp_amount', 'remaining_amount', 'total_amount', 'accept_status', 'payment_status'];

    if (!isAdmin) {
      for (const field of protectedFields) {
        if ((updateCustomOrderDto as any)[field] !== undefined) {
          throw new HttpException(`You are not allowed to update ${field}`, HttpStatus.FORBIDDEN);
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
      if (updateCustomOrderDto.offline_customer_name !== undefined) updateData.offline_customer_name = updateCustomOrderDto.offline_customer_name;
      if (updateCustomOrderDto.offline_phone !== undefined) updateData.offline_phone = updateCustomOrderDto.offline_phone;
      if (updateCustomOrderDto.offline_address !== undefined) updateData.offline_address = updateCustomOrderDto.offline_address;
      if (updateCustomOrderDto.production_estimate !== undefined) updateData.production_estimate = updateCustomOrderDto.production_estimate;
      if (updateCustomOrderDto.is_admin_order !== undefined) updateData.is_admin_order = updateCustomOrderDto.is_admin_order;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.customOrder.update({
        where: { id },
        data: updateData,
      });

      if (updateCustomOrderDto.items !== undefined) {
        const oldItems = await tx.customOrderItem.findMany({
          where: { custom_order_id: id },
          include: { selected_options: true },
        });

        for (const oldItem of oldItems) {
          await tx.customOrderItemOption.deleteMany({
            where: { custom_order_item_id: oldItem.id },
          });
          await tx.customOrderItem.delete({
            where: { id: oldItem.id },
          });
        }

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
            let variantOptionIds = item.variant_option_ids;
            const quantity = Number(item.quantity);

            if (typeof variantOptionIds === 'string') {
              try {
                variantOptionIds = JSON.parse(variantOptionIds);
              } catch (e) {
                throw new BadRequestException('Invalid variant_option_ids format');
              }
            }

            if (!Array.isArray(variantOptionIds) || variantOptionIds.length === 0) {
              throw new BadRequestException('variant_option_ids must be a non-empty array');
            }

            if (isNaN(quantity) || quantity <= 0) {
              throw new BadRequestException('Invalid quantity');
            }

            for (const optionId of variantOptionIds) {
              const numericId = Number(optionId);
              if (isNaN(numericId) || numericId <= 0) {
                throw new BadRequestException(`Invalid variant_option_id: ${optionId}`);
              }

              const variantOption = await tx.variantOption.findUnique({
                where: { id: numericId },
              });
              if (!variantOption) {
                throw new BadRequestException(`Variant option with ID ${numericId} not found`);
              }
            }

            const orderItem = await tx.customOrderItem.create({
              data: {
                custom_order_id: id,
                quantity: quantity,
                remaining_quantity: quantity,
              },
            });

            for (const optionId of variantOptionIds) {
              await tx.customOrderItemOption.create({
                data: {
                  custom_order_item_id: orderItem.id,
                  variant_option_id: Number(optionId),
                },
              });
            }
          }
        }
      }

      const result = await tx.customOrder.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          payments: true,
          items: {
            include: {
              selected_options: {
                include: {
                  variant_option: {
                    include: { custom_variant: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundException(`Custom order with ID ${id} not found after update`);
      }

      const enriched = {
        ...result,
        images: this.parseImages(result.images),
      };

      const stageId = await this.getStageIdForUser(currentUser.id);
      return enrichCustomOrderItemsWithStages(tx, enriched, stageId);
    });
  }

  // ==================== UPDATE ACCEPT STATUS ====================
  async updateAcceptStatus(id: number, acceptStatus: boolean, acceptData?: AcceptCustomOrderDto) {
    const customOrder = await this.findOne(id);

    if (acceptStatus === true) {
      let totalAmount = customOrder.total_amount;
      let dpAmount = customOrder.dp_amount;
      let remainingAmount = customOrder.remaining_amount;

      if (acceptData) {
        if (acceptData.total_amount) totalAmount = acceptData.total_amount;
        if (acceptData.dp_amount) dpAmount = acceptData.dp_amount;
        if (acceptData.remaining_amount) {
          remainingAmount = acceptData.remaining_amount;
        } else if (totalAmount && dpAmount) {
          remainingAmount = totalAmount - dpAmount;
        }
      }

      const existingPayment = await this.prisma.payment.findFirst({
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
            amount: dpAmount,
            paid_at: null,
            payment_proof: null,
            payment_stage: 'down_payment',
          },
        });
      }

      const result = await this.prisma.customOrder.update({
        where: { id },
        data: {
          accept_status: true,
          total_amount: totalAmount,
          dp_amount: dpAmount,
          remaining_amount: remainingAmount,
        },
        include: {
          payments: true,
          projects: { include: { members: true } },
          items: {
            include: {
              selected_options: {
                include: {
                  variant_option: {
                    include: { custom_variant: true },
                  },
                },
              },
            },
          },
          user: { select: { id: true, name: true, email: true, phone: true } },
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
        include: {
          items: {
            include: {
              selected_options: {
                include: {
                  variant_option: {
                    include: { custom_variant: true },
                  },
                },
              },
            },
          },
        },
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

    const items = await this.prisma.customOrderItem.findMany({
      where: { custom_order_id: id },
      include: { selected_options: true },
    });

    for (const item of items) {
      await this.prisma.customOrderItemOption.deleteMany({
        where: { custom_order_item_id: item.id },
      });
      await this.prisma.customOrderItem.delete({
        where: { id: item.id },
      });
    }

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

    let totalDp = 0, totalRemaining = 0, totalAmountSum = 0;
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

  // ==================== GET TOTAL QUANTITY ====================
  async getTotalQuantityForProject(customOrderId: number): Promise<number> {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id: customOrderId },
      include: {
        items: true,
      },
    });

    if (!customOrder) return 0;

    return customOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}