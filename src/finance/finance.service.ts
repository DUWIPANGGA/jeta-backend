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
          select: { project_id: true, quantity: true },
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

    const paidProjectDetails = await this.prisma.salaryPaymentDetail.findMany({
      where: {
        project_id: { in: projectMembers.map((pm) => pm.project_id) },
      },
      select: { project_id: true },
    });
    const paidProjectIds = new Set(paidProjectDetails.map((p) => p.project_id));

    const quantityMap = new Map<number, number>();
    for (const report of staff.progressReports) {
      const current = quantityMap.get(report.project_id) ?? 0;
      quantityMap.set(report.project_id, current + (report.quantity ?? 0));
    }

    const projects = projectMembers.map((pm) => {
      const adjustment = staff.salaryProjects.find(
        (sp) => sp.project_id === pm.project_id,
      );
      const quantity = quantityMap.get(pm.project_id) ?? 0;
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = quantity * ratePerUnit;
      const isPaid = paidProjectIds.has(pm.project_id);

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
        quantity,
        rate_per_unit: ratePerUnit,
        amount,
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
          select: { project_id: true, quantity: true },
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

    const projectDetails: { projectId: number; amount: number; quantity: number; rate: number }[] = [];
    let totalAmount = 0;

    for (const projectId of project_ids) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: { project_id: projectId, user_id: staff.user_id },
      });
      if (!isMember) {
        throw new BadRequestException(`Staff tidak mengerjakan project ID ${projectId}`);
      }

      const existingPayment = await this.prisma.salaryPaymentDetail.findFirst({
        where: { project_id: projectId },
      });
      if (existingPayment) {
        throw new BadRequestException(`Project ID ${projectId} sudah pernah dibayar`);
      }

      const totalQuantity = staff.progressReports
        .filter((r) => r.project_id === projectId)
        .reduce((sum, r) => sum + (r.quantity ?? 0), 0);

      if (totalQuantity === 0) {
        throw new BadRequestException(`Tidak ada progress report untuk project ID ${projectId}`);
      }

      const adjustment = staff.salaryProjects.find(
        (sp) => sp.project_id === projectId,
      );
      const ratePerUnit = (staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
      const amount = totalQuantity * ratePerUnit;

      totalAmount += amount;
      projectDetails.push({ projectId, amount, quantity: totalQuantity, rate: ratePerUnit });
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
            project_id: detail.projectId,
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