// src/progress-reports/progress-reports.service.ts
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

  // ---------- Helper: validasi quantity ----------
  // src/progress-reports/progress-reports.service.ts
// Ganti method validateQuantity dengan ini:

private async validateQuantity(projectId: number, quantity: number | undefined) {
  if (quantity === undefined) return;
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: { 
      custom_order: {
        include: { items: true }  // ← tambahkan include items
      } 
    },
  });
  if (!project) throw new BadRequestException('Project not found');
  if (!project.custom_order) throw new BadRequestException('Project tidak memiliki custom order');
  
  // Hitung total quantity dari semua items
  const maxQuantity = project.custom_order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  
  if (quantity > maxQuantity) {
    throw new BadRequestException(`Quantity tidak boleh melebihi ${maxQuantity}`);
  }
}

  // ---------- Helper: cek member (opsional) ----------
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

  // ---------- CREATE ----------
  async create(
    createDto: CreateProgressReportDto,
    userIdFromToken: number,
    file: Express.Multer.File,
  ) {
    const imagePath = `/uploads/progress/${file.filename}`;
    const projectId = Number(createDto.project_id);
    const stageId = Number(createDto.stage_id);
    const quantity = createDto.quantity ? Number(createDto.quantity) : undefined;

    if (isNaN(projectId) || isNaN(stageId)) {
      throw new BadRequestException('project_id and stage_id must be valid numbers');
    }

    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });
    if (!staff) {
      throw new BadRequestException('User tidak memiliki data staff. Hubungi admin.');
    }
    const staffId = staff.id;

    // Opsional: cek member (bisa diaktifkan nanti)
    // const isMember = await this.isStaffMemberOfProject(staffId, projectId);
    // if (!isMember) throw new ForbiddenException('You are not a member of this project');

    const stage = await this.prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException(`Stage with ID ${stageId} not found`);

    await this.validateQuantity(projectId, quantity);

    return this.prisma.progressReport.create({
      data: {
        staff_id: staffId,
        project_id: projectId,
        stage_id: stageId,
        status: createDto.status ?? 'pending',
        quantity: quantity ?? null,
        catatan: createDto.catatan,
        image: imagePath,
        approval_status: false,
      },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
      },
    });
  }

  // ---------- FIND ALL ----------
  async findAll(projectId?: number) {
    const where = projectId ? { project_id: projectId } : {};
    return this.prisma.progressReport.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
      },
    });
  }

  // ---------- FIND ONE ----------
  async findOne(id: number) {
    const report = await this.prisma.progressReport.findUnique({
      where: { id },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
      },
    });
    if (!report) throw new NotFoundException(`Progress report #${id} not found`);
    return report;
  }

  // ---------- UPDATE (dengan penanganan file gambar) ----------
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
    const staffId = staff?.id;

    // ==================== ADMIN ====================
    if (isAdmin) {
      const allowedFields = ['approval_status'];
      const forbiddenFields = Object.keys(updateDto).filter(key => !allowedFields.includes(key));
      if (forbiddenFields.length > 0) {
        throw new ForbiddenException(`Admin hanya bisa mengupdate approval_status, tidak boleh: ${forbiddenFields.join(', ')}`);
      }
      if (updateDto.approval_status === undefined) {
        throw new BadRequestException('Approval status harus diisi untuk update admin');
      }
      return this.prisma.progressReport.update({
        where: { id },
        data: { approval_status: updateDto.approval_status },
        include: {
          staff: { include: { user: { select: { id: true, name: true, email: true } } } },
          project: { include: { custom_order: true } },
          stage: true,
        },
      });
    }

    // ==================== STAFF ====================
    if (!staff || report.staff_id !== staffId) {
      throw new ForbiddenException('Anda hanya bisa mengupdate laporan milik sendiri');
    }
    if (report.approval_status === true) {
      throw new ForbiddenException('Tidak bisa mengupdate laporan yang sudah disetujui admin');
    }

    // Staff hanya boleh update status, catatan, quantity, dan gambar (jika ada)
    let quantity: number | undefined = undefined;
    if (updateDto.quantity !== undefined) {
      quantity = Number(updateDto.quantity);
      if (isNaN(quantity)) throw new BadRequestException('Quantity harus berupa angka');
    }
    if (quantity !== undefined) {
      await this.validateQuantity(report.project_id, quantity);
    }

    const commonData: any = {};
    if (updateDto.status !== undefined) commonData.status = updateDto.status;
    if (updateDto.catatan !== undefined) commonData.catatan = updateDto.catatan;
    if (quantity !== undefined) commonData.quantity = quantity;
    if (imagePath !== undefined) {
      // Hapus file lama jika ada
      if (report.image) {
        const oldFilePath = path.join(process.cwd(), report.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      commonData.image = imagePath;
    }

    if (Object.keys(commonData).length === 0) {
      throw new BadRequestException('Tidak ada field yang valid untuk diupdate (status, catatan, quantity, atau gambar)');
    }

    return this.prisma.progressReport.update({
      where: { id },
      data: commonData,
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
      },
    });
  }

  // ---------- DELETE ----------
  async remove(id: number, userIdFromToken: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });
    const staffId = staff?.id;
    if (!isAdmin && (!staff || report.staff_id !== staffId)) {
      throw new ForbiddenException('Anda hanya bisa menghapus laporan milik sendiri');
    }
    // Hapus file gambar jika ada
    if (report.image) {
      const filePath = path.join(process.cwd(), report.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await this.prisma.progressReport.delete({ where: { id } });
    return { message: `Progress report ${id} deleted successfully` };
  }

  // ---------- GET MY TASKS ----------
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
      },
    });
  }

  // ---------- GET QUEUE ----------
  async getQueue() {
    return this.prisma.progressReport.findMany({
      where: { approval_status: false },
      orderBy: { created_at: 'asc' },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true } } } },
        project: { include: { custom_order: true } },
        stage: true,
      },
    });
  }
}