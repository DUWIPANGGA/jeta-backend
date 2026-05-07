// ===== src/auth/auth.service.ts =====
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
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
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const defaultRole = await this.prisma.role.findFirst({
      orderBy: {
        level: 'desc',
      },
    });

    if (!defaultRole) {
      throw new ConflictException('No role found in database');
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      password: hashedPassword,
      role_id: defaultRole.id,
    });

    const { password, ...result } = user;
    return result;
  }

  async verifyEmail(token: string) {
    return { message: 'Email verification is disabled' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

  // ✅ TAMBAHKAN METHOD INI
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}