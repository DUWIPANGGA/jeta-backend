import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as fs from 'fs';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== STAFF RANKING ====================
  async getStaffRanking() {
    const staffs = await this.prisma.staff.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        progressReports: {
          where: { approval_status: true },
          select: { quantity: true, project_id: true },
        },
        salaryProjects: true,
      },
    });

    const ranking = staffs.map((staff) => {
      let totalQuantity = 0;
      let totalAmount = 0;

      for (const report of staff.progressReports) {
        const quantity = report.quantity ?? 0;
        totalQuantity += quantity;
        const adjustment = staff.salaryProjects.find(
          (sp) => sp.project_id === report.project_id,
        );
        const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
        totalAmount += quantity * ratePerUnit;
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
      include: {
        user: true,
        salaryProjects: true,
        progressReports: {
          where: { approval_status: true },
          include: {
            salaryPaymentDetail: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    const projectMembers = await this.prisma.projectMember.findMany({
      where: { user_id: staff.user_id },
      include: {
        project: {
          include: {
            custom_order: {
              include: {
                items: {
                  include: {
                    selected_options: {
                      include: {
                        variant_option: {
                          include: {
                            custom_variant: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const unpaidQuantityMap = new Map<number, number>();
    const totalQuantityMap = new Map<number, number>();

    for (const report of staff.progressReports) {
      const pId = report.project_id;
      const qty = report.quantity ?? 0;

      // Total quantity
      const currentTotal = totalQuantityMap.get(pId) ?? 0;
      totalQuantityMap.set(pId, currentTotal + qty);

      // Unpaid quantity
      if (!report.salaryPaymentDetail) {
        const currentUnpaid = unpaidQuantityMap.get(pId) ?? 0;
        unpaidQuantityMap.set(pId, currentUnpaid + qty);
      }
    }

    const projects = projectMembers.map((pm) => {
      const adjustment = staff.salaryProjects.find(
        (sp) => sp.project_id === pm.project_id,
      );
      const totalQuantity = totalQuantityMap.get(pm.project_id) ?? 0;
      const unpaidQuantity = unpaidQuantityMap.get(pm.project_id) ?? 0;
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = totalQuantity * ratePerUnit;
      const unpaidAmount = unpaidQuantity * ratePerUnit;
      const isPaid = totalQuantity > 0 && unpaidQuantity === 0;

      let deskripsiProduk = '-';
      const customOrder = pm.project?.custom_order;
      if (customOrder?.items && customOrder.items.length > 0) {
        deskripsiProduk = customOrder.items
          .flatMap(item => 
            item.selected_options?.map(opt => 
              `${opt.variant_option?.custom_variant?.name || ''} ${opt.variant_option?.name || ''}`.trim()
            ) || []
          )
          .filter(str => str !== '')
          .join(', ');
      }
      if (deskripsiProduk === '') deskripsiProduk = 'Produk Custom';

      return {
        project_id: pm.project_id,
        project_name: customOrder?.name || `Project ${pm.project_id}`,
        jenis_produk: deskripsiProduk,
        quantity: totalQuantity,
        unpaid_quantity: unpaidQuantity,
        rate_per_unit: ratePerUnit,
        amount,
        unpaid_amount: unpaidAmount,
        is_paid: isPaid,
      };
    });

    return projects;
  }

  // ==================== PEMBAYARAN ====================
  async createPayment(
    createDto: CreatePaymentDto,
    financeUserId: number,
    proofFile: Express.Multer.File,
  ) {
    const { staff_id, project_ids, notes } = createDto;

    const staff = await this.prisma.staff.findUnique({
      where: { id: staff_id },
      include: {
        user: true,
        salaryProjects: true,
        progressReports: {
          where: { approval_status: true },
          include: {
            salaryPaymentDetail: true,
          },
        },
      },
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

    const projectDetails: { progressReportId: number; amount: number }[] = [];
    let totalAmount = 0;

    for (const projectId of project_ids) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: { project_id: projectId, user_id: staff.user_id },
      });
      if (!isMember) {
        throw new BadRequestException(`Staff tidak mengerjakan project ID ${projectId}`);
      }

      const unpaidReports = staff.progressReports.filter(
        (r) => r.project_id === projectId && !r.salaryPaymentDetail,
      );
      if (unpaidReports.length === 0) {
        throw new BadRequestException(`Tidak ada progress report yang belum dibayar untuk project ID ${projectId}`);
      }

      const totalQuantity = unpaidReports.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
      if (totalQuantity === 0) {
        throw new BadRequestException(`Tidak ada progress report dengan kuantitas lebih dari 0 untuk project ID ${projectId}`);
      }

      const adjustment = staff.salaryProjects.find(
        (sp) => sp.project_id === projectId,
      );
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);

      for (const report of unpaidReports) {
        const reportAmount = (report.quantity ?? 0) * ratePerUnit;
        projectDetails.push({
          progressReportId: report.id,
          amount: reportAmount,
        });
        totalAmount += reportAmount;
      }
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
            progress_report_id: detail.progressReportId,
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
}