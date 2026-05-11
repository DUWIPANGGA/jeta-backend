// src/projects/projects.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateProjectDto, currentUserId: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      const isAdmin = user?.role_id === 1;

      const customOrder = await this.prisma.customOrder.findFirst({
        where: {
          id: createDto.custom_order_id,
          ...(!isAdmin ? { user_id: currentUserId } : {}),
        },
      });
      if (!customOrder) {
        throw new NotFoundException(`Custom order not found or not owned by you`);
      }
      if (!customOrder.accept_status) {
        throw new ForbiddenException('Cannot create project for unapproved custom order');
      }

      const teamList = createDto.team || []; // untuk kemudahan
      let existingUsers: { id: number; name: string }[] = [];
      if (teamList.length > 0) {
        const userIds = teamList.map((item) => item.user_id);
        existingUsers = await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        });
        const foundIds = existingUsers.map((u) => u.id);
        const missing = userIds.filter((id) => !foundIds.includes(id));
        if (missing.length) {
          throw new BadRequestException(`User IDs not found: ${missing.join(', ')}`);
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        let project = await tx.project.findFirst({
          where: { custom_order_id: createDto.custom_order_id },
        });
        if (!project) {
          project = await tx.project.create({
            data: {
              user_id: customOrder.user_id,
              custom_order_id: createDto.custom_order_id,
              status: createDto.status ?? true,
            },
          });
        }
        const projectId = project.id;

        // Perbaikan: jika field team disertakan dalam request (termasuk array kosong)
        if (createDto.team !== undefined) {
          // Hapus semua member yang ada
          await tx.projectMember.deleteMany({ where: { project_id: projectId } });
          // Jika ada member baru (tidak kosong), tambahkan
          if (teamList.length > 0) {
            const membersData = teamList.map((member) => ({
              project_id: projectId,
              user_id: member.user_id,
              assigned_name: existingUsers.find((u) => u.id === member.user_id)?.name || null,
            }));
            await tx.projectMember.createMany({ data: membersData });
          }
        }

        return tx.project.findUnique({
          where: { id: projectId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        });
      });
    } catch (error: any) {
      if (error.status && error.response) throw error;
      console.error('[Project Create Error]', error);
      throw error;
    }
  }

  async findAll(currentUserId: number, isAdmin: boolean) {
    const where = isAdmin ? {} : { user_id: currentUserId };
    return this.prisma.project.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async getMyTasks(userId: number) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { user_id: userId },
      include: {
        project: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });
    return memberships.map((m) => m.project);
  }

  async getQueue(isAdmin: boolean) {
    if (!isAdmin) throw new ForbiddenException('Only admin can access production queue');
    return this.prisma.project.findMany({
      where: { status: true },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async findOne(id: number, currentUserId: number, isAdmin: boolean) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    if (!isAdmin && project.user_id !== currentUserId) {
      throw new ForbiddenException('You do not have permission to access this project');
    }
    return project;
  }

  async update(id: number, updateDto: UpdateProjectDto, currentUserId: number, isAdmin: boolean) {
    try {
      await this.findOne(id, currentUserId, isAdmin);
      const updateData: any = {};
      if (updateDto.status !== undefined) updateData.status = updateDto.status;

      if (isAdmin && updateDto.custom_order_id !== undefined) {
        const newCustomOrder = await this.prisma.customOrder.findUnique({ where: { id: updateDto.custom_order_id } });
        if (!newCustomOrder) throw new NotFoundException(`New custom order not found`);
        const conflict = await this.prisma.project.findFirst({ where: { custom_order_id: updateDto.custom_order_id, NOT: { id } } });
        if (conflict) throw new BadRequestException(`Another project already uses custom order ID: ${updateDto.custom_order_id}`);
        updateData.custom_order_id = updateDto.custom_order_id;
      }

      const teamUpdate = updateDto.team;
      return await this.prisma.$transaction(async (tx) => {
        if (Object.keys(updateData).length > 0) {
          await tx.project.update({ where: { id }, data: updateData });
        }
        if (teamUpdate !== undefined) {
          await tx.projectMember.deleteMany({ where: { project_id: id } });
          if (teamUpdate.length > 0) {
            const userIds = teamUpdate.map((item) => item.user_id);
            const existingUsers = await tx.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
            const missing = userIds.filter((uid) => !existingUsers.map((u) => u.id).includes(uid));
            if (missing.length) throw new BadRequestException(`User IDs not found: ${missing.join(', ')}`);
            const membersData = teamUpdate.map((item) => ({
              project_id: id,
              user_id: item.user_id,
              assigned_name: existingUsers.find((u) => u.id === item.user_id)?.name || null,
            }));
            await tx.projectMember.createMany({ data: membersData });
          }
        }
        return tx.project.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, name: true, email: true } },
            custom_order: { select: { id: true, name: true, jenis_produk: true, accept_status: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        });
      });
    } catch (error: any) {
      if (error.status && error.response) throw error;
      console.error('[Project Update Error]', error);
      throw error;
    }
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean) {
    try {
      await this.findOne(id, currentUserId, isAdmin);
      await this.prisma.project.delete({ where: { id } });
      return { message: `Project ${id} deleted successfully` };
    } catch (error: any) {
      if (error.status && error.response) throw error;
      console.error(`[Project Remove Error]`, error);
      throw error;
    }
  }
}