// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role_id?: number;
    [key: string]: any;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.loginCustomer(loginDto);

    // HttpOnly cookie khusus Customer
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Login success',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/staff')
  async loginStaff(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.loginStaff(loginDto);

    // HttpOnly cookie khusus Staf/Admin/Finance/Superadmin
    res.cookie('staff_token', result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Login success (Staff Portal)',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    // Hapus sesi token pelanggan jika ada
    const token = req.cookies?.token;
    if (token) {
      await this.authService.logout(token);
    }
    
    // Hapus sesi token staf jika ada
    const staffToken = req.cookies?.staff_token;
    if (staffToken) {
      await this.authService.logout(staffToken);
    }

    // Bersihkan cookie token pelanggan
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    // Bersihkan cookie token staf
    res.clearCookie('staff_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logout success' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const profile = await this.authService.getProfile(userId);
    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }
}