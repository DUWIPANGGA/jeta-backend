import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async create(createRoleDto: CreateRoleDto) {
    const { accesses, ...roleData } = createRoleDto;

    // Create role with its accesses
    const role = await this.prisma.role.create({
      data: {
        ...roleData,
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

    return role;
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

    return roles;
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

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { accesses, ...roleData } = updateRoleDto;

    // First, delete existing accesses
    await this.prisma.access.deleteMany({
      where: { role_id: id },
    });

    // Then update role and create new accesses
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
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

    return role;
  }

  async remove(id: number) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Delete role (accesses will be deleted automatically due to cascade)
    await this.prisma.role.delete({
      where: { id },
    });

    return { message: `Role with ID ${id} deleted successfully` };
  }

  async getPagesWithAccess(roleId?: number) {
    // Get all pages
    const pages = await this.prisma.page.findMany({
      orderBy: { nomor: 'asc' },
    });

    // If roleId provided, get existing accesses
    let existingAccesses: any[] = [];
    if (roleId) {
      existingAccesses = await this.prisma.access.findMany({
        where: { role_id: roleId },
      });
    }

    // Map pages with access status
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

    return pagesWithAccess;
  }
}