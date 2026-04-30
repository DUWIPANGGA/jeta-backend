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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}


  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      email_verified_at: new Date(), // AUTO VERIFIED
    });

    // SKIP EMAIL VERIFICATION
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    const { password, ...result } = user;
    return result;
  }

  async verifyEmail(token: string) {
    // Optional: bisa dihapus atau dibiarkan saja
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

    // HAPUS pengecekan email_verified_at
    // if (!user.email_verified_at) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  
  // ✅ TAMBAHKAN METHOD INI (opsional, untuk blacklist token)
  async logout(token: string): Promise<void> {
    try {
      // Decode token untuk dapatkan exp (expiration)
      const decoded = this.jwtService.decode(token) as any;
      
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - currentTime;
        
        // Simpan token ke blacklist (contoh pakai Redis atau DB)
        // await this.redisService.setex(`blacklist:${token}`, expiresIn, 'true');
        
        // Atau simpan ke database sementara
        // await this.prisma.invalidatedToken.create({
        //   data: { token, expiresAt: new Date(decoded.exp * 1000) }
        // });
      }
    } catch (error) {
      // Token invalid, tetap lanjutkan logout
      console.error('Error logging out:', error);
    }
  }
}