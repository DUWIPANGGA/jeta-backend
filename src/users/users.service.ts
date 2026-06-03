import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStaffUserDto } from './dto/update-staff-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    // Mencegah pembuatan admin/staff melalui endpoint umum
    if (createDto.role_id === 2 || createDto.role_id === 3) {
      throw new BadRequestException('Pembuatan Admin atau Staff harus menggunakan endpoint pendaftaran staf khusus (/users/staffs)');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    return this.prisma.user.create({
      data: {
        name: createDto.name,
        email: createDto.email,
        password: hashedPassword,
        phone: createDto.phone,
        address: createDto.address,
        role_id: createDto.role_id,
      },
      include: { role: true },
    });
  }

  async createStaff(createDto: CreateStaffUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    // Validasi bahwa role adalah Admin (2) atau Staff (3)
    if (createDto.role_id !== 2 && createDto.role_id !== 3) {
      throw new BadRequestException('Role ID harus berupa Admin (2) atau Staff (3) untuk endpoint pendaftaran staf khusus');
    }

    // Validasi stage_ids jika disediakan
    const stageIds = createDto.stage_ids ?? [];
    if (stageIds.length) {
      const stages = await this.prisma.stage.findMany({
        where: { id: { in: stageIds } },
      });
      if (stages.length !== stageIds.length) {
        throw new BadRequestException('Beberapa stage_id tidak ditemukan di database');
      }
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: createDto.name,
          email: createDto.email,
          password: hashedPassword,
          phone: createDto.phone,
          address: createDto.address,
          role_id: createDto.role_id,
        },
        include: { role: true },
      });

      const staff = await tx.staff.create({
        data: {
          user_id: user.id,
          tgl_masuk: createDto.tgl_masuk ? new Date(createDto.tgl_masuk) : new Date(),
          salary: createDto.salary ?? 0,
        },
      });

      if (stageIds.length) {
        await tx.staffStage.createMany({
          data: stageIds.map((stageId) => ({
            staff_id: staff.id,
            stage_id: stageId,
          })),
        });
      }

      // Ambil data staff yang sudah lengkap beserta hubungannya
      const completeStaff = await tx.staff.findUnique({
        where: { id: staff.id },
        include: {
          staffStages: { include: { stage: true } },
        },
      });

      return {
        ...user,
        staff: completeStaff
          ? {
              id: completeStaff.id,
              tgl_masuk: completeStaff.tgl_masuk,
              salary: completeStaff.salary,
              stages: completeStaff.staffStages.map((ss) => ss.stage),
            }
          : null,
      };
    });
  }

  async findAll(search?: string) {
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where: whereClause,
      include: { role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // ==================== GET USER PERMISSIONS (UNTUK FRONTEND) ====================
  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accesses = await this.prisma.access.findMany({
      where: { role_id: user.role_id },
      include: { page: true },
      orderBy: { page: { nomor: 'asc' } },
    });

    const permissions = accesses.map(access => ({
      page_id: access.page.id,
      page_name: access.page.name,
      nomor: access.page.nomor,
      can_create: access.create,
      can_read: access.read,
      can_update: access.update,
      can_delete: access.delete,
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      permissions,
    };
  }

  // ==================== ENDPOINT UNTUK STAFF DENGAN DETAIL STAGE ====================
  async getStaffWithDetails() {
    const users = await this.prisma.user.findMany({
      where: { role_id: { in: [2, 3] } },
      include: {
        role: true,
        staffs: {
          include: {
            staffStages: {
              include: { stage: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => {
      const staff = user.staffs.length > 0 ? user.staffs[0] : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        role: user.role,
        staff: staff
          ? {
              id: staff.id,
              user_id: staff.user_id,
              tgl_masuk: staff.tgl_masuk,
              salary: staff.salary,
              stage_ids: staff.staffStages.map((ss) => ss.stage_id),
              stages: staff.staffStages.map((ss) => ss.stage),
            }
          : null,
      };
    });
  }

  // ==================== ENDPOINT UNTUK SATU STAFF DENGAN DETAIL LENGKAP ====================
  async getStaffDetail(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffs: {
          include: {
            staffStages: {
              include: { stage: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User dengan ID ${id} tidak ditemukan`);
    }

    if (user.role_id !== 2 && user.role_id !== 3) {
      throw new BadRequestException(`User dengan ID ${id} bukan berstatus Staff atau Admin`);
    }

    const staff = user.staffs.length > 0 ? user.staffs[0] : null;

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role_id: user.role_id,
        role: user.role,
        staff: staff
          ? {
              id: staff.id,
              user_id: staff.user_id,
              tgl_masuk: staff.tgl_masuk,
              salary: staff.salary,
              stage_ids: staff.staffStages.map((ss) => ss.stage_id),
              stages: staff.staffStages.map((ss) => ss.stage),
            }
          : null,
      },
    };
  }

  // ==================== SIMPLE STAFF LIST (TANPA DETAIL) ====================
  async getStaffUsers() {
    return this.prisma.user.findMany({
      where: { role_id: { in: [2, 3] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // ==================== CUSTOMER DETAIL WITH ORDER HISTORY ====================
  async getCustomerDetail(customerId: number) {
    // 1. Ambil data user
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // 2. Ambil product orders (completed only)
    const productOrders = await this.prisma.order.findMany({
      where: {
        user_id: customerId,
        status: 'completed',
      },
      include: {
        order_items: {
          include: {
            product: {
              select: { name: true, price: true, image: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedProductOrders = productOrders.map(order => ({
      order_id: order.id,
      order_number: order.order_number,
      total_amount: order.grand_total,
      status: order.status,
      created_at: order.created_at,
      items: order.order_items.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price ?? item.product.price,
      })),
    }));

    // 3. Ambil custom orders (accepted)
    const customOrders = await this.prisma.customOrder.findMany({
      where: {
        user_id: customerId,
        accept_status: true,
      },
      include: {
        items: {
          include: {
            selected_options: {
              include: {
                variant_option: {
                  include: {
                    custom_variant: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedCustomOrders = customOrders.map(order => {
      const itemsDesc = order.items
        .flatMap(item =>
          item.selected_options?.map(opt =>
            `${opt.variant_option?.custom_variant?.name || ''} ${opt.variant_option?.name || ''}`.trim()
          ) || []
        )
        .filter(Boolean)
        .join(', ');

      return {
        id: order.id,
        name: order.name,
        total_amount: order.total_amount,
        dp_amount: order.dp_amount,
        remaining_amount: order.remaining_amount,
        deadline: order.deadline,
        accept_status: order.accept_status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        deskripsi_produk: itemsDesc || 'Produk Custom',
        total_quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        member_since: user.created_at,
      },
      orders: {
        product_orders: formattedProductOrders,
        custom_orders: formattedCustomOrders,
      },
      summary: {
        total_product_orders: formattedProductOrders.length,
        total_custom_orders: formattedCustomOrders.length,
        total_spent_product: formattedProductOrders.reduce((sum, order) => sum + order.total_amount, 0),
        total_spent_custom: formattedCustomOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      },
    };
  }

  async update(id: number, updateDto: UpdateUserDto) {
    const user = await this.findOne(id);
    
    if (updateDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: updateDto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already taken');
    }

    // Mencegah pemberian role admin/staff lewat endpoint umum
    if (updateDto.role_id === 2 || updateDto.role_id === 3) {
      throw new BadRequestException('Pengubahan peran ke Admin atau Staff harus melalui endpoint pembaruan staf khusus (/users/staffs/:id)');
    }

    // Mencegah penurunan role staf dari endpoint umum (staf/admin -> non-staf)
    if (updateDto.role_id !== undefined && (user.role_id === 2 || user.role_id === 3) && updateDto.role_id !== user.role_id) {
      throw new BadRequestException('Penurunan peran dari Admin/Staff ke peran lain harus dilakukan melalui endpoint pembaruan staf khusus (/users/staffs/:id) karena membutuhkan penghapusan profil staf.');
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateDto,
      include: { role: true },
    });
  }

  async updateStaff(id: number, updateDto: UpdateStaffUserDto) {
    const user = await this.findOne(id);

    if (updateDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: updateDto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already taken');
    }

    // Validasi stage_ids jika disediakan
    const stageIds = updateDto.stage_ids ?? [];
    if (stageIds.length) {
      const stages = await this.prisma.stage.findMany({
        where: { id: { in: stageIds } },
      });
      if (stages.length !== stageIds.length) {
        throw new BadRequestException('Beberapa stage_id tidak ditemukan di database');
      }
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    const { salary, tgl_masuk, stage_ids, ...userUpdateData } = updateDto;

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: userUpdateData,
        include: { role: true },
      });

      const isStaffOrAdmin = updatedUser.role_id === 2 || updatedUser.role_id === 3;
      
      const existingStaff = await tx.staff.findUnique({
        where: { user_id: id },
        include: {
          _count: {
            select: {
              progressReports: true,
              salaryPayments: true,
            },
          },
        },
      });

      if (isStaffOrAdmin) {
        if (!existingStaff) {
          // Buat record staff baru jika belum ada (misal dipromosikan dari customer ke staf)
          const staff = await tx.staff.create({
            data: {
              user_id: id,
              tgl_masuk: tgl_masuk ? new Date(tgl_masuk) : new Date(),
              salary: salary ?? 0,
            },
          });

          if (stageIds.length) {
            await tx.staffStage.createMany({
              data: stageIds.map((stageId) => ({
                staff_id: staff.id,
                stage_id: stageId,
              })),
            });
          }
        } else {
          // Update record staff yang sudah ada
          const staffUpdateData: any = {};
          if (tgl_masuk !== undefined) staffUpdateData.tgl_masuk = new Date(tgl_masuk);
          if (salary !== undefined) staffUpdateData.salary = salary;

          if (Object.keys(staffUpdateData).length) {
            await tx.staff.update({
              where: { id: existingStaff.id },
              data: staffUpdateData,
            });
          }

          if (stage_ids !== undefined) {
            await tx.staffStage.deleteMany({ where: { staff_id: existingStaff.id } });
            if (stageIds.length) {
              await tx.staffStage.createMany({
                data: stageIds.map((stageId) => ({
                  staff_id: existingStaff.id,
                  stage_id: stageId,
                })),
              });
            }
          }
        }
      } else {
        // Jika didowngrade ke peran non-staff/non-admin
        if (existingStaff) {
          const hasHistory = existingStaff._count.progressReports > 0 || existingStaff._count.salaryPayments > 0;
          if (hasHistory) {
            throw new BadRequestException(
              'Gagal mengubah role. User ini memiliki riwayat pekerjaan atau transaksi penggajian aktif di sistem staff.'
            );
          }
          await tx.staff.delete({ where: { user_id: id } });
        }
      }

      // Ambil data lengkap staff terbaru untuk dikembalikan
      const completeStaff = await tx.staff.findUnique({
        where: { user_id: id },
        include: {
          staffStages: { include: { stage: true } },
        },
      });

      return {
        ...updatedUser,
        staff: completeStaff
          ? {
              id: completeStaff.id,
              tgl_masuk: completeStaff.tgl_masuk,
              salary: completeStaff.salary,
              stages: completeStaff.staffStages.map((ss) => ss.stage),
            }
          : null,
      };
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User ${id} deleted successfully` };
  }
}