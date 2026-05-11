// src/salary-projects/salary-projects.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryProjectDto } from './dto/create-salary-project.dto';
import { UpdateSalaryProjectDto } from './dto/update-salary-project.dto';

@Injectable()
export class SalaryProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateSalaryProjectDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: createDto.staff_id },
    });
    if (!staff) throw new NotFoundException(`Staff ID ${createDto.staff_id} not found`);

    const project = await this.prisma.project.findUnique({
      where: { id: createDto.project_id },
    });
    if (!project) throw new NotFoundException(`Project ID ${createDto.project_id} not found`);

    const existing = await this.prisma.salaryProjects.findFirst({
      where: { staff_id: createDto.staff_id, project_id: createDto.project_id },
    });
    if (existing) throw new ConflictException('Record already exists for this staff & project');

    // Jika adjustment_salary tidak diberikan, gunakan gaji pokok staff
    const adjustmentValue =
      createDto.adjustment_salary !== undefined
        ? createDto.adjustment_salary
        : staff.salary ?? 0;

    return this.prisma.salaryProjects.create({
      data: {
        staff_id: createDto.staff_id,
        project_id: createDto.project_id,
        adjustment_salary: adjustmentValue,
      },
      include: {
        staff: { include: { user: true } },
        project: { include: { custom_order: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.salaryProjects.findMany({
      include: {
        staff: { include: { user: true } },
        project: { include: { custom_order: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.salaryProjects.findUnique({
      where: { id },
      include: {
        staff: { include: { user: true } },
        project: { include: { custom_order: true } },
      },
    });
    if (!record) throw new NotFoundException(`Salary record ID ${id} not found`);
    return record;
  }

  async update(id: number, updateDto: UpdateSalaryProjectDto) {
    const current = await this.findOne(id);
    const newStaffId = updateDto.staff_id ?? current.staff_id;
    const newProjectId = updateDto.project_id ?? current.project_id;

    if (updateDto.staff_id !== undefined || updateDto.project_id !== undefined) {
      const conflict = await this.prisma.salaryProjects.findFirst({
        where: {
          staff_id: newStaffId,
          project_id: newProjectId,
          NOT: { id },
        },
      });
      if (conflict) throw new ConflictException('Duplicate staff-project combination');
    }

    return this.prisma.salaryProjects.update({
      where: { id },
      data: updateDto,
      include: {
        staff: { include: { user: true } },
        project: { include: { custom_order: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.salaryProjects.delete({ where: { id } });
    return { message: `Salary record ${id} deleted` };
  }
}