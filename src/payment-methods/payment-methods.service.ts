import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        bank_code: createPaymentMethodDto.bank_code,
        bank_name: createPaymentMethodDto.bank_name,
        bank_account: createPaymentMethodDto.bank_account,
        owner_name: createPaymentMethodDto.owner_name,
        type: createPaymentMethodDto.type,
        status_method: createPaymentMethodDto.status_method ?? true,
        expired_duration_minutes: createPaymentMethodDto.expired_duration_minutes ?? 60,
      },
    });
  }

  async findAll() {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Payment methods retrieved successfully',
      data: paymentMethods,
      total: paymentMethods.length,
    };
  }

  async findOne(id: number) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Payment method retrieved successfully',
      data: paymentMethod,
    };
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    await this.findOne(id);

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
    });

    return {
      success: true,
      message: 'Payment method updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.paymentMethod.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Payment method with ID ${id} deleted successfully`,
    };
  }
}