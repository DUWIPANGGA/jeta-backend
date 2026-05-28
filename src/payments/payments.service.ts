import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus, CustomPaymentStage } from '@prisma/client';

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

      const stage = createDto.payment_stage ?? CustomPaymentStage.down_payment;
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          custom_order_id: createDto.custom_order_id,
          payment_stage: stage,
          payment_status: { in: [PaymentStatus.pending, PaymentStatus.waiting_verification] },
        },
      });
      if (existingPayment) {
        throw new BadRequestException(`An active payment with stage ${stage} already exists for custom order ID ${createDto.custom_order_id}`);
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
        payment_status: createDto.payment_status ?? PaymentStatus.pending,
        order_type: createDto.order_type ?? (createDto.custom_order_id ? 'custom_order' : 'order'),
        payment_stage: createDto.payment_stage ?? (createDto.custom_order_id ? CustomPaymentStage.down_payment : CustomPaymentStage.standard_full),
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
      orderBy: { created_at: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.payment.findMany({
      where: {
        payment_status: PaymentStatus.waiting_verification,
      },
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        custom_order: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        order: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        payment_method: true,
        transactions: true,
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async uploadProof(id: number, filePath: string, amount?: number, paymentMethodId?: number) {
    const payment = await this.findOne(id);

    if (payment.payment_status === PaymentStatus.completed) {
      throw new BadRequestException('Payment already completed');
    }

    const dataToUpdate: any = {
      payment_proof: filePath,
      payment_status: PaymentStatus.waiting_verification,
    };
    if (amount) dataToUpdate.amount = amount;
    if (paymentMethodId) dataToUpdate.payment_method_id = paymentMethodId;

    return this.prisma.payment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
      },
    });
  }

  async verifyPayment(id: number, status: 'completed' | 'failed', verifiedAmount?: number) {
    const payment = await this.findOne(id);

    if (payment.payment_status === PaymentStatus.completed) {
      throw new BadRequestException('Payment already verified as completed');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          payment_status: status === 'completed' ? PaymentStatus.completed : PaymentStatus.failed,
          paid_at: status === 'completed' ? new Date() : null,
          ...(verifiedAmount ? { amount: verifiedAmount } : {}),
        },
      });

      // Update Order/CustomOrder status if completed
      if (status === 'completed') {
        if (payment.order_id) {
          await prisma.order.update({
            where: { id: payment.order_id },
            data: { status: 'processing' },
          });

          // Inisialisasi pelacakan logistik (Tracking) untuk Standard Order
          const existingTracking = await prisma.tracking.findFirst({
            where: { order_id: payment.order_id }
          });
          if (!existingTracking) {
            const tracking = await prisma.tracking.create({
              data: {
                order_id: payment.order_id,
                current_stage: 'Pembayaran Diterima',
                progress_percentage: 10,
                estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              }
            });
            await prisma.trackingHistory.create({
              data: {
                tracking_id: tracking.id,
                status: 'Pembayaran terverifikasi oleh Admin. Pesanan sedang dipersiapkan.'
              }
            });
          }
        }

        if (payment.custom_order_id) {
          const finalAmount = verifiedAmount || payment.amount || 0;

          if (payment.payment_stage === CustomPaymentStage.down_payment) {
            const customOrder = await prisma.customOrder.findUnique({
              where: { id: payment.custom_order_id },
              include: { user: true }
            });
            const remaining = Math.max(0, (customOrder?.total_amount || 0) - finalAmount);

            await prisma.customOrder.update({
              where: { id: payment.custom_order_id },
              data: {
                dp_amount: finalAmount,
                remaining_amount: remaining,
                payment_status: remaining === 0,
              }
            });

            // Create final_payment automatically if remaining amount > 0
            if (remaining > 0) {
              const existingFinalPayment = await prisma.payment.findFirst({
                where: {
                  custom_order_id: payment.custom_order_id,
                  payment_stage: CustomPaymentStage.final_payment,
                  payment_status: { in: [PaymentStatus.pending, PaymentStatus.waiting_verification] },
                },
              });

              if (!existingFinalPayment) {
                await prisma.payment.create({
                  data: {
                    custom_order_id: payment.custom_order_id,
                    order_type: 'custom_order',
                    payment_status: PaymentStatus.pending,
                    payment_method_id: payment.payment_method_id,
                    amount: remaining,
                    payment_stage: CustomPaymentStage.final_payment,
                  },
                });
              }
            }

            // Create Project for Custom Order on DP verification success
            const existingProject = await prisma.project.findFirst({
              where: { custom_order_id: payment.custom_order_id },
            });
            if (!existingProject && customOrder) {
              await prisma.project.create({
                data: {
                  custom_order_id: payment.custom_order_id,
                  user_id: customOrder.user_id,
                  status: true,
                }
              });
            }
          } else if (payment.payment_stage === CustomPaymentStage.final_payment ||
            payment.payment_stage === CustomPaymentStage.standard_full) {
            const customOrder = await prisma.customOrder.findUnique({
              where: { id: payment.custom_order_id }
            });
            const remaining = Math.max(0, (customOrder?.remaining_amount || 0) - finalAmount);

            await prisma.customOrder.update({
              where: { id: payment.custom_order_id },
              data: {
                remaining_amount: remaining,
                payment_status: remaining === 0,
              },
            });

            // If remaining amount > 0, auto-create the next final_payment record as pending for the next installment
            if (remaining > 0) {
              const existingFinalPayment = await prisma.payment.findFirst({
                where: {
                  custom_order_id: payment.custom_order_id,
                  payment_stage: CustomPaymentStage.final_payment,
                  payment_status: { in: [PaymentStatus.pending, PaymentStatus.waiting_verification] },
                },
              });

              if (!existingFinalPayment) {
                await prisma.payment.create({
                  data: {
                    custom_order_id: payment.custom_order_id,
                    order_type: 'custom_order',
                    payment_status: PaymentStatus.pending,
                    payment_method_id: payment.payment_method_id,
                    amount: remaining,
                    payment_stage: CustomPaymentStage.final_payment,
                  },
                });
              }
            }
          }
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
        payment_stage: updateDto.payment_stage,
      },
      include: {
        custom_order: true,
        order: true,
        payment_method: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.payment.delete({ where: { id } });
    return { message: `Payment #${id} successfully deleted` };
  }
}