// custom-orders.service.ts
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

    const isAdmin = user.role_id === 1;

    // Non-admin tidak boleh mengirim field finansial (dp_amount, remaining_amount, total_amount)
    if (!isAdmin) {
      if (
        (createCustomOrderDto as any).dp_amount !== undefined ||
        (createCustomOrderDto as any).remaining_amount !== undefined ||
        (createCustomOrderDto as any).total_amount !== undefined
      ) {
        throw new ForbiddenException('You are not allowed to set financial fields');
      }
    }

    const deadline = createCustomOrderDto.deadline;
    if (!this.isDeadlineValid(deadline)) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    // Data dasar (umum)
    const data: Prisma.CustomOrderUncheckedCreateInput = {
      user_id: user.id,
      name: createCustomOrderDto.name,
      phone: createCustomOrderDto.phone,
      email: createCustomOrderDto.email,
      jenis_produk: createCustomOrderDto.jenis_produk,
      jumlah: String(createCustomOrderDto.jumlah),
      deadline,
      upload_referensi: createCustomOrderDto.upload_referensi,
      catatan_tambahan: createCustomOrderDto.catatan_tambahan ?? '',
      accept_status: false,
      payment_status: false,
      // Field finansial hanya diisi jika admin dan diberikan
      dp_amount: isAdmin ? (createCustomOrderDto as any).dp_amount ?? null : null,
      remaining_amount: isAdmin ? (createCustomOrderDto as any).remaining_amount ?? null : null,
      total_amount: isAdmin ? (createCustomOrderDto as any).total_amount ?? null : null,
    };

    // Otomatis hitung total_amount jika admin memberikan dp+remaining tapi tidak total
    if (isAdmin && !data.total_amount && data.dp_amount && data.remaining_amount) {
      const dpNum = parseInt(data.dp_amount, 10) || 0;
      const remNum = parseInt(data.remaining_amount, 10) || 0;
      data.total_amount = String(dpNum + remNum);
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
        throw new BadRequestException('Duplicate entry (unique constraint)');
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
    // Field yang hanya boleh diupdate admin
    const protectedFields = ['dp_amount', 'remaining_amount', 'total_amount', 'accept_status', 'payment_status'];

    if (!isAdmin) {
      for (const field of protectedFields) {
        if ((updateCustomOrderDto as any)[field] !== undefined) {
          throw new ForbiddenException(`You are not allowed to update ${field}`);
        }
      }
    }

    const updateData: Prisma.CustomOrderUncheckedUpdateInput = {};

    // Field umum (dari CreateCustomOrderDto)
    if (updateCustomOrderDto.name !== undefined) updateData.name = updateCustomOrderDto.name;
    if (updateCustomOrderDto.phone !== undefined) updateData.phone = updateCustomOrderDto.phone;
    if (updateCustomOrderDto.email !== undefined) updateData.email = updateCustomOrderDto.email;
    if (updateCustomOrderDto.jenis_produk !== undefined) updateData.jenis_produk = updateCustomOrderDto.jenis_produk;
    if (updateCustomOrderDto.jumlah !== undefined) updateData.jumlah = String(updateCustomOrderDto.jumlah);
    if (updateCustomOrderDto.upload_referensi !== undefined) updateData.upload_referensi = updateCustomOrderDto.upload_referensi;
    if (updateCustomOrderDto.catatan_tambahan !== undefined) updateData.catatan_tambahan = updateCustomOrderDto.catatan_tambahan;
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
      if (updateCustomOrderDto.accept_status !== undefined) updateData.accept_status = updateCustomOrderDto.accept_status;
      if (updateCustomOrderDto.payment_status !== undefined) updateData.payment_status = updateCustomOrderDto.payment_status;
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

    // Jika ACC = true, pastikan sudah ada Payment entry
    if (acceptStatus === true) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { custom_order_id: id },
      });

      if (!existingPayment) {
        // Cari payment method aktif pertama (boleh null)
        const defaultPaymentMethod = await this.prisma.paymentMethod.findFirst({
          where: { status_method: true },
        });

        // Buat Payment baru yang terhubung ke custom order ini
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

      // Update accept_status menjadi true
      return this.prisma.customOrder.update({
        where: { id },
        data: { accept_status: true },
        include: { payment: true, user: { select: { id: true, name: true, email: true } } },
      });
    } else {
      // Jika ACC = false, cukup update status saja
      return this.prisma.customOrder.update({
        where: { id },
        data: { accept_status: false },
      });
    }
  }

  async remove(id: number) {
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

    const all = await this.prisma.customOrder.findMany({
      select: { dp_amount: true, remaining_amount: true, total_amount: true },
    });

    let totalDp = 0,
      totalRemaining = 0,
      totalAmountSum = 0;
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