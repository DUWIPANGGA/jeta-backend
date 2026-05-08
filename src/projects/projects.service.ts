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
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProjectDto, currentUserId: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      const isAdmin = user?.role_id === 1;

      // 1. Cek custom order
      const customOrder = await this.prisma.customOrder.findFirst({
        where: {
          id: createDto.custom_order_id,
          ...(!isAdmin ? { user_id: currentUserId } : {}),
        },
      });

      if (!customOrder) {
        const errorMsg = `Custom order with ID ${createDto.custom_order_id} not found or not owned by you (User ID: ${currentUserId})`;
        console.error(`[Project Create Error]: ${errorMsg}`);
        throw new NotFoundException(errorMsg);
      }

      if (!customOrder.accept_status) {
        const errorMsg = `Cannot create project for unapproved custom order (ID: ${createDto.custom_order_id})`;
        console.error(`[Project Create Error]: ${errorMsg}`);
        throw new ForbiddenException(errorMsg);
      }

      const teamList = createDto.team || [];
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
          const errorMsg = `User IDs not found in database: ${missing.join(', ')}`;
          console.error(`[Project Create Error]: ${errorMsg}`);
          throw new BadRequestException(errorMsg);
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        // 2. Cari project yang sudah ada atau buat baru
        const project =
          (await tx.project.findFirst({
            where: { custom_order_id: createDto.custom_order_id },
          })) ||
          (await tx.project.create({
            data: {
              user_id: customOrder.user_id, // Gunakan user_id dari customOrder (customer)
              custom_order_id: createDto.custom_order_id,
              status: createDto.status ?? true,
            },
          }));

        if (teamList.length > 0) {
          // 3. Update team (Hapus yang lama, ganti yang baru) - Agar bersifat Upsert Team
          await tx.projectMember.deleteMany({
            where: { project_id: project.id },
          });

          const membersData = teamList.map((member) => {
            const user = existingUsers.find((u) => u.id === member.user_id);
            return {
              project_id: project.id,
              user_id: member.user_id,
              assigned_name: user?.name || null,
            };
          });
          await tx.projectMember.createMany({ data: membersData });
        }

        // return dengan include
        return tx.project.findUnique({
          where: { id: project.id },
          include: {
            user: { select: { id: true, name: true, email: true } },
            order: {
              select: { id: true, order_number: true, status: true },
            },
            custom_order: {
              select: { id: true, name: true, jenis_produk: true, accept_status: true },
            },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
      });
    } catch (error) {
      if (error.status && error.response) {
        throw error;
      }
      console.error('[Project Create Unexpected Error]:', error);
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
        order: {
          select: { id: true, order_number: true, status: true },
        },
        custom_order: {
          select: { id: true, name: true, jenis_produk: true, accept_status: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async getQueue(isAdmin: boolean) {
    if (!isAdmin) throw new ForbiddenException('Only admin can access production queue');
    return this.prisma.project.findMany({
      where: {
        status: true,
      },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: {
          select: { id: true, order_number: true, status: true },
        },
        custom_order: {
          select: { id: true, name: true, jenis_produk: true, accept_status: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async findOne(id: number, currentUserId: number, isAdmin: boolean) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: {
          select: { id: true, order_number: true, status: true },
        },
        custom_order: {
          select: { id: true, name: true, jenis_produk: true, accept_status: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      const errorMsg = `Project with ID ${id} not found`;
      console.error(`[Project FindOne Error]: ${errorMsg}`);
      throw new NotFoundException(errorMsg);
    }

    if (!isAdmin && project.user_id !== currentUserId) {
      const errorMsg = `User ID ${currentUserId} does not have permission to access Project ID ${id}`;
      console.error(`[Project FindOne Error]: ${errorMsg}`);
      throw new ForbiddenException('You do not have permission to access this project');
    }

    return project;
  }

  async update(
    id: number,
    updateDto: UpdateProjectDto,
    currentUserId: number,
    isAdmin: boolean,
  ) {
    try {
      // Cek akses
      await this.findOne(id, currentUserId, isAdmin);

      const updateData: any = {};
      if (updateDto.status !== undefined) updateData.status = updateDto.status;

      if (isAdmin && updateDto.custom_order_id !== undefined) {
        const newCustomOrder = await this.prisma.customOrder.findUnique({
          where: { id: updateDto.custom_order_id },
        });

        if (!newCustomOrder) {
          const errorMsg = `New custom order with ID ${updateDto.custom_order_id} not found`;
          console.error(`[Project Update Error]: ${errorMsg}`);
          throw new NotFoundException(errorMsg);
        }

        const conflict = await this.prisma.project.findFirst({
          where: { custom_order_id: updateDto.custom_order_id, NOT: { id } },
        });

        if (conflict) {
          const errorMsg = `Another project already uses custom order ID: ${updateDto.custom_order_id}`;
          console.error(`[Project Update Error]: ${errorMsg}`);
          throw new BadRequestException(errorMsg);
        }

        updateData.custom_order_id = updateDto.custom_order_id;
      }

      const teamUpdate = updateDto.team;

      return await this.prisma.$transaction(async (tx) => {
        // Update project jika ada perubahan
        if (Object.keys(updateData).length > 0) {
          await tx.project.update({
            where: { id },
            data: updateData,
          });
        }

        // Handle team replacement
        if (teamUpdate !== undefined) {
          await tx.projectMember.deleteMany({ where: { project_id: id } });

          if (teamUpdate.length > 0) {
            const userIds = teamUpdate.map((item) => item.user_id);
            const existingUsers = await tx.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, name: true },
            });

            const foundIds = existingUsers.map((u) => u.id);
            const missing = userIds.filter((id) => !foundIds.includes(id));

            if (missing.length) {
              const errorMsg = `User IDs not found in database: ${missing.join(', ')}`;
              console.error(`[Project Update Error]: ${errorMsg}`);
              throw new BadRequestException(errorMsg);
            }

            const membersData = teamUpdate.map((item) => {
              const user = existingUsers.find((u) => u.id === item.user_id);
              return {
                project_id: id,
                user_id: item.user_id,
                assigned_name: user?.name || null,
              };
            });
            await tx.projectMember.createMany({ data: membersData });
          }
        }

        // Return final project
        return tx.project.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, name: true, email: true } },
            order: {
              select: { id: true, order_number: true, status: true },
            },
            custom_order: {
              select: { id: true, name: true, jenis_produk: true, accept_status: true },
            },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
      });
    } catch (error: any) {
      if (error.status && error.response) {
        throw error;
      }
      console.error('[Project Update Unexpected Error]:', error);
      throw error;
    }
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean) {
    try {
      await this.findOne(id, currentUserId, isAdmin);
      await this.prisma.project.delete({ where: { id } });
      return { message: `Project ${id} deleted successfully` };
    } catch (error: any) {
      if (error.status && error.response) {
        throw error;
      }
      console.error(`[Project Remove Error]: Unexpected error deleting project ${id}`, error);
      throw error;
    }
  }
}