import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HalamanService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const halaman = await this.prisma.halaman.findMany({
      include: {
        modules: {
          include: { page: true },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      success: true,
      data: halaman.map(h => ({
        id: h.id,
        name: h.name,
        label: h.label,
        description: h.description,
        icon: h.icon,
        sort_order: h.sort_order,
        modules: h.modules.map(m => ({
          pageId: m.page_id,
          pageName: m.page.name,
          nomor: m.page.nomor,
          can_create: m.can_create,
          can_read: m.can_read,
          can_update: m.can_update,
          can_delete: m.can_delete,
        })),
      })),
    };
  }

  async findOne(id: number) {
    const halaman = await this.prisma.halaman.findUnique({
      where: { id },
      include: {
        modules: {
          include: { page: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!halaman) {
      throw new NotFoundException(`Halaman with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        id: halaman.id,
        name: halaman.name,
        label: halaman.label,
        description: halaman.description,
        icon: halaman.icon,
        sort_order: halaman.sort_order,
        modules: halaman.modules.map(m => ({
          pageId: m.page_id,
          pageName: m.page.name,
          nomor: m.page.nomor,
          can_create: m.can_create,
          can_read: m.can_read,
          can_update: m.can_update,
          can_delete: m.can_delete,
        })),
      },
    };
  }

  async create(body: any) {
    const { modules, ...halamanData } = body;

    const halaman = await this.prisma.halaman.create({
      data: {
        name: halamanData.name,
        label: halamanData.label,
        description: halamanData.description,
        icon: halamanData.icon,
        sort_order: halamanData.sort_order ?? 0,
        modules: {
          create: (modules || []).map((m: any, i: number) => ({
            page_id: m.pageId,
            can_create: m.can_create ?? false,
            can_read: m.can_read ?? true,
            can_update: m.can_update ?? false,
            can_delete: m.can_delete ?? false,
            sort_order: i,
          })),
        },
      },
      include: {
        modules: {
          include: { page: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    return { success: true, message: 'Halaman created', data: halaman };
  }

  async update(id: number, body: any) {
    const existing = await this.prisma.halaman.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Halaman with ID ${id} not found`);

    const { modules, ...halamanData } = body;

    await this.prisma.halaman.update({
      where: { id },
      data: {
        name: halamanData.name,
        label: halamanData.label,
        description: halamanData.description,
        icon: halamanData.icon,
        sort_order: halamanData.sort_order,
      },
    });

    if (modules) {
      await this.prisma.halamanModule.deleteMany({ where: { halaman_id: id } });
      await this.prisma.halamanModule.createMany({
        data: modules.map((m: any, i: number) => ({
          halaman_id: id,
          page_id: m.pageId,
          can_create: m.can_create ?? false,
          can_read: m.can_read ?? true,
          can_update: m.can_update ?? false,
          can_delete: m.can_delete ?? false,
          sort_order: i,
        })),
      });
    }

    const result = await this.prisma.halaman.findUnique({
      where: { id },
      include: {
        modules: {
          include: { page: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    return { success: true, message: 'Halaman updated', data: result };
  }

  async remove(id: number) {
    const existing = await this.prisma.halaman.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Halaman with ID ${id} not found`);

    await this.prisma.halaman.delete({ where: { id } });

    return { success: true, message: 'Halaman deleted' };
  }
}
