import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreatePaymentDto) {
    // Cek apakah custom_order dengan id tersebut ada
    const customOrder = await this.prisma.customOrder.findUnique({
      where: { id: createDto.custom_order_id },
    });
    if (!customOrder) {
      throw new NotFoundException(`CustomOrder with ID ${createDto.custom_order_id} not found`);
    }

    // Cek apakah sudah ada payment untuk custom_order ini (karena one-to-one)
    const existingPayment = await this.prisma.payment.findUnique({
      where: { custom_order_id: createDto.custom_order_id },
    });
    if (existingPayment) {
      throw new BadRequestException(`Payment already exists for custom order ID ${createDto.custom_order_id}`);
    }

    // Jika payment_method_id diberikan, cek apakah method ada
    if (createDto.payment_method_id) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: createDto.payment_method_id },
      });
      if (!paymentMethod) {
        throw new NotFoundException(`PaymentMethod with ID ${createDto.payment_method_id} not found`);
      }
    }

    return this.prisma.payment.create({
      data: {
        custom_order_id: createDto.custom_order_id,
        payment_method_id: createDto.payment_method_id,
        amount: createDto.amount,
        paid_at: createDto.paid_at ? new Date(createDto.paid_at) : null,
        payment_proof: createDto.payment_proof,
        payment_status: createDto.payment_status ?? 'pending',
        order_type: 'custom_order',
      },
      include: {
        custom_order: true,
        payment_method: true,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        custom_order: true,
        payment_method: true,
        transactions: true,
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        custom_order: true,
        payment_method: true,
        transactions: true,
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async update(id: number, updateDto: UpdatePaymentDto) {
    await this.findOne(id); // pastikan ada

    // Jika ingin mengubah custom_order_id, cek duplikasi
    if (updateDto.custom_order_id) {
      const existing = await this.prisma.payment.findUnique({
        where: { custom_order_id: updateDto.custom_order_id },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Payment already exists for custom order ID ${updateDto.custom_order_id}`);
      }
    }

    // Jika payment_method_id diberikan, cek keberadaan
    if (updateDto.payment_method_id) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: updateDto.payment_method_id },
      });
      if (!paymentMethod) {
        throw new NotFoundException(`PaymentMethod with ID ${updateDto.payment_method_id} not found`);
      }
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        custom_order_id: updateDto.custom_order_id,
        payment_method_id: updateDto.payment_method_id,
        amount: updateDto.amount,
        paid_at: updateDto.paid_at ? new Date(updateDto.paid_at) : undefined,
        payment_proof: updateDto.payment_proof,
        payment_status: updateDto.payment_status,
      },
      include: {
        custom_order: true,
        payment_method: true,
        transactions: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment #${id} successfully deleted` };
  }
}