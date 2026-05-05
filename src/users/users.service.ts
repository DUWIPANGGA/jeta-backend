import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    // Validasi role exists
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.role_id },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${createUserDto.role_id} not found`);
    }

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        address: createUserDto.address,
        phone: createUserDto.phone,
        role_id: createUserDto.role_id,
      },
      include: {
        role: true,
      },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      total: users.length,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findByVerificationToken(token: string) {
    return this.prisma.user.findUnique({
      where: { verification_token: token },
      include: { role: true },
    });
  }

  async markEmailAsVerified(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        email_verified_at: new Date(),
        verification_token: null,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const targetUser = await this.findOne(id);

    // Cek role yang login (dikirim dari controller via JWT)
    // Untuk sementara, kita asumsikan requester dikirim dari controller
    // Anda bisa modify method update ini sesuai kebutuhan

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: { role: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return {
      success: true,
      message: `User with ID ${id} deleted successfully`,
    };
  }
}