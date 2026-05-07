import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  private isDeadlineValid(deadline: Date): boolean {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setUTCHours(0, 0, 0, 0);
    return deadlineDate >= today;
  }

  async create(createCustomOrderDto: CreateCustomOrderDto, user: any) {
    if (!user) throw new NotFoundException('User not found');

    const dpAmount = createCustomOrderDto.dp_amount ?? null;
    const remainingAmount = createCustomOrderDto.remaining_amount ?? null;
    let totalAmount = createCustomOrderDto.total_amount;

    // Otomatis hitung total jika tidak diberikan dan dp+remaining ada
    if (!totalAmount && dpAmount !== null && remainingAmount !== null) {
      const dpNum = parseInt(dpAmount, 10) || 0;
      const remNum = parseInt(remainingAmount, 10) || 0;
      totalAmount = String(dpNum + remNum);
    }

    const deadline = createCustomOrderDto.deadline;
    if (!this.isDeadlineValid(deadline)) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    const data: Prisma.CustomOrderUncheckedCreateInput = {
      user_id: user.id,
      name: createCustomOrderDto.name,
      phone: createCustomOrderDto.phone,
      email: createCustomOrderDto.email,
      jenis_produk: createCustomOrderDto.jenis_produk,
      jumlah: createCustomOrderDto.jumlah,
      deadline,
      upload_referensi: createCustomOrderDto.upload_referensi,
      catatan_tambahan: createCustomOrderDto.catatan_tambahan ?? '',
      dp_amount: dpAmount,
      remaining_amount: remainingAmount,
      total_amount: totalAmount ?? null,
      accept_status: createCustomOrderDto.accept_status ?? false,
    };

    if (createCustomOrderDto.payment_id) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: createCustomOrderDto.payment_id },
      });
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${createCustomOrderDto.payment_id} not found`);
      }
      const existing = await this.prisma.customOrder.findFirst({
        where: { payment_id: createCustomOrderDto.payment_id },
      });
      if (existing) {
        throw new BadRequestException('Payment already used for another custom order');
      }
      data.payment_id = createCustomOrderDto.payment_id;
    }

    try {
      const customOrder = await this.prisma.customOrder.create({
        data,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          payment: true,
        },
      });
      return customOrder;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Payment already used for another custom order (unique constraint)');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.customOrder.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
      },
    });
  }

  async findOne(id: number) {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
      },
    });
    if (!customOrder) {
      throw new NotFoundException(`Custom order with ID ${id} not found`);
    }
    return customOrder;
  }

  async findByUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return this.prisma.customOrder.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: { payment: true },
    });
  }

  async update(id: number, updateCustomOrderDto: UpdateCustomOrderDto, currentUser: any) {
    await this.findOne(id);
    const isAdmin = currentUser.role_id === 1;
    const protectedFields = ['dp_amount', 'remaining_amount', 'total_amount', 'payment_id'];

    if (!isAdmin) {
      for (const field of protectedFields) {
        if ((updateCustomOrderDto as any)[field] !== undefined) {
          throw new ForbiddenException(`You are not allowed to update ${field}`);
        }
      }
    }

    const updateData: Prisma.CustomOrderUncheckedUpdateInput = {};

    // Field umum
    if (updateCustomOrderDto.name !== undefined) updateData.name = updateCustomOrderDto.name;
    if (updateCustomOrderDto.phone !== undefined) updateData.phone = updateCustomOrderDto.phone;
    if (updateCustomOrderDto.email !== undefined) updateData.email = updateCustomOrderDto.email;
    if (updateCustomOrderDto.jenis_produk !== undefined) updateData.jenis_produk = updateCustomOrderDto.jenis_produk;
    if (updateCustomOrderDto.jumlah !== undefined) updateData.jumlah = updateCustomOrderDto.jumlah;
    if (updateCustomOrderDto.upload_referensi !== undefined) updateData.upload_referensi = updateCustomOrderDto.upload_referensi;
    if (updateCustomOrderDto.catatan_tambahan !== undefined) updateData.catatan_tambahan = updateCustomOrderDto.catatan_tambahan;
    if (updateCustomOrderDto.accept_status !== undefined) updateData.accept_status = updateCustomOrderDto.accept_status;

    if (updateCustomOrderDto.deadline !== undefined) {
      const deadline = new Date(updateCustomOrderDto.deadline);
      if (!this.isDeadlineValid(deadline)) {
        throw new BadRequestException('Deadline cannot be in the past');
      }
      updateData.deadline = deadline;
    }

    // Field protected (hanya admin)
    if (isAdmin) {
      if (updateCustomOrderDto.dp_amount !== undefined) updateData.dp_amount = updateCustomOrderDto.dp_amount;
      if (updateCustomOrderDto.remaining_amount !== undefined) updateData.remaining_amount = updateCustomOrderDto.remaining_amount;
      if (updateCustomOrderDto.total_amount !== undefined) updateData.total_amount = updateCustomOrderDto.total_amount;

      if (updateCustomOrderDto.payment_id !== undefined) {
        const newPaymentId = updateCustomOrderDto.payment_id;
        if (newPaymentId === null) {
          updateData.payment_id = null;
        } else if (typeof newPaymentId === 'number') {
          const payment = await this.prisma.payment.findUnique({
            where: { id: newPaymentId },
          });
          // if (!payment) {
          //   throw new NotFoundException(`Payment with ID ${newPaymentId} not found`);
          // }
          const conflict = await this.prisma.customOrder.findFirst({
            where: { payment_id: newPaymentId, NOT: { id } },
          });
          if (conflict) {
            throw new BadRequestException('Payment already used for another custom order');
          }
          updateData.payment_id = newPaymentId;
        }
      }
    }

    return this.prisma.customOrder.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
      },
    });
  }

  async updateAcceptStatus(id: number, acceptStatus: boolean) {
    const customOrder = await this.findOne(id);

    // Jika ACC (acceptStatus = true) dan custom order belum punya payment
    if (acceptStatus === true && !customOrder.payment_id) {
      // Cari payment method aktif pertama (boleh null)
      const defaultPaymentMethod = await this.prisma.paymentMethod.findFirst({
        where: { status_method: true },
      });

      // Buat payment baru dengan data minimal
      const newPayment = await this.prisma.payment.create({
        data: {
          order_type: 'custom_order',
          payment_status: 'pending',
          payment_method_id: defaultPaymentMethod?.id ?? null,
          amount: null,
          paid_at: null,
          payment_proof: null,
          // order_id tetap null (karena ini custom order)
        },
      });

      // Update custom order: set accept_status = true dan payment_id = newPayment.id
      return this.prisma.customOrder.update({
        where: { id },
        data: {
          accept_status: true,
          payment_id: newPayment.id,
        },
        include: {
          payment: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });
    } else {
      // Jika ACC = false atau sudah punya payment, hanya update status
      return this.prisma.customOrder.update({
        where: { id },
        data: { accept_status: acceptStatus },
        include: { payment: true },
      });
    }
  }

  async remove(id: number): Promise<{ id: number; created_at: Date; updated_at: Date; name: string; user_id: number; phone: string; email: string; jenis_produk: string; jumlah: number; deadline: Date; upload_referensi: string; catatan_tambahan: string; dp_amount: string | null; remaining_amount: string | null; payment_id: number | null; total_amount: string | null; accept_status: boolean; }> {
    await this.findOne(id);
    return this.prisma.customOrder.delete({ where: { id } });
  }

  async getStatistics() {
    const totalOrders = await this.prisma.customOrder.count();
    const acceptedOrders = await this.prisma.customOrder.count({
      where: { accept_status: true },
    });
    const pendingOrders = await this.prisma.customOrder.count({
      where: { accept_status: false },
    });

    // Ambil semua data untuk dijumlah (karena field string)
    const all = await this.prisma.customOrder.findMany({
      select: { dp_amount: true, remaining_amount: true, total_amount: true },
    });

    let totalDp = 0, totalRemaining = 0, totalAmountSum = 0;
    for (const order of all) {
      totalDp += parseInt(order.dp_amount ?? '0', 10);
      totalRemaining += parseInt(order.remaining_amount ?? '0', 10);
      totalAmountSum += parseInt(order.total_amount ?? '0', 10);
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