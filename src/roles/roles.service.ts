import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async create(createRoleDto: CreateRoleDto) {
    const { accesses, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name: roleData.name,
        level: roleData.level,
        description: roleData.description,
        explicit_page_ids: roleData.explicit_page_ids ?? [],
        accesses: {
          create: accesses.map(access => ({
            name: `access_${roleData.name}_${access.pageId}`,
            create: access.create || false,
            read: access.read || false,
            update: access.update || false,
            delete: access.delete || false,
            page_id: access.pageId,
          })),
        },
      },
      include: {
        accesses: {
          include: {
            page: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        accesses: {
          include: {
            page: true,
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    });

    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: roles,
      total: roles.length,
    };
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        accesses: {
          include: {
            page: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { accesses, ...roleData } = updateRoleDto;

    await this.prisma.access.deleteMany({
      where: { role_id: id },
    });

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: roleData.name,
        level: roleData.level,
        description: roleData.description,
        explicit_page_ids: roleData.explicit_page_ids ?? undefined,
        accesses: {
          create: accesses?.map(access => ({
            name: `access_${roleData.name || 'role'}_${access.pageId}`,
            create: access.create || false,
            read: access.read || false,
            update: access.update || false,
            delete: access.delete || false,
            page_id: access.pageId,
          })) || [],
        },
      },
      include: {
        accesses: {
          include: {
            page: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  async remove(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Role with ID ${id} deleted successfully`,
    };
  }

  async getPagesWithAccess(roleId?: number) {
    const pages = await this.prisma.page.findMany({
      orderBy: { nomor: 'asc' },
    });

    let existingAccesses: any[] = [];
    if (roleId) {
      existingAccesses = await this.prisma.access.findMany({
        where: { role_id: roleId },
      });
    }

    const pagesWithAccess = pages.map(page => {
      const access = existingAccesses.find(a => a.page_id === page.id);
      return {
        id: page.id,
        nomor: page.nomor,
        name: page.name,
        accesses: {
          create: access?.create || false,
          read: access?.read || false,
          update: access?.update || false,
          delete: access?.delete || false,
        },
      };
    });

    return {
      success: true,
      message: 'Pages retrieved successfully',
      data: pagesWithAccess,
      total: pagesWithAccess.length,
    };
  }
}