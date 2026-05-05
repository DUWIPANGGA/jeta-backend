import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalaryLogsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: any) {
    // Validasi user exists
    if (dto.user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.user_id },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${dto.user_id} not found`);
      }
    }

    // Hitung total_salary jika tidak dikirim
    let totalSalary = dto.total_salary;
    if (!totalSalary && (dto.amount || dto.bonus || dto.deduction)) {
      const amount = dto.amount || 0;
      const bonus = dto.bonus || 0;
      const deduction = dto.deduction || 0;
      totalSalary = amount + bonus - deduction;
    }

    const salaryLog = await this.prisma.salaryLog.create({
      data: {
        user: {  // ← Gunakan relasi connect, bukan user_id langsung
          connect: { id: dto.user_id }
        },
        amount: dto.amount,
        bonus: dto.bonus || 0,
        deduction: dto.deduction || 0,
        total_salary: totalSalary,
        period_start: dto.period_start,
        period_end: dto.period_end,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      success: true,
      message: 'Salary log created successfully',
      data: salaryLog,
    };
  }

  async findAll() {
    const salaryLogs = await this.prisma.salaryLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { period_start: 'desc' },
    });

    return {
      success: true,
      message: 'Salary logs retrieved successfully',
      data: salaryLogs,
      total: salaryLogs.length,
    };
  }

  async findOne(id: number) {
    const salaryLog = await this.prisma.salaryLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!salaryLog) {
      throw new NotFoundException(`Salary log with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Salary log retrieved successfully',
      data: salaryLog,
    };
  }

  async findByUser(userId: number) {
    const salaryLogs = await this.prisma.salaryLog.findMany({
      where: {
        user: {
          id: userId
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { period_start: 'desc' },
    });

    return {
      success: true,
      message: 'Salary logs for user retrieved successfully',
      data: salaryLogs,
      total: salaryLogs.length,
    };
  }

  async update(id: number, dto: any) {
    await this.findOne(id);

    // Hitung ulang total_salary jika ada perubahan
    let totalSalary = dto.total_salary;
    if (dto.amount !== undefined || dto.bonus !== undefined || dto.deduction !== undefined) {
      const existing = await this.prisma.salaryLog.findUnique({
        where: { id },
      });
      const amount = dto.amount !== undefined ? dto.amount : existing?.amount || 0;
      const bonus = dto.bonus !== undefined ? dto.bonus : existing?.bonus || 0;
      const deduction = dto.deduction !== undefined ? dto.deduction : existing?.deduction || 0;
      totalSalary = amount + bonus - deduction;
    }

    const updateData: any = {};
    if (dto.user_id !== undefined) {
      updateData.user = { connect: { id: dto.user_id } };
    }
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.bonus !== undefined) updateData.bonus = dto.bonus;
    if (dto.deduction !== undefined) updateData.deduction = dto.deduction;
    if (totalSalary !== undefined) updateData.total_salary = totalSalary;
    if (dto.period_start !== undefined) updateData.period_start = dto.period_start;
    if (dto.period_end !== undefined) updateData.period_end = dto.period_end;

    const updated = await this.prisma.salaryLog.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      success: true,
      message: 'Salary log updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.salaryLog.delete({ where: { id } });
    return {
      success: true,
      message: `Salary log with ID ${id} deleted successfully`,
    };
  }
}