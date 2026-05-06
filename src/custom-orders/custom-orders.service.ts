// src/custom-orders/custom-orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';

@Injectable()
export class CustomOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCustomOrderDto: CreateCustomOrderDto, user: any) {
    // Check if user exists
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Check if payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id: createCustomOrderDto.payment_id }
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${createCustomOrderDto.payment_id} not found`);
    }

    // Validate dp_amount and remaining_amount
    if (createCustomOrderDto.dp_amount < 0 || createCustomOrderDto.remaining_amount < 0) {
      throw new BadRequestException('DP amount and remaining amount must be non-negative');
    }

    // Validate deadline
    const deadline = new Date(createCustomOrderDto.deadline);
    if (deadline < new Date()) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    const customOrder = await this.prisma.customOrder.create({
      data: {
        user_id: user.id,
        name: createCustomOrderDto.name,
        phone: createCustomOrderDto.phone,
        email: createCustomOrderDto.email,
        jenis_produk: createCustomOrderDto.jenis_produk,
        jumlah: createCustomOrderDto.jumlah,
        deadline: deadline, // Input manual dari user
        upload_referensi: createCustomOrderDto.upload_referensi,
        catatan_tambahan: createCustomOrderDto.catatan_tambahan,
        dp_amount: createCustomOrderDto.dp_amount,
        remaining_amount: createCustomOrderDto.remaining_amount,
        payment_id: createCustomOrderDto.payment_id,
        accept_status: createCustomOrderDto.accept_status ?? false
      }
    });

    return customOrder;
  }

  async findAll() {
    const customOrders = await this.prisma.customOrder.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    return customOrders;
  }

  async findOne(id: number) {
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id }
    });

    if (!customOrder) {
      throw new NotFoundException(`Custom order with ID ${id} not found`);
    }

    return customOrder;
  }

  async findByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const customOrders = await this.prisma.customOrder.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return customOrders;
  }

  async update(id: number, updateCustomOrderDto: UpdateCustomOrderDto) {
    await this.findOne(id);

    // Prepare update data
    const updateData: any = {};

    if (updateCustomOrderDto.name !== undefined) updateData.name = updateCustomOrderDto.name;
    if (updateCustomOrderDto.phone !== undefined) updateData.phone = updateCustomOrderDto.phone;
    if (updateCustomOrderDto.email !== undefined) updateData.email = updateCustomOrderDto.email;
    if (updateCustomOrderDto.jenis_produk !== undefined) updateData.jenis_produk = updateCustomOrderDto.jenis_produk;
    if (updateCustomOrderDto.jumlah !== undefined) updateData.jumlah = updateCustomOrderDto.jumlah;
    if (updateCustomOrderDto.deadline !== undefined) {
      const deadline = new Date(updateCustomOrderDto.deadline);
      if (deadline < new Date()) {
        throw new BadRequestException('Deadline cannot be in the past');
      }
      updateData.deadline = deadline;
    }
    if (updateCustomOrderDto.upload_referensi !== undefined) updateData.upload_referensi = updateCustomOrderDto.upload_referensi;
    if (updateCustomOrderDto.catatan_tambahan !== undefined) updateData.catatan_tambahan = updateCustomOrderDto.catatan_tambahan;
    if (updateCustomOrderDto.dp_amount !== undefined) updateData.dp_amount = updateCustomOrderDto.dp_amount;
    if (updateCustomOrderDto.remaining_amount !== undefined) updateData.remaining_amount = updateCustomOrderDto.remaining_amount;
    if (updateCustomOrderDto.payment_id !== undefined) updateData.payment_id = updateCustomOrderDto.payment_id;
    if (updateCustomOrderDto.accept_status !== undefined) updateData.accept_status = updateCustomOrderDto.accept_status;

    const updatedCustomOrder = await this.prisma.customOrder.update({
      where: { id },
      data: updateData
    });

    return updatedCustomOrder;
  }

  async updateAcceptStatus(id: number, acceptStatus: boolean) {
    await this.findOne(id);

    const updatedCustomOrder = await this.prisma.customOrder.update({
      where: { id },
      data: { accept_status: acceptStatus }
    });

    return updatedCustomOrder;
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.customOrder.delete({
      where: { id }
    });
  }

  async getStatistics() {
    const totalOrders = await this.prisma.customOrder.count();

    const acceptedOrders = await this.prisma.customOrder.count({
      where: { accept_status: true }
    });

    const pendingOrders = await this.prisma.customOrder.count({
      where: { accept_status: false }
    });

    const totalDpAmount = await this.prisma.customOrder.aggregate({
      _sum: {
        dp_amount: true
      }
    });

    const totalRemainingAmount = await this.prisma.customOrder.aggregate({
      _sum: {
        remaining_amount: true
      }
    });

    return {
      total_orders: totalOrders,
      accepted_orders: acceptedOrders,
      pending_orders: pendingOrders,
      total_dp_amount: totalDpAmount._sum.dp_amount || 0,
      total_remaining_amount: totalRemainingAmount._sum.remaining_amount || 0
    };
  }
}