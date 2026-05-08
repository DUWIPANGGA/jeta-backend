import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreatePaymentDto) {
    if (!createDto.custom_order_id && !createDto.order_id) {
      throw new BadRequestException('Either custom_order_id or order_id must be provided');
    }

    if (createDto.custom_order_id) {
      const customOrder = await this.prisma.customOrder.findUnique({
        where: { id: createDto.custom_order_id },
      });
      if (!customOrder) {
        throw new NotFoundException(`CustomOrder with ID ${createDto.custom_order_id} not found`);
      }
      const existingPayment = await this.prisma.payment.findUnique({
        where: { custom_order_id: createDto.custom_order_id },
      });
      if (existingPayment) {
        throw new BadRequestException(`Payment already exists for custom order ID ${createDto.custom_order_id}`);
      }
    }

    if (createDto.order_id) {
      const order = await this.prisma.order.findUnique({
        where: { id: createDto.order_id },
      });
      if (!order) {
        throw new NotFoundException(`Order with ID ${createDto.order_id} not found`);
      }
      const existingPayment = await this.prisma.payment.findUnique({
        where: { order_id: createDto.order_id },
      });
      if (existingPayment) {
        throw new BadRequestException(`Payment already exists for order ID ${createDto.order_id}`);
      }
    }

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
        order_id: createDto.order_id,
        payment_method_id: createDto.payment_method_id,
        amount: createDto.amount,
        paid_at: createDto.paid_at ? new Date(createDto.paid_at) : null,
        payment_proof: createDto.payment_proof,
        payment_status: createDto.payment_status ?? 'pending',
        order_type: createDto.order_type ?? (createDto.custom_order_id ? 'custom_order' : 'order'),
      },
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
        transactions: true,
      },
    });
  }

  async findPending() {
    return this.prisma.payment.findMany({
      where: {
        payment_status: 'waiting_verification',
      },
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
        transactions: true,
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async uploadProof(id: number, filePath: string) {
    const payment = await this.findOne(id);
    
    if (payment.payment_status === 'completed') {
      throw new BadRequestException('Payment already completed');
    }

    return this.prisma.payment.update({
      where: { id },
      data: {
        payment_proof: filePath,
        payment_status: 'waiting_verification',
      },
    });
  }

  async verifyPayment(id: number, status: 'completed' | 'failed') {
    const payment = await this.findOne(id);

    if (payment.payment_status === 'completed') {
      throw new BadRequestException('Payment already verified as completed');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          payment_status: status as PaymentStatus,
          paid_at: status === 'completed' ? new Date() : null,
        },
      });

      // Update Order/CustomOrder status if completed
      if (status === 'completed') {
        if (payment.order_id) {
          await prisma.order.update({
            where: { id: payment.order_id },
            data: { status: 'processing' },
          });

          // Create Project for Standard Order
          await prisma.project.create({
            data: {
              order_id: payment.order_id,
              user_id: payment.order?.user_id || 1, // Fallback to 1 if not found
              status: true,
            }
          });
        }
        if (payment.custom_order_id) {
          await prisma.customOrder.update({
            where: { id: payment.custom_order_id },
            data: { payment_status: true },
          });

          // Create Project for Custom Order
          await prisma.project.create({
            data: {
              custom_order_id: payment.custom_order_id,
              user_id: payment.custom_order?.user_id || 1, // Fallback to 1 if not found
              status: true,
            }
          });
        }
      }

      return updatedPayment;
    });
  }

  async update(id: number, updateDto: UpdatePaymentDto) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        custom_order_id: updateDto.custom_order_id,
        order_id: updateDto.order_id,
        payment_method_id: updateDto.payment_method_id,
        amount: updateDto.amount,
        paid_at: updateDto.paid_at ? new Date(updateDto.paid_at) : undefined,
        payment_proof: updateDto.payment_proof,
        payment_status: updateDto.payment_status,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment #${id} successfully deleted` };
  }
}