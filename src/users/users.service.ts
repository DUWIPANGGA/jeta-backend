import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

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

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { id: 'asc' },
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
      where: { role_id: 3 },
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

  // ==================== SIMPLE STAFF LIST (TANPA DETAIL) ====================
  async getStaffUsers() {
    return this.prisma.user.findMany({
      where: { role_id: 3 },
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
    await this.findOne(id);
    if (updateDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: updateDto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already taken');
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

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User ${id} deleted successfully` };
  }
}