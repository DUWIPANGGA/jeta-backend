// src/staff/staff.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateStaffDto) {
    // Cek duplikasi user_id
    const existing = await this.prisma.staff.findFirst({
      where: { user_id: createDto.user_id },
    });
    if (existing) {
      throw new ConflictException(`User ID ${createDto.user_id} is already registered as staff`);
    }

    // Cek user dan role
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.user_id },
    });
    if (!user) throw new NotFoundException(`User with ID ${createDto.user_id} not found`);
    if (user.role_id !== 3) {
      throw new BadRequestException(`User ID ${createDto.user_id} does not have role 'staff' (role_id=3)`);
    }

    // Validasi stage_ids
    const stageIds = createDto.stage_ids ?? [];
    if (stageIds.length) {
      const stages = await this.prisma.stage.findMany({
        where: { id: { in: stageIds } },
      });
      if (stages.length !== stageIds.length) {
        throw new BadRequestException('Some stage_id(s) not found');
      }
    }

    // Buat staff
    const staff = await this.prisma.staff.create({
      data: {
        user_id: createDto.user_id,
        tgl_masuk: new Date(createDto.tgl_masuk),
        salary: createDto.salary ?? 0,
      },
    });

    // Hubungkan stage
    if (stageIds.length) {
      await this.prisma.staffStage.createMany({
        data: stageIds.map((stageId) => ({
          staff_id: staff.id,
          stage_id: stageId,
        })),
      });
    }

    // Return dengan include
    return this.prisma.staff.findUnique({
      where: { id: staff.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, role_id: true } },
        staffStages: { include: { stage: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.staff.findMany({
      where: { user: { role_id: 3 } },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, role_id: true } },
        staffStages: { include: { stage: true } },
      },
    });
  }

  async findOne(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, role_id: true } },
        staffStages: { include: { stage: true } },
      },
    });
    if (!staff) throw new NotFoundException(`Staff with ID ${id} not found`);
    return staff;
  }

  async update(id: number, updateDto: UpdateStaffDto) {
    await this.findOne(id);

    // Validasi user_id jika ada
    if (updateDto.user_id !== undefined) {
      const existing = await this.prisma.staff.findFirst({
        where: { user_id: updateDto.user_id, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`User ID ${updateDto.user_id} already assigned to another staff`);
      }
      const user = await this.prisma.user.findUnique({ where: { id: updateDto.user_id } });
      if (!user) throw new NotFoundException(`User with ID ${updateDto.user_id} not found`);
      if (user.role_id !== 3) throw new BadRequestException(`User ID ${updateDto.user_id} is not a staff`);
    }

    // Update stage_ids jika disediakan (replace)
    if (updateDto.stage_ids !== undefined) {
      const stageIds = updateDto.stage_ids;
      if (stageIds.length) {
        const stages = await this.prisma.stage.findMany({
          where: { id: { in: stageIds } },
        });
        if (stages.length !== stageIds.length) {
          throw new BadRequestException('Some stage_id(s) not found');
        }
      }
      await this.prisma.staffStage.deleteMany({ where: { staff_id: id } });
      if (stageIds.length) {
        await this.prisma.staffStage.createMany({
          data: stageIds.map((stageId) => ({ staff_id: id, stage_id: stageId })),
        });
      }
    }

    // Update field lain
    const updateData: any = {};
    if (updateDto.user_id !== undefined) updateData.user_id = updateDto.user_id;
    if (updateDto.tgl_masuk !== undefined) updateData.tgl_masuk = new Date(updateDto.tgl_masuk);
    if (updateDto.salary !== undefined) updateData.salary = updateDto.salary;

    if (Object.keys(updateData).length) {
      await this.prisma.staff.update({ where: { id }, data: updateData });
    }

    return this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, role_id: true } },
        staffStages: { include: { stage: true } },
      },
    });
  }

  async updateOrCreateByUserId(userId: number, updateDto: UpdateStaffDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (user.role_id !== 3) throw new BadRequestException(`User ID ${userId} is not a staff`);

    let staff = await this.prisma.staff.findFirst({ where: { user_id: userId } });

    if (!staff) {
      // CREATE NEW
      if (!updateDto.stage_ids || !updateDto.tgl_masuk) {
        throw new BadRequestException('stage_ids and tgl_masuk required when creating new staff');
      }
      const stageIds = updateDto.stage_ids;
      if (stageIds.length) {
        const stages = await this.prisma.stage.findMany({ where: { id: { in: stageIds } } });
        if (stages.length !== stageIds.length) {
          throw new BadRequestException('Some stage_id(s) not found');
        }
      }
      staff = await this.prisma.staff.create({
        data: {
          user_id: userId,
          tgl_masuk: new Date(updateDto.tgl_masuk),
          salary: updateDto.salary ?? 0,
        },
      });
      if (stageIds.length) {
        await this.prisma.staffStage.createMany({
          data: stageIds.map((stageId) => ({ staff_id: staff!.id, stage_id: stageId })),
        });
      }
    } else {
      // UPDATE EXISTING
      if (updateDto.stage_ids !== undefined) {
        const stageIds = updateDto.stage_ids;
        if (stageIds.length) {
          const stages = await this.prisma.stage.findMany({ where: { id: { in: stageIds } } });
          if (stages.length !== stageIds.length) {
            throw new BadRequestException('Some stage_id(s) not found');
          }
        }
        await this.prisma.staffStage.deleteMany({ where: { staff_id: staff.id } });
        if (stageIds.length) {
          await this.prisma.staffStage.createMany({
            data: stageIds.map((stageId) => ({ staff_id: staff!.id, stage_id: stageId })),
          });
        }
      }
      const updateData: any = {};
      if (updateDto.tgl_masuk !== undefined) updateData.tgl_masuk = new Date(updateDto.tgl_masuk);
      if (updateDto.salary !== undefined) updateData.salary = updateDto.salary;
      if (Object.keys(updateData).length) {
        staff = await this.prisma.staff.update({
          where: { id: staff.id },
          data: updateData,
        });
      }
    }

    // staff pasti ada di sini
    return this.prisma.staff.findUnique({
      where: { id: staff!.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, role_id: true } },
        staffStages: { include: { stage: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.staff.delete({ where: { id } });
    return { message: `Staff with ID ${id} deleted successfully` };
  }
}