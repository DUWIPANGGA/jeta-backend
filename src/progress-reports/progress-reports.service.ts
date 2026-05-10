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

@Injectable()
export class ProgressReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== CREATE ====================
  async create(createDto: CreateProgressReportDto, userId: number) {
    // Cek apakah user adalah member dari project
    const isMember = await this.prisma.projectMember.findFirst({
      where: {
        project_id: createDto.project_id,
        user_id: userId,
      },
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Cek stage exist
    const stage = await this.prisma.stage.findUnique({
      where: { id: createDto.stage_id },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${createDto.stage_id} not found`);
    }

    // Buat laporan
    return this.prisma.progressReport.create({
      data: {
        project_id: createDto.project_id,
        stage_id: createDto.stage_id,
        user_id: userId,
        status: createDto.status ?? 'pending',
        catatan: createDto.catatan,
        image: createDto.image,
        approval_status: false, // default
      },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==================== FIND ALL ====================
  async findAll(projectId?: number) {
    const where = projectId ? { project_id: projectId } : {};
    return this.prisma.progressReport.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==================== FIND ONE ====================
  async findOne(id: number) {
    const report = await this.prisma.progressReport.findUnique({
      where: { id },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException(`Progress report #${id} not found`);
    return report;
  }

  // ==================== UPDATE ====================
  async update(
    id: number,
    updateDto: UpdateProgressReportDto,
    userId: number,
    isAdmin: boolean,
  ) {
    const report = await this.findOne(id);

    // Hanya admin atau pembuat laporan yang boleh update
    if (!isAdmin && report.user_id !== userId) {
      throw new ForbiddenException('You can only update your own reports');
    }

    // Field yang boleh diupdate oleh staff (pembuat)
    const commonData: any = {};
    if (updateDto.status !== undefined) commonData.status = updateDto.status;
    if (updateDto.catatan !== undefined) commonData.catatan = updateDto.catatan;
    if (updateDto.image !== undefined) commonData.image = updateDto.image;

    // Field yang hanya admin yang boleh update
    let adminData: any = {};
    if (updateDto.approval_status !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Only admin can update approval status');
      }
      adminData.approval_status = updateDto.approval_status;
    }
    if (updateDto.stage_id !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Only admin can change stage');
      }
      const stageExists = await this.prisma.stage.findUnique({
        where: { id: updateDto.stage_id },
      });
      if (!stageExists) {
        throw new BadRequestException(`Stage with ID ${updateDto.stage_id} not found`);
      }
      adminData.stage_id = updateDto.stage_id;
    }

    const updateData = { ...commonData, ...adminData };
    return this.prisma.progressReport.update({
      where: { id },
      data: updateData,
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==================== REMOVE ====================
  async remove(id: number, userId: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    if (!isAdmin && report.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }
    await this.prisma.progressReport.delete({ where: { id } });
    return { message: `Progress report ${id} deleted successfully` };
  }

  // ==================== GET MY TASKS ====================
  async getMyTasks(userId: number) {
    return this.prisma.progressReport.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ==================== GET QUEUE (belum disetujui admin) ====================
  async getQueue() {
    return this.prisma.progressReport.findMany({
      where: { approval_status: false },
      orderBy: { created_at: 'asc' },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}