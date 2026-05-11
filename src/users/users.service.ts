// src/users/users.service.ts
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