import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressReportDto } from './dto/create-progress-report.dto';
import { UpdateProgressReportDto } from './dto/update-progress-report.dto';

@Injectable()
export class ProgressReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProgressReportDto, userId: number) {
    // Cek apakah user terdaftar sebagai member di project ini
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: createDto.project_id,
          user_id: userId,
        },
      },
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Cek apakah stage ada
    const stage = await this.prisma.stage.findUnique({
      where: { id: createDto.stage_id },
    });
    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.progressReport.create({
      data: {
        project_id: createDto.project_id,
        stage_id: createDto.stage_id,
        user_id: userId,
        status: createDto.status ?? 'pending',
        catatan: createDto.catatan,
        image: createDto.image,
        percentage: createDto.percentage,
      },
      include: {
        project: { include: { custom_order: true, order: true } },
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

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

  async findOne(id: number) {
    const report = await this.prisma.progressReport.findUnique({
      where: { id },
      include: {
        project: true,
        stage: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException(`Progress report #${id} not found`);
    return report;
  }

  async update(id: number, updateDto: UpdateProgressReportDto, userId: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    // Cek apakah user yang update adalah pembuat report atau admin
    if (!isAdmin && report.user_id !== userId) {
      throw new ForbiddenException('You can only update your own reports');
    }
    return this.prisma.progressReport.update({
      where: { id },
      data: updateDto,
      include: {
        project: true,
        stage: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const report = await this.findOne(id);
    if (!isAdmin && report.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }
    await this.prisma.progressReport.delete({ where: { id } });
    return { message: `Progress report ${id} deleted` };
  }
}