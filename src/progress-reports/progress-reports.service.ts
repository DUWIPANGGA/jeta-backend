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
  constructor(private readonly prisma: PrismaService) { }

  // ---------- Helper: validasi quantity ----------
  private async validateQuantity(projectId: number, quantity: number | undefined) {
    if (quantity === undefined) return;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { custom_order: true },
    });
    if (!project) throw new BadRequestException('Project not found');
    if (!project.custom_order) throw new BadRequestException('Project tidak memiliki custom order');
    const maxQuantity = project.custom_order.jumlah ?? 0;
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

  // ---------- CREATE (mirip dengan product) ----------
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

  // ---------- UPDATE ----------
  async update(
    id: number,
    updateDto: UpdateProgressReportDto,
    userIdFromToken: number,
    isAdmin: boolean,
  ) {
    const report = await this.findOne(id);
    const staff = await this.prisma.staff.findUnique({
      where: { user_id: userIdFromToken },
    });
    const staffId = staff?.id;
    if (!isAdmin && (!staff || report.staff_id !== staffId)) {
      throw new ForbiddenException('You can only update your own reports');
    }

    let quantity: number | undefined = undefined;
    if (updateDto.quantity !== undefined) {
      quantity = Number(updateDto.quantity);
      if (isNaN(quantity)) throw new BadRequestException('Quantity must be a number');
    }
    if (quantity !== undefined) await this.validateQuantity(report.project_id, quantity);

    const commonData: any = {};
    if (updateDto.status !== undefined) commonData.status = updateDto.status;
    if (updateDto.catatan !== undefined) commonData.catatan = updateDto.catatan;
    if (quantity !== undefined) commonData.quantity = quantity;

    let adminData: any = {};
    if (updateDto.approval_status !== undefined) {
      if (!isAdmin) throw new ForbiddenException('Only admin can update approval status');
      adminData.approval_status = updateDto.approval_status;
    }
    if (updateDto.stage_id !== undefined) {
      if (!isAdmin) throw new ForbiddenException('Only admin can change stage');
      const newStageId = Number(updateDto.stage_id);
      if (isNaN(newStageId)) throw new BadRequestException('Stage ID must be a number');
      const stageExists = await this.prisma.stage.findUnique({ where: { id: newStageId } });
      if (!stageExists) throw new BadRequestException(`Stage with ID ${newStageId} not found`);
      adminData.stage_id = newStageId;
    }

    const updateData = { ...commonData, ...adminData };
    return this.prisma.progressReport.update({
      where: { id },
      data: updateData,
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
      throw new ForbiddenException('You can only delete your own reports');
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