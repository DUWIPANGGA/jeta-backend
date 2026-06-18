import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CalculateSalaryDto } from './dto/calculate-salary.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { WeeklyTutupBukuQueryDto } from './dto/weekly-tutup-buku.dto';
import { SalaryPeriodType } from '@prisma/client';
import * as fs from 'fs';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPER: HITUNG PERIODE ====================
  private getPeriodDates(periodType: SalaryPeriodType, year?: number, month?: number): { start: Date; end: Date; label: string } {
    const now = new Date();
    const currentYear = year || now.getFullYear();
    const currentMonth = month !== undefined ? month - 1 : now.getMonth();

    let start: Date;
    let end: Date;
    let label: string;

    switch (periodType) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = `${start.toLocaleDateString('id-ID')}`;
        break;

      case 'weekly':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        label = `${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`;
        break;

      case 'monthly':
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        label = `${start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        break;

      default:
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        label = `${start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    }

    return { start, end, label };
  }

  // ==================== HELPER: HITUNG GAJI STAFF PER PERIODE ====================
  private async calculateStaffSalaryForPeriod(
    staffId: number,
    periodType: SalaryPeriodType,
    startDate: Date,
    endDate: Date,
  ) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: true,
        salaryProjects: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    // Ambil WorkLogs dalam periode (kecuali yang sudah dibayar)
    const workLogs = await this.prisma.workLog.findMany({
      where: {
        user_id: staff.user_id,
        salaryPaymentDetail: null,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        stage: true,
        custom_order: {
          include: {
            projects: { select: { id: true } },
          },
        },
        sport_order: {
          include: {
            projects: { select: { id: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    let totalQuantity = 0;
    let totalAmount = 0;
    const workLogDetails: any[] = [];

    for (const log of workLogs) {
      const workLogProjectId = log.custom_order?.projects?.[0]?.id ?? log.sport_order?.projects?.[0]?.id;
      const adjustment = staff.salaryProjects.find(
        (sp) => sp.project_id === workLogProjectId,
      );
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = (log.quantity || 0) * ratePerUnit;

      totalQuantity += log.quantity || 0;
      totalAmount += amount;

      workLogDetails.push({
        date: log.created_at,
        quantity: log.quantity,
        amount: amount,
        stage_name: log.stage?.stage_name,
        project_name: log.custom_order?.name,
        source: 'work_log',
      });
    }

    // Cek apakah sudah dibayar untuk periode ini
    const existingPayment = await this.prisma.salaryPayment.findFirst({
      where: {
        staff_id: staffId,
        period_type: periodType,
        period_start: { gte: startDate },
        period_end: { lte: endDate },
      },
    });

    return {
      staff_id: staff.id,
      name: staff.user.name,
      email: staff.user.email,
      base_salary: staff.salary,
      total_quantity: totalQuantity,
      total_salary: totalAmount,
      rate_per_unit: totalQuantity > 0 ? totalAmount / totalQuantity : 0,
      already_paid: !!existingPayment,
      work_logs: workLogDetails,
    };
  }

  // ==================== STAFF RANKING ====================
  async getStaffRanking() {
    const staffs = await this.prisma.staff.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const staffUserIds = staffs.map(s => s.user_id);
    const workLogs = await this.prisma.workLog.findMany({
      where: { user_id: { in: staffUserIds } },
      select: { user_id: true, quantity: true },
    });

    const workLogsByUser: Record<number, { quantity: number }[]> = {};
    for (const wl of workLogs) {
      if (!workLogsByUser[wl.user_id]) workLogsByUser[wl.user_id] = [];
      workLogsByUser[wl.user_id].push(wl);
    }

    const ranking = staffs.map((staff) => {
      let totalQuantity = 0;
      let totalAmount = 0;

      const staffWorkLogs = workLogsByUser[staff.user_id] || [];
      for (const wl of staffWorkLogs) {
        const quantity = wl.quantity ?? 0;
        totalQuantity += quantity;
        totalAmount += quantity * (staff.salary ?? 0);
      }

      return {
        id: staff.id,
        user_id: staff.user_id,
        name: staff.user.name,
        email: staff.user.email,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
      };
    });

    return ranking.sort((a, b) => b.total_amount - a.total_amount);
  }

  // ==================== DAFTAR PROYEK STAFF ====================
  async getStaffProjects(staffId: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true, salaryProjects: true },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    // Ambil semua WorkLogs staff (paid + unpaid)
    const workLogs = await this.prisma.workLog.findMany({
      where: { user_id: staff.user_id },
      include: {
        salaryPaymentDetail: true,
        custom_order: {
          include: {
            projects: { select: { id: true } },
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
        },
        sport_order: {
          include: {
            projects: { select: { id: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Group by project
    const projectMap = new Map<number, {
      totalQty: number;
      unpaidQty: number;
      customOrder: any;
    }>();

    for (const wl of workLogs) {
      const projectId = wl.custom_order?.projects?.[0]?.id ?? wl.sport_order?.projects?.[0]?.id;
      if (!projectId) continue;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { totalQty: 0, unpaidQty: 0, customOrder: wl.custom_order });
      }
      const entry = projectMap.get(projectId)!;
      entry.totalQty += wl.quantity ?? 0;
      if (!wl.salaryPaymentDetail) {
        entry.unpaidQty += wl.quantity ?? 0;
      }
    }

    const projects = Array.from(projectMap.entries()).map(([projectId, data]) => {
      const adjustment = staff.salaryProjects.find(sp => sp.project_id === projectId);
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = data.totalQty * ratePerUnit;
      const unpaidAmount = data.unpaidQty * ratePerUnit;
      const isPaid = data.totalQty > 0 && data.unpaidQty === 0;

      let deskripsiProduk = '-';
      const customOrder = data.customOrder;
      if (customOrder?.items && customOrder.items.length > 0) {
        deskripsiProduk = customOrder.items
          .flatMap((item: any) =>
            item.selected_options?.map((opt: any) =>
              `${opt.variant_option?.custom_variant?.name || ''} ${opt.variant_option?.name || ''}`.trim()
            ) || []
          )
          .filter((str: string) => str !== '')
          .join(', ');
      }
      if (deskripsiProduk === '') deskripsiProduk = 'Produk Custom';

      return {
        project_id: projectId,
        project_name: customOrder?.name || `Project ${projectId}`,
        jenis_produk: deskripsiProduk,
        quantity: data.totalQty,
        unpaid_quantity: data.unpaidQty,
        rate_per_unit: ratePerUnit,
        amount,
        unpaid_amount: unpaidAmount,
        is_paid: isPaid,
      };
    });

    return projects;
  }

  // ==================== PEMBAYARAN PER PROYEK ====================
  async createPayment(
    createDto: CreatePaymentDto,
    financeUserId: number,
    proofFile: Express.Multer.File,
  ) {
    const { staff_id, project_ids, notes } = createDto;

    const staff = await this.prisma.staff.findUnique({
      where: { id: staff_id },
      include: { user: true, salaryProjects: true },
    });
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staff_id} not found`);
    }

    const finance = await this.prisma.user.findUnique({
      where: { id: financeUserId },
      include: { role: true },
    });
    const hasFinanceAccess =
      finance?.role?.name === 'finance' ||
      finance?.role?.name === 'admin' ||
      finance?.role?.name === 'superadmin';
    if (!finance || !hasFinanceAccess) {
      throw new ForbiddenException('Only finance can make payments');
    }

    // Cari unpaid WorkLogs untuk project yang dipilih
    const unpaidWorkLogs = await this.prisma.workLog.findMany({
      where: {
        user_id: staff.user_id,
        salaryPaymentDetail: null,
        OR: [
          { custom_order: { projects: { some: { id: { in: project_ids } } } } },
          { sport_order: { projects: { some: { id: { in: project_ids } } } } },
        ],
      },
      include: {
        custom_order: { include: { projects: { select: { id: true } } } },
        sport_order: { include: { projects: { select: { id: true } } } },
      },
    });

    if (unpaidWorkLogs.length === 0) {
      throw new BadRequestException('Tidak ada WorkLog yang belum dibayar untuk proyek yang dipilih');
    }

    const projectDetails: { workLogId: number; amount: number }[] = [];
    let totalAmount = 0;

    for (const wl of unpaidWorkLogs) {
      const projectId = wl.custom_order?.projects?.[0]?.id ?? wl.sport_order?.projects?.[0]?.id;
      const adjustment = staff.salaryProjects.find(sp => sp.project_id === projectId);
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = (wl.quantity ?? 0) * ratePerUnit;
      projectDetails.push({ workLogId: wl.id, amount });
      totalAmount += amount;
    }

    let proofPath: string | null = null;
    if (proofFile) {
      proofPath = `/uploads/payments/${proofFile.filename}`;
      const uploadDir = './uploads/payments';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const salaryPayment = await tx.salaryPayment.create({
        data: {
          staff_id: staff.id,
          paid_by: financeUserId,
          total_amount: totalAmount,
          proof: proofPath,
          notes: notes || null,
        },
      });

      for (const detail of projectDetails) {
        await tx.salaryPaymentDetail.create({
          data: {
            salary_payment_id: salaryPayment.id,
            work_log_id: detail.workLogId,
            amount: detail.amount,
          },
        });
      }

      return salaryPayment;
    });

    return {
      message: 'Payment successful',
      payment_id: payment.id,
      total_amount: totalAmount,
      proof: proofPath,
    };
  }

  // ==================== PREVIEW GAJI PER PERIODE ====================
  async previewSalaryByPeriod(dto: CalculateSalaryDto) {
    const { period_type, year, month } = dto;

    const { start, end, label } = this.getPeriodDates(period_type, year, month);

    const staffs = await this.prisma.staff.findMany({
      include: {
        user: true,
      },
    });

    const staffSalaries: {
      staff_id: number;
      name: string;
      email: string;
      base_salary: number | null;
      total_quantity: number;
      total_salary: number;
      rate_per_unit: number;
      already_paid: boolean;
      work_logs: any[];
    }[] = [];

    let totalQuantity = 0;
    let totalSalary = 0;

    for (const staff of staffs) {
      const calculation = await this.calculateStaffSalaryForPeriod(
        staff.id,
        period_type,
        start,
        end,
      );

      staffSalaries.push(calculation);
      totalQuantity += calculation.total_quantity;
      totalSalary += calculation.total_salary;
    }

    const filteredStaffSalaries = staffSalaries.filter(s => s.total_quantity > 0);

    return {
      period: {
        type: period_type,
        start_date: start,
        end_date: end,
        label: label,
      },
      summary: {
        total_staff: filteredStaffSalaries.length,
        total_quantity: totalQuantity,
        total_salary: totalSalary,
      },
      staff_salaries: filteredStaffSalaries,
    };
  }

  // ==================== PROSES GAJI PER PERIODE ====================
  async processSalaryByPeriod(
    dto: ProcessSalaryDto,
    financeUserId: number,
    proofFile?: Express.Multer.File,
  ) {
    const { staff_ids, period_type, year, month, notes } = dto;

    const { start, end, label } = this.getPeriodDates(period_type, year, month);

    let proofPath: string | null = null;
    if (proofFile) {
      proofPath = `/uploads/salary/${proofFile.filename}`;
      const uploadDir = './uploads/salary';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }

    const finance = await this.prisma.user.findUnique({
      where: { id: financeUserId },
      include: { role: true },
    });
    const hasFinanceAccess =
      finance?.role?.name === 'finance' ||
      finance?.role?.name === 'admin' ||
      finance?.role?.name === 'superadmin';
    if (!finance || !hasFinanceAccess) {
      throw new ForbiddenException('Only finance can make payments');
    }

    const results: {
      staff_id: number;
      staff_name: string;
      status: string;
      message?: string;
      payment_id?: number;
      total_amount?: number;
      period_start?: Date;
      period_end?: Date;
    }[] = [];

    for (const staffId of staff_ids) {
      const calculation = await this.calculateStaffSalaryForPeriod(
        staffId,
        period_type,
        start,
        end,
      );

      if (calculation.already_paid) {
        results.push({
          staff_id: staffId,
          staff_name: calculation.name,
          status: 'skipped',
          message: 'Already paid for this period',
        });
        continue;
      }

      if (calculation.total_salary === 0) {
        results.push({
          staff_id: staffId,
          staff_name: calculation.name,
          status: 'skipped',
          message: 'No work log found for this period',
        });
        continue;
      }

      const payment = await this.prisma.$transaction(async (tx) => {
        const salaryPayment = await tx.salaryPayment.create({
          data: {
            staff_id: staffId,
            paid_by: financeUserId,
            total_amount: calculation.total_salary,
            period_type: period_type,
            period_start: start,
            period_end: end,
            proof: proofPath,
            notes: notes || `Gaji ${label}`,
          },
        });

        // Mark WorkLogs as paid
        const staffRec = await tx.staff.findUnique({
          where: { id: staffId },
          include: { salaryProjects: true },
        });
        if (staffRec) {
          const unpaidWorkLogs = await tx.workLog.findMany({
            where: {
              user_id: staffRec.user_id,
              salaryPaymentDetail: null,
              created_at: {
                gte: start,
                lte: end,
              },
            },
            include: {
              custom_order: {
                include: {
                  projects: { select: { id: true } },
                },
              },
              sport_order: {
                include: {
                  projects: { select: { id: true } },
                },
              },
            },
          });
          for (const wl of unpaidWorkLogs) {
            const wlProjectId = wl.custom_order?.projects?.[0]?.id ?? wl.sport_order?.projects?.[0]?.id;
            const wlAdjustment = staffRec.salaryProjects.find(
              (sp) => sp.project_id === wlProjectId,
            );
            const wlRate = (staffRec.salary ?? 0) + (wlAdjustment?.adjustment_salary ?? 0);
            const wlAmount = (wl.quantity ?? 0) * wlRate;

            await tx.salaryPaymentDetail.create({
              data: {
                salary_payment_id: salaryPayment.id,
                work_log_id: wl.id,
                amount: wlAmount,
              },
            });
          }
        }

        return salaryPayment;
      });

      results.push({
        staff_id: staffId,
        staff_name: calculation.name,
        status: 'success',
        payment_id: payment.id,
        total_amount: calculation.total_salary,
        period_start: start,
        period_end: end,
      });
    }

    return {
      message: 'Salary payment processed',
      results,
    };
  }

  // ==================== GET GAJI STAFF BY PERIODE ====================
  async getSalaryByPeriod(
    staffId: number,
    periodType: SalaryPeriodType,
    year?: number,
    month?: number,
  ) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    const { start, end, label } = this.getPeriodDates(periodType, year, month);

    const payments = await this.prisma.salaryPayment.findMany({
      where: {
        staff_id: staffId,
        period_start: { gte: start },
        period_end: { lte: end },
      },
      include: {
        details: true,
        finance: { select: { name: true } },
      },
      orderBy: { payment_date: 'desc' },
    });

    const calculation = await this.calculateStaffSalaryForPeriod(
      staffId,
      periodType,
      start,
      end,
    );

    return {
      staff: {
        id: staff.id,
        name: staff.user.name,
        base_salary: staff.salary,
      },
      period: {
        type: periodType,
        start: start,
        end: end,
        label: label,
      },
      summary: {
        total_quantity: calculation.total_quantity,
        total_salary: calculation.total_salary,
        paid_amount: payments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        unpaid_amount: calculation.total_salary - payments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
      },
      payments,
      work_logs: calculation.work_logs,
    };
  }

  // ==================== PELAPORAN TUTUP BUKU DINAMIS ====================
  async getTutupBukuReport(queryDto: WeeklyTutupBukuQueryDto) {
    const now = new Date();
    const period = queryDto.period_type || 'weekly';

    let startDate: Date;
    let endDate: Date;

    if (queryDto.start_date) {
      startDate = new Date(queryDto.start_date);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      if (period === 'daily') {
        startDate.setDate(now.getDate() - 14); // 15 days total
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 7 * 7); // 8 weeks total
        // Adjust to Monday
        const day = startDate.getDay();
        const diff = day === 0 ? 6 : day - 1;
        startDate.setDate(startDate.getDate() - diff);
      } else {
        startDate.setMonth(now.getMonth() - 5); // 6 months total
        startDate.setDate(1);
      }
      startDate.setHours(0, 0, 0, 0);
    }

    if (queryDto.end_date) {
      endDate = new Date(queryDto.end_date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      if (period === 'weekly') {
        // Adjust to Sunday
        const day = endDate.getDay();
        const diff = day === 0 ? 0 : 7 - day;
        endDate.setDate(endDate.getDate() + diff);
      } else if (period === 'monthly') {
        // Adjust to last day of month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch progress reports approved in the range
    const progressReports = await this.prisma.progressReport.findMany({
      where: {
        approval_status: true,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        salaryPaymentDetail: true,
        staff: {
          include: {
            salaryProjects: true,
          },
        },
      },
    });

    // Fetch payments made in the range
    const salaryPayments = await this.prisma.salaryPayment.findMany({
      where: {
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Generate slots
    const slots: { start: Date; end: Date; label: string }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      let label = '';

      if (period === 'daily') {
        slotStart.setHours(0, 0, 0, 0);
        slotEnd.setHours(23, 59, 59, 999);
        label = slotStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        current.setDate(current.getDate() + 1);
      } else if (period === 'weekly') {
        slotStart.setHours(0, 0, 0, 0);
        slotEnd.setDate(slotStart.getDate() + 6);
        slotEnd.setHours(23, 59, 59, 999);
        label = `${slotStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${slotEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        current.setDate(current.getDate() + 7);
      } else { // monthly
        slotStart.setDate(1);
        slotStart.setHours(0, 0, 0, 0);
        slotEnd.setMonth(slotStart.getMonth() + 1);
        slotEnd.setDate(0);
        slotEnd.setHours(23, 59, 59, 999);
        label = slotStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      }

      slots.push({ start: slotStart, end: slotEnd, label });
    }

    const reportData = slots.map(slot => {
      const sTime = slot.start.getTime();
      const eTime = slot.end.getTime();

      // Find reports approved in this slot
      const reportsInSlot = progressReports.filter(r => {
        const time = r.created_at.getTime();
        return time >= sTime && time <= eTime;
      });

      let totalObligation = 0;
      let totalPaidForWork = 0;
      const staffEarnedIds = new Set<number>();

      for (const report of reportsInSlot) {
        staffEarnedIds.add(report.staff_id);

        const adjustment = report.staff.salaryProjects.find(sp => sp.project_id === report.project_id);
        const ratePerUnit = (report.staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
        const earned = (report.quantity ?? 0) * ratePerUnit;
        totalObligation += earned;

        if (report.salaryPaymentDetail) {
          totalPaidForWork += report.salaryPaymentDetail.amount ?? 0;
        }
      }

      // Find payments made in this slot
      const paymentsInSlot = salaryPayments.filter(p => {
        const time = p.payment_date.getTime();
        return time >= sTime && time <= eTime;
      });
      const totalRealized = paymentsInSlot.reduce((sum, p) => sum + (p.total_amount ?? 0), 0);
      const staffPaidIds = new Set(paymentsInSlot.map(p => p.staff_id));

      let status = 'Lunas';
      if (totalObligation === 0) {
        status = 'Tidak Ada Kewajiban';
      } else if (totalPaidForWork === 0) {
        status = 'Belum Dibayar';
      } else if (totalPaidForWork < totalObligation) {
        status = 'Sebagian Dibayar';
      }

      return {
        periode: slot.label,
        start_date: slot.start,
        end_date: slot.end,
        total_kewajiban: totalObligation,
        total_realisasi: totalRealized,
        total_terbayar_untuk_kerja: totalPaidForWork,
        status_pembayaran: status,
        jumlah_staf_bekerja: staffEarnedIds.size,
        jumlah_staf_terbayar: staffPaidIds.size,
        selisih_cashflow: totalObligation - totalRealized,
        sisa_kewajiban_belum_terbayar: Math.max(0, totalObligation - totalPaidForWork),
      };
    });

    return reportData.reverse();
  }
}