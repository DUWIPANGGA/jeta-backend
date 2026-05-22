import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressReportDto } from './dto/create-progress-report.dto';
import { UpdateProgressReportDto } from './dto/update-progress-report.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProgressReportsService {
  constructor(private readonly prisma: PrismaService) { }

  // ==================== HELPER: VALIDASI SISA QUANTITY ====================
  private async validateRemainingQuantity(customOrderItemId: number, stageId: number, requestedQuantity: number) {
    const item = await this.prisma.customOrderItem.findUnique({
      where: { id: customOrderItemId },
      select: { 
        quantity: true,
        custom_order_id: true
      },
    });

    if (!item) {
      throw new BadRequestException('Custom order item not found');
    }

    // Hitung sisa quantity secara dinamis khusus untuk stage ini
    const reportsForStage = await this.prisma.progressReport.findMany({
      where: {
        custom_order_item_id: customOrderItemId,
        stage_id: stageId,
        status: { in: ['proses', 'selesai'] }
      },
      select: { quantity: true }
    });

    const reportedQuantity = reportsForStage.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
    const remainingQuantityForStage = item.quantity - reportedQuantity;

    if (requestedQuantity > remainingQuantityForStage) {
      throw new BadRequestException(
        `Sisa yang bisa dilaporkan untuk stage ini hanya ${remainingQuantityForStage} pcs. Anda mencoba melaporkan ${requestedQuantity} pcs.`
      );
    }

    return { ...item, remaining_quantity: remainingQuantityForStage };
  }

  // ==================== HELPER: UPDATE SISA GLOBAL MINIMUM ====================
  private async updateGlobalRemainingQuantity(tx: any, customOrderItemId: number) {
    const item = await tx.customOrderItem.findUnique({
      where: { id: customOrderItemId },
      select: { quantity: true }
    });
    if (!item) return;

    const stages = await tx.stage.findMany();
    let minRemaining = item.quantity;

    for (const stage of stages) {
      const reports = await tx.progressReport.findMany({
        where: {
          custom_order_item_id: customOrderItemId,
          stage_id: stage.id,
          status: { in: ['proses', 'selesai'] }
        },
        select: { quantity: true }
      });
      const reported = reports.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
      const remaining = item.quantity - reported;
      if (remaining < minRemaining) {
        minRemaining = remaining;
      }
    }

    await tx.customOrderItem.update({
      where: { id: customOrderItemId },
      data: { remaining_quantity: minRemaining }
    });
  }

  // ==================== HELPER: CEK STAFF MEMBER PROJECT ====================
  private async isStaffMemberOfProject(staffId: number, projectId: number): Promise<boolean> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { user_id: true },
    });
    if (!staff) return false;
    const member = await this.prisma.projectMember.findFirst({
      where: { project_id: projectId, user_id: staff.user_id },
    });
    return !!member;
  }

  // ==================== HELPER: CEK DUPLIKAT REPORT ====================
  private async checkDuplicateReport(staffId: number, customOrderItemId: number, stageId: number) {
    const existing = await this.prisma.progressReport.findFirst({
      where: {
        staff_id: staffId,
        custom_order_item_id: customOrderItemId,
        stage_id: stageId,
        approval_status: false,
      },
    });

    if (existing) {
      throw new BadRequestException('Anda sudah memiliki laporan pending untuk stage dan item ini');
    }
  }

  // ==================== CREATE ====================
  async create(
    createDto: CreateProgressReportDto,
    userIdFromToken: number,
    file: Express.Multer.File,
  ) {
    const imagePath = `/uploads/progress/${file.filename}`;
    const { project_id, custom_order_item_id, stage_id, quantity, catatan, status } = createDto;

    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });
    if (!staff) {
      throw new BadRequestException('User tidak memiliki data staff. Hubungi admin.');
    }

    const isMember = await this.isStaffMemberOfProject(staff.id, project_id);
    if (!isMember) {
      throw new ForbiddenException('Anda tidak terdaftar sebagai anggota project ini');
    }

    const stage = await this.prisma.stage.findUnique({ where: { id: stage_id } });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stage_id} not found`);
    }

    const item = await this.validateRemainingQuantity(custom_order_item_id, stage_id, quantity);

    const customOrder = await this.prisma.customOrder.findFirst({
      where: {
        id: item.custom_order_id,
        projects: { some: { id: project_id } },
      },
    });

    if (!customOrder) {
      throw new BadRequestException('Custom order item tidak terkait dengan project ini');
    }

    await this.checkDuplicateReport(staff.id, custom_order_item_id, stage_id);

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.progressReport.create({
        data: {
          staff_id: staff.id,
          project_id: project_id,
          custom_order_item_id: custom_order_item_id,
          stage_id: stage_id,
          quantity: quantity,
          catatan: catatan,
          image: imagePath,
          status: status ?? 'proses',
          approval_status: false,
        },
        include: {
          staff: { include: { user: { select: { id: true, name: true, email: true } } } },
          project: { include: { custom_order: true } },
          stage: true,
          custom_order_item: {
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
      });

      await this.updateGlobalRemainingQuantity(tx, custom_order_item_id);

      return report;
    });
  }

  // ==================== FIND ALL ====================
  async findAll(projectId?: number) {
    const where = projectId ? { project_id: projectId } : {};
    return this.prisma.progressReport.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
        custom_order_item: {
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
    });
  }

  // ==================== FIND ONE ====================
  async findOne(id: number) {
    const report = await this.prisma.progressReport.findUnique({
      where: { id },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
        custom_order_item: {
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
    });
    if (!report) throw new NotFoundException(`Progress report #${id} not found`);
    return report;
  }

  // ==================== UPDATE ====================
  async update(
    id: number,
    updateDto: UpdateProgressReportDto,
    userIdFromToken: number,
    isAdmin: boolean,
    imagePath?: string,
  ) {
    const report = await this.findOne(id);
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });

    // ==================== ADMIN: APPROVE / REJECT ====================
    if (isAdmin) {
      if (updateDto.approval_status === undefined) {
        throw new BadRequestException('Admin hanya bisa mengupdate approval_status');
      }

      const otherFields = Object.keys(updateDto).filter(k => k !== 'approval_status');
      if (otherFields.length > 0) {
        throw new ForbiddenException(`Admin tidak boleh mengupdate field: ${otherFields.join(', ')}`);
      }

      // REJECT
      if (updateDto.approval_status === false && report.approval_status !== true) {
        await this.prisma.$transaction(async (tx) => {
          await tx.progressReport.update({
            where: { id },
            data: { approval_status: false, status: 'pending' },
          });

          if (report.custom_order_item_id) {
            await this.updateGlobalRemainingQuantity(tx, report.custom_order_item_id);
          }
        });
        return this.findOne(id);
      }

      // APPROVE
      if (updateDto.approval_status === true && report.approval_status !== true) {
        return this.prisma.$transaction(async (tx) => {
          const updated = await tx.progressReport.update({
            where: { id },
            data: { approval_status: true, status: 'selesai' },
          });

          if (report.custom_order_item_id && report.quantity) {
            const customOrderItem = await tx.customOrderItem.findUnique({
              where: { id: report.custom_order_item_id },
              select: { custom_order_id: true },
            });

            await tx.workLog.create({
              data: {
                user_id: report.staff_id,
                stage_id: report.stage_id,
                order_type: 'custom_order',
                custom_order_id: customOrderItem?.custom_order_id,
                quantity: report.quantity,
                earned_amount: 0,
              },
            });

            await this.updateGlobalRemainingQuantity(tx, report.custom_order_item_id);
          }

          return updated;
        });
      }

      return this.findOne(id);
    }

    // ==================== STAFF: EDIT REPORT ====================
    if (!staff || report.staff_id !== staff.id) {
      throw new ForbiddenException('Anda hanya bisa mengupdate laporan milik sendiri');
    }

    if (report.approval_status === true) {
      throw new ForbiddenException('Tidak bisa mengupdate laporan yang sudah disetujui');
    }

    const updateData: any = {};
    let newQuantity: number | undefined = undefined;

    if (updateDto.quantity !== undefined) {
      newQuantity = updateDto.quantity;
      if (isNaN(newQuantity)) throw new BadRequestException('Quantity harus berupa angka');
      
      // Hitung sisa quantity secara dinamis khusus untuk stage ini (mengeluarkan report saat ini)
      const reportsForStage = await this.prisma.progressReport.findMany({
        where: {
          custom_order_item_id: report.custom_order_item_id!,
          stage_id: report.stage_id,
          id: { not: id },
          status: { in: ['proses', 'selesai'] }
        },
        select: { quantity: true }
      });

      const reportedQuantity = reportsForStage.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
      if (!report.custom_order_item) {
        throw new BadRequestException('Custom order item tidak ditemukan untuk laporan progres ini.');
      }
      const remainingForStage = report.custom_order_item.quantity - reportedQuantity;

      if (newQuantity > remainingForStage) {
        throw new BadRequestException(
          `Sisa yang bisa dilaporkan untuk stage ini hanya ${remainingForStage} pcs.`
        );
      }

      updateData.quantity = newQuantity;
    }

    if (updateDto.catatan !== undefined) updateData.catatan = updateDto.catatan;
    if (imagePath !== undefined) {
      if (report.image) {
        const oldFilePath = path.join(process.cwd(), report.image);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      updateData.image = imagePath;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Tidak ada field yang valid untuk diupdate');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedReport = await tx.progressReport.update({
        where: { id },
        data: updateData,
        include: {
          staff: { include: { user: { select: { id: true, name: true, email: true } } } },
          project: { include: { custom_order: true } },
          stage: true,
          custom_order_item: {
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
      });

      if (report.custom_order_item_id) {
        await this.updateGlobalRemainingQuantity(tx, report.custom_order_item_id);
      }

      return updatedReport;
    });
  }

  // ==================== DELETE ====================
  async remove(id: number, userIdFromToken: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });

    if (!isAdmin && (!staff || report.staff_id !== staff.id)) {
      throw new ForbiddenException('Anda hanya bisa menghapus laporan milik sendiri');
    }

    if (report.approval_status === true && !isAdmin) {
      throw new ForbiddenException('Tidak bisa menghapus laporan yang sudah disetujui');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.progressReport.delete({ where: { id } });

      if (report.custom_order_item_id) {
        await this.updateGlobalRemainingQuantity(tx, report.custom_order_item_id);
      }

      if (report.image) {
        const filePath = path.join(process.cwd(), report.image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      return { message: `Progress report ${id} deleted successfully` };
    });
  }

  // ==================== GET MY TASKS ====================
  async getMyTasks(userIdFromToken: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });
    if (!staff) return [];
    
    return this.prisma.progressReport.findMany({
      where: { staff_id: staff.id },
      orderBy: { created_at: 'desc' },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
        custom_order_item: {
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
    });
  }

  // ==================== GET QUEUE ====================
  async getQueue() {
    return this.prisma.progressReport.findMany({
      where: { approval_status: false },
      orderBy: { created_at: 'asc' },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
        custom_order_item: {
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
    });
  }

  // ==================== GET REMAINING QUANTITY ====================
  async getRemainingQuantity(customOrderItemId: number, stageId?: number) {
    const item = await this.prisma.customOrderItem.findUnique({
      where: { id: customOrderItemId },
      select: {
        quantity: true,
        remaining_quantity: true,
        selected_options: {
          include: {
            variant_option: {
              include: { custom_variant: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Custom order item with ID ${customOrderItemId} not found`);
    }

    const productDescription = item.selected_options
      .map(opt => `${opt.variant_option?.custom_variant?.name || ''} ${opt.variant_option?.name || ''}`.trim())
      .filter(Boolean)
      .join(', ');

    if (stageId !== undefined) {
      // Hitung sisa untuk stage tertentu
      const reports = await this.prisma.progressReport.findMany({
        where: {
          custom_order_item_id: customOrderItemId,
          stage_id: stageId,
          status: { in: ['proses', 'selesai'] }
        },
        select: { quantity: true }
      });
      const completed = reports.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
      const remaining = item.quantity - completed;

      return {
        total: item.quantity,
        completed,
        remaining,
        product_description: productDescription,
      };
    } else {
      // Hitung sisa untuk semua stage
      const stages = await this.prisma.stage.findMany({
        orderBy: { order_index: 'asc' }
      });

      const stagesResult: any[] = [];
      for (const stage of stages) {
        const reports = await this.prisma.progressReport.findMany({
          where: {
            custom_order_item_id: customOrderItemId,
            stage_id: stage.id,
            status: { in: ['proses', 'selesai'] }
          },
          select: { quantity: true }
        });
        const completed = reports.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
        const remaining = item.quantity - completed;

        stagesResult.push({
          stage_id: stage.id,
          stage_name: stage.stage_name,
          completed,
          remaining
        });
      }

      return {
        total: item.quantity,
        product_description: productDescription,
        stages: stagesResult,
      };
    }
  }
}