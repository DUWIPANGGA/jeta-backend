// ===== src/auth/auth.service.ts =====
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) { }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException('Password dan konfirmasi password tidak cocok');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'customer' },
    });

    if (!defaultRole) {
      throw new ConflictException('No role found in database');
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      password: dto.password,
      role_id: defaultRole.id,
    });

    const role = await this.prisma.role.findUnique({
      where: { id: user.role_id },
    });

    const payload = { sub: user.id, email: user.email, role_id: user.role_id };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
      },
    };
  }

  async verifyEmail(token: string) {
    return { message: 'Email verification is disabled' };
  }

  async loginCustomer(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.role_id },
    });

    if (!role || (role.name !== 'user' && role.name !== 'customer')) {
      throw new UnauthorizedException('Akses ditolak. Akun staf harus login melalui portal khusus.');
    }

    const payload = { sub: user.id, email: user.email, role_id: user.role_id };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: role,
      },
    };
  }

  async loginStaff(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Kredensial salah');
    }

    // Hanya izinkan peran internal (1: superadmin, 2: admin, 3: staff, 5: finance)
    const allowedStaffRoles = [1, 2, 3, 5];
    if (!allowedStaffRoles.includes(user.role_id)) {
      throw new UnauthorizedException('Akses ditolak. Endpoint ini hanya untuk Staf/Admin.');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.role_id },
    });

    const payload = { sub: user.id, email: user.email, role_id: user.role_id };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: role,
      },
    };
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.exp) {
        // Optional: blacklist token
        // await this.prisma.invalidatedToken.create({
        //   data: { token, expiresAt: new Date(decoded.exp * 1000) }
        // });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Email tidak ditemukan');
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.upsert({
      where: { email: dto.email },
      update: { token, created_at: new Date() },
      create: { email: dto.email, token, created_at: new Date() },
    });

    await this.emailService.sendPasswordResetEmail(dto.email, token);

    return { message: 'Link reset password telah dikirim ke email Anda' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException('Password dan konfirmasi password tidak cocok');
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken) {
      throw new BadRequestException('Token reset password tidak valid');
    }

    const oneHour = 60 * 60 * 1000;
    const createdAt = resetToken.created_at?.getTime() ?? 0;
    if (Date.now() - createdAt > oneHour) {
      await this.prisma.passwordResetToken.delete({
        where: { token: dto.token },
      });
      throw new BadRequestException('Token reset password sudah kedaluwarsa');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({
      where: { token: dto.token },
    });

    return { message: 'Password berhasil direset' };
  }

  // ✅ GET PROFILE WITH PERMISSIONS
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accesses = await this.prisma.access.findMany({
      where: { role_id: user.role_id },
      include: { page: true },
      orderBy: { page: { nomor: 'asc' } },
    });

    const permissions = accesses.map((access) => ({
      page_id: access.page.id,
      page_name: access.page.name,
      nomor: access.page.nomor,
      can_create: access.create,
      can_read: access.read,
      can_update: access.update,
      can_delete: access.delete,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      image: user.image,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role: {
        id: user.role.id,
        name: user.role.name,
        level: user.role.level,
        description: user.role.description,
        explicit_page_ids: user.role.explicit_page_ids,
      },
      permissions,
    };
  }
}